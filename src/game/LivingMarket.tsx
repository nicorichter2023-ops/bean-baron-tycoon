import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { eur, useGame } from './GameContext';
import { Panel, Section } from './ui';
import { ensureLiving, buyStake, sellStake, ventureInvest, takeOverCompany, sellCompany, listCompany } from '@/engine/v2';
import { portfolioValue } from '@/engine/v2/market';
import { EXCHANGES, exchangeIndex, exchangeOf, stakeForBudget, stockMetrics, type ExchangeId } from '@/engine/v2/exchange';

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return <svg className="h-8 w-full" />;
  const lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - lo) / span) * 28}`).join(' ');
  const up = data[data.length - 1]! >= data[0]!;
  return <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={`h-8 w-full ${up ? 'text-success' : 'text-destructive'}`} aria-hidden><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" /></svg>;
}
const pct = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)} %`;
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
  const [ex, setEx] = useState<ExchangeId | 'all'>('all');
  const firms = [...live.market.firmen].filter(f => mode !== 'listed' || ex === 'all' || exchangeOf(f) === ex).filter(f => mode === 'portfolio' ? f.anteilSpieler > 0 : mode === 'listed' ? f.kurs != null && f.phase !== 'pleite' : f.kurs === null && f.phase !== 'uebernommen').sort((a, b) => b.bewertung - a.bewertung);
  const lastPage = Math.max(0, Math.ceil(firms.length / 4) - 1);
  const currentPage = Math.min(page, lastPage);
  const phases: Record<string, string> = { seed: 'Gründung', series_a: 'Finanzierungsrunde A', growth: 'Wachstum', ipo_reif: 'Börsenreif', stabil: 'Etabliert', krise: 'Krise', pleite: 'Insolvent', uebernommen: 'Übernommen' };
  return <Section title={`Aktienmarkt · Weltmarkt · Portfolio ${eur(portfolioValue(live.market))}`}>
    <HubHeader art="stocks" eyebrow="Konzern · Kapitalmarkt" title="Weltmarkt" />
    <div className="flex gap-1 py-2" role="tablist" aria-label="Weltmarkt">{[['listed', 'Aktien'], ['private', 'Venture'], ['portfolio', 'Portfolio']].map(([id, label]) => <Button key={id} role="tab" aria-selected={mode === id} variant={mode === id ? 'secondary' : 'ghost'} onClick={() => { setMode(id ?? 'listed'); setPage(0); setConfirm(null); }}>{label}</Button>)}</div>
    {mode === 'listed' && <div className="grid grid-cols-3 gap-1 pb-2">{EXCHANGES.map(e => { const idx = exchangeIndex(live.market, e.id); const prev = idx.verlauf[idx.verlauf.length - 2] ?? idx.wert; return <button key={e.id} type="button" aria-pressed={ex === e.id} onClick={() => { setEx(ex === e.id ? 'all' : e.id); setPage(0); }} className={`rounded-md border p-1.5 text-left text-xs ${ex === e.id ? 'border-primary bg-secondary' : 'border-border'}`}><div className="font-semibold">{e.name}</div><div className="text-muted-foreground">{e.index} · {idx.firmen}</div><div className="font-mono">{idx.wert.toFixed(0)} <span className={idx.wert >= prev ? 'text-success' : 'text-destructive'}>{pct(prev ? idx.wert / prev - 1 : 0)}</span></div><Spark data={idx.verlauf} /></button>; })}</div>}
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
        {listed && (() => { const m = stockMetrics(f); const ex0 = EXCHANGES.find(e => e.id === exchangeOf(f)); return <><Spark data={f.historie} /><div className="grid grid-cols-4 gap-1 text-[11px] text-muted-foreground"><span>{ex0?.name}<br /><b className="font-mono text-foreground">{eur(f.kurs ?? 0)}</b></span><span>Woche<br /><b className={`font-mono ${m.wochenAenderung >= 0 ? 'text-success' : 'text-destructive'}`}>{pct(m.wochenAenderung)}</b></span><span>KGV<br /><b className="font-mono text-foreground">{m.kgv ? m.kgv.toFixed(1) : '–'}</b></span><span>Div.<br /><b className="font-mono text-foreground">{(m.dividendenRendite * 100).toFixed(1)} %</b></span></div><div className="text-[11px] text-muted-foreground">52 W: {eur(m.tief52)} – {eur(m.hoch52)}</div></>; })()}
        <div className="market-actions">{listed && <>{[.1, .25, .5].map(q => <Button key={q} size="sm" disabled={state.cash < 1000} onClick={() => perform(g => buyStake(g, f.id, stakeForBudget(f, g.cash * q)))}>Kauf {q * 100} %</Button>)}{[.5, 1].map(q => <Button key={q} size="sm" variant="outline" disabled={f.anteilSpieler <= 0} onClick={() => perform(g => sellStake(g, f.id, f.anteilSpieler * q))}>{q === 1 ? 'Alles verkaufen' : 'Hälfte verkaufen'}</Button>)}</>}
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
