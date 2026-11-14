import { ChevronRight, TrendingDown, TrendingUp, Wallet, Building2, CalendarDays } from "lucide-react";
import { compact, useGame } from "./GameContext";

export function TopBar() {
  const { state, nextWeek } = useGame();
  const h = state.market.priceHistory;
  const price = state.market.futuresPricePerKg;
  const up = price >= (h.at(-2) ?? price);
  const date = new Date(state.dateIso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-card/95 backdrop-blur pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2">
        <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Bar" value={compact(state.cash)} />
          <Stat icon={<Building2 className="h-3.5 w-3.5" />} label="Wert" value={compact(state.companyValuation)} />
          <Stat icon={<CalendarDays className="h-3.5 w-3.5" />} label={date} value={`Wo ${state.week}`} />
          <div className="flex items-center gap-1">
            {up ? <TrendingUp className="h-3.5 w-3.5 text-success" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
            <span className="text-muted-foreground">Bohne</span>
            <span className={`font-mono font-semibold ${up ? "text-success" : "text-destructive"}`}>{price.toFixed(2)}€</span>
          </div>
        </div>
        <button onClick={nextWeek} className="flex h-14 items-center gap-1 rounded-xl bg-primary px-3 font-display text-sm font-bold text-primary-foreground shadow-glow active:scale-95 transition">
          Nächste<br />Woche <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-1"><span className="text-primary">{icon}</span><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}</span></div>;
}
