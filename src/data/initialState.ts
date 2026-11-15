import type { GameState } from "@/engine/types";
import { GAME_CONFIG, calculateCompanyValuation, dateForWeek } from "@/engine/engine";
import { BEAN_VARIETIES, CITIES, GAME_EVENTS, PUBLIC_COMPANIES, STARTUPS } from "./cities";
import { createManagement } from '@/engine/management';
import { createEquipment } from '@/engine/equipment';
import { createWorld } from '@/engine/world';
import { createProgress, makeGoals } from '@/engine/progression';
import { createTycoon } from '@/engine/tycoonState';

export function createInitialState(): GameState {
  const city = CITIES.find((candidate) => candidate.id === "berlin") ?? CITIES[0];
  if (!city) throw new Error('Startstadt fehlt');
  const district = city.districts.find((candidate) => candidate.id === 'berlin-09') ?? city.districts[0];
  if (!district) throw new Error('Startstandort fehlt');
  const state: GameState = {
    schemaVersion: GAME_CONFIG.SCHEMA_VERSION,
    management: createManagement(GAME_CONFIG.START_CASH),
    world: createWorld(),
    tycoon: createTycoon(),
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
    cities: CITIES,
    stores: [
      {
        id: "store-1",
        equipment: createEquipment(),
        cityId: city.id,
        name: `Kiosk ${district.name}`,
        districtId: district.id,
        tier: 1,
        employees: [
          { id: "emp-1", name: "Lena", role: "barista", skill: 40, salaryWeekly: 550, hiredAtWeek: 1 },
        ],
        qualityIndex: 50,
        pricePerCup: 3.8,
        weeklyRevenue: 0,
        customersServedLastWeek: 0,
        openedAtWeek: 1,
      },
    ],
    roastery: {
      owned: false,
      rawBeanStockKg: 0,
      roastedStockKg: 0,
      roastLossPercent: 16,
      capacityKgPerWeek: 500,
      employees: [],
      autoRestock: true,
      safetyStockKg: 100,
      beanLots: [],
    },
    market: {
      futuresPricePerKg: GAME_CONFIG.FUTURES_ANCHOR_PRICE,
      volatility: 4,
      priceHistory: [GAME_CONFIG.FUTURES_ANCHOR_PRICE],
      beanVarieties: BEAN_VARIETIES,
    },
    b2b: { contracts: [], lifetimeVolumeKg: 0 },
    capitalMarkets: {
      isPublic: false,
      ipoWeek: null,
      sharePrice: 0,
      sharesOutstanding: 0,
      marketCap: 0,
      rivals: PUBLIC_COMPANIES,
      holdings: [],
      startups: STARTUPS,
      luxuryGoods: [],
    },
    eventDeck: GAME_EVENTS,
    pendingEvent: null,
    resolvedEventIds: [],
    lastReport: null,
  };
  const ready = { ...state, companyValuation: calculateCompanyValuation(state) };
  return { ...ready, progress: { ...createProgress(ready), goals: makeGoals(ready) } };
}
