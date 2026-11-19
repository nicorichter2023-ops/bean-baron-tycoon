// 2.0: regional painted portrait maps (emea/americas/apac/tropics) with shared land pins.
// Painted city maps (New-York style) and 30 land pin positions + airport (last entry), in % of the image.
import emea from '../assets/v2/maps/emea.webp';
import americas from '../assets/v2/maps/americas.webp';
import apac from '../assets/v2/maps/apac.webp';
import tropics from '../assets/v2/maps/tropics.webp';
const REGION_MAP = { emea, americas, apac, tropics } as const;
export const REGION_SPOTS: Record<keyof typeof REGION_MAP, [number, number][]> = {"emea": [[8, 6.0], [20, 6.0], [32, 6.0], [44, 6.0], [56, 6.0], [80, 6.0], [92, 6.0], [14, 14.4], [26, 14.4], [62, 14.4], [8, 22.8], [20, 22.8], [32, 22.8], [44, 22.8], [56, 22.8], [92, 22.8], [14, 31.2], [26, 31.2], [38, 31.2], [50, 31.2], [62, 31.2], [74, 31.2], [86, 31.2], [8, 39.6], [20, 39.6], [32, 39.6], [44, 39.6], [56, 39.6], [68, 39.6], [80, 39.6], [92, 39.6]], "americas": [[8, 6.0], [20, 6.0], [32, 6.0], [44, 6.0], [56, 6.0], [68, 6.0], [80, 6.0], [92, 6.0], [14, 14.4], [26, 14.4], [38, 14.4], [50, 14.4], [62, 14.4], [74, 14.4], [86, 14.4], [8, 22.8], [20, 22.8], [32, 22.8], [44, 22.8], [56, 22.8], [68, 22.8], [80, 22.8], [92, 22.8], [14, 31.2], [26, 31.2], [38, 31.2], [50, 31.2], [62, 31.2], [74, 31.2], [86, 31.2], [8, 39.6]], "apac": [[8, 6.0], [20, 6.0], [32, 6.0], [44, 6.0], [56, 6.0], [68, 6.0], [80, 6.0], [92, 6.0], [14, 14.4], [26, 14.4], [38, 14.4], [50, 14.4], [62, 14.4], [74, 14.4], [86, 14.4], [8, 22.8], [20, 22.8], [32, 22.8], [44, 22.8], [56, 22.8], [68, 22.8], [80, 22.8], [92, 22.8], [14, 31.2], [26, 31.2], [38, 31.2], [50, 31.2], [62, 31.2], [74, 31.2], [86, 31.2], [8, 39.6]], "tropics": [[8, 6.0], [20, 6.0], [32, 6.0], [44, 6.0], [56, 6.0], [14, 14.4], [26, 14.4], [38, 14.4], [50, 14.4], [62, 14.4], [74, 14.4], [8, 22.8], [20, 22.8], [32, 22.8], [44, 22.8], [56, 22.8], [68, 22.8], [80, 22.8], [92, 22.8], [14, 31.2], [26, 31.2], [38, 31.2], [50, 31.2], [62, 31.2], [74, 31.2], [86, 31.2], [8, 39.6], [20, 39.6], [32, 39.6], [44, 39.6], [56, 39.6]]} as Record<keyof typeof REGION_MAP, [number, number][]>;
const CITY_REGION: Record<string, keyof typeof REGION_MAP> = {
  new_york: 'americas', san_francisco: 'americas', chicago: 'americas', seattle: 'americas', sao_paulo: 'tropics', singapur: 'tropics',
  tokio: 'apac', osaka: 'apac', seoul: 'apac', sydney: 'apac',
};
export function cityRegion(cityId: string): keyof typeof REGION_MAP { return CITY_REGION[cityId.replace(/-/g, '_')] ?? 'emea'; }
export function citySpots(cityId: string): [number, number][] { return REGION_SPOTS[cityRegion(cityId)]; }
export function cityMapImage(cityId: string): string | undefined {
  return REGION_MAP[cityRegion(cityId)];
}
