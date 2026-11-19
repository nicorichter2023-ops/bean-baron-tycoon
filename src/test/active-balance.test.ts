import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import { simulateWeek } from '@/engine/week';
import { openStaffedStore } from '@/engine/empire';
import { applyEventChoice } from '@/engine/engine';
import { recordManagementAction } from '@/engine/management';

describe('Aktive vorsichtige Expansion', () => {
  it('erreicht mehrere Filialen und bleibt über 300 Produktionswochen zahlungsfähig', () => {
    let game = createInitialState(), expansion = createExpansion();
    for (let i = 0; i < 300; i++) {
      if (game.pendingEvent) game = recordManagementAction(game, applyEventChoice(game, 0).state);
      const city = game.city;
      const free = city.districts.filter(d => !game.world.occupants[d.id] && !game.stores.some(s => s.districtId === d.id)).sort((a,b) => a.rentWeekly - b.rentWeekly)[0];
      if (free && game.cash > 70000 && game.stores.length < 4) {
        const result = openStaffedStore(game, city.id, free.id, 1);
        if (result.ok) game = recordManagementAction(game, result.state);
      }
      const previous = game.week;
      const result = simulateWeek(game, expansion); game = result.game; expansion = result.exp;
      expect(game.week).toBe(previous + 1);
      expect(game.management.history.at(-1)?.cashEnd).toBeCloseTo(game.cash, 2);
      expect(game.cash).toBeGreaterThan(-20000);
      if (i === 51 || i === 299) console.log(`Active ${i+1} weeks: ${Math.round(game.cash)} EUR, ${game.stores.length} stores, rank ${game.progress?.rank}`);
    }
    expect(game.stores.length).toBeGreaterThanOrEqual(2);
    expect(game.progress?.rank).toBeGreaterThanOrEqual(2);
    expect(game.progress?.rank).toBeLessThan(7);
  }, 15000);
});