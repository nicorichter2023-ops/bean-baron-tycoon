import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activeSlot, resetGame, setActiveSlot, slotSummaries } from "@/engine";
import { createInitialState } from "@/data";
import { useGame } from "./GameContext";

/** Three local save slots; switching reloads so game and expansion state come from the same slot. */
export function SaveSlots() {
  const { set } = useGame();
  return <section className="rounded-lg border border-border bg-card p-3 text-sm" aria-label="Spielstand"><h3 className="mb-2 font-semibold">Spielstand</h3>
        <div className="grid grid-cols-3 gap-2">
          {slotSummaries().map((info) => <Button key={info.slot} variant={info.slot === activeSlot() ? "default" : "outline"} className="h-auto min-h-14 flex-col gap-0 py-2" onClick={() => { if (info.slot !== activeSlot()) { setActiveSlot(info.slot); window.location.reload(); } }}>
            <strong>Platz {info.slot}</strong>
            <small className="text-xs opacity-80">{info.empty ? "leer" : `Woche ${info.week} · ${info.stores} Cafés`}</small>
          </Button>)}
        </div>
        <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => { if (confirm(`Spielstand auf Platz ${activeSlot()} wirklich löschen?`)) { resetGame(); set(() => createInitialState()); } }}><RotateCcw /> Neues Spiel auf Platz {activeSlot()}</Button>
  </section>;
}
