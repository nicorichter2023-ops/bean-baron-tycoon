import type { GameState } from './types';
import type { ExpansionState } from './expansion';
import { processTycoonWeek } from './tycoon';

/** The only weekly entry point the UI may call; inner system chain can be flattened behind it without UI changes. */
export function simulateWeek(state: GameState, exp: ExpansionState) {
  return processTycoonWeek(state, exp);
}
