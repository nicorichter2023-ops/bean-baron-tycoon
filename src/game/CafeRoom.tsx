import type { Store } from '@/engine/types';
import { useGame } from './GameContext';
import { leversOf } from '@/engine/progression';
import { stg } from '@/engine/unlocks';
import { designOf, storeCafe, type CafeDesign } from '@/engine/cafe';
import { DESIGN_MOODS, DESIGN_STYLES, TERRACE_STYLES } from '@/engine/cafeContent';
import { roomScene, terraceScene } from './roomLayouts';

/** One complete painted scene per store group and look; no colour filters, so every combination stays coherent. */
export function CafeRoom({ store, design, view = 'room' }: { store: Store; design?: CafeDesign; view?: 'room' | 'terrace' }) {
  const { state } = useGame();
  const stage = leversOf(state, store).stage;
  const d = design ?? designOf(storeCafe(state, store));
  const src = view === 'terrace' ? terraceScene(d.terrace, DESIGN_STYLES[d.style]?.mood) : roomScene(stage, d.style);
  const label = view === 'terrace' ? `Terrasse · ${TERRACE_STYLES[d.terrace]?.name}` : `${stg(stage - 1).label} · ${DESIGN_MOODS[DESIGN_STYLES[d.style]?.mood ?? 0]} · ${DESIGN_STYLES[d.style]?.name}`;
  return <div className="cafe-room cafe-room-scene" data-stage={stage} aria-label={`${store.name} · ${label}`}>
    <img className="room-base" src={src} alt={label} width={1024} height={768} />
    <span className="cafe-photo-title">{view === 'terrace' ? label : `${label} · Stufe ${stage}/7`}</span>
  </div>;
}
