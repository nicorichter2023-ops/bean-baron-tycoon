/** Single journal format for every cash movement; systems return entries, never mutate cash directly. */
export interface LedgerEntry { konto: string; betrag: number; grund: string }
export const book = (konto: string, betrag: number, grund: string): LedgerEntry => ({ konto, betrag: Math.round(betrag * 100) / 100, grund });
export const ledgerTotal = (entries: LedgerEntry[]) => Math.round(entries.reduce((n, e) => n + e.betrag, 0) * 100) / 100;
export const byAccount = (entries: LedgerEntry[]) => entries.reduce<Record<string, number>>((m, e) => ({ ...m, [e.konto]: (m[e.konto] ?? 0) + e.betrag }), {});
