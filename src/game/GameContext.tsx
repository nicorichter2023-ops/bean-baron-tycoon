import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { loadGame, saveGame, type ActionResult, type GameState } from "@/engine";
import { createInitialState } from "@/data";
import { translateEngineNote } from "./logMessages";
import { createExpansion, loadExpansion, saveExpansion, type ExpansionState } from "@/engine/expansion";
import { processManagementWeek, recordManagementAction } from '@/engine/management';

type Ctx = {
  state: GameState;
  set: (fn: (state: GameState) => GameState) => void;
  perform: (action: (state: GameState) => ActionResult) => void;
  nextWeek: () => void;
  loaded: boolean;
  exp: ExpansionState;
  setBoth: (fn: (state: GameState, exp: ExpansionState) => { game: GameState; exp: ExpansionState } | string) => void;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [loaded, setLoaded] = useState(false);
  const [exp, setExp] = useState<ExpansionState>(createExpansion);

  useEffect(() => {
    setState(loadGame());
    setExp(loadExpansion());
    setLoaded(true);
  }, []);

  const set = (fn: (current: GameState) => GameState) => setState((current) => {
    const next = recordManagementAction(current, fn(current));
    saveGame(next);
    return next;
  });

  const perform = (action: (current: GameState) => ActionResult) => setState((current) => {
    const raw = action(current);
    const result = raw.ok ? { ...raw, state: recordManagementAction(current, raw.state) } : raw;
    if (result.ok) saveGame(result.state);
    const message = translateEngineNote(result.reason);
    if (result.ok) toast.success(message);
    else toast.error(message);
    return result.state;
  });

  const setBoth: Ctx["setBoth"] = (fn) => {
    const result = fn(state, exp);
    if (typeof result === "string") { toast.error(result); return; }
    const game = recordManagementAction(state, result.game);
    saveGame(game); saveExpansion(result.exp);
    setState(game); setExp(result.exp);
  };
  const nextWeek = () => {
    const result = processManagementWeek(state, exp);
    const turned = result.game;
    saveGame(result.game); saveExpansion(result.exp);
    setState(result.game); setExp(result.exp);
    if (turned.week > state.week) window.__lovableEvents?.track?.("project.week_completed", {
      week: turned.week,
      guests: turned.stores.reduce((n, st) => n + st.customersServedLastWeek, 0),
      weekly_revenue: Math.round(turned.stores.reduce((n, st) => n + st.weeklyRevenue, 0)),
      expansion_bonus: result.exp.lastBonus,
      active_campaigns: exp.campaigns.length,
      recipe_count: exp.recipes.length,
      store_count: turned.stores.length,
    });
    if (result.exp.lastBonus && turned.week > state.week) toast.success(`Labor & Marketing: +${eur(result.exp.lastBonus)}`);
  };
  return <GameCtx.Provider value={{ state, set, perform, nextWeek, loaded, exp, setBoth }}>{children}</GameCtx.Provider>;
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
