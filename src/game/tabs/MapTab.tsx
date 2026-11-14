import { useState } from "react";
import { MapPin } from "lucide-react";
import { CITIES } from "@/data";
import { useGame } from "../GameContext";
import { Panel, Section } from "../ui";

const BIOME: Record<string, string> = { european_classic: "Europäisch klassisch", modern_industrial: "Modern industriell", asian_zen: "Asiatisch Zen", tropical_colonial: "Tropisch kolonial" };

export function MapTab() {
  const { state } = useGame();
  const [biome, setBiome] = useState<string | null>(null);
  const biomes = Array.from(new Set(CITIES.map((c) => c.biome)));
  const cls = (a: boolean) => `shrink-0 rounded-full border px-3 py-1 text-xs ${a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`;
  return (
    <Section title="Weltkarte">
      <div className="mb-2 flex gap-2 overflow-x-auto pb-1"><button className={cls(!biome)} onClick={() => setBiome(null)}>Alle Biome</button>{biomes.map((b) => <button key={b} className={cls(biome === b)} onClick={() => setBiome(b)}>{BIOME[b]}</button>)}</div>
      {CITIES.filter((c) => !biome || c.biome === biome).map((c) => (
        <Panel key={c.id}>
          <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-6 w-6 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">{c.name} {state.city.id === c.id && <span className="ml-1 text-xs text-primary">· Heimatstadt</span>}</div>
              <div className="text-xs text-muted-foreground">{BIOME[c.biome]} · Kaufkraft {c.purchasingPower.toFixed(1)}× · Kaffeekultur {c.coffeeCultureIndex}</div>
              <ul className="mt-2 space-y-1 text-xs">{c.districts.map((d) => <li key={d.id} className="flex justify-between"><span>{d.name}</span><span className="text-muted-foreground">Laufkundschaft {d.footTraffic} · Miete {d.rentWeekly} €/Wo</span></li>)}</ul>
            </div></div>
        </Panel>
      ))}
    </Section>
  );
}
