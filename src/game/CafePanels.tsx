import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { BRANCH_LABEL, DECOR, DECOR_SLOTS, DRINKS, GEAR, GEAR_KEYS, RESEARCH, SNACKS, BARISTA_LEVELS, gearStageNeed, researchCost, researchWeeks, type Branch, type DecorSlot } from '@/engine/cafeContent';
import { baristaLevel, cafeOf, gearUpgradeCost, itemUnlocked, renameStore, researchAvailable, setDecor, startResearch, storeCafe, storeCafeEffect, toggleMenuItem, trainBarista, upgradeGear } from '@/engine/cafe';
import { leversOf } from '@/engine/progression';
import { baristaArt, gearArt, icon, menuItemArt, sheet16 } from './sheetArt';
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

export function ResearchPanel() {
  const { state, perform } = useGame();
  const [branch, setBranch] = useState<Branch>('drink');
  const r = cafeOf(state).research;
  const active = r.active && RESEARCH.find(n => n.id === r.active?.id);
  return <div className="cafe-panel-block"><h3 className="cafe-panel-h">Forschung · {r.done.length}/32</h3>
    {active && <p className="cafe-active">Läuft: {active.name} · noch {r.active?.weeksLeft} Wo.</p>}
    <div className="cafe-chip-row">{(Object.keys(BRANCH_LABEL) as Branch[]).map(b => <Button key={b} size="sm" variant={branch === b ? 'secondary' : 'ghost'} onClick={() => setBranch(b)}>{BRANCH_LABEL[b]}</Button>)}</div>
    <ol className="cafe-research">{RESEARCH.filter(n => n.branch === branch).map(n => { const done = r.done.includes(n.id), avail = researchAvailable(state, n.id);
      return <li key={n.id} data-done={done}><img src={sheet16(n.sheet, n.art)} alt="" width={44} height={44} loading="lazy" /><div><strong>{n.name}</strong><small>{n.effect}</small></div>
        {done ? <span className="cafe-done">✓</span> : <Button size="sm" variant="outline" disabled={!avail || !!r.active || state.cash < researchCost(n.tier)} onClick={() => perform(g => startResearch(g, n.id))}>{eur(researchCost(n.tier))} · {researchWeeks(n.tier)} Wo.</Button>}</li>; })}</ol>
  </div>;
}

export function GearPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const sc = storeCafe(state, store), stage = leversOf(state, store).stage;
  return <div className="cafe-panel-block"><h3 className="cafe-panel-h">Ausstattung · 5 Stufen</h3>
    <div className="grid gap-2">{GEAR_KEYS.map(c => { const lvl = sc.gear[c], cost = gearUpgradeCost(state, store, c), need = gearStageNeed(lvl + 1), locked = lvl < 4 && stage < need;
      return <div key={c} className="cafe-gear-row"><span className="cafe-gear-lvl" aria-hidden="true">{lvl + (c === 'terrace' || c === 'vitrine' ? 0 : 1)}</span>
        <div className="min-w-0 flex-1"><strong>{GEAR[c].label}</strong><small>{GEAR[c].levels[lvl]}{lvl < 4 ? ` → ${GEAR[c].levels[lvl + 1]}` : ''}</small><span className="cafe-pips">{[0, 1, 2, 3, 4].map(i => <i key={i} data-on={i <= lvl} />)}</span></div>
        {lvl >= 4 ? <span className="cafe-done">MAX</span> : <Button size="sm" className="min-h-11" disabled={locked || state.cash < cost} onClick={() => perform(g => upgradeGear(g, store.id, c))}>{locked ? `ab Stufe ${need}` : eur(cost)}</Button>}</div>; })}</div>
  </div>;
}

export function DecorPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const sc = storeCafe(state, store); const [slot, setSlot] = useState<DecorSlot>('wall'); const [name, setName] = useState(store.name);
  const d = DECOR[slot];
  return <div className="cafe-panel-block"><h3 className="cafe-panel-h">Café gestalten</h3>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); perform(g => renameStore(g, store.id, name)); }}><input aria-label="Name der Filiale" className="min-h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm" value={name} maxLength={28} onChange={e => setName(e.target.value)} /><Button type="submit" variant="outline" className="min-h-11">Umbenennen</Button></form>
    <div className="cafe-chip-row mt-2">{DECOR_SLOTS.map(s => <Button key={s} size="sm" variant={slot === s ? 'secondary' : 'ghost'} onClick={() => setSlot(s)}>{DECOR[s].label}</Button>)}</div>
    <div className="cafe-menu-grid">{d.options.map((o, i) => <button key={o.name} className="cafe-menu-item" data-on={sc.decor[slot] === i} aria-pressed={sc.decor[slot] === i} onClick={() => perform(g => setDecor(g, store.id, slot, i))}><img src={sheet16(d.sheet, o.art)} alt="" width={56} height={56} loading="lazy" /><span>{o.name}</span><small>{eur(d.price)}</small></button>)}</div>
    <p className="mt-2 text-xs text-muted-foreground">Jeder gestaltete Bereich: +1 % Umsatz (max. +6 %).</p>
  </div>;
}

export function CafeBonusSummary({ store }: { store: Store }) {
  const { state } = useGame(); const fx = storeCafeEffect(state, store);
  return <dl className="cafe-finance"><div><dt>Café-Bonus (Karte, Ausstattung, Team, Forschung)</dt><dd>{pct(fx.rate + fx.rival)}</dd></div><div><dt>Konkurrenzdruck in der Stadt</dt><dd>{fx.rival ? pct(-fx.rival) : 'keiner'}</dd></div><div><dt>Zusatzkosten / Woche</dt><dd>{eur(fx.cost)}</dd></div></dl>;
}
