/** Presentation-only 2:1 projection; economic district coordinates stay untouched. */
export interface GridPoint { x: number; y: number }
export interface IsoProjection { tileWidth: number; tileHeight: number; offsetX: number; offsetY: number }
export const NEW_YORK_ISOMETRY: IsoProjection = { tileWidth: 192, tileHeight: 96, offsetX: 720, offsetY: 190 };
export const ISO_LAYERS = { ground: 0, buildings: 1, life: 2, pins: 3 } as const;
export type IsoLayer = keyof typeof ISO_LAYERS;

export function gridToScreen({ x, y }: GridPoint, projection: IsoProjection = NEW_YORK_ISOMETRY) {
  const { tileWidth, tileHeight, offsetX, offsetY } = projection;
  return { screenX: (x - y) * (tileWidth / 2) + offsetX, screenY: (x + y) * (tileHeight / 2) + offsetY };
}

export function isometricDepth({ x, y }: GridPoint) { return x + y; }

/** Back-to-front, then deterministic left/right ordering for equal depths. */
export function sortIsometricObjects<T extends GridPoint & { id: string; layer: IsoLayer }>(objects: readonly T[]): T[] {
  return [...objects].sort((a, b) => ISO_LAYERS[a.layer] - ISO_LAYERS[b.layer]
    || isometricDepth(a) - isometricDepth(b) || a.x - b.x || a.id.localeCompare(b.id));
}

export function cityGridPosition(index: number): GridPoint {
  return { x: (index % 5) * 1.25, y: Math.floor(index / 5) * 1.25 };
}

/** Four grid corners, projected by the same math as every building and marker. */
export function gridRectangle(x: number, y: number, width: number, height: number, projection: IsoProjection = NEW_YORK_ISOMETRY): string {
  return [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }]
    .map(p => { const s = gridToScreen(p, projection); return `${s.screenX},${s.screenY}`; }).join(' ');
}