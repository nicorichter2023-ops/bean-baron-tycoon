import { describe, expect, it } from "vitest";
import {
  acquireStartup,
  applyEventChoice,
  buyBeans,
  buyShares,
  fireEmployee,
  hireEmployee,
  investInStartup,
  loadGame,
  openStore,
  processTurn,
  repayLoan,
  saveGame,
  sellShares,
  signB2BContract,
  takeLoan,
  upgradeStore,
} from "@/engine";
import { createInitialState } from "@/data";
import { translateEngineNote } from "@/game/logMessages";
import type { GameState } from "@/engine/types";

function unlockedState(): GameState {
  const state = createInitialState();
  return {
    ...state,
    cash: 1_000_000_000_000,
    unlockedModules: ["core_cafe", "roastery", "b2b_trade", "capital_markets"],
    roastery: { ...state.roastery, owned: true, autoRestock: false, roastedStockKg: 1_000 },
  };
}

describe("Coffee Empire Inhalte und Spieleraktionen", () => {
  it("initialisiert 20 Städte, 20 Bohnen, 15 Aktien, 20 Startups und 60 Ereignisse", () => {
    const state = createInitialState();
    expect(state.cities).toHaveLength(20);
    expect(state.market.beanVarieties).toHaveLength(20);
    expect(state.capitalMarkets.rivals).toHaveLength(15);
    expect(state.capitalMarkets.startups).toHaveLength(20);
    expect(state.eventDeck).toHaveLength(60);
  });

  it("eröffnet und erweitert eine Filiale in einer beliebigen Stadt", () => {
    const state = unlockedState();
    const city = state.cities.find((item) => item.id === "tokio")!;
    const district = city.districts.find((item) => item.maxStoreTier >= 2)!;
    const opened = openStore(state, city.id, district.id, 1);
    expect(opened.ok).toBe(true);
    expect(opened.state.stores.at(-1)?.cityId).toBe("tokio");
    const upgraded = upgradeStore(opened.state, opened.state.stores.at(-1)!.id);
    expect(upgraded.ok).toBe(true);
    expect(upgraded.state.stores.at(-1)?.tier).toBe(2);
  });

  it("einstellt und entlässt Baristas und Manager", () => {
    const state = createInitialState();
    const storeId = state.stores[0]!.id;
    const barista = hireEmployee(state, storeId, "barista");
    const manager = hireEmployee(barista.state, storeId, "manager");
    expect(manager.state.stores[0]?.employees).toHaveLength(3);
    const employeeId = manager.state.stores[0]!.employees.at(-1)!.id;
    const fired = fireEmployee(manager.state, storeId, employeeId);
    expect(fired.ok).toBe(true);
    expect(fired.state.stores[0]?.employees).toHaveLength(2);
  });

  it("Personal erhöht Kapazität und Servicequalität", () => {
    const empty = createInitialState();
    empty.stores[0]!.employees = [];
    const staffed = createInitialState();
    staffed.stores[0]!.employees.push({ id: "manager-test", name: "Test", role: "manager", skill: 90, salaryWeekly: 1000, hiredAtWeek: 1 });
    const emptyResult = processTurn(empty).stores[0]!;
    const staffedResult = processTurn(staffed).stores[0]!;
    expect(staffedResult.customersServedLastWeek).toBeGreaterThan(emptyResult.customersServedLastWeek);
    expect(staffedResult.qualityIndex).toBeGreaterThan(emptyResult.qualityIndex);
  });

  it("nimmt 10.000 € Kredit auf und tilgt 4.000 €", () => {
    const state = createInitialState();
    const taken = takeLoan(state, 10_000);
    expect(taken.state.cash).toBe(state.cash + 10_000);
    expect(taken.state.debt).toBe(10_000);
    const repaid = repayLoan(taken.state, 4_000);
    expect(repaid.state.debt).toBe(6_000);
    expect(repaid.state.cash).toBe(state.cash + 6_000);
  });

  it("kauft drei und verkauft zwei Aktien einer der 15 Firmen", () => {
    const state = unlockedState();
    const company = state.capitalMarkets.rivals[0]!;
    const bought = buyShares(state, company.id, 3);
    expect(bought.state.capitalMarkets.holdings[0]?.shares).toBe(3);
    expect(bought.state.cash).toBe(state.cash - 3 * company.sharePrice);
    const sold = sellShares(bought.state, company.id, 2);
    expect(sold.state.capitalMarkets.holdings[0]?.shares).toBe(1);
    expect(sold.state.cash).toBe(bought.state.cash + 2 * company.sharePrice);
  });

  it("finanziert ein Startup und übernimmt ein anderes", () => {
    const state = unlockedState();
    const [first, second] = state.capitalMarkets.startups;
    const funded = investInStartup(state, first!.id, first!.requiredFunding);
    expect(funded.state.capitalMarkets.startups[0]?.investedAmount).toBe(first!.requiredFunding);
    const acquired = acquireStartup(funded.state, second!.id);
    expect(acquired.state.capitalMarkets.startups[1]?.acquired).toBe(true);
    expect(acquired.state.cash).toBe(funded.state.cash - second!.valuation);
  });

  it("lagert 10 kg Bohnen ein und schließt einen 25-kg-Vertrag über 12 Wochen ab", () => {
    const state = unlockedState();
    const bean = state.market.beanVarieties[0]!;
    const bought = buyBeans(state, bean.id, 10);
    expect(bought.state.roastery.rawBeanStockKg).toBe(10);
    expect(bought.state.roastery.beanLots[0]?.quantityKg).toBe(10);
    const signed = signB2BContract(bought.state, "Testpartner", 25, 12, 18);
    expect(signed.state.b2b.contracts[0]).toMatchObject({ volumeKgPerWeek: 25, weeksRemaining: 12, pricePerKg: 18 });
    expect(processTurn(signed.state).b2b.contracts[0]?.weeksRemaining).toBe(11);
  });

  it("erzwingt eine Ereignisentscheidung und wendet alle drei Auswirkungen an", () => {
    const state = createInitialState();
    const turned = processTurn(state);
    const event = turned.pendingEvent!;
    expect(event).not.toBeNull();
    expect(processTurn(turned).week).toBe(turned.week);
    const choice = event.choices[0]!;
    const resolved = applyEventChoice(turned, 0);
    expect(resolved.state.cash).toBe(turned.cash + choice.cashImpact);
    expect(resolved.state.brandReputation).toBe(turned.brandReputation + choice.reputationImpact);
    expect(resolved.state.market.futuresPricePerKg).toBeCloseTo(turned.market.futuresPricePerKg * choice.beanPriceMultiplier, 2);
    expect(resolved.state.pendingEvent).toBeNull();
  });

  it("übersetzt den Großhandelshinweis ins Deutsche", () => {
    expect(translateEngineNote("EXTERNAL_SUPPLY_ONLY")).toBe("Bohnen über Großhandel bezogen (Aufpreis).");
  });

  it("speichert Woche und schemaVersion 4 und lädt beides wieder", () => {
    localStorage.clear();
    const turned = processTurn(createInitialState());
    saveGame(turned);
    const loaded = loadGame();
    expect(loaded.schemaVersion).toBe(4);
    expect(loaded.week).toBe(2);
    expect(loaded.pendingEvent?.id).toBe(turned.pendingEvent?.id);
  });
});
