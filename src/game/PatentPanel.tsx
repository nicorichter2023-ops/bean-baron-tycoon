import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PATENTS } from '@/data/tycoonContent';
import { startPatent, togglePatentLicenses, tycoonOf } from '@/engine/tycoon';
import { useGame, eur } from './GameContext';
import { HubHeader } from './HubHeader';
export function PatentPanel() {
  const { state, perform } = useGame(), t = tycoonOf(state);
  return <section className="space-y-3"><HubHeader art="lab" eyebrow="Forschung · Hardware" title="Labor & Patente"><p className="text-xs text-muted-foreground">Erfindungen steigern Kapazität, senken Bohnenbedarf und bringen Lizenzerlöse.</p></HubHeader><label className="flex items-center gap-3"><Switch aria-label="Patente lizenzieren" checked={t.licensePatents} onCheckedChange={() => perform(togglePatentLicenses)} />Patent-Lizenzen an Hersteller vergeben</label><div className="master-grid">{PATENTS.map(p => <article className="master-item" key={p.id}><strong>{p.name}</strong><p>{eur(p.cost)} · {p.weeks} Wochen · {eur(p.income)}/Wo Lizenzen</p>{t.patents.includes(p.id) ? <span className="text-success">Patent erteilt</span> : t.patentProject?.id === p.id ? <p>Noch {Math.max(0, t.patentProject.finishWeek - state.week)} Wochen</p> : <Button variant="outline" disabled={!!t.patentProject} onClick={() => perform(g => startPatent(g, p.id))}>Entwickeln</Button>}</article>)}</div></section>;
}