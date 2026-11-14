import type { GameState } from "./types";
import { GAME_CONFIG, calculateCompanyValuation } from "./engine";
import { createInitialState } from "@/data/initialState";
import { createManagement } from './management';

const KEY = "coffee-empire-save";

function migrateV1ToV2(old: any): GameState {
  const fresh = createInitialState();
  const city = fresh.cities.find((candidate) => candidate.id === old.city?.id) ?? fresh.city;
  const stores = Array.isArray(old.stores)
    ? old.stores.map((store: any) => {
        const oldDistrict = old.city?.districts?.find((district: any) => district.id === store.districtId);
        const district = city.districts.find((candidate) => candidate.name === oldDistrict?.name) ?? city.districts[0]!;
        return { ...store, cityId: city.id, districtId: district.id };
      })
    : fresh.stores;
  const migrated: GameState = {
    ...fresh,
    ...old,
    schemaVersion: 2,
    city,
    cities: fresh.cities,
    stores,
    roastery: { ...fresh.roastery, ...old.roastery, beanLots: old.roastery?.beanLots ?? [] },
    market: { ...fresh.market, ...old.market, beanVarieties: fresh.market.beanVarieties },
    capitalMarkets: {
      ...fresh.capitalMarkets,
      ...old.capitalMarkets,
      rivals: fresh.capitalMarkets.rivals,
      holdings: old.capitalMarkets?.holdings ?? [],
      startups: fresh.capitalMarkets.startups,
    },
    eventDeck: fresh.eventDeck,
    pendingEvent: null,
    resolvedEventIds: [],
  };
  return { ...migrated, companyValuation: calculateCompanyValuation(migrated) };
}

export function migrateV2ToV3(state: Omit<GameState, 'management'> & { management?: GameState['management'] }): GameState {
  return { ...state, schemaVersion: 3, management: state.management ?? createManagement(state.cash) };
}
const migrations: Record<number, (state: any) => GameState> = { 1: migrateV1ToV2, 2: migrateV2ToV3 };

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return createInitialState();
    let state = JSON.parse(raw);
    if (typeof state?.schemaVersion !== "number") return createInitialState();
    while (state.schemaVersion < GAME_CONFIG.SCHEMA_VERSION) {
      const migrate = migrations[state.schemaVersion];
      if (!migrate) return createInitialState();
      state = migrate(state);
    }
    if (state.schemaVersion !== GAME_CONFIG.SCHEMA_VERSION || !Array.isArray(state.cities) || !state.market?.beanVarieties) {
      return createInitialState();
    }
    return { ...state, management: state.management ?? createManagement(state.cash) } as GameState;
  } catch {
    return createInitialState();
  }
}

export const saveGame = (state: GameState) =>
  localStorage.setItem(KEY, JSON.stringify({ ...state, schemaVersion: GAME_CONFIG.SCHEMA_VERSION }));
export const resetGame = () => localStorage.removeItem(KEY);
