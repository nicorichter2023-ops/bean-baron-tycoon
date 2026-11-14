import type { GameState } from "@/engine/types";
import { GAME_CONFIG, calculateCompanyValuation, dateForWeek } from "@/engine/engine";
import { CITIES } from "./cities";

export function createInitialState(): GameState {
  const city = CITIES[0]!;
  const s: GameState = {
    schemaVersion: GAME_CONFIG.SCHEMA_VERSION,
    week: 1,
    dateIso: dateForWeek(1),
    cash: GAME_CONFIG.START_CASH,
    debt: 0,
    weeklyInterestRate: 0.0012,
    companyValuation: 0,
    brandReputation: 20,
    era: "street_vendor",
    unlockedModules: ["core_cafe"],
    city,
    stores: [{
      id: "store-1", name: "Kiosk Kreuzberg", districtId: "ber-kreuzberg", tier: 1,
      employees: [{ id: "emp-1", name: "Lena", role: "barista", skill: 40, salaryWeekly: 550, hiredAtWeek: 1 }],
      qualityIndex: 50, pricePerCup: 3.8, weeklyRevenue: 0, customersServedLastWeek: 0, openedAtWeek: 1,
    }],
    roastery: { owned: false, rawBeanStockKg: 0, roastedStockKg: 0, roastLossPercent: 16, capacityKgPerWeek: 500, employees: [], autoRestock: true, safetyStockKg: 100 },
    market: { futuresPricePerKg: GAME_CONFIG.FUTURES_ANCHOR_PRICE, volatility: 4, priceHistory: [GAME_CONFIG.FUTURES_ANCHOR_PRICE] },
    b2b: { contracts: [], lifetimeVolumeKg: 0 },
    capitalMarkets: { isPublic: false, ipoWeek: null, sharePrice: 0, sharesOutstanding: 0, marketCap: 0, rivals: [], startups: [], luxuryGoods: [] },
    lastReport: null,
  };
  return { ...s, companyValuation: calculateCompanyValuation(s) };
}
