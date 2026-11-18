import { describe, it, expect } from "vitest";
import { createMarket, stepMarket, portfolioValue, buyShares, investVenture } from "@/engine/v2/market";
import { createWorld, stepWorld, modifier, branchenMultiplikatoren } from "@/engine/v2/world";
import { wocheSimulieren, type GuestsState } from "@/engine/v2/guests";
import { ledgerTotal } from "@/engine/ledger";
import cities from "@/data/v2/cities-emea.json";

const seeded = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);

function run(weeks: number, seed: number) {
  const rng = seeded(seed);
  let world = createWorld();
  const makro = () => ({ zins: 0.03, kaufkraft: 1, branchenMultiplikator: branchenMultiplikatoren(world) });
  let market = createMarket({ rng, woche: 0, makro: makro() }).state;
  const c = cities[0] as any;
  let g: GuestsState = { setup: { slots: { maschine: 1, theke: 1, moebel: 1, waende_licht: 1, terrasse: 0 }, preisIndex: 1, personal: 3, moral: 0.7, sterne: 3, marketing: 0.3 }, nachbarschaft: c.nachbarschaften[0], stadt: c, woche: 0, gaesteGesamt: 0, letztesErgebnis: null };
  let cash = 50000; const umsatz: number[] = []; let events = 0;
  for (let w = 1; w <= weeks; w++) {
    const wr = stepWorld(world, { rng, woche: w }); world = wr.state; events += wr.notes.length;
    const mr = stepMarket(market, { rng, woche: w, makro: makro() }); market = mr.state; cash += ledgerTotal(mr.ledger);
    const gr = wocheSimulieren(g, { rng, saisonSommer: w % 52 > 20 && w % 52 < 36, rivalenDruck: 0.3, modifier: (z) => modifier(world, z) });
    g = gr.state; cash += ledgerTotal(gr.ledger); umsatz.push(ledgerTotal(gr.ledger));
    if (w === 10) { const t = market.firmen.find((f) => f.kurs != null); if (t) { const r = buyShares(market, t.id, 0.01, cash); market = r.state; cash += ledgerTotal(r.ledger); } }
    if (w === 12) { const p = market.firmen.find((f) => f.kurs == null); if (p) { const r = investVenture(market, p.id, 5000, cash); market = r.state; cash += ledgerTotal(r.ledger); } }
  }
  return { world, market, cash, umsatz, events };
}

describe("2.0 Engine-Module Gameloop", () => {
  for (const weeks of [52, 200]) it(`${weeks} Wochen stabil, ohne NaN`, () => {
    const r = run(weeks, 42);
    expect(Number.isFinite(r.cash)).toBe(true);
    expect(Number.isFinite(portfolioValue(r.market))).toBe(true);
    expect(r.umsatz.every((u) => Number.isFinite(u) && u >= 0)).toBe(true);
    expect(r.market.firmen.every((f) => Number.isFinite(f.bewertung) && f.bewertung >= 0)).toBe(true);
    expect(r.market.firmen.length).toBeGreaterThan(5);
    console.log(weeks, "Wo: Cash", Math.round(r.cash), "Ø Umsatz", Math.round(r.umsatz.reduce((a, b) => a + b, 0) / weeks), "Firmen", r.market.firmen.length, "Meldungen", r.events);
  });
  it("Kaufmodifier bleiben begrenzt", () => {
    const r = run(200, 7);
    for (const z of ["kaffeepreis", "nachfrage", "miete"]) { const m = modifier(r.world, z); expect(m).toBeGreaterThanOrEqual(0.5); expect(m).toBeLessThanOrEqual(2); }
  });
  it("deterministisch bei gleichem Seed", () => {
    expect(run(52, 3).cash).toBe(run(52, 3).cash);
  });
});
