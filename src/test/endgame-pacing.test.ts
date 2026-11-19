import { expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import { simulateWeek } from '@/engine/week';
import { openStaffedStore } from '@/engine/empire';
import { applyEventChoice } from '@/engine/engine';
import { recordManagementAction } from '@/engine/management';
import { openCityIds } from '@/engine/unlocks';
it('ambitionierter Spieler erreicht Rang 10 zwischen Woche 150 und 300', () => {
  let game = createInitialState(), expansion = createExpansion(); const ranks: Record<number, number> = {};
  for (let i = 0; i < 320; i++) {
    if (game.pendingEvent) game = recordManagementAction(game, applyEventChoice(game, 0).state);
    for (const cid of openCityIds(game)) {
      const city = game.cities.find(c => c.id === cid); if (!city) continue;
      const free = city.districts.filter(d => !game.world.occupants[d.id] && !game.stores.some(s => s.districtId === d.id)).sort((a,b) => a.rentWeekly - b.rentWeekly)[0];
      if (free && game.cash > 40000 && (game.lastReport?.netIncome ?? 1) > 0) { const r = openStaffedStore(game, city.id, free.id, 1); if (r.ok) { game = recordManagementAction(game, r.state); break; } }
    }
    const res = simulateWeek(game, expansion); game = res.game; expansion = res.exp;
    const rk = game.progress!.rank; if (!ranks[rk]) ranks[rk] = i + 1;
  }
  expect(ranks[10]).toBeGreaterThanOrEqual(150);
  expect(ranks[10]).toBeLessThanOrEqual(300);
  expect(ranks[9]).toBeGreaterThan(ranks[8]!);
}, 60000);
