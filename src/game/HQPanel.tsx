import { Building2, BriefcaseBusiness, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createManagement, EXECUTIVES, financialForecast, hasExecutive, hireExecutive, releaseExecutive } from '@/engine/management';
import { eur, useGame } from './GameContext';
import { SCENES } from './sceneAssets';

export function HQPanel() {
  const { state, set, setBoth } = useGame();
  const forecast = financialForecast(state);
  const latest = state.management?.history.at(-1);
  return <section>
    <div className="scene-heading"><div><p className="eyebrow">Coffee Empire · Konzern</p><h1>Headquarters</h1></div><Building2 className="h-8 w-8 text-primary" /></div>
    <img src={SCENES.office.url} alt="Isometrisches Coffee Empire Hauptquartier" className="hq-scene" />
    <div className="scene-metrics"><div><span>Filialen</span><strong>{state.stores.length}</strong></div><div><span>HQ-Gehälter / Woche</span><strong>{eur(state.management?.executives.reduce((n, e) => n + EXECUTIVES[e.role].salary, 0) ?? 0)}</strong></div><div><span>C-Level</span><strong>{state.management?.executives.length ?? 0} / 2</strong></div></div>
    <h2 className="my-4 font-display text-lg font-bold">Konzernleitung</h2>
    <div className="grid gap-3 md:grid-cols-2">{(['coo', 'cfo'] as const).map(role => {
      const c = EXECUTIVES[role], hired = hasExecutive(state, role);
      return <article key={role} className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3"><BriefcaseBusiness className="h-8 w-8 shrink-0 text-primary" /><div><h3 className="font-display text-lg font-bold">{role.toUpperCase()} · {c.name}</h3><p className="text-xs text-muted-foreground">{c.title}</p></div></div>
        <p className="my-3 text-sm">{role === 'coo' ? 'Delegation: ergänzt Baristas bis zur Sollbesetzung jeder Filiale und aktiviert den automatischen Bohnennachkauf in deiner Rösterei. Personal wird regulär bezahlt; keine automatischen Ausbauten.' : 'Senkt den effektiven Kreditzins um 20 % und liefert eine Vier-Wochen-Liquiditätsprognose. Bestehende und neue Kredite profitieren, solange der CFO angestellt ist.'}</p>
        <dl className="financial-ledger text-xs"><div><dt>Einmalige Einstellung</dt><dd>{eur(c.fee)}</dd></div><div><dt>Gehalt pro Woche</dt><dd>{eur(c.salary)}</dd></div></dl>
        <Button className="mt-3 w-full" variant={hired ? 'outline' : 'default'} disabled={!hired && state.cash < c.fee} onClick={() => setBoth((game, exp) => { const result = hired ? releaseExecutive(game, role) : hireExecutive(game, role); return typeof result === 'string' ? result : { game: result, exp }; })}>{hired ? <UserMinus /> : <UserPlus />}{hired ? `${role.toUpperCase()} entlassen` : `${role.toUpperCase()} einstellen`}</Button>
        {hired && role === 'coo' && <div className="mt-4 flex items-center justify-between gap-3"><label htmlFor="coo-delegation" className="text-sm">Filialbetrieb delegieren</label><Switch id="coo-delegation" checked={state.management?.delegation ?? false} onCheckedChange={delegation => set(game => ({ ...game, management: { ...(game.management ?? createManagement(game.cash)), delegation } }))} /></div>}
        {hired && role === 'coo' && latest && <p className="mt-3 text-xs text-muted-foreground">Letzte Woche: {latest.cooHires} Baristas eingestellt.</p>}
      </article>;
    })}</div>
    {hasExecutive(state, 'cfo') && <section className="mt-6 border-t border-border pt-4"><h2 className="font-display text-lg font-bold">CFO · Liquiditätsausblick</h2><dl className="financial-ledger"><div><dt>Operativer Cashflow / Woche</dt><dd>{eur(forecast.weekly)}</dd></div><div><dt>Barvermögen in 4 Wochen</dt><dd>{eur(forecast.cashInFourWeeks)}</dd></div><div><dt>Zinsen nächste Woche</dt><dd>{eur(forecast.interest)}</dd></div><div><dt>Zinsersparnis letzte Woche</dt><dd>{eur(latest?.interestSaved ?? 0)}</dd></div></dl><p className="mt-3 text-xs text-muted-foreground">{latest ? 'Fortschreibung der letzten Woche ohne einmalige Ausgaben. Keine Zusage: Nachfrage, Ereignisse und neue Investitionen können abweichen.' : 'Vorläufig: berücksichtigt bisher nur HQ-Gehälter. Der erste Wochenabschluss liefert die operative Basis.'}</p></section>}
  </section>;
}