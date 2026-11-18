import { describe, it, expect } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { livingStage } from '@/engine/v2';
import { portfolioValue } from '@/engine/v2/market';

describe('2.0 lebendige Welt im Wochenablauf', () => {
  it('52 Wochen: Börse und Ereignisse laufen, Kasse bleibt endlich und Bericht stimmt mit Kasse überein', () => {
    let g: any = createInitialState();
    for (let w = 1; w <= 52; w++) {
      const before = g.cash; g = livingStage({ ...g, week: w, lastReport: { revenueCapital: 0, revenueTotal: 0, netIncome: 0, notes: [] } });
      expect(g.cash - before).toBeCloseTo(g.lastReport.revenueCapital, 1);
    }
    expect(Number.isFinite(g.cash)).toBe(true);
    expect(g.living.market.firmen.length).toBeGreaterThan(5);
    expect(Number.isFinite(portfolioValue(g.living.market))).toBe(true);
  });
});
