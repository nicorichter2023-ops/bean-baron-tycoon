import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { CHAIN_MIN, chainGear, chainPrice, chainStaff, chainStage, isExec } from '@/engine/empire';
import { GEAR, GEAR_KEYS } from '@/engine/cafeContent';
import { gearUpgradeCost, storeCafe } from '@/engine/cafe';

/** Chain-wide actions from five stores: every button runs the same per-store upgrade as the café view. */
export function ChainPanel() {
  const { state, perform } = useGame();
  const n = state.stores.length;
  if (n < CHAIN_MIN) return <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">Ketten-Aktionen werden ab {CHAIN_MIN} Filialen freigeschaltet ({n}/{CHAIN_MIN}).</p>;
  const avg = state.stores.reduce((s, x) => s + x.pricePerCup, 0) / n;
  return <div className="space-y-4">
    <section className="cafe-panel-block"><h2 className="cafe-panel-h">Ganze Kette verbessern · {n} Filialen</h2>
      <p className="text-xs text-muted-foreground">Jede Filiale bekommt die nächste mögliche Stufe – genau wie in der Café-Ansicht. 10 % Mengenrabatt.</p>
      <Button className="min-h-11" onClick={() => perform(chainStage)}>Alle Filialen eine Ausbaustufe höher</Button>
      {GEAR_KEYS.map(k => { const total = state.stores.reduce((s, x) => s + (storeCafe(state, x).gear[k] < 4 ? gearUpgradeCost(state, x, k) : 0), 0);
        return <Button key={k} variant="outline" className="h-auto min-h-11 justify-between whitespace-normal py-2" disabled={!total} onClick={() => perform(g => chainGear(g, k))}><span>{GEAR[k].label} für alle</span><strong>{total ? `bis ${eur(total * 0.9)}` : 'max.'}</strong></Button>; })}
    </section>
    <section className="cafe-panel-block"><h2 className="cafe-panel-h">Kettenpreis · Ø {avg.toFixed(2).replace('.', ',')} € pro Tasse</h2>
      <div className="grid grid-cols-2 gap-2"><Button variant="outline" className="min-h-11" onClick={() => perform(g => chainPrice(g, -0.2))}>−0,20 € überall</Button><Button variant="outline" className="min-h-11" onClick={() => perform(g => chainPrice(g, 0.2))}>+0,20 € überall</Button></div>
    </section>
    <section className="cafe-panel-block"><h2 className="cafe-panel-h">Personal</h2>
      <Button variant="outline" className="min-h-11" onClick={() => perform(chainStaff)}>Alle Filialen voll besetzen</Button>
      {isExec(state, 'coo') && <p className="text-xs text-muted-foreground">Dein COO besetzt automatisch nach, wenn „Delegieren“ im HQ aktiv ist.</p>}
    </section>
  </div>;
}

const ROLES = [
  ['coo', 'COO', 'Besetzt Filialen automatisch nach (Delegieren) · +4 % Café-Umsatz durch Effizienz'],
  ['cfo', 'CFO', '−20 % Kreditzins · tilgt Kredite aus Überschuss · entscheidet Startup-Runden'],
  ['cmo', 'CMO', 'Auto-Kampagnen 15 % günstiger · +3 % Café-Umsatz bei laufender Kampagne'],
  ['cto', 'CTO', 'Schnellere Forschung · startet automatisch das nächste Projekt'],
] as const;
export function ExecEffects() {
  const { state } = useGame();
  return <section className="cafe-panel-block mt-4"><h2 className="cafe-panel-h">Wirkung der Führung</h2>
    <ul className="exec-effects">{ROLES.map(([r, l, t]) => <li key={r} data-on={isExec(state, r)}><strong>{l}</strong><span>{t}</span><em>{isExec(state, r) ? 'aktiv' : 'nicht besetzt'}</em></li>)}</ul>
    <p className="text-xs text-muted-foreground">CMO und CTO stellst du unter „Entwicklung → Talente“ ein.</p></section>;
}
