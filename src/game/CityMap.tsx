import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Minus, Plus, LocateFixed, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MASTER, ZONES, type MasterBuilding } from '@/data/master';
import type { City } from '@/engine/types';
import { cityPlacementHash, orderedCityBuildings } from '@/engine/neighborhood';
import { IsometricCityScene } from './IsometricCityScene';

export function CityMap({ city, onBuilding, onAirport }: { city: City; onBuilding: (b: MasterBuilding) => void; onAirport: () => void }) {
  const [zone, setZone] = useState('all'), [labels, setLabels] = useState(true);
  const source = MASTER.cities.find(c => c.cityId === city.id); if (!source) return <p>Bestehende Filialen in {city.name} bleiben erhalten.</p>;
  const offset = cityPlacementHash(city.id) % 30;
  const ordered = orderedCityBuildings(city.id);
  return <section className="city-map-section">
    <div className="city-zone-filter" aria-label="Stadtzonen"><Button variant={zone === 'all' ? 'secondary' : 'ghost'} onClick={() => setZone('all')}>Alle · 30</Button>{Object.entries(ZONES).map(([id, name]) => <Button key={id} variant={zone === id ? 'secondary' : 'ghost'} onClick={() => setZone(id)}>{name}</Button>)}</div>
    <TransformWrapper initialScale={.65} minScale={.45} maxScale={1.8} centerOnInit wheel={{ step: .06 }} doubleClick={{ disabled: true }} panning={{ velocityDisabled: false }}>
      {({ zoomIn, zoomOut, resetTransform }) => <>
        <div className="city-map-tools"><span>{city.name} · {source.airportCode}</span><div><Button variant="ghost" size="icon" aria-label="Markierungen umschalten" aria-pressed={labels} onClick={() => setLabels(!labels)}><Eye /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte verkleinern" onClick={() => zoomOut()}><Minus /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte vergrößern" onClick={() => zoomIn()}><Plus /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte zentrieren" onClick={() => resetTransform()}><LocateFixed /></Button></div></div>
        <TransformComponent wrapperClass="city-map-viewport" contentClass="city-map-transform">
          <IsometricCityScene city={city} buildings={ordered} offset={offset} zone={zone} labels={labels} airportCode={source.airportCode} onBuilding={onBuilding} onAirport={onAirport} />
        </TransformComponent>
      </>}
    </TransformWrapper>
    <div className="city-map-legend"><span className="legend-own">● Deine Filialen</span><span>＋ Frei</span>{MASTER.competitors.map(c => <span key={c.id} data-rival={c.id}>● {c.name.split(' ')[0]}</span>)}</div>
  </section>;
}