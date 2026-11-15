import type { Store } from '@/engine/types';
import { equipmentOf } from '@/engine/equipment';
import { art, equipmentArt } from './sheetArt';
import { CafeSteam, NeonSign } from './VisualEffects';
import cafePhoto from '@/assets/cafe-interior-ci.jpg';
import kioskPhoto from '@/assets/cafe-interior-kiosk.jpg';
import bistroPhoto from '@/assets/cafe-interior-bistro.jpg';
import flagshipPhoto from '@/assets/cafe-interior-flagship.jpg';
import cartPhoto from '@/assets/cafe-interior-cart.jpg';
import barPhoto from '@/assets/cafe-interior-espressobar.jpg';
import roasteryPhoto from '@/assets/cafe-interior-roastery.jpg';
import { useGame } from './GameContext';
import { CafeRoom } from './CafeRoom';
import { leversOf } from '@/engine/progression';
import { stg } from '@/engine/unlocks';
import { gearArt, sheet16 } from './sheetArt';
import { storeCafe } from '@/engine/cafe';
import { DECOR, GEAR, GEAR_KEYS, WALL_TINT } from '@/engine/cafeContent';

const STAGE_PHOTOS = [cartPhoto, kioskPhoto, barPhoto, cafePhoto, bistroPhoto, roasteryPhoto, flagshipPhoto];
/** Each of the 7 stages has its own interior; interior upgrades lift the look one step within the same tier. */
export function stageInteriorVariant(stage: number, interior: number) {
  const s = Math.max(1, Math.min(7, stage));
  const shown = interior >= 2 && (s === 4 || s === 5) ? s + 1 : interior >= 1 && s === 3 ? 4 : s;
  return { src: STAGE_PHOTOS[shown - 1], label: stg(s - 1).label };
}

const ESPRESSO = ['Standard-Maschine','Multi-Boiler Commercial','High-End Handcraft'];
const GRINDER = ['Standard-Mühle','Präzisions-Mahlwerk'];
const INTERIOR = ['Basis-Einrichtung','Bistro','Lounge'];

/** Picks the interior artwork from persisted tier + interior level only. */
export function cafeInteriorVariant(tier: number, interior: number) {
  if (tier >= 3 || interior >= 2) return { src: flagshipPhoto, label: 'Flagship-Lounge' };
  if (tier === 1) return { src: kioskPhoto, label: 'Eck-Kiosk' };
  if (interior === 1) return { src: bistroPhoto, label: 'Bistro-Café' };
  return { src: cafePhoto, label: 'Kiez-Café' };
}

export function CafeCutaway({ store }: { store: Store }) {
  const e = equipmentOf(store);
  const cutArt = (i: number) => art('interior', i).replace('.webp','-grounded.webp');
  const eqArt = (category: 'espresso' | 'grinder' | 'interior', level: number) => equipmentArt(category,level).replace('.webp','-grounded.webp');
  const seats = store.tier === 1 && e.interior === 0 ? 1 : store.tier + e.interior;
  const { state } = useGame();
  const stage = leversOf(state, store).stage;
  const v = stageInteriorVariant(stage, e.interior);
  const sc = storeCafe(state, store);
  const parts: [string, string, number][] = GEAR_KEYS.filter(c => c !== 'terrace' || sc.gear.terrace > 0).map(c => [gearArt(c, sc.gear[c]), GEAR[c].levels[sc.gear[c]] ?? '', sc.gear[c]]);
  const deco = (slot: 'light' | 'art' | 'sign' | 'plant' | 'extra') => { const i = sc.decor[slot]; const o = i === undefined ? undefined : DECOR[slot].options[i]; return o ? <img className={`d-${slot}`} src={sheet16(DECOR[slot].sheet, o.art)} alt={o.name} loading="lazy" /> : null; };
  const wall = sc.decor.wall;
  if (v) return <CafeRoom store={store} />;
    <div className="cafe-decor-layer" aria-label="Eigene Gestaltung">{wall !== undefined && <span className="cafe-decor-tint" style={{ background: WALL_TINT[wall] }} />}{deco('light')}{deco('art')}{deco('sign')}{deco('plant')}{deco('extra')}</div>
    <span className="cafe-photo-title">{v.label} · Stufe {stage}/7</span><div className="cafe-loadout" aria-label="Sichtbare Ausstattung">{parts.map(([src, label, lvl], i) => <figure key={i} data-lvl={Math.min(2, lvl)}><img src={src} alt="" width={44} height={44} loading="lazy" /><figcaption>{label}</figcaption></figure>)}</div></div>;
  return <div className="cafe-cutaway" data-tier={store.tier} aria-label={`Café-Diorama · ${['','Kiosk','Café','Flagship'][store.tier]}`}>
    <div className="cutaway-street" /><div className="cutaway-floor" /><div className="cutaway-wall wall-back" /><div className="cutaway-wall wall-side" />
    <NeonSign />
    <img className="cutaway-counter" src={cutArt(store.tier === 3 ? 10 : 13)} alt="Theke" />
    <div className="cutaway-machine"><img src={eqArt('espresso', e.espresso)} alt={`Espressomaschine Stufe ${e.espresso}`} /><CafeSteam /></div>
    <img className="cutaway-grinder" src={eqArt('grinder', e.grinder)} alt={`Mühle Stufe ${e.grinder}`} />
    <img className="cutaway-till" src={cutArt(store.tier > 1 ? 17 : 16)} alt="Kasse" />
    {store.tier > 1 && <img className="cutaway-display" src={cutArt(store.tier === 3 ? 12 : 11)} alt="Vitrine" />}
    {Array.from({ length: Math.min(5, seats) }, (_, i) => <img key={i} className={`cutaway-seat seat-${i}`} src={eqArt('interior', e.interior)} alt="Sitzmöbel" />)}
    <img className="cutaway-decor" src={cutArt(e.interior === 2 ? 25 : e.interior === 1 ? 24 : 36)} alt="Dekoration" />
    {store.tier === 3 && <img className="cutaway-menu" src={cutArt(29)} alt="Menütafel" />}
  </div>;
}