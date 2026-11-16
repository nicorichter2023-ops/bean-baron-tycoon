import { MASTER } from '@/data/master';
import type { ActionResult, GameState } from './types';
import { candidateOf, stableHash, type Candidate } from './world';

export type ExecRole = 'COO' | 'CFO' | 'CMO' | 'CTO';
export const EXEC_ROLES: ExecRole[] = ['COO', 'CFO', 'CMO', 'CTO'];
/** Job postings replace the fixed talent pool: budget buys more and stronger random applicants. */
export const JOB_POSTINGS = [
  { id: 'local', name: 'Stellenanzeige', cost: 1500, count: 3, skill: [1, 2] },
  { id: 'headhunter', name: 'Headhunter', cost: 6000, count: 3, skill: [2, 4] },
  { id: 'search', name: 'Executive Search', cost: 20000, count: 4, skill: [3, 5] },
] as const;
const FIRST = ['Lena', 'Jonas', 'Mia', 'Elias', 'Sofia', 'Noah', 'Amira', 'Leon', 'Yuki', 'Mateo', 'Hanna', 'Omar', 'Clara', 'Felix', 'Ines', 'Kofi'];
const LAST = ['Becker', 'Rossi', 'Novak', 'Lindqvist', 'Moreau', 'Tanaka', 'Silva', 'Kaya', 'Okafor', 'Brandt', 'Duarte', 'Haas', 'Weiss', 'Santos'];
const TRAITS = ['Pragmatikerin', 'Visionär', 'Zahlenmensch', 'Teamplayerin', 'Perfektionist', 'Draufgänger', 'Diplomatin', 'Sparfuchs'];
const NATIONS = ['Deutschland', 'Italien', 'Schweden', 'Japan', 'Brasilien', 'Kenia', 'Türkei', 'Frankreich', 'USA', 'Kolumbien'];
const rnd = (seed: string) => (stableHash(seed) % 10000) / 10000;

export function generateApplicants(g: GameState, role: ExecRole, postingId: string): Candidate[] {
  const posting = JOB_POSTINGS.find(p => p.id === postingId) ?? JOB_POSTINGS[0];
  const templates = MASTER.cSuiteCandidates.filter(c => c.role === role);
  return Array.from({ length: posting.count }, (_, i) => {
    const seed = `${role}-${postingId}-${g.week}-${i}-${Math.round(g.cash)}`;
    const skill = posting.skill[0] + Math.floor(rnd(seed + 's') * (posting.skill[1] - posting.skill[0] + 1));
    const base = templates.filter(t => t.skillLevel === skill)[0] ?? templates.at(-1)!;
    const talent = 0.75 + rnd(seed + 't') * 0.5; // perk strength
    const greed = 0.8 + rnd(seed + 'g') * 0.45; // pay demand
    const perks = Object.fromEntries(Object.entries(base.perks as Record<string, number>).map(([k, v]) => [k, Math.round(v * talent * 1000) / 1000]));
    const name = `${FIRST[stableHash(seed + 'f') % FIRST.length]} ${LAST[stableHash(seed + 'l') % LAST.length]}`;
    return { ...base, id: `gen_${role.toLowerCase()}_${g.week}_${postingId}_${i}`, name, age: 27 + Math.floor(rnd(seed + 'a') * 30), nationality: NATIONS[stableHash(seed + 'n') % NATIONS.length], skillLevel: skill,
      weeklySalary: Math.round(base.weeklySalary * greed / 50) * 50, signingBonus: Math.round(base.signingBonus * greed / 100) * 100, personality: TRAITS[stableHash(seed + 'p') % TRAITS.length], perks } as Candidate;
  });
}
export const roleTaken = (g: GameState, role: ExecRole) => g.world.candidates.some(id => candidateOf(g, id)?.role === role) || (g.management?.executives ?? []).some(e => e.role === role.toLowerCase());
export function postJob(g: GameState, role: ExecRole, postingId: string): ActionResult {
  const posting = JOB_POSTINGS.find(p => p.id === postingId);
  if (!posting) return { state: g, ok: false, reason: 'Ausschreibung unbekannt.' };
  if (roleTaken(g, role)) return { state: g, ok: false, reason: 'Position bereits besetzt.' };
  if (g.cash < posting.cost) return { state: g, ok: false, reason: 'Nicht genug Barvermögen.' };
  const applicants = [...(g.world.applicants ?? []).filter(c => c.role !== role), ...generateApplicants(g, role, postingId)];
  return { state: { ...g, cash: g.cash - posting.cost, world: { ...g.world, applicants } }, ok: true, reason: `${posting.name}: ${posting.count} Bewerbungen für ${role} eingegangen.` };
}
export function hireApplicant(g: GameState, id: string): ActionResult {
  const c = g.world.applicants?.find(a => a.id === id);
  if (!c) return { state: g, ok: false, reason: 'Bewerbung nicht mehr verfügbar.' };
  if (roleTaken(g, c.role as ExecRole)) return { state: g, ok: false, reason: 'Position bereits besetzt.' };
  if (g.cash < c.signingBonus) return { state: g, ok: false, reason: 'Nicht genug Barvermögen für den Antrittsbonus.' };
  return { state: { ...g, cash: g.cash - c.signingBonus, world: { ...g.world, candidates: [...g.world.candidates, id], hired: [...(g.world.hired ?? []), c], applicants: (g.world.applicants ?? []).filter(a => a.role !== c.role) } }, ok: true, reason: `${c.name} ist neuer ${c.role}.` };
}
