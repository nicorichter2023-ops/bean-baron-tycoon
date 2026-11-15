import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import { processEmpireWeek } from '@/engine/empire';
import { applyDesign, designCost, storeCafe, upgradeGear } from '@/engine/cafe';
import { DESIGN_STYLES, DESIGN_MOODS } from '@/engine/cafeContent';

describe('Café-Upgrades & Gestaltung', () => {
  it('Ausstattung bleibt nach der Woche erhalten', () => {
    let g = { ...createInitialState(), cash: 5e7 }; const id = g.stores[0]!.id;
    g = upgradeGear(g, id, 'espresso').state;
    g = processEmpireWeek(g, createExpansion()).game;
    expect(storeCafe(g, g.stores[0]!).gear.espresso).toBe(1);
  });
  it('12 Designs: 3 Stimmungen × 4', () => {
    expect(DESIGN_MOODS).toHaveLength(3); expect(DESIGN_STYLES).toHaveLength(12);
    for (let m = 0; m < 3; m++) expect(DESIGN_STYLES.filter(d => d.mood === m)).toHaveLength(4);
  });
  it('Gestaltung bleibt nach der Woche erhalten', () => {
    let g = { ...createInitialState(), cash: 5e7 }; const s = g.stores[0]!;
    g = applyDesign(g, s.id, { style: 9, palette: 0, terrace: 0 }).state;
    g = processEmpireWeek(g, createExpansion()).game;
    expect(storeCafe(g, g.stores[0]!).design?.style).toBe(9);
    expect(designCost(g, g.stores[0]!, { style: 9, palette: 3, terrace: 0 })).toBe(0);
  });
});
