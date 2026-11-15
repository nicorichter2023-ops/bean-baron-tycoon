import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MASTER, type MasterBuilding } from '@/data/master';
import { CITY_SPOTS, cityMapImage } from '@/data/cityMaps';
import { useGame } from './GameContext';

/** Painted city map (same scheme for all cities): pins sit on land blocks of the artwork. */
export function PhotoCityMap({ cityId, cityName, airportCode, buildings, onBuilding, onAirport, onError }: { cityId: string; cityName: string; airportCode: string; buildings: MasterBuilding[]; onBuilding: (b: MasterBuilding) => void; onAirport: () => void; onError: () => void }) {
  const { state } = useGame();
  const [labels, setLabels] = useState(true);
  const src = cityMapImage(cityId);
  const spots = CITY_SPOTS[cityId] ?? [];
  if (!src) { onError(); return null; }
  const airport = spots[30] ?? [12, 92];
  return <div className="nyc-photo-map" data-labels={labels}>
    <button className="photo-map-toggle" aria-pressed={labels} onClick={() => setLabels(!labels)}>{labels ? 'Schilder aus' : 'Schilder an'}</button>
    <TransformWrapper initialScale={1} minScale={1} maxScale={3} doubleClick={{ disabled: true }}>
      <TransformComponent wrapperClass="nyc-photo-viewport" contentClass="nyc-photo-content">
        <img src={src} alt={`Stadtkarte ${cityName}`} width={1088} height={1920} draggable={false} onError={onError} />
        {buildings.slice(0, 30).map((b, i) => {
          const own = state.stores.some(s => s.districtId === b.id);
          const rival = MASTER.competitors.find(c => c.id === state.world.occupants[b.id]);
          const [x, y] = spots[i] ?? [50, 50];
          const forSale = !own && !rival && (b.purchasePrice ?? 0) > 0 && i % 3 === 0;
          return <button key={b.id} className="ci-pin" data-status={own ? 'own' : rival ? 'rival' : 'free'} data-rival={rival?.id} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${b.name} · ${own ? 'Deine Filiale' : rival?.name ?? (forSale ? 'Zu verkaufen' : 'Zu vermieten')}`} onClick={() => onBuilding(b)}>
            <span>{own ? '☕' : rival ? rival.name.slice(0, 2).toUpperCase() : forSale ? <>FOR<br />SALE</> : <>FOR<br />LEASE</>}</span>
          </button>;
        })}
        <button className="ci-pin ci-pin-airport" style={{ left: `${airport[0]}%`, top: `${airport[1]}%` }} aria-label="Flughafen öffnen" onClick={onAirport}><span>✈ {airportCode}</span></button>
      </TransformComponent>
    </TransformWrapper>
  </div>;
}
