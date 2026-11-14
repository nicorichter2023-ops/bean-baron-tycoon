import data from './coffee_inc_master_data.json';
import legacy from './gameContent.json';
import type { City, Biome, RivalCompany, StartupInvestment } from '@/engine/types';

/** The complete uploaded source remains unmodified; adapters only translate engine units. */
export const MASTER = data;
export type MasterBuilding = typeof data.cities[number]['buildings'][number];
export const ZONES: Record<string, string> = { shopping: 'Shopping', pedestrian: 'Fußgängerzone', financial: 'Business', residential: 'Wohnviertel', student: 'Campus' };
export const CLIENTELE: Record<string, string> = { tourists: 'Touristen', creatives: 'Kreative', business: 'Geschäftsleute', residents: 'Anwohner', students: 'Studierende' };
const additions: Record<string, { country: string; biome: Biome; landmark: string; power: number }> = {
  zuerich: { country: 'Schweiz', biome: 'european_classic', landmark: 'Zürichsee', power: 1.7 },
  amsterdam: { country: 'Niederlande', biome: 'european_classic', landmark: 'Grachten', power: 1.3 },
  madrid: { country: 'Spanien', biome: 'european_classic', landmark: 'Plaza Mayor', power: 1.1 },
  san_francisco: { country: 'USA', biome: 'modern_industrial', landmark: 'Golden Gate', power: 1.6 },
  chicago: { country: 'USA', biome: 'modern_industrial', landmark: 'Willis Tower', power: 1.35 },
  osaka: { country: 'Japan', biome: 'asian_zen', landmark: 'Burg Osaka', power: 1.2 },
};
export const MASTER_CITIES: City[] = data.cities.map(c => {
  const old = legacy.cities.find(x => x.id === c.cityId), extra = additions[c.cityId];
  return { id: c.cityId, name: c.cityName, country: old?.country ?? extra?.country ?? c.region,
    biome: (old?.biome as Biome | undefined) ?? extra?.biome ?? 'european_classic',
    landmarkName: old?.landmarkName ?? extra?.landmark ?? c.cityName,
    purchasingPower: old?.purchasingPower ?? extra?.power ?? 1.2, coffeeCultureIndex: Math.min(100, (old?.coffeeCulture ?? 1.8) * 45),
    districts: c.buildings.map(b => ({ id: b.id, name: b.name, footTraffic: Math.min(100, Math.round(b.footTraffic / 180)), rentWeekly: b.weeklyRent,
      competition: b.initialOccupant ? 65 : 25, maxStoreTier: 3 })),
  };
});
export const buildingById = (id: string) => data.cities.flatMap(c => c.buildings).find(b => b.id === id);
export const MASTER_STOCKS: RivalCompany[] = data.stockMarket.competitorStocks.map(s => {
  const c = data.competitors.find(c => c.id === s.competitorId);
  return { id: s.competitorId, name: c?.name ?? s.ticker, ticker: s.ticker, description: c?.description ?? '', sharePrice: s.initialSharePrice,
    sharesOutstanding: s.totalShares, dividendYield: s.dividendYield, valuation: s.marketCap, aggression: c?.aggressiveness ?? 50,
    marketShare: 25, strategicSynergy: 60, acquired: false, acquiredAtWeek: null };
});
export const MASTER_STARTUPS: StartupInvestment[] = data.startups.map(s => ({ id: s.id, name: s.name, sector: s.sector, valuation: s.valuation,
  requiredFunding: s.fundingRequired, annualGrowthRate: .2, riskClass: 'high', investedAmount: 0, successChance: s.successChance * 100,
  payoutMultiple: s.exitMultiple, investedAtWeek: 0, status: 'active', acquired: false, acquiredAtWeek: null, exitWeeks: s.timeToExitWeeks }));