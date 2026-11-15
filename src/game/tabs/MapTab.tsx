import { useState } from 'react';
import { ArrowLeft, Plane, Store, Users, MapPin, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { storeOpeningCost, GAME_CONFIG } from '@/engine';
import { openStaffedStore, takeoverCost, takeoverRivalSite } from '@/engine/empire';
import type { StoreTier } from '@/engine/types';
import { MASTER, ZONES, CLIENTELE, type MasterBuilding } from '@/data/master';
import { travelToCity } from '@/engine/world';
import { eur, useGame } from '../GameContext';
import { getCityArtwork } from '../artwork';
import { cityMapImage } from '@/data/cityMaps';
import { CityMap } from '../CityMap';
import { NeighborhoodPanel } from '../NeighborhoodPanel';
import airportHub from '@/assets/airport-hub.jpg';
import { CafeDetail } from '../CafeDetail';
import { FlightOverlay } from '../Intro';

export function MapTab({ airportOnly = false }: { airportOnly?: boolean }) {
  const { state, perform } = useGame();
  const [hub, setHub] = useState(airportOnly), [region, setRegion] = useState('all');
  const [cabin, setCabin] = useState<'economy' | 'business'>('economy');
  const [selected, setSelected] = useState<MasterBuilding | null>(null), [tier, setTier] = useState<StoreTier>(1);
  const [flight, setFlight] = useState<{ from: string; to: string } | null>(null);
  const [purchase, setPurchase] = useState(false), [manage, setManage] = useState(false);
  const city = state.city, airport = MASTER.airports.find(a => a.cityId === city.id);
  const own = state.stores.find(s => s.districtId === selected?.id);
  const occupant = selected ? state.world.occupants[selected.id] : undefined;
  const rival = MASTER.competitors.find(c => c.id === occupant);
  const district = city.districts.find(d => d.id === selected?.id);
  const cost = selected && district ? purchase ? selected.purchasePrice + GAME_CONFIG.STORE_OPENING_COST[tier] : storeOpeningCost(district, tier) : 0;
  const choose = (b: MasterBuilding) => { setSelected(b); setTier(1); setPurchase(false); setManage(state.stores.some(s => s.districtId === b.id)); };
  return <>
    {flight && <FlightOverlay from={flight.from} to={flight.to} onDone={() => setFlight(null)} />}
    <div className="scene-heading"><div><p className="eyebrow">{hub ? `${city.name} · ${airport?.airportCode ?? ''}` : `${city.country} · ${airport?.airportCode ?? ''}`}</p><h1>{hub ? 'International Airport' : city.name}</h1></div><Button variant="secondary" size="icon" aria-label={hub ? 'Zur Stadtkarte' : 'Flughafen öffnen'} onClick={() => { setHub(!hub); setSelected(null); }}>{hub ? <ArrowLeft /> : <Plane />}</Button></div>
    {hub ? <>
      <img className="airport-hub-img" src={airportHub} alt="Flughafen-Terminal mit Jets" width={1088} height={1600} />
      <div className="airport-banner"><Plane size={36} /><div><span>COFFEE EMPIRE · DEPARTURES</span><strong>{airport?.airportCode ?? 'HQ'} → WORLD</strong><p>20 Destinationen · {state.world.travelHistory.length} Reisen</p></div></div>
      <div className="airport-controls"><div><Button variant={cabin === 'economy' ? 'secondary' : 'ghost'} onClick={() => setCabin('economy')}>Economy</Button><Button variant={cabin === 'business' ? 'secondary' : 'ghost'} onClick={() => setCabin('business')}>Business</Button></div><select aria-label="Reiseregion" value={region} onChange={e => setRegion(e.target.value)}><option value="all">Alle Regionen</option><option value="EMEA">Europa & Afrika</option><option value="AMER">Amerika</option><option value="APAC">Asien & Pazifik</option></select></div>
      <div className="departure-board"><div className="departure-head"><span>Destination</span><span>Ticket</span></div>{MASTER.airports.filter(a => region === 'all' || a.region === region).map(a => {
        const target = state.cities.find(c => c.id === a.cityId); if (!target) return null;
        const ticket = cabin === 'business' ? a.baseTicketBusiness : a.baseTicketEconomy, current = a.cityId === city.id;
        return <div className="departure-row" key={a.cityId}><img src={cityMapImage(a.cityId) ?? getCityArtwork(target).src} alt="" /><div><strong>{a.cityName}</strong><span>{a.airportCode} · {target.country}</span><small>{state.stores.filter(s => s.cityId === a.cityId).length} eigene Filialen · 30 Standorte</small></div><Button variant={current ? 'ghost' : 'secondary'} disabled={current || state.cash < ticket} aria-label={`Nach ${a.cityName} reisen`} onClick={() => { setFlight({ from: airport?.airportCode ?? city.name, to: a.airportCode }); perform(g => travelToCity(g, a.cityId, cabin)); setHub(airportOnly); setSelected(null); }}>{current ? 'Vor Ort' : eur(ticket)}{!current && <Plane size={14} />}</Button></div>;
      })}</div>
      {state.world.travelHistory.length > 0 && <section className="travel-history"><h2>Letzte Reisen</h2>{state.world.travelHistory.slice(-5).reverse().map((t, i) => <p key={i}>Woche {t.week} · {MASTER.airports.find(a => a.cityId === t.from)?.airportCode ?? t.from} → {MASTER.airports.find(a => a.cityId === t.to)?.airportCode ?? t.to} · {eur(t.cost)}</p>)}</section>}
    </> : <>
      <CityMap key={city.id} city={city} onBuilding={choose} onAirport={() => { setHub(true); setSelected(null); }} />
      {selected && <section className="property-detail property-sheet" role="dialog" aria-label="Standortdetails"><div className="flex items-start justify-between gap-2"><div><p className="eyebrow">{ZONES[selected.zoneType]} · {CLIENTELE[selected.clientele]}</p><h2>{selected.name}</h2></div><Button variant="ghost" size="icon" aria-label="Standort schließen" onClick={() => setSelected(null)}><ArrowLeft /></Button></div>
        <div className="property-metrics"><div><Users /><strong>{selected.footTraffic.toLocaleString('de-DE')}</strong><span>Laufkundschaft / Woche</span></div><div><MapPin /><strong>{eur(selected.weeklyRent)}</strong><span>Miete / Woche</span></div><div><Trophy /><strong>+{selected.locationBonus.valuePercent}%</strong><span>{selected.locationBonus.label}</span></div><div><Store /><strong>{eur(selected.purchasePrice)}</strong><span>Immobilienpreis</span></div></div>
        <NeighborhoodPanel buildingId={selected.id} />
        {own ? <Button className="w-full" onClick={() => setManage(true)}><Store /> {own.name} öffnen</Button> : rival ? <div className="rival-profile" data-rival={rival.id}><h3>{rival.name}</h3><p>{rival.description}</p><dl><div><dt>Qualität</dt><dd>{rival.avgQuality}</dd></div><div><dt>Tassenpreis</dt><dd>{eur(rival.avgCupPrice)}</dd></div><div><dt>Expansion</dt><dd>{rival.aggressiveness}/100</dd></div></dl><Button className="mt-3 min-h-11 w-full" disabled={state.cash < takeoverCost(selected.id)} onClick={() => perform(g => takeoverRivalSite(g, selected.id))}>Standort ablösen & übernehmen · {eur(takeoverCost(selected.id))}</Button><p className="mt-2 text-xs text-muted-foreground">Oder die ganze Firma unter Finanzen → Aktien & M&A kaufen – dann gehören dir alle ihre Cafés.</p></div> : <><div className="flex flex-wrap gap-2 my-3">{([1,2,3] as StoreTier[]).map(t => <Button key={t} variant={tier === t ? 'secondary' : 'outline'} onClick={() => setTier(t)}>{['','Kiosk','Café','Flagship'][t]}</Button>)}</div><div className="flex gap-2 mb-3"><Button variant={!purchase ? 'secondary' : 'ghost'} onClick={() => setPurchase(false)}>Mieten</Button><Button variant={purchase ? 'secondary' : 'ghost'} onClick={() => setPurchase(true)}>Immobilie kaufen</Button></div><Button className="w-full" disabled={state.cash < cost} onClick={() => perform(g => openStaffedStore(g, city.id, selected.id, tier, purchase))}><Store /> Eröffnen · {eur(cost)}</Button><p className="mt-2 text-xs text-muted-foreground">Inklusive erstem Barista – das Café verdient ab der ersten Woche.</p></>}
      </section>}
      {own && manage && selected && <CafeDetail store={own} address={`${selected.name}, ${city.name}`} onClose={() => setManage(false)} />}
      {state.world.news.length > 0 && <section className="city-news"><h2>Immobilien-Ticker</h2>{state.world.news.map((n,i) => <p key={i}>{n}</p>)}</section>}
      <details className="property-directory"><summary>Alle Standorte · 30</summary>{MASTER.cities.find(c => c.cityId === city.id)?.buildings.map(b => <Button variant="ghost" key={b.id} onClick={() => choose(b)}><span>{b.name}<small>{ZONES[b.zoneType]} · {b.footTraffic.toLocaleString('de-DE')} Passanten</small></span><span>{eur(b.weeklyRent)}</span></Button>)}</details>
    </>}
  </>;
}
