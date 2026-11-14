const money = (value: number) => value.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const EXACT: Record<string, string> = {
  TARGET_ALREADY_ACQUIRED: "Dieses Unternehmen wurde bereits übernommen.",
  INVALID_VALUATION_OR_OFFER: "Bewertung oder Angebot ist ungültig.",
  OFFER_BELOW_VALUATION: "Das Angebot liegt unter dem Unternehmenswert.",
  OFFER_ACCEPTED: "Das Übernahmeangebot wurde angenommen.",
  MODULE_LOCKED: "Dieser Bereich ist noch nicht freigeschaltet.",
  ALREADY_OWNED: "Das befindet sich bereits in deinem Besitz.",
  INSUFFICIENT_CASH: "Nicht genügend Barvermögen.",
  PURCHASED: "Rösterei erfolgreich gekauft.",
  EXTERNAL_SUPPLY_ONLY: "Bohnen über Großhandel bezogen (Aufpreis).",
  BANKRUPTCY_WARNING: "Warnung: Die Insolvenzgrenze ist unterschritten.",
  DISTRICT_NOT_FOUND: "Stadt oder Stadtviertel wurde nicht gefunden.",
  DISTRICT_OCCUPIED: "In diesem Stadtviertel besteht bereits eine Filiale.",
  TIER_NOT_ALLOWED: "Diese Ausbaustufe ist in diesem Stadtviertel nicht erlaubt.",
  STORE_NOT_FOUND: "Die Filiale wurde nicht gefunden.",
  MAX_TIER_REACHED: "Die höchste Ausbaustufe ist bereits erreicht.",
  EMPLOYEE_NOT_FOUND: "Der Mitarbeitende wurde nicht gefunden.",
  INVALID_AMOUNT: "Bitte einen gültigen Betrag eingeben.",
  LOAN_LIMIT_REACHED: "Der Kreditrahmen der Bank ist ausgeschöpft.",
  AMOUNT_EXCEEDS_DEBT: "Die Tilgung übersteigt die Restschuld.",
  COMPANY_NOT_AVAILABLE: "Dieses Unternehmen ist nicht verfügbar.",
  NO_SHARES_OWNED: "Du besitzt keine Aktien dieses Unternehmens.",
  NOT_ENOUGH_SHARES: "So viele Aktien besitzt du nicht.",
  STARTUP_NOT_AVAILABLE: "Dieses Startup ist derzeit nicht verfügbar.",
  ROASTERY_REQUIRED: "Dafür brauchst du zuerst eine eigene Rösterei.",
  BEAN_NOT_FOUND: "Diese Bohnensorte wurde nicht gefunden.",
  INVALID_CONTRACT: "Bitte Menge, Laufzeit und Preis des Vertrags prüfen.",
  NO_PENDING_EVENT: "Es wartet kein Ereignis auf eine Entscheidung.",
};

export function translateEngineNote(note: string): string {
  if (EXACT[note]) return EXACT[note];
  const premium = note.match(/^BOARD_DEMANDS_(\d+)_PCT_OF_VALUATION$/);
  if (premium) return `Der Vorstand fordert mindestens ${premium[1]} % des Unternehmenswerts.`;
  const [code, first, second, third] = note.split(":");
  switch (code) {
    case "UNDERDELIVERY": return `${first}: Liefermenge wegen zu geringen Lagerbestands nicht vollständig erfüllt.`;
    case "PAYMENT_DEFAULT": return `${first}: Zahlungsausfall bei einer B2B-Lieferung.`;
    case "STARTUP_EXIT": return `${first}: Erfolgreicher Exit – die Auszahlung ist eingegangen.`;
    case "STARTUP_FAILED": return `${first}: Das Investment ist gescheitert.`;
    case "ORPHAN_STORE": return `${first}: Stadtviertel fehlt; die Filiale konnte nicht abgerechnet werden.`;
    case "NO_STOCK": return `${first}: Der Verkauf wurde durch leere Bohnenbestände begrenzt.`;
    case "DIVIDENDS": return `Dividenden erhalten: ${money(Number(first))}.`;
    case "STORE_OPENED": return `${first} wurde eröffnet.`;
    case "STORE_UPGRADED": return `${first} wurde ausgebaut.`;
    case "EMPLOYEE_HIRED": return `${first} wurde eingestellt (Einstellungskosten: ein Wochengehalt).`;
    case "EMPLOYEE_RELEASED": return `${first} wurde entlassen (Abfindung: ein Wochengehalt).`;
    case "LOAN_TAKEN": return `Kredit über ${money(Number(first))} aufgenommen.`;
    case "LOAN_REPAID": return `${money(Number(first))} getilgt.`;
    case "SHARES_BOUGHT": return `${first} Aktien von ${second} gekauft.`;
    case "SHARES_SOLD": return `${first} Aktien von ${second} verkauft.`;
    case "COMPANY_ACQUIRED": return `${first} wurde übernommen.`;
    case "STARTUP_FUNDED": return `${first} wurde finanziert.`;
    case "STARTUP_ACQUIRED": return `${first} wurde vollständig übernommen.`;
    case "BEANS_BOUGHT": return `${first} kg ${second} auf Vorrat gekauft.`;
    case "CONTRACT_SIGNED": return `Liefervertrag mit ${first} abgeschlossen.`;
    case "EVENT_APPLIED": return `Ereignis entschieden: ${first}.`;
    case "EVENT_RESOLVED": return `Entscheidung für „${first}“ übernommen.`;
    default: return /^[A-Z_]+(?::|$)/.test(note) ? (third ? `${first}: ${second} ${third}` : "Spielstand aktualisiert.") : note;
  }
}
