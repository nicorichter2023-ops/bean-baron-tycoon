import type { ActionResult, GameState, Store } from './types';
import { calculateCompanyValuation } from './engine';
import { hasExecutive } from './management';

export type EquipmentLevel = 0 | 1 | 2;
export type EquipmentCategory = 'espresso' | 'grinder' | 'interior';
export interface StoreEquipment { espresso: EquipmentLevel; grinder: 0 | 1; interior: EquipmentLevel; bookValue: number; }
export const createEquipment = (): StoreEquipment => ({ espresso: 0, grinder: 0, interior: 0, bookValue: 0 });
export const EQUIPMENT = {
  espresso: [
    { label: 'Standard', price: 0, effect: 'Basisausstattung inklusive' },
    { label: 'Multi-Boiler Commercial', price: 8000, effect: '+30 % Kapazität · +12 Qualitätsziel' },
    { label: 'High-End Custom Handcraft', price: 24000, effect: '+30 % Kapazität · Qualitätsziel 100 · +8 Prestige' },
  ],
  grinder: [
    { label: 'Standard-Mühle', price: 0, effect: '18 g Bohnen pro Tasse' },
    { label: 'Präzisions-Mahlwerk mit Wiegefunktion', price: 2500, effect: '−10 % Bohnenverbrauch pro Tasse' },
  ],
  interior: [
    { label: 'Funktional', price: 0, effect: 'Basiseinrichtung inklusive' },
    { label: 'Gemütliches Bistro & Sitzbereich', price: 6000, effect: '+10 % Nachfrage · +5 Zufriedenheit · +15 % Verweildauer' },
    { label: 'Designer-Lounge', price: 18000, effect: '+20 % Nachfrage · +12 Zufriedenheit · +25 % Verweildauer · +20 % Signature-Preisbereitschaft' },
  ],
} as const;
export const equipmentOf = (s: Pick<Store, 'equipment'>) => s.equipment ?? createEquipment();
export function equipmentEffects(s: Pick<Store, 'equipment'>) {
  const e = equipmentOf(s);
  return { capacity: e.espresso > 0 ? 1.3 : 1, quality: e.espresso === 1 ? 12 : 0, maxQuality: e.espresso === 2,
    prestige: e.espresso === 2 ? 8 : 0, beanFactor: e.grinder === 1 ? 0.9 : 1,
    demand: e.interior === 2 ? 1.2 : e.interior === 1 ? 1.1 : 1,
    satisfaction: e.interior === 2 ? 12 : e.interior === 1 ? 5 : 0,
    dwell: e.interior === 2 ? 1.25 : e.interior === 1 ? 1.15 : 1,
    signatureWillingness: e.interior === 2 ? 1.2 : 1 };
}
export function equipmentUpgradeCost(s: Store, category: EquipmentCategory, level: EquipmentLevel) {
  const e = equipmentOf(s);
  const target = EQUIPMENT[category][level];
  const current = EQUIPMENT[category][e[category]];
  return target && current && level > e[category] ? target.price - current.price : 0;
}
export function upgradeEquipment(g: GameState, storeId: string, category: EquipmentCategory, level: EquipmentLevel): ActionResult {
  const s = g.stores.find(s => s.id === storeId);
  const reject = (reason: string): ActionResult => ({ state: g, ok: false, reason });
  if (!s) return reject('Filiale nicht gefunden.');
  const cost = equipmentUpgradeCost(s, category, level);
  if (!cost) return reject('Diese Ausstattung ist bereits vorhanden oder kein gültiges Upgrade.');
  if (g.cash < cost) return reject('Nicht genug Barvermögen für diese Ausstattung.');
  const e = equipmentOf(s);
  const equipment = { ...e, [category]: level, bookValue: e.bookValue + cost } as StoreEquipment;
  const state = { ...g, cash: g.cash - cost, stores: g.stores.map(item => item.id === s.id ? { ...item, equipment } : item) };
  return { ok: true, reason: `${s.name}: ${EQUIPMENT[category][level]?.label} eingebaut.`, state: { ...state, companyValuation: calculateCompanyValuation(state) } };
}
/** Company-wide operational standard, distinct from the included baseline. Never downgrade premium equipment. */
export function standardRetrofitCost(g: GameState) {
  return g.stores.reduce((n, s) => n + (['espresso', 'grinder', 'interior'] as const).reduce((sum, c) => sum + equipmentUpgradeCost(s, c, 1), 0), 0);
}
export function retrofitStandardEquipment(g: GameState): ActionResult {
  if (!hasExecutive(g, 'coo')) return { state: g, ok: false, reason: 'Für die gemeinsame Nachrüstung wird ein COO benötigt.' };
  const cost = standardRetrofitCost(g);
  if (!cost) return { state: g, ok: false, reason: 'Alle Filialen erfüllen bereits den Ausstattungsstandard.' };
  if (g.cash < cost) return { state: g, ok: false, reason: 'Nicht genug Barvermögen für die vollständige Nachrüstung.' };
  let next = g;
  for (const s of g.stores) for (const category of ['espresso', 'grinder', 'interior'] as const) {
    if (equipmentOf(s)[category] < 1) next = upgradeEquipment(next, s.id, category, 1).state;
  }
  return { state: next, ok: true, reason: 'Alle Filialen auf den Konzernstandard nachgerüstet.' };
}