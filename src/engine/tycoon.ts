import type { ActionResult, GameState } from './types';
import { createTycoon, tycoonOf, hash, farmScore, franchiseReady, masterEra, propertyDiscount, esgScore, trendAt, vibeScore, type TycoonState, type FarmSetup } from './tycoonState';
import { ENTERPRISE, RETAIL, PATENTS, FARM_METHODS, type HeritagePerk } from '@/data/tycoonContent';
import { MASTER, buildingById } from '@/data/master';
import { processEmpireWeek, acquireRivalWithStores, isExec } from './empire';
import { catalogAction } from './world';
import { calculateCompanyValuation, signB2BContract } from './engine';
import { createInitialState } from '@/data/initialState';
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
export function configureFarm(g: GameState, id: string, setup: FarmSetup): ActionResult {
  if (!g.world.assets.some(a => a.kind === 'plantation' && a.id === id)) return no(g, 'Diese Finca gehört dir noch nicht.');
  const t = tycoonOf(g);
  if (!FARM_METHODS.some(m => m.id === setup.method) || !['washed', 'natural', 'anaerobic'].includes(setup.process)) return no(g, 'Ungültige Anbaumethode oder Aufbereitung.');
  return changed(g, { ...t, farms: { ...t.farms, [id]: { ...setup, leased: t.farms[id]?.leased ?? false } } }, 'Finca: Anbau, Aufbereitung und Fracht eingestellt.');
}
export function leaseFarm(g: GameState, id: string): ActionResult {
  const p = MASTER.plantations.find(p => p.id === id), t = tycoonOf(g);
  if (!p || g.world.assets.some(a => a.kind === 'plantation' && a.id === id)) return no(g, 'Finca nicht verfügbar.');
  const cost = p.purchasePrice * .08;
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
export function enableBeanPay(g: GameState): ActionResult {
  const t = tycoonOf(g);
  if (t.beanpay.enabled) return no(g, 'BeanPay ist schon aktiv.');
  if (masterEra(g) < 4 && g.world.appTier === 0 && !t.dynasty.perks.includes('tech')) return no(g, 'BeanPay benötigt eine erforschte Kunden-App oder Ära 4.');
  return changed(g, { ...t, beanpay: { ...t.beanpay, enabled: true } }, 'BeanPay gestartet.', t.dynasty.perks.includes('tech') ? 0 : 25000);
}
export function configureTreasury(g: GameState, reserve: number, bonus = false): ActionResult {
  const t = tycoonOf(g);
  if (!t.beanpay.enabled || !Number.isFinite(reserve) || reserve < .6 || reserve > 1) return no(g, 'BeanPay benötigt mindestens 60 % Rückzahlungsreserve.');
  return changed(g, { ...t, beanpay: { ...t.beanpay, reserve, bonusUntil: bonus ? g.week + 4 : t.beanpay.bonusUntil } }, bonus ? 'Treuepunkte-Kampagne für vier Wochen aktiv.' : 'Rückzahlungsreserve angepasst.', bonus ? 3500 : 0);
}
export function startPatent(g: GameState, id: string): ActionResult {
  const t = tycoonOf(g), p = PATENTS.find(p => p.id === id);
  if (!p || t.patents.includes(id) || t.patentProject) return no(g, 'Projekt nicht verfügbar oder bereits in Arbeit.');
  if (!g.roastery.owned || masterEra(g) < 2) return no(g, 'Hardware-Labor benötigt Ära 2 und eine Rösterei.');
  return changed(g, { ...t, patentProject: { id, finishWeek: g.week + (isExec(g, 'cto') ? Math.ceil(p.weeks * .7) : p.weeks) } }, 'Hardware-Forschung gestartet.', p.cost);
}
export function togglePatentLicenses(g: GameState): ActionResult {
  const t = tycoonOf(g); return changed(g, { ...t, licensePatents: !t.licensePatents }, 'Patent-Lizenzierung geändert.');
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
export function billFor(g: GameState, cityId = g.city.id) {
  const saved = tycoonOf(g).bills[cityId];
  if (saved && (saved.voteWeek >= g.week || saved.activeUntil >= g.week)) return saved;
  const cycle = Math.floor((g.week - 1) / 12), kinds = ['cup', 'terrace', 'rent'] as const;
  return { cityId, kind: kinds[cycle % 3] ?? 'cup', voteWeek: cycle * 12 + 4, support: .52, activeUntil: cycle * 12 + 12, passed: false };
}
export function lobbyBill(g: GameState, support: boolean): ActionResult {
  const t = tycoonOf(g), b = billFor(g);
  if (g.week >= b.voteWeek) return no(g, 'Die Abstimmung ist bereits abgeschlossen.');
  const influence = t.dynasty.perks.includes('diplomat') ? .3125 : .25;
  return changed(g, { ...t, bills: { ...t.bills, [g.city.id]: { ...b, support: Math.max(0, Math.min(1, b.support + (support ? influence : -influence))) } } }, 'Lobbyisten beeinflussen die bevorstehende Abstimmung.', 50000);
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
export function certify(g: GameState, verified: boolean): ActionResult {
  const t = tycoonOf(g); if (t.certification === (verified ? 'verified' : 'pseudo')) return no(g, 'Zertifizierung bereits aktiv.');
  return changed(g, { ...t, certification: verified ? 'verified' : 'pseudo' }, verified ? 'Unabhängig geprüfte Bio-Zertifizierung erworben.' : 'Ungeprüftes Label aktiv – Enthüllungsrisiko.', verified ? 30000 : 3000);
}
export function microloan(g: GameState, farmId: string): ActionResult {
  const t = tycoonOf(g);
  if (!MASTER.plantations.some(f => f.id === farmId) || t.microloans.some(l => l.farmId === farmId)) return no(g, 'Kooperative nicht verfügbar.');
  return changed(g, { ...t, microloans: [...t.microloans, { farmId, amount: 20000, dueWeek: g.week + 52 }] }, 'Agrar-Mikrokredit vergeben · Vorkaufsrecht und 3 % Jahreszins.', 20000);
}
export function setDividend(g: GameState, rate: number): ActionResult {
  if (!g.capitalMarkets.isPublic || ![0, .1, .25].includes(rate)) return no(g, 'Dividendenpolitik nur für börsennotierte Unternehmen.');
  return changed(g, { ...tycoonOf(g), dividendRate: rate }, 'Dividendenpolitik geändert.');
}
export function heritagePoints(g: GameState) {
  const t = tycoonOf(g), cities = new Set(g.stores.map(s => s.cityId)).size;
  return Math.max(0, Math.floor((calculateCompanyValuation(g) - t.beanpay.balance) / 100000) + cities * 100 + esgScore(g) * 5 + t.patents.length * 100 + (g.progress?.achievements.length ?? 0) * 10);
}
export function dynastyExit(g: GameState, perks: HeritagePerk[]): ActionResult {
  const allowed: HeritagePerk[] = ['diplomat', 'roast', 'property', 'tech'];
  if (masterEra(g) < 4 || new Set(perks).size !== 2 || perks.some(p => !allowed.includes(p))) return no(g, 'Generationenwechsel ab Ära 4; genau zwei Vermächtnisse wählen.');
  const fresh = createInitialState(), t = createTycoon(), old = tycoonOf(g);
  t.dynasty = { generation: old.dynasty.generation + 1, points: old.dynasty.points + heritagePoints(g), perks };
  t.beanpay.enabled = perks.includes('tech'); t.roastScore = perks.includes('roast') ? 89 : 84;
  return ok({ ...fresh, tycoon: t }, 'Der Erbe beginnt mit zwei dauerhaften Dynastie-Vorteilen.');
}

/** Pre-simulation supply phase. Existing farm harvest is routed here, not paid a second time. */
function prepareSupply(state: GameState): GameState {
  const t = structuredClone(tycoonOf(state)), roastery = { ...state.roastery, beanLots: state.roastery.beanLots.map(l => ({ ...l })) };
  for (const a of state.world.assets.filter(a => a.kind === 'plantation')) {
    const p = MASTER.plantations.find(p => p.id === a.id); if (!p) continue;
    if ((state.week + 1 - a.startWeek) % p.harvestIntervalWeeks !== 0) continue;
    const setup = t.farms[a.id] ?? { method: 'shade', process: 'washed', freight: 'sea' };
    const kg = Math.round(p.annualYieldKg * p.harvestIntervalWeeks / 52 * (FARM_METHODS.find(m => m.id === setup.method)?.yield ?? 1));
    const bean = state.market.beanVarieties.find(b => b.originCountry === p.country) ?? state.market.beanVarieties[0];
    t.cargo.push({ id: `crop-${a.id}-${state.week + 1}`, kg, origin: p.country, score: farmScore(state, a.id), arrival: state.week + 1 + (setup.freight === 'air' ? 1 : 2), mode: setup.freight, beanId: bean?.id ?? '', cost: money(kg * (setup.freight === 'air' ? 1.8 : .25)) });
  }
  const arriving = t.cargo.filter(c => c.arrival <= state.week + 1);
  let total = roastery.rawBeanStockKg, score = t.inventoryScore;
  for (const c of arriving) {
    score = (score * total + c.score * c.kg) / (total + c.kg || 1); total += c.kg;
    const lot = roastery.beanLots.find(l => l.beanId === c.beanId);
    if (lot) lot.quantityKg += c.kg; else roastery.beanLots.push({ beanId: c.beanId, quantityKg: c.kg, averagePricePerKg: c.cost / c.kg });
  }
  roastery.rawBeanStockKg = money(total); t.inventoryScore = money(score);
  t.news = arriving.map(c => `${c.mode === 'air' ? 'Luftfracht' : 'Seefracht'}: ${c.kg} kg aus ${c.origin} im Rohkaffee-Lager.`);
  // Spot lots and the saved signature blend share the same inventory.
  const blend = t.blend;
  const a = state.market.beanVarieties.find(b => b.id === blend.beanA), b = state.market.beanVarieties.find(b => b.id === blend.beanB);
  const blendReady = a && b && roastery.beanLots.some(l => l.beanId === a.id && l.quantityKg > 0) && roastery.beanLots.some(l => l.beanId === b.id && l.quantityKg > 0);
  const quality = blendReady ? a.qualityScore * blend.percentA / 100 + b.qualityScore * (1 - blend.percentA / 100) : score;
  t.roastScore = money(Math.min(100, Math.max(80, quality + (t.dynasty.perks.includes('roast') ? 5 : 0))));
  return { ...state, tycoon: t, roastery };
}

/** All master systems settle into the same report and cash journal after the existing engine. */
export function processTycoonWeek(state: GameState, exp: ExpansionState) {
  if (state.pendingEvent) return { game: state, exp };
  const prepared = prepareSupply(state), r = processEmpireWeek(prepared, exp);
  if (r.game.week === state.week) return { game: state, exp };
  let g: GameState = { ...r.game, world: { ...r.game.world, occupants: { ...r.game.world.occupants } }, tycoon: tycoonOf(prepared) }, t = structuredClone(tycoonOf(g));
  let revenue = 0, cost = 0, financing = 0;
  const notes = [...t.news];
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
  const bp = t.beanpay;
  if (bp.enabled || g.world.appTier > 0) {
    bp.enabled = true;
    const guests = g.stores.reduce((n, s) => n + s.customersServedLastWeek, 0), newUsers = Math.round(guests * .025 * (bp.bonusUntil >= g.week ? 1.5 : 1));
    bp.users += newUsers;
    const target = bp.users * 32.5, change = money((target - bp.balance) * .2), oldBalance = bp.balance;
    bp.balance = money(Math.max(0, bp.balance + change)); financing += bp.balance - oldBalance;
    bp.interest = money(Math.min(bp.balance * bp.reserve, Math.max(0, g.cash + financing - cost)) * bp.yieldAnnual / 52);
    channels.treasury = bp.interest; revenue += bp.interest;
    notes.push(`BeanPay: ${money(bp.balance - oldBalance).toLocaleString('de-DE')} € Kundenguthaben als Verbindlichkeit · ${bp.interest.toLocaleString('de-DE')} € Zinsen.`);
  }
  if (t.patentProject && t.patentProject.finishWeek <= g.week) { t.patents.push(t.patentProject.id); notes.push('Hardware-Patent erteilt.'); t.patentProject = null; }
  if (t.licensePatents) { channels.patents = PATENTS.filter(p => t.patents.includes(p.id)).reduce((n, p) => n + p.income, 0); revenue += channels.patents; }
  for (const l of t.landlords) {
    if (l.evict && l.endWeek <= g.week) { delete g.world.occupants[l.districtId]; notes.push('Rivalenmietvertrag ausgelaufen: Standort freigegeben.'); }
    else if (g.world.occupants[l.districtId] === l.rivalId) { const rent = money((buildingById(l.districtId)?.weeklyRent ?? 0) * l.multiplier); revenue += rent; channels.rent += rent; }
  }
  for (const a of g.world.assets.filter(a => a.kind === 'plantation')) {
    if (t.farms[a.id]?.leased) cost += money((MASTER.plantations.find(p => p.id === a.id)?.purchasePrice ?? 0) * .08 / 52);
  }
  for (const city of g.cities.filter(c => c.id === g.city.id || g.stores.some(s => s.cityId === c.id))) {
    const current = billFor({ ...g, tycoon: t }, city.id), previous = state.tycoon?.bills[city.id];
    const b = current.voteWeek < g.week && !previous ? { ...current, passed: hash(`${city.id}-${current.voteWeek}`) % 100 / 100 < current.support } : current;
    if (b.voteWeek === g.week) { b.passed = hash(`${city.id}-${b.voteWeek}`) % 100 / 100 < b.support; notes.push(`${city.name}: Stadtrat ${b.passed ? 'beschließt' : 'verwirft'} ${b.kind === 'cup' ? 'Einwegbecher-Abgabe' : b.kind === 'rent' ? 'Gewerbemietbremse' : 'Terrassen-Verordnung'}.`); }
    t.bills[city.id] = b;
    if (!b.passed || b.voteWeek > g.week || b.activeUntil < g.week) continue;
    const cafes = g.stores.filter(s => s.cityId === city.id);
    if (b.kind === 'cup' && !g.cafe?.research.done.includes('s1')) cost += cafes.reduce((n, s) => n + s.customersServedLastWeek * .2, 0);
    if (b.kind === 'terrace') cost += cafes.filter(s => (g.cafe?.stores[s.id]?.gear.terrace ?? 0) > 0).reduce((n, s) => n + s.weeklyRevenue * .02, 0);
    if (b.kind === 'rent') revenue += cafes.filter(s => !s.propertyBookValue).reduce((n, s) => n + (buildingById(s.districtId)?.weeklyRent ?? 0) * .1, 0);
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
  if (t.certification === 'pseudo' && hash(`esg-${g.week}`) % 26 === 0) { t.scandalUntil = g.week + 8; g.brandReputation = Math.max(0, g.brandReputation - 15); cost += 15000; notes.push('Greenwashing enthüllt: Boykott und 15.000 € Strafe.'); }
  t.microloans = t.microloans.filter(l => { if (l.dueWeek <= g.week) { financing += l.amount; revenue += l.amount * .03; notes.push('Agrar-Mikrokredit zurückgezahlt.'); return false; } return true; });
  const trend = trendAt(g.week), adopted = t.trends[trend.id];
  if (adopted && g.week <= trend.until) {
    const cups = Math.round(g.stores.reduce((n, s) => n + s.customersServedLastWeek, 0) * .06);
    revenue += cups * adopted.price; cost += cups * 1.4;
  }
  t.trends = Object.fromEntries(Object.entries(t.trends).filter(([, v]) => v.adoptedWeek > g.week - 16));
  t.reviews = [...g.stores.slice().sort((a, b) => a.qualityIndex - b.qualityIndex).slice(0, 12).map(s => {
    const short = s.employees.length < s.tier * 2 - 1, vibe = vibeScore({ ...g, tycoon: t }, s), stars = money(Math.max(1, Math.min(5, s.qualityIndex / 25 + vibe / 100 - (short ? 1 : 0))));
    return { week: g.week, storeId: s.id, stars, text: short ? 'Guter Kaffee, aber die Wartezeit ist zu lang.' : vibe >= 75 ? 'Die Einrichtung passt zum Viertel. Hier komme ich gerne wieder.' : t.roastScore >= 90 ? 'Außergewöhnliche Bohnen und tolle Aromen.' : 'Solider Kaffee. Die Atmosphäre könnte besser passen.', tag: short ? 'Wartezeit' : vibe >= 75 ? 'Vibe-Match' : 'Qualität' };
  }), ...t.reviews].slice(0, 60);
  if (isExec(g, 'cmo') && !t.trends[trend.id] && g.week <= trend.startWeek + 2 && g.cash - cost > 10000) { t.trends[trend.id] = { adoptedWeek: g.week, price: 7.5 }; cost += 600; notes.push('CMO nimmt den viralen Trend in die Saisonkarte auf.'); }
  if (isExec(g, 'cto') && !t.patentProject && g.roastery.owned && masterEra(g) >= 2) {
    const p = PATENTS.find(p => !t.patents.includes(p.id));
    if (p && g.cash - cost > p.cost * 4) { t.patentProject = { id: p.id, finishWeek: g.week + Math.ceil(p.weeks * .7) }; cost += p.cost; notes.push(`CTO startet Hardware-Projekt „${p.name}“.`); }
  }
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
  return r.ok ? { ...r, state: { ...r.state, cash: g.cash } } : no(g, r.reason);
}
export const newDynastyExpansion = createExpansion;