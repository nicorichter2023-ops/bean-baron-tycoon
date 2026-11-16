/** Painted café scenes: 4 store groups (stages 1–2, 3–4, 5–6, 7) × 12 looks (3 moods × 4), plus terrace styles. */
const art = import.meta.glob('@/assets/rooms/*.webp', { eager: true, import: 'default' }) as Record<string, string>;
const pick = (name: string) => Object.entries(art).find(([k]) => k.endsWith(`/${name}.webp`))?.[1] ?? '';
export const sceneGroup = (stage: number) => stage <= 2 ? 1 : stage <= 4 ? 2 : stage <= 6 ? 3 : 4;
export const roomScene = (stage: number, style: number) => pick(`g${sceneGroup(stage)}-${Math.max(0, Math.min(11, style)) + 1}`) || pick(`s${Math.max(1, Math.min(7, stage))}-1`);
/** Terrace art matches the interior mood (0 Skandinavisch, 1 Edel, 2 Traditionell) × terrace style. */
export const terraceScene = (style: number, mood = 0) => pick(`terrace-m${Math.max(0, Math.min(2, mood)) + 1}-${Math.max(0, Math.min(2, style)) + 1}`) || pick(`terrace-${Math.max(0, Math.min(2, style)) + 1}`);
