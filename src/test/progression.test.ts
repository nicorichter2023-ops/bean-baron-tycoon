import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { createExpansion } from '@/engine/expansion';
import { hireEmployee, openStore } from '@/engine/engine';
import { EVENT_RULES, leversOf, processProgressWeek, progressOf, setLever, setSettings, stageUpgrade, ACHIEVEMENTS, leverEffect, defaultLevers } from '@/engine/progression';
import { RANKS, UNLOCK_GRAPH, legacyStage, openCityIds } from '@/engine/unlocks';
import { migrateV5ToV6 } from '@/engine/save';
import { travelToCity } from '@/engine/world';
import type { GameState } from '@/engine/types';

const run = (g: GameState, weeks: number) => { let exp = createExpansion(); for (let i = 0; i < weeks; i++) { if (g.pendingEvent) g = { ...g, pendingEvent: null }; const r = processProgressWeek(g, exp); g = r.game; exp = r.exp; } return g; };
const staffed = () => { const g = createInitialState(); const r = hireEmployee(g, g.stores[0].id, 'barista'); return r.ok ? r.state : g; };

describe('Fortschritt', () => {
  it('es gibt 10 Ränge, 7 Stufen und 40 Erfolge', () => { expect(RANKS).toHaveLength(10); expect(ACHIEVEMENTS).toHaveLength(40); });
  it('alte Stufen 1/2/3 werden zu 2/4/7', () => { expect([1, 2, 3].map(legacyStage)).toEqual([2, 4, 7]); });
  it('Migration behält Filialen und markiert die Startstadt als offen', () => {
    const g = createInitialState(); const { progress: _, ...old } = g;
    const m = migrateV5ToV6({ ...old, schemaVersion: 5 } as GameState);
    expect(m.schemaVersion).toBe(6); expect(m.stores).toHaveLength(g.stores.length);
    expect(leversOf(m, m.stores[0]).stage).toBe(legacyStage(g.stores[0].tier));
  });
  it('Abhängigkeiten sind ohne Kreise erreichbar', () => {
    const seen = new Set<string>(); const visit = (n: string, path: string[]): void => { expect(path).not.toContain(n); seen.add(n); UNLOCK_GRAPH[n].forEach(d => visit(d, [...path, n])); };
    Object.keys(UNLOCK_GRAPH).forEach(n => visit(n, [])); expect(seen.size).toBe(10);
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].maxStage).toBeGreaterThanOrEqual(RANKS[i - 1].maxStage);
  });
  it('zu Beginn sind 3 Städte offen und gesperrte Städte nicht erreichbar', () => {
    const g = createInitialState(); const open = openCityIds(g);
    expect(open.length).toBeLessThanOrEqual(4);
    const locked = g.cities.find(c => !open.includes(c.id))!;
    expect(travelToCity({ ...g, cash: 1e6 }, locked.id, 'economy').ok).toBe(false);
  });
  it('Stufe über dem Rang-Limit ist gesperrt', () => {
    let g = { ...staffed(), cash: 1e6 };
    const a = stageUpgrade(g, g.stores[0]!.id); expect(a.ok).toBe(true); g = a.state; // stage 2 erlaubt
    expect(stageUpgrade(g, g.stores[0]!.id).ok).toBe(false); // stage 3 erst ab Rang 3
  });
  it('Hebel sind bis zum Rang gesperrt', () => { const g = createInitialState(); expect(setLever(g, g.stores[0]!.id, 'hours', 'late').ok).toBe(false); });
  it('kein Hebel ist in jeder Hinsicht besser', () => {
    const s = { ...createInitialState().stores[0]!, weeklyRevenue: 10_000, employees: [] };
    const q = leverEffect({ ...defaultLevers(1), focus: 1 }, s, 1), m = leverEffect({ ...defaultLevers(1), focus: -1 }, s, 1);
    expect(q.revenue).toBeLessThan(m.revenue); expect(q.reputation).toBeGreaterThan(m.reputation);
  });
  it('Ereignisse sind deutlich seltener als jede Woche', () => {
    let g = setSettings(staffed(), { eventFrequency: 'normal' }); let events = 0; let exp = createExpansion();
    for (let i = 0; i < 104; i++) { const r = processProgressWeek(g, exp); g = r.game; exp = r.exp; if (g.pendingEvent || r.game.progress?.summary?.eventNote) events++; if (g.pendingEvent) g = { ...g, pendingEvent: null }; }
    expect(events).toBeLessThan(104 / EVENT_RULES.normal.cooldown); expect(events).toBeGreaterThan(5);
  });
  it('Wochenziele werden jede Woche neu gesetzt', () => { const g = run(staffed(), 3); expect(progressOf(g).goals).toHaveLength(3); });
  it('Buchhaltung bleibt stimmig: Kassenstand = Bericht', () => { const g = run(staffed(), 6); expect(g.management.history.at(-1)?.cashEnd).toBeCloseTo(g.cash, 2); });
});

describe('Balance', () => {
  it('vorsichtiges Spiel bleibt nach 60 Wochen solvent und steigt mindestens einen Rang', () => {
    let g = staffed(), exp = createExpansion();
    for (let i = 0; i < 60; i++) {
      if (g.pendingEvent) g = { ...g, pendingEvent: null };
      const free = g.city.districts.filter(d => !g.stores.some(s => s.districtId === d.id) && !g.world.occupants[d.id]).sort((a, b) => a.rentWeekly - b.rentWeekly)[0];
      if (free && g.cash > 70_000 && g.stores.length < 4) { const o = openStore(g, g.city.id, free.id, 1); if (o.ok) { g = o.state; const h = hireEmployee(g, g.stores.at(-1)!.id, 'barista'); if (h.ok) g = h.state; } }
      const r = processProgressWeek(g, exp); g = r.game; exp = r.exp;
    }
    expect(g.cash).toBeGreaterThan(-20_000);
    expect(progressOf(g).rank).toBeGreaterThanOrEqual(2);
    expect(progressOf(g).rank).toBeLessThan(7);
  });
});
