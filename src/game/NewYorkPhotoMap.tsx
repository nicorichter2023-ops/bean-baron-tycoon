import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MASTER, type MasterBuilding } from '@/data/master';
import { useGame } from './GameContext';
import nycMap from '@/assets/nyc-city-map.jpg';

/** Testansicht: gemalte Manhattan-Karte, Pins liegen auf den Häuserblöcken. */
const SPOTS: [number, number][] = Array.from({ length: 30 }, (_, i) => {
  const col = i % 5, row = Math.floor(i / 5);
  const x = 22 + col * 15 + (row % 2) * 6, y = 8 + row * 10.5 + (col % 2) * 3;
  return [Math.min(94, x), y];
});

export function NewYorkPhotoMap({ buildings, onBuilding, onAirport }: { buildings: MasterBuilding[]; onBuilding: (b: MasterBuilding) => void; onAirport: () => void }) {
  const { state } = useGame();
  return <div className="nyc-photo-map">
    <TransformWrapper initialScale={1} minScale={1} maxScale={3} doubleClick={{ disabled: true }}>
      <TransformComponent wrapperClass="nyc-photo-viewport" contentClass="nyc-photo-content">
        <img src={nycMap} alt="Manhattan mit Freiheitsstatue und Brooklyn Bridge" width={1088} height={1920} draggable={false} />
        {buildings.slice(0, 30).map((b, i) => {
          const own = state.stores.some(s => s.districtId === b.id);
          const rival = MASTER.competitors.find(c => c.id === state.world.occupants[b.id]);
          const [x, y] = SPOTS[i] ?? [50, 50];
          return <button key={b.id} className="ci-pin" data-status={own ? 'own' : rival ? 'rival' : 'free'} style={{ left: `${x}%`, top: `${y}%` }} aria-label={`${b.name} · ${own ? 'Deine Filiale' : rival?.name ?? 'Zu vermieten'}`} onClick={() => onBuilding(b)}>
            <span>{own ? '☕' : rival ? rival.name.slice(0, 2).toUpperCase() : <>FOR<br />LEASE</>}</span>
          </button>;
        })}
        <button className="ci-pin ci-pin-airport" style={{ left: '12%', top: '92%' }} aria-label="Flughafen öffnen" onClick={onAirport}><span>✈ JFK</span></button>
      </TransformComponent>
    </TransformWrapper>
  </div>;
}
