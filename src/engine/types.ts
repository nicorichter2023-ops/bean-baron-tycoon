// ============================================================
// Coffee Empire: Bean to Billion — types.ts
// Zentrales Datenmodell (schemaVersion: 1)
// Der GameState muss reines JSON bleiben (siehe IsJson-Guard unten).
// ============================================================

export type SchemaVersion = 1;

export type ModuleId =
  | 'core_cafe'
  | 'roastery'
  | 'b2b_trade'
  | 'capital_markets';

export type Biome =
  | 'european_classic'
  | 'modern_industrial'
  | 'asian_zen'
  | 'tropical_colonial';

/** 1 = Kiosk, 2 = Café, 3 = Flagship */
export type StoreTier = 1 | 2 | 3;

export type EmployeeRole = 'barista' | 'manager' | 'roaster' | 'trader';

export type RiskClass = 'low' | 'medium' | 'high' | 'moonshot';

export type Era =
  | 'street_vendor'
  | 'local_chain'
  | 'national_brand'
  | 'global_empire';

export type LuxuryGoodId =
  | 'penthouse'
  | 'sports_car'
  | 'yacht'
  | 'private_jet';

// -----------------------------------------------------------
// Stadt & Distrikte
// -----------------------------------------------------------

export interface District {
  id: string;
  name: string;
  /** Laufpublikum, 0–100 */
  footTraffic: number;
  /** Wochenmiete Basis in € (wird mit Store-Tier multipliziert) */
  rentWeekly: number;
  /** Konkurrenzdruck, 0–100 */
  competition: number;
  /** Maximales erlaubtes Store-Tier in diesem Distrikt */
  maxStoreTier: StoreTier;
}

export interface City {
  id: string;
  name: string;
  biome: Biome;
  /** Kaufkraft-Multiplikator, 0.5–2.0 */
  purchasingPower: number;
  /** Kaffeekultur-Index, 0–100 (Nachfrage-Steigerung) */
  coffeeCultureIndex: number;
  districts: District[];
}

// -----------------------------------------------------------
// Personal & Filialen
// -----------------------------------------------------------

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  /** Skill 0–100 */
  skill: number;
  salaryWeekly: number;
  hiredAtWeek: number;
}

export interface Store {
  id: string;
  name: string;
  districtId: string;
  tier: StoreTier;
  employees: Employee[];
  /** Qualitätsindex 0–100 (driftet Richtung Personal-/Tier-Niveau) */
  qualityIndex: number;
  /** Verkaufspreis pro Tasse in € */
  pricePerCup: number;
  /** Umsatz der letzten abgerechneten Woche in € */
  weeklyRevenue: number;
  /** Bediente Kunden der letzten Woche */
  customersServedLastWeek: number;
  openedAtWeek: number;
}

// -----------------------------------------------------------
// Rösterei & Rohbohnen
// -----------------------------------------------------------

export interface Roastery {
  owned: boolean;
  /** Rohbohnenbestand in kg */
  rawBeanStockKg: number;
  /** Fertig gerösteter Bestand in kg */
  roastedStockKg: number;
  /** Röstverlust in Prozent (typisch 12–20) */
  roastLossPercent: number;
  /** Max. Röstmenge pro Woche in kg */
  capacityKgPerWeek: number;
  employees: Employee[];
  /** Kauft automatisch Rohbohnen nach, wenn Bestand unter dem Bedarf/safetyStockKg liegt */
  autoRestock: boolean;
  safetyStockKg: number;
}

// -----------------------------------------------------------
// Kaffeebörse (Futures)
// -----------------------------------------------------------

export interface CoffeeMarket {
  /** Aktueller Futures-Preis in €/kg Rohbohne */
  futuresPricePerKg: number;
  /** Volatilität in Prozent pro Woche */
  volatility: number;
  /** Preisverlauf (älteste zuerst, max. 104 Einträge) */
  priceHistory: number[];
}

// -----------------------------------------------------------
// B2B-Handel
// -----------------------------------------------------------

export interface B2BContract {
  id: string;
  partnerName: string;
  /** Liefermenge pro Woche in kg Röstkaffee */
  volumeKgPerWeek: number;
  /** Fixpreis in €/kg */
  pricePerKg: number;
  weeksRemaining: number;
  /** Zahlungsmoral 0–100, beeinflusst Skonto/Ausfallrisiko */
  reliability: number;
}

export interface B2BState {
  contracts: B2BContract[];
  /** Abgeschlossene Lifetime-Liefermenge in kg */
  lifetimeVolumeKg: number;
}

// -----------------------------------------------------------
// Kapitalmarkt (Endgame)
// -----------------------------------------------------------

export interface RivalCompany {
  id: string;
  name: string;
  /** Unternehmensbewertung in € */
  valuation: number;
  /** Aggressivität 0–100 (höher = fordert höheren Übernahmeaufschlag) */
  aggression: number;
  /** Marktanteil 0–100 */
  marketShare: number;
  /** Synergiepotenzial 0–100 (senkt geforderte Prämie) */
  strategicSynergy: number;
  acquired: boolean;
  acquiredAtWeek: number | null;
}

export interface StartupInvestment {
  id: string;
  name: string;
  riskClass: RiskClass;
  investedAmount: number;
  /** Erfolgschance 0–100 (Gesamtwahrscheinlichkeit, dass das Investment am Ende erfolgreich ist) */
  successChance: number;
  /** Auszahlungs-Multiple bei Erfolg */
  payoutMultiple: number;
  investedAtWeek: number;
  status: 'active' | 'succeeded' | 'failed';
}

export interface LuxuryGood {
  id: LuxuryGoodId;
  displayName: string;
  purchaseCost: number;
  upkeepWeekly: number;
  /** Prestigepunkte, speisen langfristig die Markenreputation */
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
  startups: StartupInvestment[];
  luxuryGoods: LuxuryGood[];
}

// -----------------------------------------------------------
// Reporting
// -----------------------------------------------------------

export interface TurnReport {
  week: number;
  revenueCafes: number;
  revenueB2B: number;
  /** Auszahlungen aus Startup-Exits */
  revenueCapital: number;
  /** revenueCafes + revenueB2B + revenueCapital */
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

// -----------------------------------------------------------
// Root State
// -----------------------------------------------------------

export interface GameState {
  schemaVersion: SchemaVersion;
  /** Turn-Zähler (startet bei 1) */
  week: number;
  /** ISO-Datum YYYY-MM-DD des aktuellen Turns (abgeleitet aus week) */
  dateIso: string;
  cash: number;
  debt: number;
  /** Wöchentlicher Zinssatz auf Schulden (z. B. 0.0012) */
  weeklyInterestRate: number;
  companyValuation: number;
  /** Markenreputation 0–100 */
  brandReputation: number;
  era: Era;
  unlockedModules: ModuleId[];
  city: City;
  stores: Store[];
  roastery: Roastery;
  market: CoffeeMarket;
  b2b: B2BState;
  capitalMarkets: CapitalMarketsState;
  lastReport: TurnReport | null;
}

// -----------------------------------------------------------
// Compile-Time-Garantie: GameState ist reines JSON
// (kein Date, Map, Set, keine Funktionen, kein undefined)
// -----------------------------------------------------------

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

/** Build bricht, wenn GameState nicht mehr JSON-serialisierbar ist. */
export const GAME_STATE_JSON_GUARD: GameStateIsJsonSerializable = true;
