import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import type { GameState } from '@/engine/types';
import * as E from '@/engine/empire';

const rich = (): GameState => ({ ...createInitialState(), cash: 50_000_000 });
const withStores = (n: number) => { let g = rich(); let k = 0; for (const c of g.cities) for (const d of c.districts) { if (k >= n) break; const r = E.openStaffedStore(g, c.id, d.id, 1); if (r.ok) { g = r.state; k++; } } return g; };

describe('Konzern-Ebene', () => {
  it('neue Filialen starten mit einem Barista', () => { const g = withStores(2); expect(g.stores.at(-1)!.employees).toHaveLength(1); });
  it('Gebäude nachträglich kaufen streicht die Miete', () => {
    const g = withStores(2), s = g.stores.at(-1)!, price = E.propertyPrice(s.districtId);
    const r = E.buyProperty(g, s.id); expect(r.ok).toBe(true); expect(r.state.cash).toBe(g.cash - price);
    expect(r.state.stores.at(-1)!.propertyBookValue).toBe(price);
  });
  it('Ketten-Aktionen erst ab 5 Filialen', () => {
    expect(E.chainPrice(withStores(3), 0.2).ok).toBe(false);
    const g = withStores(5); const r = E.chainPrice(g, 0.2); expect(r.ok).toBe(true);
    expect(r.state.stores.every((s, i) => s.pricePerCup === Math.round((g.stores[i]!.pricePerCup + 0.2) * 100) / 100)).toBe(true);
  });
  it('Rivalen-Standort ablösen macht ihn zur eigenen Filiale', () => {
    const g = rich(), site = Object.keys(g.world.occupants)[0]!;
    const r = E.takeoverRivalSite(g, site); expect(r.ok).toBe(true);
    expect(r.state.world.occupants[site]).toBeUndefined(); expect(r.state.stores.some(s => s.districtId === site)).toBe(true);
  });
  it('Firmenübernahme übergibt alle Cafés des Rivalen', () => {
    const g = { ...rich(), cash: 1e12, unlockedModules: [...rich().unlockedModules, 'capital_markets' as const] };
    const [site, rival] = Object.entries(g.world.occupants)[0]!; const company = g.capitalMarkets.rivals.find(r => r.id === rival);
    if (!company) return; const sites = Object.values(g.world.occupants).filter(o => o === rival).length;
    const r = E.acquireRivalWithStores(g, rival, Math.round(company.valuation * 1.45));
    expect(r.ok).toBe(true); expect(r.state.stores.length - g.stores.length).toBe(sites); expect(r.state.stores.some(s => s.districtId === site)).toBe(true);
  });
  it('Startup-Pipeline ist nie leer und Ticket wird abgebucht', () => {
    const g = rich(), v = E.empireOf(g).ventures.find(x => x.status === 'open')!;
    expect(E.empireOf(g).ventures.filter(x => x.status === 'open').length).toBeGreaterThanOrEqual(4);
    const r = E.investVenture(g, v.id); expect(r.state.cash).toBe(g.cash - v.ticket);
  });
  it('höchstens 6 Beteiligungen gleichzeitig', () => {
    let g = rich(); for (let i = 0; i < 10; i++) { const v = E.empireOf(g).ventures.find(x => x.status === 'open'); if (v) { const r = E.investVenture(g, v.id); g = r.ok ? r.state : E.passVenture(g, v.id).state; } }
    expect(E.empireOf(g).ventures.filter(x => x.status === 'active').length).toBe(6);
  });
  it('eigene Rösterei spart 20 % der Bohnenkosten', () => {
    const g = { ...rich(), roastery: { ...rich().roastery, owned: true } }; const w = E.supplyWeekly({ ...g, lastReport: { ...(g.lastReport ?? {} as never), costBeans: 1000 } });
    expect(w.savings).toBe(200);
  });
  it('Auto-Kampagne wird nach Ablauf verlängert', () => {
    let g = withStores(1); let x = createExpansion(); g = E.toggleAutoCampaign(g, 'tasting', g.stores[0]!.cityId);
    for (let i = 0; i < 3; i++) { g = { ...g, pendingEvent: null }; const o = E.processEmpireWeek(g, x); g = o.game; x = o.exp; }
    expect(x.campaigns.some(c => c.kind === 'tasting')).toBe(true);
  });
});
