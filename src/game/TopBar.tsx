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
  const [open, setOpen] = useState(false);
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
      <div className={`hud mx-auto max-w-5xl px-3 py-1 ${flash ? 'hud-flash' : ''}`}>
        <div className="hud-row">
          <span className="hud-cash font-mono font-bold">{compact(state.cash)}{state.lastReport && <small className={state.lastReport.netIncome >= 0 ? 'text-success' : 'text-destructive'}>{state.lastReport.netIncome >= 0 ? '▲' : '▼'}{compact(Math.abs(state.lastReport.netIncome))}</small>}</span>
          <Button variant="ghost" size="sm" className="hud-chip" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Kennzahlen öffnen">
            <span>Wo {state.week}</span><span className="hud-stars">★ {(state.brandReputation / 20).toFixed(1)}</span><span>{weather.heat ? '☀️' : weather.temp < 8 ? '❄️' : '⛅'} {weather.temp + (weather.heat ? 8 : 0)}°</span><span aria-hidden>{open ? '▴' : '▾'}</span>
          </Button>
        </div>
        <span className="rank-meter hud-mini-meter block" aria-hidden><span style={{ width: `${rp.ratio * 100}%` }} /></span>
        {open && <div className="hud-panel">
          <Button variant="ghost" className="rank-bar" onClick={() => { setOpen(false); onProgress?.(); }} aria-label={`Rang ${p.rank}: ${rk(p.rank - 1).name}. Fortschritt öffnen`}>
            <span className="flex-1"><span className="flex justify-between text-[12px]"><strong>🏆 {rk(p.rank - 1).name}</strong><span className="text-muted-foreground">{rp.next ? `→ ${rp.next.name} ${Math.round(rp.ratio * 100)} %` : 'Max'}</span></span>
              <span className="rank-meter block"><span style={{ width: `${rp.ratio * 100}%` }} /></span></span>
          </Button>
          <div className="hud-kpis">
            <div><small>Ära</small><strong>{masterEra(state)}</strong></div>
            <div><small>Kaffee/kg</small><strong className={up ? 'text-destructive' : 'text-success'}>{price.toFixed(2)} € {up ? '↑' : '↓'}</strong></div>
            <div><small>Cafés</small><strong>{state.stores.length}</strong></div>
            <div><small>BeanPay</small><strong>{compact(t.beanpay.balance)}</strong></div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRadar(true)}>{weather.season} · Wetter der nächsten Wochen</Button>
        </div>}
      </div>
    </header>
    <Sheet open={radar} onOpenChange={setRadar}><SheetContent side="bottom"><SheetHeader><SheetTitle>Wetter & Saison · {state.city.name}</SheetTitle></SheetHeader><WeatherRadar /></SheetContent></Sheet>
      <Button aria-label="Nächste Woche" onClick={nextWeek} disabled={Boolean(state.pendingEvent)} className="next-week-fab flex items-center gap-1 bg-primary px-3 font-display text-xs font-bold text-primary-foreground shadow-glow active:scale-95 transition disabled:opacity-60">
        {state.pendingEvent ? '⚡ Ereignis' : `Wo ${state.week + 1}`} ▶
      </Button>
  </>);
}
