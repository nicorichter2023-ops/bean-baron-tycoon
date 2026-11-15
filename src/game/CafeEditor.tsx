import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { applyDesign, designCost, designOf, hasTerrace, storeCafe, type CafeDesign } from '@/engine/cafe';
import { DESIGN_MOODS, DESIGN_STYLES, TERRACE_SHARE, TERRACE_STYLES } from '@/engine/cafeContent';
import { CafeRoom } from './CafeRoom';
import { roomScene, terraceScene } from './roomLayouts';
import { leversOf } from '@/engine/progression';
import { eur, useGame } from './GameContext';

type T = 'design' | 'terrace';
/** Café editor: live preview of the complete scene from a draft; pays once on confirm, cancel is free. */
export function CafeEditor({ store, onClose }: { store: Store; onClose: () => void }) {
  const { state, perform } = useGame();
  const saved = designOf(storeCafe(state, store));
  const [draft, setDraft] = useState<CafeDesign>(saved);
  const terrace = hasTerrace(state, store);
  const [tab, setTab] = useState<T>('design');
  const stage = leversOf(state, store).stage;
  const cost = designCost(state, store, draft);
  const mood = DESIGN_STYLES[draft.style]?.mood ?? 0;
  const tabs: [T, string][] = [['design', 'Stimmung & Design'], ...(terrace ? [['terrace', 'Terrasse'] as [T, string]] : [])];
  const set = (p: Partial<CafeDesign>) => setDraft(d => ({ ...d, ...p }));
  const confirm = () => { perform(g => applyDesign(g, store.id, draft)); onClose(); };
  return <div className="cafe-editor" role="dialog" aria-modal="true" aria-label="Café gestalten">
    <header className="cafe-detail-head"><Button variant="ghost" size="icon" aria-label="Zurück ohne Änderungen" onClick={onClose}><ChevronLeft /></Button><div><strong>Café gestalten</strong><small>{store.name}</small></div><span className="w-10" /></header>
    <div className="cafe-editor-preview"><CafeRoom store={store} design={draft} view={tab === 'terrace' ? 'terrace' : 'room'} /></div>
    <nav className="cafe-editor-tabs">{tabs.map(([id, l]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{l}</button>)}</nav>
    <div className="cafe-editor-body">
      {tab === 'design' && <>
        <div className="cafe-mood-row" role="radiogroup" aria-label="Grundstimmung">{DESIGN_MOODS.map((m, i) => <button key={m} role="radio" aria-checked={mood === i} onClick={() => set({ style: i * 4 + (draft.style % 4) })}>{m}</button>)}</div>
        <div className="cafe-style-grid">{DESIGN_STYLES.map((d, i) => d.mood !== mood ? null : <button key={d.id} aria-pressed={draft.style === i} onClick={() => set({ style: i })}><img src={roomScene(stage, i)} alt="" width={160} height={120} loading="lazy" /><strong>{d.name}</strong><small>Sitze: {d.seats}</small><small>Theke: {d.counter}</small><small>Farben: {d.colors}</small></button>)}</div>
      </>}
      {tab === 'terrace' && terrace && <><div className="cafe-style-grid">{TERRACE_STYLES.map((t, i) => <button key={t.name} aria-pressed={draft.terrace === i} onClick={() => set({ terrace: i })}><img src={terraceScene(i)} alt="" width={160} height={120} loading="lazy" /><strong>{t.name}</strong><small>+{Math.round(t.bonus * 100)} % Terrassenumsatz</small></button>)}</div>
        <p className="mt-2 text-xs text-muted-foreground">Der Bonus gilt nur für den Terrassenanteil (etwa {Math.round(TERRACE_SHARE * 100)} % des Umsatzes).</p></>}
      {!terrace && <p className="mt-2 text-xs text-muted-foreground">Terrasse: erst unter „Ausstattung“ kaufen, dann hier gestalten.</p>}
    </div>
    <footer className="cafe-editor-foot"><p>Änderung: <strong>{eur(cost)}</strong></p>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" className="min-h-11" onClick={onClose}>Abbrechen</Button><Button className="min-h-11" disabled={cost === 0 || state.cash < cost} onClick={confirm}>Übernehmen</Button></div></footer>
  </div>;
}
