import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { MASTER } from '@/data/master';
import { createExpansion } from '@/engine/expansion';
import type { GameState } from '@/engine/types';
import { configureTreasury, dynastyExit, enableBeanPay, grantFranchise, lobbyBill, processTycoonWeek, signEnterprise, startPatent, tycoonOf } from '@/engine/tycoon';
import { balanceSheet } from '@/engine/management';
import { openStaffedStore } from '@/engine/empire';
const rich = (): GameState => ({ ...createInitialState(), cash: 50_000_000, unlockedModules: ['core_cafe', 'roastery', 'b2b_trade', 'capital_markets'], roastery: { ...createInitialState().roastery, owned: true, roastedStockKg: 10_000 } });
const stores = (n: number) => { let g = rich(); for (const c of g.cities) for (const d of c.districts) { if (g.stores.length >= n) return g; const r = openStaffedStore(g, c.id, d.id, 1); if (r.ok) g = r.state; } return g; };

describe('Konsolidierte Master-Mechaniken', () => {
  it('Franchise startet erst ab 15 umsatzstarken Filialen und bringt 50.000 € Lizenzgebühr', () => {
    const site = MASTER.cities[0]!.buildings.find(b => !createInitialState().world.occupants[b.id] && b.id !== 'berlin-09')!.id;
    expect(grantFranchise(rich(), site).ok).toBe(false);
    const g = { ...stores(15), stores: stores(15).stores.map(s => ({ ...s, weeklyRevenue: 1000 })) }, free = MASTER.cities.flatMap(c => c.buildings).find(b => !g.world.occupants[b.id] && !g.stores.some(s => s.districtId === b.id))!.id;
    const r = grantFranchise(g, free); expect(r.ok).toBe(true); expect(r.state.cash).toBe(g.cash + 50000); expect(tycoonOf(r.state).franchises[0]?.royalty).toBe(.06);
  });
  it('BeanPay-Guthaben ist eine Verbindlichkeit und keine Umsatzbuchung', () => {
    let g = enableBeanPay({ ...stores(61), stores: stores(61).stores.map(s => ({ ...s, customersServedLastWeek: 1000 })) }).state;
    g = configureTreasury(g, .6).state;
    const r = processTycoonWeek(g, createExpansion()).game, bp = tycoonOf(r).beanpay, row = r.management.history.at(-1)!;
    expect(bp.balance).toBeGreaterThan(0); expect(balanceSheet(r).customerLiability).toBe(bp.balance); expect(row.financing).toBeGreaterThanOrEqual(bp.balance);
  });
  it('Enterprise-SLA verlangt mindestens den vertraglichen Cupping-Score', () => {
    const g = rich(); expect(signEnterprise(g, 'hotel').ok).toBe(false);
    expect(signEnterprise({ ...g, tycoon: { ...tycoonOf(g), roastScore: 90 } }, 'hotel').state.b2b.contracts[0]?.minimumScore).toBe(90);
  });
  it('Lobbyismus kostet 50.000 € und ändert die Zustimmung um 25 Prozentpunkte', () => {
    const g = rich(), r = lobbyBill(g, true); expect(r.state.cash).toBe(g.cash - 50000); expect(tycoonOf(r.state).bills.berlin?.support).toBe(.77);
  });
  it('Dynastie-Exit braucht Ära 4 und genau zwei Vermächtnisse', () => {
    const g = stores(61); expect(dynastyExit(g, ['roast']).ok).toBe(false);
    const r = dynastyExit(g, ['roast', 'tech']); expect(r.ok).toBe(true); expect(tycoonOf(r.state).dynasty.generation).toBe(2); expect(tycoonOf(r.state).roastScore).toBe(89); expect(tycoonOf(r.state).beanpay.enabled).toBe(true);
  });
  it('Hardware-Patente starten erst ab Ära 2', () => {
    expect(startPatent(rich(), 'brew').ok).toBe(false); expect(startPatent(stores(6), 'brew').ok).toBe(true);
  });
});
