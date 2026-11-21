import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { BARISTA_LEVELS, DRINKS, SNACKS } from '@/engine/cafeContent';
import { baristaLevel, itemUnlocked, renameStore, storeCafe, storeCafeEffect, toggleMenuItem, trainBarista } from '@/engine/cafe';
import { baristaArt, icon, menuItemArt } from './sheetArt';
import { eur, useGame } from './GameContext';

const pct = (n: number) => `${n >= 0 ? '+' : ''}${Math.round(n * 1000) / 10} %`;

export function StaffPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const sc = storeCafe(state, store), lvl = baristaLevel(sc.xp), next = BARISTA_LEVELS[lvl];
  return <div className="cafe-panel-block">
    <div className="flex items-center gap-3"><img src={baristaArt(lvl)} alt="" width={64} height={64} className="cafe-portrait" />
      <div className="min-w-0 flex-1"><strong>Team-Stufe {lvl}/5</strong><p className="text-xs text-muted-foreground">{['Neuling', 'Junior', 'Barista', 'Senior', 'Meister'][lvl - 1]} · {store.employees.length} Mitarbeitende</p>
        <div className="cafe-xp" aria-label="Erfahrung"><span style={{ width: `${next ? Math.min(100, (sc.xp / next) * 100) : 100}%` }} /></div>
        <small className="text-xs text-muted-foreground">{next ? `${sc.xp}/${next} Erfahrung · wächst jede Woche mit den Gästen` : 'Höchste Stufe'}</small></div></div>
    <Button className="mt-3 min-h-11 w-full" variant="secondary" disabled={lvl >= 5 || state.cash < 400 * lvl} onClick={() => perform(g => trainBarista(g, store.id))}><img src={icon('barista')} alt="" width={22} height={22} />Schulung · {eur(400 * lvl)} (+30 Erfahrung)</Button>
  </div>;
}

export function RenamePanel({ store }: { store: Store }) {
  const { perform } = useGame();
  const [name, setName] = useState(store.name);
  return <form className="cafe-panel-block flex gap-2" onSubmit={e => { e.preventDefault(); perform(g => renameStore(g, store.id, name)); }}>
    <input aria-label="Name der Filiale" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm" value={name} maxLength={28} onChange={e => setName(e.target.value)} />
    <Button type="submit" variant="outline" className="min-h-11">Umbenennen</Button>
  </form>;
}

export function MenuPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const sc = storeCafe(state, store);
  return <div className="cafe-panel-block"><h3 className="cafe-panel-h">Speisekarte</h3>
    {([['Getränke', DRINKS], ['Snacks', SNACKS]] as const).map(([title, list]) => <div key={title}><p className="mt-2 text-xs font-semibold text-muted-foreground">{title}</p>
      <div className="cafe-menu-grid">{list.map(it => { const on = sc.menu.includes(it.id), open = itemUnlocked(state, it.id);
        return <button key={it.id} className="cafe-menu-item" data-on={on} data-locked={!open} aria-pressed={on} onClick={() => perform(g => toggleMenuItem(g, store.id, it.id))}>
          <img src={menuItemArt(it.kind, it.art)} alt="" width={56} height={56} loading="lazy" /><span>{it.name}</span><small>{open ? eur(it.price) : '🔒 Forschung'}</small></button>; })}</div></div>)}
  </div>;
}

export function CafeBonusSummary({ store }: { store: Store }) {
  const { state } = useGame(); const fx = storeCafeEffect(state, store);
  return <dl className="cafe-finance"><div><dt>Café-Bonus (Karte, Ausstattung, Team, Forschung)</dt><dd>{pct(fx.rate + fx.rival)}</dd></div><div><dt>Konkurrenzdruck in der Stadt</dt><dd>{fx.rival ? pct(-fx.rival) : 'keiner'}</dd></div><div><dt>Zusatzkosten / Woche</dt><dd>{eur(fx.cost)}</dd></div></dl>;
}
