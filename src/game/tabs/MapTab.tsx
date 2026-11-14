import { useState } from "react";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions } from "@/engine";
import { BIOMES, CITIES, REGIONS } from "@/data";
import { compact, useGame } from "../GameContext";
import { Panel, Section } from "../ui";

export function MapTab() {
  const { state, set } = useGame();
  const [region, setRegion] = useState<string | null>(null);
  const [biome, setBiome] = useState<string | null>(null);
  const list = CITIES.filter((c) => (!region || c.region === region) && (!biome || c.biome === biome));
  return (
    <Section title="Weltkarte">
      <Chips options={REGIONS} value={region} onChange={setRegion} all="Alle Regionen" />
      <Chips options={BIOMES} value={biome} onChange={setBiome} all="Alle Biome" />
      {list.map((c) => {
        const owned = state.cafes.filter((x) => x.cityId === c.id).length;
        return (
          <Panel key={c.id}>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-6 w-6 text-primary" />
              <div className="flex-1 text-sm">
                <div className="font-semibold">{c.name} <span className="font-normal text-muted-foreground">· {c.country}</span></div>
                <div className="text-xs text-muted-foreground">{c.region} · {c.biome}</div>
                <div className="mt-1 flex gap-3 text-xs"><span className="flex items-center gap-1"><Users className="h-3 w-3" />{(c.population / 1e6).toFixed(1)} Mio</span><span>Nachfrage {Math.round(c.demand * 100)}%</span><span>Miete {compact(c.rent)}</span></div>
                {owned > 0 && <div className="mt-1 text-xs text-primary">{owned} eigene Cafés</div>}
              </div>
            </div>
            <Button className="mt-2 w-full" size="sm" disabled={state.cash < c.cafeCost} onClick={() => set((s) => actions.openCafe(s, c.id))}>Café eröffnen · {compact(c.cafeCost)}</Button>
          </Panel>
        );
      })}
    </Section>
  );
}
function Chips({ options, value, onChange, all }: { options: string[]; value: string | null; onChange: (v: string | null) => void; all: string }) {
  const cls = (a: boolean) => `shrink-0 rounded-full border px-3 py-1 text-xs ${a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`;
  return <div className="mb-2 flex gap-2 overflow-x-auto pb-1"><button className={cls(!value)} onClick={() => onChange(null)}>{all}</button>{options.map((o) => <button key={o} className={cls(value === o)} onClick={() => onChange(o)}>{o}</button>)}</div>;
}
