import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { Panel, Section } from './ui';
import { ensureLiving, buyStake, sellStake, ventureInvest } from '@/engine/v2';
import { portfolioValue } from '@/engine/v2/market';

const pretty = (s: string) => s.replace(/\[Wirkung: ([^\]]*)\]/, (_, w: string) => `(${w.replace(/branche\.|ziel\./g, '').replace(/;/g, ',').replace(/-(\d)/g, '−$1')})`).replace(/(\p{L})-(\p{L})/gu, '$1 $2').replace(/kuehl/g, 'kühl');

/** 2.0 world market: news ticker, listed shares and venture rounds from engine/v2. */
export function LivingMarket() {
  const { state, perform } = useGame();
  const live = ensureLiving(state);
  const firms = [...live.market.firmen].sort((a, b) => b.bewertung - a.bewertung);
  return <Section title={`Aktienmarkt · Weltmarkt · Portfolio ${eur(portfolioValue(live.market))}`}>
    <Panel><p className="eyebrow">Weltnachrichten</p>
      {live.news.length ? <ul className="mt-1 space-y-1 text-xs">{live.news.slice(0, 4).map((n, i) => <li key={i}><span className="text-muted-foreground">Wo {n.woche} · </span>{pretty(n.text)}</li>)}</ul> : <p className="text-xs text-muted-foreground">Noch ruhig – Ereignisse erscheinen nach den ersten Wochen.</p>}
    </Panel>
    <div className="grid gap-2 sm:grid-cols-2">{firms.slice(0, 12).map(f => {
      const up = f.trend >= 0, listed = f.kurs != null;
      return <Panel key={f.id}><div className="flex items-start justify-between gap-2 text-sm">
        <div><strong>{f.name}</strong><div className="text-xs text-muted-foreground">{pretty(f.branche)} · {f.phase}{f.anteilSpieler > 0 ? ` · dein Anteil ${eur(f.anteilSpieler * f.bewertung)}` : ''}</div></div>
        <div className="text-right font-mono"><div>{eur(f.bewertung)}</div><div className={up ? 'text-success' : 'text-destructive'}>{up ? '▲' : '▼'} {(Math.abs(f.trend) * 100).toFixed(1)} %</div></div></div>
        <div className="mt-2 flex gap-2">{listed
          ? <><Button size="sm" onClick={() => perform(g => buyStake(g, f.id, 5000 / Math.max(1, f.bewertung)))}>Für 5 Tsd € kaufen</Button><Button size="sm" variant="outline" disabled={f.anteilSpieler <= 0} onClick={() => perform(g => sellStake(g, f.id, f.anteilSpieler))}>Alles verkaufen</Button></>
          : <Button size="sm" variant="secondary" onClick={() => perform(g => ventureInvest(g, f.id, 25000))}>Venture 25 Tsd €</Button>}</div>
      </Panel>;
    })}</div>
  </Section>;
}
