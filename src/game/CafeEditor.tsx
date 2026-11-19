import { useState } from 'react';
import { ChevronLeft, Coffee, Gauge, Armchair, CakeSlice, TreePine, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { DESIGN_MOODS, DESIGN_STYLES, TERRACE_STYLES, GEAR, GEAR_KEYS, gearStageNeed, type GearCategory } from '@/engine/cafeContent';
import { commitEditor, editorCost, editorDraft } from '@/engine/editor';
import { CafeRoom } from './CafeRoom';
import { roomScene, terraceScene } from './roomLayouts';
import { leversOf } from '@/engine/progression';
import { eur, useGame } from './GameContext';

type T = GearCategory | 'design';
const SLOT_ICONS = { espresso: Coffee, grinder: Gauge, seating: Armchair, vitrine: CakeSlice, terrace: TreePine };
/** Live modular preview from a draft; checkout pays once, cancel is free. */
export function CafeEditor({ store, onClose }: { store: Store; onClose: () => void }) {
  const { state, perform } = useGame();
  const saved = editorDraft(state, store);
  const [draft, setDraft] = useState(() => editorDraft(state, store));
  const [tab, setTab] = useState<T>('espresso');
  const stage = leversOf(state, store).stage;
  const cost = editorCost(state, store, draft);
  const mood = DESIGN_STYLES[draft.design.style]?.mood ?? 0;
  const setDesign = (p: Partial<typeof draft.design>) => setDraft(d => ({ ...d, design: { ...d.design, ...p } }));
  const confirm = () => { perform(g => commitEditor(g, store.id, draft)); onClose(); };
  return <div className="cafe-editor" role="dialog" aria-modal="true" aria-label="Café gestalten">
    <header className="cafe-detail-head"><Button variant="ghost" size="icon" aria-label="Zurück ohne Änderungen" onClick={onClose}><ChevronLeft /></Button><div><strong>Café gestalten</strong><small>{store.name}</small></div><span className="w-10" /></header>
    <div className="cafe-editor-preview"><CafeRoom store={store} design={draft.design} gear={draft.gear} view={tab === 'terrace' && draft.gear.terrace > 0 ? 'terrace' : 'room'} /></div>
    <nav className="cafe-editor-tabs" aria-label="Ausbau-Bereiche">{GEAR_KEYS.map(id => { const Icon = SLOT_ICONS[id]; return <Button key={id} variant={tab === id ? 'secondary' : 'ghost'} size="icon" aria-label={GEAR[id].label} title={GEAR[id].label} aria-pressed={tab === id} onClick={() => setTab(id)}><Icon /></Button>; })}<Button variant={tab === 'design' ? 'secondary' : 'ghost'} size="icon" aria-label="Stimmung & Design" title="Stimmung & Design" aria-pressed={tab === 'design'} onClick={() => setTab('design')}><Palette /></Button></nav>
    <div className="cafe-editor-body">
      {tab === 'design' && <>
        <div className="cafe-mood-row" role="radiogroup" aria-label="Grundstimmung">{DESIGN_MOODS.map((m, i) => <Button variant={mood === i ? 'secondary' : 'ghost'} key={m} role="radio" aria-checked={mood === i} onClick={() => setDesign({ style: i * 4 + (draft.design.style % 4) })}>{m}</Button>)}</div>
        <div className="cafe-style-grid">{DESIGN_STYLES.map((d, i) => d.mood !== mood ? null : <Button variant="outline" key={d.id} aria-pressed={draft.design.style === i} onClick={() => setDesign({ style: i })}><img src={roomScene(stage, i)} alt="" width={160} height={120} loading="lazy" /><strong>{d.name}</strong></Button>)}</div>
      </>}
      {tab !== 'design' && <><h2 className="font-semibold">{GEAR[tab].label}</h2><div className="editor-levels">{GEAR[tab].levels.map((label, level) => { const locked = level < saved.gear[tab] || (level > saved.gear[tab] && stage < gearStageNeed(level)); return <Button key={label} variant={draft.gear[tab] === level ? 'secondary' : 'outline'} disabled={locked} aria-pressed={draft.gear[tab] === level} onClick={() => setDraft(d => ({ ...d, gear: { ...d.gear, [tab]: level } }))}><span className="editor-level-number">{level + 1}</span><span>{label}<small>{level < saved.gear[tab] ? 'Bereits ausgebaut' : locked ? `Ab Filialstufe ${gearStageNeed(level)}` : level === saved.gear[tab] ? 'Eingebaut' : `+${(GEAR[tab].bonus * (level - saved.gear[tab]) * (['espresso', 'grinder', 'seating'].includes(tab) ? .5 : 1) * 100).toFixed(1)} % Café-Bonus`}</small></span></Button>; })}</div></>}
      {tab === 'terrace' && draft.gear.terrace > 0 && <div className="cafe-style-grid mt-3">{TERRACE_STYLES.map((t, i) => <Button variant="outline" key={t.name} aria-pressed={draft.design.terrace === i} onClick={() => setDesign({ terrace: i })}><img src={terraceScene(i, mood)} alt="" width={160} height={120} loading="lazy" /><strong>{t.name}</strong></Button>)}</div>}
    </div>
    <footer className="cafe-editor-foot"><p>Änderung: <strong>{eur(cost)}</strong></p>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" className="min-h-11" onClick={onClose}>Abbrechen</Button><Button className="min-h-11" disabled={cost === 0 || state.cash < cost} onClick={confirm}>Übernehmen</Button></div></footer>
  </div>;
}
