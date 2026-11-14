import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Globe2, ArrowLeftRight, Landmark } from "lucide-react";
import { GameProvider } from "@/game/GameContext";
import { TopBar } from "@/game/TopBar";
import { EmpireTab } from "@/game/tabs/EmpireTab";
import { MapTab } from "@/game/tabs/MapTab";
import { MarketTab } from "@/game/tabs/MarketTab";
import { FinanceTab } from "@/game/tabs/FinanceTab";
import { EventDialog } from "@/game/EventDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Coffee Empire – Kaffee-Tycoon" },
      { name: "description", content: "Baue dein Kaffee-Imperium: Cafés, Röstereien, Bohnenmarkt, B2B und Finanzen." },
      { property: "og:title", content: "Coffee Empire – Kaffee-Tycoon" },
      { property: "og:description", content: "Mobiles Tycoon-Spiel rund um Kaffee." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

const TABS = [
  { id: "empire", label: "Imperium", icon: Building2, C: EmpireTab },
  { id: "map", label: "Weltkarte", icon: Globe2, C: MapTab },
  { id: "market", label: "Markt & B2B", icon: ArrowLeftRight, C: MarketTab },
  { id: "finance", label: "Finanzen", icon: Landmark, C: FinanceTab },
] as const;

function Game() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("empire");
  const Active = TABS.find((t) => t.id === tab)!.C;
  return (
    <GameProvider>
      <div className="mx-auto min-h-dvh max-w-md bg-background">
        <TopBar />
        <EventDialog />
        <main className="px-3 pb-28 pt-[calc(5.5rem+env(safe-area-inset-top))]"><Active /></main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" />{t.label}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </GameProvider>
  );
}
