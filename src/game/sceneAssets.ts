import cafe from '@/assets/scenes/cafe.webp.asset.json';
import terrace from '@/assets/scenes/terrace.webp.asset.json';
import office from '@/assets/scenes/office.webp.asset.json';
import penthouse from '@/assets/scenes/penthouse.webp.asset.json';
import negotiation from '@/assets/scenes/negotiation.webp.asset.json';
import world from '@/assets/scenes/world.webp.asset.json';
import european from '@/assets/scenes/european.webp.asset.json';
import industrial from '@/assets/scenes/industrial.webp.asset.json';
import tropical from '@/assets/scenes/tropical.webp.asset.json';
import asian from '@/assets/scenes/asian.webp.asset.json';
import district from '@/assets/scenes/district.webp.asset.json';
import exchange from '@/assets/scenes/exchange.webp.asset.json';
import farm from '@/assets/scenes/farm.webp.asset.json';
import port from '@/assets/scenes/port.webp.asset.json';
import roasteryBase from '@/assets/scenes/roastery-base.webp.asset.json';
import type { Biome } from '@/engine/types';

export const SCENES = { cafe, terrace, office, penthouse, negotiation, world, european, industrial, tropical, asian, district, exchange, farm, port, roasteryBase };
export const BIOME_SCENE: Record<Biome, string> = { european_classic: european.url, modern_industrial: industrial.url, asian_zen: asian.url, tropical_colonial: tropical.url };
const atlasFiles = import.meta.glob<{ default: { url: string } }>('../assets/sprites/*.asset.json', { eager: true });
export const ATLASES = Object.fromEntries(Object.entries(atlasFiles).map(([path, file]) => [path.split('/').at(-1)?.replace('.webp.asset.json', ''), file.default.url]));

// Positions are percentages on the supplied illustrated world, not GIS coordinates.
export const CITY_POSITIONS: Record<string, [number, number]> = {
  paris: [49, 34], wien: [60, 34], mailand: [55, 42], berlin: [55, 26], london: [44, 25], kopenhagen: [59, 17],
  seattle: [14, 31], new_york: [30, 37], san_francisco: [12, 39], chicago: [23, 34], sydney: [89, 77],
  tokio: [88, 40], seoul: [82, 33], singapur: [76, 60], osaka: [86, 42],
  amsterdam: [48, 24], sao_paulo: [35, 72], madrid: [45, 43], kapstadt: [53, 78], zuerich: [52, 36],
};