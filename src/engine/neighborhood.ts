import { MASTER, type MasterBuilding } from '@/data/master';
import type { GameState } from './types';

export const NEIGHBOR_RULES = { weights: [1, .5, .25], volumeCap: .3, marginCap: .15, takeawayCap: .25, prestigeCap: 10, lossCap: .25, gainCap: .15, demandFloor: .75, lossPerRival: .12, gainPerQualityPoint: .004 } as const;
export const cityPlacementHash = (s: string) => [...s].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
export function orderedCityBuildings(cityId: string): MasterBuilding[] {
  const buildings = MASTER.cities.find(c => c.cityId === cityId)?.buildings ?? [];
  const offset = cityPlacementHash(cityId) % 30;
  return [...buildings.slice(offset), ...buildings.slice(0, offset)];
}
export function neighborSlots(id: string) {
  const city = MASTER.cities.find(c => c.buildings.some(b => b.id === id));
  const ordered = orderedCityBuildings(city?.cityId ?? '');
  const i = ordered.findIndex(b => b.id === id);
  if (i < 0) return [];
  const col = i % 5, row = Math.floor(i / 5);
  return [
    { slot: 'Links', weight: 1, building: col > 0 ? ordered[i - 1] : undefined },
    { slot: 'Rechts', weight: .5, building: col < 4 ? ordered[i + 1] : undefined },
    { slot: 'Gegenüber', weight: .25, building: ordered[row % 2 === 0 ? i + 5 : i - 5] },
  ];
}
export function neighborhoodEffects(g: GameState, id: string) {
  const own = g.stores.find(s => s.districtId === id);
  let volume = 0, margin = 0, takeaway = 0, prestige = 0, loss = 0, gain = 0;
  const slots = neighborSlots(id).map(s => {
    const b = s.building;
    const rivalId = b ? g.world.occupants[b.id] : undefined;
    const rival = MASTER.competitors.find(c => c.id === rivalId && !g.capitalMarkets.rivals.find(r => r.id === c.id)?.acquired);
    const value = (b?.locationBonus.valuePercent ?? 0) / 100 * s.weight;
    if (b?.locationBonus.bonusType === 'volume') volume += value;
    if (b?.locationBonus.bonusType === 'margin') margin += value;
    if (b?.locationBonus.bonusType === 'takeaway') takeaway += value;
    if (b?.locationBonus.bonusType === 'prestige') prestige += value * 20;
    const outflow = rival ? NEIGHBOR_RULES.lossPerRival * s.weight : 0;
    const inflow = rival && own ? Math.max(0, own.qualityIndex - rival.avgQuality) * NEIGHBOR_RULES.gainPerQualityPoint * s.weight : 0;
    loss += outflow; gain += inflow;
    return { ...s, rival, value, outflow, inflow };
  });
  volume = Math.min(NEIGHBOR_RULES.volumeCap, volume); margin = Math.min(NEIGHBOR_RULES.marginCap, margin);
  takeaway = Math.min(NEIGHBOR_RULES.takeawayCap, takeaway); prestige = Math.min(NEIGHBOR_RULES.prestigeCap, prestige);
  loss = Math.min(NEIGHBOR_RULES.lossCap, loss); gain = Math.min(NEIGHBOR_RULES.gainCap, gain);
  return { slots, volume, margin, takeaway, prestige, loss, gain, demand: Math.max(NEIGHBOR_RULES.demandFloor, (1 + volume) * (1 - loss + gain)) };
}