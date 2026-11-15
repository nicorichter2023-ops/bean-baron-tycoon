import { useState } from 'react';
import { X, Users, Coffee, Megaphone, Wallet, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { CafeCutaway } from './CafeCutaway';
import { StoreEquipmentPanel } from './StoreEquipmentPanel';
import { EmpireTab } from './tabs/EmpireTab';
import { LabPanel } from './LabPanel';
import { SectionFilter, StoreFilter } from './ui';
import { cafeComments, cafeReviews } from './cafeReviews';
import { eur } from './GameContext';

const Stars = ({ v }: { v: number }) => <span className="ci-stars" aria-label={`${v} von 5 Sternen`}>{[1,2,3,4,5].map(i => <span key={i} data-on={v >= i - .25 ? 'full' : v >= i - .75 ? 'half' : 'off'}>★</span>)}</span>;
type Tab = 'service' | 'product' | 'marketing' | 'finance';

export function CafeDetail({ store, address, onClose }: { store: Store; address: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab | null>(null), [upgrades, setUpgrades] = useState(false);
  const r = cafeReviews(store), boss = store.employees[0];
  const greeting = r.overall >= 4 ? 'Hallo Boss! Der Laden brummt heute.' : r.overall >= 3 ? 'Hallo Boss. Wie geht es dir heute?' : 'Boss, die Gäste meckern – wir brauchen Verbesserungen.';
  const tabs: [Tab, string, typeof Users][] = [['service','Service',Users],['product','Produkt',Coffee],['marketing','Marketing',Megaphone],['finance','Finanzen',Wallet]];
  return <div className="cafe-detail" role="dialog" aria-modal="true" aria-label={`${store.name} Filialansicht`}>
    <header className="cafe-detail-head"><span className="cafe-detail-logo">☕</span><div><strong>{store.name}</strong><small>{address}</small></div><Button variant="ghost" size="icon" aria-label="Filialansicht schließen" onClick={onClose}><X /></Button></header>
    <div className="cafe-detail-body">
      <p className="cafe-detail-greeting">„{greeting}“<small>{boss?.name ?? 'Kein Personal'}</small></p>
      <div className="cafe-detail-scene"><CafeCutaway store={store} />
        <Button className="cafe-scene-btn left" aria-label="Personal" onClick={() => setTab('service')}><Users /></Button>
        <Button className="cafe-scene-btn right" aria-label="Ausbau & Upgrades" aria-pressed={upgrades} onClick={() => setUpgrades(!upgrades)}><Box /></Button>
      </div>
      {upgrades && <section className="cafe-detail-panel"><StoreEquipmentPanel store={store} /></section>}
      <section className="cafe-reviews"><h2>KUNDENBEWERTUNGEN</h2><div className="cafe-reviews-grid">
        <div><strong className="text-4xl">{r.overall.toFixed(1)}</strong><Stars v={r.overall} /><small>{r.count} Bewertungen</small></div>
        <dl>{([['Preis',r.price],['Produkt',r.product],['Service',r.service],['Atmosphäre',r.atmosphere]] as const).map(([l,v]) => <div key={l}><dt>{l}</dt><dd><Stars v={v} /> {v.toFixed(1)}</dd></div>)}</dl>
      </div>
      <div className="cafe-comments">{cafeComments(store).map((c,i) => <article key={i}><Stars v={c.stars} /><p>„{c.text}“</p></article>)}</div></section>
      {tab && <section className="cafe-detail-panel">
        {(tab === 'service' || tab === 'product') && <SectionFilter.Provider value={['Filialen']}><StoreFilter.Provider value={store.id}><EmpireTab /></StoreFilter.Provider></SectionFilter.Provider>}
        {tab === 'marketing' && <LabPanel />}
        {tab === 'finance' && <dl className="cafe-finance"><div><dt>Umsatz letzte Woche</dt><dd>{eur(store.weeklyRevenue)}</dd></div><div><dt>Gäste letzte Woche</dt><dd>{store.customersServedLastWeek}</dd></div><div><dt>Tassenpreis</dt><dd>{eur(store.pricePerCup)}</dd></div><div><dt>Personalkosten / Woche</dt><dd>{eur(store.employees.reduce((s,e) => s + e.salaryWeekly, 0))}</dd></div><div><dt>Anlagenwert</dt><dd>{eur(store.equipment?.bookValue ?? 0)}</dd></div></dl>}
      </section>}
    </div>
    <nav className="cafe-detail-tabs">{tabs.map(([id,label,Icon]) => <Button key={id} variant={tab === id ? 'secondary' : 'ghost'} aria-pressed={tab === id} onClick={() => setTab(tab === id ? null : id)}><Icon /><span>{label}</span></Button>)}</nav>
  </div>;
}
