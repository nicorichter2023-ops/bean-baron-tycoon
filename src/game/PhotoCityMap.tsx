import { useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { MASTER, type MasterBuilding } from '@/data/master';
import { citySpots, cityMapImage } from '@/data/cityMaps';
import { useGame } from './GameContext';
import { Button } from '@/components/ui/button';
import { tycoonOf, vibeScore } from '@/engine/tycoon';

/** Painted city map (same scheme for all cities): pins sit on land blocks of the artwork. */
export function PhotoCityMap({ cityId, cityName, airportCode, buildings, onBuilding, onAirport, onError }: { cityId: string; cityName: string; airportCode: string; buildings: MasterBuilding[]; onBuilding: (b: MasterBuilding) => void; onAirport: () => void; onError: () => void }) {
  const { state } = useGame();
  const [labels, setLabels] = useState(true);
  const [mode, setMode] = useState<'normal' | 'vibe' | 'rival'>('normal');
  const franchise = tycoonOf(state).franchises;
  const zoom = useRef<ReactZoomPanPinchRef>(null);
  const cycle = useRef<Record<string, number>>({});
  const focus = (status: string) => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(`.nyc-photo-content [data-status='${status}']`));
    if (!els.length) return;
    const n = (cycle.current[status] ?? -1) + 1; cycle.current[status] = n;
    const el = els[n % els.length]; if (!el) return; zoom.current?.zoomToElement(el, 2.2, 350);
    if (status !== 'own') { const b = buildings.find(x => x.id === el.dataset['id']); if (b) onBuilding(b); }
  };
  const count = (st: string) => buildings.slice(0, 30).filter(b => { const store = state.stores.find(s => s.districtId === b.id), own = !!store, fr = franchise.some(f => f.districtId === b.id); const rival = Boolean(state.world.occupants[b.id]); return st === 'own' ? own : st === 'rival' ? !own && rival : !own && !rival; }).length;
  useEffect(() => {
    const reset = () => zoom.current?.resetTransform(0);
    window.addEventListener('resize', reset);
    return () => window.removeEventListener('resize', reset);
  }, []);
  const src = cityMapImage(cityId);
  const spots = citySpots(cityId);
  if (!src) { onError(); return null; }
  const airport = spots[30] ?? [12, 92];
  return <div className="nyc-photo-map" data-labels={labels} data-map-mode={mode}>
    <div className="map-mode-bar" aria-label="Kartenmodus">{([['normal', 'Normal'], ['vibe', 'Vibe-Heatmap'], ['rival', 'Rivalenzonen']] as const).map(([id, label]) => <Button size="sm" key={id} variant={mode === id ? 'secondary' : 'ghost'} aria-pressed={mode === id} onClick={() => setMode(id)}>{label}</Button>)}</div>
    <div className="map-focus-bar">
      <button onClick={() => zoom.current?.resetTransform(300)}>Übersicht</button>
      <button onClick={() => focus('own')}>Meine {count('own')}</button>
      <button onClick={() => focus('free')}>Frei {count('free')}</button>
      <button onClick={() => focus('rival')}>Rivalen {count('rival')}</button>
      <button onClick={onAirport} aria-label="Flughafen öffnen">✈</button>
      <button aria-pressed={labels} onClick={() => setLabels(!labels)}>{labels ? 'Aa' : 'Aa̶'}</button>
    </div>
    <TransformWrapper key={cityId} ref={zoom} initialScale={1} minScale={1} maxScale={3} limitToBounds centerZoomedOut={false} disablePadding pinch={{ step: 5 }} panning={{ velocityDisabled: true }} doubleClick={{ disabled: true }} onTransform={(r: { resetTransform: (t?: number) => void }, st: { scale: number }) => { if (st.scale < 0.999) r.resetTransform(0); }} onPinchStop={(r: { resetTransform: (t?: number) => void; state: { scale: number } }) => { if (r.state.scale < 1) r.resetTransform(150); }}>
      <TransformComponent wrapperClass="nyc-photo-viewport" contentClass="nyc-photo-content">
        <img src={src} alt={`Stadtkarte ${cityName}`} width={1088} height={1920} draggable={false} onError={onError} onLoad={() => zoom.current?.resetTransform(0)} />
        {buildings.slice(0, 30).map((b, i) => {
          const store = state.stores.find(s => s.districtId === b.id), own = !!store, fr = franchise.some(f => f.districtId === b.id);
          const rival = MASTER.competitors.find(c => c.id === state.world.occupants[b.id]);
          const [x, y] = spots[i] ?? [50, 50];
          const forSale = !own && !rival && (b.purchasePrice ?? 0) > 0 && i % 3 === 0;
          return <button key={b.id} className="ci-pin" data-status={own ? 'own' : fr ? 'franchise' : rival ? 'rival' : 'free'} data-rival={rival?.id} data-id={b.id} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${b.name} · ${own ? 'Deine Filiale' : fr ? 'Franchise' : rival?.name ?? (forSale ? 'Zu verkaufen' : 'Zu vermieten')}`} onClick={() => onBuilding(b)}>
            <span>{mode === 'vibe' ? store ? vibeScore(state, store) : b.clientele === 'creatives' ? 'Kreativ' : b.clientele === 'business' ? 'Speed' : b.clientele === 'students' ? 'Budget' : 'Genuss' : own ? '☕' : fr ? 'FR' : rival ? rival.name.slice(0, 2).toUpperCase() : forSale ? <>FOR<br />SALE</> : <>FOR<br />LEASE</>}</span>
          </button>;
        })}
        <button className="ci-pin ci-pin-airport" style={{ left: `${airport[0]}%`, top: `${airport[1]}%` }} aria-label="Flughafen öffnen" onClick={onAirport}><span>✈ {airportCode}</span></button>
      </TransformComponent>
    </TransformWrapper>
  </div>;
}
