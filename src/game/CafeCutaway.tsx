import type { Store } from '@/engine/types';
import { equipmentOf } from '@/engine/equipment';
import { art, equipmentArt } from './sheetArt';
import { CafeSteam, NeonSign } from './VisualEffects';

export function CafeCutaway({ store }: { store: Store }) {
  const e = equipmentOf(store);
  const seats = store.tier === 1 && e.interior === 0 ? 1 : store.tier + e.interior;
  return <div className="cafe-cutaway" data-tier={store.tier} aria-label={`Café-Diorama · ${['','Kiosk','Café','Flagship'][store.tier]}`}>
    <div className="cutaway-street" /><div className="cutaway-floor" /><div className="cutaway-wall wall-back" /><div className="cutaway-wall wall-side" />
    <NeonSign />
    <img className="cutaway-counter" src={art('interior', store.tier === 3 ? 10 : 13)} alt="Theke" />
    <div className="cutaway-machine"><img src={equipmentArt('espresso', e.espresso)} alt={`Espressomaschine Stufe ${e.espresso}`} /><CafeSteam /></div>
    <img className="cutaway-grinder" src={equipmentArt('grinder', e.grinder)} alt={`Mühle Stufe ${e.grinder}`} />
    <img className="cutaway-till" src={art('interior', store.tier > 1 ? 17 : 16)} alt="Kasse" />
    {store.tier > 1 && <img className="cutaway-display" src={art('interior', store.tier === 3 ? 12 : 11)} alt="Vitrine" />}
    {Array.from({ length: Math.min(5, seats) }, (_, i) => <img key={i} className={`cutaway-seat seat-${i}`} src={equipmentArt('interior', e.interior)} alt="Sitzmöbel" />)}
    <img className="cutaway-decor" src={art('interior', e.interior === 2 ? 25 : e.interior === 1 ? 24 : 36)} alt="Dekoration" />
    {store.tier === 3 && <img className="cutaway-menu" src={art('interior',29)} alt="Menütafel" />}
  </div>;
}