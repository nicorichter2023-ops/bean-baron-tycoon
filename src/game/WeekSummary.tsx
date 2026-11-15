import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useGame, eur } from './GameContext';
import { progressOf } from '@/engine/progression';
import { PROGRESS_ICONS, rankArt } from './sheetArt';

/** Compact end-of-week card; shown when something noteworthy happened. */
export function WeekSummary() {
  const { state } = useGame();
  const s = progressOf(state).summary;
  const [seen, setSeen] = useState(0);
  const noteworthy = s && (s.rankUp || s.achievements.length || s.badges.length || s.goalsDone || s.eventNote);
  const open = Boolean(noteworthy && s && s.week !== seen && !state.pendingEvent);
  useEffect(() => { if (!s) return; }, [s]);
  if (!s) return null;
  return <Dialog open={open} onOpenChange={o => { if (!o) setSeen(s.week); }}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Woche {s.week}</DialogTitle><DialogDescription>Deine Wochenbilanz</DialogDescription></DialogHeader>
      {s.rankUp && <div className="reward-pop flex items-center gap-3 rounded-lg border border-primary p-3"><img src={rankArt(progressOf(state).rank)} alt="" className="h-14 w-14 rounded-full" /><div><p className="text-xs">Neuer Rang!</p><strong className="text-lg">{s.rankUp}</strong></div></div>}
      <dl className="grid grid-cols-2 gap-2 text-sm"><div><dt className="text-muted-foreground">Gewinn</dt><dd className={`font-mono font-bold ${s.profit >= 0 ? 'text-success' : 'text-destructive'}`}>{eur(s.profit)}</dd></div>
        <div><dt className="text-muted-foreground">Gäste</dt><dd className="font-mono font-bold">{s.guests.toLocaleString('de-DE')}</dd></div>
        <div><dt className="text-muted-foreground">Wochenziele</dt><dd className="font-bold">{s.goalsDone}/3</dd></div>
        <div><dt className="text-muted-foreground">Belohnung</dt><dd className="flex items-center gap-1 font-mono font-bold"><img src={PROGRESS_ICONS.gift} alt="" className="h-5 w-5 rounded" />{eur(s.reward)}</dd></div></dl>
      {s.achievements.map(a => <p key={a} className="reward-pop flex items-center gap-2 text-sm"><img src={PROGRESS_ICONS.medal} alt="" className="h-6 w-6 rounded" />Erfolg: {a}</p>)}
      {s.badges.map(b => <p key={b} className="text-sm">🏅 {b}</p>)}
      {s.eventNote && <p className="rounded border border-border p-2 text-xs">Kurzmeldung: {s.eventNote}</p>}
      <Button className="h-12" onClick={() => setSeen(s.week)}>Weiter</Button>
    </DialogContent>
  </Dialog>;
}
