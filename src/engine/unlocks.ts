import type { GameState } from './types';
import { MASTER_CITIES } from '@/data/master';

/** Pure progression content shared by engine modules (no engine imports → no cycles). */
export const STAGES = [
  { label: 'Kaffeewagen', tier: 1, cost: 0, bonus: 0, upkeep: 0 },
  { label: 'Kiosk', tier: 1, cost: 6_000, bonus: 0.15, upkeep: 60 },
  { label: 'Kaffeebar', tier: 2, cost: 0, bonus: 0, upkeep: 0 },
  { label: 'Kiez-Café', tier: 2, cost: 18_000, bonus: 0.15, upkeep: 150 },
  { label: 'Bistro', tier: 3, cost: 0, bonus: 0, upkeep: 0 },
  { label: 'Rösterei-Café', tier: 3, cost: 60_000, bonus: 0.18, upkeep: 400 },
  { label: 'Flagship', tier: 3, cost: 140_000, bonus: 0.38, upkeep: 900 },
] as const;
export type StageDef = { label: string; tier: number; cost: number; bonus: number; upkeep: number };
export const stg = (i: number): StageDef => STAGES[Math.max(0, Math.min(6, i))] ?? STAGES[0];
export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export const tierOfStage = (s: number) => stg(s - 1).tier;
export const firstStageOfTier = (t: number): Stage => (t <= 1 ? 1 : t === 2 ? 3 : 5);
/** Legacy tiers 1/2/3 map to stages 2/4/7 when migrating old saves. */
export const legacyStage = (t: number): Stage => (t <= 1 ? 2 : t === 2 ? 4 : 7);

export interface RankReq { stores: number; cities: number; reputation: number; valuation: number; weeklyRevenue: number }
export const RANKS: { name: string; req: RankReq; maxStage: Stage; cities: number; unlocks: string[] }[] = [
  { name: 'Straßenhändler', req: { stores: 0, cities: 0, reputation: 0, valuation: 0, weeklyRevenue: 0 }, maxStage: 2, cities: 3, unlocks: ['Kaffeewagen & Kiosk', '3 Städte'] },
  { name: 'Kioskbetreiber', req: { stores: 2, cities: 1, reputation: 20, valuation: 80_000, weeklyRevenue: 2_000 }, maxStage: 2, cities: 3, unlocks: ['Öffnungszeiten'] },
  { name: 'Lokale Größe', req: { stores: 3, cities: 1, reputation: 30, valuation: 150_000, weeklyRevenue: 4_000 }, maxStage: 3, cities: 3, unlocks: ['Kaffeebar', 'Qualität oder Menge'] },
  { name: 'Stadtmarke', req: { stores: 5, cities: 1, reputation: 40, valuation: 300_000, weeklyRevenue: 8_000 }, maxStage: 4, cities: 4, unlocks: ['Kiez-Café', 'Spezialisierung', 'Treueprogramm', '+1 Stadt'] },
  { name: 'Regionale Kette', req: { stores: 7, cities: 2, reputation: 48, valuation: 700_000, weeklyRevenue: 14_000 }, maxStage: 5, cities: 7, unlocks: ['Bistro', 'Bohnen-Festpreis', '+3 Städte'] },
  { name: 'Nationale Marke', req: { stores: 10, cities: 3, reputation: 55, valuation: 1_800_000, weeklyRevenue: 24_000 }, maxStage: 6, cities: 9, unlocks: ['Rösterei-Café', '+2 Städte'] },
  { name: 'Kaffeekonzern', req: { stores: 15, cities: 5, reputation: 62, valuation: 5_000_000, weeklyRevenue: 40_000 }, maxStage: 7, cities: 13, unlocks: ['Flagship', '+4 Städte'] },
  { name: 'Internationale Marke', req: { stores: 22, cities: 8, reputation: 70, valuation: 14_000_000, weeklyRevenue: 70_000 }, maxStage: 7, cities: 16, unlocks: ['+3 Städte'] },
  { name: 'Weltmarke', req: { stores: 32, cities: 12, reputation: 78, valuation: 40_000_000, weeklyRevenue: 120_000 }, maxStage: 7, cities: 20, unlocks: ['Alle Städte'] },
  { name: 'Kaffee-Imperium', req: { stores: 45, cities: 16, reputation: 86, valuation: 100_000_000, weeklyRevenue: 200_000 }, maxStage: 7, cities: 20, unlocks: ['Endziel erreicht'] },
];
export const rk = (i: number) => RANKS[Math.max(0, Math.min(9, i))] ?? RANKS[0]!;
export type LeverId = 'hours' | 'focus' | 'specialization' | 'loyalty' | 'beanContract';
export const LEVER_RANK: Record<LeverId, number> = { hours: 2, focus: 3, specialization: 4, loyalty: 4, beanContract: 5 };
export const rankIndex = (g: Pick<GameState, 'progress'>) => g.progress?.rank ?? 1;
export const rankInfo = (rank: number) => rk(rank - 1);
export const maxStage = (g: Pick<GameState, 'progress'>) => g.progress ? rankInfo(rankIndex(g)).maxStage : 7;
export const leverUnlocked = (g: Pick<GameState, 'progress'>, id: LeverId) => !g.progress || rankIndex(g) >= LEVER_RANK[id];
/** Cities open by rank (master order), plus every city the player already visited or operates in. */
export function openCityIds(g: GameState): string[] {
  if (!g.progress) return g.cities.map(c => c.id);
  const ids = new Set(MASTER_CITIES.slice(0, rankInfo(rankIndex(g)).cities).map(c => c.id));
  ids.add(g.city.id); g.stores.forEach(s => ids.add(s.cityId)); (g.progress.extraCities ?? []).forEach(id => ids.add(id));
  return [...ids];
}
/** Dependency graph: each unlock names the rank that grants it. Used by tests for reachability. */
export const UNLOCK_GRAPH: Record<string, string[]> = Object.fromEntries(RANKS.map((_r, i) => [`rank-${i + 1}`, i ? [`rank-${i}`] : []]));
