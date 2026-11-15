import type { Store } from '@/engine/types';
import { equipmentOf } from '@/engine/equipment';

const clamp = (v: number) => Math.round(Math.min(5, Math.max(1, v)) * 10) / 10;

/** Presentation-only star ratings derived from persisted store values. */
export function cafeReviews(store: Store) {
  const e = equipmentOf(store);
  const skill = store.employees.length ? store.employees.reduce((s, x) => s + x.skill, 0) / store.employees.length : 0;
  const price = clamp(5 - (store.pricePerCup - 2.5) * 0.8);
  const product = clamp(store.qualityIndex / 20 + e.espresso * 0.3 + e.grinder * 0.2);
  const service = clamp(skill / 20 + Math.min(store.employees.length, store.tier * 2) * 0.15);
  const atmosphere = clamp(2 + store.tier * 0.5 + e.interior * 0.6);
  const overall = clamp((price + product + service + atmosphere) / 4);
  return { price, product, service, atmosphere, overall, count: Math.max(3, Math.round(store.customersServedLastWeek / 12)) };
}

export function cafeComments(store: Store) {
  const r = cafeReviews(store), out: { stars: number; text: string }[] = [];
  out.push(r.product >= 4 ? { stars: 5, text: 'Bester Espresso weit und breit!' } : { stars: 3, text: 'Der Kaffee könnte kräftiger sein.' });
  out.push(r.service >= 4 ? { stars: 5, text: 'Super freundliches Team.' } : { stars: 2, text: 'Lange Wartezeit an der Theke.' });
  out.push(r.atmosphere >= 4 ? { stars: 5, text: 'Wunderschön eingerichtet, ich bleibe gern.' } : { stars: 3, text: 'Etwas eng und schlicht.' });
  out.push(r.price >= 4 ? { stars: 4, text: 'Faire Preise!' } : { stars: 2, text: 'Ganz schön teuer hier.' });
  return out;
}
