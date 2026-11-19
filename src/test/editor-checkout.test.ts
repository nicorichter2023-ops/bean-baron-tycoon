import { describe, expect, it } from 'vitest';
import { createInitialState } from '@/data/initialState';
import { commitEditor, editorCost, editorDraft } from '@/engine/editor';
import { storeCafe } from '@/engine/cafe';

describe('Atomic café checkout', () => {
  it('charges gear and design once, and persists the selected levels', () => {
    const g = createInitialState(), store = g.stores[0];
    if (!store) throw new Error('Missing store');
    const draft = editorDraft(g, store);
    draft.gear.espresso = 1;
    draft.gear.grinder = 1;
    draft.design.style = 1;
    const cost = editorCost(g, store, draft);
    expect(cost).toBe(3900);
    const r = commitEditor(g, store.id, draft);
    expect(r.ok).toBe(true);
    expect(r.state.cash).toBe(46100);
    expect(storeCafe(r.state, store).gear.espresso).toBe(1);
    expect(commitEditor(r.state, store.id, draft).state.cash).toBe(46100);
  });
  it('does not partially charge a locked upgrade', () => {
    const g = createInitialState(), store = g.stores[0];
    if (!store) throw new Error('Missing store');
    const draft = editorDraft(g, store);
    draft.gear.espresso = 1;
    draft.gear.grinder = 4;
    const r = commitEditor(g, store.id, draft);
    expect(r.ok).toBe(false);
    expect(r.state).toBe(g);
    expect(g.cash).toBe(50000);
  });
  it('can purchase a terrace and its style in the same checkout', () => {
    const g = createInitialState(), store = g.stores[0];
    if (!store) throw new Error('Missing store');
    const draft = editorDraft(g, store);
    draft.gear.terrace = 1;
    draft.design.terrace = 2;
    const r = commitEditor(g, store.id, draft);
    expect(r.ok).toBe(true);
    expect(r.state.cash).toBe(47600);
    expect(storeCafe(r.state, store).design?.terrace).toBe(2);
  });
});