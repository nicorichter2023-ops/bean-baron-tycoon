// exchange.ts – reine Börsen-Kennzahlen für die Weltbörsen-Ansicht (keine Spielwirkung)
import type { Company, MarketState } from "./market";

export const EXCHANGES = [
  { id: "nyse", name: "Wall Street", index: "CX 30" },
  { id: "fra", name: "Frankfurt", index: "BEAN-DAX" },
  { id: "tyo", name: "Tokio", index: "Kissa 225" },
] as const;
export type ExchangeId = (typeof EXCHANGES)[number]["id"];

/** Deterministische Börsenzuordnung je Firma (bleibt in alten Spielständen stabil). */
export function exchangeOf(c: Pick<Company, "id">): ExchangeId {
  return EXCHANGES[Math.abs(c.id) % EXCHANGES.length]!.id;
}

const listed = (c: Company) => c.kurs != null && c.kurs > 0 && c.phase !== "pleite" && c.phase !== "uebernommen";

export function stockMetrics(c: Company) {
  const h = c.historie.filter((x) => Number.isFinite(x));
  const gewinn = c.umsatzJahr * c.marge;
  const prev = h.length > 1 ? h[h.length - 2]! : h[0] ?? 0;
  const last = h[h.length - 1] ?? 0;
  return {
    kgv: gewinn > 0 ? c.bewertung / gewinn : null,
    dividendenRendite: c.phase === "stabil" && c.marge > 0.03 && c.bewertung > 0 ? (gewinn * 0.4) / c.bewertung : 0,
    hoch52: h.length ? Math.max(...h) : 0,
    tief52: h.length ? Math.min(...h) : 0,
    wochenAenderung: prev > 0 ? last / prev - 1 : 0,
  };
}

/** Börsenindex: Wertgewichteter Verlauf relativ zum ältesten gemeinsamen Punkt (=100). */
export function exchangeIndex(state: MarketState, ex: ExchangeId): { wert: number; verlauf: number[]; firmen: number } {
  const firms = state.firmen.filter((c) => listed(c) && exchangeOf(c) === ex);
  const len = firms.reduce((m, c) => Math.min(m, c.historie.length), Infinity);
  if (!firms.length || !Number.isFinite(len) || len < 1) return { wert: 100, verlauf: [100], firmen: firms.length };
  const sums = Array.from({ length: len }, (_, i) =>
    firms.reduce((s, c) => s + (c.historie[c.historie.length - len + i] ?? 0) * c.aktienGesamt, 0),
  );
  const base = sums[0]! || 1;
  const verlauf = sums.map((s) => (s / base) * 100);
  return { wert: verlauf[verlauf.length - 1]!, verlauf, firmen: firms.length };
}

/** Ordergröße: Anteil an der Firma für einen Euro-Betrag. */
export function stakeForBudget(c: Company, budget: number): number {
  return c.bewertung > 0 ? Math.max(0, budget) / c.bewertung : 0;
}
