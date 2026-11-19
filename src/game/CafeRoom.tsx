import type { Store } from '@/engine/types';
import type { GearCategory } from '@/engine/cafeContent';
import { useGame } from './GameContext';
import { leversOf } from '@/engine/progression';
import { stg } from '@/engine/unlocks';
import { designOf, storeCafe, type CafeDesign } from '@/engine/cafe';
import { DESIGN_MOODS, DESIGN_STYLES, TERRACE_STYLES } from '@/engine/cafeContent';
import { roomScene, terraceScene } from './roomLayouts';

export type CafeGear = Record<GearCategory, number>;

/** One complete painted scene per stage group and design style; an unpaid editor draft previews its design. */
export function CafeRoom({ store, design, view = 'room' }: { store: Store; design?: CafeDesign; gear?: CafeGear; view?: 'room' | 'terrace' }) {
  const { state } = useGame();
  const stage = leversOf(state, store).stage;
  const d = design ?? designOf(storeCafe(state, store));
  const src = view === 'terrace' ? terraceScene(d.terrace, DESIGN_STYLES[d.style]?.mood) : roomScene(stage, d.style);
  const label = view === 'terrace' ? `Terrasse · ${TERRACE_STYLES[d.terrace]?.name}` : `${stg(stage - 1).label} · ${DESIGN_MOODS[DESIGN_STYLES[d.style]?.mood ?? 0]} · ${DESIGN_STYLES[d.style]?.name}`;
  return <div className="cafe-room cafe-room-scene" data-stage={stage} data-view={view} aria-label={`${store.name} · ${label}`}>
    <div className="cafe-scene-canvas"><img className="room-base" src={src} alt={label} width={1024} height={768} /></div>
    <span className="cafe-photo-title">{view === 'terrace' ? label : `${label} · Stufe ${stage}/7`}</span>
  </div>;
}
