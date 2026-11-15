import type { Store } from '@/engine/types';
import { equipmentOf } from '@/engine/equipment';
import { art, equipmentArt } from './sheetArt';
import { CafeSteam, NeonSign } from './VisualEffects';
import cafePhoto from '@/assets/cafe-interior-ci.jpg';

export function CafeCutaway({ store }: { store: Store }) {
  const e = equipmentOf(store);
  const cutArt = (i: number) => art('interior', i).replace('.webp','-grounded.webp');
  const eqArt = (category: 'espresso' | 'grinder' | 'interior', level: number) => equipmentArt(category,level).replace('.webp','-grounded.webp');
  const seats = store.tier === 1 && e.interior === 0 ? 1 : store.tier + e.interior;
  if (store.tier >= 2) return <div className="cafe-photo" aria-label="Café-Innenansicht"><img src={cafePhoto} alt="Isometrischer Café-Innenraum" width={1088} height={1088} loading="lazy" /><div className="cafe-photo-tags"><span>Espresso Stufe {e.espresso + 1}</span><span>Mühle Stufe {e.grinder + 1}</span><span>Einrichtung Stufe {e.interior + 1}</span></div></div>;
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