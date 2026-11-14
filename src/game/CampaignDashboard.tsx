import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { compact, useGame } from './GameContext';
import { compareCampaignWeeks } from '@/engine/expansion';

const config = {
  ohne: { label: 'Ohne Kampagne', color: 'var(--muted-foreground)' },
  mit: { label: 'Mit Kampagne', color: 'var(--primary)' },
  guests: { label: 'Gäste', color: 'var(--secondary)' },
  revenue: { label: 'Umsatz', color: 'var(--primary)' },
} satisfies ChartConfig;

export function CampaignDashboard() {
  const { exp } = useGame();
  const h = exp.history;
  const cmp = compareCampaignWeeks(h);
  const bars = [
    { metric: 'Gäste / Woche', ohne: cmp.without.guests, mit: cmp.with.guests },
    { metric: 'Umsatz / Woche', ohne: cmp.without.revenue, mit: cmp.with.revenue },
  ];
  const lift = (a: number, b: number) => (b > 0 ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)} %` : '–');
  return <section className="lab-card">
    <h2 className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Kampagnen-Auswertung</h2>
    {h.length < 2 ? <p className="mt-2 text-xs text-muted-foreground">Spiele ein paar Wochen weiter – ab 2 Wochen siehst du hier den Vergleich.</p> : <>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="lab-stat"><span>Gäste mit Kampagne</span><strong>{lift(cmp.with.guests, cmp.without.guests)}</strong></div>
        <div className="lab-stat"><span>Umsatz mit Kampagne</span><strong>{lift(cmp.with.revenue, cmp.without.revenue)}</strong></div>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{cmp.with.weeks} Wochen mit, {cmp.without.weeks} ohne Kampagne</p>
      {(['Gäste / Woche', 'Umsatz / Woche'] as const).map((m, i) => <div key={m} className="mt-3"><p className="text-xs">{m} im Schnitt</p>
        <ChartContainer config={config} className="h-32 w-full"><BarChart data={[bars[i]]} layout="vertical" margin={{ left: 0, right: 8 }}>
          <XAxis type="number" hide /><YAxis type="category" dataKey="metric" hide />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="ohne" fill="var(--color-ohne)" radius={4} /><Bar dataKey="mit" fill="var(--color-mit)" radius={4} />
        </BarChart></ChartContainer></div>)}
      <p className="mt-3 text-xs">Verlauf (goldene Flächen = Kampagne aktiv)</p>
      <ChartContainer config={config} className="h-44 w-full"><LineChart data={h} margin={{ left: -12, right: 8 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis dataKey="week" tickLine={false} fontSize={10} tickFormatter={(w) => `W${w}`} />
        <YAxis yAxisId="g" fontSize={10} tickLine={false} width={36} />
        <YAxis yAxisId="r" orientation="right" fontSize={10} tickLine={false} width={44} tickFormatter={(v) => compact(v)} />
        {h.filter((r) => r.campaigns > 0).map((r) => <ReferenceArea key={r.week} yAxisId="g" x1={r.week} x2={r.week} fill="var(--primary)" fillOpacity={0.15} ifOverflow="extendDomain" />)}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line yAxisId="g" dataKey="guests" stroke="var(--color-guests)" dot={false} strokeWidth={2} />
        <Line yAxisId="r" dataKey="revenue" stroke="var(--color-revenue)" dot={false} strokeWidth={2} />
      </LineChart></ChartContainer>
    </>}
  </section>;
}
