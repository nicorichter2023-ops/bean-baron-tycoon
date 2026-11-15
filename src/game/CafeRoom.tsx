import type { Store } from '@/engine/types';
import { useGame } from './GameContext';
import { leversOf } from '@/engine/progression';
import { stg } from '@/engine/unlocks';
import { storeCafe } from '@/engine/cafe';
import { DECOR, GEAR, WALL_TINT } from '@/engine/cafeContent';
import { gearArt as rawGear, sheet16 } from './sheetArt';
const cutout = (src: string) => src.replace(/\.webp$/, '-cut.webp');
const gearArt = (c: string, l: number) => cutout(rawGear(c, l));
import { CafeSteam } from './VisualEffects';

/** Light colour washes per light option (Edison, Spots, Neon, Kronleuchter). */
const LIGHT = ['oklch(0.85 0.12 75 / .35)', 'oklch(0.97 0.02 240 / .25)', 'oklch(0.7 0.25 340 / .3)', 'oklch(0.88 0.1 90 / .4)'];
const FLOOR = ['floor-oak', 'floor-checker', 'floor-concrete', 'floor-marble'];

/** Modular layered café: every layer is derived from persisted stage, gear and decor – nothing is a static photo. */
export function CafeRoom({ store }: { store: Store }) {
  const { state } = useGame();
  const stage = leversOf(state, store).stage;
  const sc = storeCafe(state, store);
  const g = sc.gear, d = sc.decor;
  const wall = d.wall ?? 0;
  const deco = (slot: 'art' | 'plant' | 'extra' | 'sign') => { const i = d[slot]; const o = i === undefined ? undefined : DECOR[slot].options[i]; return o ? <img className={`room-${slot}`} src={DECOR[slot].sheet === 'decor-b' ? cutout(sheet16('decor-b', o.art)) : sheet16(DECOR[slot].sheet, o.art)} alt={o.name} /> : null; };
  const tables = Math.min(6, 1 + g.seating + Math.floor(stage / 3));
  return <div className="cafe-room" data-stage={stage} data-wall={wall} aria-label={`Café ${store.name} · ${stg(stage - 1).label}`}>
    <div className="room-wall" style={{ background: WALL_TINT[wall] }} data-brick={wall === 4} />
    <div className={`room-floor ${FLOOR[d.floor ?? 0]}`} />
    <div className="room-window" data-terrace={g.terrace}>{g.terrace > 0 && <img src={gearArt('terrace', g.terrace)} alt={GEAR.terrace.levels[g.terrace]} />}</div>
    {deco('art')}{deco('sign')}{deco('extra')}{deco('plant')}
    <div className="room-counter" data-lvl={Math.min(7, stage)} style={{ width: `${38 + stage * 5}%` }}>
      <div className="room-machine" style={{ ['--s' as string]: 0.8 + g.espresso * 0.12 }}><img src={gearArt('espresso', g.espresso)} alt={GEAR.espresso.levels[g.espresso]} /><CafeSteam /></div>
      <img className="room-grinder" style={{ ['--s' as string]: 0.8 + g.grinder * 0.1 }} src={gearArt('grinder', g.grinder)} alt={GEAR.grinder.levels[g.grinder]} />
      {g.vitrine > 0 && <img className="room-vitrine" style={{ ['--s' as string]: 0.8 + g.vitrine * 0.1 }} src={gearArt('vitrine', g.vitrine)} alt={GEAR.vitrine.levels[g.vitrine]} />}
    </div>
    <div className="room-seating">{Array.from({ length: tables }, (_, i) => <img key={i} src={gearArt('seating', g.seating)} alt={i === 0 ? GEAR.seating.levels[g.seating] : ''} />)}</div>
    {d.light !== undefined && <div className="room-light" style={{ background: `radial-gradient(ellipse at 50% 0%, ${LIGHT[d.light]}, transparent 70%)` }} />}
    <span className="cafe-photo-title">{stg(stage - 1).label} · Stufe {stage}/7</span>
  </div>;
}
