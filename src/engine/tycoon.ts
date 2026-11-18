import type { ActionResult, GameState } from './types';
import { createTycoon, tycoonOf, hash, farmScore, franchiseReady, masterEra, propertyDiscount, esgScore, trendAt, vibeScore, weatherAt, type TycoonState, type FarmSetup } from './tycoonState';
import { ENTERPRISE, RETAIL, FARM_METHODS } from '@/data/tycoonContent';
import { MASTER, buildingById } from '@/data/master';
import { processEmpireWeek, acquireRivalWithStores, isExec } from './empire';
import { catalogAction } from './world';
import { calculateCompanyValuation, signB2BContract } from './engine';
import { createExpansion, type ExpansionState } from './expansion';
export { tycoonOf, weatherAt, trendAt, masterEra, franchiseReady, farmScore, esgScore, vibeScore } from './tycoonState';
const money = (v: number) => Math.round(v * 100) / 100;
const no = (state: GameState, reason: string): ActionResult => ({ state, reason, ok: false });
const ok = (state: GameState, reason: string): ActionResult => ({ state, reason, ok: true });
function changed(g: GameState, t: TycoonState, reason: string, cost = 0): ActionResult {
  if (!Number.isFinite(cost) || g.cash < cost) return no(g, 'Nicht genug freie Liquidität.');
  if (g.pendingEvent) return no(g, 'Zuerst das Wochenereignis entscheiden.');
  const state = { ...g, cash: money(g.cash - cost), tycoon: t };
  return ok({ ...state, companyValuation: calculateCompanyValuation(state) }, reason);
}
export function configureRoastery(g: GameState, safety: number, autoRestock: boolean): ActionResult {
  if (!Number.isFinite(safety) || safety < 0 || safety > 1000000) return no(g, 'Sicherheitsbestand zwischen 0 und 1.000.000 kg wählen.');
  return ok({ ...g, roastery: { ...g.roastery, safetyStockKg: safety, autoRestock } }, 'Sicherheitsbestand und automatischer Einkauf gespeichert.');
}
export function configureFarm(g: GameState, id: string, setup: FarmSetup): ActionResult {
  if (!g.world.assets.some(a => a.kind === 'plantation' && a.id === id)) return no(g, 'Diese Finca gehört dir noch nicht.');
  const t = tycoonOf(g);
  if (!FARM_METHODS.some(m => m.id === setup.method) || !['washed', 'natural', 'anaerobic'].includes(setup.process)) return no(g, 'Ungültige Anbaumethode oder Aufbereitung.');
  return changed(g, { ...t, farms: { ...t.farms, [id]: { ...setup, leased: t.farms[id]?.leased ?? false } } }, 'Finca: Anbau, Aufbereitung und Fracht eingestellt.');
}
export function leaseFarm(g: GameState, id: string): ActionResult {
  const p = MASTER.plantations.find(p => p.id === id), t = tycoonOf(g);
  if (!p || g.world.assets.some(a => a.kind === 'plantation' && a.id === id)) return no(g, 'Finca nicht verfügbar.');
  const cost = p.purchasePrice * .08 / 52;
  const r = changed(g, { ...t, farms: { ...t.farms, [id]: { method: 'shade', process: 'washed', freight: 'sea', leased: true } } }, 'Finca gepachtet · jährliche Pacht 8 % des Kaufwerts.', cost);
  return r.ok ? { ...r, state: { ...r.state, world: { ...r.state.world, assets: [...r.state.world.assets, { kind: 'plantation', id, cityId: g.city.id, startWeek: g.week, endWeek: 100000, bookValue: 0, remainingKg: 0 }] } } } : r;
}
export function saveBlend(g: GameState, name: string, beanA: string, beanB: string, percentA: number, profile: TycoonState['roastProfile']): ActionResult {
  if (!name.trim() || !g.market.beanVarieties.some(b => b.id === beanA) || !g.market.beanVarieties.some(b => b.id === beanB) || !Number.isFinite(percentA) || percentA < 0 || percentA > 100) return no(g, 'Gültige Bohnen und Mischungsverhältnis wählen.');
  const t = tycoonOf(g);
  return changed(g, { ...t, roastProfile: profile, blend: { name: name.trim().slice(0, 40), beanA, beanB, percentA } }, 'Signature Blend für alle Vertriebskanäle übernommen.');
}
export function auctionFor(g: GameState): NonNullable<TycoonState['auction']> {
  const saved = tycoonOf(g).auction;
  if (saved?.week === g.week) return saved;
  const beans = g.market.beanVarieties.filter(b => /geisha|jamaica|yemen/i.test(b.id));
  const bean = beans[g.week % Math.max(1, beans.length)] ?? g.market.beanVarieties[0];
  return { week: g.week, beanId: bean?.id ?? '', score: 92 + g.week % 5, kg: 100, bid: 4000 + g.week % 4 * 500, bidder: null, settled: false };
}
export function bidAuction(g: GameState): ActionResult {
  if (!g.roastery.owned) return no(g, 'Micro-Lots brauchen eine eigene Rösterei.');
  const t = tycoonOf(g), a = auctionFor(g);
  if (a.settled || a.bidder === 'player') return no(g, 'Gebot liegt bereits vorne.');
  const bid = a.bid + 500;
  if (g.cash < bid * 2) return no(g, 'Für das Gebot muss die doppelte Summe als Liquidität bereitstehen.');
  return changed(g, { ...t, auction: { ...a, bid, bidder: 'player' } }, 'Gebot abgegeben – Zuschlag beim Wochenabschluss.');
}
export function adoptTrend(g: GameState): ActionResult {
  const t = tycoonOf(g), trend = trendAt(g.week);
  if (g.week > trend.until || t.trends[trend.id]) return no(g, 'Trend vorbei oder bereits auf der Saisonkarte.');
  return changed(g, { ...t, trends: { ...t.trends, [trend.id]: { adoptedWeek: g.week, price: 7.5 } } }, `${trend.name} für 7,50 € auf der Saisonkarte.`, 600);
}
export function dispatchPopUp(g: GameState, hotspot: string, weeks: number): ActionResult {
  const t = tycoonOf(g);
  if (![2, 3, 4].includes(weeks) || !['Festival', 'Tech-Konferenz', 'Marathon'].includes(hotspot)) return no(g, 'Standzeit: zwei bis vier Wochen.');
  if (t.popups.some(p => p.cityId === g.city.id && p.hotspot === hotspot && p.until >= g.week)) return no(g, 'Dieser Hotspot ist bereits belegt.');
  return changed(g, { ...t, popups: [...t.popups, { id: `popup-${g.week}-${t.popups.length}`, cityId: g.city.id, hotspot, until: g.week + weeks, revenue: 0 }] }, 'Coffee-Van disponiert.', 3000 + weeks * 1000);
}
export function grantFranchise(g: GameState, districtId: string): ActionResult {
  const t = tycoonOf(g), b = buildingById(districtId), city = MASTER.cities.find(c => c.buildings.some(x => x.id === districtId));
  if (!franchiseReady(g)) return no(g, 'Franchise ab Ära 3 oder 15 umsatzstarken eigenen Cafés.');
  if (!g.roastery.owned || !b || !city || g.world.occupants[districtId] || g.stores.some(s => s.districtId === districtId) || t.franchises.some(f => f.districtId === districtId)) return no(g, 'Freier Standort und eigene Rösterei erforderlich.');
  return changed(g, { ...t, franchises: [...t.franchises, { id: `fr-${districtId}`, districtId, cityId: city.cityId, quality: 85, royalty: .06, revenue: 0, supplied: 0, violations: 0 }] }, 'Franchise-Lizenz erteilt · 50.000 € Gebühr und 6 % laufende Royalty.', -50000);
}
export function franchiseAudit(g: GameState, id: string, revoke = false): ActionResult {
  const t = tycoonOf(g), f = t.franchises.find(f => f.id === id);
  if (!f) return no(g, 'Franchise nicht gefunden.');
  return changed(g, { ...t, franchises: revoke ? t.franchises.filter(x => x.id !== id) : t.franchises.map(x => x.id === id ? { ...x, quality: 95, violations: 0 } : x) }, revoke ? 'Lizenz entzogen.' : 'Audit und Nachschulung abgeschlossen.', revoke ? 0 : 1500);
}
export function signEnterprise(g: GameState, id: string): ActionResult {
  const c = ENTERPRISE.find(c => c.id === id);
  if (!c || g.b2b.contracts.some(x => x.partnerName === c.name && x.weeksRemaining > 0)) return no(g, 'Anfrage nicht verfügbar.');
  if (tycoonOf(g).roastScore < c.score) return no(g, `Cupping-Score ${c.score} erforderlich.`);
  const r = signB2BContract(g, c.name, c.kg, c.weeks, c.price);
  return r.ok ? { ...r, state: { ...r.state, b2b: { ...r.state.b2b, contracts: r.state.b2b.contracts.map(x => x.partnerName === c.name ? { ...x, minimumScore: c.score, penaltyRate: .2, fulfillment: 1, breaches: 0 } : x) } } } : r;
}
export function captureRivalContract(g: GameState, rivalId: string): ActionResult {
  if (!tycoonOf(g).intel.includes(`${rivalId}:contract`)) return no(g, 'Zuerst die B2B-Konditionen aufdecken.');
  const company = g.capitalMarkets.rivals.find(r => r.id === rivalId);
  if (!company || g.b2b.contracts.some(c => c.partnerName === `${company.name} Wechselkunden` && c.weeksRemaining > 0)) return no(g, 'Keine neue Wechselkunden-Anfrage.');
  return signB2BContract(g, `${company.name} Wechselkunden`, 500, 52, 17.95);
}
export function listRetail(g: GameState, id: string, chain: string): ActionResult {
  const p = RETAIL.find(p => p.id === id), t = tycoonOf(g);
  if (!p || !['Edeka', 'Rewe', 'Whole Foods', 'Carrefour'].includes(chain)) return no(g, 'Produkt oder Handelspartner nicht verfügbar.');
  if (masterEra(g) < 3 || !g.roastery.owned) return no(g, 'Supermarktvertrieb ab Ära 3 mit eigener Rösterei.');
  if (t.retail.some(r => r.id === id && r.chain === chain)) return no(g, 'Bereits gelistet.');
  return changed(g, { ...t, retail: [...t.retail, { id, chain, shelf: 1, promotionUntil: 0, units: 0, income: 0, lost: 0 }] }, `${p.name} bei ${chain} gelistet.`, p.fee);
}
export function retailAction(g: GameState, id: string, chain: string, promotion: boolean): ActionResult {
  const t = tycoonOf(g), line = t.retail.find(r => r.id === id && r.chain === chain);
  if (!line || (!promotion && line.shelf >= 3)) return no(g, 'Regalplatz bereits maximiert oder Produkt fehlt.');
  return changed(g, { ...t, retail: t.retail.map(r => r === line ? { ...r, shelf: promotion ? r.shelf : r.shelf + 1, promotionUntil: promotion ? g.week + 4 : r.promotionUntil } : r) }, promotion ? 'Vier Wochen 20 % Regalrabatt.' : 'Besserer Regalplatz ausgehandelt.', promotion ? 8000 : 20000);
}
export function buyRivalBuilding(g: GameState, id: string): ActionResult {
  const t = tycoonOf(g), b = buildingById(id), rivalId = g.world.occupants[id];
  if (!b || !rivalId || t.landlords.some(l => l.districtId === id)) return no(g, 'Rivalen-Immobilie nicht verfügbar.');
  const value = money(b.purchasePrice * propertyDiscount(g));
  return changed(g, { ...t, landlords: [...t.landlords, { districtId: id, rivalId, value, multiplier: 1, endWeek: g.week + 26, evict: false }] }, 'Gebäude erworben; der Rivale zahlt jetzt Miete.', value);
}
export function landlordAction(g: GameState, id: string, evict: boolean): ActionResult {
  const t = tycoonOf(g);
  if (!t.landlords.some(l => l.districtId === id)) return no(g, 'Diese Immobilie gehört dir nicht.');
  return changed(g, { ...t, landlords: t.landlords.map(l => l.districtId === id ? { ...l, multiplier: evict ? l.multiplier : 2, evict } : l) }, evict ? 'Kündigung zum Mietvertragsende vorgemerkt.' : 'Rivalenmiete verdoppelt.');
}
export function launchSpy(g: GameState, rivalId: string, objective: 'recipe' | 'contract' | 'finance'): ActionResult {
  const t = tycoonOf(g);
  if (!MASTER.competitors.some(r => r.id === rivalId) || t.spies.some(s => s.rivalId === rivalId)) return no(g, 'Operation nicht verfügbar.');
  return changed(g, { ...t, spies: [...t.spies, { rivalId, objective, finishWeek: g.week + 4 }] }, 'Detektiv-Operation gestartet.', 75000);
}
export function respondRival(g: GameState, index: number): ActionResult {
  const t = tycoonOf(g), move = t.rivals[index];
  if (!move || move.resolved) return no(g, 'Keine offene Rivalenaktion.');
  return changed(g, { ...t, security: move.kind === 'headhunt' ? true : t.security, rivals: t.rivals.map((r, i) => i === index ? { ...r, resolved: true } : r) }, 'Rivalenaktion abgewehrt.', move.kind === 'price' ? 5000 : 10000);
}
export function secureCompany(g: GameState): ActionResult {
  const t = tycoonOf(g); if (t.security) return no(g, 'IP- und Personal-Schutz ist schon aktiv.');
  return changed(g, { ...t, security: true }, 'Rezepturtresor und Personalbindung aktiv.', 20000);
}
export function setDividend(g: GameState, rate: number): ActionResult {
  if (!g.capitalMarkets.isPublic || ![0, .1, .25].includes(rate)) return no(g, 'Dividendenpolitik nur für börsennotierte Unternehmen.');
  return changed(g, { ...tycoonOf(g), dividendRate: rate }, 'Dividendenpolitik geändert.');
}

/** Pre-simulation supply phase. Existing farm harvest is routed here, not paid a second time. */
export function prepareSupply(state: GameState): GameState {
  const t = structuredClone(tycoonOf(state)), roastery = { ...state.roastery, beanLots: state.roastery.beanLots.map(l => ({ ...l })) };
  for (const a of state.world.assets.filter(a => a.kind === 'plantation')) {
    const p = MASTER.plantations.find(p => p.id === a.id); if (!p) continue;
    if ((state.week + 1 - a.startWeek) % p.harvestIntervalWeeks !== 0) continue;
    const setup = t.farms[a.id] ?? { method: 'shade', process: 'washed', freight: 'sea' };
    const kg = Math.round(p.annualYieldKg * p.harvestIntervalWeeks / 52 * (FARM_METHODS.find(m => m.id === setup.method)?.yield ?? 1));
    const bean = state.market.beanVarieties.find(b => b.originCountry === p.country) ?? state.market.beanVarieties[0];
    t.cargo.push({ id: `crop-${a.id}-${state.week + 1}`, kg, origin: p.country, score: farmScore(state, a.id), arrival: state.week + 1 + (setup.freight === 'air' ? 1 : 2), mode: setup.freight, beanId: bean?.id ?? '', cost: money(kg * (setup.freight === 'air' ? 1.8 : .25)) });
  }
  t.news = [];
  t.cargo = t.cargo.map(c => {
    if (c.arrival !== state.week + 1) return c;
    if (c.mode === 'sea' && hash(`${c.id}-${c.arrival}-port`) % 13 === 0) { t.news.push(`Hafenkrise: ${c.origin} verspätet sich um eine Woche.`); return { ...c, arrival: c.arrival + 1 }; }
    return { ...c, cost: money(c.cost + c.kg * .15) };
  });
  const arriving = t.cargo.filter(c => c.arrival <= state.week + 1);
  let total = roastery.rawBeanStockKg, score = t.inventoryScore;
  for (const c of arriving) {
    score = (score * total + c.score * c.kg) / (total + c.kg || 1); total += c.kg;
    const lot = roastery.beanLots.find(l => l.beanId === c.beanId);
    if (lot) lot.quantityKg += c.kg; else roastery.beanLots.push({ beanId: c.beanId, quantityKg: c.kg, averagePricePerKg: c.cost / c.kg });
  }
  roastery.rawBeanStockKg = money(total); t.inventoryScore = money(score);
  t.news.push(...arriving.map(c => `${c.mode === 'air' ? 'Luftfracht' : 'Seefracht'}: ${c.kg} kg aus ${c.origin} im Rohkaffee-Lager.`));
  // Spot lots and the saved signature blend share the same inventory.
  const blend = t.blend;
  const a = state.market.beanVarieties.find(b => b.id === blend.beanA), b = state.market.beanVarieties.find(b => b.id === blend.beanB);
  const blendReady = a && b && roastery.beanLots.some(l => l.beanId === a.id && l.quantityKg > 0) && roastery.beanLots.some(l => l.beanId === b.id && l.quantityKg > 0);
  const quality = blendReady ? a.qualityScore * blend.percentA / 100 + b.qualityScore * (1 - blend.percentA / 100) : score;
  t.roastScore = money(Math.min(100, Math.max(80, quality)));
  return { ...state, tycoon: t, roastery };
}

/** All master systems settle into the same report and cash journal after the existing engine. */
export function processTycoonWeek(state: GameState, exp: ExpansionState) {
  if (state.pendingEvent) return { game: state, exp };
  const prepared = prepareSupply(state);
  return tycoonStage(state, prepared, processEmpireWeek(prepared, exp), exp);
}
/** Stage 4: franchise, retail, pop-ups, cargo and city systems settle into the same accounting row. */
export function tycoonStage(state: GameState, prepared: GameState, r: { game: GameState; exp: ExpansionState }, exp: ExpansionState) {
  if (r.game.week === state.week) return { game: state, exp };
  let g: GameState = { ...r.game, world: { ...r.game.world, occupants: { ...r.game.world.occupants } }, tycoon: tycoonOf(prepared) }, t = structuredClone(tycoonOf(g));
  let revenue = 0, cost = 0, financing = 0;
  const notes = [...t.news];
  const missed = g.b2b.contracts.filter(c => c.penaltyRate && (c.fulfillment ?? 1) < 1).length;
  if (missed) g.brandReputation = Math.max(0, g.brandReputation - missed * 2);
  const channels = { ...createTycoon().channels, b2b: g.lastReport?.revenueB2B ?? 0 };
  const shipmentCost = t.cargo.filter(c => c.arrival <= g.week).reduce((n, c) => n + c.cost, 0);
  cost += shipmentCost; t.cargo = t.cargo.filter(c => c.arrival > g.week);
  // A player bid faces a deterministic rival counterbid before settlement.
  const auction = t.auction;
  if (auction && auction.week < g.week && !auction.settled && auction.bidder === 'player') {
    if (hash(`auction-${auction.week}`) % 4 === 0) { notes.push('Micro-Lot: Rivale überbot dein Höchstgebot.'); t.auction = { ...auction, bidder: MASTER.competitors[auction.week % 4]?.name ?? 'Rivale', bid: auction.bid + 500, settled: true }; }
    else if (g.cash >= auction.bid) {
      cost += auction.bid;
      t.cargo.push({ id: `auction-${auction.week}`, origin: g.market.beanVarieties.find(b => b.id === auction.beanId)?.originCountry ?? 'Panama', kg: auction.kg, score: auction.score, beanId: auction.beanId, mode: 'air', arrival: g.week + 1, cost: auction.kg * 1.8 });
      t.auction = { ...auction, settled: true }; notes.push(`Micro-Lot gewonnen: ${auction.kg} kg, Score ${auction.score}, Lieferung nächste Woche.`);
    } else { t.auction = { ...auction, settled: true }; notes.push('Micro-Lot: Zuschlag wegen fehlender Liquidität verfallen.'); }
  }
  let stock = g.roastery.roastedStockKg;
  t.franchises = t.franchises.map(f => {
    const b = buildingById(f.districtId), demand = Math.round((b?.footTraffic ?? 8000) * .08), need = demand * .018;
    const kg = Math.min(stock, need); stock -= kg;
    const fulfilled = need > 0 ? kg / need : 1, sales = money(demand * fulfilled * 4.5), income = money(sales * f.royalty + kg * 8);
    revenue += income; channels.franchise += income;
    const quality = Math.max(30, Math.min(100, f.quality + (isExec(g, 'coo') ? .5 : -.5) - (fulfilled < 1 ? 3 : 0)));
    if (quality < 65) g.brandReputation = Math.max(0, g.brandReputation - .3);
    return { ...f, supplied: money(kg), revenue: sales, quality, violations: f.violations + (fulfilled < 1 ? 1 : 0) };
  });
  t.retail = t.retail.map(line => {
    const p = RETAIL.find(p => p.id === line.id); if (!p) return line;
    const promotion = line.promotionUntil >= g.week, rivalry = hash(`${line.chain}-${g.week}`) % 6 === 0;
    const requested = Math.round(p.volume * (1 + (line.shelf - 1) * .25) * (promotion ? 1.5 : 1) * (rivalry && !promotion ? .75 : 1));
    const units = Math.min(requested, Math.floor(stock / p.kg)); stock -= units * p.kg;
    const sales = money(units * p.price * (promotion ? .8 : 1)), packaging = money(units * (p.id === 'beans' ? 1.2 : .6));
    revenue += sales; cost += packaging; channels.retail += sales;
    if (rivalry) notes.push(`${line.chain}: Konkurrenz-Rabattaktion im Kaffeeregal.`);
    return { ...line, units, income: sales - packaging, lost: requested - units };
  });
  g.roastery = { ...g.roastery, roastedStockKg: money(Math.max(0, stock)) };
  t.popups = t.popups.filter(p => p.until >= g.week).map(p => {
    const income = 2200 + hash(`${p.id}-${g.week}`) % 1200; revenue += income; cost += 650; channels.popups += income;
    g.brandReputation = Math.min(100, g.brandReputation + .2); return { ...p, revenue: income };
  });
  for (const l of t.landlords) {
    if (l.evict && l.endWeek <= g.week) { delete g.world.occupants[l.districtId]; notes.push('Rivalenmietvertrag ausgelaufen: Standort freigegeben.'); }
    else if (g.world.occupants[l.districtId] === l.rivalId) { const rent = money((buildingById(l.districtId)?.weeklyRent ?? 0) * l.multiplier); revenue += rent; channels.rent += rent; }
  }
  for (const a of g.world.assets.filter(a => a.kind === 'plantation')) {
    if (t.farms[a.id]?.leased && g.week > a.startWeek + 1) cost += money((MASTER.plantations.find(p => p.id === a.id)?.purchasePrice ?? 0) * .08 / 52);
  }
  const newlyOpened = state.stores.filter(s => s.openedAtWeek >= state.week - 1);
  if ((newlyOpened.length > 0 || g.week % 10 === 0) && g.week % 3 === 0) {
    const cityId = newlyOpened[0]?.cityId ?? g.city.id, rival = MASTER.competitors[g.week % 4];
    if (rival && !g.capitalMarkets.rivals.find(r => r.id === rival.id)?.acquired) {
      const kinds = ['price', 'pr', 'headhunt'] as const, kind = kinds[Math.floor(g.week / 3) % 3] ?? 'price';
      if (!t.rivals.some(r => r.cityId === cityId && r.kind === kind && r.until >= g.week)) t.rivals.push({ rivalId: rival.id, cityId, kind, until: g.week + 4, resolved: false });
      const free = MASTER.cities.find(c => c.cityId === cityId)?.buildings.find(b => !g.world.occupants[b.id] && !g.stores.some(s => s.districtId === b.id) && !t.franchises.some(f => f.districtId === b.id));
      if (free) g.world.occupants[free.id] = rival.id;
      notes.push(`${rival.name}: ${kind === 'price' ? 'Preiskrieg mit 1,99 € Kaffee' : kind === 'pr' ? 'negative PR-Kampagne' : 'wirbt Spitzenpersonal ab'}.`);
    }
  }
  t.rivals = t.rivals.filter(r => r.until >= g.week);
  for (const move of t.rivals.filter(r => !r.resolved)) {
    if (move.kind === 'pr') g.brandReputation = Math.max(0, g.brandReputation - .8);
    if (move.kind === 'headhunt' && !t.security && move.until === g.week) {
      const s = g.stores.filter(s => s.cityId === move.cityId).sort((a, b) => (b.employees[0]?.skill ?? 0) - (a.employees[0]?.skill ?? 0))[0];
      if (s && s.employees.length > 1) g.stores = g.stores.map(x => x.id === s.id ? { ...x, employees: x.employees.slice(1) } : x);
    }
  }
  for (const spy of t.spies.filter(s => s.finishWeek <= g.week)) {
    if (hash(`${spy.rivalId}-${spy.finishWeek}`) % 100 < 12) { cost += 30000; g.brandReputation = Math.max(0, g.brandReputation - 5); notes.push('Detektiv enttarnt: 30.000 € Schadenersatz.'); }
    else { t.intel = [...new Set([...t.intel, `${spy.rivalId}:${spy.objective}`])]; if (spy.objective === 'recipe') t.inventoryScore = Math.min(100, t.inventoryScore + 2); notes.push(`Operation abgeschlossen: ${spy.objective === 'recipe' ? 'Röstprofil verbessert' : spy.objective === 'contract' ? 'B2B-Konditionen aufgedeckt' : 'Übernahmechance aufgedeckt'}.`); }
  }
  t.spies = t.spies.filter(s => s.finishWeek > g.week);
  const trend = trendAt(g.week), adopted = t.trends[trend.id];
  if (adopted && g.week <= trend.until) {
    const cups = Math.round(g.stores.reduce((n, s) => n + s.customersServedLastWeek, 0) * .06);
    revenue += cups * adopted.price; cost += cups * 1.4;
  }
  for (const store of g.stores) if (weatherAt(g.week, store.cityId).rain) {
    if (g.cafe?.stores[store.id]?.menu.some(id => ['croissant', 'muffin', 'cookie', 'bagel', 'sandwich'].includes(id))) { const extras = money(store.weeklyRevenue * .08); revenue += extras; cost += extras * .3; }
  }
  t.trends = Object.fromEntries(Object.entries(t.trends).filter(([, v]) => v.adoptedWeek > g.week - 16));
  t.reviews = [...g.stores.slice().sort((a, b) => a.qualityIndex - b.qualityIndex).slice(0, 12).map(s => {
    const short = s.employees.length < s.tier * 2 - 1, vibe = vibeScore({ ...g, tycoon: t }, s), stars = money(Math.max(1, Math.min(5, s.qualityIndex / 25 + vibe / 100 - (short ? 1 : 0))));
    return { week: g.week, storeId: s.id, stars, text: short ? 'Guter Kaffee, aber die Wartezeit ist zu lang.' : vibe >= 75 ? 'Die Einrichtung passt zum Viertel. Hier komme ich gerne wieder.' : t.roastScore >= 90 ? 'Außergewöhnliche Bohnen und tolle Aromen.' : 'Solider Kaffee. Die Atmosphäre könnte besser passen.', tag: short ? 'Wartezeit' : vibe >= 75 ? 'Vibe-Match' : 'Qualität' };
  }), ...t.reviews].slice(0, 60);
  if (isExec(g, 'cmo') && !t.trends[trend.id] && g.week <= trend.startWeek + 2 && g.cash - cost > 10000) { t.trends[trend.id] = { adoptedWeek: g.week, price: 7.5 }; cost += 600; notes.push('CMO nimmt den viralen Trend in die Saisonkarte auf.'); }
  if (g.capitalMarkets.isPublic) cost += Math.max(0, g.lastReport?.netIncome ?? 0) * t.dividendRate;
  t.channels = channels; t.news = notes.slice(-30);
  const tax = money(Math.max(0, revenue - cost) * .15), net = money(revenue - cost - tax);
  g = { ...g, tycoon: t, cash: money(g.cash + net + financing) };
  const row = g.management.history.at(-1);
  if (row) g.management = { ...g.management, openingCash: g.cash, history: [...g.management.history.slice(0, -1), { ...row, other: money(row.other + revenue), upkeep: money(row.upkeep + cost), tax: money(row.tax + tax), profit: money(row.profit + net), operating: money(row.operating + net), financing: money(row.financing + financing), cashEnd: g.cash }] };
  if (g.lastReport) g.lastReport = { ...g.lastReport, revenueCapital: money(g.lastReport.revenueCapital + revenue), revenueTotal: money(g.lastReport.revenueTotal + revenue), costLuxuryUpkeep: money(g.lastReport.costLuxuryUpkeep + cost), costTax: money(g.lastReport.costTax + tax), costTotal: money(g.lastReport.costTotal + cost + tax), netIncome: money(g.lastReport.netIncome + net), notes: [...g.lastReport.notes, ...notes] };
  if (g.progress?.summary) g.progress = { ...g.progress, summary: { ...g.progress.summary, profit: money(g.progress.summary.profit + net) } };
  g.companyValuation = calculateCompanyValuation(g);
  return { game: g, exp: r.exp };
}

export function takeoverMajority(g: GameState, id: string): ActionResult {
  const company = g.capitalMarkets.rivals.find(r => r.id === id), holding = g.capitalMarkets.holdings.find(h => h.companyId === id);
  if (!company || !holding || holding.shares < Math.ceil(company.sharesOutstanding * .51)) return no(g, '51 % der Aktien benötigt.');
  const r = acquireRivalWithStores({ ...g, cash: g.cash + company.valuation * 1.45 }, id, company.valuation * 1.45);
  if (!r.ok) return no(g, r.reason);
  const inherited = { ...r.state, cash: g.cash, roastery: { ...r.state.roastery, owned: true, capacityKgPerWeek: r.state.roastery.capacityKgPerWeek + 1500 }, b2b: { ...r.state.b2b, contracts: [...r.state.b2b.contracts, { id: `ma-${id}-${g.week}`, partnerName: `${company.name} Bestandskunden`, volumeKgPerWeek: 500, pricePerKg: 18, weeksRemaining: 52, reliability: 95, minimumScore: 84, penaltyRate: .2 }] } };
  return { ...r, state: { ...inherited, companyValuation: calculateCompanyValuation(inherited) } };
}
export const newDynastyExpansion = createExpansion;