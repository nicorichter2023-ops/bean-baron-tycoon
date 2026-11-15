import { TrendingDown, TrendingUp } from "lucide-react";
import { compact, useGame } from "./GameContext";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { HUD, rankArt } from './sheetArt';
import { progressOf, rankProgress } from '@/engine/progression';
import { RANKS } from '@/engine/unlocks';

export function TopBar({ onProgress }: { onProgress?: () => void }) {
  const { state, nextWeek } = useGame();
  const [flash, setFlash] = useState(false);
  useEffect(() => { setFlash(true); const timer = setTimeout(() => setFlash(false), 1600); return () => clearTimeout(timer); }, [state.week]);
  const p = progressOf(state);
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${p.settings.fontScale * 100}%`;
    root.dataset.reduceMotion = String(p.settings.reduceMotion);
    root.dataset.contrast = p.settings.highContrast ? 'high' : 'normal';
  }, [p.settings.fontScale, p.settings.reduceMotion, p.settings.highContrast]);
  const h = state.market.priceHistory;
  const price = state.market.futuresPricePerKg;
  const up = price >= (h.at(-2) ?? price);
  const rp = rankProgress(state);
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className={`hud mx-auto grid max-w-5xl gap-1 px-3 py-1.5 ${flash ? 'hud-flash' : ''}`}>
        <div className="grid grid-cols-4 gap-x-2 text-[11px]">
          <Stat icon={<img src={HUD.cash} alt="" className="h-5 w-5 object-contain" />} label="Bar" value={compact(state.cash)} />
          <Stat icon={<img src={HUD.calendar} alt="" className="h-5 w-5 object-contain" />} label="" value={`Wo ${state.week}`} />
          <Stat icon={<span aria-hidden className="text-warning">★</span>} label="Ruf" value={String(Math.round(state.brandReputation))} />
          <div className="flex items-center gap-1 whitespace-nowrap">
            {up ? <TrendingUp className="h-3.5 w-3.5 text-success" aria-label="steigt" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" aria-label="fällt" />}
            <span className={`font-mono font-semibold ${up ? "text-success" : "text-destructive"}`}>{price.toFixed(2)}€</span>
          </div>
        </div>
        <button type="button" className="rank-bar" onClick={onProgress} aria-label={`Rang ${p.rank}: ${RANKS[p.rank - 1].name}, ${Math.round(rp.ratio * 100)} Prozent zum nächsten Rang. Fortschritt öffnen`}>
          <img src={rankArt(p.rank)} alt="" width={32} height={32} />
          <span className="flex-1"><span className="flex justify-between text-[11px]"><strong>{RANKS[p.rank - 1].name}</strong><span className="text-muted-foreground">{rp.next ? `→ ${rp.next.name} ${Math.round(rp.ratio * 100)} %` : 'Max'}</span></span>
            <span className="rank-meter block"><span style={{ width: `${rp.ratio * 100}%` }} /></span></span>
        </button>
      </div>
      <Button aria-label="Nächste Woche" onClick={nextWeek} disabled={Boolean(state.pendingEvent)} className="next-week-fab flex items-center gap-1 bg-primary px-4 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition disabled:opacity-60">
        {state.pendingEvent ? 'Ereignis wählen' : 'Nächste Woche'} <img src={HUD.nextWeek} alt="" className="h-7 w-7 object-contain" />
      </Button>
    </header>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-1 whitespace-nowrap"><span className="text-primary">{icon}</span>{label && <span className="text-muted-foreground">{label}</span>}<span className="font-mono font-semibold">{value}</span></div>;
}
