import { Lock } from "lucide-react";
import { externalRoastedPricePerKg } from "@/engine";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

export function MarketTab() {
  const { state } = useGame();
  const h = state.market.priceHistory, max = Math.max(...h), min = Math.min(...h);
  const b2b = state.unlockedModules.includes("b2b_trade");
  return (
    <>
      <Section title="Kaffee-Futures">
        <Panel>
          <div className="flex h-20 items-end gap-0.5">{h.slice(-40).map((p, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${20 + ((p - min) / (max - min || 1)) * 80}%` }} />)}</div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Volatilität {state.market.volatility}%/Wo</span><span>Extern geröstet: {externalRoastedPricePerKg(state.market.futuresPricePerKg).toFixed(2)} €/kg</span></div>
        </Panel>
      </Section>
      <Section title="B2B-Lieferverträge">
        {!b2b ? <Empty><Lock className="mx-auto mb-1 h-4 w-4" />Wird mit eigener Rösterei und höherem Firmenwert freigeschaltet.</Empty>
          : state.b2b.contracts.length === 0 ? <Empty>Keine aktiven Verträge.</Empty>
          : state.b2b.contracts.map((c) => <Panel key={c.id}><div className="flex justify-between text-sm"><span>{c.partnerName}</span><span className="text-muted-foreground">{eur(c.volumeKgPerWeek * c.pricePerKg)}/Wo · {c.weeksRemaining} Wo</span></div></Panel>)}
      </Section>
    </>
  );
}
