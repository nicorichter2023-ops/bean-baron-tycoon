import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { rankProgress, progressOf, setSettings } from '@/engine/progression';
import { simulateWeek } from '@/engine/week';
import { createExpansion } from '@/engine/expansion';
import { openStaffedStore, staffedOpeningCost } from '@/engine/empire';
import { storeOpeningCost } from '@/engine/engine';

describe('Technischer Abschluss', () => {
  it('Eröffnung inklusive erstem Barista ist atomar und kostet exakt den angezeigten Preis', () => {
    const g = createInitialState();
    const site = g.city.districts.find(d => !g.world.occupants[d.id] && !g.stores.some(s => s.districtId === d.id));
    if (!site) throw new Error('Freier Standort fehlt');
    const quote = staffedOpeningCost(g, g.city.id, site.id, 1);
    const onlyRent = { ...g, cash: storeOpeningCost(site, 1) };
    const rejected = openStaffedStore(onlyRent, g.city.id, site.id, 1);
    expect(rejected.ok).toBe(false); expect(rejected.state).toBe(onlyRent);
    const funded = { ...g, cash: quote };
    const opened = openStaffedStore(funded, g.city.id, site.id, 1);
    expect(opened.ok).toBe(true); expect(opened.state.cash).toBe(0);
    expect(opened.state.stores.at(-1)?.employees).toHaveLength(1);
  });
  it('Rang 10 bleibt das Endziel, auch mit allen erfüllten Anforderungen', () => {
    const base = createInitialState();
    const g = { ...base, cash: 1e9, brandReputation: 100, companyValuation: 1e9, progress: { ...progressOf(base), rank: 10 } };
    expect(rankProgress(g).next).toBeNull();
    expect(simulateWeek(g, createExpansion()).game.progress?.rank).toBe(10);
  });
  it('Töne und Haptik sind separat abschaltbar und verändern kein Geld', () => {
    const g = setSettings(createInitialState(), { sound: true, haptics: false });
    expect(g.progress?.settings.sound).toBe(true);
    expect(g.progress?.settings.haptics).toBe(false);
    expect(g.cash).toBe(50000);
  });
});