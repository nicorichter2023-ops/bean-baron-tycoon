// ============================================================
// Coffee Empire: Bean to Billion — zentrales, JSON-sicheres Datenmodell
// ============================================================

import type { ManagementState } from './management';
import type { StoreEquipment } from './equipment';
import type { WorldState } from './world';
export type SchemaVersion = 1 | 2 | 3 | 4 | 5;

export type ModuleId = 'core_cafe' | 'roastery' | 'b2b_trade' | 'capital_markets';
export type Biome = 'european_classic' | 'modern_industrial' | 'asian_zen' | 'tropical_colonial';
/** 1 = Kiosk, 2 = Café, 3 = Flagship */
export type StoreTier = 1 | 2 | 3;
export type EmployeeRole = 'barista' | 'manager' | 'roaster' | 'trader';
export type RiskClass = 'low' | 'medium' | 'high' | 'moonshot';
export type Era = 'street_vendor' | 'local_chain' | 'national_brand' | 'global_empire';
export type LuxuryGoodId = 'penthouse' | 'sports_car' | 'yacht' | 'private_jet';

export interface District {
  id: string;
  name: string;
  /** Laufpublikum, 0–100 */
  footTraffic: number;
  /** Wochenmiete Basis in € (wird mit Store-Tier multipliziert) */
  rentWeekly: number;
  /** Konkurrenzdruck, 0–100 */
  competition: number;
  maxStoreTier: StoreTier;
}

export interface City {
  id: string;
  name: string;
  country: string;
  landmarkName: string;
  biome: Biome;
  purchasingPower: number;
  coffeeCultureIndex: number;
  districts: District[];
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  skill: number;
  salaryWeekly: number;
  hiredAtWeek: number;
  trainingTier?: number;
}

export interface Store {
  equipment: StoreEquipment;
  propertyBookValue?: number;
  id: string;
  cityId: string;
  name: string;
  districtId: string;
  tier: StoreTier;
  employees: Employee[];
  qualityIndex: number;
  pricePerCup: number;
  weeklyRevenue: number;
  customersServedLastWeek: number;
  openedAtWeek: number;
}

export interface BeanVariety {
  id: string;
  name: string;
  originCountry: string;
  flavorProfile: string;
  basePricePerKg: number;
  marketVolatility: number;
  qualityScore: number;
}

export interface BeanLot {
  beanId: string;
  quantityKg: number;
  averagePricePerKg: number;
}

export interface Roastery {
  owned: boolean;
  rawBeanStockKg: number;
  roastedStockKg: number;
  roastLossPercent: number;
  capacityKgPerWeek: number;
  employees: Employee[];
  autoRestock: boolean;
  safetyStockKg: number;
  beanLots: BeanLot[];
}

export interface CoffeeMarket {
  futuresPricePerKg: number;
  volatility: number;
  priceHistory: number[];
  beanVarieties: BeanVariety[];
}

export interface B2BContract {
  id: string;
  partnerName: string;
  volumeKgPerWeek: number;
  pricePerKg: number;
  weeksRemaining: number;
  reliability: number;
}

export interface B2BState {
  contracts: B2BContract[];
  lifetimeVolumeKg: number;
}

export interface RivalCompany {
  id: string;
  name: string;
  ticker: string;
  description: string;
  sharePrice: number;
  sharesOutstanding: number;
  dividendYield: number;
  valuation: number;
  aggression: number;
  marketShare: number;
  strategicSynergy: number;
  acquired: boolean;
  acquiredAtWeek: number | null;
}

export interface StockHolding {
  companyId: string;
  shares: number;
  averagePrice: number;
}

export interface StartupInvestment {
  id: string;
  name: string;
  sector: string;
  valuation: number;
  requiredFunding: number;
  annualGrowthRate: number;
  riskClass: RiskClass;
  investedAmount: number;
  successChance: number;
  payoutMultiple: number;
  investedAtWeek: number;
  status: 'active' | 'succeeded' | 'failed';
  acquired: boolean;
  acquiredAtWeek: number | null;
}

export interface LuxuryGood {
  id: LuxuryGoodId;
  displayName: string;
  purchaseCost: number;
  upkeepWeekly: number;
  prestigeBonus: number;
  owned: boolean;
  acquiredAtWeek: number | null;
}

export interface CapitalMarketsState {
  isPublic: boolean;
  ipoWeek: number | null;
  sharePrice: number;
  sharesOutstanding: number;
  marketCap: number;
  rivals: RivalCompany[];
  holdings: StockHolding[];
  startups: StartupInvestment[];
  luxuryGoods: LuxuryGood[];
}

export interface EventChoice {
  text: string;
  cashImpact: number;
  reputationImpact: number;
  beanPriceMultiplier: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  eraRequirement: number;
  choices: EventChoice[];
}

export interface TurnReport {
  week: number;
  revenueCafes: number;
  revenueB2B: number;
  revenueCapital: number;
  revenueTotal: number;
  costSalaries: number;
  costRent: number;
  costBeans: number;
  costInterest: number;
  costLuxuryUpkeep: number;
  costTax: number;
  costTotal: number;
  netIncome: number;
  companyValuation: number;
  newUnlocks: ModuleId[];
  notes: string[];
}

export interface GameState {
  schemaVersion: SchemaVersion;
  management: ManagementState;
  week: number;
  dateIso: string;
  cash: number;
  debt: number;
  weeklyInterestRate: number;
  companyValuation: number;
  brandReputation: number;
  era: Era;
  unlockedModules: ModuleId[];
  /** Aktuell in der Weltkarte ausgewählte Stadt. */
  city: City;
  cities: City[];
  stores: Store[];
  roastery: Roastery;
  market: CoffeeMarket;
  b2b: B2BState;
  capitalMarkets: CapitalMarketsState;
  eventDeck: GameEvent[];
  pendingEvent: GameEvent | null;
  resolvedEventIds: string[];
  lastReport: TurnReport | null;
}

export interface ActionResult {
  state: GameState;
  ok: boolean;
  reason: string;
}

// Compile-Time-Garantie: GameState bleibt reines JSON.
type IsJson<T> = T extends string | number | boolean | null
  ? true
  : T extends (...args: never[]) => unknown
    ? false
    : T extends ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> | Date
      ? false
      : T extends readonly (infer U)[]
        ? IsJson<U>
        : T extends object
          ? { [K in keyof T]-?: IsJson<T[K]> }[keyof T] extends true
            ? true
            : false
          : false;

export type GameStateIsJsonSerializable = IsJson<GameState> extends true ? true : never;
export const GAME_STATE_JSON_GUARD: GameStateIsJsonSerializable = true;
