import { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Minus, Plus, LocateFixed, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MASTER, ZONES, type MasterBuilding } from '@/data/master';
import type { City } from '@/engine/types';
import { stableHash } from '@/engine/world';
import { useGame } from './GameContext';
import { cityBuildingArt, MAP_PEOPLE, airportArt } from './sheetArt';
import { getStoreArtwork, getCityArtwork } from './artwork';
import { CityTraffic, NeonSign, SceneAsset } from './VisualEffects';
import { newYorkSlot } from './visualAssets';
import { IsometricCityScene } from './IsometricCityScene';

export function CityMap({ city, onBuilding, onAirport }: { city: City; onBuilding: (b: MasterBuilding) => void; onAirport: () => void }) {
  const { state } = useGame(); const [zone, setZone] = useState('all'), [people, setPeople] = useState(true);
  const [labels, setLabels] = useState(true);
  const source = MASTER.cities.find(c => c.cityId === city.id); if (!source) return <p>Bestehende Filialen in {city.name} bleiben erhalten.</p>;
  const offset = stableHash(city.id) % 30;
  // Stable city-specific ordering. Each property has its own 44px+ target and source attributes.
  const ordered = [...source.buildings.slice(offset), ...source.buildings.slice(0, offset)];
  return <section className="city-map-section">
    <div className="city-zone-filter" aria-label="Stadtzonen"><Button variant={zone === 'all' ? 'secondary' : 'ghost'} onClick={() => setZone('all')}>Alle · 30</Button>{Object.entries(ZONES).map(([id, name]) => <Button key={id} variant={zone === id ? 'secondary' : 'ghost'} onClick={() => setZone(id)}>{name}</Button>)}</div>
    <TransformWrapper initialScale={.65} minScale={city.id === 'new_york' ? .45 : .35} maxScale={1.8} centerOnInit wheel={{ step: .06 }} doubleClick={{ disabled: true }} panning={city.id === 'new_york' ? { velocityDisabled: false } : { excluded: ['button'] }}>
      {({ zoomIn, zoomOut, resetTransform }) => <>
        <div className="city-map-tools"><span>{city.name} · {source.airportCode}</span><div><Button variant="ghost" size="icon" aria-label="Passanten umschalten" aria-pressed={people} onClick={() => setPeople(!people)}><Users /></Button><Button variant="ghost" size="icon" aria-label="Markierungen umschalten" aria-pressed={labels} onClick={() => setLabels(!labels)}><Eye /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte verkleinern" onClick={() => zoomOut()}><Minus /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte vergrößern" onClick={() => zoomIn()}><Plus /></Button><Button variant="ghost" size="icon" aria-label="Stadtkarte zentrieren" onClick={() => resetTransform()}><LocateFixed /></Button></div></div>
        <TransformComponent wrapperClass="city-map-viewport" contentClass="city-map-transform">
          {city.id === 'new_york' ? <IsometricCityScene city={city} buildings={ordered} offset={offset} zone={zone} people={people} labels={labels} airportCode={source.airportCode} onBuilding={onBuilding} onAirport={onAirport} /> : <div className="city-plan" data-biome={city.biome}>
            <div className="city-river" /><div className="city-road road-main" /><div className="city-road road-cross" />
            {[0,1,2,3,4,5].map(i => <div key={i} className="city-side-street" style={{ top: `${160 + i * 122}px` }} />)}
            <img className="city-landmark" src={getCityArtwork(city).src} alt={city.landmarkName} />
            <div className="city-nameplate">{city.name}<small>{city.landmarkName}</small></div>
            {ordered.map((b, i) => {
              const col = i % 5, row = Math.floor(i / 5), own = state.stores.find(s => s.districtId === b.id);
              const occupant = state.world.occupants[b.id], rival = MASTER.competitors.find(c => c.id === occupant);
              const visible = zone === 'all' || zone === b.zoneType;
              return <Button variant="ghost" key={b.id} className="city-property" data-zone={b.zoneType} data-status={own ? 'own' : occupant ? occupant : 'free'} data-dim={!visible || undefined} aria-label={`${b.name} · ${own ? 'Deine Filiale' : rival?.name ?? 'Zu vermieten'}`} style={{ left: `${105 + col * 152 + (row % 2) * 24}px`, top: `${100 + row * 122}px` }} onClick={() => onBuilding(b)}>
                <span className="property-base" /><SceneAsset slot={newYorkSlot(city.id, i + offset)} draggable={false} fallback={own ? getStoreArtwork(city.biome, own.tier) : cityBuildingArt(b.zoneType, i + offset)} alt="" />
                {own && <NeonSign shop />}
                {labels && <span className="property-pin-anchor"><span className="pin-shadow" /><span className="property-status float-pin">{own ? '☕' : rival ? rival.name.split(' ')[0] : '＋'}<small>{b.id.split('-').at(-1)}</small></span></span>}
              </Button>;
            })}
            <Button variant="ghost" className="city-airport" onClick={onAirport} aria-label="Flughafen öffnen"><img src={airportArt} alt="" /><span>✈ {source.airportCode}</span></Button>
            {people && Array.from({ length: 18 }, (_, i) => <img key={i} className={`city-pedestrian pedestrian-${i % 3}`} src={MAP_PEOPLE[i % MAP_PEOPLE.length]} alt="" style={{ left: `${80 + (i % 6) * 148}px`, top: `${214 + Math.floor(i / 6) * 244}px`, animationDelay: `${-i * 1.7}s`, animationDuration: `${12 + i % 7}s` }} />)}
            <CityTraffic />
          </div>}
        </TransformComponent>
      </>}
    </TransformWrapper>
    <div className="city-map-legend"><span className="legend-own">● Deine Filialen</span><span>＋ Frei</span>{MASTER.competitors.map(c => <span key={c.id} data-rival={c.id}>● {c.name.split(' ')[0]}</span>)}</div>
  </section>;
}