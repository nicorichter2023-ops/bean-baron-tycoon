import rawContent from "./gameContent.json";
import type {
  BeanVariety,
  Biome,
  City,
  GameEvent,
  RiskClass,
  RivalCompany,
  StartupInvestment,
  StoreTier,
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

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const slugify = (value: string) =>
  value
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const CITIES: City[] = GAME_CONTENT.cities.map((city) => ({
  id: city.id,
  name: city.name,
  country: city.country,
  landmarkName: city.landmarkName,
  biome: city.biome,
  purchasingPower: city.purchasingPower,
  coffeeCultureIndex: Math.round(clamp(city.coffeeCulture * 45, 0, 100)),
  districts: city.districts.map((district) => {
    const footTraffic = Math.round(clamp(district.footTraffic * 48, 25, 100));
    const maxStoreTier: StoreTier = district.footTraffic >= 1.45 ? 3 : district.footTraffic >= 1.05 ? 2 : 1;
    return {
      id: `${city.id}-${slugify(district.name)}`,
      name: district.name,
      footTraffic,
      rentWeekly: Math.round(city.baseRent * district.rentMultiplier),
      competition: Math.round(clamp(22 + footTraffic * 0.42 + city.coffeeCulture * 5, 20, 90)),
      maxStoreTier,
    };
  }),
}));

export const BEAN_VARIETIES: BeanVariety[] = GAME_CONTENT.beanVarieties;
export const GAME_EVENTS: GameEvent[] = GAME_CONTENT.events;

const SUCCESS_CHANCE: Record<RiskClass, number> = { low: 72, medium: 52, high: 34, moonshot: 18 };
export const STARTUPS: StartupInvestment[] = GAME_CONTENT.startups.map((startup) => ({
  ...startup,
  riskClass: startup.riskLevel,
  investedAmount: 0,
  successChance: SUCCESS_CHANCE[startup.riskLevel],
  payoutMultiple: Math.round((1.8 + startup.annualGrowthRate * 2.2) * 100) / 100,
  investedAtWeek: 0,
  status: "active",
  acquired: false,
  acquiredAtWeek: null,
}));

const totalMarketCap = GAME_CONTENT.publicCompanies.reduce((sum, company) => sum + company.marketCap, 0);
export const PUBLIC_COMPANIES: RivalCompany[] = GAME_CONTENT.publicCompanies.map((company, index) => ({
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
}));
