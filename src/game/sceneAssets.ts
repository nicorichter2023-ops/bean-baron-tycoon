import european from '@/assets/scenes/european.webp.asset.json';
import industrial from '@/assets/scenes/industrial.webp.asset.json';
import tropical from '@/assets/scenes/tropical.webp.asset.json';
import asian from '@/assets/scenes/asian.webp.asset.json';
import type { Biome } from '@/engine/types';

/** Illustrated backdrop per biome, used by the city scene fallback. */
export const BIOME_SCENE: Record<Biome, string> = { european_classic: european.url, modern_industrial: industrial.url, asian_zen: asian.url, tropical_colonial: tropical.url };

// Positions are percentages on the supplied illustrated world, not GIS coordinates.
export const CITY_POSITIONS: Record<string, [number, number]> = {
  paris: [49, 34], wien: [60, 34], mailand: [55, 42], berlin: [55, 26], london: [44, 25], kopenhagen: [59, 17],
  seattle: [14, 31], new_york: [30, 37], san_francisco: [12, 39], chicago: [23, 34], sydney: [89, 77],
  tokio: [88, 40], seoul: [82, 33], singapur: [76, 60], osaka: [86, 42],
  amsterdam: [48, 24], sao_paulo: [35, 72], madrid: [45, 43], kapstadt: [53, 78], zuerich: [52, 36],
};
