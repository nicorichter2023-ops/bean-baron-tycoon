import type { GameState } from "./types";
import { SCHEMA_VERSION, createInitialState } from "./engine";

const KEY = "coffee-empire-save";

// Migrationen: index = von Version n auf n+1
const migrations: Record<number, (s: any) => any> = {};

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    let s = JSON.parse(raw);
    while ((s.schemaVersion ?? 0) < SCHEMA_VERSION) {
      const m = migrations[s.schemaVersion ?? 0];
      if (!m) return createInitialState();
      s = m(s);
    }
    return s as GameState;
  } catch { return createInitialState(); }
}
export const saveGame = (s: GameState) => localStorage.setItem(KEY, JSON.stringify(s));
export const resetGame = () => localStorage.removeItem(KEY);
