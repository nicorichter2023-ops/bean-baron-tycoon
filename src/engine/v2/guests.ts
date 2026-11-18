// guests.ts – Gäste, Zulauf und Umsatz pro Woche (reine Logik, keine UI)
import editor from "@/data/v2/editor.json";
import type { LedgerEntry } from "../ledger";

export type { LedgerEntry } from "../ledger";

// ---------- Typen ----------
export const SLOT_NAMEN = ["maschine", "theke", "moebel", "waende_licht", "terrasse"] as const;
export type SlotName = (typeof SLOT_NAMEN)[number];
export type SlotStufe = 0 | 1 | 2 | 3 | 4 | 5;
export const GAST_TYPEN = ["pendler", "studenten", "geniesser", "touristen"] as const;
export type GastTyp = (typeof GAST_TYPEN)[number];

export interface CafeSetup {
  slots: Record<SlotName, SlotStufe>;
  preisIndex: number; // 0.6..1.8, 1 = Normalpreis
  personal: number;
  moral: number; // 0..1
  sterne: number; // 1..5
  marketing: number; // 0..1
}

export interface Nachbarschaft {
  id?: string;
  name?: string;
  typ?: string;
  gaestemix: Record<GastTyp, number>;
  mieteBasisWoche: number;
  passantenFrequenz: number;
}

export interface Stadt {
  id?: string;
  name?: string;
  kaufkraft: number;
  kaffeekultur: number;
}

export interface GuestCtx {
  rng: () => number; // 0..1, deterministisch (vom Aufrufer geseedet)
  saisonSommer: boolean;
  rivalenDruck: number; // 0..1
  modifier: (ziel: string) => number;
}

export interface GuestResult {
  gaeste: Record<GastTyp, number>;
  umsatz: number;
  durchschnittsBon: number;
  auslastung: number; // 0..1
  zufriedenheit: number; // 0..1
  gruende: string[];
  kapazitaet: number; // Gäste pro Woche (Zusatzinfo)
}

export interface GuestsState {
  setup: CafeSetup;
  nachbarschaft: Nachbarschaft;
  stadt: Stadt;
  woche: number;
  gaesteGesamt: number;
  letztesErgebnis: GuestResult | null;
}

export interface StepResult<S> {
  state: S;
  ledger: LedgerEntry[];
  notes: string[];
}

export interface EditorWirkung {
  tempo: number;
  qualitaet: number;
  snackBonus: number;
  sitzplaetze: number;
  verweilFaktor: number;
  komfort: number;
  ambiente: number;
  terrassePlaetze: number;
}

interface Grund {
  text: string;
  gewicht: number;
}

// ---------- Editor-Daten ----------
interface EditorStufe {
  stufe: number;
  effekte: Record<string, number>;
}
interface EditorDaten {
  slots: Record<string, { stufen: EditorStufe[] }>;
}
const EDITOR = editor as unknown as EditorDaten;

// ---------- Konstanten ----------
const GAESTE_FAKTOR = 12; // Gäste pro Passantenpunkt (Basis)
const GAESTE_PRO_PERSONAL_TAG = 70;
const TAGE = 7;
const UMSCHLAEGE_TAG = 6; // Sitzplatz-Wechsel pro Tag
const TAKEAWAY_ZUSCHLAG = 1.5; // Mitnahme-Kunden brauchen keinen Platz
const MAX_ZULAUF_PLUS = 0.4;
const MAX_RIVALEN_MINUS = 0.3;
const RAUSCHEN = 0.08; // ±8 % Wochenrauschen je Gästetyp
const MAX_KULTUR = 3;
// Preiswirkung: oberhalb des Normalpreises steigt die Empfindlichkeit progressiv,
// unterhalb wirkt Preissenkung nur abgeschwächt (verhindert "Preis auf Maximum"
// bzw. "Preis auf Minimum + Kapazität ausreizen" als dominante Strategie).
const PREIS_PROGRESSION = 1.5;
const PREIS_SENKUNG_DAEMPFUNG = 0.7;

const ELASTIZITAET: Record<GastTyp, number> = {
  studenten: 1.8,
  pendler: 1.0,
  touristen: 0.6,
  geniesser: 0.5,
};
const BASIS_BON: Record<GastTyp, number> = {
  pendler: 3.4,
  studenten: 2.9,
  geniesser: 5.6,
  touristen: 5.0,
};
const SNACK_GEWICHT: Record<GastTyp, number> = {
  pendler: 0.6,
  studenten: 0.5,
  geniesser: 1.0,
  touristen: 1.0,
};
const TYP_NAME: Record<GastTyp, string> = {
  pendler: "Pendler",
  studenten: "Studenten",
  geniesser: "Genießer",
  touristen: "Touristen",
};

// ---------- Hilfsfunktionen ----------
function sicher(x: unknown, fallback: number): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}
function klemme(x: number, lo: number, hi: number, fallback: number = lo): number {
  return Math.max(lo, Math.min(hi, sicher(x, fallback)));
}
function runde2(x: number): number {
  return Math.round(sicher(x, 0) * 100) / 100;
}
function leerGaeste(): Record<GastTyp, number> {
  return { pendler: 0, studenten: 0, geniesser: 0, touristen: 0 };
}

/** Wert aus editor.json; Stufe 0 oder fehlend → Fallback. */
function effekt(slot: SlotName, stufe: number, key: string, fallback: number): number {
  if (stufe <= 0) return fallback;
  const s = EDITOR?.slots?.[slot]?.stufen?.find((x) => x.stufe === stufe);
  const v = s?.effekte?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Eingaben auf gültige Bereiche begrenzen (ohne Original zu ändern). */
export function bereinigeSetup(setup: CafeSetup): CafeSetup {
  const stufe = (n: number): SlotStufe => Math.round(klemme(n, 0, 5)) as SlotStufe;
  const s = setup?.slots ?? ({} as CafeSetup["slots"]);
  return {
    slots: {
      maschine: stufe(s.maschine),
      theke: stufe(s.theke),
      moebel: stufe(s.moebel),
      waende_licht: stufe(s.waende_licht),
      terrasse: stufe(s.terrasse),
    },
    preisIndex: klemme(setup?.preisIndex, 0.6, 1.8, 1),
    personal: Math.max(0, Math.floor(sicher(setup?.personal, 0))),
    moral: klemme(setup?.moral, 0, 1, 0.5),
    sterne: klemme(setup?.sterne, 1, 5, 1),
    marketing: klemme(setup?.marketing, 0, 1, 0),
  };
}

/** Wirkungen der Slots laut editor.json. Terrasse nur im Sommer. */
export function editorWirkung(slots: CafeSetup["slots"], saisonSommer: boolean): EditorWirkung {
  return {
    tempo: effekt("maschine", slots.maschine, "zubereitungstempo", 0.6),
    qualitaet: effekt("maschine", slots.maschine, "kaffeequalitaet", 1),
    snackBonus: effekt("theke", slots.theke, "snackUmsatzBonus", 0),
    sitzplaetze: effekt("moebel", slots.moebel, "sitzplaetze", 4),
    verweilFaktor: effekt("moebel", slots.moebel, "verweildauerFaktor", 1),
    komfort: effekt("moebel", slots.moebel, "komfortBonus", 0),
    ambiente: effekt("waende_licht", slots.waende_licht, "ambienteBonus", 0),
    terrassePlaetze: saisonSommer ? effekt("terrasse", slots.terrasse, "zusatzPlaetzeSommer", 0) : 0,
  };
}

/** Effektive Preis-Elastizität (progressiv über Normalpreis, gedämpft darunter). */
function preisExponent(basis: number, kaufkraft: number, preisIndex: number): number {
  const eff = basis / Math.sqrt(kaufkraft);
  if (preisIndex >= 1) return eff * (1 + PREIS_PROGRESSION * (preisIndex - 1));
  return eff * PREIS_SENKUNG_DAEMPFUNG;
}

// ---------- Hauptfunktion ----------
export function simulateGuests(
  setupIn: CafeSetup,
  nachbarschaft: Nachbarschaft,
  stadt: Stadt,
  ctx: GuestCtx,
): GuestResult {
  const setup = bereinigeSetup(setupIn);
  const w = editorWirkung(setup.slots, ctx.saisonSommer === true);
  const kaufkraft = klemme(stadt?.kaufkraft, 0.5, 2, 1);
  const kultur = klemme(stadt?.kaffeekultur, 0, MAX_KULTUR, 1);
  const frequenz = Math.max(0, sicher(nachbarschaft?.passantenFrequenz, 0));
  const rivalen = klemme(ctx.rivalenDruck, 0, 1, 0);
  const rngSafe = (): number => klemme(ctx.rng(), 0, 0.999999, 0.5);
  const modSafe = (ziel: string): number =>
    typeof ctx.modifier === "function" ? klemme(ctx.modifier(ziel), 0, 5, 1) : 1;

  // Zulauf: Sterne + Marketing (max. +40 %), Rivalen (max. −30 %)
  const plus = Math.min(
    MAX_ZULAUF_PLUS,
    ((setup.sterne - 1) / 4) * 0.25 + setup.marketing * 0.15,
  );
  const minus = Math.min(MAX_RIVALEN_MINUS, rivalen * MAX_RIVALEN_MINUS);
  const zulauf = (1 + plus) * (1 - minus);

  // Attraktivität je Typ aus den Editor-Wirkungen
  const attraktiv: Record<GastTyp, number> = {
    pendler: 0.7 + 0.3 * w.tempo,
    studenten: 1,
    geniesser: (0.7 + 0.15 * w.qualitaet) * (1 + 0.8 * w.ambiente),
    touristen: 1 + 2 * w.ambiente,
  };

  const potenzial = leerGaeste();
  const preisFaktor = leerGaeste();
  const roh = leerGaeste();
  let potenzialSumme = 0;

  // RNG-Reihenfolge fest: genau ein Zug je Gästetyp, immer in GAST_TYPEN-Reihenfolge
  for (const typ of GAST_TYPEN) {
    const mix = Math.max(0, sicher(nachbarschaft?.gaestemix?.[typ], 0));
    const mod = modSafe("gaeste." + typ);
    potenzial[typ] = Math.max(0, frequenz * GAESTE_FAKTOR * kultur * mix * mod);
    potenzialSumme += potenzial[typ];
    const exponent = preisExponent(ELASTIZITAET[typ], kaufkraft, setup.preisIndex);
    preisFaktor[typ] = klemme(Math.pow(setup.preisIndex, -exponent), 0.1, 2.5, 1);
    const rausch = 1 + (rngSafe() - 0.5) * 2 * RAUSCHEN;
    roh[typ] = Math.max(0, potenzial[typ] * preisFaktor[typ] * attraktiv[typ] * zulauf * rausch);
  }
  const rohSumme = GAST_TYPEN.reduce((s, t) => s + roh[t], 0);

  // Kapazität: Personal und Sitzplätze (inkl. Terrasse im Sommer)
  const kapPersonal =
    setup.personal * GAESTE_PRO_PERSONAL_TAG * (0.7 + 0.3 * setup.moral) * TAGE;
  const kapSitz =
    ((w.sitzplaetze + w.terrassePlaetze) * UMSCHLAEGE_TAG * TAGE * TAKEAWAY_ZUSCHLAG) /
    Math.max(0.5, w.verweilFaktor);
  const kapazitaet = Math.max(0, Math.floor(Math.min(kapPersonal, kapSitz)));

  // Überschuss geht verloren
  const skala = rohSumme > kapazitaet ? (rohSumme > 0 ? kapazitaet / rohSumme : 0) : 1;
  const gaeste = leerGaeste();
  for (const typ of GAST_TYPEN) {
    gaeste[typ] = Math.max(0, Math.floor(roh[typ] * skala));
  }
  const gesamt = GAST_TYPEN.reduce((s, t) => s + gaeste[t], 0);
  const verloren = Math.max(0, rohSumme - gesamt);
  const verlustAnteil = rohSumme > 0 ? Math.min(1, verloren / rohSumme) : 0;

  // Umsatz: Bon je Typ, Preisindex, Kaufkraft, Snacks
  let umsatz = 0;
  for (const typ of GAST_TYPEN) {
    const bon =
      BASIS_BON[typ] *
      setup.preisIndex *
      (0.9 + 0.1 * kaufkraft) *
      (1 + w.snackBonus * SNACK_GEWICHT[typ]);
    umsatz += gaeste[typ] * bon;
  }
  umsatz = Math.max(0, runde2(umsatz));
  const durchschnittsBon = gesamt > 0 ? runde2(umsatz / gesamt) : 0;
  const auslastung = kapazitaet > 0 ? klemme(gesamt / kapazitaet, 0, 1) : 0;

  // Zufriedenheit
  const zufriedenheit = klemme(
    0.3 +
      0.15 * setup.moral +
      0.1 * ((w.qualitaet - 1) / 4) +
      0.1 * ((w.tempo - 0.6) / 1.2) +
      0.3 * w.ambiente +
      0.4 * w.komfort -
      0.3 * verlustAnteil -
      0.2 * Math.max(0, setup.preisIndex - 1),
    0,
    1,
  );

  // Gründe sammeln und die 2 wichtigsten wählen
  const kandidaten: Grund[] = [];
  for (const typ of GAST_TYPEN) {
    const anteil = potenzialSumme > 0 ? potenzial[typ] / potenzialSumme : 0.25;
    const delta = 1 - preisFaktor[typ];
    if (delta > 0.05) {
      kandidaten.push({ text: `${TYP_NAME[typ]} finden es zu teuer`, gewicht: delta * anteil });
    } else if (delta < -0.05) {
      kandidaten.push({
        text: `Günstige Preise locken ${TYP_NAME[typ]} an`,
        gewicht: -delta * anteil * 0.5,
      });
    }
  }
  const aPend = attraktiv.pendler - 1;
  if (aPend < -0.03) {
    kandidaten.push({ text: "Pendlern geht es zu langsam", gewicht: -aPend * 0.5 });
  } else if (aPend > 0.1) {
    kandidaten.push({ text: "Pendler schätzen das schnelle Tempo", gewicht: aPend * 0.5 });
  }
  const aGen = 0.7 + 0.15 * w.qualitaet - 1;
  if (aGen < -0.03) {
    kandidaten.push({ text: "Genießern fehlt die Kaffeequalität", gewicht: -aGen * 0.5 });
  } else if (aGen > 0.2) {
    kandidaten.push({ text: "Genießer schätzen die Kaffeequalität", gewicht: aGen * 0.5 });
  }
  if (w.ambiente < 0.05) {
    kandidaten.push({ text: "Touristen vermissen Ambiente", gewicht: 0.12 });
  } else if (attraktiv.touristen > 1.3) {
    kandidaten.push({
      text: "Touristen lieben das Ambiente",
      gewicht: (attraktiv.touristen - 1) * 0.5,
    });
  }
  if (rivalen > 0.02) {
    kandidaten.push({ text: "Rivalen nehmen dir Gäste ab", gewicht: minus });
  }
  if (plus > 0.1) {
    kandidaten.push({ text: "Sterne und Marketing bringen Zulauf", gewicht: plus * 0.5 });
  }
  if (verlustAnteil > 0.01) {
    const ursache = kapPersonal < kapSitz ? "zu wenig Personal" : "zu wenig Sitzplätze";
    kandidaten.push({
      text: `Café ist zu voll (${ursache}), Gäste gehen verloren`,
      gewicht: verlustAnteil * 1.5,
    });
  }
  // Stabile Sortierung: bei Gleichstand Einfüge-Reihenfolge (deterministisch)
  kandidaten.sort((a, b) => b.gewicht - a.gewicht);
  const gruende = kandidaten.slice(0, 2).map((k) => k.text);
  while (gruende.length < 2) {
    gruende.push(gruende.length === 0 ? "Nachfrage im Normalbereich" : "Keine besonderen Auffälligkeiten");
  }

  return { gaeste, umsatz, durchschnittsBon, auslastung, zufriedenheit, gruende, kapazitaet };
}

// ---------- Wochenschritt (reiner Zustandsübergang) ----------
export function wocheSimulieren(state: GuestsState, ctx: GuestCtx): StepResult<GuestsState> {
  const ergebnis = simulateGuests(state.setup, state.nachbarschaft, state.stadt, ctx);
  const gesamt = GAST_TYPEN.reduce((s, t) => s + ergebnis.gaeste[t], 0);
  const ledger: LedgerEntry[] = [];
  if (ergebnis.umsatz > 0) {
    ledger.push({
      konto: "umsatz.gaeste",
      betrag: ergebnis.umsatz,
      grund: `Wochenumsatz Woche ${state.woche + 1} (${gesamt} Gäste)`,
    });
  }
  const neu: GuestsState = {
    ...state,
    setup: { ...state.setup, slots: { ...state.setup.slots } },
    woche: state.woche + 1,
    gaesteGesamt: state.gaesteGesamt + gesamt,
    letztesErgebnis: { ...ergebnis, gaeste: { ...ergebnis.gaeste }, gruende: [...ergebnis.gruende] },
  };
  return { state: neu, ledger, notes: [...ergebnis.gruende] };
}
