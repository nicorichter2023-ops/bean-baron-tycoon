import { ChevronRight, TrendingDown, TrendingUp, Wallet, Building2, CalendarDays } from "lucide-react";
import { advanceWeek, companyValue, dateLabel } from "@/engine";
import { compact, useGame } from "./GameContext";

export function TopBar() {
  const { state, set } = useGame();
  const { year, weekOfYear } = dateLabel(state.week);
  const prev = state.priceHistory.at(-2) ?? state.coffeePrice;
  const up = state.coffeePrice >= prev;
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Bar" value={compact(state.cash)} />
          <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="Wert" value={compact(companyValue(state))} />
          <Stat icon={<CalendarDays className="h-3.5 w-3.5" />} label={`${year}`} value={`KW ${weekOfYear}`} />
          <div className="flex items-center gap-1">
            {up ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            <span className="text-muted-foreground">Arabica</span>
            <span className={`font-mono font-semibold ${up ? "text-success" : "text-destructive"}`}>{state.coffeePrice.toFixed(2)}€/kg</span>
          </div>
        </div>
        <button onClick={() => set(advanceWeek)} className="flex h-14 items-center gap-1 rounded-xl bg-primary px-3 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition">
          Nächste<br />Woche <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-1"><span className="text-primary">{icon}</span><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}</span></div>;
}
