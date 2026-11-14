import type { GameState } from "./types";
import { CITIES } from "@/data";

export const SCHEMA_VERSION = 1;
export const START_YEAR = 2026;

export function createInitialState(): GameState {
  return { schemaVersion: SCHEMA_VERSION, week: 1, cash: 250_000, beansKg: 500, coffeePrice: 4.2, priceHistory: [4.2], cafes: [], roasteries: [], loans: [], contracts: [], upgrades: [], log: ["Willkommen bei Coffee Empire!"] };
}

const uid = () => Math.random().toString(36).slice(2, 9);
const city = (id: string) => CITIES.find((c) => c.id === id)!;

export function companyValue(s: GameState) {
  const assets = s.cafes.reduce((a, c) => a + city(c.cityId).cafeCost * (0.8 + c.level * 0.2), 0) + s.roasteries.length * 150_000 + s.beansKg * s.coffeePrice;
  return s.cash + assets - s.loans.reduce((a, l) => a + l.amount, 0);
}

export function dateLabel(week: number) {
  const year = START_YEAR + Math.floor((week - 1) / 52);
  return { year, weekOfYear: ((week - 1) % 52) + 1 };
}

export function advanceWeek(s: GameState): GameState {
  const n: GameState = structuredClone(s);
  const log: string[] = [];
  // Bohnenpreis Random Walk
  n.coffeePrice = Math.max(1.5, +(s.coffeePrice * (1 + (Math.random() - 0.5) * 0.08)).toFixed(2));
  n.priceHistory = [...s.priceHistory, n.coffeePrice].slice(-26);
  // Röstereien produzieren
  n.beansKg += n.roasteries.reduce((a, r) => a + r.capacity, 0);
  // Cafés
  let revenue = 0, costs = 0;
  for (const c of n.cafes) {
    const ct = city(c.cityId);
    const cups = Math.round(ct.population / 10_000 * ct.demand * (1 + c.level * 0.3));
    const kg = cups * 0.018;
    const served = Math.min(1, n.beansKg / Math.max(kg, 1));
    n.beansKg = Math.max(0, n.beansKg - kg);
    revenue += cups * served * 3.5;
    costs += ct.rent + 1800 * c.level;
  }
  // Verträge
  for (const k of n.contracts) {
    if (n.beansKg >= k.kgPerWeek) { n.beansKg -= k.kgPerWeek; revenue += k.kgPerWeek * k.pricePerKg; }
    else log.push(`Lieferung an ${k.client} verfehlt!`);
    k.weeksLeft--;
  }
  n.contracts = n.contracts.filter((k) => k.weeksLeft > 0);
  // Kredite
  for (const l of n.loans) {
    const pay = l.amount / l.weeksLeft + l.amount * l.rate / 52;
    costs += pay; l.amount -= l.amount / l.weeksLeft; l.weeksLeft--;
  }
  n.loans = n.loans.filter((l) => l.weeksLeft > 0);
  n.cash += revenue - costs;
  n.week++;
  log.unshift(`Woche ${s.week}: Umsatz ${Math.round(revenue).toLocaleString("de-DE")} €, Kosten ${Math.round(costs).toLocaleString("de-DE")} €`);
  n.log = [...log, ...s.log].slice(0, 30);
  return n;
}

export const actions = {
  openCafe(s: GameState, cityId: string): GameState {
    const c = city(cityId); if (s.cash < c.cafeCost) return s;
    return { ...s, cash: s.cash - c.cafeCost, cafes: [...s.cafes, { id: uid(), cityId, level: 1 }], log: [`Café in ${c.name} eröffnet`, ...s.log] };
  },
  upgradeCafe(s: GameState, id: string): GameState {
    const cost = 25_000; if (s.cash < cost) return s;
    return { ...s, cash: s.cash - cost, cafes: s.cafes.map((c) => (c.id === id ? { ...c, level: c.level + 1 } : c)) };
  },
  buildRoastery(s: GameState, cityId: string): GameState {
    const cost = 150_000; if (s.cash < cost) return s;
    return { ...s, cash: s.cash - cost, roasteries: [...s.roasteries, { id: uid(), cityId, capacity: 400 }] };
  },
  buyBeans(s: GameState, kg: number): GameState {
    const cost = kg * s.coffeePrice; if (s.cash < cost) return s;
    return { ...s, cash: s.cash - cost, beansKg: s.beansKg + kg };
  },
  takeContract(s: GameState, client: string, kgPerWeek: number, pricePerKg: number, weeks: number): GameState {
    return { ...s, contracts: [...s.contracts, { id: uid(), client, kgPerWeek, pricePerKg, weeksLeft: weeks }] };
  },
  takeLoan(s: GameState, amount: number, rate: number, weeks: number): GameState {
    return { ...s, cash: s.cash + amount, loans: [...s.loans, { id: uid(), amount, rate, weeksLeft: weeks }] };
  },
};
