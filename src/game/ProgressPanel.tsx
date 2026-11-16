import { Button } from '@/components/ui/button';
import { useGame, eur } from './GameContext';
import { ACHIEVEMENTS, RANK_LABEL, nextHint, progressOf, rankProgress, setSettings, type EventFrequency } from '@/engine/progression';
import { RANKS, rk, openCityIds } from '@/engine/unlocks';
import { PROGRESS_ICONS, rankArt } from './sheetArt';

const TUTORIAL = ['Willkommen! Tippe auf der Karte auf deine erste Filiale, um sie dir anzusehen.', 'Tippe unten in der Mitte auf den runden „Weiter“-Knopf, um eine Woche zu spielen.', 'Erfülle die Wochenziele – jedes Ziel bringt Bonusgeld.', 'Baue deine Filiale aus: Jede der 7 Stufen bringt mehr Umsatz.', 'Neue Ränge schalten Städte, Stufen und Spielhebel frei.'];
const fmt = (k: string, v: number) => k === 'valuation' || k === 'weeklyRevenue' ? eur(v) : Math.floor(v).toLocaleString('de-DE');

export function ProgressPanel() {
  const { state, set } = useGame();
  const p = progressOf(state), rp = rankProgress(state), rank = rk(p.rank - 1);
  const freq: [EventFrequency, string][] = [['rare', 'Selten'], ['normal', 'Normal'], ['often', 'Oft']];
  return <div className="grid gap-3 px-3">
    {p.tutorialStep < TUTORIAL.length && <div className="rounded-lg border border-primary bg-card p-3 text-sm" role="status"><strong>Einführung {p.tutorialStep + 1}/{TUTORIAL.length}:</strong> {TUTORIAL[p.tutorialStep]}
      <div className="mt-2 flex gap-2"><Button size="sm" onClick={() => set(g => setSettings(g, { tutorialStep: p.tutorialStep + 1 }))}>Weiter</Button><Button size="sm" variant="ghost" onClick={() => set(g => setSettings(g, { tutorialStep: 99 }))}>Überspringen</Button></div></div>}
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-3"><img src={rankArt(p.rank)} alt="" className="h-14 w-14 rounded-full object-cover" width={56} height={56} />
        <div className="flex-1"><p className="text-xs text-muted-foreground">Rang {p.rank}/10</p><h2 className="font-display text-lg font-bold">{rank.name}</h2>
          <div className="rank-meter" role="progressbar" aria-valuenow={Math.round(rp.ratio * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Fortschritt zum nächsten Rang"><span style={{ width: `${rp.ratio * 100}%` }} /></div></div></div>
      {rp.next ? <><p className="mt-2 text-sm font-semibold">Nächster Rang: {rp.next.name}</p>
        <ul className="mt-1 grid gap-1 text-sm">{rp.parts.map(x => <li key={x.key} className="flex justify-between"><span>{x.ok ? '✔' : '○'} {RANK_LABEL[x.key]}</span><span className={x.ok ? 'text-success' : 'text-muted-foreground'}>{fmt(x.key, x.have)} / {fmt(x.key, x.need)}</span></li>)}</ul>
        <p className="mt-2 text-xs text-muted-foreground">Schaltet frei: {rp.next.unlocks.join(' · ')}</p></> : <p className="mt-2 text-sm">Höchster Rang erreicht – du bist ein Kaffee-Imperium!</p>}
    </section>
    <section className="rounded-lg border border-primary/60 bg-card p-3 text-sm" aria-label="Nächster Schritt"><strong>Tipp:</strong> {nextHint(state)}</section>
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2"><img src={PROGRESS_ICONS.goal} alt="" className="h-8 w-8 rounded" /><h3 className="font-semibold">Wochenziele</h3>
        <span className="ml-auto flex items-center gap-1 text-sm"><img src={PROGRESS_ICONS.streak} alt="" className="h-6 w-6 rounded" />Serie {p.goalStreak}</span></div>
      <ul className="mt-2 grid gap-1 text-sm">{p.goals.map((g, i) => <li key={i}>○ {g.label}</li>)}</ul>
      <p className="mt-1 text-xs text-muted-foreground">Ab 2 erfüllten Zielen wächst die Serie: +10 % Belohnung pro Woche, höchstens doppelt so viel.</p>
    </section>
    <section className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2"><img src={PROGRESS_ICONS.trophy} alt="" className="h-8 w-8 rounded" /><h3 className="font-semibold">Erfolge {p.achievements.length}/{ACHIEVEMENTS.length}</h3><span className="ml-auto text-xs text-muted-foreground">+{(p.achievements.length * 0.4).toFixed(1)} % Umsatz</span></div>
      <ul className="mt-2 grid gap-1 text-sm">{ACHIEVEMENTS.filter(a => p.achievements.includes(a.id)).slice(-2).map(a => <li key={a.id}>★ {a.label}</li>)}{ACHIEVEMENTS.filter(a => !p.achievements.includes(a.id)).slice(0, 2).map(a => <li key={a.id} className="text-muted-foreground">○ {a.label}</li>)}</ul>
      <details className="mt-1 text-xs"><summary className="min-h-11 cursor-pointer py-3">Alle {ACHIEVEMENTS.length} Erfolge anzeigen</summary><ul className="grid gap-0.5">{ACHIEVEMENTS.map(a => <li key={a.id} className={p.achievements.includes(a.id) ? '' : 'text-muted-foreground'}>{p.achievements.includes(a.id) ? '★' : '○'} {a.label}</li>)}</ul></details>
    </section>
    <section className="rounded-lg border border-border bg-card p-3 text-sm"><h3 className="font-semibold">Städte</h3><p className="text-muted-foreground">{openCityIds(state).length} von {state.cities.length} Städten offen. Weitere Städte schaltest du über deinen Rang frei.</p></section>
    <section className="rounded-lg border border-border bg-card p-3 text-sm" aria-label="Einstellungen"><h3 className="mb-2 font-semibold">Einstellungen</h3>
      <p className="mb-1">Ereignisse</p><div className="mb-2 flex gap-1">{freq.map(([id, l]) => <Button key={id} size="sm" variant={p.eventFrequency === id ? 'secondary' : 'ghost'} aria-pressed={p.eventFrequency === id} onClick={() => set(g => setSettings(g, { eventFrequency: id }))}>{l}</Button>)}</div>
      <p className="mb-1">Schriftgröße</p><div className="mb-2 flex gap-1">{([1, 1.15, 1.3] as const).map(f => <Button key={f} size="sm" variant={p.settings.fontScale === f ? 'secondary' : 'ghost'} aria-pressed={p.settings.fontScale === f} onClick={() => set(g => setSettings(g, { fontScale: f }))}>{f === 1 ? 'Normal' : f === 1.15 ? 'Groß' : 'Sehr groß'}</Button>)}</div>
      <div className="flex flex-wrap gap-1"><Button size="sm" variant={p.settings.reduceMotion ? 'secondary' : 'ghost'} aria-pressed={p.settings.reduceMotion} onClick={() => set(g => setSettings(g, { reduceMotion: !p.settings.reduceMotion }))}>Ruhige Bewegungen</Button>
        <Button size="sm" variant={p.settings.highContrast ? 'secondary' : 'ghost'} aria-pressed={p.settings.highContrast} onClick={() => set(g => setSettings(g, { highContrast: !p.settings.highContrast }))}>Hoher Kontrast</Button></div>
    </section>
  </div>;
}
