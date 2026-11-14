import { Banknote, LineChart, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetGame } from "@/engine";
import { createInitialState } from "@/data";
import { eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

export function FinanceTab() {
  const { state, set } = useGame();
  const cm = state.capitalMarkets;
  return (
    <>
      <Section title="Kredite">
        <Panel><div className="flex items-center gap-3 text-sm"><Banknote className="h-6 w-6 text-primary" />
          <div className="flex-1"><div className="font-semibold">Schulden {eur(state.debt)}</div><div className="text-xs text-muted-foreground">Zins {(state.weeklyInterestRate * 100).toFixed(2)}% pro Woche</div></div></div></Panel>
      </Section>
      <Section title="Aktienmarkt & VC">
        {!state.unlockedModules.includes("capital_markets") ? <Empty><Lock className="mx-auto mb-1 h-4 w-4" />Kapitalmarkt wird später freigeschaltet.</Empty> : (
          <Panel><div className="flex items-center gap-3 text-sm"><LineChart className="h-6 w-6 text-primary" /><span>{cm.isPublic ? `Aktie ${cm.sharePrice.toFixed(2)} € · Börsenwert ${eur(cm.marketCap)}` : "Noch nicht börsennotiert"} · {cm.startups.length} Startups</span></div></Panel>
        )}
      </Section>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { if (confirm("Spielstand wirklich löschen?")) { resetGame(); set(() => createInitialState()); } }}><RotateCcw /> Neues Spiel</Button>
    </>
  );
}
