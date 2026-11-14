import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Line, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { compact, eur, useGame } from './GameContext';
import { compareCampaignWeeks } from '@/engine/expansion';

const config = {
  ohne: { label: 'Ohne Kampagne', color: 'var(--muted-foreground)' },
  mit: { label: 'Mit Kampagne', color: 'var(--primary)' },
  guests: { label: 'Gäste', color: 'var(--success)' },
  active: { label: 'Kampagne aktiv', color: 'var(--primary)' },
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
  const maxRev = Math.max(...h.map((r) => r.revenue), 1);
  const line = h.map((r) => ({ ...r, active: r.campaigns > 0 ? maxRev : 0 }));
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
        <ChartContainer config={config} className="h-24 w-full"><BarChart data={[bars[i]]} layout="vertical" margin={{ left: 0, right: 8 }}>
          <XAxis type="number" hide /><YAxis type="category" dataKey="metric" hide />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="ohne" fill="var(--color-ohne)" radius={4}><LabelList dataKey="ohne" position="insideLeft" fill="var(--background)" fontSize={11} formatter={(v: number) => `Ohne: ${i ? eur(v) : v}`} /></Bar><Bar dataKey="mit" fill="var(--color-mit)" radius={4}><LabelList dataKey="mit" position="insideLeft" fill="var(--background)" fontSize={11} formatter={(v: number) => `Mit: ${i ? eur(v) : v}`} /></Bar>
        </BarChart></ChartContainer></div>)}
      <p className="mt-3 text-xs">Verlauf: <span className="text-success">— Gäste</span> · <span className="text-primary">— Umsatz</span> · helle Balken = Kampagne aktiv</p>
      <ChartContainer config={config} className="h-44 w-full"><ComposedChart data={line} margin={{ left: 0, right: 0 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis dataKey="week" tickLine={false} fontSize={10} tickFormatter={(w) => `W${w}`} />
        <YAxis yAxisId="g" fontSize={10} tickLine={false} width={40} />
        <YAxis yAxisId="r" orientation="right" fontSize={10} tickLine={false} width={52} tickFormatter={(v) => compact(v).replace(' Tsd €', 'k')} />
        <Bar yAxisId="r" dataKey="active" fill="var(--color-active)" fillOpacity={0.18} barSize={18} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line yAxisId="g" dataKey="guests" stroke="var(--color-guests)" dot={false} strokeWidth={2} />
        <Line yAxisId="r" dataKey="revenue" stroke="var(--color-revenue)" dot={false} strokeWidth={2} />
      </ComposedChart></ChartContainer>
    </>}
  </section>;
}
