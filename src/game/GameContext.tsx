import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { loadGame, processTurn, saveGame, type ActionResult, type GameState } from "@/engine";
import { createInitialState } from "@/data";
import { translateEngineNote } from "./logMessages";

type Ctx = {
  state: GameState;
  set: (fn: (state: GameState) => GameState) => void;
  perform: (action: (state: GameState) => ActionResult) => void;
  nextWeek: () => void;
  loaded: boolean;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadGame());
    setLoaded(true);
  }, []);

  const set = (fn: (current: GameState) => GameState) => setState((current) => {
    const next = fn(current);
    saveGame(next);
    return next;
  });

  const perform = (action: (current: GameState) => ActionResult) => setState((current) => {
    const result = action(current);
    if (result.ok) saveGame(result.state);
    const message = translateEngineNote(result.reason);
    if (result.ok) toast.success(message);
    else toast.error(message);
    return result.state;
  });

  const nextWeek = () => set(processTurn);
  return <GameCtx.Provider value={{ state, set, perform, nextWeek, loaded }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const context = useContext(GameCtx);
  if (!context) throw new Error("GameProvider fehlt");
  return context;
}

export const eur = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
export const compact = (value: number) => {
  const absolute = Math.abs(value);
  const format = (amount: number, unit: string) => `${amount.toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${unit}€`;
  return absolute >= 1e9 ? format(value / 1e9, "Mrd ") : absolute >= 1e6 ? format(value / 1e6, "Mio ") : absolute >= 1e3 ? format(value / 1e3, "Tsd ") : format(Math.round(value), "");
};
