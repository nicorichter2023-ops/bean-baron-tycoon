/** Complete painted café scenes: one per store stage (1–7) × deco concept (Holz-Bistro, Lounge, Botanisch), plus terrace styles. */
const art = import.meta.glob('@/assets/rooms/*.jpg', { eager: true, import: 'default' }) as Record<string, string>;
const pick = (name: string) => Object.entries(art).find(([k]) => k.endsWith(`/${name}.jpg`))?.[1] ?? '';
export const roomScene = (stage: number, style: number) => pick(`s${Math.max(1, Math.min(7, stage))}-${Math.max(0, Math.min(2, style)) + 1}`);
export const terraceScene = (style: number) => pick(`terrace-${Math.max(0, Math.min(2, style)) + 1}`);
