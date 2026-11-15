import { compact, useGame } from "./GameContext";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { progressOf, rankProgress } from '@/engine/progression';
import { rk } from '@/engine/unlocks';
import { weatherAt, tycoonOf, masterEra } from '@/engine/tycoon';
import { WeatherRadar } from './MenuTrendBoard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function TopBar({ onProgress }: { onProgress?: () => void }) {
  const { state, nextWeek } = useGame();
  const [flash, setFlash] = useState(false);
  const [radar, setRadar] = useState(false), weather = weatherAt(state.week, state.city.id), t = tycoonOf(state);
  useEffect(() => { setFlash(true); const timer = setTimeout(() => setFlash(false), 1600); return () => clearTimeout(timer); }, [state.week]);
  const p = progressOf(state);
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${p.settings.fontScale * 100}%`;
    root.dataset['reduceMotion'] = String(p.settings.reduceMotion);
    root.dataset['contrast'] = p.settings.highContrast ? 'high' : 'normal';
  }, [p.settings.fontScale, p.settings.reduceMotion, p.settings.highContrast]);
  const h = state.market.priceHistory;
  const price = state.market.futuresPricePerKg;
  const up = price >= (h.at(-2) ?? price);
  const rp = rankProgress(state);
  return (<>
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className={`hud mx-auto grid max-w-5xl gap-1 px-3 py-1.5 ${flash ? 'hud-flash' : ''}`}>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-mono font-bold">{compact(state.cash)}{state.lastReport && <span className={`ml-1 text-[11px] ${state.lastReport.netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>{state.lastReport.netIncome >= 0 ? '+' : ''}{compact(state.lastReport.netIncome)}/Wo</span>}</span>
          <span className="text-muted-foreground">Woche <strong className="text-foreground">{state.week}</strong></span>
          <Button variant="ghost" size="sm" className="hud-weather" onClick={() => setRadar(true)} aria-label="Wettervorhersage öffnen">{weather.season} · {weather.temp + (weather.heat ? 8 : 0)}°</Button>
        </div>
        <Button variant="ghost" className="rank-bar" onClick={onProgress} aria-label={`Rang ${p.rank}: ${rk(p.rank - 1).name}, ${Math.round(rp.ratio * 100)} Prozent zum nächsten Rang. Fortschritt öffnen`}>
          
          <span className="flex-1"><span className="flex justify-between text-[11px]"><strong>{rk(p.rank - 1).name}</strong><span className="text-muted-foreground">{rp.next ? `→ ${rp.next.name} ${Math.round(rp.ratio * 100)} %` : 'Max'}</span></span>
            <span className="rank-meter block"><span style={{ width: `${rp.ratio * 100}%` }} /></span></span>
        </Button>
        <div className="hud-master-line"><strong>BEAN BARON · Ära {masterEra(state)}</strong><span>★ {(state.brandReputation / 20).toFixed(1)} · Float {compact(t.beanpay.balance)}</span></div>
      </div>
    </header>
    <Sheet open={radar} onOpenChange={setRadar}><SheetContent side="bottom"><SheetHeader><SheetTitle>Wetter & Saison · {state.city.name}</SheetTitle></SheetHeader><WeatherRadar /></SheetContent></Sheet>
      <Button aria-label="Nächste Woche" onClick={nextWeek} disabled={Boolean(state.pendingEvent)} className="next-week-fab flex items-center gap-1 bg-primary px-4 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition disabled:opacity-60">
        {state.pendingEvent ? 'Ereignis wählen' : 'Nächste Woche'} ▶
      </Button>
  </>);
}
