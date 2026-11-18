import type { GameState } from './types';
import type { ExpansionState } from './expansion';
import { processManagementWeek } from './management';
import { progressStage } from './progression';
import { empireStage } from './empire';
import { prepareSupply, tycoonStage } from './tycoon';

/**
 * The only weekly entry point the UI may call. Runs every system once, in a fixed linear order:
 * 1 base week (cafés, guests, beans, staff, rent, HQ, accounting row)
 * 2 progression (levers, goals, ranks, events)
 * 3 empire (supply chain, ventures, campaigns, C-level automation)
 * 4 tycoon (franchise, retail, pop-ups, cargo, city systems)
 * Stages 2–4 only add to the one accounting row written in stage 1.
 */
export function simulateWeek(state: GameState, exp: ExpansionState): { game: GameState; exp: ExpansionState } {
  if (state.pendingEvent) return { game: state, exp };
  const prepared = prepareSupply(state);
  const base = processManagementWeek(prepared, exp);
  const progressed = progressStage(prepared, base);
  const empire = empireStage(prepared, progressed);
  return tycoonStage(state, prepared, empire, exp);
}
