import type { GameState } from "./types";
import { GAME_CONFIG } from "./engine";
import { createInitialState } from "@/data/initialState";

const KEY = "coffee-empire-save";

/** Coffee Empire 2.0 is a clean start: saves from any other schema version are discarded once. */
export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    const state = raw ? JSON.parse(raw) : null;
    if (state?.schemaVersion !== GAME_CONFIG.SCHEMA_VERSION) {
      if (raw) localStorage.removeItem(KEY);
      return createInitialState();
    }
    return state as GameState;
  } catch {
    return createInitialState();
  }
}

export const saveGame = (state: GameState) =>
  localStorage.setItem(KEY, JSON.stringify({ ...state, schemaVersion: GAME_CONFIG.SCHEMA_VERSION }));
export const resetGame = () => localStorage.removeItem(KEY);
