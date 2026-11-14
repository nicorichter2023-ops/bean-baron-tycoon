import { useState } from 'react';
import { ArrowUpCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { EQUIPMENT, equipmentEffects, equipmentOf, equipmentUpgradeCost, upgradeEquipment, type EquipmentCategory, type EquipmentLevel } from '@/engine/equipment';
import { equipmentArt } from './sheetArt';
import { eur, useGame } from './GameContext';

const CATEGORIES: [EquipmentCategory, string][] = [['espresso', 'Espressomaschine'], ['grinder', 'Kaffeemühle'], ['interior', 'Interieur & Sitzbereich']];
export function StoreEquipmentPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const [category, setCategory] = useState<EquipmentCategory>('espresso');
  const current = equipmentOf(store);
  const effects = equipmentEffects(store);
  const [selected, setSelected] = useState<EquipmentLevel>(1);
  const options = EQUIPMENT[category];
  const level = Math.min(options.length - 1, Math.max(selected, current[category] + 1)) as EquipmentLevel;
  const cost = equipmentUpgradeCost(store, category, level);
  return <div className="mt-4 border-t border-border pt-4" aria-label={`Ausstattung ${store.name}`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><Wrench className="h-4 w-4" /> Ausstattung</h3><span className="text-xs text-muted-foreground">Anlagenwert {eur(current.bookValue)}</span></div>
    <p className="mt-2 text-xs text-muted-foreground">Zufriedenheitsbonus +{effects.satisfaction} · Verweildauer +{Math.round((effects.dwell - 1) * 100)} %</p>
    <div className="mt-3 grid grid-cols-3 gap-2">{CATEGORIES.map(([c, label]) => <Button key={c} variant={category === c ? 'secondary' : 'ghost'} aria-label={label} aria-pressed={category === c} className="h-auto min-h-11 flex-col gap-1 whitespace-normal px-1 py-2 text-center" onClick={() => { setCategory(c); setSelected(Math.min(current[c] + 1, EQUIPMENT[c].length - 1) as EquipmentLevel); }}>
      <img src={equipmentArt(c, current[c])} alt="" className="h-12 w-12 object-contain" /><span className="text-xs">{label}</span><span className="text-[11px] text-muted-foreground">Stufe {current[c] + 1}</span>
    </Button>)}</div>
    <p className="mt-2 text-xs font-medium">Aktuell: {options[current[category]]?.label}</p>
    <p className="mt-1 text-xs text-muted-foreground">{options[current[category]]?.effect}</p>
    <label className="mt-3 block text-xs text-muted-foreground">Neue Ausstattung
      <select aria-label={`${store.name}: ${CATEGORIES.find(([c]) => c === category)?.[1]}`} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground" value={level} onChange={e => setSelected(Number(e.target.value) as EquipmentLevel)}>
        {options.map((o, i) => <option key={o.label} value={i} disabled={i <= current[category]}>{o.label}</option>)}
      </select>
    </label>
    <div className="mt-3 flex items-center gap-3"><img src={equipmentArt(category, level)} alt={options[level]?.label} className="h-16 w-16 shrink-0 object-contain" /><p className="text-xs text-muted-foreground">{options[level]?.effect}</p></div>
    <Button variant="outline" className="mt-3 min-h-11 w-full" disabled={!cost || state.cash < cost} onClick={() => perform(g => upgradeEquipment(g, store.id, category, level))}><ArrowUpCircle />{cost ? `Ausstattung kaufen · ${eur(cost)}` : 'Maximale Ausstattung erreicht'}</Button>
  </div>;
}