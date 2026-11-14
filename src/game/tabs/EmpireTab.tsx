import { Coffee, Factory, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME_CONFIG, purchaseRoastery } from "@/engine";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

const ERA: Record<string, string> = { street_vendor: "Straßenverkäufer", local_chain: "Lokale Kette", national_brand: "Nationale Marke", global_empire: "Globales Imperium" };

export function EmpireTab() {
  const { state, set } = useGame();
  const r = state.lastReport;
  const canRoast = state.unlockedModules.includes("roastery");
  return (
    <>
      <Section title="Holding">
        <Panel><div className="flex items-center gap-3"><Landmark className="h-8 w-8 text-primary" />
          <div className="text-sm"><div className="font-semibold">{ERA[state.era]}</div>
            <div className="text-muted-foreground">{state.stores.length} Filialen · Reputation {Math.round(state.brandReputation)} · {state.city.name}</div></div></div></Panel>
      </Section>
      <Section title="Filialen">
        {state.stores.map((s) => (
          <Panel key={s.id}><div className="flex items-center gap-3 text-sm"><Coffee className="h-6 w-6 text-primary" />
            <div className="flex-1"><div className="font-semibold">{s.name}</div><div className="text-xs text-muted-foreground">Stufe {s.tier} · {s.employees.length} Personal · Qualität {Math.round(s.qualityIndex)}</div></div>
            <div className="text-right text-xs"><div className="font-mono">{eur(s.weeklyRevenue)}</div><div className="text-muted-foreground">{s.customersServedLastWeek} Kunden</div></div></div></Panel>
        ))}
      </Section>
      <Section title="Rösterei">
        {state.roastery.owned ? (
          <Panel><div className="flex items-center gap-3 text-sm"><Factory className="h-6 w-6 text-primary" /><span className="flex-1">Roh {Math.round(state.roastery.rawBeanStockKg)} kg · Geröstet {Math.round(state.roastery.roastedStockKg)} kg</span></div></Panel>
        ) : (
          <Button className="w-full" variant="outline" disabled={!canRoast || state.cash < GAME_CONFIG.ROASTERY_COST} onClick={() => set((s) => purchaseRoastery(s).state)}>
            <Factory /> {canRoast ? `Rösterei kaufen (${eur(GAME_CONFIG.ROASTERY_COST)})` : `Ab Firmenwert ${eur(GAME_CONFIG.UNLOCK_THRESHOLDS.roastery)}`}
          </Button>
        )}
      </Section>
      <Section title="Letzte Woche">
        {!r ? <Empty>Tippe auf „Nächste Woche“, um zu starten.</Empty> : (
          <Panel><dl className="grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Umsatz</dt><dd className="text-right font-mono">{eur(r.revenueTotal)}</dd>
            <dt className="text-muted-foreground">Kosten</dt><dd className="text-right font-mono">{eur(r.costTotal)}</dd>
            <dt className="font-semibold">Ergebnis</dt><dd className={`text-right font-mono font-semibold ${r.netIncome >= 0 ? "text-success" : "text-destructive"}`}>{eur(r.netIncome)}</dd>
          </dl>{r.notes.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">{r.notes.join(" · ")}</p>}</Panel>
        )}
      </Section>
    </>
  );
}
