import type { GameState } from "./types";
import { GAME_CONFIG, calculateCompanyValuation } from "./engine";
import { createInitialState } from "@/data/initialState";
import { balanceSheet, createManagement } from './management';
import { createEquipment } from './equipment';
import { createWorld } from './world';
import { createProgress } from './progression';
import { createCafeState, defaultStoreCafe } from './cafe';
import { MASTER_CITIES, MASTER_STOCKS, MASTER_STARTUPS } from '@/data/master';
import { createTycoon } from './tycoonState';

const KEY = "coffee-empire-save";

function migrateV1ToV2(old: any): GameState {
  const fresh = createInitialState();
  const city = fresh.cities.find((candidate) => candidate.id === old.city?.id) ?? fresh.city;
  const stores = Array.isArray(old.stores)
    ? old.stores.map((store: any) => {
        const oldDistrict = old.city?.districts?.find((district: any) => district.id === store.districtId);
        const district = city.districts.find((candidate) => candidate.name === oldDistrict?.name) ?? city.districts[0];
        return { ...store, cityId: city.id, districtId: district?.id ?? store.districtId };
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
  const migrated = { ...state, schemaVersion: 3 as const, management: createManagement(state.cash) };
  return { ...migrated, management: state.management ?? createManagement(state.cash, balanceSheet(migrated).inventory) };
}
export function migrateV3ToV4(state: GameState): GameState {
  return { ...state, schemaVersion: 4, stores: state.stores.map(s => ({ ...s, equipment: { ...createEquipment(), ...s.equipment } })) };
}
export function migrateV4ToV5(state: GameState): GameState {
  const world = state.world ?? createWorld();
  // Preserve legacy locations in the save; the 30 named master properties are added, never substituted for an owned lease.
  const cities = MASTER_CITIES.map(c => {
    const old = state.cities.find(x => x.id === c.id);
    return { ...c, districts: [...c.districts, ...(old?.districts.filter(d => !c.districts.some(x => x.id === d.id) && state.stores.some(s => s.districtId === d.id)) ?? [])] };
  });
  for (const c of state.cities.filter(c => !cities.some(x => x.id === c.id) && state.stores.some(s => s.cityId === c.id))) cities.push(c);
  for (const s of state.stores) delete world.occupants[s.districtId];
  return { ...state, schemaVersion: 5, world, cities, city: cities.find(c => c.id === state.city.id) ?? cities[0] ?? state.city,
    capitalMarkets: { ...state.capitalMarkets,
      rivals: [...state.capitalMarkets.rivals, ...MASTER_STOCKS.filter(s => !state.capitalMarkets.rivals.some(x => x.id === s.id))],
      startups: [...state.capitalMarkets.startups, ...MASTER_STARTUPS.filter(s => !state.capitalMarkets.startups.some(x => x.id === s.id))] } };
}
/** Adds progression: legacy tiers 1/2/3 become stages 2/4/7, visited cities stay open, tutorial skipped. */
export function migrateV5ToV6(state: GameState): GameState {
  const progress = state.progress ?? createProgress(state, true);
  const visited = state.world?.travelHistory?.map(t => t.to) ?? [];
  return { ...state, schemaVersion: 6, progress: { ...progress, extraCities: [...new Set([...progress.extraCities, ...visited, state.city.id])] } };
}
/** Café depth: legacy equipment becomes 5-level gear (0/1/2 -> 0/2/4), default menu, no XP. */
export function migrateV6ToV7(state: GameState): GameState {
  const cafe = state.cafe ?? createCafeState();
  return { ...state, schemaVersion: 7, cafe: { ...cafe, stores: Object.fromEntries(state.stores.map(s => [s.id, cafe.stores[s.id] ?? defaultStoreCafe(s)])) } };
}
export function migrateV7ToV8(state: GameState): GameState {
  return { ...state, schemaVersion: 8, tycoon: state.tycoon ?? createTycoon() };
}
const migrations: Record<number, (state: any) => GameState> = { 1: migrateV1ToV2, 2: migrateV2ToV3, 3: migrateV3ToV4, 4: migrateV4ToV5, 5: migrateV5ToV6, 6: migrateV6ToV7, 7: migrateV7ToV8 };

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
