import { Handshake, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions } from "@/engine";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

const OFFERS = [
  { client: "Hotelkette Aurum", kg: 120, price: 9.5, weeks: 12 },
  { client: "Bürocatering Nord", kg: 60, price: 8.2, weeks: 8 },
];

export function MarketTab() {
  const { state, set } = useGame();
  const h = state.priceHistory, max = Math.max(...h), min = Math.min(...h);
  return (
    <>
      <Section title="Bohnen-Terminmarkt">
        <Panel>
          <div className="flex h-20 items-end gap-0.5">{h.map((p, i) => <div key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${20 + ((p - min) / (max - min || 1)) * 80}%` }} />)}</div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Lager: {Math.round(state.beansKg).toLocaleString("de-DE")} kg</span><span className="font-mono">{state.coffeePrice.toFixed(2)} €/kg</span></div>
          <div className="mt-2 grid grid-cols-3 gap-2">{[100, 500, 2000].map((kg) => (
            <Button key={kg} size="sm" variant="secondary" disabled={state.cash < kg * state.coffeePrice} onClick={() => set((s) => actions.buyBeans(s, kg))}><Package />{kg} kg</Button>
          ))}</div>
        </Panel>
      </Section>
      <Section title="B2B-Lieferverträge">
        {OFFERS.map((o) => (
          <Panel key={o.client}><div className="flex items-center gap-3 text-sm"><Handshake className="h-6 w-6 text-primary" />
            <div className="flex-1"><div className="font-semibold">{o.client}</div><div className="text-xs text-muted-foreground">{o.kg} kg/Woche · {o.price.toFixed(2)} €/kg · {o.weeks} Wochen</div></div>
            <Button size="sm" onClick={() => set((s) => actions.takeContract(s, o.client, o.kg, o.price, o.weeks))}>Annehmen</Button></div></Panel>
        ))}
        <h3 className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">Aktive Verträge</h3>
        {state.contracts.length === 0 ? <Empty>Keine aktiven Verträge.</Empty> : state.contracts.map((k) => (
          <Panel key={k.id}><div className="flex justify-between text-sm"><span>{k.client}</span><span className="text-muted-foreground">{eur(k.kgPerWeek * k.pricePerKg)}/Wo · {k.weeksLeft} Wo</span></div></Panel>
        ))}
      </Section>
    </>
  );
}
