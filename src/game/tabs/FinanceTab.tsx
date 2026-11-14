import { Banknote, LineChart, Rocket, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions, companyValue, createInitialState, resetGame } from "@/engine";
import { compact, eur, useGame } from "../GameContext";
import { Empty, Panel, Section } from "../ui";

const LOANS = [{ amount: 100_000, rate: 0.06, weeks: 52 }, { amount: 500_000, rate: 0.08, weeks: 104 }];

export function FinanceTab() {
  const { state, set } = useGame();
  return (
    <>
      <Section title="Kredite">
        {LOANS.map((l) => (
          <Panel key={l.amount}><div className="flex items-center gap-3 text-sm"><Banknote className="h-6 w-6 text-primary" />
            <div className="flex-1"><div className="font-semibold">{eur(l.amount)}</div><div className="text-xs text-muted-foreground">{(l.rate * 100).toFixed(0)}% p.a. · {l.weeks} Wochen</div></div>
            <Button size="sm" onClick={() => set((s) => actions.takeLoan(s, l.amount, l.rate, l.weeks))}>Aufnehmen</Button></div></Panel>
        ))}
        {state.loans.map((l) => <Panel key={l.id}><div className="flex justify-between text-sm"><span>Restschuld {eur(l.amount)}</span><span className="text-muted-foreground">{l.weeksLeft} Wo</span></div></Panel>)}
      </Section>
      <Section title="Aktienmarkt">
        <Panel><div className="flex items-center gap-3 text-sm"><LineChart className="h-6 w-6 text-primary" /><div className="flex-1"><div className="font-semibold">Börsengang (IPO)</div><div className="text-xs text-muted-foreground">Ab Firmenwert {compact(10_000_000)} · aktuell {compact(companyValue(state))}</div></div></div></Panel>
      </Section>
      <Section title="VC-Startups"><Empty><Rocket className="mx-auto mb-1 h-5 w-5" />Investment-Pitches folgen mit der Engine.</Empty></Section>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { if (confirm("Spielstand wirklich löschen?")) { resetGame(); set(() => createInitialState()); } }}><RotateCcw /> Neues Spiel</Button>
    </>
  );
}
