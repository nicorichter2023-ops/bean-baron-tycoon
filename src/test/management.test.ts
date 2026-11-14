import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion, startCampaign } from '@/engine/expansion';
import { balanceSheet, effectiveInterestRate, hireExecutive, processManagementWeek, recordManagementAction, releaseExecutive } from '@/engine/management';
import { openStore, takeLoan, processTurn } from '@/engine/engine';
import { migrateV2ToV3 } from '@/engine/save';
import type { GameState } from '@/engine/types';

function hire(g: GameState, role: 'coo' | 'cfo') { const r = hireExecutive(g, role); if (typeof r === 'string') throw new Error(r); return recordManagementAction(g, r); }
describe('Management & Accounting', () => {
  it('COO kostet 12000 und wöchentlich 1800', () => {
    const g = createInitialState(), hired = hire(g, 'coo');
    expect(hired.cash).toBe(g.cash - 12000);
    const result = processManagementWeek(hired, createExpansion());
    const base = processTurn(g).lastReport;
    expect(result.game.management?.history.at(-1)?.salaries).toBe((base?.costSalaries ?? 0) + 1800);
  });
  it('CFO kostet 10000 und wöchentlich 1500', () => {
    const g = createInitialState(), hired = hire(g, 'cfo');
    expect(hired.cash).toBe(g.cash - 10000);
    expect(processManagementWeek(hired, createExpansion()).game.management?.history.at(-1)?.salaries).toBe(2050);
  });
  it('CFO reduziert Zinsen auf bestehenden und neuen Schulden um 20 Prozent', () => {
    let g = hire(createInitialState(), 'cfo');
    g = takeLoan(g, 10000).state;
    expect(effectiveInterestRate(g)).toBeCloseTo(0.00096);
    expect(processManagementWeek(g, createExpansion()).game.management?.history.at(-1)?.interest).toBe(9.6);
    expect(effectiveInterestRate(releaseExecutive(g, 'cfo'))).toBeCloseTo(0.0012);
  });
  it('COO stellt nur bei aktiver Delegation bis zur Sollbesetzung ein', () => {
    const g = hire(createInitialState(), 'coo');
    const empty = { ...g, stores: g.stores.map(s => ({ ...s, employees: [] })) };
    expect(processManagementWeek(empty, createExpansion()).game.stores[0]?.employees).toHaveLength(0);
    const delegated = { ...empty, management: { ...g.management as NonNullable<GameState['management']>, delegation: true } };
    const next = processManagementWeek(delegated, createExpansion()).game;
    expect(next.stores[0]?.employees).toHaveLength(1);
    expect(next.stores[0]?.customersServedLastWeek).toBeGreaterThan(0);
  });
  it('Cashflow stimmt mit Bargeld nach Kredit, Werbung, Investition und Wochenwechsel überein', () => {
    const initial = createInitialState();
    let g = recordManagementAction(initial, takeLoan(initial, 20000).state);
    const campaign = startCampaign(g, createExpansion(), 'social', g.city.id);
    if (typeof campaign === 'string') throw new Error(campaign);
    g = recordManagementAction(g, campaign.game);
    const district = g.city.districts.find(d => !g.stores.some(s => s.districtId === d.id));
    if (!district) throw new Error('Kein Grundstück');
    g = recordManagementAction(g, openStore(g, g.city.id, district.id, 1).state);
    const result = processManagementWeek(g, campaign.exp), r = result.game.management?.history.at(-1);
    if (!r) throw new Error('Kein Bericht');
    expect(r.financing).toBe(20000);
    expect(r.investing).toBeLessThan(0);
    expect(r.cashStart + r.operating + r.investing + r.financing).toBeCloseTo(r.cashEnd, 2);
    expect(r.cashEnd).toBe(result.game.cash);
    expect(r.cups + r.b2b + r.other - r.salaries - r.rent - r.beans - r.ingredients - r.interest - r.upkeep - r.tax - r.oneOff + r.inventoryChange).toBeCloseTo(r.profit, 2);
  });
  it('Bilanzgleichung berücksichtigt Filialwerte, Vorräte, Schulden und Eigenkapital', () => {
    const g = createInitialState(); const b = balanceSheet({ ...g, debt: 10000 });
    expect(b.stores).toBe(40000);
    expect(b.assets).toBe(90000);
    expect(b.equity).toBe(80000);
    expect(b.debt + b.equity).toBe(b.assets);
  });
  it('Migration erhält alten Spielstand und startet keine erfundenen Berichte', () => {
    const { management: _management, ...old } = createInitialState();
    const g = { ...old, schemaVersion: 2 as const, cash: 12345 };
    const next = migrateV2ToV3(g);
    expect(next.cash).toBe(12345); expect(next.stores).toEqual(g.stores);
    expect(next.schemaVersion).toBe(3); expect(next.management?.history).toHaveLength(0);
  });
  it('offene Ereignisse verhindern doppelte Gehälter und Berichte', () => {
    const g = hire(createInitialState(), 'cfo');
    const first = processManagementWeek(g, createExpansion());
    expect(processManagementWeek(first.game, first.exp)).toEqual(first);
  });
});