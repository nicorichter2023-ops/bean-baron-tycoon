import { RegionalLandmark } from './RegionalLandmark';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CITY_GEOGRAPHY } from '@/data/cityGeography';
import { MASTER, type MasterBuilding } from '@/data/master';
import type { City } from '@/engine/types';
import { useGame } from './GameContext';
import { getCityArtwork, getStoreArtwork } from './artwork';
import { airportArt, cityBuildingArt } from './sheetArt';
import { NeonSign, SceneAsset } from './VisualEffects';
import { newYorkSlot } from './visualAssets';
import { cityGridPosition, gridRectangle, gridToScreen, ISO_LAYERS, sortIsometricObjects, type GridPoint } from './isometric';

const PROJECTION = { tileWidth: 256, tileHeight: 128, offsetX: 1050, offsetY: 340 };
const project = (p: GridPoint) => gridToScreen(p, PROJECTION);
const rect = (x: number, y: number, w: number, h: number) => gridRectangle(x, y, w, h, PROJECTION);
const polygon = (points: GridPoint[]) => points.map(p => { const s = project(p); return `${s.screenX},${s.screenY}`; }).join(' ');
const grounded = (src: string) => src.replace('.webp', '-grounded.webp');

interface Props { city: City; buildings: MasterBuilding[]; offset: number; zone: string; labels: boolean; airportCode: string; onBuilding: (b: MasterBuilding) => void; onAirport: () => void }
export function IsometricCityScene({ city, buildings, offset, zone, labels, airportCode, onBuilding, onAirport }: Props) {
  const { state } = useGame();
  const geography = CITY_GEOGRAPHY[city.id];
  const isNewYork = city.id === 'new_york';
  const gesture = useRef({ x: 0, y: 0, dragged: false });
  const plots = buildings.map((building, index) => ({ ...cityGridPosition(index), id: building.id, layer: 'buildings' as const, building, index }));
  const objects = sortIsometricObjects([
    ...plots.map(p => ({ ...p, kind: 'property' as const })),
    { id: 'landmark', x: isNewYork ? 6.3 : 6.05, y: isNewYork ? 8.25 : -1.15, layer: 'buildings' as const, kind: 'landmark' as const },
    { id: 'airport', x: -.15, y: 7.15, layer: 'buildings' as const, kind: 'airport' as const },
  ]);
  const roads = [
    ...Array.from({ length: 7 }, (_, i) => rect(-.7, i * 1.25 - .625, 6.35, .36)),
    ...Array.from({ length: 6 }, (_, i) => rect(i * 1.25 - .625, -.8, .36, 8.5)),
  ];
  const avenueLines = Array.from({ length: 6 }, (_, i) => [project({ x: i * 1.25 - .445, y: -.8 }), project({ x: i * 1.25 - .445, y: 7.7 })]);
  const manhattan = polygon([{x:-.9,y:-2.6},{x:5.9,y:-2.6},{x:5.9,y:6.8},{x:4.9,y:8.2},{x:2.1,y:8.3},{x:-.9,y:7.5}]);
  return <div className="city-plan city-plan-isometric" data-biome={city.biome} data-projection="2:1"
    onPointerDownCapture={e => { gesture.current = { x: e.clientX, y: e.clientY, dragged: !e.isPrimary }; }}
    onPointerMoveCapture={e => { if (Math.hypot(e.clientX - gesture.current.x, e.clientY - gesture.current.y) > 8) gesture.current.dragged = true; }}
    onClickCapture={e => { if (e.detail !== 0 && gesture.current.dragged) { e.preventDefault(); e.stopPropagation(); } }}>
    <svg className="iso-ground" viewBox="0 0 2100 1600" aria-hidden="true" style={{ zIndex: ISO_LAYERS.ground }}>
      <polygon className="iso-land" points={isNewYork ? manhattan : geography?.kind === 'bay' ? polygon([{x:-1.4,y:-2.6},{x:6.3,y:-2.6},{x:6.2,y:6.2},{x:5.3,y:7.9},{x:2.8,y:8.2},{x:-1.4,y:7.2}]) : rect(-1.4,-2.6,7.7,10.7)} />
      {['river', 'canals'].includes(geography?.kind ?? '') && <><polygon className="iso-water" points={rect(-1.3,7.55,7.5,.55)}/><polygon className="iso-bridge" points={rect(1.6,7.4,.5,.9)}/><polygon className="iso-bridge" points={rect(4.6,7.4,.5,.9)}/></>}
      {geography?.kind === 'canals' && [-1.05,5.95].map(x=><polygon key={x} className="iso-water" points={rect(x,-2.3,.3,10.2)}/>)}
      {['lake','inland'].includes(geography?.kind ?? '') && <polygon className="iso-water" points={rect(-1.4,6.7,.5,1.4)}/>}
      {roads.map((points, i) => <polygon key={i} className="iso-road" points={points} />)}
      {avenueLines.map((line, i) => <line key={i} className="iso-lane-line" x1={line[0]?.screenX} y1={line[0]?.screenY} x2={line[1]?.screenX} y2={line[1]?.screenY} />)}
      <polygon className="iso-park" points={rect(.15, -2.25, 4.75, 1.2)} />
      <polygon className="iso-park-path" points={rect(.25, -1.72, 4.55, .13)} />
      {Array.from({length: 16}, (_,i) => { const p=project({x:.4+(i%8)*.57,y:-2.06+Math.floor(i/8)*.7}); return <g key={i}><ellipse className="iso-tree-shadow" cx={p.screenX+4} cy={p.screenY+5} rx="15" ry="6"/><ellipse className="iso-tree" cx={p.screenX} cy={p.screenY-8} rx="12" ry="16"/></g>; })}
      {isNewYork && <polygon className="iso-liberty-island" points={rect(5.65, 7.65, 1.3, 1.2)} />}
      <text className="iso-map-label" x="1320" y="205">{geography?.park}</text>
      <text className="iso-water-label" x="205" y="700" transform="rotate(27 205 700)">{isNewYork ? 'HUDSON RIVER' : geography?.water}</text>
      <text className="iso-water-label" x="1700" y="760" transform="rotate(-27 1700 760)">{isNewYork ? 'EAST RIVER' : city.name}</text>
      <text className="iso-map-label" x="805" y="1375">{isNewYork ? 'LIBERTY ISLAND' : geography?.landmark}</text>
      {(isNewYork ? [{x:2.05,y:6.98},{x:3.1,y:6.98},{x:5.48,y:2.3}] : []).map((p,i)=>{ const point=project(p); return <image key={i} href="/assets/sheets/traffic/30-map-grounded.webp" x={point.screenX-22} y={point.screenY-15} width="44" height="30"/>; })}
    </svg>
    <div className="city-nameplate">{city.name}<small>{isNewYork ? 'Manhattan · ' : ''}{geography?.water}</small></div>
    <div className="iso-layer iso-buildings" style={{ zIndex: ISO_LAYERS.buildings }}>
      {objects.map((object, depthOrder) => {
        const { screenX, screenY } = project(object);
        const style = { left: screenX, top: screenY, zIndex: depthOrder };
        if (object.kind === 'airport') return <Button key={object.id} variant="ghost" className="city-airport iso-airport" style={style} onClick={onAirport} aria-label="Flughafen öffnen"><img src={airportArt} alt="" /><span>✈ {airportCode}</span></Button>;
        if (object.kind === 'landmark') return getCityArtwork(city).isLandmark ? <img key={object.id} className="city-landmark iso-landmark" style={style} src={grounded(getCityArtwork(city).src)} alt={city.landmarkName} /> : <div key={object.id} className="city-landmark iso-landmark" style={style}><RegionalLandmark cityId={city.id} label={geography?.landmark ?? city.landmarkName} /></div>;
        const b = object.building, own = state.stores.find(s => s.districtId === b.id);
        const occupant = state.world.occupants[b.id], rival = MASTER.competitors.find(c => c.id === occupant);
        return <Button variant="ghost" key={b.id} className="city-property iso-property" data-grid-x={object.x} data-grid-y={object.y} data-zone={b.zoneType} data-status={own ? 'own' : occupant ?? 'free'} data-dim={zone !== 'all' && zone !== b.zoneType || undefined} aria-label={`${b.name} · ${own ? 'Deine Filiale' : rival?.name ?? 'Zu vermieten'}`} style={style} onClick={() => onBuilding(b)}>
          <svg className="iso-foundation" viewBox="0 0 180 104" aria-hidden="true"><polygon className="iso-foundation-shadow" points="0,54 90,12 180,54 90,102"/><polygon className="iso-foundation-curb" points="0,44 90,86 180,44 180,54 90,96 0,54"/><polygon className="iso-foundation-top" points="0,44 90,0 180,44 90,88"/></svg>
          <SceneAsset slot={newYorkSlot(city.id, object.index + offset)} draggable={false} fallback={grounded(own ? getStoreArtwork(city.biome, own.tier) : cityBuildingArt(b.zoneType, object.index + offset))} alt="" />
          {own && <NeonSign shop />}
        </Button>;
      })}
    </div>
    {labels && <div className="iso-layer iso-pins" style={{ zIndex: ISO_LAYERS.pins }} aria-hidden="true">
      {sortIsometricObjects(plots).map((p, depthOrder) => {
        const own = state.stores.some(s => s.districtId === p.id), occupant = state.world.occupants[p.id];
        const rival = MASTER.competitors.find(c => c.id === occupant), anchor = project(p);
        return <span key={p.id} className="iso-pin property-pin-anchor" data-status={own ? 'own' : occupant ?? 'free'} data-dim={zone !== 'all' && zone !== p.building.zoneType || undefined} style={{ left: anchor.screenX, top: anchor.screenY, zIndex: depthOrder }}><span className="pin-shadow" /><span className="property-status float-pin">{own ? '☕' : rival ? rival.name.split(' ')[0] : '＋'}<small>{p.id.split('-').at(-1)}</small></span></span>;
      })}
    </div>}
  </div>;
}