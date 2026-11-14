import { useState } from "react";
import { ArrowUpCircle, Coffee, Factory, Landmark, MapPin, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME_CONFIG, GAME_EVENTS, purchaseRoastery } from "@/engine";
import { fireEmployee, hireEmployee, openStore, storeOpeningCost, upgradeStore } from "@/engine/engine";
import { eur, useGame } from "../GameContext";
import { translateEngineNote } from "../logMessages";
import { Empty, Panel, Section } from "../ui";
import type { StoreTier } from "@/engine/types";

const ERA: Record<string, string> = { street_vendor: "Straßenverkäufer", local_chain: "Lokale Kette", national_brand: "Nationale Marke", global_empire: "Globales Imperium" };
const TIER_NAME = { 1: "Kiosk", 2: "Café", 3: "Flagship" } as const;
const inputClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

export function EmpireTab() {
  const { state, set, perform } = useGame();
  const [districtId, setDistrictId] = useState(state.city.districts[0]?.id ?? "");
  const [tier, setTier] = useState<StoreTier>(1);
  const district = state.city.districts.find((item) => item.id === districtId) ?? state.city.districts[0]!;
  const cost = storeOpeningCost(district, Math.min(tier, district.maxStoreTier) as StoreTier);
  const canRoast = state.unlockedModules.includes("roastery");
  const report = state.lastReport;

  const selectCity = (cityId: string) => {
    const city = state.cities.find((item) => item.id === cityId);
    if (!city) return;
    set((current) => ({ ...current, city }));
    setDistrictId(city.districts[0]?.id ?? "");
    setTier(1);
  };

  return (
    <>
      <Section title="Holding">
        <Panel><div className="flex items-center gap-3"><Landmark className="h-8 w-8 text-primary" />
          <div className="text-sm"><div className="font-semibold">{ERA[state.era]}</div>
            <div className="text-muted-foreground">{state.stores.length} Filialen · Reputation {Math.round(state.brandReputation)} · {state.cities.length} Städte</div></div></div></Panel>
      </Section>

      <Section title="Neue Filiale">
        <Panel>
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-xs text-muted-foreground">Stadt
              <select aria-label="Stadt für neue Filiale" className={`${inputClass} mt-1`} value={state.city.id} onChange={(event) => selectCity(event.target.value)}>
                {state.cities.map((city) => <option key={city.id} value={city.id}>{city.name}, {city.country}</option>)}
              </select>
            </label>
            <label className="col-span-2 text-xs text-muted-foreground">Stadtviertel
              <select aria-label="Stadtviertel für neue Filiale" className={`${inputClass} mt-1`} value={district.id} onChange={(event) => { setDistrictId(event.target.value); setTier(1); }}>
                {state.city.districts.map((item) => <option key={item.id} value={item.id}>{item.name} · {eur(item.rentWeekly)}/Wo</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([1, 2, 3] as StoreTier[]).map((value) => <Button key={value} size="sm" variant={tier === value ? "default" : "outline"} disabled={value > district.maxStoreTier} onClick={() => setTier(value)}>{TIER_NAME[value]}</Button>)}
          </div>
          <Button className="mt-3 w-full" onClick={() => perform((current) => openStore(current, state.city.id, district.id, tier))}>
            <MapPin /> Eröffnen · {eur(cost)}
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Inklusive zwei Wochen Miete als Kaution. Neue Filialen starten ohne Personal.</p>
        </Panel>
      </Section>

      <Section title="Filialen">
        {state.stores.map((store) => {
          const city = state.cities.find((item) => item.id === store.cityId);
          const storeDistrict = city?.districts.find((item) => item.id === store.districtId);
          return <Panel key={store.id}>
            <div className="flex items-start gap-3 text-sm"><Coffee className="mt-0.5 h-6 w-6 text-primary" />
              <div className="min-w-0 flex-1"><div className="font-semibold">{store.name}</div><div className="text-xs text-muted-foreground">{city?.name} · {TIER_NAME[store.tier]} · Qualität {Math.round(store.qualityIndex)}</div></div>
              <div className="text-right text-xs"><div className="font-mono">{eur(store.weeklyRevenue)}</div><div className="text-muted-foreground">{store.customersServedLastWeek} Kunden</div></div></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => perform((current) => hireEmployee(current, store.id, "barista"))}><UserPlus /> Barista</Button>
              <Button size="sm" variant="outline" onClick={() => perform((current) => hireEmployee(current, store.id, "manager"))}><UserPlus /> Manager</Button>
            </div>
            {store.employees.length > 0 && <ul className="mt-2 divide-y divide-border rounded-lg border border-border px-2">
              {store.employees.map((employee) => <li key={employee.id} className="flex items-center gap-2 py-2 text-xs">
                <span className="flex-1">{employee.name} · {employee.role === "manager" ? "Manager" : "Barista"} <span className="text-muted-foreground">Skill {employee.skill}</span></span>
                <span className="font-mono">{eur(employee.salaryWeekly)}/Wo</span>
                <button aria-label={`${employee.name} entlassen`} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => perform((current) => fireEmployee(current, store.id, employee.id))}><UserMinus className="h-4 w-4" /></button>
              </li>)}
            </ul>}
            <Button className="mt-2 w-full" size="sm" variant="secondary" disabled={store.tier >= 3 || !storeDistrict || store.tier + 1 > storeDistrict.maxStoreTier} onClick={() => perform((current) => upgradeStore(current, store.id))}>
              <ArrowUpCircle /> {store.tier >= 3 ? "Maximale Ausbaustufe" : storeDistrict && store.tier + 1 > storeDistrict.maxStoreTier ? "Höhere Stufe hier nicht erlaubt" : `Ausbauen · ${eur(GAME_CONFIG.STORE_UPGRADE_COST[(store.tier + 1) as 2 | 3])}`}
            </Button>
          </Panel>;
        })}
      </Section>

      <Section title="Rösterei">
        {state.roastery.owned ? (
          <Panel><div className="flex items-center gap-3 text-sm"><Factory className="h-6 w-6 text-primary" /><span className="flex-1">Roh {Math.round(state.roastery.rawBeanStockKg)} kg · Geröstet {Math.round(state.roastery.roastedStockKg)} kg</span></div>
            <div className="mt-2 text-xs text-muted-foreground">Kapazität {state.roastery.capacityKgPerWeek} kg/Wo · Automatischer Nachkauf {state.roastery.autoRestock ? "aktiv" : "aus"}</div></Panel>
        ) : (
          <Button className="w-full" variant="outline" disabled={!canRoast || state.cash < GAME_CONFIG.ROASTERY_COST} onClick={() => perform(purchaseRoastery)}>
            <Factory /> {canRoast ? `Rösterei kaufen (${eur(GAME_CONFIG.ROASTERY_COST)})` : `Ab Firmenwert ${eur(GAME_CONFIG.UNLOCK_THRESHOLDS.roastery)}`}
          </Button>
        )}
      </Section>

      <Section title="Letzte Woche">
        {!report ? <Empty>Tippe auf „Nächste Woche“, um zu starten. Danach erwartet dich dein erstes Ereignis.</Empty> : (
          <Panel><dl className="grid grid-cols-2 gap-y-1 text-xs">
            <dt className="text-muted-foreground">Umsatz</dt><dd className="text-right font-mono">{eur(report.revenueTotal)}</dd>
            <dt className="text-muted-foreground">Kosten</dt><dd className="text-right font-mono">{eur(report.costTotal)}</dd>
            <dt className="font-semibold">Ergebnis</dt><dd className={`text-right font-mono font-semibold ${report.netIncome >= 0 ? "text-success" : "text-destructive"}`}>{eur(report.netIncome)}</dd>
          </dl>{report.notes.length > 0 && <ul className="mt-3 space-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground">{report.notes.map((note, index) => <li key={`${note}-${index}`}>{translateEngineNote(note)}</li>)}</ul>}</Panel>
        )}
      </Section>
    </>
  );
}
