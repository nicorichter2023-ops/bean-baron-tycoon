import { useState } from 'react';
import { Check, FlaskConical, Play, UserMinus } from 'lucide-react';
import { MASTER } from '@/data/master';
import { catalogAction, dismissCandidate, executivePerk, researchDuration, type CatalogKind } from '@/engine/world';
import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';

const GROUPS = [
  ['research', 'Forschung', MASTER.techTree], ['candidate', 'Talente', MASTER.cSuiteCandidates],
  ['plantation', 'Plantagen', MASTER.plantations], ['tenant', 'Büromieter', MASTER.officeTenants],
  ['celebrity', 'Botschafter', MASTER.celebrityEndorsements],
  ['underwriter', 'Börsengang', MASTER.stockMarket.underwriters], ['app', 'BeanPass', MASTER.digitalEcosystem.appTiers],
  ['training', 'Weiterbildung', MASTER.storeHrStandards.trainingTiers],
] as const;
const LABELS: Record<string, string> = {
  id: 'Kennung', name: 'Name', role: 'Position', age: 'Alter', nationality: 'Nationalität', skillLevel: 'Erfahrung', weeklySalary: 'Wochengehalt', signingBonus: 'Antrittsprämie',
  personality: 'Persönlichkeit', specialty: 'Spezialisierung', perks: 'Vorteile', bio: 'Lebenslauf', category: 'Bereich', tier: 'Stufe', prerequisiteId: 'Voraussetzung', researchWeeks: 'Forschungswochen', researchCost: 'Forschungskosten', effects: 'Effekte',
  throughputMultiplier: 'Durchsatzfaktor', customerSatisfactionBonus: 'Zufriedenheit', beanLossReduction: 'Bohnenverlust reduziert', reputationBonus: 'Reputation', unlockFeature: 'Freischaltung',
  loanInterestDiscount: 'Zinsvorteil', taxRateDiscount: 'Steuervorteil', storeMaintenanceDiscount: 'Betriebskosten reduziert', storeThroughputBonus: 'Durchsatzbonus', campaignEffectivenessBonus: 'Kampagnenbonus', brandAwarenessGrowthBonus: 'Markenwachstum', weeklyResearchPoints: 'Forschungspunkte pro Woche', techCostDiscount: 'Forschungskosten reduziert',
  purchasePrice: 'Kaufpreis', weeklyOperatingCost: 'Wochenkosten', annualYieldKg: 'Jahresernte (kg)', harvestIntervalWeeks: 'Ernteintervall (Wochen)', cupQualityScore: 'Qualitätsbewertung', varietal: 'Varietät', hectares: 'Hektar', country: 'Land', region: 'Region',
  requiredAreaSqm: 'Fläche (m²)', rentPerSqmWeekly: 'Wochenmiete pro m²', leaseWeeks: 'Laufzeit (Wochen)', creditRating: 'Bonität', depositPaid: 'Mietkaution', sector: 'Branche',
  contractName: 'Kontrakt', beanType: 'Bohnentyp', contractWeeks: 'Laufzeit (Wochen)', lockPricePerKg: 'Fixpreis pro kg', contractFee: 'Kontraktgebühr', protectedVolumeKg: 'Geschützte Menge (kg)',
  lobbyingCost: 'Lobbyingkosten', approvalChance: 'Genehmigungschance', effect: 'Auswirkung', durationWeeks: 'Dauer (Wochen)', revenueBuff: 'Umsatzbonus', taxDiscount: 'Steuerrabatt', logisticsDiscount: 'Logistikrabatt', touristBuff: 'Tourismusbonus', trainingDiscount: 'Trainingsrabatt', fixedB2BWeeklyRevenue: 'Zusätzlicher B2B-Wochenumsatz', specialPropertyUnlock: 'Sonderimmobilie',
  initialCost: 'Startkosten', weeklyMaintenance: 'Wochenkosten', reputationGain: 'Reputation', hipsterStudentBonus: 'Kundenbonus', esgScore: 'ESG-Punkte',
  title: 'Titel', signingFee: 'Vertragsprämie', weeklyRetainer: 'Wöchentliche Vergütung', reputationBoost: 'Reputation', specialtyClientele: 'Zielgruppe', clienteleBoost: 'Zielgruppenbonus',
  prestigeLevel: 'Prestige', commissionRate: 'Provision', valuationMultiplier: 'Bewertungsfaktor', minRevenueRequired: 'Mindestwochenumsatz', minReputationRequired: 'Mindestreputation',
  activeUsers: 'Aktive Nutzer', avgWalletBalance: 'Mittleres Guthaben', floatYieldAnnual: 'Jährliche Guthabenrendite', weeklyFloatInterest: 'Wöchentlicher Zinsertrag', orderSpeedBuff: 'Bestelltempo',
  trainingCostPerStaff: 'Kosten pro Person', baseSpeed: 'Tempo', baseQuality: 'Qualität', wasteRate: 'Verlustquote',
};
function Values({ data }: { data: Record<string, unknown> }) {
  return <dl className="catalog-values">{Object.entries(data).filter(([k]) => !['description', 'bio', 'name', 'id'].includes(k)).map(([key, value]) => <div key={key}><dt>{LABELS[key] ?? key}</dt><dd>{value !== null && typeof value === 'object' ? <Values data={value as Record<string, unknown>} /> : typeof value === 'number' ? value.toLocaleString('de-DE') : String(value ?? '—')}</dd></div>)}</dl>;
}
const HUB_KINDS = ['research', 'celebrity', 'app'];
/** `only` embeds a subset inside the research/marketing hubs; the default view shows the remaining corporate catalogs. */
export function MasterCatalog({ only, embedded = false, title }: { only?: CatalogKind[]; embedded?: boolean; title?: string } = {}) {
  const { state, perform } = useGame();
  const groups = GROUPS.filter(g => only ? only.includes(g[0]) : !HUB_KINDS.includes(g[0]));
  const [kind, setKind] = useState<CatalogKind>(groups[0]![0]), [query, setQuery] = useState('');
  const group = groups.find(g => g[0] === kind) ?? groups[0]!;
  return <>
    {embedded ? <h2 className="font-display text-lg font-bold">{title ?? (only?.includes('research') ? 'Konzern-Technologien' : 'Botschafter, Nachhaltigkeit & App')}</h2> : <div className="scene-heading"><div><p className="eyebrow">Coffee Empire · Entwicklung</p><h1>Konzernentwicklung</h1></div><FlaskConical className="text-primary" /></div>}
    <div className="management-switch">{groups.length > 1 && groups.map(([id, label, items]) => <Button key={id} variant={id === kind ? 'secondary' : 'ghost'} onClick={() => { setKind(id); setQuery(''); }}>{label} · {items.length}</Button>)}</div>
    <label className="catalog-search"><span>{group[1]} suchen</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name oder Spezialisierung" /></label>
    {kind === 'research' && state.world.research.length > 0 && <div className="research-progress">{state.world.research.map(r => <p key={r.id}>{MASTER.techTree.find(t => t.id === r.id)?.name} · noch {Math.max(0, r.finishWeek - state.week)} Wochen</p>)}</div>}
    <div className="catalog-grid">{group[2].filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())).map(item => {
      const entry = item as unknown as Record<string, unknown>, id = String(entry['id'] ?? entry['tier']), name = String(entry['name'] ?? entry['contractName']);
      const active = kind === 'research' ? state.world.technologies.includes(id) || state.world.research.some(r => r.id === id) : kind === 'candidate' ? state.world.candidates.includes(id) : kind === 'app' ? state.world.appTier >= Number(id) : state.world.assets.some(a => a.kind === kind && a.id === id && a.endWeek > state.week);
      const price = Math.round(Number(entry['researchCost'] ?? entry['signingBonus'] ?? entry['purchasePrice'] ?? entry['contractFee'] ?? entry['lobbyingCost'] ?? entry['initialCost'] ?? entry['signingFee'] ?? entry['trainingCostPerStaff'] ?? 0) * (kind === 'research' ? 1 - executivePerk(state,'CTO','techCostDiscount') : 1));
      return <article className="catalog-item" key={id}><div className="flex items-start justify-between gap-3"><h2>{name}</h2>{active && <Check className="shrink-0 text-success" size={18} />}</div><p className="text-sm text-muted-foreground">{String(entry['description'] ?? entry['bio'] ?? '')}</p><div className="catalog-summary">{price > 0 ? eur(price) + (kind === 'training' ? ' / Person' : '') : kind === 'underwriter' ? 'Emissionsmandat' : 'Aktivierung'}{entry['weeklySalary'] ? ` · ${eur(Number(entry['weeklySalary']))}/Wo` : ''}</div>
        <details><summary>Alle Kennzahlen</summary><Values data={entry} /></details>
        {kind === 'research' && <p className="text-xs text-muted-foreground">{researchDuration(state, Number(entry['researchWeeks']))} Wochen · Voraussetzung: {MASTER.techTree.find(t=>t.id===entry['prerequisiteId'])?.name ?? 'Keine'}</p>}
        {active && kind === 'candidate' ? <Button variant="outline" onClick={() => perform(g => dismissCandidate(g, id))}><UserMinus /> Freistellen</Button> : <Button variant="secondary" disabled={active} onClick={() => perform(g => catalogAction(g, kind, id))}><Play size={16} />{active ? 'Aktiv' : kind === 'research' ? 'Erforschen' : kind === 'candidate' ? 'Einstellen' : kind === 'plantation' ? 'Kaufen' : kind === 'training' ? 'Team schulen' : 'Starten'}</Button>}
      </article>;
    })}</div>
  </>;
}