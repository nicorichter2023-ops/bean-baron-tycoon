import { neighborhoodEffects } from '@/engine/neighborhood';
import { useGame } from './GameContext';

export function NeighborhoodPanel({ buildingId }: { buildingId: string }) {
  const { state } = useGame(); const n = neighborhoodEffects(state, buildingId);
  const labels: Record<string,string> = { volume:'Laufkundschaft', margin:'Marge', takeaway:'Takeaway', prestige:'Prestige' };
  const percent = (v: number) => `${(v * 100).toLocaleString('de-DE', {maximumFractionDigits:1})} %`;
  return <section className="neighborhood-panel"><h3>Nachbarschaft</h3>
    {n.slots.map(s=><div key={s.slot}><span>{s.slot} · {percent(s.weight)}</span><strong>{s.building?.name ?? 'Kein Nachbar'}</strong>{s.building && <small>{labels[s.building.locationBonus.bonusType]} +{percent(s.value)}{s.rival ? ` · ${s.rival.name}: −${percent(s.outflow)} Kunden, +${percent(s.inflow)} Qualitätsgewinn` : ''}</small>}</div>)}
    <dl className="financial-ledger"><div><dt>Nachfrage nach Begrenzung</dt><dd>{percent(n.demand - 1)}</dd></div><div><dt>Marge / Takeaway</dt><dd>+{percent(n.margin)} / +{percent(n.takeaway)}</dd></div><div><dt>Prestige</dt><dd>+{n.prestige.toFixed(1)}</dd></div></dl>
  </section>;
}