import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createInitialState, loadGame, saveGame, type GameState } from "@/engine";

type Ctx = { state: GameState; set: (fn: (s: GameState) => GameState) => void; loaded: boolean };
const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setState(loadGame()); setLoaded(true); }, []);
  useEffect(() => { if (loaded) saveGame(state); }, [state, loaded]);
  return <GameCtx.Provider value={{ state, set: setState, loaded }}>{children}</GameCtx.Provider>;
}
export function useGame() { const c = useContext(GameCtx); if (!c) throw new Error("no GameProvider"); return c; }
export const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const compact = (n: number) => n.toLocaleString("de-DE", { notation: "compact", maximumFractionDigits: 1 }) + " €";
