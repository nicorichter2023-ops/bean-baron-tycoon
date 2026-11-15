import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { MASTER } from '@/data/master';
import { createExpansion } from '@/engine/expansion';
import type { GameState } from '@/engine/types';
import { configureTreasury, dynastyExit, enableBeanPay, grantFranchise, lobbyBill, processTycoonWeek, signEnterprise, startPatent, tycoonOf } from '@/engine/tycoon';
import { createManagement, balanceSheet } from '@/engine/management';
import { openStaffedStore, upgradeSupply } from '@/engine/empire';
import { demandEffects, weatherAt, propertyMarketFactor } from '@/engine/tycoonState';
import { processTurn, buyShares, openStore } from '@/engine/engine';
import { saveBlend, takeoverMajority } from '@/engine/tycoon';
import { MENU_LIMIT } from '@/engine/cafeContent';
const rich = (): GameState => ({ ...createInitialState(), cash: 50_000_000, unlockedModules: ['core_cafe', 'roastery', 'b2b_trade', 'capital_markets'], roastery: { ...createInitialState().roastery, owned: true, roastedStockKg: 10_000 } });
const stores = (n: number) => { let g = rich(); for (const c of g.cities) for (const d of c.districts) { if (g.stores.length >= n) return g; const r = openStaffedStore(g, c.id, d.id, 1); if (r.ok) g = r.state; } return g; };

describe('Konsolidierte Master-Mechaniken', () => {
  it('Franchise startet erst ab 15 umsatzstarken Filialen und bringt 50.000 € Lizenzgebühr', () => {
    const site = MASTER.cities[0]?.buildings.find(b => !createInitialState().world.occupants[b.id] && b.id !== 'berlin-09')?.id;
    if (!site) throw new Error('Freier Standort fehlt');
    expect(grantFranchise(rich(), site).ok).toBe(false);
    const g = { ...stores(15), stores: stores(15).stores.map(s => ({ ...s, weeklyRevenue: 1000 })) }, free = MASTER.cities.flatMap(c => c.buildings).find(b => !g.world.occupants[b.id] && !g.stores.some(s => s.districtId === b.id))?.id;
    if (!free) throw new Error('Franchise-Standort fehlt');
    const r = grantFranchise(g, free); expect(r.ok).toBe(true); expect(r.state.cash).toBe(g.cash + 50000); expect(tycoonOf(r.state).franchises[0]?.royalty).toBe(.06);
  });
  it('BeanPay-Guthaben ist eine Verbindlichkeit und keine Umsatzbuchung', () => {
    let g = enableBeanPay({ ...stores(61), stores: stores(61).stores.map(s => ({ ...s, customersServedLastWeek: 1000 })) }).state;
    g = configureTreasury(g, .6).state;
    const r = processTycoonWeek(g, createExpansion()).game, bp = tycoonOf(r).beanpay, row = r.management.history.at(-1);
    if (!row) throw new Error('Wochenbericht fehlt');
    expect(bp.balance).toBeGreaterThan(0); expect(balanceSheet(r).customerLiability).toBe(bp.balance); expect(row.financing).toBeGreaterThanOrEqual(bp.balance);
  });
  it('Enterprise-SLA verlangt mindestens den vertraglichen Cupping-Score', () => {
    const g = rich(); expect(signEnterprise(g, 'hotel').ok).toBe(false);
    expect(signEnterprise({ ...g, tycoon: { ...tycoonOf(g), roastScore: 90 } }, 'hotel').state.b2b.contracts[0]?.minimumScore).toBe(90);
  });
  it('Lobbyismus kostet 50.000 € und ändert die Zustimmung um 25 Prozentpunkte', () => {
    const g = rich(), r = lobbyBill(g, true); expect(r.state.cash).toBe(g.cash - 50000); expect(tycoonOf(r.state).bills['berlin']?.support).toBe(.77);
  });
  it('Dynastie-Exit braucht Ära 4 und genau zwei Vermächtnisse', () => {
    const g = stores(61); expect(dynastyExit(g, ['roast']).ok).toBe(false);
    const r = dynastyExit(g, ['roast', 'tech']); expect(r.ok).toBe(true); expect(tycoonOf(r.state).dynasty.generation).toBe(2); expect(tycoonOf(r.state).roastScore).toBe(89); expect(tycoonOf(r.state).beanpay.enabled).toBe(true);
  });
  it('Hardware-Patente starten erst ab Ära 2', () => {
    expect(startPatent(rich(), 'brew').ok).toBe(false); expect(startPatent(stores(6), 'brew').ok).toBe(true);
  });
  it('Sommerhitze steigert Kaltgetränke um 150 % und senkt Heißgetränke um 40 %', () => {
    const g = rich(), store = g.stores[0]; if (!store) throw new Error('Filiale fehlt');
    const week = Array.from({ length: 52 }, (_, i) => i + 1).find(w => weatherAt(w, store.cityId).heat); if (!week) throw new Error('Keine Hitzewelle');
    const hot = { ...g, week: week - 1 }, cold = { ...hot, cafe: { ...g.cafe, rivalPressure: g.cafe?.rivalPressure ?? {}, stores: { ...g.cafe?.stores, [store.id]: { menu: ['iced'], decor: {}, xp: 0, gear: { espresso: 0, grinder: 0, seating: 0, vitrine: 0, terrace: 0 } } }, research: g.cafe?.research ?? { done: [], active: null, points: 0 } } };
    expect(demandEffects(cold, store).demand / demandEffects(hot, store).demand).toBeCloseTo(2.5 / .6);
  });
  it('Signature Blend verbraucht genau 70 % und 30 % der gewählten Rohbohnen', () => {
    const g = rich(), a = g.market.beanVarieties[0], b = g.market.beanVarieties[1]; if (!a || !b) throw new Error('Bohnen fehlen');
    const r = saveBlend({ ...g, stores: [], roastery: { ...g.roastery, autoRestock: false, roastedStockKg: 0, rawBeanStockKg: 1000, capacityKgPerWeek: 100, employees: [], beanLots: [{ beanId: a.id, quantityKg: 500, averagePricePerKg: 5 }, { beanId: b.id, quantityKg: 500, averagePricePerKg: 5 }] } }, '70/30', a.id, b.id, 70, 'medium');
    const n = processTurn(r.state); expect(n.roastery.beanLots.find(l => l.beanId === a.id)?.quantityKg).toBe(430); expect(n.roastery.beanLots.find(l => l.beanId === b.id)?.quantityKg).toBe(470);
  });
  it('Menü hat höchstens sechs Getränke', () => { expect(MENU_LIMIT.drink).toBe(6); });
  it('Rösterei-Upgrade verdoppelt den tatsächlichen Ausstoß', () => {
    const g = { ...rich(), stores: [], roastery: { ...rich().roastery, rawBeanStockKg: 10000, roastedStockKg: 0, autoRestock: false, employees: [] } }, upgraded = upgradeSupply(g, 'roaster').state;
    expect(processTurn(upgraded).roastery.roastedStockKg).toBe(processTurn(g).roastery.roastedStockKg * 2);
  });
  it('51 % übertragen Filialen, Röstkapazität und Verträge ohne erneuten Firmenpreis', () => {
    const g = { ...rich(), cash: 1_000_000_000_000_000 }, company = g.capitalMarkets.rivals.find(c => Object.values(g.world.occupants).includes(c.id)); if (!company) throw new Error('Firma fehlt');
    const bought = buyShares(g, company.id, Math.ceil(company.sharesOutstanding * .51)); expect(bought.ok, bought.reason).toBe(true);
    const r = takeoverMajority(bought.state, company.id); expect(r.ok, r.reason).toBe(true); expect(r.state.cash).toBe(bought.state.cash); expect(r.state.stores.length).toBeGreaterThan(g.stores.length); expect(r.state.roastery.capacityKgPerWeek).toBe(g.roastery.capacityKgPerWeek + 1500); expect(r.state.b2b.contracts.at(-1)?.weeksRemaining).toBe(52);
  });
  it('Franchise-Standorte sind nicht als eigene Cafés doppelt eröffnungsfähig', () => {
    const g = rich(), site = g.city.districts.find(d => !g.world.occupants[d.id] && !g.stores.some(s => s.districtId === d.id)); if (!site) throw new Error('Standort fehlt');
    const occupied = { ...g, tycoon: { ...tycoonOf(g), franchises: [{ id: 'fr', districtId: site.id, cityId: g.city.id, quality: 85, royalty: .06, revenue: 0, supplied: 0, violations: 0 }] } };
    expect(openStore(occupied, g.city.id, site.id, 1).ok).toBe(false);
  });
  it('61 Cafés und Vertriebskanäle laufen 52 Wochen mit exakt abgestimmtem Cashflow', () => {
    let g = stores(61), exp = createExpansion();
    g = { ...g, cash: 100_000_000, management: createManagement(100_000_000, balanceSheet(g).inventory), roastery: { ...g.roastery, capacityKgPerWeek: 20000 }, tycoon: { ...tycoonOf(g), beanpay: { ...tycoonOf(g).beanpay, enabled: true }, patents: ['brew', 'drum', 'energy'], licensePatents: true } };
    for (let i = 0; i < 52; i++) {
      g = { ...g, pendingEvent: null }; const r = processTycoonWeek(g, exp); g = r.game; exp = r.exp;
      const row = g.management.history.at(-1); if (!row) throw new Error('Bericht fehlt');
      expect(row.cashStart + row.operating + row.investing + row.financing).toBeCloseTo(row.cashEnd, 1);
      expect(g.stores.filter(s => s.weeklyRevenue > 0)).toHaveLength(61); expect(Number.isFinite(g.cash)).toBe(true);
    }
    expect(g.week).toBe(53);
  });

});
