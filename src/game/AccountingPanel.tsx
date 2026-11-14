import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { balanceSheet } from '@/engine/management';
import { eur, useGame } from './GameContext';

export function AccountingPanel() {
  const { state } = useGame();
  const [view, setView] = useState<'pnl' | 'balance' | 'cash'>('pnl');
  const [week, setWeek] = useState(0);
  const history = state.management?.history ?? [];
  const row = history.find(r => r.week === week) ?? history.at(-1);
  const b = balanceSheet(state);
  const rows: [string, number, boolean?][] = view === 'balance' ? [
    ['Barvermögen', b.cash], ['Filialwerte inkl. Ausstattung', b.stores], ['Davon Ausstattung (Buchwert)', b.equipment], ['Rösterei', b.roastery], ['Bohnenvorräte', b.inventory], ['Beteiligungen', b.investments], ['Luxusvermögen', b.luxury], ['Aktiva gesamt', b.assets, true], ['Schulden', b.debt], ['Eigenkapital', b.equity, true], ['Passiva gesamt', b.debt + b.equity, true],
  ] : !row ? [] : view === 'cash' ? [
    ['Anfangsbestand', row.cashStart], ['Operativer Cashflow', row.operating], ['Investitionen & Beteiligungen', row.investing], ['Kredite & Tilgungen', row.financing], ['Veränderung', row.operating + row.investing + row.financing, true], ['Endbestand', row.cashEnd, true],
  ] : [
    ['Tassen & Signature Drinks', row.cups], ['B2B-Umsatz', row.b2b], ['Nebeneinnahmen & Kapital', row.other], ['Gesamtumsatz', row.cups + row.b2b + row.other, true],
    ['Personal inkl. HQ', -row.salaries], ['Mieten', -row.rent], ['Bohneneinkauf / externe Versorgung', -row.beans], ['Rezeptzutaten', -row.ingredients], ['Zinsen', -row.interest], ['Laufende Luxusausgaben', -row.upkeep], ['Einstellungen, Werbung & Ereignisse', -row.oneOff], ['Bestandsveränderung', row.inventoryChange], ['Steuern', -row.tax], ['Wochengewinn', row.profit, true],
  ];
  return <section className="accounting-panel">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-display text-2xl font-bold">Accounting</h1>
      {view !== 'balance' && history.length > 0 && <select aria-label="Berichtswoche" value={row?.week} onChange={e => setWeek(Number(e.target.value))} className="min-h-11 rounded-md border border-input bg-background px-3 text-sm">{history.slice().reverse().map(r => <option key={r.week} value={r.week}>Woche {r.week}</option>)}</select>}
    </div>
    <div className="management-switch my-4" aria-label="Finanzbericht">{([['pnl', 'GuV'], ['balance', 'Bilanz'], ['cash', 'Cashflow']] as const).map(([id, label]) => <Button key={id} variant={view === id ? 'secondary' : 'ghost'} aria-pressed={view === id} onClick={() => setView(id)}>{label}</Button>)}</div>
    <p className="mb-3 text-xs text-muted-foreground">{view === 'balance' ? `Woche ${state.week} · Filialen zu Spielwerten; Ausstattung zu Anschaffungskosten ohne Abschreibung. „Davon“ ist bereits im Filialwert enthalten.` : row ? `Abgeschlossene Spielwoche ${row.week}` : 'Noch keine abgeschlossene Spielwoche.'}</p>
    <dl className="financial-ledger">{rows.map(([label, value, total]) => <div key={label} className={total ? 'ledger-total' : ''}><dt>{label}</dt><dd className={value < 0 ? 'text-destructive' : total ? 'text-success' : ''}>{eur(value)}</dd></div>)}</dl>
    {view === 'pnl' && row && <p className="mt-4 text-xs text-muted-foreground">Bestandsänderungen berücksichtigen verbrauchte Bohnen und die Bewertung zum aktuellen Spielpreis. Ausgaben vor der ersten erfassten Woche werden nicht rückwirkend rekonstruiert.</p>}
  </section>;
}