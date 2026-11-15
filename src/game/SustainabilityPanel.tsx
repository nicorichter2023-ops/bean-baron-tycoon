import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MASTER } from '@/data/master';
import { certify, microloan, tycoonOf, esgScore } from '@/engine/tycoon';
import { useGame, eur } from './GameContext';
import { MasterCatalog } from './MasterCatalog';
import { SystemIcon } from './MasterIcons';
export function SustainabilityPanel() {
  const { state, perform } = useGame(), t = tycoonOf(state);
  const [farm, setFarm] = useState(MASTER.plantations[0]?.id ?? '');
  return <div className="space-y-5"><h1 className="master-title"><SystemIcon kind="esg" />Nachhaltigkeit · ESG {esgScore(state)}/100</h1><section className="master-band"><h2>Bio-Zertifizierung</h2><p>{t.certification === 'verified' ? 'Unabhängig geprüft' : t.certification === 'pseudo' ? 'Ungeprüftes Label · Skandalrisiko' : 'Kein eigenes Bio-Label'}</p><div className="flex flex-wrap gap-2"><Button onClick={() => perform(g => certify(g, true))}>Geprüftes Siegel · 30.000 €</Button><Button variant="outline" onClick={() => perform(g => certify(g, false))}>Ungeprüftes Label · 3.000 €</Button></div></section><MasterCatalog only={['csr']} embedded title="Fairtrade, Bio & Klimaprojekte" /><section className="master-band"><h2>Agrar-Mikrokredite</h2><label className="master-form">Kooperative<select value={farm} onChange={e => setFarm(e.target.value)}>{MASTER.plantations.map(f => <option key={f.id} value={f.id}>{f.name} · {f.country}</option>)}</select></label><Button variant="outline" onClick={() => perform(g => microloan(g, farm))}>20.000 € Kredit · 3 % Jahreszins</Button>{t.microloans.map(l => <p key={l.farmId}>{MASTER.plantations.find(f => f.id === l.farmId)?.name} · {eur(l.amount)} · Rückzahlung Woche {l.dueWeek}</p>)}</section></div>;
}