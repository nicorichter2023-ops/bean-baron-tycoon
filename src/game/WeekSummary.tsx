import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGame, eur } from './GameContext';
import { progressOf } from '@/engine/progression';
import { PROGRESS_ICONS, rankArt } from './sheetArt';

/** Compact end-of-week card; shown when something noteworthy happened. */
export function WeekSummary() {
  const { state } = useGame();
  const s = progressOf(state).summary;
  const [seen, setSeen] = useState(0);
  const [pulse, setPulse] = useState(false);
  const previousWeek = useRef(state.week);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!s || previousWeek.current === state.week) return;
    previousWeek.current = state.week;
    const reduced = progressOf(state).settings.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStep(reduced ? 2 : 0);
    setPulse(true);
    if (reduced) { const timer = setTimeout(() => setPulse(false), 1800); return () => clearTimeout(timer); }
    const interval = setInterval(() => setStep(n => Math.min(2, n + 1)), 1000);
    const timer = setTimeout(() => setPulse(false), 3400);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [s?.week]);
  // Only big moments open a card; routine weeks report via a short toast so play is not interrupted.
  const noteworthy = Boolean(s?.rankUp);
  const open = Boolean(noteworthy && s && s.week !== seen && !state.pendingEvent);
  useEffect(() => { if (!s || noteworthy) return; const bits = [s.goalsDone ? `${s.goalsDone}/3 Wochenziele · +${eur(s.reward)}` : '', ...s.achievements.map(a => `Erfolg: ${a}`), ...s.badges, s.eventNote ? `Kurzmeldung: ${s.eventNote}` : ''].filter(Boolean); if (bits.length) toast.success(bits.join(' · ')); }, [s?.week]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return null;
  const news = state.living?.news.find(n => n.woche === s.week);
  return <>{pulse && !open && !state.pendingEvent && <div className="week-receipt" role="status" key={s.week}><span>Woche {s.week} abgeschlossen</span><Button variant="ghost" size="sm" className="week-receipt-skip" onClick={() => setPulse(false)}>Überspringen</Button><div className="week-receipt-result" key={step}>{step === 0 ? <><small>Gäste</small><strong>{s.guests.toLocaleString('de-DE')}</strong></> : step === 1 ? <><small>Umsatz · Gewinn</small><strong>{eur(state.lastReport?.revenueTotal ?? 0)} · <span className={s.profit >= 0 ? 'text-success' : 'text-destructive'}>{eur(s.profit)}</span></strong></> : <><small>Kasse · Weltmarkt</small><strong>{eur(state.cash)}</strong><p>{news?.text.split('[Wirkung:')[0] ?? 'Die neue Woche beginnt.'}</p></>}</div><div className="week-receipt-progress" aria-hidden>{[0, 1, 2].map(i => <i key={i} data-on={i <= step} />)}</div></div>}<Dialog open={open} onOpenChange={o => { if (!o) setSeen(s.week); }}>
    <DialogContent className="max-h-[85dvh] max-w-sm overflow-y-auto">
      <DialogHeader><DialogTitle>Woche {s.week}</DialogTitle><DialogDescription>Deine Wochenbilanz</DialogDescription></DialogHeader>
      {s.rankUp && <div className="reward-pop flex items-center gap-3 rounded-lg border border-primary p-3"><img src={rankArt(progressOf(state).rank)} alt="" className="h-14 w-14 rounded-full" /><div><p className="text-xs">Neuer Rang!</p><strong className="text-lg">{s.rankUp}</strong></div></div>}
      <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-muted-foreground">Gewinn</dt><dd className={`font-mono font-bold ${s.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{eur(s.profit)}</dd></div>
        <div><dt className="text-muted-foreground">Gäste</dt><dd className="font-mono font-bold">{s.guests.toLocaleString('de-DE')}</dd></div>
        <div><dt className="text-muted-foreground">Wochenziele</dt><dd className="font-bold">{s.goalsDone}/3</dd></div>
        <div><dt className="text-muted-foreground">Belohnung</dt><dd className="flex items-center gap-1 font-mono font-bold"><img src={PROGRESS_ICONS.gift} alt="" className="h-5 w-5 rounded" />{eur(s.reward)}</dd></div></dl>
      {s.achievements.map(a => <p key={a} className="reward-pop flex items-center gap-2 text-sm"><img src={PROGRESS_ICONS.medal} alt="" className="h-6 w-6 rounded" />Erfolg: {a}</p>)}
      {s.badges.map(b => <p key={b} className="text-sm">🏅 {b}</p>)}
      {s.eventNote && <p className="rounded border border-border p-2 text-xs">Kurzmeldung: {s.eventNote}</p>}
      <Button className="sticky bottom-0 h-12" onClick={() => setSeen(s.week)}>Weiter</Button>
    </DialogContent>
  </Dialog></>;
}
