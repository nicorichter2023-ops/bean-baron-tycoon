import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { tycoonOf, enableBeanPay, configureTreasury } from '@/engine/tycoon';
import { HubHeader } from './HubHeader';
import { SystemIcon } from './MasterIcons';
import { MasterCatalog } from './MasterCatalog';
import { useGame, eur } from './GameContext';

export function BeanPayHub() {
  const { state, perform } = useGame(), bp = tycoonOf(state).beanpay;
  const [reserve, setReserve] = useState(bp.reserve);
  const shortfall = Math.max(0, bp.balance * reserve - state.cash);
  return <div className="space-y-5"><HubHeader art="beanpay" eyebrow="Finanzen · Kunden-App" title="BeanPay & Treasury"><p className="text-xs text-muted-foreground">Kunden-App · Prepaid-Guthaben · Treuepunkte</p></HubHeader>
    <div className="master-kpis"><div><SystemIcon kind="beanpay" /><strong>{bp.users.toLocaleString('de-DE')}</strong><small>App-Kunden</small></div><div><strong>{eur(bp.balance)}</strong><small>Kundenguthaben · Verbindlichkeit</small></div><div><strong>{eur(bp.interest)}</strong><small>Zinsertrag letzte Woche</small></div></div>
    {!bp.enabled ? <Button onClick={() => perform(enableBeanPay)}>BeanPay einführen · 25.000 €</Button> : <section className="master-band"><h2 className="master-title">Liquidität & Rückzahlungsreserve</h2><p>{eur(bp.balance * reserve)} Reserve · {eur(bp.balance * (1 - reserve))} maximal für Expansion</p><label className="master-form">Reserve · {Math.round(reserve * 100)} %<input aria-label="BeanPay-Reserve" type="range" min={60} max={100} value={Math.round(reserve * 100)} onChange={e => setReserve(Number(e.target.value) / 100)} /></label><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => perform(g => configureTreasury(g, reserve))}>Reserve übernehmen</Button><Button variant="outline" onClick={() => perform(g => configureTreasury(g, reserve, true))}>Treuepunkte-Aktion · 3.500 €</Button></div><p className="text-sm text-muted-foreground">{(bp.yieldAnnual * 100).toFixed(1)} % Jahreszins · Prepaid-Aufladungen sind kein Umsatz.</p></section>}
    {shortfall > 0 && <p role="alert" className="text-destructive">Rückzahlungsreserve unterschritten: {eur(shortfall)} fehlen. Investitionen pausieren oder Bankkredit aufnehmen.</p>}
    <MasterCatalog only={['app']} embedded title="Kunden-App ausbauen" />
  </div>;
}