import rawContent from "./gameContent.json";
import { MASTER_CITIES, MASTER_STARTUPS, MASTER_STOCKS } from './master';
import type {
  BeanVariety,
  Biome,
  GameEvent,
  RiskClass,
  RivalCompany,
} from "@/engine/types";

interface ContentCity {
  id: string;
  name: string;
  country: string;
  biome: Biome;
  landmarkName: string;
  baseRent: number;
  purchasingPower: number;
  coffeeCulture: number;
  districts: { name: string; rentMultiplier: number; footTraffic: number }[];
}

interface ContentStartup {
  id: string;
  name: string;
  sector: string;
  valuation: number;
  riskLevel: RiskClass;
  requiredFunding: number;
  annualGrowthRate: number;
}

interface ContentCompany {
  id: string;
  name: string;
  ticker: string;
  sharePrice: number;
  marketCap: number;
  sharesOutstanding: number;
  dividendYield: number;
  description: string;
}

export interface GameContent {
  cities: ContentCity[];
  beanVarieties: BeanVariety[];
  events: GameEvent[];
  startups: ContentStartup[];
  publicCompanies: ContentCompany[];
}

export const GAME_CONTENT = rawContent as GameContent;

export const CITIES = MASTER_CITIES;

export const BEAN_VARIETIES: BeanVariety[] = GAME_CONTENT.beanVarieties;
export const GAME_EVENTS: GameEvent[] = GAME_CONTENT.events;

export const STARTUPS = MASTER_STARTUPS;

const totalMarketCap = GAME_CONTENT.publicCompanies.reduce((sum, company) => sum + company.marketCap, 0);
export const PUBLIC_COMPANIES: RivalCompany[] = GAME_CONTENT.publicCompanies.map<RivalCompany>((company, index) => ({
  id: company.id,
  name: company.name,
  ticker: company.ticker,
  description: company.description,
  sharePrice: company.sharePrice,
  sharesOutstanding: company.sharesOutstanding,
  dividendYield: company.dividendYield,
  valuation: company.marketCap,
  aggression: 35 + ((index * 13) % 55),
  marketShare: Math.round((company.marketCap / totalMarketCap) * 1000) / 10,
  strategicSynergy: 30 + ((index * 17) % 55),
  acquired: false,
  acquiredAtWeek: null,
})).concat(MASTER_STOCKS);
