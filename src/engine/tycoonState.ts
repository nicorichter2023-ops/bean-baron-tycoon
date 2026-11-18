import type { GameState, Store } from './types';
import { FARM_METHODS, PROCESSES, TREND_DRINKS } from '@/data/tycoonContent';
import { MASTER, buildingById } from '@/data/master';

export interface Cargo { id: string; origin: string; kg: number; score: number; beanId: string; arrival: number; mode: 'sea' | 'air'; cost: number }
export interface FarmSetup { method: string; process: string; freight: 'sea' | 'air'; leased?: boolean }
export interface Franchise { id: string; districtId: string; cityId: string; quality: number; royalty: number; revenue: number; supplied: number; violations: number }
export interface RetailLine { id: string; chain: string; shelf: number; promotionUntil: number; units: number; income: number; lost: number }
export interface Review { week: number; storeId: string; stars: number; text: string; tag: string }
export interface PopUp { id: string; cityId: string; hotspot: string; until: number; revenue: number }
export interface RivalMove { rivalId: string; cityId: string; until: number; kind: 'price' | 'pr' | 'headhunt'; resolved: boolean }
export interface Landlord { districtId: string; rivalId: string; value: number; multiplier: number; endWeek: number; evict: boolean }
export interface Spy { rivalId: string; objective: 'recipe' | 'contract' | 'finance'; finishWeek: number }
export interface TycoonState {
  farms: Record<string, FarmSetup>; cargo: Cargo[]; inventoryScore: number; roastScore: number; roastProfile: 'light' | 'medium' | 'dark';
  blend: { name: string; beanA: string; beanB: string; percentA: number }; auction: { week: number; beanId: string; score: number; kg: number; bid: number; bidder: string | null; settled: boolean } | null;
  franchises: Franchise[]; retail: RetailLine[]; reviews: Review[]; popups: PopUp[]; trends: Record<string, { adoptedWeek: number; price: number }>;
  rivals: RivalMove[]; landlords: Landlord[]; spies: Spy[]; intel: string[]; security: boolean;
  dividendRate: number;
  channels: { franchise: number; b2b: number; retail: number; popups: number; rent: number }; news: string[];
}
export function createTycoon(): TycoonState {
  return { farms: {}, cargo: [], inventoryScore: 84, roastScore: 84, roastProfile: 'medium', blend: { name: 'Hausmischung', beanA: '', beanB: '', percentA: 70 }, auction: null,
    franchises: [], retail: [], reviews: [], popups: [], trends: {},
    rivals: [], landlords: [], spies: [], intel: [], security: false, dividendRate: 0,
    channels: { franchise: 0, b2b: 0, retail: 0, popups: 0, rent: 0 }, news: [] };
}
export const tycoonOf = (g: GameState): TycoonState => {
  const base = createTycoon(), t = g.tycoon;
  return t ? { ...base, ...t, channels: { ...base.channels, ...t.channels } } : base;
};
export const hash = (s: string) => [...s].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
export function weatherAt(week: number, cityId = 'berlin') {
  const w = (week - 1) % 52, south = ['sydney', 'sao_paulo', 'cape_town'].includes(cityId);
  const seasons = ['Winter', 'Frühling', 'Sommer', 'Herbst'];
  const seasonIndex = (Math.floor(w / 13) + (south ? 2 : 0)) % 4;
  const rain = hash(`${week}-${cityId}`) % 5 === 0;
  const heat = seasonIndex === 2 && hash(`${week}-${cityId}`) % 3 === 0;
  return { season: seasons[seasonIndex] ?? 'Winter', rain, heat, temp: [4, 15, 26, 12][seasonIndex] ?? 14, label: rain ? 'Regen' : heat ? 'Hitzewelle' : 'Heiter', seasonIndex };
}
export function trendAt(week: number) {
  const startWeek = Math.floor((week - 1) / 8) * 8 + 1, index = hash(`social-${startWeek}`) % TREND_DRINKS.length;
  return { id: `trend-${startWeek}`, name: TREND_DRINKS[index] ?? 'Pistachio Cloud Foam', startWeek, until: startWeek + 5 };
}
export const masterEra = (g: GameState) => g.stores.length > 60 ? 4 : g.stores.length > 20 ? 3 : g.stores.length > 5 ? 2 : 1;
export const franchiseReady = (g: GameState) => masterEra(g) >= 3 || g.stores.filter(s => s.weeklyRevenue > 0).length >= 15;
export const propertyDiscount = (_g: GameState) => 1;
export function propertyMarketFactor(g: GameState, cityId: string) {
  if (!g.tycoon) return 1;
  const stylish = g.stores.filter(s => s.cityId === cityId && vibeScore(g, s) >= 70);
  if (stylish.length < 3) return 1;
  const age = Math.max(0, g.week - Math.max(...stylish.map(s => s.openedAtWeek)));
  return 1 + Math.min(1.5, age / 260 * 1.5);
}
export function farmScore(g: GameState, id: string) {
  const p = MASTER.plantations.find(x => x.id === id), setup = tycoonOf(g).farms[id];
  return Math.min(100, Math.max(80, (p?.cupQualityScore ?? 84) + (FARM_METHODS.find(m => m.id === setup?.method)?.quality ?? 0) + (PROCESSES.find(m => m.id === setup?.process)?.quality ?? 0)));
}
export function vibeScore(g: GameState, s: Store) {
  const b = buildingById(s.districtId), sc = g.cafe?.stores[s.id], style = Math.floor((sc?.design?.style ?? 0) / 4);
  const fit = b?.clientele === 'creatives' ? style === 0 : b?.clientele === 'business' ? style === 1 : style === 2;
  return Math.min(100, 45 + (fit ? 25 : 5) + (sc?.gear.seating ?? 0) * 4 + (sc?.gear.espresso ?? 0) * 3);
}
export function demandEffects(g: GameState, s: Store) {
  if (!g.tycoon) return { demand: 1, capacity: 1, beans: 1 };
  const t = tycoonOf(g), weather = weatherAt(g.week + 1, s.cityId), menu = g.cafe?.stores[s.id]?.menu ?? [];
  const cold = menu.some(id => ['iced', 'coldbrew', 'nitro'].includes(id));
  const temperature = weather.heat ? (cold ? 2.5 : .6) : weather.seasonIndex === 0 ? 1.08 : 1;
  const trend = trendAt(g.week + 1), adopted = t.trends[trend.id];
  const hype = adopted && adopted.adoptedWeek <= trend.startWeek + 2 && g.week + 1 <= trend.until ? 1.4 : 1;
  const review = t.reviews.find(r => r.storeId === s.id), rating = review ? .9 + review.stars * .04 : 1;
  const rivals = t.rivals.filter(r => !r.resolved && r.cityId === s.cityId && r.until >= g.week + 1);
  const profile = buildingById(s.districtId)?.clientele === 'creatives' && t.roastProfile === 'light' ? 1.06 : 1;
  return { demand: temperature * (weather.rain ? .7 : 1) * hype * rating * (.85 + vibeScore(g, s) / 300) * profile * (rivals.some(r => r.kind === 'price') ? .88 : 1),
    capacity: 1, beans: 1 };
}
export function esgScore(g: GameState) {
  const t = tycoonOf(g);
  return Math.min(100, Math.max(0, 20 + Object.values(t.farms).reduce((n, f) => n + (FARM_METHODS.find(m => m.id === f.method)?.esg ?? 0), 0) + g.world.assets.filter(a => a.kind === 'csr').length * 5));
}