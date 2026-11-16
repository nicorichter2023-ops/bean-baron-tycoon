import { openCityIds } from './unlocks';
import { MASTER, buildingById } from '@/data/master';
import { neighborhoodEffects } from './neighborhood';
import type { ActionResult, GameState } from './types';

export interface WorldState {
  occupants: Record<string, string>; travelHistory: { from: string; to: string; cabin: string; cost: number; week: number }[];
  research: { id: string; finishWeek: number }[]; technologies: string[];
  candidates: string[]; hired?: Candidate[]; applicants?: Candidate[]; assets: { kind: string; id: string; cityId: string; startWeek: number; endWeek: number; bookValue: number; remainingKg: number }[];
  appTier: number; news: string[];
}
export function createWorld(): WorldState {
  return { occupants: Object.fromEntries(MASTER.cities.flatMap(c => c.buildings.filter(b => b.initialOccupant).map(b => [b.id, b.initialOccupant ?? '']))),
    travelHistory: [], research: [], technologies: [], candidates: [], assets: [], appTier: 0, news: [] };
}
export type Candidate = (typeof MASTER.cSuiteCandidates)[number];
/** Hired generated applicants live in the save; legacy IDs still resolve from the master list. */
export const candidateOf = (g: { world?: WorldState }, id: string): Candidate | undefined => g.world?.hired?.find(c => c.id === id) ?? candidateOf(g, id);
const outcome = (state: GameState, reason: string, ok = false): ActionResult => ({ state, reason, ok });
export function travelToCity(g: GameState, cityId: string, cabin: 'economy' | 'business'): ActionResult {
  const airport = MASTER.airports.find(a => a.cityId === cityId), city = g.cities.find(c => c.id === cityId);
  if (!city || !airport || cityId === g.city.id) return outcome(g, 'Dieses Reiseziel ist nicht verfügbar.');
  const cost = cabin === 'business' ? airport.baseTicketBusiness : airport.baseTicketEconomy;
  if (g.cash < cost) return outcome(g, 'Nicht genug Barvermögen für das Ticket.');
  if (g.pendingEvent) return outcome(g, 'Bitte zuerst das Wochenereignis entscheiden.');
  if (!openCityIds(g).includes(cityId)) return outcome(g, `${city.name} wird mit einem höheren Firmenrang freigeschaltet.`);
  return outcome({ ...g, cash: g.cash - cost, city, world: { ...g.world, travelHistory: [...g.world.travelHistory, { from: g.city.id, to: cityId, cabin, cost, week: g.week }].slice(-52) } }, `Ankunft in ${city.name}.`, true);
}
export function locationEffects(g: GameState, id: string) {
  const b = buildingById(id);
  if (!b) return { demand: 1, capacity: 1, quality: 0, prestige: 0, margin: 1 };
  const bonus = b.locationBonus.valuePercent / 100;
  const neighbors = neighborhoodEffects(g, id);
  const occupied = MASTER.cities.find(c => c.buildings.some(x => x.id === id))?.buildings.filter(x => g.world.occupants[x.id] && !g.capitalMarkets.rivals.find(r => r.id === g.world.occupants[x.id])?.acquired).length ?? 0;
  return { demand: (1 + (b.locationBonus.bonusType === 'volume' ? bonus : 0)) * Math.max(.75, (1 - Math.min(.3, occupied * .008)) * neighbors.demand),
    capacity: 1 + (b.locationBonus.bonusType === 'takeaway' ? bonus : 0) * (1 + neighbors.takeaway), margin: (1 + (b.locationBonus.bonusType === 'margin' ? bonus : 0)) * (1 + neighbors.margin), quality: b.clientele === 'creatives' ? 3 : 0,
    prestige: (b.locationBonus.bonusType === 'prestige' ? b.locationBonus.valuePercent / 5 : 0) + neighbors.prestige };
}
export function worldEffects(g: GameState) {
  let capacity = 1, quality = 0, beanFactor = 1, demand = 1;
  for (const t of MASTER.techTree.filter(t => g.world.technologies.includes(t.id))) {
    capacity *= t.effects.throughputMultiplier; quality += t.effects.customerSatisfactionBonus / 4; beanFactor *= 1 - t.effects.beanLossReduction;
  }
  const app = MASTER.digitalEcosystem.appTiers.find(a => a.tier === g.world.appTier); capacity *= app?.orderSpeedBuff ?? 1;
  for (const id of g.world.candidates) {
    const c = candidateOf(g, id); if (!c) continue;
    const perks = c.perks as Record<string, number>;
    capacity *= 1 + (perks['storeThroughputBonus'] ?? 0); 
  }
  for (const a of g.world.assets.filter(a => a.endWeek > g.week)) {
    const csr = MASTER.csrCertifications.find(c => a.kind === 'csr' && c.id === a.id); demand *= 1 + (csr?.hipsterStudentBonus ?? 0);
  }
  return { capacity, quality: Math.min(30, quality), beanFactor: Math.max(.3, beanFactor), demand };
}
export function executivePerk(g: GameState, role: string, perk: string): number {
  return g.world.candidates.reduce((n, id) => { const c = [candidateOf(g, id)].find(c => c?.role === role); return Math.max(n, (c?.perks as Record<string, number> | undefined)?.[perk] ?? 0); }, 0);
}
export function researchDuration(g: GameState, weeks: number) { return Math.max(1, Math.ceil(weeks / (1 + executivePerk(g, 'CTO', 'weeklyResearchPoints') / 100))); }
export const campaignMultiplier = (g: GameState) => 1 + executivePerk(g, 'CMO', 'campaignEffectivenessBonus');
export type CatalogKind = 'research' | 'candidate' | 'plantation' | 'tenant' | 'future' | 'policy' | 'csr' | 'celebrity' | 'underwriter' | 'training' | 'app';
export function catalogAction(g: GameState, kind: CatalogKind, id: string): ActionResult {
  if (g.pendingEvent) return outcome(g, 'Bitte zuerst das Wochenereignis entscheiden.');
  let cost = 0, name = '', duration = 100000, bookValue = 0, remainingKg = 0;
  let world: WorldState = { ...g.world }, reputation = g.brandReputation;
  if (world.assets.some(a => a.kind === kind && a.id === id && (kind !== 'policy' || a.cityId === g.city.id) && a.endWeek > g.week)) return outcome(g, 'Bereits aktiv.');
  if (kind === 'research') {
    const t = MASTER.techTree.find(t => t.id === id); if (!t) return outcome(g, 'Forschung nicht gefunden.');
    if (world.technologies.includes(id) || world.research.some(r => r.id === id)) return outcome(g, 'Bereits erforscht oder in Arbeit.');
    if (t.prerequisiteId && !world.technologies.includes(t.prerequisiteId)) return outcome(g, 'Voraussetzung noch nicht erforscht.');
    const discount = world.candidates.reduce((n, id) => Math.max(n, (candidateOf(g, id)?.perks as Record<string, number> | undefined)?.['techCostDiscount'] ?? 0), 0);
    cost = Math.round(t.researchCost * (1 - discount)); name = t.name;
    world.research = [...world.research, { id, finishWeek: g.week + researchDuration(g, t.researchWeeks) }];
  } else if (kind === 'candidate') {
    const c = candidateOf(g, id); if (!c) return outcome(g, 'Kandidat nicht gefunden.');
    if (world.candidates.some(id => candidateOf(g, id)?.role === c.role) || g.management.executives.some(e => e.role === c.role.toLowerCase())) return outcome(g, 'Position bereits besetzt.');
    cost = c.signingBonus; name = c.name; world.candidates = [...world.candidates, id];
  } else if (kind === 'app') {
    const a = MASTER.digitalEcosystem.appTiers.find(a => String(a.tier) === id); if (!a) return outcome(g, 'App nicht gefunden.');
    if (a.tier !== world.appTier + 1 || !world.technologies.includes(`tech_digital_t${a.tier}`)) return outcome(g, 'Zuerst die digitale Forschungsstufe abschließen.');
    world.appTier = a.tier; name = a.name;
  } else if (kind === 'plantation') {
    const a = MASTER.plantations.find(a => a.id === id); if (!a) return outcome(g, 'Plantage nicht gefunden.');
    cost = bookValue = a.purchasePrice; name = a.name;
  } else if (kind === 'tenant') {
    const a = MASTER.officeTenants.find(a => a.id === id); if (!a) return outcome(g, 'Mieter nicht gefunden.');
    if (g.era !== 'global_empire') return outcome(g, 'Bürovermietung benötigt ein globales Imperium.');
    name = a.name; duration = a.leaseWeeks;
  } else if (kind === 'future') {
    const a = MASTER.commodityFutures.find(a => a.id === id); if (!a) return outcome(g, 'Kontrakt nicht gefunden.');
    cost = a.contractFee; name = a.contractName; duration = a.contractWeeks; remainingKg = a.protectedVolumeKg;
  } else if (kind === 'policy') {
    const a = MASTER.cityPolitics.find(a => a.id === id); if (!a) return outcome(g, 'Initiative nicht gefunden.');
    cost = a.lobbyingCost; name = a.name; duration = a.durationWeeks;
    if (g.cash < cost) return outcome(g, 'Nicht genug Barvermögen.');
    // Stable draw per city, proposal and week. Rejected lobbying still costs money.
    const draw = stableHash(`${g.city.id}-${id}-${g.week}`) % 10000 / 10000;
    if (draw >= a.approvalChance) return outcome({ ...g, cash: g.cash - cost }, `${name}: Antrag abgelehnt; Lobbyingkosten bezahlt.`, true);
  } else if (kind === 'csr') {
    const a = MASTER.csrCertifications.find(a => a.id === id); if (!a) return outcome(g, 'Zertifikat nicht gefunden.');
    cost = a.initialCost; name = a.name; reputation += a.reputationGain;
  } else if (kind === 'celebrity') {
    const a = MASTER.celebrityEndorsements.find(a => a.id === id); if (!a) return outcome(g, 'Botschafter nicht gefunden.');
    cost = a.signingFee; name = a.name; duration = a.contractWeeks; reputation += a.reputationBoost;
  } else if (kind === 'training') {
    const a = MASTER.storeHrStandards.trainingTiers.find(a => String(a.tier) === id); if (!a) return outcome(g, 'Training nicht gefunden.');
    const staff = g.stores.flatMap(s => s.employees).filter(e => (e.trainingTier ?? 0) < a.tier); if (!staff.length) return outcome(g, 'Keine Mitarbeiter mit Trainingsbedarf.');
    cost = staff.length * a.trainingCostPerStaff; name = a.name;
    if (g.cash < cost) return outcome(g, 'Nicht genug Barvermögen.');
    return outcome({ ...g, cash: g.cash - cost, stores: g.stores.map(s => ({ ...s, employees: s.employees.map(e => (e.trainingTier ?? 0) < a.tier ? { ...e, skill: Math.max(e.skill, a.baseQuality), trainingTier: a.tier } : e) })) }, `${name}: ${staff.length} Mitarbeiter geschult.`, true);
  } else if (kind === 'underwriter') {
    const a = MASTER.stockMarket.underwriters.find(a => a.id === id); if (!a) return outcome(g, 'Bank nicht gefunden.');
    if (g.capitalMarkets.isPublic || (g.lastReport?.revenueTotal ?? 0) < a.minRevenueRequired || g.brandReputation < a.minReputationRequired) return outcome(g, 'Umsatz- und Reputationsanforderungen für den Börsengang fehlen.');
    const value = Math.round((g.lastReport?.revenueTotal ?? 0) * a.valuationMultiplier), shares = 1000000, raised = Math.round(value * .2 * (1 - a.commissionRate));
    return outcome({ ...g, cash: g.cash + raised, capitalMarkets: { ...g.capitalMarkets, isPublic: true, ipoWeek: g.week, sharesOutstanding: shares, sharePrice: value / shares, marketCap: value } }, `Börsengang mit ${a.name}.`, true);
  }
  if (!name || !Number.isFinite(cost) || g.cash < cost) return outcome(g, 'Nicht genug Barvermögen.');
  if (!['research', 'candidate', 'app'].includes(kind)) world.assets = [...world.assets, { kind, id, cityId: g.city.id, startWeek: g.week, endWeek: g.week + duration, bookValue, remainingKg }];
  return outcome({ ...g, cash: g.cash - cost, brandReputation: Math.min(100, reputation), world }, `${name}: erfolgreich gestartet.`, true);
}
export function dismissCandidate(g: GameState, id: string): ActionResult {
  return outcome({ ...g, world: { ...g.world, candidates: g.world.candidates.filter(x => x !== id) } }, 'Führungskraft freigestellt.', true);
}
export const stableHash = (s: string) => [...s].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
export function advanceWorld(g: GameState): GameState {
  const world = { ...g.world, occupants: { ...g.world.occupants }, news: [] as string[] };
  const completed = world.research.filter(r => r.finishWeek <= g.week);
  world.technologies = [...world.technologies, ...completed.map(r => r.id)]; world.research = world.research.filter(r => r.finishWeek > g.week);
  let reputation = g.brandReputation;
  for (const id of world.candidates) reputation += ((candidateOf(g, id)?.perks as Record<string, number> | undefined)?.['brandAwarenessGrowthBonus'] ?? 0);
  for (const r of completed) { const t = MASTER.techTree.find(t => t.id === r.id); reputation += t?.effects.reputationBonus ?? 0; world.news.push(`${t?.name}: Forschung abgeschlossen.`); }
  for (const c of MASTER.cities) {
    const rival = MASTER.competitors[(g.week + stableHash(c.cityId)) % MASTER.competitors.length]; if (!rival || g.capitalMarkets.rivals.find(r => r.id === rival.id)?.acquired) continue;
    const free = c.buildings.filter(b => !world.occupants[b.id] && !g.stores.some(s => s.districtId === b.id) && !g.tycoon?.franchises.some(f => f.districtId === b.id));
    if (free.length < 4 || stableHash(`${c.cityId}-${g.week}`) % 100 >= rival.aggressiveness / 5) continue;
    const b = free.sort((a,b) => b.footTraffic - a.footTraffic)[0]; if (!b) continue;
    world.occupants[b.id] = rival.id; world.news.push(`${c.cityName}: ${rival.name} sichert sich ${b.name}.`);
  }
  return { ...g, world, brandReputation: Math.min(100, reputation) };
}
export function worldWeeklyFlows(g: GameState) {
  let income = g.tycoon ? 0 : MASTER.digitalEcosystem.appTiers.find(a => a.tier === g.world.appTier)?.weeklyFloatInterest ?? 0, upkeep = 0, salaries = 0, harvest = 0;
  for (const id of g.world.candidates) salaries += candidateOf(g, id)?.weeklySalary ?? 0;
  for (const a of g.world.assets.filter(a => a.startWeek < g.week && a.endWeek >= g.week)) {
    if (a.kind === 'plantation') { const p = MASTER.plantations.find(p => p.id === a.id); if (p) { upkeep += p.weeklyOperatingCost; if ((g.week - a.startWeek) % p.harvestIntervalWeeks === 0) harvest += p.annualYieldKg * p.harvestIntervalWeeks / 52; } }
    if (a.kind === 'tenant') { const p = MASTER.officeTenants.find(p => p.id === a.id); if (p) income += p.requiredAreaSqm * p.rentPerSqmWeekly; }
    if (a.kind === 'csr') upkeep += MASTER.csrCertifications.find(p => p.id === a.id)?.weeklyMaintenance ?? 0;
    if (a.kind === 'celebrity') upkeep += MASTER.celebrityEndorsements.find(p => p.id === a.id)?.weeklyRetainer ?? 0;
    if (a.kind === 'policy') income += (MASTER.cityPolitics.find(p => p.id === a.id) as { fixedB2BWeeklyRevenue?: number } | undefined)?.fixedB2BWeeklyRevenue ?? 0;
  }
  return { income, upkeep, salaries, harvest };
}

/** Consume protected quantities once, matching actual externally purchased roasted coffee. */
export function applyWorldSupply(g: GameState): GameState {
  const flows = worldWeeklyFlows(g);
  const assets = g.world.assets.map(a => ({ ...a }));
  let savings = 0;
  if (!g.roastery.owned) {
    let kg = g.stores.reduce((n, s) => n + s.customersServedLastWeek * .018 * (s.equipment.grinder ? .9 : 1) * worldEffects(g).beanFactor, 0);
    for (const a of assets.filter(a => a.kind === 'future' && a.endWeek >= g.week && a.remainingKg > 0)) {
      const p = MASTER.commodityFutures.find(p => p.id === a.id); if (!p) continue;
      const used = Math.min(kg, a.remainingKg); kg -= used; a.remainingKg -= used;
      savings += used * Math.max(0, g.market.futuresPricePerKg - p.lockPricePerKg) * 1.15 * 1.25 / .84;
    }
  }
  // Harvest is valued at the current commodity price and retained in the ordinary bean inventory.
  const r = g.lastReport;
  const discount = Math.round(savings * 100) / 100;
  const report = r ? { ...r, costBeans: r.costBeans - discount, costTotal: r.costTotal - discount, netIncome: r.netIncome + discount,
    notes: [...r.notes, ...(discount ? [`Preisabsicherung: ${discount.toLocaleString('de-DE')} € Einkaufskosten gespart.`] : []), ...(flows.harvest ? [`Plantagen-Ernte: ${Math.round(flows.harvest)} kg.`] : [])] } : null;
  return { ...g, cash: g.cash + discount, lastReport: report, world: { ...g.world, assets }, roastery: { ...g.roastery, rawBeanStockKg: g.roastery.rawBeanStockKg + (g.tycoon ? 0 : flows.harvest) } };
}