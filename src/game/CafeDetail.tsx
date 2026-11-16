import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameState, Store } from '@/engine/types';
import { CafeRoom } from './CafeRoom';
import { CafeEditor } from './CafeEditor';
import { StoreLeversPanel } from './StoreLeversPanel';
import { CafeBonusSummary, GearPanel, MenuPanel, StaffPanel } from './CafePanels';
import { buyProperty, propertyPrice, sellProperty } from '@/engine/empire';
import { cafeComments, cafeReviews } from './cafeReviews';
import { eur, useGame } from './GameContext';
import { leversOf, stageUpgrade } from '@/engine/progression';
import { maxStage, stg } from '@/engine/unlocks';
import { gearUpgradeCost, storeCafe, upgradeGear } from '@/engine/cafe';
import { GEAR, GEAR_KEYS, gearStageNeed } from '@/engine/cafeContent';

const Stars = ({ v }: { v: number }) => <span className="ci-stars" aria-label={`${v} von 5 Sternen`}>{[1,2,3,4,5].map(i => <span key={i} data-on={v >= i - .25 ? 'full' : v >= i - .75 ? 'half' : 'off'}>★</span>)}</span>;
type Tab = 'service' | 'product' | 'gear' | 'finance';

/** Cheapest affordable sensible next step for this store: stage first, else the cheapest gear level. */
function nextUpgrade(g: GameState, s: Store): { label: string; run: (g: GameState) => ReturnType<typeof stageUpgrade> } | null {
  const l = leversOf(g, s);
  if (l.stage < 7 && l.stage + 1 <= maxStage(g)) { const st = stg(l.stage); return { label: `Ausbau zu „${st.label}“ · ${eur(st.cost)}`, run: x => stageUpgrade(x, s.id) }; }
  const sc = storeCafe(g, s);
  const c = GEAR_KEYS.filter(k => sc.gear[k] < 4 && l.stage >= gearStageNeed(sc.gear[k] + 1)).sort((a, b) => gearUpgradeCost(g, s, a) - gearUpgradeCost(g, s, b))[0];
  return c ? { label: `${GEAR[c].levels[sc.gear[c] + 1]} · ${eur(gearUpgradeCost(g, s, c))}`, run: x => upgradeGear(x, s.id, c) } : null;
}

export function CafeDetail({ store, address, onClose }: { store: Store; address: string; onClose: () => void }) {
  const { state, perform } = useGame();
  const [tab, setTab] = useState<Tab>('gear');
  const [edit, setEdit] = useState(false);
  const r = cafeReviews(store), boss = store.employees[0];
  const greeting = r.overall >= 4 ? 'Hallo Boss! Der Laden brummt heute.' : r.overall >= 3 ? 'Hallo Boss. Wie geht es dir heute?' : 'Boss, die Gäste meckern – wir brauchen Verbesserungen.';
  const tabs: [Tab, string][] = [['service','Service'],['product','Produkt'],['gear','Ausstattung'],['finance','Finanzen']];
  const next = nextUpgrade(state, store);
  return <div className="cafe-detail" role="dialog" aria-modal="true" aria-label={`${store.name} Filialansicht`}>
    <header className="cafe-detail-head"><Button variant="ghost" size="icon" aria-label="Filialansicht schließen" onClick={onClose}><X /></Button><div><strong>{store.name}</strong><small>{address}</small></div><Button size="sm" className="min-h-11" onClick={() => setEdit(true)}>Gestalten</Button></header>
    {edit && <CafeEditor store={store} onClose={() => setEdit(false)} />}
    <div className="cafe-detail-body">
      <div className="cafe-detail-scene"><CafeRoom store={store} /></div>
      <dl className="cafe-kpis"><div><dt>Umsatz</dt><dd>{eur(store.weeklyRevenue)}</dd></div><div><dt>Gäste</dt><dd>{store.customersServedLastWeek}</dd></div><div><dt>Bewertung</dt><dd><Stars v={r.overall} /> {r.overall.toFixed(1)}</dd></div></dl>
      <p className="cafe-detail-greeting">„{greeting}“<small>{boss?.name ?? 'Kein Personal'}</small></p>
      {next && <Button className="cafe-next-upgrade" onClick={() => perform(next.run)}>Nächstes Upgrade: {next.label}</Button>}
      <nav className="cafe-detail-tabs" style={{ position: 'static' }}>{tabs.map(([id,label]) => <Button key={id} variant={tab === id ? 'secondary' : 'ghost'} aria-pressed={tab === id} onClick={() => setTab(id)}><span>{label}</span></Button>)}</nav>
      <section className="grid gap-3">
        {tab === 'service' && <><StaffPanel store={store} /><StoreLeversPanel store={store} /></>}
        {tab === 'product' && <><MenuPanel store={store} /><p className="text-xs text-muted-foreground">Neue Getränke & Snacks schaltest du unter HQ → Forschung frei.</p></>}
        {tab === 'gear' && <><Button variant="secondary" className="min-h-11 w-full" onClick={() => setEdit(true)}>Farben, Sitze & Deko gestalten</Button><GearPanel store={store} /></>}
        {tab === 'finance' && <><CafeBonusSummary store={store} /><dl className="cafe-finance"><div><dt>Umsatz letzte Woche</dt><dd>{eur(store.weeklyRevenue)}</dd></div><div><dt>Gäste letzte Woche</dt><dd>{store.customersServedLastWeek}</dd></div><div><dt>Tassenpreis</dt><dd>{eur(store.pricePerCup)}</dd></div><div><dt>Personalkosten / Woche</dt><dd>{eur(store.employees.reduce((s,e) => s + e.salaryWeekly, 0))}</dd></div><div><dt>Anlagenwert</dt><dd>{eur(store.equipment?.bookValue ?? 0)}</dd></div><div><dt>Immobilie</dt><dd>{store.propertyBookValue ? `Eigentum · ${eur(store.propertyBookValue)}` : 'gemietet'}</dd></div></dl>
          {store.propertyBookValue ? <Button variant="outline" className="min-h-11 w-full" onClick={() => perform(g => sellProperty(g, store.id))}>Sale-and-Lease-Back · +{eur(store.propertyBookValue * 0.9)}</Button>
            : propertyPrice(store.districtId) > 0 && <Button className="min-h-11 w-full" disabled={state.cash < propertyPrice(store.districtId)} onClick={() => perform(g => buyProperty(g, store.id))}>Gebäude kaufen · {eur(propertyPrice(store.districtId))} (keine Miete mehr)</Button>}</>}
      </section>
      <section className="cafe-reviews"><h2>KUNDENBEWERTUNGEN</h2><div className="cafe-reviews-grid">
        <div><strong className={`text-4xl ${r.overall >= 4 ? 'text-success' : r.overall >= 3 ? 'text-gold' : 'text-destructive'}`}>{r.overall.toFixed(1)}</strong><Stars v={r.overall} /><small>{r.count} Bewertungen</small></div>
        <dl>{([['Preis',r.price],['Produkt',r.product],['Service',r.service],['Atmosphäre',r.atmosphere]] as const).map(([l,v]) => <div key={l}><dt>{l}</dt><dd><Stars v={v} /> {v.toFixed(1)}</dd></div>)}</dl>
      </div>
      <div className="cafe-comments">{cafeComments(store).map((c,i) => <article key={i}><Stars v={c.stars} /><p>„{c.text}“</p></article>)}</div></section>
    </div>
  </div>;
}
