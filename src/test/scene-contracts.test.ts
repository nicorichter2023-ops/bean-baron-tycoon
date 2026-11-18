import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data';
import { openStore, processTurn, saveGame, loadGame } from '@/engine';
import { CITY_POSITIONS, BIOME_SCENE } from '@/game/sceneAssets';

describe('Visuelle Spielwelt verwendet die bestehenden Spielregeln', () => {
  it('stellt alle 20 Metropolen und ihre vier Biome auf der Karte bereit', () => {
    const state = createInitialState();
    expect(Object.keys(CITY_POSITIONS)).toHaveLength(20);
    for (const city of state.cities) {
      expect(CITY_POSITIONS[city.id]).toHaveLength(2);
      expect(BIOME_SCENE[city.biome]).toMatch(/^\/__l5e\/assets-v1\//);
    }
  });
  it('schwebender Wochenumsatz verändert nicht zusätzlich das gespeicherte Barvermögen', () => {
    const before = createInitialState();
    const after = processTurn(before);
    saveGame(after);
    expect(loadGame().cash).toBe(after.cash);
    expect(after.cash).toBeCloseTo(before.cash + (after.lastReport?.netIncome ?? 0), 2);
    expect(loadGame().week).toBe(before.week + 1);
    expect(loadGame().schemaVersion).toBe(10);
  });
  it('ein belegtes Grundstück bleibt auch in der Szenenauswahl nicht erneut eröffnungsfähig', () => {
    const state = createInitialState();
    const store = state.stores[0];
    if (!store) throw new Error('Startfiliale fehlt');
    const result = openStore(state, store.cityId, store.districtId, 1);
    expect(result.ok).toBe(false);
    expect(result.state.stores).toHaveLength(state.stores.length);
  });
});