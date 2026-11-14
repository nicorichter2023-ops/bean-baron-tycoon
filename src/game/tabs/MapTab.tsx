import { useState } from 'react';
import { ArrowLeft, Minus, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { openStore, storeOpeningCost } from '@/engine';
import type { City, District, StoreTier } from '@/engine/types';
import { eur, useGame } from '../GameContext';
import { BIOME_SCENE, CITY_POSITIONS, SCENES } from '../sceneAssets';
import { getCityArtwork, getStoreArtwork } from '../artwork';
import { EmpireTab } from './EmpireTab';
import { SectionFilter, StoreFilter } from '../ui';

export function MapTab() {
  const { state, set, perform } = useGame();
  const [city, setCity] = useState<City | null>(null);
  const [district, setDistrict] = useState<District | null>(null);
  const [tier, setTier] = useState<StoreTier>(1);
  const [zoom, setZoom] = useState(1);
  const [manage, setManage] = useState(false);
  const selectCity = (c: City) => { setCity(c); set((s) => ({ ...s, city: c })); };
  const occupied = state.stores.find((s) => s.cityId === city?.id && s.districtId === district?.id);
  return <>
    <div className="scene-heading"><div><p className="eyebrow">{city ? city.country : '20 Metropolen · 4 Welten'}</p><h1>{city?.name ?? 'Dein nächster Standort'}</h1></div>{city && <Button variant="ghost" size="icon" aria-label="Zur Weltkarte" onClick={() => { setCity(null); setDistrict(null); }}><ArrowLeft /></Button>}</div>
    {!city ? <>
      <div className="map-toolbar"><span>Weltkarte</span><div><Button variant="ghost" size="icon" aria-label="Karte verkleinern" disabled={zoom <= 1} onClick={() => setZoom((z) => Math.max(1, z - .5))}><Minus /></Button><Button variant="ghost" size="icon" aria-label="Karte vergrößern" disabled={zoom >= 2} onClick={() => setZoom((z) => Math.min(2, z + .5))}><Plus /></Button></div></div>
      <div className="world-scroll"><div className="world-canvas" style={{ width: `${1000 * zoom}px`, height: `${558 * zoom}px` }}><img src={SCENES.world.url} alt="Weltkarte mit Kaffeestandorten" draggable={false} />{state.cities.map((c) => { const position = CITY_POSITIONS[c.id]; if (!position) return null; return <Button key={c.id} variant="ghost" className="city-marker" aria-label={`${c.name} erkunden`} title={c.name} style={{ left: `${position[0]}%`, top: `${position[1]}%` }} onClick={() => selectCity(c)}><img src={getCityArtwork(c).src} alt="" /><span>{c.name}</span>{state.stores.some((s) => s.cityId === c.id) && <i className="live-dot" />}</Button>; })}</div></div>
      <div className="city-directory"><h2>Metropolen</h2><div>{state.cities.map((c) => <Button key={c.id} variant="ghost" onClick={() => selectCity(c)}><img src={getCityArtwork(c).badge} alt="" /><span>{c.name}<small>{c.country}</small></span></Button>)}</div></div>
    </> : <>
      <div className="city-panorama"><img src={BIOME_SCENE[city.biome]} alt={`${city.name} – Stadtpanorama`} /><div><strong>{city.name}</strong><span>Kaufkraft {city.purchasingPower.toFixed(2)}× · Kaffeekultur {city.coffeeCultureIndex}</span></div></div>
      <div className="district-tabs">{city.districts.map((d) => <Button variant={district?.id === d.id ? 'secondary' : 'ghost'} key={d.id} onClick={() => { setTier(1); setDistrict(d); }}>{d.name}</Button>)}</div>
      <div className="district-scene"><img src={SCENES.district.url} alt={`Grundstücke in ${city.name}`} />{city.districts.map((d, i) => { const store = state.stores.find((s) => s.cityId === city.id && s.districtId === d.id); return <Button key={d.id} className={`plot-marker plot-${i % 4}`} variant={store ? 'secondary' : 'default'} onClick={() => { setTier(1); setDistrict(d); }} aria-label={`${d.name} Grundstück`}><Store /><span>{d.name}<small>{store ? store.name : 'Zu vermieten'}</small></span></Button>; })}</div>
    </>}
    <Sheet open={Boolean(district)} onOpenChange={(open) => { if (!open) { setDistrict(null); setManage(false); } }}><SheetContent side="bottom" className="action-sheet"><SheetHeader><SheetTitle>{district?.name}</SheetTitle><SheetDescription>{city?.name} · {occupied ? 'Deine Filiale' : 'Freies Grundstück'}</SheetDescription></SheetHeader>{district && city && <div className="mt-5">
      {occupied ? <><img className="mx-auto h-36" src={getStoreArtwork(city.biome, occupied.tier)} alt={occupied.name} /><h2 className="text-center">{occupied.name}</h2><Button className="mt-4 w-full" onClick={() => setManage(true)}><Store /> Filiale verwalten</Button>{manage && <div className="mt-4"><SectionFilter.Provider value={['Filialen']}><StoreFilter.Provider value={occupied.id}><EmpireTab /></StoreFilter.Provider></SectionFilter.Provider></div>}</> : <>
        <div className="scene-metrics"><div><span>Miete / Woche</span><strong>{eur(district.rentWeekly)}</strong></div><div><span>Laufkundschaft</span><strong>{district.footTraffic} / 100</strong></div><div><span>Konkurrenz</span><strong>{district.competition} / 100</strong></div></div>
        <img className="mx-auto h-40" src={getStoreArtwork(city.biome, tier)} alt={['','Kiosk','Café','Flagship'][tier]} /><div className="grid grid-cols-3 gap-2">{([1,2,3] as StoreTier[]).map((t) => <Button key={t} variant={tier === t ? 'default' : 'outline'} disabled={t > district.maxStoreTier} onClick={() => setTier(t)}>{['','Kiosk','Café','Flagship'][t]}</Button>)}</div>
        <Button className="mt-4 w-full" onClick={() => perform((s) => openStore(s, city.id, district.id, tier))}><Store /> Eröffnen · {eur(storeOpeningCost(district, tier))}</Button>
      </>}
    </div>}</SheetContent></Sheet>
  </>;
}