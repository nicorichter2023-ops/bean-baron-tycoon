import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Coins, Volume2, VolumeX } from "lucide-react";
import { GiCoffeeBeans, GiFactory, GiSailboat, GiCog } from "react-icons/gi";
import { useEmpire, calendarOf } from "@/store/gameStore";
import { play, setMuted } from "@/services/audio";
import { MotionSheet, CoinPopup, NewspaperEvent } from "@/components/fx/Motion";
import type { Lot } from "@/components/map/isoMapData";

const PixiCityMap = lazy(() => import("@/components/map/PixiCityMap"));

export const Route = createFileRoute("/karte")({
  head: () => ({ meta: [
    { title: "Stadtkarte – Coffee Empire" },
    { name: "description", content: "Isometrische Stadtkarte mit Cafés, Röstereien und Bauplätzen." },
    { property: "og:title", content: "Stadtkarte – Coffee Empire" },
    { property: "og:description", content: "Isometrische Stadtkarte mit Cafés, Röstereien und Bauplätzen." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: KartePage,
});

function KartePage() {
  const s = useEmpire();
  const [lot, setLot] = useState<Lot | null>(null);
  const [pop, setPop] = useState<{ id: number; amount: number } | null>(null);
  const [news, setNews] = useState<{ title: string; text: string } | null>(null);
  useEffect(() => { useEmpire.persist.rehydrate(); }, []);
  useEffect(() => { setMuted(s.muted); }, [s.muted]);
  const onSelect = useCallback((l: Lot) => { setLot(l); play("click"); }, []);
  const { year, weekOfYear } = calendarOf(s.week);
  const week = () => {
    const amount = 300 + Math.round(Math.random() * 400);
    s.addCapital(amount); s.nextWeek(); setPop({ id: Date.now(), amount }); play("coin");
    if (Math.random() < 0.2) { setNews({ title: "Extrablatt!", text: "Frachter aus Santos eingetroffen – Bohnenpreise fallen." }); play("newspaper"); }
  };
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 p-2 text-sm">
        <span className="flex items-center gap-1"><Coins size={16} />{s.capital.toLocaleString("de-DE")} €</span>
        <span className="flex items-center gap-1"><GiCoffeeBeans />{s.beans} kg</span>
        <span>KW {weekOfYear} · {year}</span>
        <button className="ml-auto h-11 w-11" aria-label="Ton umschalten" onClick={() => s.setMuted(!s.muted)}>{s.muted ? <VolumeX /> : <Volume2 />}</button>
      </header>
      <div className="relative flex-1">
        <ClientOnly fallback={null}><Suspense fallback={null}><PixiCityMap onSelect={onSelect} /></Suspense></ClientOnly>
      </div>
      <footer className="flex items-center gap-2 p-2">
        <div className="h-10 w-24">
          <ResponsiveContainer><LineChart data={(s.stocks[0]?.history ?? []).map((v) => ({ v }))}><Line dataKey="v" dot={false} stroke="currentColor" /></LineChart></ResponsiveContainer>
        </div>
        <GiSailboat /><GiFactory /><GiCog />
        <button className="ml-auto h-11 rounded-full bg-primary px-5 text-primary-foreground" onClick={week}>Nächste Woche</button>
      </footer>
      <AnimatePresence>{pop && <CoinPopup key={pop.id} {...pop} />}</AnimatePresence>
      <AnimatePresence>{news && <NewspaperEvent {...news} onClose={() => setNews(null)} />}</AnimatePresence>
      <MotionSheet open={!!lot} onClose={() => setLot(null)}>
        {lot && <><h3 className="text-lg font-semibold">Grundstück {lot.x}/{lot.y}</h3><p className="text-sm">Typ: {lot.kind} · {lot.floors} Etage(n)</p>
        <button className="mt-3 h-11 w-full rounded bg-secondary" onClick={() => setLot(null)}>Schließen</button></>}
      </MotionSheet>
    </div>
  );
}
