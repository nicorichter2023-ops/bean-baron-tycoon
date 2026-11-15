import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { HubHeader } from './HubHeader';
import { SUPPLY, SUPPLY_KEYS, SUPPLY_MAX, empireOf, plantationCount, supplyCost, supplyReady, supplyWeekly, upgradeSupply } from '@/engine/empire';
import { purchaseRoastery, GAME_CONFIG } from '@/engine/engine';

export function SupplyPanel() {
  const { state, perform } = useGame();
  const e = empireOf(state), w = supplyWeekly(state), farms = plantationCount(state);
  return <div className="space-y-4">
    <HubHeader art="supply" eyebrow="Lieferkette" title="Rösterei & Plantagen"><p className="text-xs text-muted-foreground">Eigene Röstung spart schon 20 % Bohnenkosten. Upgrades senken Kosten weiter und bringen Zusatzerlöse.</p></HubHeader>
    <p className="text-sm text-muted-foreground">Ausstoßkapazität {Math.round(state.roastery.capacityKgPerWeek * 2 ** e.supply.roaster)} kg/Wo · Röstverlust {state.roastery.roastLossPercent} %</p><dl className="cafe-kpis"><div><dt>Bohnen gespart</dt><dd>{Math.round(w.saveRate * 100)} %</dd></div><div><dt>Wirkung / Woche</dt><dd>{eur(w.total)}</dd></div><div><dt>Plantagen</dt><dd>{farms}</dd></div></dl>
    {!state.roastery.owned && <Button disabled={!state.unlockedModules.includes('roastery') || state.cash < GAME_CONFIG.ROASTERY_COST} onClick={() => perform(purchaseRoastery)}>Rösterei kaufen · {eur(GAME_CONFIG.ROASTERY_COST)}</Button>}
    {(['roastery', 'farm'] as const).map(group => <section key={group} className="cafe-panel-block"><h2 className="cafe-panel-h">{group === 'roastery' ? `Rösterei ${state.roastery.owned ? '· in Betrieb' : '· noch nicht gekauft'}` : `Plantagen ${farms ? `· ${farms} in Besitz` : '· keine (Supply → Fincas)'}`}</h2>
      {SUPPLY_KEYS.filter(k => SUPPLY[k].group === group).map(k => { const lvl = e.supply[k], ready = supplyReady(state, k), cost = supplyCost(k, lvl);
        return <article key={k} className="supply-row"><div><strong>{SUPPLY[k].label}</strong><small>{SUPPLY[k].levels[lvl]} · Stufe {lvl}/{SUPPLY_MAX}</small><small className="text-muted-foreground">{SUPPLY[k].effect}</small><span className="supply-pips" aria-hidden>{Array.from({ length: SUPPLY_MAX }, (_, i) => <i key={i} data-on={i < lvl} />)}</span></div>
          {lvl >= SUPPLY_MAX ? <span className="cafe-done">✓</span> : <Button size="sm" className="min-h-11" disabled={!ready || state.cash < cost} onClick={() => perform(g => upgradeSupply(g, k))}>{SUPPLY[k].levels[lvl + 1]} · {eur(cost)}</Button>}</article>; })}
    </section>)}
  </div>;
}
