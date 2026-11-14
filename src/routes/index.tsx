import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Globe2, ArrowLeftRight, Landmark } from "lucide-react";
import { GameProvider, useGame } from "@/game/GameContext";
import { Button } from "@/components/ui/button";
import { SceneView, type Place } from "@/game/SceneView";
import { TopBar } from "@/game/TopBar";
import { MapTab } from "@/game/tabs/MapTab";
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
  { id: "empire", label: "Imperium", icon: Building2 },
  { id: "map", label: "Weltkarte", icon: Globe2 },
  { id: "market", label: "Markt & B2B", icon: ArrowLeftRight },
  { id: "finance", label: "Finanzen", icon: Landmark },
] as const;

function Game() {
  return <GameProvider><GameWorld /></GameProvider>;
}
function GameWorld() {
  const { loaded } = useGame();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("empire");
  const [place, setPlace] = useState<Place>('cafe');
  useEffect(() => { if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const destinations: Place[] = tab === 'empire' ? ['cafe', 'terrace', 'holding'] : tab === 'market' ? ['roastery', 'port', 'exchange', 'farm'] : ['office', 'holding', 'negotiation'];
  return (
      <div className="game-world mx-auto min-h-dvh max-w-5xl bg-background">
        <TopBar />
        <EventDialog />
        <main className="game-main pb-28 pt-[calc(5.5rem+env(safe-area-inset-top))]">{loaded ? tab === 'map' ? <MapTab /> : <SceneView place={place} onPlace={setPlace} destinations={destinations} /> : <div className="loading-game">Coffee Empire …</div>}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-4">
            {TABS.map((t) => (
              <Button variant="ghost" aria-label={t.label} aria-current={tab === t.id ? 'page' : undefined} key={t.id} onClick={() => { setTab(t.id); setPlace(t.id === 'market' ? 'roastery' : t.id === 'finance' ? 'office' : 'cafe'); window.scrollTo(0, 0); }} className={`nav-tab flex h-16 flex-col items-center gap-1 py-2.5 text-[11px] transition ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                <t.icon className="h-5 w-5" />{t.label}
              </Button>
            ))}
          </div>
        </nav>
      </div>
  );
}
