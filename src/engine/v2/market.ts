// market.ts – lebendiger Firmenmarkt (rein, deterministisch, JSON-serialisierbar)
import regelnJson from "@/data/v2/company-rules.json";
import type { LedgerEntry } from "../ledger";

export type { LedgerEntry };

export type Phase =
  | "seed"
  | "series_a"
  | "growth"
  | "ipo_reif"
  | "stabil"
  | "krise"
  | "pleite"
  | "uebernommen";

export type RundenKey = "seed" | "series_a" | "growth_pe";

export interface Company {
  id: number;
  name: string;
  branche: string;
  phase: Phase;
  wochenInPhase: number;
  umsatzJahr: number;
  marge: number;
  bewertung: number;
  kurs: number | null;
  aktienGesamt: number;
  anteilSpieler: number;
  anteilRivalen: number;
  trend: number;
  historie: number[];
  letzteRundeWoche?: number;
}

export interface MarketState {
  firmen: Company[];
  naechsteId: number;
  woche: number;
  branchenEffekt?: Record<string, number>;
}

export interface Makro {
  zins: number;
  kaufkraft: number;
  branchenMultiplikator: Record<string, number>;
}

export interface MarketCtx {
  rng: () => number;
  woche: number;
  makro: Makro;
}

export interface MarketResult {
  state: MarketState;
  ledger: LedgerEntry[];
  notes: string[];
}

export interface BranchenRegel {
  id: string;
  name: string;
  basisWachstumJaehrlich: number;
  volatilitaet: number;
  ausfallRisiko: number;
  typischeEbitdaMarge: number;
  synergie: { bereich: string; wirkungProzent: number };
}

export interface PhasenRegel {
  dauerWochenMin: number;
  dauerWochenMax: number;
  naechstePhaseChance: Record<string, number>;
}

export interface RundenRegel {
  bewertungMin: number;
  bewertungMax: number;
  typischesTicket: number;
  anteilProzent: number;
}

export interface Regeln {
  branchen: BranchenRegel[];
  lebenszyklusPhasen: Record<string, PhasenRegel>;
  namensbausteine: { praefixe: string[]; suffixe: string[] };
  finanzierungsrunden: Record<RundenKey, RundenRegel> & {
    ipo: { mindestMarktkapitalisierung: number; freeFloatProzent: number };
  };
}

const REGELN = regelnJson as unknown as Regeln;

// Konstanten
const SPREAD = 0.005;
const MARKT_IMPACT = 0.5;
const PLEITE_SICHTBAR = 8;
const MIN_AKTIV = 22;
const MAX_AKTIV = 30;
const HISTORIE_MAX = 52;
const DIVIDENDEN_QUOTE = 0.4;
const UEBERNAHME_AUFSCHLAG = 0.25;
const WERT_MIN = 1000;
const WERT_MAX = 1e12;
const MARKT_VOL = 0.018;
const IDIO_ANTEIL = 0.8;
const PRIVAT_AUSFALL_FAKTOR = 0.5;
const RUNDEN_MAX_SPRUNG = 3;
const PE_MARGEN_FAKTOR = 0.8;
const PE_EXIT_ABSCHLAG = 0.85;
const ZINS_NEUTRAL = 0.04;

const FALLBACK_BRANCHE: BranchenRegel = {
  id: "fallback",
  name: "Allgemein",
  basisWachstumJaehrlich: 0.03,
  volatilitaet: 0.3,
  ausfallRisiko: 0.05,
  typischeEbitdaMarge: 0.1,
  synergie: { bereich: "allgemein", wirkungProzent: 0 },
};

// ---------- Hilfsfunktionen ----------
function zahl(x: number, fallback = 0): number {
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
}

function begrenze(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, zahl(x, lo)));
}

function sicherRng(ctx: MarketCtx): () => number {
  return () => begrenze(ctx.rng(), 0, 0.999999999);
}

function normal(r: () => number): number {
  const u1 = Math.max(r(), 1e-12);
  const u2 = r();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return begrenze(z, -3, 3);
}

function waehle<T>(arr: T[], r: () => number): T {
  const v = arr[Math.floor(r() * arr.length)];
  return v === undefined ? (arr[0] as T) : v;
}

function waehleGewichtet(r: () => number, chancen: Record<string, number>): string | null {
  const eintraege = Object.entries(chancen).filter(([, w]) => zahl(w) > 0);
  const summe = eintraege.reduce((s, [, w]) => s + w, 0);
  if (summe <= 0) return null;
  let x = r() * summe;
  for (const [key, w] of eintraege) {
    x -= w;
    if (x < 0) return key;
  }
  return eintraege.length > 0 ? (eintraege[eintraege.length - 1] as [string, number])[0] : null;
}

function brancheById(id: string): BranchenRegel {
  const b = REGELN.branchen?.find((x) => x.id === id);
  return b ?? REGELN.branchen?.[0] ?? FALLBACK_BRANCHE;
}

function anhaengen(historie: number[], wert: number): number[] {
  return [...historie, zahl(wert)].slice(-HISTORIE_MAX);
}

function fmtGeld(x: number): string {
  return `${Math.round(zahl(x))} €`;
}

function fmtProzent(anteil: number): string {
  return `${(zahl(anteil) * 100).toFixed(2)} %`;
}

function istAktiv(c: Company): boolean {
  return c.phase !== "pleite" && c.phase !== "uebernommen";
}

function istBoersennotiert(c: Company): boolean {
  return c.kurs !== null && c.kurs > 0 && istAktiv(c);
}

function istPrivat(c: Company): boolean {
  return c.kurs === null && (c.phase === "seed" || c.phase === "series_a" || c.phase === "growth");
}

function istPeBeteiligung(c: Company): boolean {
  return c.phase === "uebernommen" && c.anteilSpieler >= 0.999;
}

function zaehleAktiv(firmen: Company[]): number {
  return firmen.filter(istAktiv).length;
}

function ersetze(state: MarketState, neu: Company): MarketState {
  return { ...state, firmen: state.firmen.map((f) => (f.id === neu.id ? neu : f)) };
}

function ergebnis(state: MarketState, ledger: LedgerEntry[] = [], notes: string[] = []): MarketResult {
  return { state, ledger, notes };
}

// ---------- Namen & Firmenerzeugung ----------
function erzeugeName(r: () => number, benutzt: Set<string>): string {
  const { praefixe, suffixe } = REGELN.namensbausteine;
  for (let i = 0; i < 300; i++) {
    const name = `${waehle(praefixe, r)} ${waehle(suffixe, r)}`;
    if (!benutzt.has(name)) {
      benutzt.add(name);
      return name;
    }
  }
  let n = 2;
  const basis = `${waehle(praefixe, r)} ${waehle(suffixe, r)}`;
  while (benutzt.has(`${basis} ${n}`)) n++;
  const name = `${basis} ${n}`;
  benutzt.add(name);
  return name;
}

function erzeugeFirma(
  r: () => number,
  id: number,
  name: string,
  phase: Phase,
  boerse: boolean,
  zufallsStart: boolean,
): Company {
  const b = waehle(REGELN.branchen, r) ?? FALLBACK_BRANCHE;
  const streu = () => 0.7 + 0.6 * r();
  const marge = begrenze(b.typischeEbitdaMarge * streu(), 0.01, 0.6);

  let bewertung: number;
  if (boerse) {
    bewertung = REGELN.finanzierungsrunden.ipo.mindestMarktkapitalisierung * (1 + 2 * r());
  } else {
    const key: RundenKey = phase === "seed" ? "seed" : phase === "series_a" ? "series_a" : "growth_pe";
    const rd = REGELN.finanzierungsrunden[key];
    bewertung = rd.bewertungMin + (rd.bewertungMax - rd.bewertungMin) * r();
  }
  bewertung = begrenze(bewertung, WERT_MIN, WERT_MAX);
  const umsatzJahr = begrenze(bewertung / (2 * streu()), 0, WERT_MAX);
  const aktienGesamt = Math.round(500000 + r() * 1500000);
  const regel: PhasenRegel | undefined = REGELN.lebenszyklusPhasen[phase];
  const wochenInPhase = zufallsStart && regel ? Math.floor(r() * regel.dauerWochenMin) : 0;
  const anteilRivalen = boerse ? 0.1 + 0.3 * r() : 0.05 + 0.25 * r();
  const trend = begrenze((r() - 0.5) * 1.0, -1, 1);
  const kurs = boerse ? bewertung / aktienGesamt : null;

  return {
    id,
    name,
    branche: b.id,
    phase,
    wochenInPhase,
    umsatzJahr,
    marge,
    bewertung,
    kurs,
    aktienGesamt,
    anteilSpieler: 0,
    anteilRivalen: begrenze(anteilRivalen, 0, 1),
    trend,
    historie: [kurs ?? bewertung],
  };
}

// ---------- 1) createMarket ----------
export function createMarket(ctx: MarketCtx, anzahl = 24): MarketResult {
  const r = sicherRng(ctx);
  const n = Math.floor(begrenze(anzahl, 18, MAX_AKTIV));
  const benutzt = new Set<string>();
  const firmen: Company[] = [];
  for (let i = 0; i < n; i++) {
    const boerse = r() < 0.4;
    let phase: Phase;
    if (boerse) {
      phase = r() < 0.5 ? "stabil" : "growth";
    } else {
      const x = r();
      phase = x < 0.4 ? "seed" : x < 0.75 ? "series_a" : "growth";
    }
    firmen.push(erzeugeFirma(r, i + 1, erzeugeName(r, benutzt), phase, boerse, true));
  }
  return ergebnis({ firmen, naechsteId: n + 1, woche: ctx.woche, branchenEffekt: {} }, [], [
    `Markt erzeugt: ${n} Firmen`,
  ]);
}

// ---------- Finanzierungsrunde ----------
function runde(
  c: Company,
  key: RundenKey,
  r: () => number,
  woche: number,
): { firma: Company; note: string } {
  const cfg = REGELN.finanzierungsrunden[key];
  const f = 1 - begrenze(cfg.anteilProzent, 0, 50) / 100;
  const ziel = cfg.bewertungMin + (cfg.bewertungMax - cfg.bewertungMin) * r();
  const untergrenze = (c.bewertung / f) * 1.02;
  const obergrenze = Math.max(untergrenze, c.bewertung * RUNDEN_MAX_SPRUNG);
  const neu = begrenze(Math.min(Math.max(ziel, untergrenze), obergrenze), WERT_MIN, WERT_MAX);
  const verhaeltnis = neu / Math.max(c.bewertung, 1);
  const label = key === "seed" ? "Seed" : key === "series_a" ? "Series A" : "Growth-Runde";
  const firma: Company = {
    ...c,
    bewertung: neu,
    umsatzJahr: begrenze(c.umsatzJahr * Math.min(Math.sqrt(verhaeltnis), 2), 0, WERT_MAX),
    anteilSpieler: begrenze(c.anteilSpieler * f, 0, 1),
    anteilRivalen: begrenze(c.anteilRivalen * f, 0, 1),
    letzteRundeWoche: woche,
  };
  return { firma, note: `${c.name}: ${label} mit Bewertung ${fmtGeld(neu)}` };
}

// ---------- IPO ----------
function ipoIntern(c: Company, r: () => number): Company {
  const faktor = 0.85 + 0.3 * r();
  const kurs = begrenze((c.bewertung / Math.max(c.aktienGesamt, 1)) * faktor, 0.0001, WERT_MAX);
  return {
    ...c,
    kurs,
    bewertung: begrenze(kurs * c.aktienGesamt, WERT_MIN, WERT_MAX),
    phase: "growth",
    wochenInPhase: 0,
  };
}

export function ipo(state: MarketState, firmaId: number, ctx: MarketCtx): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c) return ergebnis(state, [], ["Firma nicht gefunden"]);
  if (c.phase !== "ipo_reif" || c.kurs !== null) {
    return ergebnis(state, [], [`${c.name}: nicht börsenreif`]);
  }
  if (c.bewertung < REGELN.finanzierungsrunden.ipo.mindestMarktkapitalisierung) {
    return ergebnis(state, [], [`${c.name}: Marktkapitalisierung zu niedrig für IPO`]);
  }
  const neu = ipoIntern(c, sicherRng(ctx));
  return ergebnis(ersetze(state, neu), [], [`${c.name}: Börsengang, Kurs ${(neu.kurs ?? 0).toFixed(2)}`]);
}

// ---------- Phasenwechsel ----------
function neuePhase(c: Company, phase: Phase): Company {
  return { ...c, phase, wochenInPhase: 0 };
}

function pleiteMachen(c: Company, notes: string[]): Company {
  notes.push(c.anteilSpieler > 0 ? `${c.name}: Pleite, deine Beteiligung ist wertlos` : `${c.name}: Pleite`);
  return { ...c, phase: "pleite", wochenInPhase: 0, kurs: 0, bewertung: 0 };
}

function rivalUebernahme(c: Company, faktor: number, ledger: LedgerEntry[], notes: string[]): Company {
  const auszahlung = Math.max(0, c.anteilSpieler * c.bewertung * faktor);
  if (auszahlung > 0) {
    ledger.push({
      konto: "uebernahme",
      betrag: auszahlung,
      grund: `Rivale übernimmt ${c.name}, Auszahlung deines Anteils`,
    });
  }
  notes.push(`${c.name}: von Rivalen übernommen`);
  return { ...c, phase: "uebernommen", wochenInPhase: 0, kurs: null, anteilSpieler: 0, anteilRivalen: 1 };
}

function wechsle(
  c: Company,
  ziel: string,
  r: () => number,
  ledger: LedgerEntry[],
  notes: string[],
  woche: number,
): Company {
  const boerse = c.kurs !== null;
  switch (ziel) {
    case "pleite":
      return pleiteMachen(c, notes);
    case "uebernahme":
      return rivalUebernahme(c, 1.2, ledger, notes);
    case "billig_uebernahme":
      return rivalUebernahme(c, 0.6, ledger, notes);
    case "ag": {
      const min = REGELN.finanzierungsrunden.ipo.mindestMarktkapitalisierung;
      if (boerse || c.bewertung < min) return neuePhase(c, "stabil");
      const neu = ipoIntern(c, r);
      notes.push(`${c.name}: Börsengang, Kurs ${(neu.kurs ?? 0).toFixed(2)}`);
      return neu;
    }
    case "turnaround":
    case "stabil":
      return neuePhase(c, "stabil");
    case "krise":
      notes.push(`${c.name}: gerät in eine Krise`);
      return neuePhase(c, "krise");
    case "wachstum":
      return neuePhase(c, "growth");
    case "series_a": {
      if (boerse) return neuePhase(c, "series_a");
      const res = runde(c, "series_a", r, woche);
      notes.push(res.note);
      return neuePhase(res.firma, "series_a");
    }
    case "growth": {
      if (boerse) return neuePhase(c, "growth");
      const res = runde(c, "growth_pe", r, woche);
      notes.push(res.note);
      return neuePhase(res.firma, "growth");
    }
    case "ipo_reif": {
      if (boerse) return neuePhase(c, "stabil");
      const min = REGELN.finanzierungsrunden.ipo.mindestMarktkapitalisierung;
      let neu = c;
      if (c.bewertung < min) {
        const v = min / Math.max(c.bewertung, 1);
        neu = { ...c, bewertung: min, umsatzJahr: begrenze(c.umsatzJahr * Math.sqrt(v), 0, WERT_MAX) };
        notes.push(`${c.name}: Neubewertung vor IPO auf ${fmtGeld(min)}`);
      }
      notes.push(`${c.name}: ist börsenreif`);
      return neuePhase(neu, "ipo_reif");
    }
    default:
      return c;
  }
}

function uebergang(
  c: Company,
  r: () => number,
  ledger: LedgerEntry[],
  notes: string[],
  woche: number,
): Company {
  const b = brancheById(c.branche);
  if (c.phase === "krise" && r() < (b.ausfallRisiko / 52) * 3) {
    return pleiteMachen(c, notes);
  }
  const regel: PhasenRegel | undefined = REGELN.lebenszyklusPhasen[c.phase];
  if (!regel) return c;
  const w = c.wochenInPhase;
  if (w < regel.dauerWochenMin) return c;
  const hazard = w >= regel.dauerWochenMax ? 1 : 1 / (regel.dauerWochenMax - w + 1);
  if (r() >= hazard) return c;
  const ziel = waehleGewichtet(r, regel.naechstePhaseChance);
  if (!ziel) return c;
  return wechsle(c, ziel, r, ledger, notes, woche);
}

// ---------- 2) stepMarket ----------
interface StepKontext {
  woche: number;
  schock: number;
  ratio: Record<string, number>;
}

function stepFirma(
  c: Company,
  ctx: MarketCtx,
  r: () => number,
  ledger: LedgerEntry[],
  notes: string[],
  k: StepKontext,
): Company | null {
  if (c.phase === "pleite") {
    if (c.wochenInPhase + 1 >= PLEITE_SICHTBAR) {
      notes.push(`${c.name}: aus dem Markt entfernt`);
      return null;
    }
    return { ...c, wochenInPhase: c.wochenInPhase + 1, kurs: 0, bewertung: 0, historie: anhaengen(c.historie, 0) };
  }
  const pe = istPeBeteiligung(c);
  if (c.phase === "uebernommen" && !pe) {
    if (c.wochenInPhase + 1 >= PLEITE_SICHTBAR) {
      notes.push(`${c.name}: aus dem Markt entfernt`);
      return null;
    }
    return { ...c, wochenInPhase: c.wochenInPhase + 1, historie: anhaengen(c.historie, c.bewertung) };
  }

  const b = brancheById(c.branche);
  const makro = ctx.makro;
  const wachstumsPhase = c.phase === "seed" || c.phase === "series_a" || c.phase === "growth";
  const privat = istPrivat(c);
  const zins = zahl(makro.zins, ZINS_NEUTRAL);
  const zinsDruck = zins > ZINS_NEUTRAL ? -(zins - ZINS_NEUTRAL) * 0.05 * (wachstumsPhase ? 2 : 0.5) : 0;
  const kaufkraftEff = (begrenze(makro.kaufkraft, 0, 3) - 1) * 0.002;
  const krisenEff = c.phase === "krise" ? -0.003 : 0;
  const sigma = zahl(b.volatilitaet, 0.3) / Math.sqrt(52);
  const beta = wachstumsPhase ? 1.3 : c.phase === "stabil" ? 0.8 : 1;
  const rauschen = normal(r) * sigma * IDIO_ANTEIL;
  const mu =
    zahl(b.basisWachstumJaehrlich) / 52 + c.trend * 0.004 + kaufkraftEff + zinsDruck + krisenEff;

  const g = begrenze(mu + rauschen + beta * k.schock - 0.5 * sigma * sigma, -0.5, 0.5);
  const ratio = begrenze(k.ratio[c.branche] ?? 1, 0.5, 2);
  const faktor = begrenze(Math.exp(g) * ratio, 0.4, 1.6);

  let bewertung = begrenze(c.bewertung * faktor, WERT_MIN, WERT_MAX);
  const umsatzJahr = begrenze(c.umsatzJahr * Math.sqrt(faktor), 0, WERT_MAX);
  const trend = begrenze(c.trend * 0.97 + (r() - 0.5) * 0.35, -1, 1);
  const ziel = b.typischeEbitdaMarge * (c.phase === "krise" ? 0.3 : 1) * (pe ? PE_MARGEN_FAKTOR : 1);
  let marge = begrenze(c.marge + (ziel - c.marge) * 0.01 + (r() - 0.5) * 0.004, -0.2, 0.6);
  const boerse = c.kurs !== null;
  const rivalen = boerse
    ? begrenze(c.anteilRivalen + (r() - 0.5) * 0.01, 0, Math.max(0, 1 - c.anteilSpieler))
    : c.anteilRivalen;
  const aktien = Math.max(c.aktienGesamt, 1);

  if (privat && r() < (zahl(b.ausfallRisiko) / 52) * PRIVAT_AUSFALL_FAKTOR) {
    return pleiteMachen({ ...c, bewertung, umsatzJahr }, notes);
  }

  if (pe) {
    if (r() < zahl(b.ausfallRisiko) / 26) {
      bewertung = begrenze(bewertung * (0.6 + 0.3 * r()), WERT_MIN, WERT_MAX);
      marge = begrenze(marge * 0.5, -0.2, 0.6);
      notes.push(`${c.name}: Managementkrise, Bewertung und Marge sinken`);
    }
    const n: Company = {
      ...c,
      bewertung,
      umsatzJahr,
      trend,
      marge,
      aktienGesamt: aktien,
      wochenInPhase: c.wochenInPhase + 1,
    };
    const gewinn = Math.max(0, (umsatzJahr * marge) / 52) * n.anteilSpieler;
    if (gewinn > 0) {
      ledger.push({ konto: "beteiligung", betrag: gewinn, grund: `Wochengewinn ${n.name}` });
    }
    return { ...n, historie: anhaengen(n.historie, n.bewertung) };
  }

  let n: Company = {
    ...c,
    bewertung,
    umsatzJahr,
    trend,
    marge,
    anteilRivalen: rivalen,
    aktienGesamt: aktien,
    wochenInPhase: c.wochenInPhase + 1,
    kurs: boerse ? bewertung / aktien : null,
  };

  if (k.woche > 0 && k.woche % 13 === 0 && n.phase === "stabil" && boerse && n.marge > 0.03) {
    const quartalsGewinn = (n.umsatzJahr * n.marge) / 4;
    const gesamtDividende = Math.max(0, quartalsGewinn * DIVIDENDEN_QUOTE);
    const dividende = n.anteilSpieler * gesamtDividende;
    if (dividende > 0) {
      ledger.push({ konto: "dividende", betrag: dividende, grund: `Dividende ${n.name}` });
    }
    if (gesamtDividende > 0) {
      const b2 = begrenze(n.bewertung - gesamtDividende, WERT_MIN, WERT_MAX);
      n = { ...n, bewertung: b2, kurs: b2 / aktien };
    }
  }

  n = uebergang(n, r, ledger, notes, k.woche);
  const wert = n.phase === "pleite" ? 0 : n.kurs ?? n.bewertung;
  return { ...n, historie: anhaengen(n.historie, wert) };
}

export function stepMarket(state: MarketState, ctx: MarketCtx): MarketResult {
  const r = sicherRng(ctx);
  const ledger: LedgerEntry[] = [];
  const notes: string[] = [];
  const firmen: Company[] = [];

  const aktuell: Record<string, number> = {};
  for (const [key, v] of Object.entries(ctx.makro.branchenMultiplikator ?? {})) {
    aktuell[key] = begrenze(zahl(v, 1), 0.5, 1.5);
  }
  const vorher = state.branchenEffekt ?? {};
  const ratio: Record<string, number> = {};
  for (const key of Array.from(new Set([...Object.keys(aktuell), ...Object.keys(vorher)]))) {
    ratio[key] = (aktuell[key] ?? 1) / Math.max(vorher[key] ?? 1, 0.01);
  }

  const schock = normal(r) * MARKT_VOL;
  const kontext: StepKontext = { woche: ctx.woche, schock, ratio };

  for (const c of state.firmen) {
    const n = stepFirma(c, ctx, r, ledger, notes, kontext);
    if (n) firmen.push(n);
  }

  const benutzt = new Set(firmen.map((f) => f.name));
  let naechsteId = state.naechsteId;
  while (zaehleAktiv(firmen) < MIN_AKTIV && zaehleAktiv(firmen) < MAX_AKTIV) {
    const name = erzeugeName(r, benutzt);
    firmen.push(erzeugeFirma(r, naechsteId, name, "seed", false, false));
    naechsteId += 1;
    notes.push(`${name}: neue Seed-Firma am Markt`);
  }

  const effektNeu: Record<string, number> = {};
  for (const [key, v] of Object.entries(aktuell)) if (Math.abs(v - 1) > 1e-9) effektNeu[key] = v;

  return ergebnis({ firmen, naechsteId, woche: ctx.woche, branchenEffekt: effektNeu }, ledger, notes);
}

// ---------- 3) Aktienhandel ----------
function kaufKosten(wert: number, a: number): number {
  return wert * a * (1 + SPREAD) + (wert * MARKT_IMPACT * a * a) / 2;
}

export function buyShares(state: MarketState, firmaId: number, anteil: number, cash: number): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c) return ergebnis(state, [], ["Firma nicht gefunden"]);
  if (!istBoersennotiert(c) || c.kurs === null) {
    return ergebnis(state, [], [`${c.name}: nicht börsennotiert`]);
  }
  const wunsch = Math.max(0, zahl(anteil));
  const budget = Math.max(0, zahl(cash));
  const wert = c.kurs * c.aktienGesamt;
  const freeFloat = begrenze(zahl(REGELN.finanzierungsrunden.ipo.freeFloatProzent, 30) / 100, 0.05, 1);
  const maxSpieler = Math.max(c.anteilSpieler, freeFloat);
  const frei = Math.max(0, Math.min(1 - c.anteilSpieler - c.anteilRivalen, maxSpieler - c.anteilSpieler));
  const k1 = wert * (1 + SPREAD);
  const k2 = (wert * MARKT_IMPACT) / 2;
  const leistbar = wert > 0 ? (-k1 + Math.sqrt(k1 * k1 + 4 * k2 * budget)) / (2 * k2) : 0;
  const a = Math.min(wunsch, frei, leistbar);
  if (!(a > 1e-9)) {
    return ergebnis(state, [], [`${c.name}: Kauf nicht möglich (kein freier Anteil oder zu wenig Geld)`]);
  }
  const kosten = Math.min(kaufKosten(wert, a), budget);
  const neu: Company = {
    ...c,
    anteilSpieler: begrenze(c.anteilSpieler + a, 0, Math.max(0, 1 - c.anteilRivalen)),
  };
  const notes = a < wunsch - 1e-9 ? [`${c.name}: Kauf auf ${fmtProzent(a)} begrenzt`] : [];
  return ergebnis(
    ersetze(state, neu),
    [{ konto: "aktien", betrag: -kosten, grund: `Kauf ${fmtProzent(a)} ${c.name}` }],
    notes,
  );
}

export function sellShares(
  state: MarketState,
  firmaId: number,
  anteil: number,
  _cash: number = 0,
): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c) return ergebnis(state, [], ["Firma nicht gefunden"]);
  if (!istBoersennotiert(c) || c.kurs === null) {
    return ergebnis(state, [], [`${c.name}: nicht börsennotiert`]);
  }
  const a = Math.min(Math.max(0, zahl(anteil)), c.anteilSpieler);
  if (a <= 1e-9) return ergebnis(state, [], [`${c.name}: keine Anteile zum Verkaufen`]);
  const wert = c.kurs * c.aktienGesamt;
  const erloes = Math.max(0, wert * a * (1 - SPREAD) - (wert * MARKT_IMPACT * a * a) / 2);
  const neu: Company = { ...c, anteilSpieler: begrenze(c.anteilSpieler - a, 0, 1) };
  return ergebnis(
    ersetze(state, neu),
    [{ konto: "aktien", betrag: erloes, grund: `Verkauf ${fmtProzent(a)} ${c.name}` }],
    [],
  );
}

// ---------- 4) Venture ----------
export function investVenture(
  state: MarketState,
  firmaId: number,
  betrag: number,
  cash: number,
): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c) return ergebnis(state, [], ["Firma nicht gefunden"]);
  if (!istPrivat(c)) return ergebnis(state, [], [`${c.name}: Venture nur bei privaten Firmen`]);
  const b = Math.min(Math.max(0, zahl(betrag)), Math.max(0, zahl(cash)));
  if (b < 1) return ergebnis(state, [], [`${c.name}: Betrag zu klein oder zu wenig Geld`]);
  const post = c.bewertung + b;
  const neuerAnteil = b / post;
  const f = c.bewertung / post;
  const anteilSpieler = begrenze(c.anteilSpieler * f + neuerAnteil, 0, 1);
  const anteilRivalen = begrenze(c.anteilRivalen * f, 0, Math.max(0, 1 - anteilSpieler));
  const neu: Company = { ...c, bewertung: begrenze(post, WERT_MIN, WERT_MAX), anteilSpieler, anteilRivalen };
  return ergebnis(
    ersetze(state, neu),
    [{ konto: "venture", betrag: -b, grund: `Investment ${fmtProzent(neuerAnteil)} ${c.name}` }],
    [`${c.name}: Beteiligung ${fmtProzent(neuerAnteil)} bei Post-Money ${fmtGeld(post)}`],
  );
}

// ---------- 7) Private-Equity-Übernahme ----------
export function privateEquityTakeover(state: MarketState, firmaId: number, cash: number): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c) return ergebnis(state, [], ["Firma nicht gefunden"]);
  if (!istAktiv(c)) return ergebnis(state, [], [`${c.name}: nicht übernehmbar`]);
  const kosten = Math.max(0, (1 - c.anteilSpieler) * c.bewertung * (1 + UEBERNAHME_AUFSCHLAG));
  if (kosten > Math.max(0, zahl(cash))) {
    return ergebnis(state, [], [`${c.name}: Übernahme kostet ${fmtGeld(kosten)}, zu wenig Geld`]);
  }
  const neu: Company = {
    ...c,
    phase: "uebernommen",
    wochenInPhase: 0,
    kurs: null,
    anteilSpieler: 1,
    anteilRivalen: 0,
  };
  return ergebnis(
    ersetze(state, neu),
    [{ konto: "uebernahme", betrag: -kosten, grund: `Übernahme ${c.name} (100 %, +25 % Aufschlag)` }],
    [`${c.name}: vollständig übernommen für ${fmtGeld(kosten)}`],
  );
}

export function exitPrivateEquity(state: MarketState, firmaId: number): MarketResult {
  const c = state.firmen.find((f) => f.id === firmaId);
  if (!c || !istPeBeteiligung(c)) return ergebnis(state, [], ["Keine PE-Beteiligung gefunden"]);
  const erloes = Math.max(0, c.bewertung * PE_EXIT_ABSCHLAG);
  const neu: Company = { ...c, anteilSpieler: 0, anteilRivalen: 1, wochenInPhase: 0 };
  return ergebnis(
    ersetze(state, neu),
    [{ konto: "uebernahme", betrag: erloes, grund: `Exit ${c.name} (${Math.round(PE_EXIT_ABSCHLAG * 100)} % der Bewertung)` }],
    [`${c.name}: verkauft für ${fmtGeld(erloes)}`],
  );
}

// ---------- 8) Portfoliowert ----------
export function portfolioValue(state: MarketState): number {
  let summe = 0;
  for (const c of state.firmen) {
    if (c.phase === "pleite") continue;
    const abschlag = istPeBeteiligung(c) ? PE_EXIT_ABSCHLAG : istPrivat(c) ? 0.9 : 1;
    summe += zahl(c.anteilSpieler) * zahl(c.bewertung) * abschlag;
  }
  return Math.max(0, zahl(summe));
}
