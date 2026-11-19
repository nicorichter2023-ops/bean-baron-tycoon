import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { eur, useGame } from './GameContext';
import { Panel, Section } from './ui';
import { ensureLiving, buyStake, sellStake, ventureInvest, takeOverCompany, sellCompany, listCompany } from '@/engine/v2';
import { portfolioValue } from '@/engine/v2/market';
import { HubHeader } from './HubHeader';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const pretty = (s: string) => s.replace(/\[Wirkung: ([^\]]*)\]/, (_, w: string) => `(${w.replace(/branche\.|ziel\./g, '').replace(/;/g, ',').replace(/-(\d)/g, '−$1')})`).replace(/(\p{L})-(\p{L})/gu, '$1 $2').replace(/kuehl/g, 'kühl');

/** 2.0 world market: news ticker, listed shares and venture rounds from engine/v2. */
export function LivingMarket() {
  const { state, perform } = useGame();
  const live = ensureLiving(state);
  const [mode, setMode] = useState('listed');
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState<number | null>(null);
  const firms = [...live.market.firmen].filter(f => mode === 'portfolio' ? f.anteilSpieler > 0 : mode === 'listed' ? f.kurs != null && f.phase !== 'pleite' : f.kurs === null && f.phase !== 'uebernommen').sort((a, b) => b.bewertung - a.bewertung);
  const lastPage = Math.max(0, Math.ceil(firms.length / 4) - 1);
  const currentPage = Math.min(page, lastPage);
  const phases: Record<string, string> = { seed: 'Gründung', series_a: 'Finanzierungsrunde A', growth: 'Wachstum', ipo_reif: 'Börsenreif', stabil: 'Etabliert', krise: 'Krise', pleite: 'Insolvent', uebernommen: 'Übernommen' };
  return <Section title={`Aktienmarkt · Weltmarkt · Portfolio ${eur(portfolioValue(live.market))}`}>
    <HubHeader art="stocks" eyebrow="Konzern · Kapitalmarkt" title="Weltmarkt" />
    <div className="flex gap-1 py-2" role="tablist" aria-label="Weltmarkt">{[['listed', 'Aktien'], ['private', 'Venture'], ['portfolio', 'Portfolio']].map(([id, label]) => <Button key={id} role="tab" aria-selected={mode === id} variant={mode === id ? 'secondary' : 'ghost'} onClick={() => { setMode(id ?? 'listed'); setPage(0); setConfirm(null); }}>{label}</Button>)}</div>
    <Panel><p className="eyebrow">Weltnachrichten</p>
      {live.news.length ? <ul className="mt-1 space-y-1 text-xs">{live.news.slice(0, 4).map((n, i) => <li key={i}><span className="text-muted-foreground">Wo {n.woche} · </span>{pretty(n.text)}</li>)}</ul> : <p className="text-xs text-muted-foreground">Noch ruhig – Ereignisse erscheinen nach den ersten Wochen.</p>}
    </Panel>
    {!firms.length && <p className="py-3 text-sm text-muted-foreground">Keine Beteiligungen in dieser Auswahl.</p>}
    <div className="grid gap-2 sm:grid-cols-2">{firms.slice(currentPage * 4, currentPage * 4 + 4).map(f => {
      const up = f.trend >= 0, listed = f.kurs != null && f.phase !== 'pleite';
      const pe = f.phase === 'uebernommen' && f.anteilSpieler >= .999;
      const takeoverCost = (1 - f.anteilSpieler) * f.bewertung * 1.25;
      const privateInvest = f.kurs === null && ['seed', 'series_a', 'growth'].includes(f.phase);
      return <Panel key={f.id}><div className="flex items-start justify-between gap-2 text-sm">
        <div><strong>{f.name}</strong><div className="text-xs text-muted-foreground">{pretty(f.branche)} · {phases[f.phase]}{f.anteilSpieler > 0 ? ` · Anteil ${(f.anteilSpieler * 100).toFixed(2)} % · ${eur(f.anteilSpieler * f.bewertung)}` : ''}</div></div>
        <div className="text-right font-mono"><div>{eur(f.bewertung)}</div><div className={up ? 'text-success' : 'text-destructive'}>{up ? '▲' : '▼'} {(Math.abs(f.trend) * 100).toFixed(1)} %</div></div></div>
        <div className="market-actions">{listed && <><Button size="sm" disabled={state.cash < 5000} onClick={() => perform(g => buyStake(g, f.id, 5000 / Math.max(1, f.bewertung)))}>5 Tsd € + Gebühren</Button><Button size="sm" variant="outline" disabled={f.anteilSpieler <= 0} onClick={() => perform(g => sellStake(g, f.id, f.anteilSpieler))}>Alles verkaufen</Button></>}
          {privateInvest && <Button size="sm" variant="secondary" disabled={state.cash < 25000} onClick={() => perform(g => ventureInvest(g, f.id, 25000))}>{f.anteilSpieler > 0 ? 'Nachfinanzieren' : 'Venture'} · 25 Tsd €</Button>}
          {f.phase === 'ipo_reif' && f.anteilSpieler > 0 && <Button size="sm" onClick={() => perform(g => listCompany(g, f.id))}>Börsengang starten</Button>}
          {pe ? <Button size="sm" variant="outline" onClick={() => setConfirm(f.id)}>Firma verkaufen · {eur(f.bewertung * .85)}</Button> : !['pleite', 'uebernommen'].includes(f.phase) && <Button size="sm" variant="outline" disabled={state.cash < takeoverCost} onClick={() => setConfirm(f.id)}>Übernahme · {eur(takeoverCost)}</Button>}
        </div>
        {confirm === f.id && <div className="mt-2 border-t border-border pt-2 text-xs"><p>{pe ? 'Verkauf zu 85 % des Firmenwerts. Künftige Gewinne entfallen.' : 'Vollständige Übernahme mit 25 % Aufschlag auf den Restanteil. Firmengewinne und Krisenrisiko gehen an dich.'}</p><div className="market-actions"><Button size="sm" onClick={() => { perform(g => pe ? sellCompany(g, f.id) : takeOverCompany(g, f.id)); setConfirm(null); }}>Bestätigen</Button><Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Abbrechen</Button></div></div>}
      </Panel>;
    })}</div>
    <div className="flex items-center justify-between"><Button size="icon" variant="ghost" aria-label="Vorherige Firmen" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><span className="text-xs text-muted-foreground">{currentPage + 1} / {lastPage + 1} · {firms.length} Firmen</span><Button size="icon" variant="ghost" aria-label="Weitere Firmen" disabled={currentPage >= lastPage} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div>
  </Section>;
}
