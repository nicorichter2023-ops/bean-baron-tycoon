import type { ActionResult, GameState, Store } from './types';
import { applyDesign, designCost, designOf, storeCafe, upgradeGear, type CafeDesign } from './cafe';
import { GEAR_KEYS, gearPrice, gearStageNeed, type GearCategory } from './cafeContent';
import { leversOf } from './progression';

export interface EditorDraft { design: CafeDesign; gear: Record<GearCategory, number> }
export const editorDraft = (g: GameState, s: Store): EditorDraft => ({ design: { ...designOf(storeCafe(g, s)) }, gear: { ...storeCafe(g, s).gear } });
export function editorCost(g: GameState, s: Store, draft: EditorDraft) {
  const current = storeCafe(g, s).gear;
  return designCost(g, s, draft.design) + GEAR_KEYS.reduce((sum, key) => sum + Math.max(0, gearPrice(key, draft.gear[key]) - gearPrice(key, current[key])), 0);
}
/** One atomic checkout; failed validation returns the original state without partial charges. */
export function commitEditor(g: GameState, storeId: string, draft: EditorDraft): ActionResult {
  const s = g.stores.find(store => store.id === storeId);
  const no = (reason: string): ActionResult => ({ state: g, ok: false, reason });
  if (!s) return no('Filiale nicht gefunden.');
  const current = storeCafe(g, s).gear;
  for (const key of GEAR_KEYS) {
    const level = draft.gear[key];
    if (!Number.isInteger(level) || level < current[key] || level > 4) return no('Ungültiger Ausbau; Ausstattung kann nicht zurückgebaut werden.');
    if (level > current[key] && leversOf(g, s).stage < gearStageNeed(level)) return no(`Ausbau erst ab Filialstufe ${gearStageNeed(level)}.`);
  }
  const cost = editorCost(g, s, draft);
  if (!cost) return no('Keine Änderung.');
  if (g.cash < cost) return no('Nicht genug Barvermögen.');
  let next = g;
  for (const key of GEAR_KEYS) for (let level = current[key]; level < draft.gear[key]; level++) {
    const result = upgradeGear(next, storeId, key);
    if (!result.ok) return no(result.reason);
    next = result.state;
  }
  if (designCost(next, s, draft.design)) {
    const result = applyDesign(next, storeId, draft.design);
    if (!result.ok) return no(result.reason);
    next = result.state;
  }
  return { state: next, ok: true, reason: `${s.name}: Ausbau und Gestaltung für ${cost.toLocaleString('de-DE')} € übernommen.` };
}