import type { Store } from '@/engine/types';
import { useGame } from './GameContext';
import { leversOf } from '@/engine/progression';
import { stg } from '@/engine/unlocks';
import { designOf, storeCafe, type CafeDesign } from '@/engine/cafe';
import { DESIGN_MOODS, DESIGN_STYLES, TERRACE_STYLES } from '@/engine/cafeContent';
import { roomScene, terraceScene, sceneGroup } from './roomLayouts';
import { modularFoundation, modularGearArt, type CafeGear } from './modularCafeArt';
import { sheet16 } from './sheetArt';
import { useState } from 'react';

/** Fixed painted anchors; saved equipment or an unpaid editor draft drives every part. */
export function CafeRoom({ store, design, gear, view = 'room' }: { store: Store; design?: CafeDesign; gear?: CafeGear; view?: 'room' | 'terrace' }) {
  const { state } = useGame();
  const [failed, setFailed] = useState(false);
  const stage = leversOf(state, store).stage;
  const cafe = storeCafe(state, store);
  const d = design ?? designOf(cafe);
  const levels = gear ?? cafe.gear;
  const foundation = modularFoundation(sceneGroup(stage));
  const modular = false; void foundation; void failed;
  const src = modular ? foundation : view === 'terrace' ? terraceScene(d.terrace, DESIGN_STYLES[d.style]?.mood) : roomScene(stage, d.style);
  const label = view === 'terrace' ? `Terrasse · ${TERRACE_STYLES[d.terrace]?.name}` : `${stg(stage - 1).label} · ${DESIGN_MOODS[DESIGN_STYLES[d.style]?.mood ?? 0]} · ${DESIGN_STYLES[d.style]?.name}`;
  return <div className={`cafe-room cafe-room-scene ${modular ? 'cafe-modular' : ''}`} data-stage={stage} data-view={view} aria-label={`${store.name} · ${label}`}>
    <div className="cafe-scene-canvas">
    <img className="room-base" src={src} alt={label} width={1024} height={768} onError={() => setFailed(true)} />
    {modular && <>
      <img className="cafe-part cafe-part-art" src={sheet16('decor-b', 5 + d.style)} alt="" />
      {(['espresso', 'grinder', 'vitrine', 'seating'] as const).map(category => <img key={`${category}-${levels[category]}`} className={`cafe-part cafe-part-${category}`} src={modularGearArt(category, levels[category])} data-level={levels[category]} alt={category === 'espresso' ? 'Espressomaschine' : category === 'grinder' ? 'Kaffeemühle' : category === 'vitrine' ? 'Vitrine' : 'Sitzbereich mit Gästen'} />)}
      {levels.terrace > 0 && <img className="cafe-part cafe-part-terrace" src={modularGearArt('terrace', levels.terrace)} data-level={levels.terrace} alt="Terrasse mit Gästen" />}
    </>}
    </div>
    <span className="cafe-photo-title">{view === 'terrace' ? label : `${label} · Stufe ${stage}/7`}</span>
  </div>;
}
