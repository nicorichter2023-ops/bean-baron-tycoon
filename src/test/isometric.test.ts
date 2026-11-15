import { describe, expect, it } from 'vitest';
import { cityGridPosition, gridRectangle, gridToScreen, ISO_LAYERS, isometricDepth, NEW_YORK_ISOMETRY, sortIsometricObjects } from '@/game/isometric';

describe('2:1-Isometrie für New York', () => {
  const projection = { tileWidth: 200, tileHeight: 100, offsetX: 400, offsetY: 120 };
  it('projiziert den Ursprung exakt auf den Offset', () => {
    expect(gridToScreen({ x: 0, y: 0 }, projection)).toEqual({ screenX: 400, screenY: 120 });
  });
  it('projiziert eine Spalte um eine halbe Kachel nach rechts und unten', () => {
    expect(gridToScreen({ x: 1, y: 0 }, projection)).toEqual({ screenX: 500, screenY: 170 });
  });
  it('projiziert eine Zeile um eine halbe Kachel nach links und unten', () => {
    expect(gridToScreen({ x: 0, y: 1 }, projection)).toEqual({ screenX: 300, screenY: 170 });
  });
  it('unterstützt negative und gebrochene Koordinaten ohne Ankerversatz', () => {
    expect(gridToScreen({ x: -1.5, y: 2.25 }, projection)).toEqual({ screenX: 25, screenY: 157.5 });
  });
  it('verwendet für die Stadt eine echte 2:1-Kachel', () => {
    expect(NEW_YORK_ISOMETRY.tileWidth).toBe(NEW_YORK_ISOMETRY.tileHeight * 2);
  });
  it('ordnet größere x+y-Werte unabhängig von der Eingabereihenfolge weiter vorne an', () => {
    const objects = [
      { id: 'front', x: 4, y: 5, layer: 'buildings' as const },
      { id: 'back', x: 1, y: 1, layer: 'buildings' as const },
      { id: 'middle', x: 3, y: 1, layer: 'buildings' as const },
    ];
    expect(sortIsometricObjects(objects).map(p => p.id)).toEqual(['back', 'middle', 'front']);
    expect(objects.map(p => p.id)).toEqual(['front', 'back', 'middle']);
    expect(isometricDepth(objects[0])).toBe(9);
  });
  it('ordnet Boden, Gebäude, Verkehr und Pins in getrennte Schichten', () => {
    const objects = [
      { id: 'pin', x: 0, y: 0, layer: 'pins' as const },
      { id: 'person', x: 0, y: 0, layer: 'life' as const },
      { id: 'building', x: 10, y: 10, layer: 'buildings' as const },
      { id: 'road', x: 20, y: 20, layer: 'ground' as const },
    ];
    expect(sortIsometricObjects(objects).map(p => p.id)).toEqual(['road', 'building', 'person', 'pin']);
    expect(ISO_LAYERS).toEqual({ ground: 0, buildings: 1, life: 2, pins: 3 });
  });
  it('löst gleiche Tiefen deterministisch auf', () => {
    const a = { id: 'a', x: 1, y: 2, layer: 'buildings' as const };
    const b = { id: 'b', x: 2, y: 1, layer: 'buildings' as const };
    expect(sortIsometricObjects([b, a])).toEqual([a, b]);
    expect(sortIsometricObjects([a, b])).toEqual([a, b]);
  });
  it('platziert genau 30 einzigartige Grundstücke im 5×6-Raster', () => {
    const points = Array.from({ length: 30 }, (_, i) => cityGridPosition(i));
    expect(new Set(points.map(p => `${p.x},${p.y}`)).size).toBe(30);
    expect(points[0]).toEqual({ x: 0, y: 0 });
    expect(points[29]).toEqual({ x: 5, y: 6.25 });
  });
  it('projiziert die Straßenkacheln mit derselben Transformation', () => {
    expect(gridRectangle(0, 0, 1, 1)).toBe('720,190 816,238 720,286 624,238');
  });
});