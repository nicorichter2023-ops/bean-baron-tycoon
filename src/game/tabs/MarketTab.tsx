import { useState } from "react";
import { Bean, FileSignature, Lock, PackageOpen } from "lucide-react";
import { beanPricePerKg, buyBeans, externalRoastedPricePerKg, signB2BContract } from "@/engine";
import { Button } from "@/components/ui/button";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";
import { COMPANY_ARTWORK } from "../artwork";
import { Sprite } from '../Sprite';

const inputClass = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

export function MarketTab() {
  const { state, perform } = useGame();
  const [partnerId, setPartnerId] = useState(state.capitalMarkets.rivals[0]?.id ?? "");
  const [volume, setVolume] = useState("25");
  const [weeks, setWeeks] = useState("12");
  const history = state.market.priceHistory;
  const max = Math.max(...history);
  const min = Math.min(...history);
  const b2bUnlocked = state.unlockedModules.includes("b2b_trade");
  const partner = state.capitalMarkets.rivals.find((company) => company.id === partnerId);
  const contractPrice = Math.round(externalRoastedPricePerKg(state.market.futuresPricePerKg) * 1.15 * 100) / 100;

  return (
    <>
      <Section title="Kaffee-Futures">
        <Panel>
          <div className="flex items-center gap-3">
            <img src={COMPANY_ARTWORK.port} alt="Isometrischer Kaffee-Handelshafen" className="h-24 w-32 shrink-0 rounded-lg bg-artwork object-contain p-1" />
            <div className="text-sm"><div className="font-semibold">Hafen & Terminmarkt</div></div>
          </div>
        </Panel>
        <Panel>
          <div className="flex h-20 items-end gap-0.5">{history.slice(-40).map((price, index) => <div key={index} className="flex-1 rounded-t bg-primary/70" style={{ height: `${20 + ((price - min) / (max - min || 1)) * 80}%` }} />)}</div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Volatilität {state.market.volatility}%/Wo</span><span>Extern geröstet: {externalRoastedPricePerKg(state.market.futuresPricePerKg).toFixed(2)} €/kg</span></div>
        </Panel>
      </Section>

      <Section title={`Bohnen einkaufen · ${state.market.beanVarieties.length} Sorten`}>
        {!state.roastery.owned && <Empty><Lock className="mx-auto mb-1 h-4 w-4" />Kaufe zuerst eine Rösterei, um Bohnen einzulagern.</Empty>}
        {state.market.beanVarieties.map((bean) => <Panel key={bean.id}>
          <div className="flex items-start gap-3"><Sprite sheet="logistics" index={0} className="h-14 w-14" />
            <div className="min-w-0 flex-1 text-sm"><div className="font-semibold">{bean.name}</div><div className="text-xs text-muted-foreground">{bean.originCountry} · Qualität {bean.qualityScore} · {beanPricePerKg(state, bean.id).toFixed(2)} €/kg</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{bean.flavorProfile}</p></div></div>
          <div className="mt-2 grid grid-cols-2 gap-2"><Button size="sm" variant="outline" disabled={!state.roastery.owned} onClick={() => perform((current) => buyBeans(current, bean.id, 10))}><PackageOpen /> 10 kg</Button><Button size="sm" variant="outline" disabled={!state.roastery.owned} onClick={() => perform((current) => buyBeans(current, bean.id, 50))}>50 kg</Button></div>
        </Panel>)}
      </Section>

      <Section title="B2B-Vertrag abschließen">
        {!b2bUnlocked ? <Empty><Lock className="mx-auto mb-1 h-4 w-4" />Wird mit eigener Rösterei und höherem Firmenwert freigeschaltet.</Empty> : <Panel>
          <label className="text-xs text-muted-foreground">Geschäftspartner
            <select aria-label="B2B-Geschäftspartner" className={`${inputClass} mt-1`} value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>{state.capitalMarkets.rivals.filter((company) => !company.acquired).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">kg pro Woche<input aria-label="B2B-Menge pro Woche" type="number" min="1" max="1000" className={`${inputClass} mt-1`} value={volume} onChange={(event) => setVolume(event.target.value)} /></label>
            <label className="text-xs text-muted-foreground">Laufzeit in Wochen<input aria-label="B2B-Laufzeit" type="number" min="4" max="52" className={`${inputClass} mt-1`} value={weeks} onChange={(event) => setWeeks(event.target.value)} /></label>
          </div>
          <Button className="mt-3 w-full" onClick={() => perform((current) => signB2BContract(current, partner?.name ?? "", Number(volume), Number(weeks), contractPrice))}><FileSignature /> Abschließen · {contractPrice.toFixed(2)} €/kg</Button>
        </Panel>}
      </Section>

      <Section title="Aktive Lieferverträge">
        {state.b2b.contracts.length === 0 ? <Empty>Keine aktiven Verträge.</Empty> : state.b2b.contracts.map((contract) => <Panel key={contract.id}><div className="flex justify-between gap-3 text-sm"><span>{contract.partnerName}</span><span className="text-right text-muted-foreground">{contract.volumeKgPerWeek} kg/Wo · {eur(contract.volumeKgPerWeek * contract.pricePerKg)}<br />{contract.weeksRemaining} Wochen verbleibend</span></div></Panel>)}
      </Section>
    </>
  );
}
