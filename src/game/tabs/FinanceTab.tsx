import { useState } from "react";
import { HubHeader } from '@/game/HubHeader';
import { Banknote, Building, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeSlot, buyShares, repayLoan, resetGame, sellShares, setActiveSlot, slotSummaries, takeLoan } from "@/engine";
import { createInitialState } from "@/data";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";
import { COMPANY_ARTWORK } from "../artwork";
import { rivalArt } from '../sheetArt';
import { effectiveInterestRate } from '@/engine/management';
import { acquireRivalWithStores } from '@/engine/empire';
import { takeoverMajority, tycoonOf, setDividend } from '@/engine/tycoon';

const inputClass = "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground";

export function FinanceTab() {
  const { state, set, perform } = useGame();
  const [loanAmount, setLoanAmount] = useState("10000");
  const [shareCount, setShareCount] = useState(1000);
  const marketsUnlocked = state.unlockedModules.includes("capital_markets");
  const amount = Number(loanAmount);

  return (
    <>
      <Section title="Bankkredit">
        <Panel><div className="flex items-center gap-3 text-sm"><Banknote className="h-6 w-6 text-primary" />
          <div className="flex-1"><div className="font-semibold">Schulden {eur(state.debt)}</div><div className="text-xs text-muted-foreground">Zins {(effectiveInterestRate(state) * 100).toFixed(3)}% pro Woche · Rahmen bis {eur(Math.max(250000, state.companyValuation))}</div></div></div>
          <label className="mt-3 block text-xs text-muted-foreground">Betrag in Euro<input aria-label="Kreditbetrag" type="number" min="1" step="1000" className={`${inputClass} mt-1`} value={loanAmount} onChange={(event) => setLoanAmount(event.target.value)} /></label>
          <div className="mt-2 grid grid-cols-2 gap-2"><Button onClick={() => perform((current) => takeLoan(current, amount))}>Aufnehmen</Button><Button variant="outline" onClick={() => perform((current) => repayLoan(current, amount))}>Tilgen</Button></div>
        </Panel>
      </Section>

      <Section title={`Aktienmarkt · ${state.capitalMarkets.rivals.length} Firmen`}>
        <HubHeader art="stocks" eyebrow="Kapitalmarkt" title="Börse & Beteiligungen"><p className="text-xs text-muted-foreground">Handle Aktien, übernimm Konkurrenten und baue deine Holding aus.</p></HubHeader>
        <label className="master-form">Aktien pro Auftrag<input aria-label="Aktien pro Auftrag" type="number" min={1} step={1} value={shareCount} onChange={e => setShareCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))} /></label>
        {state.capitalMarkets.isPublic && <div className="flex flex-wrap gap-2 py-3">{([0, .1, .25] as const).map(rate => <Button key={rate} variant={tycoonOf(state).dividendRate === rate ? 'secondary' : 'outline'} onClick={() => perform(g => setDividend(g, rate))}>{rate * 100} % Gewinn als Dividende</Button>)}</div>}
        {!marketsUnlocked && <Empty><Lock className="mx-auto mb-1 h-4 w-4" />Handel und Übernahmen ab Firmenwert {eur(15_000_000)}. Alle Kurse sind bereits sichtbar.</Empty>}
        {state.capitalMarkets.rivals.map((company) => {
          const holding = state.capitalMarkets.holdings.find((item) => item.companyId === company.id);
          return <Panel key={company.id}>
            <div className="flex items-start gap-3"><img src={rivalArt(state.capitalMarkets.rivals.indexOf(company))} alt="" className="h-12 w-12 shrink-0 object-contain" /><div className="min-w-0 flex-1 text-sm"><div className="font-semibold">{company.name}</div><div className="text-xs text-muted-foreground">{company.ticker} · {company.sharePrice.toFixed(2)} € · Dividende {(company.dividendYield * 100).toFixed(1)}% p.a.</div></div>{holding && <span className="text-xs font-mono">{holding.shares} Stk.</span>}</div>
            <p className="mt-1 text-xs text-muted-foreground">{company.description}</p>
            {company.acquired ? <p className="mt-2 text-xs font-semibold text-success">Zum Imperium gehörig</p> : <>
              <div className="mt-2 grid grid-cols-2 gap-2"><Button size="sm" variant="outline" disabled={!marketsUnlocked} onClick={() => perform((current) => buyShares(current, company.id, shareCount))}>{shareCount.toLocaleString('de-DE')} kaufen</Button><Button size="sm" variant="outline" disabled={!marketsUnlocked || !holding} onClick={() => perform((current) => sellShares(current, company.id, shareCount))}>{shareCount.toLocaleString('de-DE')} verkaufen</Button></div>
              <p className="text-xs text-muted-foreground mt-2">Beteiligung {((holding?.shares ?? 0) / company.sharesOutstanding * 100).toFixed(2)} %</p>
              <Button variant="outline" className="mt-2 w-full" disabled={!holding || holding.shares < Math.ceil(company.sharesOutstanding * .51)} onClick={() => perform(g => takeoverMajority(g, company.id))}>51 %-Übernahme · Netz, Rösterei & Verträge</Button>
              <Button size="sm" variant="ghost" className="mt-1 w-full text-xs" disabled={!marketsUnlocked} onClick={() => perform((current) => acquireRivalWithStores(current, company.id, Math.round(company.valuation * 1.45)))}><Building /> Firma samt Cafés übernehmen · {eur(company.valuation * 1.45)}</Button>
            </>}
          </Panel>;
        })}
      </Section>

      <Section title="Spielstand">
        <div className="grid grid-cols-3 gap-2">
          {slotSummaries().map((info) => <Button key={info.slot} variant={info.slot === activeSlot() ? "default" : "outline"} className="h-auto min-h-14 flex-col gap-0 py-2" onClick={() => { if (info.slot !== activeSlot()) { setActiveSlot(info.slot); window.location.reload(); } }}>
            <strong>Platz {info.slot}</strong>
            <small className="text-xs opacity-80">{info.empty ? "leer" : `Woche ${info.week} · ${info.stores} Cafés`}</small>
          </Button>)}
        </div>
        <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => { if (confirm(`Spielstand auf Platz ${activeSlot()} wirklich löschen?`)) { resetGame(); set(() => createInitialState()); } }}><RotateCcw /> Neues Spiel auf Platz {activeSlot()}</Button>
      </Section>
    </>
  );
}
