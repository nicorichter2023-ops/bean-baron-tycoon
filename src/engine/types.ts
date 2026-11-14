export interface City { id: string; name: string; country: string; region: string; biome: string; population: number; demand: number; rent: number; cafeCost: number }
export interface Cafe { id: string; cityId: string; level: number }
export interface Roastery { id: string; cityId: string; capacity: number }
export interface Loan { id: string; amount: number; rate: number; weeksLeft: number }
export interface Contract { id: string; client: string; kgPerWeek: number; pricePerKg: number; weeksLeft: number }
export interface GameState {
  schemaVersion: number;
  week: number;
  cash: number;
  beansKg: number;
  coffeePrice: number;
  priceHistory: number[];
  cafes: Cafe[];
  roasteries: Roastery[];
  loans: Loan[];
  contracts: Contract[];
  upgrades: string[];
  log: string[];
}
