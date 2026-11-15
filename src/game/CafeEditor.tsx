import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { applyDesign, designCost, designOf, hasTerrace, storeCafe, type CafeDesign } from '@/engine/cafe';
import { DESIGN_STYLES, PALETTES, TERRACE_SHARE, TERRACE_STYLES } from '@/engine/cafeContent';
import { CafeRoom } from './CafeRoom';
import { roomScene, terraceScene } from './roomLayouts';
import { leversOf } from '@/engine/progression';
import { eur, useGame } from './GameContext';

type T = 'colors' | 'seats' | 'terrace';
/** Café editor: live preview of the complete scene from a draft; pays once on confirm, cancel is free. */
export function CafeEditor({ store, onClose }: { store: Store; onClose: () => void }) {
  const { state, perform } = useGame();
  const saved = designOf(storeCafe(state, store));
  const [draft, setDraft] = useState<CafeDesign>(saved);
  const terrace = hasTerrace(state, store);
  const [tab, setTab] = useState<T>('colors');
  const stage = leversOf(state, store).stage;
  const cost = designCost(state, store, draft);
  const tabs: [T, string][] = [['colors', 'Farben'], ['seats', 'Sitze & Deko'], ...(terrace ? [['terrace', 'Terrasse'] as [T, string]] : [])];
  const set = (p: Partial<CafeDesign>) => setDraft(d => ({ ...d, ...p }));
  const confirm = () => { perform(g => applyDesign(g, store.id, draft)); onClose(); };
  return <div className="cafe-editor" role="dialog" aria-modal="true" aria-label="Café gestalten">
    <header className="cafe-detail-head"><Button variant="ghost" size="icon" aria-label="Zurück ohne Änderungen" onClick={onClose}><ChevronLeft /></Button><div><strong>Café gestalten</strong><small>{store.name}</small></div><span className="w-10" /></header>
    <div className="cafe-editor-preview"><CafeRoom store={store} design={draft} view={tab === 'terrace' ? 'terrace' : 'room'} /></div>
    <nav className="cafe-editor-tabs">{tabs.map(([id, l]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{l}</button>)}</nav>
    <div className="cafe-editor-body">
      {tab === 'colors' && <div className="cafe-swatches">{PALETTES.map((p, i) => <button key={p.name} aria-pressed={draft.palette === i} onClick={() => set({ palette: i })}><span style={{ background: p.swatch }} />{p.name}</button>)}</div>}
      {tab === 'seats' && <div className="cafe-style-grid">{DESIGN_STYLES.map((d, i) => <button key={d.id} aria-pressed={draft.style === i} onClick={() => set({ style: i })}><img src={roomScene(stage, i)} alt="" width={160} height={120} loading="lazy" /><strong>{d.name}</strong><small>{d.seats}</small></button>)}</div>}
      {tab === 'terrace' && terrace && <><div className="cafe-style-grid">{TERRACE_STYLES.map((t, i) => <button key={t.name} aria-pressed={draft.terrace === i} onClick={() => set({ terrace: i })}><img src={terraceScene(i)} alt="" width={160} height={120} loading="lazy" /><strong>{t.name}</strong><small>+{Math.round(t.bonus * 100)} % Terrassenumsatz</small></button>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">Der Bonus gilt nur für den Terrassenanteil (etwa {Math.round(TERRACE_SHARE * 100)} % des Umsatzes).</p></>}
      {!terrace && <p className="mt-2 text-xs text-muted-foreground">Terrasse: erst unter „Ausstattung“ kaufen, dann hier gestalten.</p>}
    </div>
    <footer className="cafe-editor-foot"><p>Änderung: <strong>{eur(cost)}</strong></p>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" className="min-h-11" onClick={onClose}>Abbrechen</Button><Button className="min-h-11" disabled={cost === 0 || state.cash < cost} onClick={confirm}>Übernehmen</Button></div></footer>
  </div>;
}
