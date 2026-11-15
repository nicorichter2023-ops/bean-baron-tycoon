// Empire layer: endless venture pipeline, supply-chain upgrades, chain-wide actions, property deals,
// auto-renewing campaigns and C-level automation. Pure functions; weekly play runs through processEmpireWeek.
import type { ActionResult, GameState, StoreTier } from './types';
import { MASTER } from '@/data/master';
import { GAME_CONFIG, acquireRival, hireEmployee, openStore, repayLoan, storeOpeningCost } from './engine';
import { cafeOf, researchAvailable, startResearch, upgradeGear } from './cafe';
import { GEAR, RESEARCH, researchCost, type GearCategory } from './cafeContent';
import { processProgressWeek, stageUpgrade } from './progression';
import { CAMPAIGNS, startCampaign, type CampaignKind, type ExpansionState } from './expansion';
import { hasExecutive } from './management';

const r2 = (n: number) => Math.round(n * 100) / 100;
const ok = (state: GameState, reason: string): ActionResult => ({ state, ok: true, reason });
const no = (state: GameState, reason: string): ActionResult => ({ state, ok: false, reason });
const rand = (seed: number) => { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const isExec = (g: GameState, role: 'coo' | 'cfo' | 'cmo' | 'cto') => hasExecutive(g, role as 'coo');

// ---------- state ----------
export const STAGES = ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Pre-IPO'] as const;
export type VentureStatus = 'open' | 'active' | 'ipo' | 'sold' | 'failed' | 'sued';
export type DecisionKind = 'round' | 'crisis' | 'offer' | 'pivot';
export interface VentureDecision { kind: DecisionKind; cost: number; value: number; expires: number }
export interface Venture {
  id: string; name: string; sector: string; pitch: string; art: number; stage: number; valuation: number; ticket: number;
  ownership: number; invested: number; quality: number; nextWeek: number; openUntil: number; status: VentureStatus;
  decision: VentureDecision | null; payout: number; closedWeek: number | null;
}
export type SupplyKey = 'roaster' | 'sorter' | 'eco' | 'irrigation' | 'mill' | 'agro';
export interface EmpireState { ventures: Venture[]; history: Venture[]; seq: number; supply: Record<SupplyKey, number>; auto: string[] }
export const createEmpire = (): EmpireState => ({ ventures: [], history: [], seq: 0, supply: { roaster: 0, sorter: 0, eco: 0, irrigation: 0, mill: 0, agro: 0 }, auto: [] });
export const empireOf = (g: GameState): EmpireState => {
  const e = g.empire; if (!e) return seedPipeline(createEmpire(), g.week);
  return { ...createEmpire(), ...e, supply: { ...createEmpire().supply, ...e.supply } };
};

// ---------- ventures ----------
const SECTORS: [string, string][] = [
  ['KI-Röstanalyse', 'Röstprofile per KI in Echtzeit optimieren.'], ['Barista-Robotik', 'Roboterarme für Stoßzeiten.'], ['Direct-Trade-Plattform', 'Farmer verkaufen direkt an Röstereien.'],
  ['Kaffeesatz-Recycling', 'Aus Kaffeesatz werden Becher und Dünger.'], ['Liefer-Drohnen', 'Kaffee in 8 Minuten an jede Tür.'], ['Bio-Kapseln', 'Kompostierbare Kapseln für Zuhause.'],
  ['Coffee-Fintech', 'Bezahl- und Treue-Wallet für Cafés.'], ['Smart-Vending', 'Vollautomaten mit Spezialitätenkaffee.'], ['Cold-Brew-Dosen', 'Premium Cold Brew im Supermarkt.'], ['Agrar-Sensorik', 'Bodensensoren steigern Ernten.'],
];
const PRE = ['Bean', 'Brew', 'Roast', 'Crema', 'Kaffa', 'Mocca', 'Arabi', 'Barista', 'Drip', 'Nitro'];
const SUF = ['Bot', 'Loop', 'Labs', 'Chain', 'Pay', 'Drop', 'Cycle', 'Mind', 'Hub', 'Flow'];
function spawnVenture(e: EmpireState, week: number): EmpireState {
  const seq = e.seq + 1, x = (k: number) => rand(seq * 7919 + week * 31 + k);
  const [sector, pitch] = SECTORS[Math.floor(x(1) * SECTORS.length)]!;
  const valuation = Math.round((250_000 + x(2) * 1_750_000) / 10_000) * 10_000;
  const v: Venture = { id: `v${seq}`, name: `${PRE[Math.floor(x(3) * PRE.length)]}${SUF[Math.floor(x(4) * SUF.length)]}`, sector, pitch, art: Math.floor(x(5) * 16),
    stage: 0, valuation, ticket: Math.round(valuation * 0.1 / 1000) * 1000, ownership: 0, invested: 0, quality: r2(0.15 + x(6) * 0.8),
    nextWeek: 0, openUntil: week + 6 + Math.floor(x(7) * 6), status: 'open', decision: null, payout: 0, closedWeek: null };
  return { ...e, seq, ventures: [...e.ventures, v] };
}
function seedPipeline(e: EmpireState, week: number) { let n = e; while (n.ventures.filter(v => v.status === 'open').length < 4) n = spawnVenture(n, week + n.seq); return n; }
/** Visible hint of quality without exposing the hidden roll. */
export const ventureSignal = (v: Venture) => v.quality >= 0.7 ? 'Starkes Team' : v.quality >= 0.45 ? 'Solide Traktion' : 'Hohes Risiko';
export const ventureStake = (v: Venture) => r2(v.valuation * v.ownership);
const patchVenture = (g: GameState, e: EmpireState, id: string, patch: Partial<Venture>): GameState => ({ ...g, empire: { ...e, ventures: e.ventures.map(v => v.id === id ? { ...v, ...patch } : v) } });
const vh = (v: Venture) => [...v.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 100000, 7);
const closeVenture = (e: EmpireState, v: Venture): EmpireState => ({ ...e, ventures: e.ventures.filter(x => x.id !== v.id), history: [v, ...e.history].slice(0, 15) });

export const VENTURE_SLOTS = 6;
export function investVenture(g: GameState, id: string): ActionResult {
  const e = empireOf(g), v = e.ventures.find(x => x.id === id);
  if (!v || v.status !== 'open') return no(g, 'Dieses Startup sucht keine Finanzierung mehr.');
  if (e.ventures.filter(x => x.status === 'active').length >= VENTURE_SLOTS) return no(g, `Maximal ${VENTURE_SLOTS} Beteiligungen gleichzeitig.`);
  if (g.cash < v.ticket) return no(g, 'Nicht genug Barvermögen.');
  const nextWeek = g.week + 6 + Math.floor(rand(g.week + v.ticket) * 8);
  return ok(patchVenture({ ...g, cash: r2(g.cash - v.ticket) }, e, id, { status: 'active', invested: v.ticket, ownership: r2(v.ticket / (v.valuation + v.ticket) * 1000) / 1000, nextWeek }), `${v.name}: ${STAGES[0]}-Runde mitfinanziert.`);
}
export function passVenture(g: GameState, id: string): ActionResult {
  const e = empireOf(g); return ok({ ...g, empire: seedPipeline({ ...e, ventures: e.ventures.filter(v => v.id !== id) }, g.week) }, 'Startup abgelehnt – ein neues Pitch-Deck liegt bereit.');
}
const DECISION_TEXT: Record<DecisionKind, { title: string; yes: string; no: string }> = {
  round: { title: 'Neue Finanzierungsrunde', yes: 'Pro-rata nachziehen (Anteil halten)', no: 'Verwässern lassen (−20 % Anteil)' },
  crisis: { title: 'Patentklage eines Konkurrenten', yes: 'Top-Anwälte bezahlen', no: 'Risiko tragen' },
  offer: { title: 'Übernahmeangebot', yes: 'Anteil jetzt verkaufen', no: 'Ablehnen – auf den IPO setzen' },
  pivot: { title: 'Gründer wollen pivotieren', yes: 'Pivot unterstützen (neues Glück, −30 % Bewertung)', no: 'Kurs halten' },
};
export const decisionText = (k: DecisionKind) => DECISION_TEXT[k];

export function resolveVenture(g: GameState, id: string, accept: boolean): ActionResult {
  const e = empireOf(g), v = e.ventures.find(x => x.id === id), d = v?.decision;
  if (!v || !d) return no(g, 'Keine offene Entscheidung.');
  const next = g.week + 6 + Math.floor(rand(g.week * 3 + vh(v)) * 9);
  if (accept && d.cost > g.cash) return no(g, 'Nicht genug Barvermögen.');
  let cash = g.cash, patch: Partial<Venture> = { decision: null, nextWeek: next }, msg = '';
  if (d.kind === 'round') {
    patch = { ...patch, stage: v.stage + 1, valuation: d.value, ownership: accept ? v.ownership : r2(v.ownership * 0.8 * 1000) / 1000, invested: v.invested + (accept ? d.cost : 0) };
    if (accept) cash -= d.cost; msg = `${v.name}: ${STAGES[v.stage + 1]} ${accept ? 'mitgezogen' : 'ohne dich – Anteil verwässert'}.`;
  } else if (d.kind === 'crisis') {
    if (accept) { cash -= d.cost; patch.quality = Math.min(1, v.quality + 0.15); patch.invested = v.invested + d.cost; msg = `${v.name}: Klage abgewehrt.`; }
    else { patch.quality = r2(v.quality - 0.2); msg = `${v.name}: Klage läuft weiter – Risiko gestiegen.`; }
  } else if (d.kind === 'offer') {
    if (accept) { const done: Venture = { ...v, ...patch, status: 'sold', payout: d.value, closedWeek: g.week }; return ok({ ...g, cash: r2(cash + d.value), empire: seedPipeline(closeVenture(e, done), g.week) }, `${v.name} verkauft: +${Math.round(d.value).toLocaleString('de-DE')} €.`); }
    patch = { ...patch, valuation: Math.round(v.valuation * 1.3) }; msg = `${v.name}: Angebot abgelehnt – Kurs auf IPO.`;
  } else {
    if (accept) { patch = { ...patch, quality: r2(0.2 + rand(g.week + v.invested) * 0.8), valuation: Math.round(v.valuation * 0.7) }; msg = `${v.name}: Pivot gestartet.`; } else msg = `${v.name}: Kurs gehalten.`;
  }
  return ok(patchVenture({ ...g, cash: r2(cash) }, e, id, patch), msg);
}
function makeDecision(v: Venture, week: number): VentureDecision {
  const x = (k: number) => rand(week * 131 + v.invested + k), roll = x(1);
  if (v.stage < STAGES.length - 1 && roll < 0.6) { const value = Math.round(v.valuation * (1.4 + v.quality * 1.0 + x(2) * 0.5)); return { kind: 'round', value, cost: Math.round(v.ownership * value * 0.2), expires: week + 3 }; }
  if (roll < 0.75) return { kind: 'crisis', value: 0, cost: Math.max(5000, Math.round(v.invested * 0.2)), expires: week + 3 };
  if (roll < 0.9) return { kind: 'offer', value: Math.round(ventureStake(v) * (1.2 + x(3) * 0.8)), cost: 0, expires: week + 3 };
  return { kind: 'pivot', value: 0, cost: 0, expires: week + 3 };
}
/** CFO picks the sensible option automatically; otherwise unanswered decisions default to "no". */
function autoChoice(g: GameState, v: Venture): boolean {
  const d = v.decision!; if (!isExec(g, 'cfo')) return false;
  if (d.kind === 'round' || d.kind === 'crisis') return g.cash > d.cost * 4 && v.quality >= 0.35;
  if (d.kind === 'offer') return v.quality < 0.55;
  return v.quality < 0.35;
}
export function stepVentures(g: GameState) {
  let e = empireOf(g); let income = 0, cost = 0; const notes: string[] = [];
  for (const v0 of [...e.ventures]) {
    const v = e.ventures.find(x => x.id === v0.id); if (!v) continue;
    if (v.status === 'open') { if (g.week > v.openUntil) e = { ...e, ventures: e.ventures.filter(x => x.id !== v.id) }; continue; }
    if (v.decision) {
      if (g.week >= v.decision.expires || isExec(g, 'cfo')) {
        const r = resolveVenture({ ...g, cash: g.cash + income - cost, empire: e }, v.id, autoChoice(g, v));
        if (r.ok) { const delta = r.state.cash - (g.cash + income - cost); if (delta > 0) income += delta; else cost -= delta; e = empireOf(r.state); notes.push(`${isExec(g, 'cfo') ? 'CFO' : 'Frist'}: ${r.reason}`); }
      }
      continue;
    }
    if (g.week < v.nextWeek) continue;
    const x = (k: number) => rand(g.week * 977 + vh(v) + k);
    if (x(1) < (1 - v.quality) * 0.3 + 0.03) {
      const sued = x(2) < 0.3, fee = sued ? Math.round(v.invested * 0.15) : 0;
      cost += fee; e = closeVenture(e, { ...v, status: sued ? 'sued' : 'failed', closedWeek: g.week, payout: -fee });
      notes.push(sued ? `${v.name} insolvent – Anlegerklage kostet ${fee.toLocaleString('de-DE')} €.` : `${v.name} ist gescheitert – Einsatz verloren.`); continue;
    }
    if (v.stage >= STAGES.length - 1) {
      const ipo = v.quality > 0.5 && x(3) < 0.75, val = Math.round(v.valuation * (ipo ? 1.3 + x(4) * 1.2 : 1.05)), payout = Math.round(val * v.ownership);
      income += payout; e = closeVenture(e, { ...v, valuation: val, status: ipo ? 'ipo' : 'sold', payout, closedWeek: g.week });
      notes.push(ipo ? `🔔 IPO! ${v.name} geht an die Börse: +${payout.toLocaleString('de-DE')} €.` : `${v.name} an Konzern verkauft: +${payout.toLocaleString('de-DE')} €.`); continue;
    }
    e = { ...e, ventures: e.ventures.map(z => z.id === v.id ? { ...z, decision: makeDecision(v, g.week) } : z) };
    notes.push(`${v.name}: ${DECISION_TEXT[e.ventures.find(z => z.id === v.id)!.decision!.kind].title} – Entscheidung nötig.`);
  }
  if (e.ventures.filter(v => v.status === 'open').length < 4 && rand(g.week * 17) < 0.7) e = spawnVenture(e, g.week);
  return { e: seedPipeline(e, g.week), income: r2(income), cost: r2(cost), notes };
}

// ---------- supply chain ----------
export const SUPPLY: Record<SupplyKey, { label: string; group: 'roastery' | 'farm'; base: number; effect: string; levels: string[] }> = {
  roaster: { label: 'Trommelröster', group: 'roastery', base: 60_000, effect: '+2.500 € B2B-Überschuss/Wo je Stufe (wächst mit der Kette)', levels: ['Shop-Röster', 'Doppeltrommel', 'Industrie-Linie', 'Großröster-Hub'] },
  sorter: { label: 'Optischer Bohnensortierer', group: 'roastery', base: 40_000, effect: '−8 % Bohnenkosten & +1 % Café-Umsatz je Stufe', levels: ['Handauslese', 'Sortierband', 'Kamera-Sortierer', 'KI-Sortierer'] },
  eco: { label: 'Wärmerückgewinnung', group: 'roastery', base: 30_000, effect: '−6 % Bohnen- & Energiekosten je Stufe', levels: ['Standard', 'Katalysator', 'Wärmetauscher', 'CO2-neutral'] },
  irrigation: { label: 'Präzisionsbewässerung', group: 'farm', base: 50_000, effect: '+1.200 € Exporterlös/Wo je Plantage & Stufe', levels: ['Regenfeldbau', 'Tropfschläuche', 'Sensor-Bewässerung', 'Satelliten-Steuerung'] },
  mill: { label: 'Micro-Lot-Nassmühle', group: 'farm', base: 45_000, effect: '+1,5 % Café-Umsatz je Stufe (Spitzenbohnen)', levels: ['Trockenaufbereitung', 'Nassmühle', 'Honey-Process', 'Micro-Lot-Labor'] },
  agro: { label: 'Schattenbaum-Agroforst', group: 'farm', base: 25_000, effect: '+0,25 Ruf/Woche je Stufe', levels: ['Monokultur', 'Schattenbäume', 'Agroforst', 'Regenwald-Siegel'] },
};
export const SUPPLY_KEYS = Object.keys(SUPPLY) as SupplyKey[];
export const SUPPLY_MAX = 3;
export const supplyCost = (k: SupplyKey, level: number) => SUPPLY[k].base * 2 ** level;
export const plantationCount = (g: GameState) => g.world?.assets.filter(a => a.kind === 'plantation').length ?? 0;
export const supplyReady = (g: GameState, k: SupplyKey) => SUPPLY[k].group === 'roastery' ? g.roastery.owned : plantationCount(g) > 0;
export function upgradeSupply(g: GameState, k: SupplyKey): ActionResult {
  const e = empireOf(g), lvl = e.supply[k];
  if (!supplyReady(g, k)) return no(g, SUPPLY[k].group === 'roastery' ? 'Erst eine Rösterei kaufen.' : 'Erst eine Plantage erwerben (HQ → Entwicklung).');
  if (lvl >= SUPPLY_MAX) return no(g, 'Bereits höchste Stufe.');
  const cost = supplyCost(k, lvl); if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  return ok({ ...g, cash: r2(g.cash - cost), empire: { ...e, supply: { ...e.supply, [k]: lvl + 1 } } }, `${SUPPLY[k].label}: ${SUPPLY[k].levels[lvl + 1]} installiert.`);
}
/** Weekly supply effect: owning the roastery alone already saves 20 % of bean costs; upgrades stack on top. */
export function supplyWeekly(g: GameState) {
  const s = empireOf(g).supply, beans = g.lastReport?.costBeans ?? 0, cafes = g.stores.reduce((n, x) => n + x.weeklyRevenue, 0), farms = plantationCount(g);
  const saveRate = g.roastery.owned ? Math.min(0.7, 0.2 + s.sorter * 0.08 + s.eco * 0.06) : 0;
  const savings = r2(beans * saveRate);
  const b2b = g.roastery.owned ? r2(s.roaster * 2500 * (1 + g.stores.length / 20)) : 0;
  const exportIncome = r2(farms * (600 + s.irrigation * 1200));
  const quality = r2(cafes * ((g.roastery.owned ? s.sorter * 0.01 : 0) + (farms ? s.mill * 0.015 : 0)));
  const reputation = farms ? s.agro * 0.25 : 0;
  return { savings, b2b, exportIncome, quality, reputation, total: r2(savings + b2b + exportIncome + quality), saveRate };
}

// ---------- chain actions (from 5 stores) ----------
export const CHAIN_MIN = 5;
const chainGate = (g: GameState) => g.stores.length >= CHAIN_MIN;
export function chainGear(g: GameState, c: GearCategory): ActionResult {
  if (!chainGate(g)) return no(g, `Ketten-Aktionen ab ${CHAIN_MIN} Filialen.`);
  let n = g, count = 0; for (const s of g.stores) { const r = upgradeGear(n, s.id, c); if (r.ok) { n = r.state; count++; } }
  if (!count) return no(g, 'Keine Filiale kann diese Ausstattung gerade verbessern (Stufe, Ausbau oder Geld fehlt).');
  const rebate = r2((g.cash - n.cash) * 0.1);
  return ok({ ...n, cash: r2(n.cash + rebate) }, `${GEAR[c].label}: ${count} Filialen verbessert · Mengenrabatt ${Math.round(rebate).toLocaleString('de-DE')} €.`);
}
export function chainStage(g: GameState): ActionResult {
  if (!chainGate(g)) return no(g, `Ketten-Aktionen ab ${CHAIN_MIN} Filialen.`);
  let n = g, count = 0; for (const s of g.stores) { const r = stageUpgrade(n, s.id); if (r.ok) { n = r.state; count++; } }
  return count ? ok(n, `${count} Filialen eine Stufe ausgebaut.`) : no(g, 'Gerade kann keine Filiale ausgebaut werden.');
}
export function chainPrice(g: GameState, delta: number): ActionResult {
  if (!chainGate(g)) return no(g, `Ketten-Aktionen ab ${CHAIN_MIN} Filialen.`);
  return ok({ ...g, stores: g.stores.map(s => ({ ...s, pricePerCup: r2(Math.max(1.5, Math.min(12, s.pricePerCup + delta))) })) }, `Kettenpreis ${delta > 0 ? 'erhöht' : 'gesenkt'} (${delta > 0 ? '+' : ''}${delta.toFixed(2).replace('.', ',')} €).`);
}
export function chainStaff(g: GameState): ActionResult {
  if (!chainGate(g)) return no(g, `Ketten-Aktionen ab ${CHAIN_MIN} Filialen.`);
  let n = g, hires = 0;
  for (const s of g.stores) for (let i = s.employees.length; i < GAME_CONFIG.TIER_REQUIRED_STAFF[s.tier]; i++) { const r = hireEmployee(n, s.id, 'barista'); if (!r.ok) break; n = r.state; hires++; }
  return hires ? ok(n, `${hires} Baristas kettenweit eingestellt.`) : no(g, 'Alle Filialen sind voll besetzt.');
}

// ---------- property & rivals ----------
const building = (id: string) => MASTER.cities.flatMap(c => c.buildings).find(b => b.id === id);
export const propertyPrice = (districtId: string) => building(districtId)?.purchasePrice ?? 0;
export function buyProperty(g: GameState, storeId: string): ActionResult {
  const s = g.stores.find(x => x.id === storeId); if (!s) return no(g, 'Filiale nicht gefunden.');
  if (s.propertyBookValue) return no(g, 'Das Gebäude gehört dir bereits.');
  const price = propertyPrice(s.districtId); if (!price) return no(g, 'Für diesen Altstandort gibt es kein Kaufangebot.');
  if (g.cash < price) return no(g, 'Nicht genug Barvermögen.');
  return ok({ ...g, cash: r2(g.cash - price), stores: g.stores.map(x => x.id === storeId ? { ...x, propertyBookValue: price } : x) }, `${s.name}: Gebäude gekauft – ab jetzt keine Miete mehr.`);
}
export function sellProperty(g: GameState, storeId: string): ActionResult {
  const s = g.stores.find(x => x.id === storeId); if (!s?.propertyBookValue) return no(g, 'Kein eigenes Gebäude.');
  const cash = r2(s.propertyBookValue * 0.9);
  return ok({ ...g, cash: r2(g.cash + cash), stores: g.stores.map(x => x.id === storeId ? { ...x, propertyBookValue: 0 } : x) }, `${s.name}: Sale-and-Lease-Back · +${Math.round(cash).toLocaleString('de-DE')} €, ab jetzt wieder Miete.`);
}
/** Open a store and give it a first barista so it earns from week one. */
export function openStaffedStore(g: GameState, cityId: string, districtId: string, tier: StoreTier, purchase = false): ActionResult {
  const r = openStore(g, cityId, districtId, tier, purchase); if (!r.ok) return r;
  const s = r.state.stores.at(-1)!; const h = hireEmployee(r.state, s.id, 'barista');
  return h.ok ? { ...h, reason: r.reason } : r;
}
export const takeoverCost = (buildingId: string) => { const b = building(buildingId); return b ? Math.round(b.purchasePrice * 0.25 + b.weeklyRent * 26) : 0; };
export function takeoverRivalSite(g: GameState, buildingId: string): ActionResult {
  const rival = g.world.occupants[buildingId]; if (!rival) return no(g, 'Hier sitzt kein Konkurrent.');
  const b = building(buildingId), city = MASTER.cities.find(c => c.buildings.some(x => x.id === buildingId)); if (!b || !city) return no(g, 'Standort nicht gefunden.');
  const fee = takeoverCost(buildingId), district = g.cities.find(c => c.id === city.cityId)?.districts.find(d => d.id === buildingId);
  if (!district) return no(g, 'Standort nicht gefunden.');
  if (g.cash < fee + storeOpeningCost(district, 1)) return no(g, 'Nicht genug Barvermögen für Ablöse und Eröffnung.');
  const freed = { ...g, cash: r2(g.cash - fee), world: { ...g.world, occupants: Object.fromEntries(Object.entries(g.world.occupants).filter(([k]) => k !== buildingId)) } };
  const r = openStaffedStore(freed, city.cityId, buildingId, 1);
  return r.ok ? { ...r, reason: `${b.name}: Konkurrent abgelöst und übernommen.` } : no(g, r.reason);
}
/** Company takeover hands over every rival café as a staffed own store (no extra opening cost). */
export function acquireRivalWithStores(g: GameState, companyId: string, price: number): ActionResult {
  const sites = Object.entries(g.world.occupants).filter(([, o]) => o === companyId).map(([id]) => id);
  const r = acquireRival(g, companyId, price); if (!r.ok) return r;
  let n = r.state, taken = 0;
  for (const id of sites) {
    const city = n.cities.find(c => c.districts.some(d => d.id === id)), d = city?.districts.find(x => x.id === id); if (!city || !d) continue;
    const tier = Math.min(2, d.maxStoreTier) as StoreTier, cost = storeOpeningCost(d, tier);
    const o = openStaffedStore({ ...n, cash: n.cash + cost }, city.id, id, tier);
    if (o.ok) { n = { ...o.state, cash: r2(o.state.cash - cost) }; taken++; }
  }
  return { ...r, state: n, reason: `${r.reason}${taken ? ` · ${taken} Filialen übernommen` : ''}` };
}

// ---------- marketing auto-renew ----------
export const autoKey = (kind: CampaignKind, cityId: string) => `${kind}|${cityId}`;
export function toggleAutoCampaign(g: GameState, kind: CampaignKind, cityId: string): GameState {
  const e = empireOf(g), k = autoKey(kind, cityId);
  return { ...g, empire: { ...e, auto: e.auto.includes(k) ? e.auto.filter(x => x !== k) : [...e.auto, k] } };
}
export const campaignDiscount = (g: GameState) => isExec(g, 'cmo') ? 0.85 : 1;

// ---------- weekly ----------
function patchWeek(g: GameState, income: number, cost: number, notes: string[]): GameState {
  const net = r2(income - cost), hist = g.management.history, row = hist.at(-1);
  let n: GameState = { ...g, cash: r2(g.cash + net) };
  if (row) n = { ...n, management: { ...n.management, openingCash: n.cash, history: [...hist.slice(0, -1), { ...row, other: r2(row.other + income), upkeep: r2(row.upkeep + cost), profit: r2(row.profit + net), cashEnd: n.cash, operating: r2(row.operating + net) }] } };
  if (n.lastReport) n = { ...n, lastReport: { ...n.lastReport, revenueCapital: r2(n.lastReport.revenueCapital + income), revenueTotal: r2(n.lastReport.revenueTotal + income), costLuxuryUpkeep: r2(n.lastReport.costLuxuryUpkeep + cost), costTotal: r2(n.lastReport.costTotal + cost), netIncome: r2(n.lastReport.netIncome + net), notes: [...n.lastReport.notes, ...notes] } };
  if (n.progress?.summary) n = { ...n, progress: { ...n.progress, summary: { ...n.progress.summary, profit: r2(n.progress.summary.profit + net) } } };
  return n;
}
export function processEmpireWeek(state: GameState, exp: ExpansionState) {
  const r = processProgressWeek(state, exp);
  if (r.game.week === state.week) return r;
  const kept = r.game.empire ?? state.empire;
  let g: GameState = { ...r.game, empire: empireOf(kept ? { ...r.game, empire: kept } : r.game) }, x = r.exp, income = 0, cost = 0; const notes: string[] = [];
  const sup = supplyWeekly(g); income += sup.total;
  if (sup.total > 0) notes.push(`Lieferkette: ${Math.round(sup.savings).toLocaleString('de-DE')} € Bohnen gespart · ${Math.round(sup.b2b + sup.exportIncome + sup.quality).toLocaleString('de-DE')} € Zusatzerlös.`);
  const v = stepVentures(g); g = { ...g, empire: v.e }; income += v.income; cost += v.cost; notes.push(...v.notes);
  const cafes = g.stores.reduce((n, s) => n + s.weeklyRevenue, 0);
  if (isExec(g, 'coo')) { const b = r2(cafes * 0.04); income += b; notes.push(`COO-Effizienz: +${Math.round(b).toLocaleString('de-DE')} €.`); }
  if (isExec(g, 'cmo') && x.campaigns.length) { const b = r2(cafes * 0.03); income += b; notes.push(`CMO-Kampagnensteuerung: +${Math.round(b).toLocaleString('de-DE')} €.`); }
  g = patchWeek(g, income, cost, notes);
  g = { ...g, brandReputation: Math.min(100, r2(g.brandReputation + sup.reputation)) };
  // auto-renewing campaigns (charged via the same accounting row)
  let campCost = 0; const renewed: string[] = [];
  for (const k of empireOf(g).auto) {
    const [kind, cityId] = k.split('|') as [CampaignKind, string]; if (!CAMPAIGNS[kind] || x.campaigns.some(c => c.kind === kind && c.cityId === cityId)) continue;
    const price = r2(CAMPAIGNS[kind].cost * campaignDiscount(g)); if (g.cash - campCost < price) continue;
    const s = startCampaign({ ...g, cash: Number.MAX_SAFE_INTEGER }, x, kind, cityId); if (typeof s === 'string') continue;
    x = s.exp; campCost += price; renewed.push(`${CAMPAIGNS[kind].label} (${g.cities.find(c => c.id === cityId)?.name ?? cityId})`);
  }
  // CTO starts the next research automatically; CFO pays down debt from surplus cash
  let extra = 0; const execNotes: string[] = [];
  if (isExec(g, 'cto') && !cafeOf(g).research.active) {
    const next = RESEARCH.filter(n => researchAvailable(g, n.id)).sort((a, b) => a.tier - b.tier)[0];
    if (next && g.cash - campCost > researchCost(next.tier) * 3) { const s = startResearch({ ...g, cash: g.cash - campCost }, next.id); if (s.ok) { extra += (g.cash - campCost) - s.state.cash; g = { ...s.state, cash: g.cash }; execNotes.push(`CTO startet „${next.name}“.`); } }
  }
  if (campCost || extra) { if (renewed.length) execNotes.push(`Auto-Kampagnen verlängert: ${renewed.join(', ')}.`); g = patchWeek(g, 0, campCost + extra, execNotes); }
  if (isExec(g, 'cfo') && g.debt > 0 && g.cash > 150_000) { const pay = r2(Math.min(g.debt, (g.cash - 150_000) * 0.25)); const p = repayLoan(g, pay); if (p.ok) { const row = p.state.management.history.at(-1); g = { ...p.state, management: { ...p.state.management, openingCash: p.state.cash, history: row ? [...p.state.management.history.slice(0, -1), { ...row, cashEnd: p.state.cash, financing: r2(row.financing - pay) }] : p.state.management.history }, lastReport: p.state.lastReport ? { ...p.state.lastReport, notes: [...p.state.lastReport.notes, `CFO tilgt ${Math.round(pay).toLocaleString('de-DE')} € Kredit.`] } : null }; } }
  return { game: g, exp: x };
}
