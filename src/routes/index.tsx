import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Plane } from 'lucide-react';
import { HUD } from "@/game/sheetArt";
import { GameProvider, useGame } from "@/game/GameContext";
import { Button } from "@/components/ui/button";
import { SceneView, type Place } from "@/game/SceneView";
import { TopBar } from "@/game/TopBar";
import { MapTab } from "@/game/tabs/MapTab";
import { EventDialog } from "@/game/EventDialog";
import { EmpireTab } from '@/game/tabs/EmpireTab';
import { FinanceTab } from '@/game/tabs/FinanceTab';
import { MarketTab } from '@/game/tabs/MarketTab';
import { SectionFilter } from '@/game/ui';
import { HQPanel } from '@/game/HQPanel';
import { AccountingPanel } from '@/game/AccountingPanel';
import { LabPanel } from '@/game/LabPanel';
import { MasterCatalog } from '@/game/MasterCatalog';
import { ProgressPanel } from '@/game/ProgressPanel';
import { SplashScreen } from "@/game/Intro";
import { WeekSummary } from '@/game/WeekSummary';
import { ResearchHub } from '@/game/ResearchHub';
import { MarketingHub } from '@/game/MarketingHub';
import { VentureHub } from '@/game/VentureHub';
import { SupplyPanel } from '@/game/SupplyPanel';
import { ChainPanel, ExecEffects } from '@/game/ChainPanel';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bean Baron Tycoon – Kaffee-Imperium" },
      { name: "description", content: "Baue dein Kaffee-Imperium in 20 Städten mit 600 Standorten, Flughafenreisen, Rivalen und Konzernforschung." },
      { property: "og:title", content: "Bean Baron Tycoon – Kaffee-Imperium" },
      { property: "og:description", content: "600 Standorte, Stadtviertel, Konkurrenz und internationale Expansion in Coffee Empire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

const TABS = [
  { id: "map", label: "Stadtkarte", icon: HUD.map },
  { id: "empire", label: "Café", icon: HUD.empire },
  { id: "hq", label: "HQ", icon: HUD.market },
  { id: "finance", label: "Finanzen", icon: HUD.finance },
  { id: "airport", label: "Flughafen", icon: undefined },
] as const;
const SECTIONS = {
  empire: [['stores', 'Filialen'], ['chain', 'Kette'], ['roastery', 'Rösterei & Plantagen']],
  hq: [['progress', 'Fortschritt'], ['hq', 'Leitung & Personal'], ['research', 'Forschung & Rezepte'], ['marketing', 'Marketing'], ['holding', 'Holding']],
  finance: [['accounting', 'Accounting'], ['bank', 'Bank'], ['stocks', 'Aktien & M&A'], ['market', 'Bohnenmarkt'], ['b2b', 'B2B'], ['startups', 'Startups']],
} as const;

function Game() {
  return <GameProvider><GameWorld /></GameProvider>;
}
function GameWorld() {
  const { loaded } = useGame();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("map");
  const [place, setPlace] = useState<Place>('cafe');
  const [section, setSection] = useState('stores');
  const [progressOpen, setProgressOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const touch = useRef<{ x: number; y: number; skip: boolean } | null>(null);
  const swipeStart = (e: React.TouchEvent) => { const t = e.touches[0]!; const el = e.target as HTMLElement; touch.current = { x: t.clientX, y: t.clientY, skip: !!el.closest('input, textarea, [role=slider], .management-switch, .cafe-editor, .overflow-x-auto, [data-no-swipe]') }; };
  const swipeEnd = (e: React.TouchEvent, ids: string[]) => { const s = touch.current; touch.current = null; if (!s || s.skip) return; const t = e.changedTouches[0]!; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return; const i = ids.indexOf(section), next = ids[i + (dx < 0 ? 1 : -1)];
    if (next) { setSection(next); setPlace(next === 'roastery' ? 'roastery' : 'cafe'); window.scrollTo(0, 0); } };
  useEffect(() => { document.querySelector('.management-switch [aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [section]);
  useEffect(() => { if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const destinations: Place[] = section === 'roastery' ? ['roastery', 'port', 'exchange', 'farm'] : ['cafe', 'terrace'];
  const content = section === 'progress' ? <ProgressPanel /> : section === 'hq' ? <><HQPanel /><ExecEffects /><div className="mt-5 space-y-3"><MasterCatalog only={['candidate', 'training']} embedded title="Talente & Weiterbildung" /></div></> : section === 'accounting' ? <AccountingPanel />
    : section === 'research' ? <><ResearchHub /><div className="mt-5"><LabPanel /></div></> : section === 'marketing' ? <><MarketingHub /><div className="mt-5 space-y-3"><MasterCatalog only={['policy']} embedded title="Stadtpolitik" /></div></> : section === 'startups' ? <VentureHub /> : section === 'chain' ? <ChainPanel />
    : section === 'roastery' ? <><SupplyPanel /><div className="mt-5 space-y-3"><MasterCatalog only={['plantation', 'future']} embedded title="Plantagen & Preisabsicherung" /></div><div className="mt-5"><SceneView place={place} onPlace={setPlace} destinations={destinations} /></div></>
    : <SectionFilter.Provider value={section === 'stores' ? ['Filialen'] : section === 'new' ? ['Neue Filiale'] : section === 'holding' ? ['Holding', 'Letzte Woche'] : section === 'startups' ? ['VC-Startups'] : section === 'bank' ? ['Bankkredit'] : section === 'stocks' ? ['Aktienmarkt'] : section === 'market' ? ['Kaffee-Futures', 'Bohnen einkaufen'] : ['B2B-Vertrag', 'Aktive Lieferverträge']}>
      {tab === 'empire' || section === 'holding' ? <EmpireTab /> : section === 'market' || section === 'b2b' ? <MarketTab /> : <FinanceTab />}
      {section === 'holding' && <div className="mt-5 space-y-3"><MasterCatalog only={['tenant']} embedded title="Büromieter" /></div>}
      {section === 'stocks' && <div className="mt-5 space-y-3"><MasterCatalog only={['underwriter']} embedded title="Börsengang" /></div>}
    </SectionFilter.Provider>;
  return (
      <div className="game-world mx-auto min-h-dvh max-w-5xl bg-background">
        <TopBar onProgress={() => setProgressOpen(true)} />
        {splash && <SplashScreen ready={loaded} onDone={() => setSplash(false)} />}
        <EventDialog />
        <WeekSummary />
        <Sheet open={progressOpen} onOpenChange={setProgressOpen}><SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto px-0"><SheetHeader className="px-3"><SheetTitle>Fortschritt</SheetTitle></SheetHeader><ProgressPanel /></SheetContent></Sheet>
        <main className="game-main pb-28 pt-[calc(6.25rem+env(safe-area-inset-top))]">{loaded ? tab === 'map' || tab === 'airport' ? <MapTab key={tab} airportOnly={tab === 'airport'} /> : <><div className="management-switch" aria-label="Managementbereiche">{SECTIONS[tab].map(([id, label]) => <Button key={id} variant={section === id ? 'secondary' : 'ghost'} aria-pressed={section === id} onClick={() => { setSection(id); setPlace(id === 'roastery' ? 'roastery' : 'cafe'); }}>{label}</Button>)}</div><div className="management-content" key={section} onTouchStart={swipeStart} onTouchEnd={e => swipeEnd(e, SECTIONS[tab].map(([id]) => id))}>{content}</div><p className="swipe-hint" aria-hidden>← wischen für weitere Bereiche →</p></> : <div className="loading-game">Coffee Empire …</div>}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-5">
            {TABS.map((t) => (
              <Button variant="ghost" aria-label={t.label} aria-current={tab === t.id ? 'page' : undefined} key={t.id} onClick={() => { setTab(t.id); setSection(t.id === 'hq' ? 'progress' : t.id === 'finance' ? 'accounting' : 'stores'); setPlace('cafe'); window.scrollTo(0, 0); }} className={`nav-tab flex h-16 flex-col items-center gap-1 py-2.5 text-[11px] transition ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                <>{t.icon ? <img src={t.icon} alt="" className="h-7 w-7 object-contain" /> : <Plane className="h-7 w-7" />}{t.label}</>
              </Button>
            ))}
          </div>
        </nav>
      </div>
  );
}
