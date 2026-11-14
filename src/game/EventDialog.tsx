import { CalendarClock, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { applyEventChoice } from "@/engine";
import { eur, useGame } from "./GameContext";

export function EventDialog() {
  const { state, perform } = useGame();
  const event = state.pendingEvent;

  return (
    <Dialog open={Boolean(event)} onOpenChange={() => undefined}>
      <DialogContent
        showClose={false}
        className="max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-2xl border-primary/30 p-5"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        {event && (
          <>
            <DialogHeader className="text-left">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <CalendarClock className="h-4 w-4" /> Ereignis · Woche {state.week}
              </div>
              <DialogTitle className="pr-2 font-display text-2xl leading-tight">{event.title}</DialogTitle>
              <DialogDescription className="pt-2 leading-relaxed">{event.description}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {event.choices.map((choice, index) => (
                <Button
                  key={choice.text}
                  variant="outline"
                  className="h-auto min-h-16 items-start justify-start whitespace-normal px-4 py-3 text-left"
                  onClick={() => perform((current) => applyEventChoice(current, index))}
                >
                  <Sparkles className="mt-0.5 text-primary" />
                  <span className="flex-1">
                    <span className="block font-semibold">{choice.text}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      Barvermögen {choice.cashImpact >= 0 ? "+" : ""}{eur(choice.cashImpact)} · Reputation {choice.reputationImpact >= 0 ? "+" : ""}{choice.reputationImpact} · Bohnenpreis ×{choice.beanPriceMultiplier}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">Wähle eine Option, um das Spiel fortzusetzen.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
