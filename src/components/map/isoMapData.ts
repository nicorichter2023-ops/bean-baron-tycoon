/** Browser-sichere Kartendaten. `sprite` kann später auf eine PNG-URL gesetzt werden. */
export type LotKind = "street" | "empty" | "cafe" | "roastery" | "house" | "park";
export interface Lot { x: number; y: number; kind: LotKind; floors: number; sprite?: string }
export const TILE_W = 64, TILE_H = 32;

export function buildGrid(size = 12, seed = 7): Lot[] {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const lots: Lot[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let kind: LotKind;
    if (x % 4 === 0 || y % 4 === 0) kind = "street";
    else { const r = rnd(); kind = r < 0.15 ? "empty" : r < 0.25 ? "cafe" : r < 0.32 ? "roastery" : r < 0.4 ? "park" : "house"; }
    lots.push({ x, y, kind, floors: kind === "house" ? 1 + Math.floor(rnd() * 3) : kind === "roastery" ? 2 : 1 });
  }
  return lots;
}
