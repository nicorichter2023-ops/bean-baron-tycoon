import { describe, expect, it } from 'vitest';
import { addRecipe, applyExpansionWeek, createExpansion, recipeCost, startCampaign } from '@/engine/expansion';
import { createInitialState } from '@/data';
describe('Erweiterung', () => {
  it('Preis muss über Kosten liegen', () => { expect(typeof addRecipe(createExpansion(), { name: 'X', base: 'espresso', milk: 'none', extra: 'none', price: 0.4, createdWeek: 1 })).toBe('string'); });
  it('Kampagne kostet Geld und läuft aus', () => {
    const g = createInitialState(); const r = startCampaign(g, createExpansion(), 'tasting', g.stores[0]!.cityId);
    if (typeof r === 'string') throw new Error(r);
    expect(r.game.cash).toBe(g.cash - 1500);
    expect(applyExpansionWeek(r.game, r.exp).exp.campaigns).toHaveLength(0);
  });
  it('Kosten summieren Zutaten', () => { expect(recipeCost({ base: 'espresso', milk: 'oat', extra: 'caramel' })).toBe(1.05); });
});
import { compareCampaignWeeks } from '@/engine/expansion';
describe('Kampagnen-Vergleich', () => {
  it('trennt Wochen mit und ohne Kampagne', () => {
    const r = compareCampaignWeeks([{ week: 1, guests: 100, revenue: 1000, campaigns: 0 }, { week: 2, guests: 150, revenue: 1600, campaigns: 1 }, { week: 3, guests: 50, revenue: 400, campaigns: 0 }]);
    expect(r.without).toEqual({ weeks: 2, guests: 75, revenue: 700 });
    expect(r.with).toEqual({ weeks: 1, guests: 150, revenue: 1600 });
  });
});
