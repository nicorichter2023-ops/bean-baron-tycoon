import type { GameState } from "./types";
import { GAME_CONFIG } from "./engine";
import { createInitialState } from "@/data/initialState";

const KEY = "coffee-empire-save";

// Migrationen: Schlüssel = Ausgangsversion, liefert State der nächsten Version
const migrations: Record<number, (s: any) => any> = {};

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    let s = JSON.parse(raw);
    if (typeof s?.schemaVersion !== "number" || !s.city?.districts) return createInitialState();
    while (s.schemaVersion < GAME_CONFIG.SCHEMA_VERSION) {
      const m = migrations[s.schemaVersion];
      if (!m) return createInitialState();
      s = m(s);
    }
    return s as GameState;
  } catch { return createInitialState(); }
}
export const saveGame = (s: GameState) =>
  localStorage.setItem(KEY, JSON.stringify({ ...s, schemaVersion: GAME_CONFIG.SCHEMA_VERSION }));
export const resetGame = () => localStorage.removeItem(KEY);
