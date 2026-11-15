import { describe, it, expect } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { applyDesign, designOf, storeCafe, storeCafeEffect, terraceBonus } from '@/engine/cafe';
import type { GameState } from '@/engine/types';

const withTerrace = (g: GameState, lvl: number): GameState => { const s = g.stores[0]!; const sc = storeCafe(g, s);
  return { ...g, cafe: { ...g.cafe!, stores: { ...g.cafe!.stores, [s.id]: { ...sc, gear: { ...sc.gear, terrace: lvl } } } } }; };
const rich = (): GameState => ({ ...createInitialState(), cash: 1e6 });
describe('Café-Editor', () => {
  it('Übernehmen bucht genau einmal, gleicher Entwurf kostet nichts', () => {
    const g = rich(), s = g.stores[0]!;
    const r = applyDesign(g, s.id, { style: 1, palette: 2, terrace: 0 });
    expect(r.ok).toBe(true); expect(r.state.cash).toBeLessThan(g.cash);
    expect(designOf(storeCafe(r.state, s))).toEqual({ style: 1, palette: 2, terrace: 0 });
    expect(applyDesign(r.state, s.id, { style: 1, palette: 2, terrace: 0 }).ok).toBe(false);
  });
  it('Terrassenstil nur mit Terrasse', () => {
    const g = withTerrace(rich(), 0), s = g.stores[0]!;
    expect(applyDesign(g, s.id, { style: 0, palette: 0, terrace: 2 }).ok).toBe(false);
    expect(applyDesign(withTerrace(g, 1), s.id, { style: 0, palette: 0, terrace: 2 }).ok).toBe(true);
  });
  it('Terrassenbonus: Bistro 2 %, Garten 3 %, Lounge 4 % nur auf den Terrassenanteil', () => {
    const g = withTerrace(rich(), 1), sc = storeCafe(g, g.stores[0]!);
    expect(terraceBonus({ ...sc, design: { style: 0, palette: 0, terrace: 0 } })).toBeCloseTo(0.005);
    expect(terraceBonus({ ...sc, design: { style: 0, palette: 0, terrace: 2 } })).toBeCloseTo(0.01);
    expect(terraceBonus({ ...sc, gear: { ...sc.gear, terrace: 0 } })).toBe(0);
    expect(storeCafeEffect(g, g.stores[0]!).rate).toBeGreaterThan(storeCafeEffect(withTerrace(g, 0), g.stores[0]!).rate - 1);
  });
});
