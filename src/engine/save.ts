import type { GameState } from "./types";
import { GAME_CONFIG } from "./engine";
import { createInitialState } from "@/data/initialState";

const KEY = "coffee-empire-save";
const SLOT_KEY = "coffee-empire-slot";
export const SAVE_SLOTS = [1, 2, 3] as const;
export type SaveSlot = (typeof SAVE_SLOTS)[number];

const hasStorage = () => typeof localStorage !== "undefined";

/** Active slot (1–3). Slot 1 keeps the original keys so existing 2.0 saves stay in place. */
export function activeSlot(): SaveSlot {
  const n = hasStorage() ? Number(localStorage.getItem(SLOT_KEY)) : 1;
  return (SAVE_SLOTS as readonly number[]).includes(n) ? (n as SaveSlot) : 1;
}
export const setActiveSlot = (slot: SaveSlot) => localStorage.setItem(SLOT_KEY, String(slot));
/** Storage key for a base key in the given (default: active) slot. */
export const slotKey = (base: string, slot: SaveSlot = activeSlot()) => (slot === 1 ? base : `${base}-slot${slot}`);

function read(slot: SaveSlot): GameState | null {
  const raw = localStorage.getItem(slotKey(KEY, slot));
  const state = raw ? JSON.parse(raw) : null;
  if (state?.schemaVersion !== GAME_CONFIG.SCHEMA_VERSION) {
    if (raw) localStorage.removeItem(slotKey(KEY, slot));
    return null;
  }
  return state as GameState;
}

/** Coffee Empire 2.0 is a clean start: saves from any other schema version are discarded once. */
export function loadGame(slot: SaveSlot = activeSlot()): GameState {
  try { return read(slot) ?? createInitialState(); } catch { return createInitialState(); }
}

export type SlotSummary = { slot: SaveSlot; empty: boolean; week: number; cash: number; stores: number };
export function slotSummaries(): SlotSummary[] {
  return SAVE_SLOTS.map((slot) => {
    let s: GameState | null = null;
    try { s = read(slot); } catch { s = null; }
    return { slot, empty: !s, week: s?.week ?? 0, cash: s?.cash ?? 0, stores: s?.stores.length ?? 0 };
  });
}

export function saveGame(state: GameState, slot: SaveSlot = activeSlot()): boolean {
  try {
    localStorage.setItem(slotKey(KEY, slot), JSON.stringify({ ...state, schemaVersion: GAME_CONFIG.SCHEMA_VERSION }));
    return true;
  } catch { return false; }
}
export const resetGame = (slot: SaveSlot = activeSlot()) => {
  localStorage.removeItem(slotKey(KEY, slot));
  localStorage.removeItem(slotKey("coffee-empire-expansion", slot));
};
