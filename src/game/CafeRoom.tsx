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
import { roomLayout } from './roomLayouts';

/** Light colour washes per light option (Edison, Spots, Neon, Kronleuchter). */
const LIGHT = ['oklch(0.85 0.12 75 / .35)', 'oklch(0.97 0.02 240 / .25)', 'oklch(0.7 0.25 340 / .3)', 'oklch(0.88 0.1 90 / .4)'];
const FLOOR = ['floor-oak', 'floor-checker', 'floor-concrete', 'floor-marble'];

/** Modular layered café: every layer is derived from persisted stage, gear and decor – painted base room per stage, editor layers tint wall/floor and place gear on the real counter. */
export function CafeRoom({ store }: { store: Store }) {
  const { state } = useGame();
  const stage = leversOf(state, store).stage;
  const sc = storeCafe(state, store);
  const g = sc.gear, d = sc.decor;
  const wall = d.wall ?? 0;
  const deco = (slot: 'art' | 'plant' | 'extra' | 'sign') => { const i = d[slot]; const o = i === undefined ? undefined : DECOR[slot].options[i]; return o ? <img className={`room-${slot}`} src={DECOR[slot].sheet === 'decor-b' ? cutout(sheet16('decor-b', o.art)) : sheet16(DECOR[slot].sheet, o.art)} alt={o.name} /> : null; };
  const L = roomLayout(stage);
  const tables = Math.min(L.seats, Math.max(0, g.seating + Math.floor(stage / 3)));
  const box = (b: [number, number, number, number]) => ({ left: `${b[0]}%`, top: `${b[1]}%`, width: `${b[2]}%`, height: `${b[3]}%` });
  const cw = L.counter[1] - L.counter[0];
  const on = (pos: number, w: number, s: number) => ({ left: `${L.counter[0] + cw * pos}%`, bottom: `${100 - L.counterTop - 1}%`, width: `${w * s}%` });
  return <div className="cafe-room cafe-room-painted" data-stage={stage} data-wall={wall} aria-label={`Café ${store.name} · ${stg(stage - 1).label}`}>
    <img className="room-base" src={L.src} alt="" width={1024} height={768} />
    {d.wall !== undefined && <div className="room-tint" style={{ ...box(L.wall), background: WALL_TINT[wall] }} data-brick={wall === 4} />}
    {L.floor && d.floor !== undefined && <div className={`room-floor-tint ${FLOOR[d.floor]}`} style={box(L.floor)} />}
    {deco('art')}{deco('sign')}
    {g.terrace > 0 && <img className="room-terrace" src={gearArt('terrace', g.terrace)} alt={GEAR.terrace.levels[g.terrace]} />}
    <div className="room-on" style={on(0.6, 26, 0.8 + g.espresso * 0.12)}><img src={gearArt('espresso', g.espresso)} alt={GEAR.espresso.levels[g.espresso]} /><CafeSteam /></div>
    <img className="room-on" style={on(0.42, 14, 0.8 + g.grinder * 0.1)} src={gearArt('grinder', g.grinder)} alt={GEAR.grinder.levels[g.grinder]} />
    {g.vitrine > 0 && <img className="room-on" style={on(0.05, 28, 0.8 + g.vitrine * 0.08)} src={gearArt('vitrine', g.vitrine)} alt={GEAR.vitrine.levels[g.vitrine]} />}
    {tables > 0 && <div className="room-tables">{Array.from({ length: tables }, (_, i) => <img key={i} src={gearArt('seating', g.seating)} alt={i === 0 ? GEAR.seating.levels[g.seating] : ''} />)}</div>}
    {deco('plant')}{deco('extra')}
    {d.light !== undefined && <div className="room-light" style={{ background: `radial-gradient(ellipse at 50% 0%, ${LIGHT[d.light]}, transparent 70%)` }} />}
    <span className="cafe-photo-title">{stg(stage - 1).label} · Stufe {stage}/7</span>
  </div>;
}
