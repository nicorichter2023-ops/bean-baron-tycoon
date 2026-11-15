import { useRef, type CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { MASTER, type MasterBuilding } from '@/data/master';
import type { City } from '@/engine/types';
import { useGame } from './GameContext';
import { getCityArtwork, getStoreArtwork } from './artwork';
import { airportArt, art, cityBuildingArt, MAP_PEOPLE } from './sheetArt';
import { NeonSign, SceneAsset } from './VisualEffects';
import { newYorkSlot } from './visualAssets';
import { cityGridPosition, gridRectangle, gridToScreen, ISO_LAYERS, sortIsometricObjects } from './isometric';

interface Props { city: City; buildings: MasterBuilding[]; offset: number; zone: string; people: boolean; labels: boolean; airportCode: string; onBuilding: (b: MasterBuilding) => void; onAirport: () => void }
type MotionStyle = CSSProperties & { '--travel-x': string; '--travel-y': string; '--depth-start': number; '--depth-end': number };

export function IsometricCityScene({ city, buildings, offset, zone, people, labels, airportCode, onBuilding, onAirport }: Props) {
  const { state } = useGame();
  const gesture = useRef({ x: 0, y: 0, dragged: false });
  const plots = buildings.map((building, index) => ({ ...cityGridPosition(index), id: building.id, layer: 'buildings' as const, building, index }));
  const objects = sortIsometricObjects([
    ...plots.map(p => ({ ...p, kind: 'property' as const })),
    { id: 'landmark', x: 5.9, y: -.8, layer: 'buildings' as const, kind: 'landmark' as const },
    { id: 'airport', x: -.8, y: 6.9, layer: 'buildings' as const, kind: 'airport' as const },
  ]);
  const roads = [
    ...Array.from({ length: 6 }, (_, i) => gridRectangle(-.7, i * 1.25 - .625, 6.5, .32)),
    ...Array.from({ length: 5 }, (_, i) => gridRectangle(i * 1.25 - .625, -.7, .32, 7.5)),
    gridRectangle(-.7, 6.875, 6.5, .32), gridRectangle(5.625, -.7, .32, 7.9),
  ];
  const life = sortIsometricObjects(Array.from({ length: people ? 24 : 6 }, (_, i) => {
    const vehicle = i < 6;
    const across = i % 2 === 0;
    const lane = ((i % 5) * 1.25) - .49;
    const start = across ? { x: -.6, y: lane } : { x: lane, y: -.6 };
    const end = across ? { x: 5.7, y: lane } : { x: lane, y: 6.9 };
    return { ...start, id: `life-${i}`, layer: 'life' as const, index: i, end, vehicle, across };
  }));
  return <div className="city-plan city-plan-isometric" data-biome={city.biome} data-projection="2:1"
    onPointerDownCapture={e => { gesture.current = { x: e.clientX, y: e.clientY, dragged: !e.isPrimary }; }}
    onPointerMoveCapture={e => { if (Math.hypot(e.clientX - gesture.current.x, e.clientY - gesture.current.y) > 8) gesture.current.dragged = true; }}
    onClickCapture={e => { if (e.detail !== 0 && gesture.current.dragged) { e.preventDefault(); e.stopPropagation(); } }}>
    <svg className="iso-ground" viewBox="0 0 1600 1120" aria-hidden="true" style={{ zIndex: ISO_LAYERS.ground }}>
      <polygon className="iso-water" points={gridRectangle(-1.6, -1.6, 8.4, 9.9)} />
      <polygon className="iso-land" points={gridRectangle(-.9, -.9, 6.9, 8.2)} />
      {roads.map((points, i) => <polygon key={i} className="iso-road" points={points} />)}
      {plots.map(p => <polygon key={p.id} className="iso-pavement" data-zone={p.building.zoneType} points={gridRectangle(p.x - .45, p.y - .45, .9, .9)} />)}
    </svg>
    <div className="city-nameplate">{city.name}<small>{city.landmarkName}</small></div>
    <div className="iso-layer iso-buildings" style={{ zIndex: ISO_LAYERS.buildings }}>
      {objects.map((object, depthOrder) => {
        const { screenX, screenY } = gridToScreen(object);
        const style = { left: screenX, top: screenY, zIndex: depthOrder };
        if (object.kind === 'airport') return <Button key={object.id} variant="ghost" className="city-airport iso-airport" style={style} onClick={onAirport} aria-label="Flughafen öffnen"><img src={airportArt} alt="" /><span>✈ {airportCode}</span></Button>;
        if (object.kind === 'landmark') return <img key={object.id} className="city-landmark iso-landmark" style={style} src={getCityArtwork(city).src} alt={city.landmarkName} />;
        const b = object.building, own = state.stores.find(s => s.districtId === b.id);
        const occupant = state.world.occupants[b.id], rival = MASTER.competitors.find(c => c.id === occupant);
        return <Button variant="ghost" key={b.id} className="city-property iso-property" data-grid-x={object.x} data-grid-y={object.y} data-zone={b.zoneType} data-status={own ? 'own' : occupant ?? 'free'} data-dim={zone !== 'all' && zone !== b.zoneType || undefined} aria-label={`${b.name} · ${own ? 'Deine Filiale' : rival?.name ?? 'Zu vermieten'}`} style={style} onClick={() => onBuilding(b)}>
          <SceneAsset slot={newYorkSlot(city.id, object.index + offset)} draggable={false} fallback={own ? getStoreArtwork(city.biome, own.tier) : cityBuildingArt(b.zoneType, object.index + offset)} alt="" />
          {own && <NeonSign shop />}
        </Button>;
      })}
    </div>
    <div className="iso-layer iso-life" style={{ zIndex: ISO_LAYERS.life }} aria-hidden="true">
      {life.map(p => {
        const start = gridToScreen(p), end = gridToScreen(p.end);
        const style: MotionStyle = { left: start.screenX, top: start.screenY, '--travel-x': `${end.screenX - start.screenX}px`, '--travel-y': `${end.screenY - start.screenY}px`, '--depth-start': Math.round((p.x + p.y) * 100), '--depth-end': Math.round((p.end.x + p.end.y) * 100), animationDuration: `${p.vehicle ? 26 + p.index : 40 + p.index}s`, animationDelay: `${-p.index * 3.7}s` };
        return <span key={p.id} className={`iso-traveller ${p.vehicle ? 'iso-vehicle' : 'iso-person'}`} style={style}><img draggable={false} src={p.vehicle ? art('traffic', p.index % 2 ? 34 : 30).replace('.webp', '-map.webp') : MAP_PEOPLE[p.index % MAP_PEOPLE.length]} alt="" className={p.across ? 'iso-heading-right' : 'iso-heading-left'} /></span>;
      })}
    </div>
    {labels && <div className="iso-layer iso-pins" style={{ zIndex: ISO_LAYERS.pins }} aria-hidden="true">
      {sortIsometricObjects(plots).map((p, depthOrder) => {
        const own = state.stores.some(s => s.districtId === p.id), occupant = state.world.occupants[p.id];
        const rival = MASTER.competitors.find(c => c.id === occupant), anchor = gridToScreen(p);
        return <span key={p.id} className="iso-pin property-pin-anchor" data-status={own ? 'own' : occupant ?? 'free'} data-dim={zone !== 'all' && zone !== p.building.zoneType || undefined} style={{ left: anchor.screenX, top: anchor.screenY, zIndex: depthOrder }}><span className="pin-shadow" /><span className="property-status float-pin">{own ? '☕' : rival ? rival.name.split(' ')[0] : '＋'}<small>{p.id.split('-').at(-1)}</small></span></span>;
      })}
    </div>}
  </div>;
}