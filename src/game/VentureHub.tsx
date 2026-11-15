import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { HubHeader } from './HubHeader';
import { startupArt } from './sheetArt';
import { STAGES, VENTURE_SLOTS, decisionText, empireOf, investVenture, passVenture, resolveVenture, ventureSignal, ventureStake, type Venture } from '@/engine/empire';
import { isExec } from '@/engine/empire';

const STATUS: Record<Venture['status'], string> = { open: 'Sucht Kapital', active: 'Beteiligt', ipo: 'Börsengang', sold: 'Verkauft', failed: 'Gescheitert', sued: 'Insolvent mit Klage' };
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')} %`;

function Steps({ stage }: { stage: number }) {
  return <ol className="venture-steps" aria-label={`Phase ${STAGES[stage]}`}>{STAGES.map((s, i) => <li key={s} data-on={i <= stage}>{s}</li>)}<li data-on={false}>IPO</li></ol>;
}
export function VentureHub() {
  const { state, perform } = useGame();
  const e = empireOf(state), active = e.ventures.filter(v => v.status === 'active'), open = e.ventures.filter(v => v.status === 'open');
  const inv = active.reduce((n, v) => n + v.invested, 0), stake = active.reduce((n, v) => n + ventureStake(v), 0);
  const won = e.history.reduce((n, v) => n + v.payout, 0);
  return <div className="space-y-4">
    <HubHeader art="venture" eyebrow="Finanzen · Venture Capital" title="Startup-Beteiligungen"><p className="text-xs text-muted-foreground">Pre-Seed → Seed → Series A → Series B → Pre-IPO → Börsengang. In jeder Runde entscheidest du neu.</p></HubHeader>
    <dl className="cafe-kpis"><div><dt>Investiert</dt><dd>{eur(inv)}</dd></div><div><dt>Anteilswert</dt><dd>{eur(stake)}</dd></div><div><dt>Exits gesamt</dt><dd>{eur(won)}</dd></div></dl>
    {isExec(state, 'cfo') && <p className="text-xs text-muted-foreground">Dein CFO trifft offene Entscheidungen automatisch, wenn du sie nicht selbst triffst.</p>}
    <section className="cafe-panel-block"><h2 className="cafe-panel-h">Deine Beteiligungen · {active.length}/{VENTURE_SLOTS}</h2>
      {active.length === 0 && <p className="text-xs text-muted-foreground">Noch keine Beteiligung. Wähle unten ein Startup aus der Pipeline.</p>}
      {active.map(v => { const d = v.decision, t = d && decisionText(d.kind);
        return <article key={v.id} className="venture-card" data-decision={!!d}>
          <div className="flex items-start gap-3"><img src={startupArt(v.art)} alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" /><div className="min-w-0 flex-1"><strong>{v.name}</strong><small className="block text-muted-foreground">{v.sector} · {ventureSignal(v)}</small><small className="block">Anteil {pct(v.ownership)} · Wert {eur(ventureStake(v))} · Einsatz {eur(v.invested)}</small></div></div>
          <Steps stage={v.stage} />
          {d && t ? <div className="venture-decision"><p><strong>{t.title}</strong> · Antwort bis Woche {d.expires}{d.kind === 'round' ? ` · neue Bewertung ${eur(d.value)}` : d.kind === 'offer' ? ` · Angebot ${eur(d.value)}` : ''}</p>
            <div className="grid gap-2"><Button className="h-auto min-h-11 whitespace-normal" disabled={d.cost > state.cash} onClick={() => perform(g => resolveVenture(g, v.id, true))}>{t.yes}{d.cost ? ` · ${eur(d.cost)}` : ''}</Button><Button variant="outline" className="h-auto min-h-11 whitespace-normal" onClick={() => perform(g => resolveVenture(g, v.id, false))}>{t.no}</Button></div></div>
            : <p className="text-xs text-muted-foreground">Nächste Meldung der Gründer ab Woche {v.nextWeek}.</p>}
        </article>; })}
    </section>
    <section className="cafe-panel-block"><h2 className="cafe-panel-h">Pipeline · neue Pitches</h2>
      {open.map(v => <article key={v.id} className="venture-card"><div className="flex items-start gap-3"><img src={startupArt(v.art)} alt="" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" /><div className="min-w-0 flex-1"><strong>{v.name}</strong><small className="block text-muted-foreground">{v.sector} · {ventureSignal(v)}</small><small className="block">{v.pitch}</small><small className="block">Bewertung {eur(v.valuation)} · Ticket {eur(v.ticket)} · Pitch offen bis Woche {v.openUntil}</small></div></div>
        <div className="grid grid-cols-2 gap-2"><Button className="min-h-11" disabled={state.cash < v.ticket || active.length >= VENTURE_SLOTS} onClick={() => perform(g => investVenture(g, v.id))}>Pre-Seed · {eur(v.ticket)}</Button><Button variant="ghost" className="min-h-11" onClick={() => perform(g => passVenture(g, v.id))}>Ablehnen</Button></div></article>)}
    </section>
    {e.history.length > 0 && <section className="cafe-panel-block"><h2 className="cafe-panel-h">Bisherige Exits & Pleiten</h2><ul className="venture-history">{e.history.map(v => <li key={v.id} data-win={v.payout > 0}><span>{v.name}<small>{STATUS[v.status]} · Woche {v.closedWeek}</small></span><strong>{v.payout > 0 ? '+' : ''}{eur(v.payout || -v.invested)}</strong></li>)}</ul></section>}
  </div>;
}
