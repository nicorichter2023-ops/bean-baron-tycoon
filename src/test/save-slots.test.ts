import { beforeEach, describe, expect, it } from 'vitest';
import { activeSlot, loadGame, resetGame, saveGame, setActiveSlot, slotSummaries } from '@/engine/save';
import { createInitialState } from '@/data';

describe('3 Speicherplätze', () => {
  beforeEach(() => localStorage.clear());
  it('startet auf Platz 1', () => expect(activeSlot()).toBe(1));
  it('Plätze bleiben getrennt', () => {
    saveGame({ ...createInitialState(), cash: 111 }, 1);
    saveGame({ ...createInitialState(), cash: 222 }, 2);
    expect(loadGame(1).cash).toBe(111);
    expect(loadGame(2).cash).toBe(222);
    expect(slotSummaries().map((s) => s.empty)).toEqual([false, false, true]);
  });
  it('Löschen trifft nur den aktiven Platz', () => {
    saveGame({ ...createInitialState(), cash: 111 }, 1);
    saveGame({ ...createInitialState(), cash: 222 }, 2);
    setActiveSlot(2); resetGame();
    expect(slotSummaries()[1].empty).toBe(true);
    expect(loadGame(1).cash).toBe(111);
  });
});
