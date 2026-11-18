import { describe, expect, it } from 'vitest';
import { V2_CITIES, V2_EVENTS, V2_COMPANY_RULES, EDITOR_SLOTS } from '@/data/v2';
import { book, ledgerTotal, byAccount } from '@/engine/ledger';

const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);

describe('Coffee Empire 2.0 data', () => {
  it('has 20 cities with 6 neighborhoods each', () => {
    expect(V2_CITIES).toHaveLength(20);
    V2_CITIES.forEach(c => expect(c.nachbarschaften).toHaveLength(6));
  });
  it('guest mixes sum to 1', () => {
    V2_CITIES.forEach(c => { expect(sum(c.gaestemix)).toBeCloseTo(1, 2); c.nachbarschaften.forEach(n => expect(sum(n.gaestemix)).toBeCloseTo(1, 2)); });
  });
  it('has 80 unique events without futures or crypto', () => {
    expect(new Set(V2_EVENTS.map(e => e.id)).size).toBe(80);
    expect(V2_EVENTS.some(e => /future|krypto|crypto/i.test(e.titel + e.nachricht))).toBe(false);
  });
  it('has 12 industries and 40 name parts each', () => {
    expect(V2_COMPANY_RULES.branchen).toHaveLength(12);
    expect(V2_COMPANY_RULES.namensbausteine.praefixe).toHaveLength(40);
    expect(V2_COMPANY_RULES.namensbausteine.suffixe).toHaveLength(40);
  });
  it('editor has 5 slots with 5 rising-cost levels', () => {
    expect(Object.keys(EDITOR_SLOTS)).toHaveLength(5);
    Object.values(EDITOR_SLOTS).forEach(s => {
      expect(s.stufen).toHaveLength(5);
      s.stufen.slice(1).forEach((l, i) => expect(l.kostenEinmalig).toBeGreaterThan(s.stufen[i]!.kostenEinmalig));
    });
  });
});

describe('ledger', () => {
  it('totals and groups entries', () => {
    const e = [book('umsatz', 3000, 'Café'), book('miete', -800, 'Miete'), book('umsatz', 500.005, 'Snack')];
    expect(ledgerTotal(e)).toBe(2700.01);
    expect(byAccount(e)['umsatz']).toBeCloseTo(3500.01, 2);
  });
});
