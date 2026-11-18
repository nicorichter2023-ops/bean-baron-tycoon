import { describe, it, expect } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { createExpansion } from '@/engine/expansion';
import { simulateWeek } from '@/engine/week';
import { processTycoonWeek } from '@/engine/tycoon';
import { hireEmployee } from '@/engine/engine';

describe('Lineare Wochenberechnung', () => {
  it('liefert über 20 Wochen exakt dasselbe Ergebnis wie die alte verschachtelte Kette', () => {
    const h = hireEmployee(createInitialState(), createInitialState().stores[0]!.id, 'barista');
    let a = h.ok ? h.state : createInitialState(), b = a, ea = createExpansion(), eb = ea;
    for (let i = 0; i < 20; i++) {
      const ra = simulateWeek(a, ea), rb = processTycoonWeek(b, eb);
      a = { ...ra.game, pendingEvent: null }; b = { ...rb.game, pendingEvent: null }; ea = ra.exp; eb = rb.exp;
    }
    expect(a.week).toBe(21);
    expect(a.cash).toBe(b.cash);
    expect(a.management.history).toEqual(b.management.history);
  });
  it('die Wochenbuchung geht auf: Startkasse + Zuflüsse = Endkasse', () => {
    const r = simulateWeek(createInitialState(), createExpansion()).game.management.history.at(-1)!;
    expect(r.cashStart + r.operating + r.investing + r.financing).toBeCloseTo(r.cashEnd, 2);
  });
});
