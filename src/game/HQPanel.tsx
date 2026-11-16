import { Megaphone, UserMinus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { createManagement, EXECUTIVES, financialForecast, hasExecutive, releaseExecutive } from '@/engine/management';
import { eur, useGame } from './GameContext';
import { HubHeader } from './HubHeader';
import { EXEC_ROLES, JOB_POSTINGS, hireApplicant, postJob, roleTaken } from '@/engine/recruiting';
import { candidateOf, dismissCandidate, type Candidate } from '@/engine/world';

export function HQPanel() {
  const { state, set, setBoth, perform } = useGame();
  const forecast = financialForecast(state);
  const latest = state.management?.history.at(-1);
  const salaries = state.management.executives.reduce((n, e) => n + EXECUTIVES[e.role].salary, 0) + state.world.candidates.reduce((n, id) => n + (candidateOf(state, id)?.weeklySalary ?? 0), 0);
  const seats = EXEC_ROLES.filter(r => roleTaken(state, r)).length;
  return <section>
    <HubHeader art="hq" eyebrow="Coffee Empire · Konzern" title="Headquarters"><p className="text-xs text-muted-foreground">{state.stores.length} Filialen · HQ-Gehälter {eur(salaries)}/Wo · C-Level {seats}/4</p></HubHeader>
    <h2 className="master-title">Konzernleitung & Recruiting</h2>
    <p className="text-xs text-muted-foreground">Schreibe eine Position aus. Mehr Budget bringt mehr und stärkere Bewerbungen – jede mit eigenen Werten.</p>
    <div className="exec-grid">{EXEC_ROLES.map(role => {
      const hiredId = state.world.candidates.find(id => candidateOf(state, id)?.role === role);
      const hired = hiredId ? candidateOf(state, hiredId) : undefined;
      const legacy = !hired && (state.management?.executives ?? []).some(e => e.role === role.toLowerCase());
      const apps = (state.world.applicants ?? []).filter(a => a.role === role);
      return <article key={role} className="exec-card"><header><span className="exec-role">{role}</span><div><strong>{hired?.name ?? (legacy ? EXECUTIVES[role.toLowerCase() as 'coo'].name : 'Unbesetzt')}</strong><small>{ROLE_INFO[role]}</small></div></header>
        {hired ? <><ApplicantStats c={hired} /><Button className="w-full" variant="outline" onClick={() => setBoth((game, exp) => ({ game: releaseExecutive(dismissCandidate(game, hired.id).state, role.toLowerCase() as 'coo'), exp }))}><UserMinus />Entlassen</Button></>
        : legacy ? <Button className="w-full" variant="outline" onClick={() => set(game => releaseExecutive(game, role.toLowerCase() as 'coo'))}><UserMinus />Entlassen</Button>
        : <><div className="posting-row">{JOB_POSTINGS.map(p => <Button key={p.id} size="sm" variant="outline" disabled={state.cash < p.cost} onClick={() => perform(g => postJob(g, role, p.id))}><Megaphone />{p.name}<small>{eur(p.cost)} · {p.count}×</small></Button>)}</div>
          {apps.map(a => <div key={a.id} className="applicant"><div><strong>{a.name}</strong><small>{a.age} J. · {a.nationality} · {a.personality}</small></div><ApplicantStats c={a} /><Button size="sm" disabled={state.cash < a.signingBonus} onClick={() => perform(g => hireApplicant(g, a.id))}><UserPlus />Einstellen · {eur(a.signingBonus)}</Button></div>)}</>}
        {(hired || legacy) && role === 'COO' && <div className="mt-3 flex items-center justify-between gap-3"><label htmlFor="coo-delegation" className="text-sm">Filialbetrieb delegieren</label><Switch id="coo-delegation" checked={state.management?.delegation ?? false} onCheckedChange={delegation => set(game => ({ ...game, management: { ...(game.management ?? createManagement(game.cash)), delegation } }))} /></div>}
        {(hired || legacy) && role === 'COO' && latest && <p className="mt-2 text-xs text-muted-foreground">Letzte Woche: {latest.cooHires} Baristas eingestellt.</p>}
      </article>;
    })}</div>
    {hasExecutive(state, 'cfo') && <section className="mt-6 border-t border-border pt-4"><h2 className="font-display text-lg font-bold">CFO · Liquiditätsausblick</h2><dl className="financial-ledger"><div><dt>Operativer Cashflow / Woche</dt><dd>{eur(forecast.weekly)}</dd></div><div><dt>Barvermögen in 4 Wochen</dt><dd>{eur(forecast.cashInFourWeeks)}</dd></div><div><dt>Zinsen nächste Woche</dt><dd>{eur(forecast.interest)}</dd></div><div><dt>Zinsersparnis letzte Woche</dt><dd>{eur(latest?.interestSaved ?? 0)}</dd></div></dl><p className="mt-3 text-xs text-muted-foreground">{latest ? 'Fortschreibung der letzten Woche ohne einmalige Ausgaben. Keine Zusage: Nachfrage, Ereignisse und neue Investitionen können abweichen.' : 'Vorläufig: berücksichtigt bisher nur HQ-Gehälter. Der erste Wochenabschluss liefert die operative Basis.'}</p></section>}
  </section>;
}
const ROLE_INFO = { COO: 'Betrieb · Durchsatz & Wartung', CFO: 'Finanzen · Zinsen & Steuern', CMO: 'Marketing · Kampagnen & Marke', CTO: 'Technik · Forschung & Kosten' } as const;
const PERK_LABEL: Record<string, [string, (v: number) => string]> = {
  storeThroughputBonus: ['Durchsatz', v => `+${Math.round(v * 100)} %`], storeMaintenanceDiscount: ['Wartung', v => `−${Math.round(v * 100)} %`],
  loanInterestDiscount: ['Zins', v => `−${(v * 100).toFixed(1)} Pkt`], taxRateDiscount: ['Steuer', v => `−${(v * 100).toFixed(1)} Pkt`],
  campaignEffectivenessBonus: ['Kampagnen', v => `+${Math.round(v * 100)} %`], brandAwarenessGrowthBonus: ['Marke/Wo', v => `+${v.toFixed(2)}`],
  weeklyResearchPoints: ['Forschung', v => `+${Math.round(v)} P`], techCostDiscount: ['Tech-Kosten', v => `−${Math.round(v * 100)} %`],
};
function ApplicantStats({ c }: { c: Candidate }) {
  return <dl className="applicant-stats"><div><dt>Können</dt><dd className="text-gold">{'★'.repeat(c.skillLevel)}{'☆'.repeat(5 - c.skillLevel)}</dd></div><div><dt>Gehalt</dt><dd>{eur(c.weeklySalary)}/Wo</dd></div>{Object.entries(c.perks as Record<string, number>).map(([k, v]) => <div key={k}><dt>{PERK_LABEL[k]?.[0] ?? k}</dt><dd>{PERK_LABEL[k]?.[1](v) ?? v}</dd></div>)}</dl>;
}
