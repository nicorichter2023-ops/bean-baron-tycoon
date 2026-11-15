import { Button } from '@/components/ui/button';
import type { Store } from '@/engine/types';
import { useGame, eur } from './GameContext';
import { leverEffect, leversOf, setLever, stageUpgrade, progressOf, signBeanContract, type Hours, type Specialization } from '@/engine/progression';
import { STAGES, leverUnlocked, maxStage, tierOfStage, RANKS, LEVER_RANK, type LeverId } from '@/engine/unlocks';
import { GAME_CONFIG } from '@/engine/engine';
import { stageArt } from './sheetArt';

const Lock = ({ id }: { id: LeverId }) => <p className="text-xs text-muted-foreground">🔒 Ab Rang „{RANKS[LEVER_RANK[id] - 1].name}“</p>;
export function StoreLeversPanel({ store }: { store: Store }) {
  const { state, perform } = useGame();
  const l = leversOf(state, store), next = l.stage < 7 ? STAGES[l.stage] : null;
  const crossesTier = next && tierOfStage(l.stage + 1) > store.tier;
  const nextCost = next ? (crossesTier ? GAME_CONFIG.STORE_UPGRADE_COST[(store.tier + 1) as 2 | 3] : next.cost) : 0;
  const fx = leverEffect(l, store, state.week);
  const opt = <T extends string | number | boolean>(lever: 'hours' | 'focus' | 'specialization' | 'loyalty', items: [T, string][], cur: T) =>
    <div className="flex flex-wrap gap-1">{items.map(([v, label]) => <Button key={String(v)} size="sm" variant={cur === v ? 'secondary' : 'ghost'} aria-pressed={cur === v} onClick={() => perform(g => setLever(g, store.id, lever, v as never))}>{label}</Button>)}</div>;
  const contract = progressOf(state).beanContract;
  return <div className="grid gap-3 text-sm">
    <div className="flex items-center gap-3"><img src={stageArt(l.stage)} alt="" width={64} height={64} className="h-16 w-16 rounded-lg object-cover" />
      <div className="flex-1"><p className="text-xs text-muted-foreground">Ausbaustufe {l.stage}/7</p><strong>{STAGES[l.stage - 1].label}</strong>
        <div className="mt-1 flex gap-0.5" aria-hidden>{STAGES.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded ${i < l.stage ? 'bg-primary' : 'bg-muted'}`} />)}</div></div></div>
    {next && <Button className="h-12" disabled={l.stage + 1 > maxStage(state) || state.cash < nextCost} onClick={() => perform(g => stageUpgrade(g, store.id))}>
      {l.stage + 1 > maxStage(state) ? `🔒 ${next.label} – höherer Rang nötig` : `Ausbauen zu ${next.label} · ${eur(nextCost)}`}</Button>}
    <p className="text-xs text-muted-foreground">Wirkung diese Einstellung: {fx.revenue >= 0 ? '+' : ''}{eur(fx.revenue)} Umsatz · −{eur(fx.cost)} Kosten · Ruf {fx.reputation >= 0 ? '+' : ''}{fx.reputation.toFixed(2)}/Woche</p>
    <div><p className="mb-1 font-semibold">Öffnungszeiten</p>{leverUnlocked(state, 'hours') ? opt<Hours>('hours', [['early', 'Früh +8 %'], ['standard', 'Standard'], ['late', 'Spät +12 %']], l.hours) : <Lock id="hours" />}</div>
    <div><p className="mb-1 font-semibold">Qualität oder Menge</p>{leverUnlocked(state, 'focus') ? opt<number>('focus', [[1, 'Qualität (Ruf ↑)'], [0, 'Ausgewogen'], [-1, 'Menge (Umsatz ↑)']], l.focus) : <Lock id="focus" />}</div>
    <div><p className="mb-1 font-semibold">Spezialisierung</p>{!leverUnlocked(state, 'specialization') ? <Lock id="specialization" /> : l.stage < 4 ? <p className="text-xs text-muted-foreground">Ab Ausbaustufe „Kiez-Café“</p> :
      opt<Specialization>('specialization', [['none', 'Keine'], ['business', 'Business'], ['students', 'Studenten'], ['tourists', 'Touristen'], ['connoisseur', 'Kenner']], l.specialization)}</div>
    <div><p className="mb-1 font-semibold">Treueprogramm</p>{leverUnlocked(state, 'loyalty') ? <>{opt<boolean>('loyalty', [[false, 'Aus'], [true, 'An']], l.loyalty)}<p className="text-xs text-muted-foreground">Kostet 4 % Umsatz, Stammgäste bringen bis +15 % ({l.loyaltyWeeks} Wochen aktiv).</p></> : <Lock id="loyalty" />}</div>
    <div><p className="mb-1 font-semibold">Bohnen-Festpreis (alle Filialen)</p>{leverUnlocked(state, 'beanContract') ? (contract && contract.untilWeek > state.week ? <p>Gesichert: {contract.price.toFixed(2)} €/kg bis Woche {contract.untilWeek}</p> : <Button size="sm" onClick={() => perform(signBeanContract)}>12 Wochen zum Tagespreis {state.market.futuresPricePerKg.toFixed(2)} €/kg sichern</Button>) : <Lock id="beanContract" />}</div>
  </div>;
}
