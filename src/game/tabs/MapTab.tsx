import { useState } from "react";
import { MapPin, Store } from "lucide-react";
import { openStore } from "@/engine";
import { Button } from "@/components/ui/button";
import { eur, useGame } from "../GameContext";
import { Panel, Section } from "../ui";
import { BIOME_LABEL, getCityArtwork } from "../artwork";

const BIOME = BIOME_LABEL;
const selectClass = "h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs text-foreground";

export function MapTab() {
  const { state, set, perform } = useGame();
  const [biome, setBiome] = useState("all");
  const [country, setCountry] = useState("all");
  const biomes = Array.from(new Set(state.cities.map((city) => city.biome)));
  const countries = Array.from(new Set(state.cities.map((city) => city.country))).sort((a, b) => a.localeCompare(b, "de"));
  const cities = state.cities.filter((city) => (biome === "all" || city.biome === biome) && (country === "all" || city.country === country));

  return (
    <Section title={`Weltkarte · ${cities.length} ${cities.length === 1 ? "Stadt" : "Städte"}`}>
      <div className="mb-3 flex gap-2">
        <select aria-label="Nach Biom filtern" className={selectClass} value={biome} onChange={(event) => setBiome(event.target.value)}>
          <option value="all">Alle Biome</option>{biomes.map((value) => <option key={value} value={value}>{BIOME[value]}</option>)}
        </select>
        <select aria-label="Nach Land filtern" className={selectClass} value={country} onChange={(event) => setCountry(event.target.value)}>
          <option value="all">Alle Länder</option>{countries.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>
      {cities.map((city) => (
        <Panel key={city.id}>
          <button className="mb-2 flex w-full items-start gap-3 text-left" onClick={() => set((current) => ({ ...current, city }))}>
            <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <span className="flex-1 text-sm"><span className="block font-semibold">{city.name}, {city.country} {state.city.id === city.id && <span className="ml-1 text-xs text-primary">· ausgewählt</span>}</span>
              <span className="block text-xs text-muted-foreground">{city.landmarkName} · {BIOME[city.biome]}</span>
              <span className="block text-xs text-muted-foreground">Kaufkraft {city.purchasingPower.toFixed(2)}× · Kaffeekultur {city.coffeeCultureIndex}</span></span>
          </button>
          <ul className="space-y-2 border-t border-border pt-2">{city.districts.map((district) => {
            const occupied = state.stores.some((store) => store.districtId === district.id);
            return <li key={district.id} className="text-xs">
              <div className="flex justify-between gap-2"><span className="font-medium">{district.name}</span><span className="text-muted-foreground">{eur(district.rentWeekly)}/Wo</span></div>
              <div className="mt-1 flex items-center justify-between gap-2"><span className="text-muted-foreground">Laufkundschaft {district.footTraffic} · max. Stufe {district.maxStoreTier}</span>
                <Button size="sm" variant="ghost" className="h-7 px-2" disabled={occupied} onClick={() => perform((current) => openStore(current, city.id, district.id, 1))}><Store /> {occupied ? "Belegt" : "Kiosk"}</Button></div>
            </li>;
          })}</ul>
        </Panel>
      ))}
    </Section>
  );
}
