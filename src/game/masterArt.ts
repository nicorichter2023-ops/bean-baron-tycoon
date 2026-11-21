const art = import.meta.glob('@/assets/hubs/master/*.webp', { eager: true, import: 'default' }) as Record<string, string>;
export { default as logisticsWorld } from '@/assets/hubs/logistics-world.jpg';
export const MASTER_ART = { truck: 0, auction: 1 } as const;
/** Individually trimmed, transparent motifs so each fills its frame without white edges. */
export const masterImage = (kind: keyof typeof MASTER_ART) => Object.entries(art).find(([k]) => k.endsWith(`/${kind}.webp`))?.[1] ?? '';
