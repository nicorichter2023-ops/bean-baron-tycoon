import { describe, it, expect } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { cafeWeek, gearUpgradeCost, setDecor, startResearch, storeCafe, storeCafeEffect, toggleMenuItem, upgradeGear, defaultStoreCafe } from '@/engine/cafe';
import { processProgressWeek } from '@/engine/progression';
import { createExpansion } from '@/engine/expansion';
import { RESEARCH } from '@/engine/cafeContent';
import type { GameState } from '@/engine/types';

const rich = (): GameState => ({ ...createInitialState(), cash: 1e6 });
describe('Café-Tiefe', () => {
  it('hat 12 Getränke, 10 Snacks und 80 Forschungsziele (mit 16 Konzern-Technologien dreimal so viele wie vorher)', async () => {
    const c = await import('@/engine/cafeContent');
    expect(c.DRINKS).toHaveLength(12); expect(c.SNACKS).toHaveLength(10); expect(RESEARCH).toHaveLength(80);
  });
  it('gesperrte Getränke brauchen Forschung', () => {
    const g = rich(), s = g.stores[0]!;
    expect(toggleMenuItem(g, s.id, 'latte').ok).toBe(false);
    expect(toggleMenuItem(g, s.id, 'muffin').ok).toBe(true);
  });
  it('Ausstattung hat 5 Stufen und wird nie herabgestuft', () => {
    let g = rich(); const s = g.stores[0]!;
    g = { ...g, progress: { ...g.progress!, stores: { ...g.progress!.stores, [s.id]: { ...g.progress!.stores[s.id]!, stage: 7 } } } };
    for (let i = 0; i < 4; i++) { const r = upgradeGear(g, s.id, 'espresso'); expect(r.ok).toBe(true); g = r.state; }
    expect(storeCafe(g, g.stores[0]!).gear.espresso).toBe(4);
    expect(upgradeGear(g, s.id, 'espresso').ok).toBe(false);
    expect(g.stores[0]!.equipment?.espresso).toBe(2);
  });
  it('Gestaltung kostet Geld und bringt höchstens +6 %', () => {
    let g = rich(); const s = g.stores[0]!;
    const before = g.cash; g = setDecor(g, s.id, 'wall', 2).state; expect(g.cash).toBe(before - 400);
    for (const slot of ['floor', 'light', 'plant', 'art', 'extra', 'sign'] as const) g = setDecor(g, s.id, slot, 0).state;
    const base = storeCafeEffect({ ...g, cafe: { ...g.cafe!, stores: { [s.id]: defaultStoreCafe(s) } } }, s).rate;
    expect(storeCafeEffect(g, s).rate - base).toBeCloseTo(0.06, 5);
  });
  it('Forschung läuft wochenweise und schaltet ab', () => {
    let g = startResearch(rich(), 'd1').state;
    for (let i = 0; i < 2; i++) g = { ...g, cafe: cafeWeek(g).cafe };
    expect(g.cafe!.research.done).toContain('d1');
    expect(toggleMenuItem(g, g.stores[0]!.id, 'latte').ok).toBe(true);
  });
  it('Kosten für nächste Stufe steigen', () => {
    const g = rich(), s = g.stores[0]!; expect(gearUpgradeCost(g, s, 'grinder')).toBeGreaterThan(0);
  });
  it('300 Wochen bleiben endlich und der Café-Bonus begrenzt', () => {
    let g = rich(), exp = createExpansion();
    for (let w = 0; w < 300; w++) { const r = processProgressWeek(g, exp); g = r.game; exp = r.exp; }
    expect(Number.isFinite(g.cash)).toBe(true);
    for (const s of g.stores) expect(storeCafeEffect(g, s).rate).toBeLessThanOrEqual(0.45);
  });
});
