import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { eur, useGame } from './GameContext';
import { HubHeader } from './HubHeader';
import { CampaignDashboard } from './CampaignDashboard';
import { MasterCatalog } from './MasterCatalog';
import { CAMPAIGNS, startCampaign, type CampaignKind } from '@/engine/expansion';
import { autoKey, campaignDiscount, empireOf, isExec, toggleAutoCampaign } from '@/engine/empire';
import { tycoonOf, dispatchPopUp } from '@/engine/tycoon';
import { MasterHeading } from './MasterArt';

/** The single marketing menu: all campaign types per city with auto-renew, plus ambassadors, CSR and app. */
export function MarketingHub() {
  const { state, exp, set, setBoth, perform } = useGame();
  const cities = [...new Set(state.stores.map(s => s.cityId))].map(id => state.cities.find(c => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c);
  const [cityId, setCityId] = useState(cities[0]?.id ?? '');
  const auto = empireOf(state).auto, disc = campaignDiscount(state);
  const [hotspot, setHotspot] = useState('Festival'), [duration, setDuration] = useState(2);
  return <div className="space-y-4">
    <HubHeader art="marketing" eyebrow="HQ · Marketing" title="Marketing-Zentrale"><p className="text-xs text-muted-foreground">{Object.keys(CAMPAIGNS).length} Kampagnenarten · „Auto“ verlängert eine Kampagne jede Woche, sobald sie ausläuft{isExec(state, 'cmo') ? ' · CMO: 15 % günstiger' : ''}.</p></HubHeader>
    {cities.length === 0 ? <p className="text-sm text-muted-foreground">Eröffne zuerst eine Filiale.</p> : <section className="cafe-panel-block">
      <select className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" aria-label="Stadt für Kampagne" value={cityId} onChange={e => setCityId(e.target.value)}>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <ul className="campaign-list">{(Object.keys(CAMPAIGNS) as CampaignKind[]).map(k => { const c = CAMPAIGNS[k], running = exp.campaigns.find(x => x.kind === k && x.cityId === cityId), on = auto.includes(autoKey(k, cityId));
        return <li key={k}><div><strong>{c.label}</strong><small>+{Math.round(c.boost * 100)} % Kundschaft · {c.weeks} Wo · +{String(c.reputation).replace('.', ',')} Ruf/Wo{running ? ` · läuft noch ${running.weeksLeft} Wo` : ''}</small></div>
          <Button size="sm" className="min-h-11" variant={running ? 'secondary' : 'default'} disabled={!!running || state.cash < c.cost} onClick={() => setBoth((g, e) => startCampaign(g, e, k, cityId))}>{eur(c.cost)}</Button>
          <label className="campaign-auto"><Switch checked={on} onCheckedChange={() => set(g => toggleAutoCampaign(g, k, cityId))} aria-label={`${c.label} automatisch wiederholen`} /><span>Auto{on && disc < 1 ? ' −15 %' : ''}</span></label></li>; })}</ul>
    </section>}
    <CampaignDashboard />
    <section className="master-band"><MasterHeading kind="truck" title="Pop-up Coffee-Vans" detail={`${state.city.name} · mobile Markttests`} /><div className="master-form"><label>Hotspot<select value={hotspot} onChange={e => setHotspot(e.target.value)}>{['Festival', 'Tech-Konferenz', 'Marathon'].map(n => <option key={n}>{n}</option>)}</select></label><label>Standzeit<select value={duration} onChange={e => setDuration(Number(e.target.value))}>{[2, 3, 4].map(n => <option key={n} value={n}>{n} Wochen</option>)}</select></label><Button onClick={() => perform(g => dispatchPopUp(g, hotspot, duration))}>Van platzieren · {eur(3000 + duration * 1000)}</Button></div>{tycoonOf(state).popups.map(p => <p key={p.id}>{p.hotspot} · bis Woche {p.until} · {eur(p.revenue)}/Wo</p>)}</section>
    <MasterCatalog only={['celebrity']} embedded title="Markenbotschafter" />
  </div>;
}
