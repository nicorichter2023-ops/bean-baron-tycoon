import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { createExpansion } from '@/engine/expansion';
import { simulateWeek } from '@/engine/week';
import { applyEventChoice } from '@/engine/engine';
import { recordManagementAction } from '@/engine/management';
import { ensureLiving, takeOverCompany, sellCompany, listCompany } from '@/engine/v2';
import { portfolioValue } from '@/engine/v2/market';

describe('Production gameplay audit', () => {
  for (const weeks of [52, 300]) it(`${weeks} real weeks advance and cash reconciles`, () => {
    let g = createInitialState(), exp = createExpansion();
    for (let i = 0; i < weeks; i++) {
      if (g.pendingEvent) g = recordManagementAction(g, applyEventChoice(g, 0).state);
      const previousWeek = g.week;
      const r = simulateWeek(g, exp);
      g = r.game; exp = r.exp;
      expect(g.week).toBe(previousWeek + 1);
      const row = g.management.history.at(-1);
      if (!row) throw new Error('Missing accounting row');
      expect(row.cashEnd).toBeCloseTo(g.cash, 2);
      expect(row.cashStart + row.operating + row.investing + row.financing).toBeCloseTo(g.cash, 2);
      expect(row.profit).toBeCloseTo(g.lastReport?.netIncome ?? NaN, 2);
      expect(Number.isFinite(portfolioValue(ensureLiving(g).market))).toBe(true);
    }
    expect(g.week).toBe(weeks + 1);
    expect(g.living?.news.length).toBeGreaterThan(0);
    console.log(`${weeks} weeks: cash ${Math.round(g.cash)}, rank ${g.progress?.rank}, stores ${g.stores.length}`);
  });
  it('PE charges the remaining stake plus 25 percent and exits at 85 percent', () => {
    const initial = createInitialState(), live = ensureLiving(initial);
    const firm = live.market.firmen[0];
    if (!firm) throw new Error('Missing firm');
    const g = { ...initial, cash: 1e9, living: live };
    const r = takeOverCompany(g, firm.id);
    expect(r.ok).toBe(true);
    expect(g.cash - r.state.cash).toBeCloseTo((1 - firm.anteilSpieler) * firm.bewertung * 1.25, 2);
    const exit = sellCompany(r.state, firm.id);
    expect(exit.ok).toBe(true);
    expect(exit.state.cash - r.state.cash).toBeCloseTo(firm.bewertung * .85, 2);
  });
  it('IPO accepts a state-only change without minting cash', () => {
    const initial = createInitialState(), live = ensureLiving(initial);
    const firm = live.market.firmen[0];
    if (!firm) throw new Error('Missing firm');
    const g = { ...initial, living: { ...live, market: { ...live.market, firmen: [{ ...firm, phase: 'ipo_reif' as const, kurs: null, bewertung: 30000000, anteilSpieler: .1 }] } } };
    const r = listCompany(g, firm.id);
    expect(r.ok).toBe(true);
    expect(r.state.cash).toBe(50000);
    expect(r.state.living?.market.firmen[0]?.kurs).toBeGreaterThan(0);
  });
});