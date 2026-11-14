import { Coffee, Factory, Landmark, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions } from "@/engine";
import { CITIES } from "@/data";
import { compact, eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

export function EmpireTab() {
  const { state, set } = useGame();
  const name = (id: string) => CITIES.find((c) => c.id === id)?.name;
  return (
    <>
      <Section title="Holding">
        <Panel>
          <div className="flex items-center gap-3"><Landmark className="h-8 w-8 text-primary" />
            <div className="text-sm"><div className="font-semibold">Coffee Empire Holding</div>
              <div className="text-muted-foreground">{state.cafes.length} Cafés · {state.roasteries.length} Röstereien · {Math.round(state.beansKg).toLocaleString("de-DE")} kg Bohnen</div></div></div>
        </Panel>
      </Section>
      <Section title="Cafés">
        {state.cafes.length === 0 ? <Empty>Noch keine Cafés – eröffne eins auf der Weltkarte.</Empty> : state.cafes.map((c) => (
          <Panel key={c.id}><div className="flex items-center gap-3"><Coffee className="h-6 w-6 text-primary" />
            <div className="flex-1 text-sm"><div className="font-semibold">Café {name(c.cityId)}</div><div className="text-muted-foreground">Stufe {c.level}</div></div>
            <Button size="sm" variant="secondary" disabled={state.cash < 25000} onClick={() => set((s) => actions.upgradeCafe(s, c.id))}><ArrowUpCircle /> {compact(25000)}</Button></div></Panel>
        ))}
      </Section>
      <Section title="Röstereien">
        {state.roasteries.map((r) => <Panel key={r.id}><div className="flex items-center gap-3 text-sm"><Factory className="h-6 w-6 text-primary" /><span className="flex-1 font-semibold">Rösterei {name(r.cityId)}</span><span className="text-muted-foreground">{r.capacity} kg/Woche</span></div></Panel>)}
        <Button className="w-full" variant="outline" disabled={state.cash < 150000} onClick={() => set((s) => actions.buildRoastery(s, CITIES[0]!.id))}><Factory /> Rösterei bauen ({eur(150000)})</Button>
      </Section>
      <Section title="Upgrades"><Empty>Upgrade-Baum folgt mit dem Content-JSON.</Empty></Section>
      <Section title="Ereignisse">
        <Panel><ul className="space-y-1 text-xs text-muted-foreground">{state.log.slice(0, 8).map((l, i) => <li key={i}>{l}</li>)}</ul></Panel>
      </Section>
    </>
  );
}
