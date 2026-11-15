import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { calculateAssetValuation, openStore, processTurn } from '@/engine/engine';
import { EQUIPMENT, equipmentEffects, equipmentUpgradeCost, retrofitStandardEquipment, standardRetrofitCost, upgradeEquipment, type EquipmentCategory, type EquipmentLevel } from '@/engine/equipment';
import { balanceSheet, hireExecutive, processManagementWeek, recordManagementAction } from '@/engine/management';
import { createExpansion, cupsSold, fairPrice, type Recipe } from '@/engine/expansion';
import { loadGame, saveGame } from '@/engine/save';
import type { GameState } from '@/engine/types';

function upgrade(g: GameState, c: EquipmentCategory, l: EquipmentLevel) {
  const s = g.stores[0]; if (!s) throw new Error('Filiale fehlt');
  const r = upgradeEquipment(g, s.id, c, l); if (!r.ok) throw new Error(r.reason);
  return recordManagementAction(g, r.state);
}
describe('Filial-Ausstattung', () => {
  it('Basisausstattung ist inklusive und neue Filialen starten mit Standard', () => {
    const g = createInitialState();
    expect(g.stores[0]?.equipment).toEqual({ espresso: 0, grinder: 0, interior: 0, bookValue: 0 });
    const d = g.city.districts.find(d => !g.world.occupants[d.id] && !g.stores.some(s => s.districtId === d.id));
    if (!d) throw new Error('Grundstück fehlt');
    expect(openStore(g, g.city.id, d.id, 1).state.stores.at(-1)?.equipment.espresso).toBe(0);
  });
  it('Multi-Boiler erhöht Kapazität um 30 Prozent und das Qualitätsziel', () => {
    const g = createInitialState(); const upgraded = upgrade(g, 'espresso', 1);
    const basic = processTurn(g).stores[0], next = processTurn(upgraded).stores[0];
    if (!basic || !next) throw new Error('Filiale fehlt');
    expect(equipmentEffects(next).capacity).toBe(1.3);
    expect(next.customersServedLastWeek).toBeGreaterThan(basic.customersServedLastWeek);
    expect(next.qualityIndex).toBeGreaterThan(basic.qualityIndex);
  });
  it('Handcraft hat maximales Qualitätsziel und Prestige', () => {
    const g = createInitialState(), next = upgrade(g, 'espresso', 2);
    const s = next.stores[0]; if (!s) throw new Error('Filiale fehlt');
    expect(equipmentEffects(s)).toMatchObject({ maxQuality: true, prestige: 8 });
    expect(processTurn(next).brandReputation).toBeGreaterThan(processTurn(g).brandReputation);
  });
  it('Präzisionsmühle spart zehn Prozent Bohnenkosten bei gleicher Tassenanzahl', () => {
    const g = createInitialState(), next = upgrade(g, 'grinder', 1);
    const basic = processTurn(g), precision = processTurn(next);
    expect(precision.stores[0]?.customersServedLastWeek).toBe(basic.stores[0]?.customersServedLastWeek);
    expect(precision.lastReport?.costBeans).toBeCloseTo((basic.lastReport?.costBeans ?? 0) * 0.9, 1);
  });
  it('Bistro steigert Nachfrage, Zufriedenheit und Verweildauer', () => {
    const s = upgrade(createInitialState(), 'interior', 1).stores[0]; if (!s) throw new Error('Filiale fehlt');
    expect(equipmentEffects(s)).toMatchObject({ demand: 1.1, satisfaction: 5, dwell: 1.15 });
    expect(processTurn({ ...createInitialState(), stores: [s] }).stores[0]?.qualityIndex).toBeGreaterThan(processTurn(createInitialState()).stores[0]?.qualityIndex ?? 0);
  });
  it('Designer-Lounge erhöht Zahlungsbereitschaft für Signature Drinks', () => {
    const g = createInitialState(); const baseline = g.stores[0], lounge = upgrade(g, 'interior', 2).stores[0];
    if (!baseline || !lounge) throw new Error('Filiale fehlt');
    const recipe: Recipe = { id: 'test', name: 'Signature', base: 'espresso', milk: 'none', extra: 'none', price: 4, createdWeek: 1 };
    recipe.price = fairPrice(recipe) * 1.2;
    expect(equipmentEffects(lounge)).toMatchObject({ signatureWillingness: 1.2, satisfaction: 12 });
    expect(cupsSold(recipe, { ...lounge, customersServedLastWeek: 1000 }, '', 0)).toBeGreaterThan(cupsSold(recipe, { ...baseline, customersServedLastWeek: 1000 }, '', 0));
  });
  it('Investitionen erhöhen Anlagenwerte ohne doppelte Kosten oder sofortigen GuV-Aufwand', () => {
    const g = createInitialState(), next = upgrade(g, 'espresso', 1);
    expect(next.cash).toBe(g.cash - 8000);
    expect(balanceSheet(next).stores).toBe(balanceSheet(g).stores + 8000);
    expect(balanceSheet(next).assets).toBe(balanceSheet(g).assets);
    expect(calculateAssetValuation(next)).toBe(calculateAssetValuation(g));
    expect(next.management.journal.investing).toBe(-8000);
    expect(next.management.oneOff).toBe(0);
    const r = processManagementWeek(next, createExpansion()).game.management.history.at(-1);
    if (!r) throw new Error('Bericht fehlt');
    expect(r.cashStart + r.operating + r.investing + r.financing).toBeCloseTo(r.cashEnd, 2);
  });
  it('Upgrade verrechnet vorherige Investition und verhindert Rückstufung und Doppelkäufe', () => {
    const g = upgrade(createInitialState(), 'espresso', 1); const s = g.stores[0]; if (!s) throw new Error('Filiale fehlt');
    expect(equipmentUpgradeCost(s, 'espresso', 2)).toBe(16000);
    const next = upgrade(g, 'espresso', 2);
    expect(next.stores[0]?.equipment.bookValue).toBe(24000);
    expect(upgradeEquipment(next, s.id, 'espresso', 1).state).toBe(next);
    expect(upgradeEquipment(next, s.id, 'espresso', 2).ok).toBe(false);
    expect(upgradeEquipment({ ...g, cash: 0 }, s.id, 'espresso', 2).ok).toBe(false);
  });
  it('COO-Nachrüstung betrifft alle Filialen, erhält Premium und prüft Gesamtbudget atomar', () => {
    let g = upgrade(createInitialState(), 'espresso', 2);
    const d = g.city.districts.find(d => !g.world.occupants[d.id] && !g.stores.some(s => s.districtId === d.id)); if (!d) throw new Error('Grundstück fehlt');
    g = openStore({ ...g, cash: 100000 }, g.city.id, d.id, 1).state;
    expect(retrofitStandardEquipment(g).ok).toBe(false);
    const hired = hireExecutive(g, 'coo'); if (typeof hired === 'string') throw new Error(hired);
    const cost = standardRetrofitCost(hired);
    expect(cost).toBe(25000);
    const poor = { ...hired, cash: cost - 1 }; expect(retrofitStandardEquipment(poor).state).toBe(poor);
    const result = retrofitStandardEquipment(hired);
    expect(result.state.cash).toBe(hired.cash - cost);
    expect(result.state.stores.map(s => s.equipment.espresso)).toEqual([2, 1]);
    expect(result.state.stores.every(s => s.equipment.grinder === 1 && s.equipment.interior === 1)).toBe(true);
    expect(retrofitStandardEquipment(result.state).ok).toBe(false);
  });
  it('Schema-3-Spielstände erhalten Daten und kostenlose Standards; Upgrades bleiben nach Laden erhalten', () => {
    const g = createInitialState();
    localStorage.setItem('coffee-empire-save', JSON.stringify({ ...g, schemaVersion: 3, stores: g.stores.map(({ equipment: _equipment, ...s }) => s) }));
    const migrated = loadGame(); expect(migrated.schemaVersion).toBe(6); expect(migrated.cash).toBe(50000);
    expect(migrated.management).toEqual(g.management); expect(migrated.stores[0]?.equipment.bookValue).toBe(0);
    const upgraded = upgrade(migrated, 'grinder', 1); saveGame(upgraded);
    expect(loadGame().stores[0]?.equipment).toEqual(upgraded.stores[0]?.equipment);
    expect(EQUIPMENT.grinder[1].price).toBe(2500);
  });
});