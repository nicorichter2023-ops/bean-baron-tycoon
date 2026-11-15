import { Button } from '@/components/ui/button';
import { eur, useGame } from './GameContext';
import { HubHeader } from './HubHeader';
import { MasterCatalog } from './MasterCatalog';
import { sheet16 } from './sheetArt';
import { cafeOf, researchAvailable, startResearch } from '@/engine/cafe';
import { BRANCH_LABEL, RESEARCH, researchCost, researchWeeks, type Branch } from '@/engine/cafeContent';
import { researchDuration } from '@/engine/world';
import { isExec } from '@/engine/empire';

/** The single research menu: café & corporate tree plus the master technologies. */
export function ResearchHub() {
  const { state, perform } = useGame();
  const r = cafeOf(state).research, active = r.active && RESEARCH.find(n => n.id === r.active?.id);
  return <div className="space-y-4">
    <HubHeader art="research" eyebrow="HQ · Forschung" title={`Forschung · ${r.done.length}/${RESEARCH.length}`}>
      <p className="text-xs text-muted-foreground">{active ? `Läuft: ${active.name} · noch ${r.active?.weeksLeft} Wo.` : 'Kein Projekt aktiv.'}{isExec(state, 'cto') ? ' · CTO startet automatisch das nächste Café-Projekt und die nächste Konzern-Technologie.' : ''}</p>
    </HubHeader>
    {(Object.keys(BRANCH_LABEL) as Branch[]).map(b => { const nodes = RESEARCH.filter(n => n.branch === b), done = nodes.filter(n => r.done.includes(n.id)).length;
      return <details key={b} className="research-branch" open={b === 'drink'}><summary><strong>{BRANCH_LABEL[b]}</strong><span>{done}/{nodes.length}</span></summary>
        <ol className="cafe-research">{nodes.map(n => { const d = r.done.includes(n.id), avail = researchAvailable(state, n.id);
          return <li key={n.id} data-done={d}><img src={sheet16(n.sheet, n.art)} alt="" width={44} height={44} loading="lazy" /><div><strong>{n.name}</strong><small>{n.effect}</small></div>
            {d ? <span className="cafe-done">✓</span> : <Button size="sm" variant="outline" disabled={!avail || !!r.active || state.cash < researchCost(n.tier)} onClick={() => perform(g => startResearch(g, n.id))}>{eur(researchCost(n.tier))} · {researchDuration(state, researchWeeks(n.tier))} Wo.</Button>}</li>; })}</ol></details>; })}
    <MasterCatalog only={['research']} embedded />
  </div>;
}
