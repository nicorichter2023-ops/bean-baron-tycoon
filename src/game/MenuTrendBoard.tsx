import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGame, eur } from './GameContext';
import { weatherAt, trendAt, tycoonOf, adoptTrend, vibeScore } from '@/engine/tycoon';
import { storeCafe } from '@/engine/cafe';
import { MENU_ITEMS } from '@/engine/cafeContent';
import { SystemIcon } from './MasterIcons';
import { CafeDetail } from './CafeDetail';

export function WeatherRadar() {
  const { state } = useGame();
  return <div className="forecast-grid">{[0, 1, 2, 3].map(n => { const w = weatherAt(state.week + n, state.city.id); return <div key={n}><span>Woche {state.week + n}</span><SystemIcon kind="season" /><strong>{w.temp + (w.heat ? 8 : 0)}°C</strong><small>{w.season} · {w.label}</small></div>; })}</div>;
}
export function MenuTrendBoard({ reviewsOnly = false }: { reviewsOnly?: boolean }) {
  const { state, perform } = useGame(), t = tycoonOf(state), trend = trendAt(state.week);
  const [storeId, setStoreId] = useState<string | null>(null), [filter, setFilter] = useState('all');
  const chosen = state.stores.find(s => s.id === storeId);
  return <div className="space-y-5">
    {!reviewsOnly && <><div className="scene-heading"><div><p className="eyebrow">Café · Saisonkarte</p><h1>Menü & Trend-Radar</h1></div><SystemIcon kind="trend" size={30} /></div><WeatherRadar />
      <section className="master-band"><h2><SystemIcon kind="trend" />{trend.name}</h2><p>{state.week <= trend.until ? `Noch ${trend.until - state.week + 1} Wochen · 7,50 €/Becher` : 'Hype abgeklungen'}</p><p className="text-sm text-muted-foreground">{state.week <= trend.startWeek + 2 ? '+40 % Nachfrage bei frühem Einstieg' : 'Zeitfenster für Nachfragebonus geschlossen'}</p><Button disabled={!!t.trends[trend.id] || state.week > trend.until} onClick={() => perform(adoptTrend)}>{t.trends[trend.id] ? 'Auf der Saisonkarte' : 'Saisonkarte ergänzen · 600 €'}</Button></section>
      <section><h2 className="master-title"><SystemIcon kind="vibe" />Filialkarten & Viertel-Vibe</h2><div className="master-grid">{state.stores.map(s => { const sc = storeCafe(state, s); return <article className="master-item" key={s.id}><strong>{s.name}</strong><p className="text-sm text-muted-foreground">{state.cities.find(c => c.id === s.cityId)?.name} · Vibe {vibeScore(state, s)}/100</p><div className="menu-tags">{sc.menu.map(id => <span key={id}>{MENU_ITEMS.find(m => m.id === id)?.name ?? id}</span>)}</div><Button variant="outline" onClick={() => setStoreId(s.id)}>Menü & Café öffnen</Button></article>; })}</div></section></>}
    <section><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="master-title"><SystemIcon kind="review" />BeanAdvisor</h2><div className="flex">{[['all', 'Alle'], ['criticism', 'Kritik'], ['hype', 'Hype']].map(([id, name]) => <Button key={id} size="sm" variant={filter === id ? 'secondary' : 'ghost'} onClick={() => setFilter(id ?? 'all')}>{name}</Button>)}</div></div>
      {!t.reviews.length && <p className="text-muted-foreground text-sm">Die ersten Kundenstimmen erscheinen nach dem Wochenabschluss.</p>}
      <div className="review-stream">{t.reviews.filter(r => filter === 'all' || (filter === 'criticism' ? r.stars < 3.5 : r.stars >= 4)).slice(0, 20).map((r, i) => <article key={`${r.storeId}-${r.week}-${i}`}><div className="flex justify-between gap-2"><strong>{state.stores.find(s => s.id === r.storeId)?.name}</strong><span className="ci-stars">★ {r.stars.toFixed(1)}</span></div><p>„{r.text}“</p><small>Woche {r.week} · #{r.tag}</small><Button size="sm" variant="ghost" onClick={() => setStoreId(r.storeId)}>Café öffnen</Button></article>)}</div>
    </section>{chosen && <CafeDetail store={chosen} address={state.cities.find(c => c.id === chosen.cityId)?.name ?? ''} onClose={() => setStoreId(null)} />}
  </div>;
}