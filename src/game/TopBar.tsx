import { ChevronRight, TrendingDown, TrendingUp, Wallet, Building2, CalendarDays } from "lucide-react";
import { compact, useGame } from "./GameContext";
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function TopBar() {
  const { state, nextWeek } = useGame();
  const [flash, setFlash] = useState(false);
  useEffect(() => { setFlash(true); const timer = setTimeout(() => setFlash(false), 1600); return () => clearTimeout(timer); }, [state.week]);
  const h = state.market.priceHistory;
  const price = state.market.futuresPricePerKg;
  const up = price >= (h.at(-2) ?? price);
  const date = new Date(state.dateIso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className={`hud mx-auto flex max-w-5xl items-center gap-2 px-3 py-2 ${flash ? 'hud-flash' : ''}`}>
        <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
          <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Bar" value={compact(state.cash)} />
          <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="Wert" value={compact(state.companyValuation)} />
          <Stat icon={<CalendarDays className="h-3.5 w-3.5" />} label={date} value={`Wo ${state.week}`} />
          <div className="flex items-center gap-1 whitespace-nowrap">
            {up ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            <span className="text-muted-foreground">Bohne</span>
            <span className={`font-mono font-semibold ${up ? "text-success" : "text-destructive"}`}>{price.toFixed(2)}€</span>
          </div>
        </div>
        <Button aria-label="Nächste Woche" onClick={nextWeek} disabled={Boolean(state.pendingEvent)} className="flex h-14 items-center gap-1 rounded-lg bg-primary px-3 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition disabled:opacity-50 disabled:active:scale-100">
          {state.pendingEvent ? <>Ereignis<br />wählen</> : <>Nächste<br />Woche</>} <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-1 whitespace-nowrap"><span className="text-primary">{icon}</span><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}</span></div>;
}
