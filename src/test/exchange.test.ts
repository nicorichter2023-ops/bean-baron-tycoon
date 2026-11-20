import { describe, expect, it } from "vitest";
import { exchangeIndex, exchangeOf, stockMetrics } from "@/engine/v2/exchange";
import type { Company } from "@/engine/v2/market";

const firm = (p: Partial<Company>): Company => ({ id: 3, name: "X", branche: "b", phase: "stabil", wochenInPhase: 0, umsatzJahr: 1000, marge: 0.1, bewertung: 2000, kurs: 2, aktienGesamt: 1000, anteilSpieler: 0, anteilRivalen: 0, trend: 0, historie: [1, 2], ...p });

describe("Weltbörse", () => {
  it("KGV = Bewertung / Jahresgewinn, Dividende 40 % des Gewinns", () => {
    const m = stockMetrics(firm({}));
    expect(m.kgv).toBe(20);
    expect(m.dividendenRendite).toBeCloseTo(0.02);
    expect(m.wochenAenderung).toBeCloseTo(1);
  });
  it("Index startet bei 100 und folgt dem Kurs", () => {
    const f = firm({ id: 3 });
    const idx = exchangeIndex({ firmen: [f], naechsteId: 4, woche: 1 }, exchangeOf(f));
    expect(idx.verlauf[0]).toBe(100);
    expect(idx.wert).toBe(200);
  });
});
