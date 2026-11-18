import { useEffect, useRef } from "react";
import type { Application, Container } from "pixi.js";
import { buildGrid, TILE_W, TILE_H, type Lot } from "./isoMapData";

const COLORS: Record<Lot["kind"], [number, number, number]> = {
  // [Dach, linke Wand, rechte Wand]
  street: [0x8d8a84, 0, 0], empty: [0xc9b98f, 0, 0], park: [0x7fa36a, 0, 0],
  house: [0xd9cbb4, 0xb09c80, 0x93816a], cafe: [0xb5563c, 0xe8dcc6, 0xcbbda6],
  roastery: [0x6b4a36, 0xa7826a, 0x8a6a55],
};

export default function PixiCityMap({ onSelect }: { onSelect?: (lot: Lot) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<(f: number) => void>(() => {});
  useEffect(() => {
    let app: Application | null = null; let dead = false;
    (async () => {
      const PIXI = await import("pixi.js");
      app = new PIXI.Application();
      await app.init({ resizeTo: host.current!, backgroundColor: 0xe9e2d3, antialias: true, resolution: window.devicePixelRatio, autoDensity: true });
      if (dead) { app.destroy(true); return; }
      host.current!.appendChild(app.canvas);
      const world: Container = new PIXI.Container();
      app.stage.addChild(world);
      world.position.set(app.screen.width / 2, 60);
      const lots = buildGrid().sort((a, b) => a.x + a.y - (b.x + b.y));
      for (const lot of lots) {
        const g = new PIXI.Graphics();
        const cx = (lot.x - lot.y) * TILE_W / 2, cy = (lot.x + lot.y) * TILE_H / 2;
        const [top, left, right] = COLORS[lot.kind];
        const diamond = (h: number) => [0, -h, TILE_W / 2, TILE_H / 2 - h, 0, TILE_H - h, -TILE_W / 2, TILE_H / 2 - h];
        g.poly(diamond(0)).fill(lot.kind === "street" ? 0x8d8a84 : 0xbfb6a3).stroke({ width: 1, color: 0x000000, alpha: 0.08 });
        if (left) {
          const h = 14 * lot.floors + 6, inset = 8;
          const w2 = TILE_W / 2 - inset, h2 = TILE_H / 2 - inset / 2;
          const base = TILE_H / 2;
          g.poly([-w2, base, 0, base + h2, 0, base + h2 - h, -w2, base - h]).fill(left);
          g.poly([w2, base, 0, base + h2, 0, base + h2 - h, w2, base - h]).fill(right);
          g.poly([0, base - h2 - h, w2, base - h, 0, base + h2 - h, -w2, base - h]).fill(top);
        } else if (lot.kind === "park") {
          g.circle(0, TILE_H / 2 - 8, 8).fill(0x4f7a45);
        } else if (lot.kind === "empty") {
          g.poly(diamond(0).map((v, i) => (i % 2 ? (v - TILE_H / 2) * 0.6 + TILE_H / 2 : v * 0.6))).stroke({ width: 1.5, color: 0x8a7550 });
        }
        g.position.set(cx, cy);
        g.eventMode = "static"; g.cursor = "pointer";
        g.on("pointertap", () => { if (moved < 8) onSelect?.(lot); });
        world.addChild(g);
      }
      // Pan + Pinch
      const pts = new Map<number, { x: number; y: number }>();
      let lastDist = 0; let moved = 0;
      const el = app.canvas;
      el.style.touchAction = "none";
      const zoomAt = (f: number, px: number, py: number) => {
        const z = Math.min(2.5, Math.max(0.5, world.scale.x * f)), k = z / world.scale.x;
        world.position.set(px - (px - world.x) * k, py - (py - world.y) * k); world.scale.set(z);
      };
      zoomRef.current = (f) => zoomAt(f, app!.screen.width / 2, app!.screen.height / 2);
      el.addEventListener("pointerdown", (e) => { moved = 0; el.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.offsetX, y: e.offsetY }); });
      el.addEventListener("pointermove", (e) => {
        const p = pts.get(e.pointerId); if (!p) return;
        moved += Math.abs(e.offsetX - p.x) + Math.abs(e.offsetY - p.y); if (pts.size === 1) { world.x += e.offsetX - p.x; world.y += e.offsetY - p.y; }
        p.x = e.offsetX; p.y = e.offsetY;
        if (pts.size === 2) {
          const [a, b] = [...pts.values()] as [{ x: number; y: number }, { x: number; y: number }]; const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (lastDist) zoomAt(d / lastDist, (a.x + b.x) / 2, (a.y + b.y) / 2); lastDist = d;
        }
      });
      const up = (e: PointerEvent) => { pts.delete(e.pointerId); lastDist = 0; };
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
      el.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.offsetX, e.offsetY); }, { passive: false });
    })();
    return () => { dead = true; app?.destroy(true); };
  }, [onSelect]);
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={host} className="absolute inset-0" />
      <div className="absolute right-3 bottom-3 flex flex-col gap-2">
        <button aria-label="Hineinzoomen" className="h-11 w-11 rounded-full bg-card text-card-foreground shadow" onClick={() => zoomRef.current(1.25)}>+</button>
        <button aria-label="Herauszoomen" className="h-11 w-11 rounded-full bg-card text-card-foreground shadow" onClick={() => zoomRef.current(0.8)}>−</button>
      </div>
    </div>
  );
}
