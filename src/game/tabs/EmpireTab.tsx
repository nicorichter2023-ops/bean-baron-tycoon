import { useContext, useState } from "react";
import { Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GAME_CONFIG, purchaseRoastery } from "@/engine";
import { eur, useGame } from "../GameContext";
import { translateEngineNote } from "../logMessages";
import { Empty, Panel, Section, StoreFilter } from "../ui";
import { COMPANY_ARTWORK } from "../artwork";
import { roomScene } from "../roomLayouts";
import { designOf, storeCafe } from "@/engine/cafe";
import { leversOf } from "@/engine/progression";
import { CafeDetail } from '../CafeDetail';
import { retrofitStandardEquipment, standardRetrofitCost } from '@/engine/equipment';
import { hasExecutive } from '@/engine/management';

const ERA: Record<string, string> = { street_vendor: "Straßenverkäufer", local_chain: "Lokale Kette", national_brand: "Nationale Marke", global_empire: "Globales Imperium" };

export function EmpireTab() {
  const { state, perform } = useGame();
  const selectedStore = useContext(StoreFilter);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = state.stores.find((s) => s.id === openId);
  const canRoast = state.unlockedModules.includes("roastery");
  const report = state.lastReport;

  return (
    <>
      <Section title="Holding">
        <Panel><div className="flex items-center gap-3">
          <img src={COMPANY_ARTWORK.holding} alt="Isometrischer Holding-Tower von Coffee Empire" className="h-28 w-24 shrink-0 rounded-lg bg-artwork object-cover" />
          <div className="text-sm"><div className="font-display text-lg font-semibold">Coffee Inc. Holding</div><div className="font-semibold text-primary">{ERA[state.era]}</div>
            <div className="mt-1 text-xs text-muted-foreground">{state.stores.length} Filialen · Reputation {Math.round(state.brandReputation)}<br />{state.cities.length} Städte im Imperium</div></div></div></Panel>
      </Section>

      <Section title="Filialen">
        {hasExecutive(state, 'coo') && <div className="mb-4 border-b border-border pb-4">
          <Button variant="secondary" className="h-auto min-h-11 w-full whitespace-normal py-2" disabled={!standardRetrofitCost(state) || state.cash < standardRetrofitCost(state)} onClick={() => perform(retrofitStandardEquipment)}>Auf Standard-Ausstattung nachrüsten · {eur(standardRetrofitCost(state))}</Button>
        </div>}
        <p className="mb-2 text-xs text-muted-foreground">Tippe eine Filiale an – es öffnet sich dieselbe Café-Ansicht wie auf der Karte. Neue Filialen eröffnest du auf der Stadtkarte.</p>
        <ul className="store-list">{state.stores.filter((store) => !selectedStore || store.id === selectedStore).map((store) => {
          const city = state.cities.find((item) => item.id === store.cityId);
          return <li key={store.id}><button type="button" className="store-card" onClick={() => setOpenId(store.id)} aria-label={`${store.name} öffnen`}>
            <span className="store-card-art"><img src={roomScene(leversOf(state, store).stage, designOf(storeCafe(state, store)).style)} alt="" loading="lazy" decoding="async" width={1024} height={768} /><em>Stufe {leversOf(state, store).stage}</em></span>
            <span className="store-card-body"><strong>{store.name}</strong><small>{city?.name} · {store.employees.length} im Team{store.propertyBookValue ? ' · Eigentum' : ''}</small>
            <span className="store-card-kpi"><b className="font-mono">{eur(store.weeklyRevenue)}</b><small className={store.employees.length ? '' : 'text-destructive'}>{store.employees.length ? `${store.customersServedLastWeek} Gäste` : 'kein Personal!'}</small></span></span>
          </button></li>;
        })}</ul>
      </Section>
      {open && <CafeDetail store={open} address={`${state.cities.find(c => c.id === open.cityId)?.name ?? ''}`} onClose={() => setOpenId(null)} />}

      <Section title="Rösterei">
        <Panel>
          <div className="flex items-center gap-3">
            <img src={COMPANY_ARTWORK.roastery} alt="Isometrische Rösterei im Backstein-Stil" loading="lazy" className="h-28 w-32 shrink-0 rounded-lg bg-artwork object-cover" />
            <div className="text-sm"><div className="font-semibold">Roastery Café</div>{state.roastery.owned ? <div className="mt-1 text-xs text-muted-foreground">Roh {Math.round(state.roastery.rawBeanStockKg)} kg · Geröstet {Math.round(state.roastery.roastedStockKg)} kg<br />Kapazität {state.roastery.capacityKgPerWeek} kg/Wo<br />Automatischer Nachkauf {state.roastery.autoRestock ? "aktiv" : "aus"}</div> : <div className="mt-1 text-xs text-muted-foreground">Eigene Röstung senkt Bohnenkosten und schaltet den Bohnenhandel frei.</div>}</div>
          </div>
          {!state.roastery.owned && <Button className="mt-3 w-full" variant="outline" disabled={!canRoast || state.cash < GAME_CONFIG.ROASTERY_COST} onClick={() => perform(purchaseRoastery)}>
            <Factory /> {canRoast ? `Rösterei kaufen (${eur(GAME_CONFIG.ROASTERY_COST)})` : `Ab Firmenwert ${eur(GAME_CONFIG.UNLOCK_THRESHOLDS.roastery)}`}
          </Button>}
        </Panel>
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
