import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, Fragment } from "react";
import { Map, Coffee, Ship, Building2, Briefcase } from 'lucide-react';
import { HUD } from "@/game/sheetArt";
import { GameProvider, useGame } from "@/game/GameContext";
import { Button } from "@/components/ui/button";
import { SceneView, type Place } from "@/game/SceneView";
import { TopBar, NextWeekButton } from "@/game/TopBar";
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
import { MenuTrendBoard } from '@/game/MenuTrendBoard';
import { LogisticsMap } from '@/game/LogisticsMap';
import { OmnichannelHub } from '@/game/OmnichannelHub';
import { RivalsHub } from '@/game/RivalsHub';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bean Baron Tycoon – Kaffee-Imperium" },
      { name: "description", content: "Baue dein Kaffee-Imperium vom Kiosk zum Börsenkonzern: 20 Städte, Farm-to-Cup, Franchise, Enterprise und Rivalen." },
      { property: "og:title", content: "Bean Baron Tycoon – Kaffee-Imperium" },
      { property: "og:description", content: "600 Standorte, Stadtviertel, Konkurrenz und internationale Expansion in Coffee Empire." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

const TABS = [
  { id: "map", label: "Stadt", icon: Map },
  { id: "empire", label: "Café", icon: Coffee },
  { id: "supply", label: "Supply", icon: Ship },
  { id: "expansion", label: "Expansion", icon: Building2 },
  { id: "finance", label: "Finanzen/HQ", icon: Briefcase },
] as const;
const SECTIONS = {
  map: [['city', 'Stadtkarte'], ['airport', 'Reisen'], ['rivals', 'Rivalen & Immobilien']],
  empire: [['stores', 'Filialen'], ['menu', 'Menü & Bewertungen'], ['marketing', 'Marketing']],
  supply: [['roastery', 'Rösterei'], ['market', 'Bohnenmarkt'], ['farms', 'Fincas & Fracht']],
  expansion: [['chain', 'Kette'], ['franchise', 'Franchise'], ['b2b', 'Enterprise'], ['retail', 'Supermärkte']],
  finance: [['accounting', 'Berichte'], ['bank', 'Bank'], ['stocks', 'Aktien & Startups'], ['hq', 'Leitung'], ['research', 'Forschung'], ['progress', 'Fortschritt']],
} as const;

function Game() {
  return <GameProvider><GameWorld /></GameProvider>;
}
function GameWorld() {
  const { loaded } = useGame();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("map");
  const [place, setPlace] = useState<Place>('cafe');
  const [section, setSection] = useState('city');
  const [progressOpen, setProgressOpen] = useState(false);
  const [splash, setSplash] = useState(true);
  const touch = useRef<{ x: number; y: number; skip: boolean } | null>(null);
  const swipeStart = (e: React.TouchEvent) => { const t = e.touches[0]; if (!t) return; const el = e.target as HTMLElement; touch.current = { x: t.clientX, y: t.clientY, skip: !!el.closest('input, textarea, select, [role=slider], .management-switch, .cafe-editor, .overflow-x-auto, [data-no-swipe], .city-map-section') }; };
  const swipeEnd = (e: React.TouchEvent, ids: string[]) => { const s = touch.current; touch.current = null; const t = e.changedTouches[0]; if (!s || s.skip || !t) return; const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return; const i = ids.indexOf(section), next = ids[i + (dx < 0 ? 1 : -1)];
    if (next) { setSection(next); window.scrollTo(0, 0); } };
  useEffect(() => { document.querySelector('.management-switch [aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); }, [section]);
  useEffect(() => { if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const content = section === 'city' ? <MapTab /> : section === 'airport' ? <MapTab airportOnly />
    : section === 'rivals' ? <><RivalsHub area="rivals" /><div className="mt-5"><RivalsHub area="property" /></div></>
    : section === 'menu' ? <><MenuTrendBoard /><div className="mt-5"><MenuTrendBoard reviewsOnly /></div></> : section === 'reviews' ? <MenuTrendBoard reviewsOnly />
    : section === 'progress' ? <ProgressPanel /> : section === 'hq' ? <><HQPanel /><div className="mt-5"><SectionFilter.Provider value={['Holding', 'Letzte Woche']}><EmpireTab /></SectionFilter.Provider><MasterCatalog only={['tenant']} embedded title="Büromieter" /></div><ExecEffects /><div className="mt-5 space-y-3"><MasterCatalog only={['training']} embedded title="Weiterbildung" /></div></>
    : section === 'accounting' ? <AccountingPanel />
    : section === 'research' ? <><ResearchHub /><div className="mt-5"><LabPanel /></div></>
    : section === 'marketing' ? <MarketingHub /> : section === 'startups' ? <VentureHub /> : section === 'stocks' ? <><SectionFilter.Provider value={['Aktienmarkt']}><FinanceTab /></SectionFilter.Provider><div className="mt-5"><VentureHub /></div></> : section === 'bank' ? <><SectionFilter.Provider value={['Bankkredit']}><FinanceTab /></SectionFilter.Provider></>
    : section === 'chain' || section === 'franchise' || section === 'b2b' || section === 'retail' ? <OmnichannelHub area={section} />
    : section === 'roastery' || section === 'farms' || section === 'market' ? <LogisticsMap area={section === 'market' ? 'beans' : section} />
    : <SectionFilter.Provider value={section === 'stores' ? ['Filialen'] : section === 'holding' ? ['Holding', 'Letzte Woche'] : section === 'bank' ? ['Bankkredit'] : ['Aktienmarkt']}>
      {section === 'stores' || section === 'holding' ? <EmpireTab /> : <FinanceTab />}
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
        <main className="game-main pb-28 pt-[calc(6.25rem+env(safe-area-inset-top))]">{loaded ? <><div className="management-switch" aria-label="Managementbereiche">{SECTIONS[tab].map(([id, label]) => <Button key={id} variant={section === id ? 'secondary' : 'ghost'} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</Button>)}</div><div className="management-content" key={section} onTouchStart={swipeStart} onTouchEnd={e => swipeEnd(e, SECTIONS[tab].map(([id]) => id))}>{content}</div></> : <div className="loading-game">Bean Baron Tycoon …</div>}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-3xl grid-cols-6">
            {TABS.map((t, i) => (<Fragment key={t.id}>{i === 2 && <NextWeekButton />}
              <Button variant="ghost" aria-label={t.label} aria-current={tab === t.id ? 'page' : undefined} onClick={() => { setTab(t.id); setSection(SECTIONS[t.id][0][0]); setPlace('cafe'); window.scrollTo(0, 0); }} className={`nav-tab flex h-16 flex-col items-center gap-1 py-2.5 text-[11px] transition ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                <><t.icon className="h-6 w-6" />{t.label}</>
              </Button></Fragment>
            ))}
          </div>
        </nav>
      </div>
  );
}
