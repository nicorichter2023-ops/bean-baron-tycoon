// Erweiterung: Rezeptur-Labor & Marketing. Eigener Speicherstand, damit engine.ts/types.ts unverändert bleiben.
import type { GameState, Store } from './types';

export const EXPANSION_SCHEMA = 1;
export const EXPANSION_KEY = 'coffee-empire-expansion';

export type Base = 'espresso' | 'double' | 'coldbrew' | 'pourover';
export type Milk = 'none' | 'whole' | 'oat' | 'almond';
export type Extra = 'none' | 'caramel' | 'vanilla' | 'cinnamon';
export interface Recipe { id: string; name: string; base: Base; milk: Milk; extra: Extra; price: number; createdWeek: number; }
export type CampaignKind = 'social' | 'poster' | 'tasting';
export interface Campaign { id: string; kind: CampaignKind; cityId: string; weeksLeft: number; }
export interface ExpansionState { schemaVersion: number; recipes: Recipe[]; campaigns: Campaign[]; lastBonus: number; }

export const BASES: Record<Base, { label: string; cost: number; quality: number }> = {
  espresso: { label: 'Espresso', cost: 0.45, quality: 6 }, double: { label: 'Double Shot', cost: 0.8, quality: 9 },
  coldbrew: { label: 'Cold Brew', cost: 0.7, quality: 8 }, pourover: { label: 'Pour-Over', cost: 0.6, quality: 10 },
};
export const MILKS: Record<Milk, { label: string; cost: number; quality: number }> = {
  none: { label: 'Ohne Milch', cost: 0, quality: 0 }, whole: { label: 'Vollmilch', cost: 0.25, quality: 3 },
  oat: { label: 'Hafermilch', cost: 0.4, quality: 5 }, almond: { label: 'Mandelmilch', cost: 0.45, quality: 4 },
};
export const EXTRAS: Record<Extra, { label: string; cost: number; quality: number }> = {
  none: { label: 'Kein Extra', cost: 0, quality: 0 }, caramel: { label: 'Karamell', cost: 0.2, quality: 3 },
  vanilla: { label: 'Vanille', cost: 0.2, quality: 3 }, cinnamon: { label: 'Zimt & Kardamom', cost: 0.15, quality: 4 },
};
export const CAMPAIGNS: Record<CampaignKind, { label: string; cost: number; weeks: number; boost: number; reputation: number }> = {
  social: { label: 'Social-Media-Hype', cost: 2500, weeks: 2, boost: 0.15, reputation: 0.5 },
  poster: { label: 'Plakatwerbung', cost: 4000, weeks: 6, boost: 0.07, reputation: 0.3 },
  tasting: { label: 'Barista-Tasting', cost: 1500, weeks: 1, boost: 0.05, reputation: 2 },
};
// Vorlieben je Stadtbiom: passende Zutaten geben Bonus.
export const BIOME_TASTE: Record<string, { milk: Milk; base: Base }> = {
  european_classic: { milk: 'whole', base: 'espresso' }, modern_industrial: { milk: 'oat', base: 'pourover' },
  east_asian: { milk: 'almond', base: 'coldbrew' }, tropical: { milk: 'none', base: 'coldbrew' },
};
export const MAX_RECIPES = 4;

export const createExpansion = (): ExpansionState => ({ schemaVersion: EXPANSION_SCHEMA, recipes: [], campaigns: [], lastBonus: 0 });
export const recipeCost = (r: Pick<Recipe, 'base' | 'milk' | 'extra'>) => +(BASES[r.base].cost + MILKS[r.milk].cost + EXTRAS[r.extra].cost).toFixed(2);
export const recipeQuality = (r: Pick<Recipe, 'base' | 'milk' | 'extra'>) => BASES[r.base].quality + MILKS[r.milk].quality + EXTRAS[r.extra].quality;
/** Fairer Preis: Qualität × 0,25 € + Kosten. Darüber sinkt die Nachfrage. */
export const fairPrice = (r: Pick<Recipe, 'base' | 'milk' | 'extra'>) => +(recipeCost(r) + recipeQuality(r) * 0.25).toFixed(2);

/** Verkaufte Tassen pro Woche und Filiale für ein Rezept. */
export function cupsSold(r: Recipe, store: Store, biome: string, boost: number) {
  const taste = BIOME_TASTE[biome];
  const match = (taste?.milk === r.milk ? 1.25 : 1) * (taste?.base === r.base ? 1.2 : 1);
  const priceFactor = Math.max(0, Math.min(1.3, 1.5 - (r.price / fairPrice(r)) * 0.5));
  return Math.round(store.customersServedLastWeek * 0.12 * match * priceFactor * (1 + boost));
}

export function weekBonus(game: GameState, exp: ExpansionState) {
  let profit = 0; let reputation = 0;
  for (const store of game.stores) {
    const city = game.cities.find((c) => c.id === store.cityId);
    const camps = exp.campaigns.filter((c) => c.cityId === store.cityId);
    const boost = camps.reduce((s, c) => s + CAMPAIGNS[c.kind].boost, 0);
    profit += store.weeklyRevenue * boost * 0.5;
    for (const r of exp.recipes) profit += cupsSold(r, store, city?.biome ?? '', boost) * (r.price - recipeCost(r));
  }
  for (const c of exp.campaigns) reputation += CAMPAIGNS[c.kind].reputation;
  return { profit: Math.round(profit), reputation };
}

/** Nach processTurn aufrufen: schreibt Gewinn gut und lässt Kampagnen auslaufen. */
export function applyExpansionWeek(game: GameState, exp: ExpansionState) {
  const { profit, reputation } = weekBonus(game, exp);
  return {
    game: { ...game, cash: game.cash + profit, brandReputation: Math.min(100, game.brandReputation + reputation) },
    exp: { ...exp, lastBonus: profit, campaigns: exp.campaigns.map((c) => ({ ...c, weeksLeft: c.weeksLeft - 1 })).filter((c) => c.weeksLeft > 0) },
  };
}

export function addRecipe(exp: ExpansionState, r: Omit<Recipe, 'id'>): ExpansionState | string {
  if (!r.name.trim()) return 'Bitte gib dem Getränk einen Namen.';
  if (exp.recipes.length >= MAX_RECIPES) return `Maximal ${MAX_RECIPES} Signature Drinks.`;
  if (r.price <= recipeCost(r)) return 'Der Preis muss über den Zutatenkosten liegen.';
  return { ...exp, recipes: [...exp.recipes, { ...r, name: r.name.trim(), id: `r${Date.now()}` }] };
}

export function startCampaign(game: GameState, exp: ExpansionState, kind: CampaignKind, cityId: string): { game: GameState; exp: ExpansionState } | string {
  const c = CAMPAIGNS[kind];
  if (game.cash < c.cost) return 'Nicht genug Barvermögen.';
  if (exp.campaigns.some((x) => x.kind === kind && x.cityId === cityId)) return 'Diese Kampagne läuft hier bereits.';
  return { game: { ...game, cash: game.cash - c.cost }, exp: { ...exp, campaigns: [...exp.campaigns, { id: `c${Date.now()}`, kind, cityId, weeksLeft: c.weeks }] } };
}

export function loadExpansion(): ExpansionState {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(EXPANSION_KEY) : null;
    if (!raw) return createExpansion();
    const data = JSON.parse(raw);
    return { ...createExpansion(), ...data, schemaVersion: EXPANSION_SCHEMA };
  } catch { return createExpansion(); }
}
export const saveExpansion = (exp: ExpansionState) => { try { localStorage.setItem(EXPANSION_KEY, JSON.stringify(exp)); } catch { /* voll */ } };
