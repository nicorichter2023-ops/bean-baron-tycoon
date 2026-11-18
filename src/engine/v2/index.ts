import type { GameState } from '../types';
import { ledgerTotal } from '../ledger';
import { createWorld, stepWorld, branchenMultiplikatoren, modifier, type WorldState as LiveWorld } from './world';
import { createMarket, stepMarket, type MarketState } from './market';

/** Persisted 2.0 living world: global events + dynamic stock/venture market. */
export interface LivingState { world: LiveWorld; market: MarketState; news: { woche: number; text: string }[] }

/** Deterministic per-week RNG so replays and tests stay stable. */
export const weekRng = (week: number, salt = 0) => { let s = (week * 2654435761 + salt * 97 + 12345) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); };

const makro = (w: LiveWorld) => ({ zins: 0.03, kaufkraft: modifier(w, 'nachfrage'), branchenMultiplikator: branchenMultiplikatoren(w) });

export function ensureLiving(g: GameState): LivingState {
  if (g.living) return g.living;
  const world = createWorld();
  return { world, market: createMarket({ rng: weekRng(0, 1), woche: g.week, makro: makro(world) }).state, news: [] };
}

/** Final weekly stage: advances world events and the market, books market cash into the same report row. */
export function livingStage(g: GameState): GameState {
  const live = ensureLiving(g), rng = weekRng(g.week, 7);
  const wr = stepWorld(live.world, { rng, woche: g.week });
  const mr = stepMarket(live.market, { rng, woche: g.week, makro: makro(wr.state) });
  const cash = ledgerTotal([...wr.ledger, ...mr.ledger]);
  const notes = [...wr.notes, ...mr.notes];
  const news = [...notes.map(text => ({ woche: g.week, text })), ...live.news].slice(0, 30);
  const r = g.lastReport;
  return {
    ...g, cash: g.cash + cash,
    living: { world: wr.state, market: mr.state, news },
    lastReport: r ? { ...r, revenueCapital: r.revenueCapital + cash, revenueTotal: r.revenueTotal + cash, netIncome: r.netIncome + cash, notes: [...r.notes, ...wr.notes] } : r,
  };
}

import type { ActionResult } from '../types';
import { buyShares as mBuy, sellShares as mSell, investVenture as mInvest, type MarketResult } from './market';
function applyMarket(g: GameState, f: (m: MarketState, cash: number) => MarketResult): ActionResult {
  const live = ensureLiving(g), r = f(live.market, g.cash), delta = ledgerTotal(r.ledger);
  if (!r.ledger.length) return { state: g, ok: false, reason: r.notes[0] ?? 'Nicht möglich' };
  if (g.cash + delta < 0) return { state: g, ok: false, reason: 'Nicht genug Geld' };
  return { state: { ...g, cash: g.cash + delta, living: { ...live, market: r.state } }, ok: true, reason: r.ledger[0]?.grund ?? 'OK' };
}
export const buyStake = (g: GameState, id: number, anteil: number) => applyMarket(g, (m, c) => mBuy(m, id, anteil, c));
export const sellStake = (g: GameState, id: number, anteil: number) => applyMarket(g, (m) => mSell(m, id, anteil));
export const ventureInvest = (g: GameState, id: number, betrag: number) => applyMarket(g, (m, c) => mInvest(m, id, betrag, c));
