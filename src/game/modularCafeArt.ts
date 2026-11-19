import type { GearCategory } from '@/engine/cafeContent';

const pointers = import.meta.glob('@/assets/cafe-modular/*.asset.json', { eager: true, import: 'default' }) as Record<string, { url: string }>;
const url = (name: string) => Object.entries(pointers).find(([path]) => path.endsWith(`/${name}.webp.asset.json`))?.[1].url ?? '';
export const modularFoundation = (group: number) => url(`foundation-${group}`);
export const modularGearArt = (category: string, level: number) => {
  const kind = ({ espresso: 'machine', grinder: 'grinder', seating: 'seating', vitrine: 'display', terrace: 'terrace' } as Record<string, string>)[category];
  if (!kind || (category === 'terrace' && level === 0)) return '';
  return url(`${kind}-${Math.max(0, Math.min(category === 'terrace' ? 3 : 4, category === 'terrace' ? level - 1 : level))}`);
};
export type CafeGear = Record<GearCategory, number>;