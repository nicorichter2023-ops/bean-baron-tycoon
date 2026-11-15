import type { ActionResult, GameState, GameEvent, Store } from './types';
import { applyEventChoice, upgradeStore } from './engine';
import { processManagementWeek } from './management';
import { cafeWeek } from './cafe';
import type { ExpansionState } from './expansion';
import { RANKS, STAGES, stg, rk, firstStageOfTier, leverUnlocked, legacyStage, maxStage, rankInfo, tierOfStage, type LeverId, type Stage } from './unlocks';

export type Hours = 'early' | 'standard' | 'late';
export type Specialization = 'none' | 'business' | 'students' | 'tourists' | 'connoisseur';
export interface StoreLevers { stage: Stage; hours: Hours; focus: -1 | 0 | 1; specialization: Specialization; loyalty: boolean; loyaltyWeeks: number; guestsTotal: number }
export type EventFrequency = 'rare' | 'normal' | 'often';
export type GoalKind = 'guests' | 'profit' | 'reputation' | 'openStore' | 'upgrade';
export interface WeeklyGoal { kind: GoalKind; target: number; label: string; done: boolean }
export interface WeekSummary { week: number; profit: number; guests: number; goalsDone: number; reward: number; rankUp: string | null; achievements: string[]; badges: string[]; leverNet: number; eventNote: string | null }
export interface ProgressState {
  rank: number; stores: Record<string, StoreLevers>;
  goals: WeeklyGoal[]; goalStreak: number; goalBaseline: { stores: number; upgrades: number };
  achievements: string[]; upgradesDone: number;
  beanContract: { price: number; untilWeek: number } | null;
  eventFrequency: EventFrequency; lastEventWeek: number; eventHistory: { id: string; week: number }[];
  settings: { fontScale: 1 | 1.15 | 1.3; reduceMotion: boolean; highContrast: boolean };
  tutorialStep: number; extraCities: string[]; summary: WeekSummary | null;
}
const r2 = (n: number) => Math.round(n * 100) / 100;
export const defaultLevers = (tier: number, stage?: Stage): StoreLevers => ({ stage: stage ?? firstStageOfTier(tier), hours: 'standard', focus: 0, specialization: 'none', loyalty: false, loyaltyWeeks: 0, guestsTotal: 0 });
export function createProgress(g: Pick<GameState, 'stores' | 'week'>, legacy = false): ProgressState {
  return { rank: 1, stores: Object.fromEntries(g.stores.map(s => [s.id, defaultLevers(s.tier, legacy ? legacyStage(s.tier) : undefined)])),
    goals: [], goalStreak: 0, goalBaseline: { stores: g.stores.length, upgrades: 0 }, achievements: [], upgradesDone: 0, beanContract: null,
    eventFrequency: 'normal', lastEventWeek: g.week, eventHistory: [], settings: { fontScale: 1, reduceMotion: false, highContrast: false },
    tutorialStep: legacy ? 99 : 0, extraCities: [], summary: null };
}
export const progressOf = (g: GameState): ProgressState => g.progress ?? createProgress(g, true);
export const leversOf = (g: GameState, s: Store): StoreLevers => {
  const l = progressOf(g).stores[s.id] ?? defaultLevers(s.tier);
  return tierOfStage(l.stage) === s.tier ? l : { ...l, stage: firstStageOfTier(s.tier) };
};
export const stageLabel = (g: GameState, s: Store) => stg(leversOf(g, s).stage - 1).label;

// ---------- metrics & ranks ----------
export function metrics(g: GameState) {
  return { stores: g.stores.length, cities: new Set(g.stores.map(s => s.cityId)).size, reputation: g.brandReputation, valuation: g.companyValuation,
    weeklyRevenue: g.stores.reduce((n, s) => n + s.weeklyRevenue, 0), guests: g.stores.reduce((n, s) => n + s.customersServedLastWeek, 0) };
}
export function rankProgress(g: GameState) {
  const p = progressOf(g), next = rk(p.rank);
  if (!next) return { next: null, parts: [], ratio: 1 };
  const m = metrics(g);
  const parts = (Object.keys(next.req) as (keyof typeof next.req)[]).filter(k => next.req[k] > 0).map(k => ({ key: k, have: m[k], need: next.req[k], ok: m[k] >= next.req[k] }));
  const ratio = parts.reduce((n, x) => n + Math.min(1, x.have / x.need), 0) / Math.max(1, parts.length);
  return { next, parts, ratio };
}
export const RANK_LABEL: Record<string, string> = { stores: 'Filialen', cities: 'Städte', reputation: 'Ruf', valuation: 'Firmenwert', weeklyRevenue: 'Wochenumsatz' };

// ---------- achievements (40) ----------
const LADDERS: [string, keyof ReturnType<typeof metrics> | 'week', number[], (v: number) => string][] = [
  ['stores', 'stores', [1, 3, 5, 10, 20, 30, 45], v => `${v} Filialen`],
  ['cities', 'cities', [2, 3, 5, 8, 12, 16, 20], v => `In ${v} Städten`],
  ['value', 'valuation', [100e3, 500e3, 1e6, 5e6, 20e6, 50e6, 100e6], v => `Firmenwert ${v >= 1e6 ? v / 1e6 + ' Mio' : v / 1e3 + ' Tsd'} €`],
  ['guests', 'guests', [500, 2000, 5000, 10000, 25000, 50000], v => `${v.toLocaleString('de-DE')} Gäste/Woche`],
  ['rep', 'reputation', [50, 60, 70, 80, 90, 95], v => `Ruf ${v}`],
  ['weeks', 'week', [10, 25, 52, 104, 208, 312], v => `${v} Wochen im Geschäft`],
];
export const ACHIEVEMENTS = [...LADDERS.flatMap(([id, , steps, label]) => steps.map(v => ({ id: `${id}-${v}`, label: label(v) }))), { id: 'profit-1', label: 'Erste Gewinnwoche' }];
export const achievementBonus = (g: GameState) => progressOf(g).achievements.length * 0.004;
function earnedAchievements(g: GameState, profit: number) {
  const m = { ...metrics(g), week: g.week };
  const ids = LADDERS.flatMap(([id, key, steps]) => steps.filter(v => m[key] >= v).map(v => `${id}-${v}`));
  if (profit > 0) ids.push('profit-1');
  return ids;
}

// ---------- weekly goals ----------
export function makeGoals(g: GameState): WeeklyGoal[] {
  const m = metrics(g), profit = g.lastReport?.netIncome ?? 0;
  const pool: WeeklyGoal[] = [
    { kind: 'guests', target: Math.max(150, Math.round(m.guests * 1.08 / 10) * 10), label: '', done: false },
    { kind: 'profit', target: Math.max(500, Math.round(Math.max(profit, 0) * 1.1 / 100) * 100), label: '', done: false },
    { kind: 'reputation', target: Math.min(100, Math.floor(g.brandReputation) + 1), label: '', done: false },
    { kind: 'openStore', target: 1, label: '', done: false },
    { kind: 'upgrade', target: 1, label: '', done: false },
  ];
  const offset = g.week % 3;
  return [pool[0], pool[1 + (offset % 2)], pool[3 + (g.week % 2)]].filter((x): x is WeeklyGoal => Boolean(x)).map(x => ({ ...x, label: goalLabel(x) }));
}
const goalLabel = (x: WeeklyGoal) => x.kind === 'guests' ? `${x.target.toLocaleString('de-DE')} Gäste bedienen` : x.kind === 'profit' ? `${x.target.toLocaleString('de-DE')} € Wochengewinn` : x.kind === 'reputation' ? `Ruf auf ${x.target} steigern` : x.kind === 'openStore' ? 'Eine Filiale eröffnen' : 'Eine Filiale ausbauen';

// ---------- levers ----------
export function leverEffect(l: StoreLevers, s: Store, week: number) {
  let rev = STAGES.slice(firstStageOfTier(s.tier) - 1, l.stage).reduce((n, st) => n + st.bonus, 0), cost = STAGES.slice(firstStageOfTier(s.tier) - 1, l.stage).reduce((n, st) => n + st.upkeep, 0), rep = 0;
  const wages = s.employees.length * 450;
  if (l.hours === 'early') { rev += 0.08; cost += wages * 0.06; }
  if (l.hours === 'late') { rev += 0.12; cost += wages * 0.12; rep -= 0.05; }
  if (l.focus === 1) { rev -= 0.06; rep += 0.25; } else if (l.focus === -1) { rev += 0.09; rep -= 0.25; }
  const summer = (week % 52) > 20 && (week % 52) < 36;
  rev += { none: 0, business: 0.1, students: 0.06, tourists: summer ? 0.16 : -0.04, connoisseur: (s.equipment?.espresso ?? 0) >= 1 ? 0.08 : -0.05 }[l.specialization];
  if (l.specialization === 'students') rep -= 0.05;
  if (l.specialization === 'connoisseur') rep += 0.1;
  if (l.specialization === 'business') cost += 120;
  if (l.loyalty) { rev += Math.min(0.15, l.loyaltyWeeks * 0.01) - 0.04; rep += 0.05; }
  return { revenue: r2(s.weeklyRevenue * rev), cost: r2(cost), reputation: rep };
}

// ---------- actions ----------
const ok = (state: GameState, reason: string): ActionResult => ({ state, ok: true, reason });
const no = (state: GameState, reason: string): ActionResult => ({ state, ok: false, reason });
const withLevers = (g: GameState, id: string, l: Partial<StoreLevers>): GameState => {
  const p = progressOf(g), s = g.stores.find(x => x.id === id)!;
  return { ...g, progress: { ...p, stores: { ...p.stores, [id]: { ...leversOf(g, s), ...l } } } };
};
export function stageUpgrade(g: GameState, id: string): ActionResult {
  const s = g.stores.find(x => x.id === id); if (!s) return no(g, 'Filiale nicht gefunden.');
  const l = leversOf(g, s); const next = (l.stage + 1) as Stage;
  if (l.stage >= 7) return no(g, 'Höchste Stufe erreicht.');
  if (next > maxStage(g)) return no(g, `„${stg(next - 1).label}“ wird mit einem höheren Firmenrang freigeschaltet.`);
  const p = progressOf(g);
  if (tierOfStage(next) > s.tier) {
    const r = upgradeStore(g, id); if (!r.ok) return r;
    const done = withLevers(r.state, id, { stage: next });
    return ok({ ...done, progress: { ...done.progress!, upgradesDone: p.upgradesDone + 1 } }, `${s.name}: jetzt ${stg(next - 1).label}.`);
  }
  const cost = stg(next - 1).cost;
  if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  const done = withLevers({ ...g, cash: r2(g.cash - cost) }, id, { stage: next });
  return ok({ ...done, progress: { ...done.progress!, upgradesDone: p.upgradesDone + 1 } }, `${s.name}: jetzt ${stg(next - 1).label}.`);
}
export function setLever(g: GameState, id: string, lever: Exclude<LeverId, 'beanContract'>, value: StoreLevers[keyof StoreLevers]): ActionResult {
  if (!leverUnlocked(g, lever)) return no(g, 'Dieser Hebel wird mit einem höheren Firmenrang freigeschaltet.');
  const s = g.stores.find(x => x.id === id); if (!s) return no(g, 'Filiale nicht gefunden.');
  if (lever === 'specialization' && leversOf(g, s).stage < 4 && value !== 'none') return no(g, 'Spezialisierung ab Stufe „Kiez-Café“.');
  return ok(withLevers(g, id, { [lever]: value, ...(lever === 'loyalty' ? { loyaltyWeeks: 0 } : {}) } as Partial<StoreLevers>), 'Einstellung gespeichert.');
}
export function signBeanContract(g: GameState): ActionResult {
  if (!leverUnlocked(g, 'beanContract')) return no(g, 'Bohnen-Festpreis ab Rang „Regionale Kette“.');
  const p = progressOf(g); if (p.beanContract && p.beanContract.untilWeek > g.week) return no(g, 'Es läuft bereits ein Festpreisvertrag.');
  const fee = r2(g.stores.length * 40 * g.market.futuresPricePerKg * 0.05 * 12 / 12);
  if (g.cash < fee) return no(g, 'Nicht genug Barvermögen.');
  return ok({ ...g, cash: r2(g.cash - fee), progress: { ...p, beanContract: { price: g.market.futuresPricePerKg, untilWeek: g.week + 12 } } }, `Festpreis ${g.market.futuresPricePerKg.toFixed(2)} €/kg für 12 Wochen gesichert.`);
}
export function setSettings(g: GameState, patch: Partial<ProgressState['settings']> & { eventFrequency?: EventFrequency; tutorialStep?: number }): GameState {
  const p = progressOf(g); const { eventFrequency, tutorialStep, ...settings } = patch;
  return { ...g, progress: { ...p, settings: { ...p.settings, ...settings }, eventFrequency: eventFrequency ?? p.eventFrequency, tutorialStep: tutorialStep ?? p.tutorialStep } };
}

// ---------- events ----------
export const EVENT_RULES: Record<EventFrequency, { chance: number; cooldown: number }> = { rare: { chance: 0.12, cooldown: 5 }, normal: { chance: 0.22, cooldown: 3 }, often: { chance: 0.4, cooldown: 2 } };
export const isMajorEvent = (e: GameEvent) => { const c = e.choices.map(x => x.cashImpact); return e.choices.length > 1 && (Math.max(...c) - Math.min(...c) >= 3000 || e.choices.some(x => Math.abs(x.reputationImpact) >= 5)); };
const rand = (seed: number) => { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
/** Decides whether the engine's drawn event happens; minor events resolve automatically as a log note. */
export function gateEvent(g: GameState, p: ProgressState): { game: GameState; p: ProgressState; note: string | null } {
  const e = g.pendingEvent; if (!e) return { game: g, p, note: null };
  const rule = EVENT_RULES[p.eventFrequency];
  const recent = p.eventHistory.some(h => h.id === e.id && g.week - h.week < 20);
  if (recent || g.week - p.lastEventWeek < rule.cooldown || rand(g.week * 7919 + 13) > rule.chance) return { game: { ...g, pendingEvent: null }, p, note: null };
  const np = { ...p, lastEventWeek: g.week, eventHistory: [...p.eventHistory, { id: e.id, week: g.week }].slice(-40) };
  if (isMajorEvent(e)) return { game: g, p: np, note: null };
  const r = applyEventChoice(g, 0);
  return { game: r.state, p: np, note: `${e.title}: ${e.choices[0]?.text ?? ''}` };
}

// ---------- weekly loop ----------
export function processProgressWeek(state: GameState, exp: ExpansionState) {
  const p0 = progressOf(state);
  const result = processManagementWeek(state, exp);
  // base engine drops unknown fields: keep persisted café gear/design/menu
  let g: GameState = result.game.cafe || !state.cafe ? result.game : { ...result.game, cafe: state.cafe };
  if (g.week === state.week) return { game: { ...g, progress: p0 }, exp: result.exp };
  let p: ProgressState = { ...p0, stores: { ...p0.stores } };
  // levers + stages
  let leverRev = 0, leverCost = 0, rep = 0;
  for (const s of g.stores) {
    const l = { ...(p.stores[s.id] ?? defaultLevers(s.tier)) };
    if (tierOfStage(l.stage) !== s.tier) l.stage = firstStageOfTier(s.tier);
    const fx = leverEffect(l, s, g.week);
    leverRev += fx.revenue; leverCost += fx.cost; rep += fx.reputation;
    p.stores[s.id] = { ...l, loyaltyWeeks: l.loyalty ? l.loyaltyWeeks + 1 : 0, guestsTotal: l.guestsTotal + s.customersServedLastWeek };
  }
  const revenue = g.stores.reduce((n, s) => n + s.weeklyRevenue, 0);
  leverRev += revenue * achievementBonus(g);
  const cw = cafeWeek(g); leverRev += cw.revenue; leverCost += cw.cost; rep += cw.reputation; g = { ...g, cafe: cw.cafe };
  if (p.beanContract && p.beanContract.untilWeek >= g.week) leverRev += (g.market.futuresPricePerKg - p.beanContract.price) * g.stores.length * 40;
  // goals
  const m = metrics(g), profit = g.lastReport?.netIncome ?? 0;
  const goals = p.goals.map(x => ({ ...x, done: x.kind === 'guests' ? m.guests >= x.target : x.kind === 'profit' ? profit + leverRev - leverCost >= x.target : x.kind === 'reputation' ? g.brandReputation >= x.target : x.kind === 'openStore' ? g.stores.length > p.goalBaseline.stores : p.upgradesDone > p.goalBaseline.upgrades }));
  const done = goals.filter(x => x.done).length;
  const streak = goals.length && done >= 2 ? p.goalStreak + 1 : 0;
  const reward = r2(done * Math.max(300, revenue * 0.04) * Math.min(2, 1 + streak * 0.1));
  const net = r2(leverRev + reward - leverCost);
  g = { ...g, cash: r2(g.cash + net), brandReputation: Math.max(0, Math.min(100, r2(g.brandReputation + rep))) };
  // reconcile accounting: lever/goal income goes to "other", lever costs to upkeep
  const hist = g.management.history, row = hist.at(-1);
  if (row && net) {
    const nr = { ...row, other: r2(row.other + leverRev + reward), upkeep: r2(row.upkeep + leverCost), profit: r2(row.profit + net), cashEnd: g.cash, operating: r2(row.operating + net) };
    g = { ...g, management: { ...g.management, openingCash: g.cash, history: [...hist.slice(0, -1), nr] },
      lastReport: g.lastReport ? { ...g.lastReport, revenueCapital: r2(g.lastReport.revenueCapital + leverRev + reward), revenueTotal: r2(g.lastReport.revenueTotal + leverRev + reward), costLuxuryUpkeep: r2(g.lastReport.costLuxuryUpkeep + leverCost), costTotal: r2(g.lastReport.costTotal + leverCost), netIncome: r2(g.lastReport.netIncome + net) } : null };
  }
  // ranks (never decrease; one step per week keeps each rank-up a moment)
  let rankUp: string | null = null;
  const rp = rankProgress({ ...g, progress: p });
  if (rp.next && rp.parts.every(x => x.ok)) { p.rank += 1; rankUp = rankInfo(p.rank).name; }
  // achievements & badges
  const earned = earnedAchievements(g, g.lastReport?.netIncome ?? 0).filter(id => !p.achievements.includes(id));
  p.achievements = [...p.achievements, ...earned];
  const badges = g.stores.flatMap(s => [100, 1000, 10000].filter(t => (p0.stores[s.id]?.guestsTotal ?? 0) < t && (p.stores[s.id]?.guestsTotal ?? 0) >= t).map(t => `${s.name}: ${t.toLocaleString('de-DE')} Gäste`));
  // events
  const gated = gateEvent(g, p); g = gated.game; p = gated.p;
  p.goalStreak = streak; p.goals = makeGoals(g); p.goalBaseline = { stores: g.stores.length, upgrades: p.upgradesDone };
  if (p.tutorialStep < 99) p.tutorialStep = Math.min(99, p.tutorialStep + 1);
  p.summary = { week: g.week, profit: g.lastReport?.netIncome ?? 0, guests: m.guests, goalsDone: done, reward, rankUp, achievements: earned.map(id => ACHIEVEMENTS.find(a => a.id === id)?.label ?? id), badges, leverNet: r2(net - reward), eventNote: gated.note };
  if (cw.notes.length && g.lastReport) g = { ...g, lastReport: { ...g.lastReport, notes: [...g.lastReport.notes, ...cw.notes] } };
  if (gated.note && g.lastReport) g = { ...g, lastReport: { ...g.lastReport, notes: [...g.lastReport.notes, `Kurzmeldung – ${gated.note}`] } };
  return { game: { ...g, progress: p }, exp: result.exp };
}

/** Always-visible next sensible step. */
export function nextHint(g: GameState): string {
  const s = g.stores[0];
  if (s && s.employees.length === 0) return `${s.name}: Stelle einen Barista ein.`;
  const rp = rankProgress(g); const missing = rp.parts.find(x => !x.ok);
  const cheap = g.stores.map(x => ({ x, l: leversOf(g, x) })).find(({ l, x }) => l.stage < maxStage(g) && tierOfStage(l.stage + 1) === x.tier && g.cash >= stg(l.stage).cost);
  if (cheap) return `${cheap.x.name} zu „${stg(cheap.l.stage).label}“ ausbauen: +${Math.round(stg(cheap.l.stage).bonus * 100)} % Umsatz.`;
  if (missing?.key === 'stores') return 'Eröffne eine weitere Filiale für den nächsten Rang.';
  if (missing?.key === 'reputation') return 'Stelle eine Filiale auf „Qualität“, um den Ruf zu steigern.';
  if (missing?.key === 'cities') return 'Fliege in eine neue Stadt und eröffne dort.';
  if (missing) return `Nächster Rang: ${RANK_LABEL[missing.key]} auf ${missing.need.toLocaleString('de-DE')} steigern.`;
  return 'Erfülle die Wochenziele für Bonusgeld.';
}
