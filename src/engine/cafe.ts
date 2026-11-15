import type { ActionResult, GameState, Store } from './types';
import { calculateCompanyValuation } from './engine';
import { equipmentOf } from './equipment';
import { researchDuration } from './world';
import { BARISTA_LEVELS, DECOR, DEFAULT_MENU, GEAR, GEAR_KEYS, MENU_ITEMS, MENU_LIMIT, RESEARCH, gearPrice, gearStageNeed, DESIGN_STYLES, PALETTES, TERRACE_STYLES, TERRACE_SHARE, designPrice, researchCost, researchRepBonus, researchRevenueBonus, researchWageFactor, researchWeeks, type DecorSlot, type GearCategory } from './cafeContent';

export interface CafeDesign { style: number; palette: number; terrace: number }
export interface StoreCafe { menu: string[]; gear: Record<GearCategory, number>; decor: Partial<Record<DecorSlot, number>>; xp: number; design?: CafeDesign }
export interface CafeState { stores: Record<string, StoreCafe>; research: { done: string[]; active: { id: string; weeksLeft: number } | null }; rivalPressure: Record<string, number> }
const r2 = (n: number) => Math.round(n * 100) / 100;
export const createCafeState = (): CafeState => ({ stores: {}, research: { done: [], active: null }, rivalPressure: {} });
/** Legacy equipment 0/1/2 maps onto 5 gear levels 0/2/4 so nothing is downgraded. */
export function defaultStoreCafe(s: Store): StoreCafe {
  const e = equipmentOf(s);
  return { menu: [...DEFAULT_MENU], decor: {}, xp: 0, gear: { espresso: e.espresso * 2, grinder: e.grinder * 2, seating: e.interior * 2, vitrine: s.tier >= 2 ? 1 : 0, terrace: s.tier >= 3 ? 1 : 0 } };
}
export const cafeOf = (g: GameState): CafeState => g.cafe ?? createCafeState();
export const storeCafe = (g: GameState, s: Store): StoreCafe => cafeOf(g).stores[s.id] ?? defaultStoreCafe(s);
export const baristaLevel = (xp: number) => BARISTA_LEVELS.filter(t => xp >= t).length;
const stageOf = (g: GameState, s: Store) => g.progress?.stores[s.id]?.stage ?? s.tier * 2;
const ok = (state: GameState, reason: string): ActionResult => ({ state, ok: true, reason });
const no = (state: GameState, reason: string): ActionResult => ({ state, ok: false, reason });
const withStore = (g: GameState, s: Store, patch: Partial<StoreCafe>): GameState => {
  const c = cafeOf(g); return { ...g, cafe: { ...c, stores: { ...c.stores, [s.id]: { ...storeCafe(g, s), ...patch } } } };
};
const find = (g: GameState, id: string) => g.stores.find(s => s.id === id);

export const itemUnlocked = (g: GameState, itemId: string) => { const it = MENU_ITEMS.find(m => m.id === itemId); return !!it && (!it.research || cafeOf(g).research.done.includes(it.research)); };
export function toggleMenuItem(g: GameState, storeId: string, itemId: string): ActionResult {
  const s = find(g, storeId); const it = MENU_ITEMS.find(m => m.id === itemId);
  if (!s || !it) return no(g, 'Nicht gefunden.');
  if (!itemUnlocked(g, itemId)) return no(g, `${it.name} wird durch Forschung freigeschaltet.`);
  const sc = storeCafe(g, s); const has = sc.menu.includes(itemId);
  if (has && sc.menu.filter(id => MENU_ITEMS.find(m => m.id === id)?.kind === 'drink').length <= 1 && it.kind === 'drink') return no(g, 'Mindestens ein Getränk muss auf der Karte bleiben.');
  if (!has && sc.menu.filter(id => MENU_ITEMS.find(m => m.id === id)?.kind === it.kind).length >= MENU_LIMIT[it.kind]) return no(g, `Höchstens ${MENU_LIMIT[it.kind]} ${it.kind === 'drink' ? 'Getränke' : 'Snacks'} pro Karte.`);
  return ok(withStore(g, s, { menu: has ? sc.menu.filter(x => x !== itemId) : [...sc.menu, itemId] }), has ? `${it.name} von der Karte genommen.` : `${it.name} auf der Karte.`);
}
export function gearUpgradeCost(g: GameState, s: Store, c: GearCategory) {
  const lvl = storeCafe(g, s).gear[c]; return lvl >= 4 ? 0 : gearPrice(c, lvl + 1) - gearPrice(c, lvl);
}
export function upgradeGear(g: GameState, storeId: string, c: GearCategory): ActionResult {
  const s = find(g, storeId); if (!s) return no(g, 'Filiale nicht gefunden.');
  const sc = storeCafe(g, s), next = sc.gear[c] + 1;
  if (next > 4) return no(g, 'Höchste Stufe erreicht.');
  if (stageOf(g, s) < gearStageNeed(next)) return no(g, `Stufe ${next + 1} braucht Filialstufe ${gearStageNeed(next)}.`);
  const cost = gearUpgradeCost(g, s, c); if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  const gear = { ...sc.gear, [c]: next };
  const e = equipmentOf(s);
  // keep legacy equipment in sync (only ever upwards) so base capacity/quality effects follow the visible gear
  const equipment = { ...e, bookValue: e.bookValue + cost,
    espresso: Math.max(e.espresso, Math.floor(gear.espresso / 2)) as 0 | 1 | 2, grinder: Math.max(e.grinder, gear.grinder >= 2 ? 1 : 0) as 0 | 1, interior: Math.max(e.interior, Math.floor(gear.seating / 2)) as 0 | 1 | 2 };
  const base = { ...g, cash: r2(g.cash - cost), stores: g.stores.map(x => x.id === s.id ? { ...x, equipment } : x) };
  const state = withStore(base, s, { gear });
  const p = state.progress; const done = p ? { ...state, progress: { ...p, upgradesDone: p.upgradesDone + 1 } } : state;
  return ok({ ...done, companyValuation: calculateCompanyValuation(done) }, `${s.name}: ${GEAR[c].levels[next]} eingebaut.`);
}
export function setDecor(g: GameState, storeId: string, slot: DecorSlot, option: number): ActionResult {
  const s = find(g, storeId); const d = DECOR[slot]; if (!s || !d.options[option]) return no(g, 'Nicht gefunden.');
  const sc = storeCafe(g, s); if (sc.decor[slot] === option) return no(g, 'Bereits gewählt.');
  if (g.cash < d.price) return no(g, 'Nicht genug Barvermögen.');
  return ok(withStore({ ...g, cash: r2(g.cash - d.price) }, s, { decor: { ...sc.decor, [slot]: option } }), `${s.name}: ${d.label} „${d.options[option]?.name}“.`);
}
export const DEFAULT_DESIGN: CafeDesign = { style: 0, palette: 0, terrace: 0 };
export const designOf = (sc: StoreCafe): CafeDesign => ({ ...DEFAULT_DESIGN, ...sc.design });
export const hasTerrace = (g: GameState, s: Store) => storeCafe(g, s).gear.terrace > 0;
/** Price of switching from the saved design to a draft; unchanged parts are free. */
export function designCost(g: GameState, s: Store, draft: CafeDesign) {
  const cur = designOf(storeCafe(g, s)), st = stageOf(g, s);
  return (draft.style !== cur.style ? designPrice.style(st) : 0) + (draft.palette !== cur.palette ? designPrice.palette(st) : 0) + (draft.terrace !== cur.terrace ? designPrice.terrace : 0);
}
/** Commits an editor draft: validates, charges once, persists. */
export function applyDesign(g: GameState, storeId: string, draft: CafeDesign): ActionResult {
  const s = find(g, storeId); if (!s) return no(g, 'Filiale nicht gefunden.');
  if (!DESIGN_STYLES[draft.style] || !PALETTES[draft.palette] || !TERRACE_STYLES[draft.terrace]) return no(g, 'Ungültige Auswahl.');
  const cur = designOf(storeCafe(g, s));
  if (draft.terrace !== cur.terrace && !hasTerrace(g, s)) return no(g, 'Diese Filiale hat keine Terrasse.');
  const cost = designCost(g, s, draft); if (cost === 0) return no(g, 'Keine Änderung.');
  if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  return ok(withStore({ ...g, cash: r2(g.cash - cost) }, s, { design: { ...draft } }), `${s.name}: neue Gestaltung übernommen.`);
}
/** Terrace style bonus on the terrace revenue share only; zero without a terrace. */
export const terraceBonus = (sc: StoreCafe) => sc.gear.terrace > 0 ? r2((TERRACE_STYLES[designOf(sc).terrace]?.bonus ?? 0) * TERRACE_SHARE * 10000) / 10000 : 0;
export function renameStore(g: GameState, storeId: string, name: string): ActionResult {
  const n = name.trim().slice(0, 28); if (n.length < 2) return no(g, 'Name zu kurz.');
  return ok({ ...g, stores: g.stores.map(s => s.id === storeId ? { ...s, name: n } : s) }, `Filiale heißt jetzt „${n}“.`);
}
export function trainBarista(g: GameState, storeId: string): ActionResult {
  const s = find(g, storeId); if (!s) return no(g, 'Filiale nicht gefunden.');
  const sc = storeCafe(g, s); if (baristaLevel(sc.xp) >= 5) return no(g, 'Das Team ist bereits Meister.');
  const cost = 400 * baristaLevel(sc.xp); if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  return ok(withStore({ ...g, cash: r2(g.cash - cost) }, s, { xp: sc.xp + 30 }), `${s.name}: Schulung abgeschlossen (+30 Erfahrung).`);
}
export const researchAvailable = (g: GameState, id: string) => {
  const n = RESEARCH.find(x => x.id === id); const done = cafeOf(g).research.done;
  return !!n && !done.includes(id) && (n.tier === 1 || done.includes(`${id[0]}${n.tier - 1}`));
};
export function startResearch(g: GameState, id: string): ActionResult {
  const c = cafeOf(g), n = RESEARCH.find(x => x.id === id);
  if (!n || !researchAvailable(g, id)) return no(g, 'Erst die vorherige Stufe erforschen.');
  if (c.research.active) return no(g, 'Es läuft bereits ein Projekt.');
  const cost = researchCost(n.tier); if (g.cash < cost) return no(g, 'Nicht genug Barvermögen.');
  const weeks = researchDuration(g, researchWeeks(n.tier));
  return ok({ ...g, cash: r2(g.cash - cost), cafe: { ...c, research: { ...c.research, active: { id, weeksLeft: weeks } } } }, `Forschung „${n.name}“ gestartet (${weeks} Wo.).`);
}
/** Per-store weekly modifier from menu, gear, decor, staff XP and rivals. Bounded so stacking can't explode. */
export function storeCafeEffect(g: GameState, s: Store, done = cafeOf(g).research.done) {
  const sc = storeCafe(g, s), spec = g.progress?.stores[s.id]?.specialization ?? 'none';
  const items = sc.menu.map(id => MENU_ITEMS.find(m => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const menu = Math.max(0, items.length - DEFAULT_MENU.length) * 0.012 + items.filter(m => m.fit.includes(spec)).length * 0.006;
  const gear = GEAR_KEYS.reduce((n, c) => n + sc.gear[c] * GEAR[c].bonus * (c === 'espresso' || c === 'grinder' || c === 'seating' ? 0.5 : 1), 0);
  const decor = Math.min(0.06, Object.keys(sc.decor).length * 0.01);
  const level = baristaLevel(sc.xp), staff = s.employees.length ? (level - 1) * 0.02 : 0;
  const rival = cafeOf(g).rivalPressure[s.cityId] ?? 0;
  const rate = Math.min(0.45, menu + gear + decor + terraceBonus(sc) + staff + researchRevenueBonus(done)) - rival;
  const cost = items.length * 35 + (s.employees.length ? (level - 1) * 60 : 0);
  return { rate, revenue: r2(s.weeklyRevenue * rate), cost: r2(cost * researchWageFactor(done)), level, rival };
}
const PRESSURE_CAP = 0.12;
export function rivalPressureFor(g: GameState, cityId: string) {
  const city = g.cities.find(c => c.id === cityId); if (!city) return 0;
  const rivals = city.districts.filter(d => g.world.occupants[d.id]).length;
  return r2(Math.min(PRESSURE_CAP, (rivals / Math.max(1, city.districts.length)) * 0.2 * (1 + g.week / 150)));
}
/** Weekly step: research progress, XP gains, rival escalation and the summed cash delta. */
export function cafeWeek(g: GameState) {
  const c0 = cafeOf(g); const notes: string[] = [];
  const research = { ...c0.research, done: [...c0.research.done] };
  if (research.active) {
    const left = research.active.weeksLeft - 1;
    if (left <= 0) { research.done.push(research.active.id); notes.push(`Forschung abgeschlossen: ${RESEARCH.find(x => x.id === research.active?.id)?.name}`); research.active = null; }
    else research.active = { ...research.active, weeksLeft: left };
  }
  const rivalPressure = Object.fromEntries([...new Set(g.stores.map(s => s.cityId))].map(id => [id, rivalPressureFor(g, id)]));
  const stores = { ...c0.stores }; let revenue = 0, cost = 0;
  const g1 = { ...g, cafe: { ...c0, rivalPressure } };
  const fast = research.done.includes('o7') ? 2 : 1;
  for (const s of g.stores) {
    const fx = storeCafeEffect(g1, s, research.done); revenue += fx.revenue; cost += fx.cost;
    const sc = storeCafe(g, s); const xp = s.employees.length ? sc.xp + Math.round((4 + s.customersServedLastWeek / 80) * fast) : sc.xp;
    if (baristaLevel(xp) > baristaLevel(sc.xp)) notes.push(`${s.name}: Team erreicht Barista-Stufe ${baristaLevel(xp)}`);
    stores[s.id] = { ...sc, xp };
  }
  return { cafe: { stores, research, rivalPressure } as CafeState, revenue: r2(revenue), cost: r2(cost), reputation: researchRepBonus(research.done), notes };
}
