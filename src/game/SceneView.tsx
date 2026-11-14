import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpCircle, Coffee, Factory, Landmark, Package, Rocket, Store, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { eur, useGame } from './GameContext';
import { SCENES } from './sceneAssets';
import { Sprite } from './Sprite';
import { SectionFilter, StoreFilter } from './ui';
import { EmpireTab } from './tabs/EmpireTab';
import { FinanceTab } from './tabs/FinanceTab';
import { MarketTab } from './tabs/MarketTab';
import { getStoreArtwork } from './artwork';

export type Place = 'cafe' | 'terrace' | 'holding' | 'office' | 'roastery' | 'port' | 'exchange' | 'farm' | 'negotiation';
const PLACES: Record<Place, { title: string; image: string; subtitle: string }> = {
  cafe: { title: 'Dein Café', image: SCENES.cafe.url, subtitle: 'Kaffee. Menschen. Dein Imperium.' },
  terrace: { title: 'Café-Terrasse', image: SCENES.terrace.url, subtitle: 'Ein Platz an der Sonne' },
  holding: { title: 'Coffee Empire Holding', image: SCENES.penthouse.url, subtitle: 'Bean to Billion' },
  office: { title: 'Chef-Büro', image: SCENES.office.url, subtitle: 'Finanzen & Beteiligungen' },
  roastery: { title: 'Die Rösterei', image: SCENES.roasteryBase.url, subtitle: 'Von der Bohne zur Marke' },
  port: { title: 'Kaffeehafen', image: SCENES.port.url, subtitle: 'Globale Lieferketten' },
  exchange: { title: 'Rohstoffbörse', image: SCENES.exchange.url, subtitle: 'Arabica · Robusta · Futures' },
  farm: { title: 'Kaffee-Ursprung', image: SCENES.farm.url, subtitle: 'Die Welt hinter jeder Tasse' },
  negotiation: { title: 'Verhandlungsraum', image: SCENES.negotiation.url, subtitle: 'Der nächste große Deal' },
};
type Menu = { title: string; group: 'empire' | 'market' | 'finance'; sections: string[]; storeId?: string };
export function ActionSheet({ menu, close }: { menu: Menu | null; close: () => void }) {
  return <Sheet open={Boolean(menu)} onOpenChange={(open) => { if (!open) close(); }}><SheetContent side="bottom" className="action-sheet">
    <SheetHeader><SheetTitle>{menu?.title}</SheetTitle><SheetDescription>Woche {useGame().state.week} · Coffee Empire</SheetDescription></SheetHeader>
    {menu && <div className="mt-5"><SectionFilter.Provider value={menu.sections}><StoreFilter.Provider value={menu.storeId ?? null}>{menu.group === 'empire' ? <EmpireTab /> : menu.group === 'finance' ? <FinanceTab /> : <MarketTab />}</StoreFilter.Provider></SectionFilter.Provider></div>}
  </SheetContent></Sheet>;
}

export function SceneView({ place, onPlace, destinations }: { place: Place; onPlace: (place: Place) => void; destinations: Place[] }) {
  const { state } = useGame();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [storeId, setStoreId] = useState(state.stores[0]?.id ?? '');
  const [pulse, setPulse] = useState(false);
  const lastWeek = useRef(state.week);
  const store = state.stores.find((s) => s.id === storeId) ?? state.stores[0];
  const city = state.cities.find((c) => c.id === store?.cityId) ?? state.city;
  const details = PLACES[place];
  const isCafe = place === 'cafe' || place === 'terrace';
  useEffect(() => {
    if (state.week === lastWeek.current) return;
    lastWeek.current = state.week; setPulse(true);
    const timer = setTimeout(() => setPulse(false), 3500);
    return () => clearTimeout(timer);
  }, [state.week]);
  const open = (title: string, group: Menu['group'], sections: string[]) => setMenu({ title, group, sections, storeId: group === 'empire' && sections.includes('Filialen') ? store?.id : undefined });
  return <>
    <div className="scene-heading"><div><p className="eyebrow">{isCafe ? `${city.name} · Woche ${state.week}` : details.subtitle}</p><h1>{isCafe ? store?.name ?? details.title : details.title}</h1></div><Sprite sheet="finance" index={1} className="h-12 w-12" /></div>
    <div className="location-switch" aria-label="Spielorte">{destinations.map((p) => <Button key={p} variant={place === p ? 'secondary' : 'ghost'} onClick={() => onPlace(p)}>{PLACES[p].title.replace('Coffee Empire ', '').replace('Café-', '')}</Button>)}</div>
    {isCafe && <div className="store-selector"><Store className="h-4 w-4 text-primary" /><select aria-label="Filiale auswählen" value={store?.id ?? ''} onChange={(e) => setStoreId(e.target.value)}>{state.stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
    <div className={`scene-stage ${place === 'roastery' ? 'roastery-stage' : ''} ${pulse ? 'week-pulse' : ''}`} key={place}>
      {place === 'roastery' ? <div className="factory-floor" aria-label="Isometrische Rösterei" role="img" /> : <img className="scene-image" src={details.image} alt={details.title} fetchPriority="high" />}
      {isCafe && <><Hotspot x={33} y={56} label="Café verwalten" icon={<Coffee />} onClick={() => open('Café & Ausbau', 'empire', ['Filialen'])} /><Hotspot x={67} y={66} label="Personal" icon={<Users />} onClick={() => open('Personal & Filialen', 'empire', ['Filialen'])} /><Hotspot x={80} y={36} label="Neue Filiale" icon={<Store />} onClick={() => open('Expansion', 'empire', ['Neue Filiale'])} />
        {store && store.employees.length > 0 && <Sprite sheet="staff" index={1} className="scene-person barista" />}
        {store && store.customersServedLastWeek > 0 && <Sprite sheet="customers" index={3} className="scene-person customer" />}
        <span className="coffee-steam" aria-hidden="true">∿</span>
        {pulse && store && <div className="income-float" role="status">+{eur(store.weeklyRevenue)}</div>}
      </>}
      {place === 'holding' && <><Hotspot x={28} y={38} label="Holding" icon={<Landmark />} onClick={() => open('Holding', 'empire', ['Holding', 'Letzte Woche'])} /><Hotspot x={62} y={63} label="Startup-Pitches" icon={<Rocket />} onClick={() => open('Startup-Pitches', 'finance', ['VC-Startups'])} /></>}
      {place === 'office' && <><Hotspot x={28} y={58} label="Bankkredit" icon={<Wallet />} onClick={() => open('Bankkredit', 'finance', ['Bankkredit'])} /><Hotspot x={57} y={25} label="Aktienhandel" icon={<Landmark />} onClick={() => open('Aktien & M&A', 'finance', ['Aktienmarkt'])} /><Hotspot x={59} y={74} label="Übernahmen" icon={<Rocket />} onClick={() => onPlace('negotiation')} /></>}
      {place === 'negotiation' && <Hotspot x={50} y={63} label="Verträge & Übernahmen" icon={<Landmark />} onClick={() => open('M&A und Beteiligungen', 'finance', ['Aktienmarkt', 'VC-Startups'])} />}
      {place === 'roastery' && <><Sprite sheet="roastery" index={1} className="roaster-machine" /><Sprite sheet="logistics" index={0} className="bean-pallet" /><Sprite sheet="logistics" index={8} className="storage-rack" /><Sprite sheet="vehicles" index={12} className="forklift" /><Sprite sheet="roastery" index={9} className="factory-silos" /><Hotspot x={37} y={55} label="Rösterei" icon={<Factory />} onClick={() => open('Rösterei', 'empire', ['Rösterei'])} /><Hotspot x={77} y={56} label="Bohnenlager" icon={<Package />} onClick={() => open('Bohnen einkaufen', 'market', ['Bohnen einkaufen'])} /></>}
      {(place === 'port' || place === 'exchange' || place === 'farm') && <><Hotspot x={35} y={53} label="Bohnenmarkt" icon={<Coffee />} onClick={() => open('Bohnenmarkt', 'market', ['Kaffee-Futures', 'Bohnen einkaufen'])} />{place !== 'farm' && <Hotspot x={72} y={67} label="B2B-Lieferverträge" icon={<Package />} onClick={() => open('Lieferverträge', 'market', ['B2B-Vertrag', 'Aktive Lieferverträge'])} />}</>}
      <div className="scene-badge"><span className="live-dot" />{isCafe ? `${store?.employees.length ?? 0} im Team` : place === 'roastery' ? state.roastery.owned ? 'In Betrieb' : 'Noch nicht erworben' : 'Coffee Empire'}</div>
    </div>
    <div className="scene-metrics">{isCafe ? <><Metric label="Umsatz / Woche" value={eur(store?.weeklyRevenue ?? 0)} /><Metric label="Gäste" value={String(store?.customersServedLastWeek ?? 0)} /><Metric label="Qualität" value={`${Math.round(store?.qualityIndex ?? 0)} / 100`} /></> : place === 'roastery' ? <><Metric label="Rohbohnen" value={`${Math.round(state.roastery.rawBeanStockKg)} kg`} /><Metric label="Geröstet" value={`${Math.round(state.roastery.roastedStockKg)} kg`} /><Metric label="Kapazität / Wo" value={`${state.roastery.capacityKgPerWeek} kg`} /></> : <><Metric label="Filialen" value={String(state.stores.length)} /><Metric label="Reputation" value={String(Math.round(state.brandReputation))} /><Metric label="Ergebnis / Wo" value={eur(state.lastReport?.netIncome ?? 0)} /></>}</div>
    <div className="scene-actions">
      {isCafe ? <><Button onClick={() => open('Filialen & Personal', 'empire', ['Filialen'])}><Users /> Team & Ausbau</Button><Button variant="outline" onClick={() => open('Neue Filiale', 'empire', ['Neue Filiale'])}><Store /> Eröffnen</Button></> : place === 'roastery' ? <><Button onClick={() => open('Rösterei', 'empire', ['Rösterei'])}><Factory /> Rösterei</Button><Button variant="outline" onClick={() => open('Bohnenlager', 'market', ['Bohnen einkaufen'])}><Package /> Lager</Button></> : place === 'holding' ? <><Button onClick={() => open('Startup-Pitches', 'finance', ['VC-Startups'])}><Rocket /> Pitches</Button><Button variant="outline" onClick={() => open('Wochenbericht', 'empire', ['Letzte Woche'])}><Landmark /> Bericht</Button></> : place === 'office' || place === 'negotiation' ? <><Button onClick={() => open('Bankkredit', 'finance', ['Bankkredit'])}><Wallet /> Bank</Button><Button variant="outline" onClick={() => open('Aktien & M&A', 'finance', ['Aktienmarkt'])}><Landmark /> Börse & M&A</Button></> : <><Button onClick={() => open('Bohnen einkaufen', 'market', ['Bohnen einkaufen'])}><Coffee /> Bohnen</Button><Button variant="outline" onClick={() => open('B2B-Lieferverträge', 'market', ['B2B-Vertrag', 'Aktive Lieferverträge'])}><Package /> Verträge</Button></>}
    </div>
    {isCafe && <div className="owned-stores"><div className="flex items-center justify-between mb-3"><h2>Deine Filialen</h2><span className="text-xs text-muted-foreground">{state.stores.length} Standorte</span></div><div className="store-strip">{state.stores.map((s) => { const c = state.cities.find((c) => c.id === s.cityId); return <Button key={s.id} variant="ghost" className={`store-tile ${store?.id === s.id ? 'selected-store' : ''}`} onClick={() => setStoreId(s.id)}><img src={getStoreArtwork(c?.biome ?? 'european_classic', s.tier)} alt="" /><span>{c?.name}<small>{['', 'Kiosk', 'Café', 'Flagship'][s.tier]}</small></span></Button>; })}</div></div>}
    <Button variant="ghost" className="mt-4 text-muted-foreground" onClick={() => open('Spielstand', 'finance', ['Spielstand'])}><ArrowUpCircle /> Spielstand</Button>
    <ActionSheet menu={menu} close={() => setMenu(null)} />
  </>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
export function Hotspot({ x, y, label, icon, onClick }: { x: number; y: number; label: string; icon: ReactNode; onClick: () => void }) { return <Button className="scene-hotspot" style={{ left: `${x}%`, top: `${y}%` }} variant="secondary" aria-label={label} title={label} onClick={onClick}>{icon}<span>{label}</span></Button>; }