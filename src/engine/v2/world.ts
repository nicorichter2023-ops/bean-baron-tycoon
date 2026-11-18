// world.ts – lebendige Welt mit Ereignissen und Kausalketten
import type { LedgerEntry } from "../ledger";
import eventsA from "@/data/v2/events-a.json";
import eventsB from "@/data/v2/events-b.json";

export type Seltenheit = "gross" | "mittel" | "klein";

export interface Effekt {
  ziel: string;
  multiplikator: number;
  dauerWochen: number;
}

export interface WeltEreignis {
  id: string;
  titel: string;
  nachricht: string;
  kategorie: string;
  seltenheit: Seltenheit;
  ausloeseChanceProWoche: number;
  effekte: Effekt[];
  folgeEventId?: string | null;
}

export interface AktiveWirkung {
  eventId: string;
  ziel: string;
  multiplikator: number;
  restWochen: number;
}

export interface VerlaufEintrag {
  eventId: string;
  woche: number;
}

export interface GeplanteFolge {
  eventId: string;
  woche: number;
  ursacheId?: string;
}

export interface WorldState {
  aktiv: AktiveWirkung[];
  verlauf: VerlaufEintrag[];
  gesperrtBis: Record<string, number>;
  geplanteFolgen: GeplanteFolge[];
}

export interface WorldCtx {
  rng: () => number;
  woche: number;
  region?: string;
}

export interface WorldStepResult {
  state: WorldState;
  ledger: LedgerEntry[];
  notes: string[];
}

export const MOD_MIN = 0.5;
export const MOD_MAX = 2.0;
export const FENSTER_WOCHEN = 52;
export const EINSTIEG_WOCHEN = 8;
export const FOLGE_CHANCE = 0.6;
export const FOLGE_MIN_WOCHEN = 3;
export const FOLGE_MAX_WOCHEN = 8;
export const LIMIT_GROSS = 2;
export const LIMIT_MITTEL = 6;

const sicher = (x: unknown, fallback: number): number =>
  typeof x === "number" && Number.isFinite(x) ? x : fallback;

const klemme = (x: number, min: number, max: number, fallback: number = min): number =>
  Math.max(min, Math.min(max, sicher(x, fallback)));

function bereinige(roh: WeltEreignis): WeltEreignis {
  const s: Seltenheit =
    roh.seltenheit === "gross" || roh.seltenheit === "mittel" ? roh.seltenheit : "klein";
  const id = String(roh.id);
  const effekteRoh = Array.isArray(roh.effekte) ? roh.effekte : [];
  return {
    id,
    titel: String(roh.titel ?? ""),
    nachricht: String(roh.nachricht ?? ""),
    kategorie: String(roh.kategorie ?? ""),
    seltenheit: s,
    ausloeseChanceProWoche: klemme(roh.ausloeseChanceProWoche, 0, 1, 0),
    effekte: effekteRoh
      .filter((e) => e && typeof e.ziel === "string" && e.ziel.length > 0)
      .map((e) => ({
        ziel: e.ziel,
        multiplikator: klemme(e.multiplikator, 0.01, 10, 1),
        dauerWochen: Math.max(1, Math.floor(sicher(e.dauerWochen, 1))),
      })),
    folgeEventId:
      typeof roh.folgeEventId === "string" && roh.folgeEventId !== id ? roh.folgeEventId : null,
  };
}

function ladeEreignisse(): WeltEreignis[] {
  const alle = [...(eventsA as unknown as WeltEreignis[]), ...(eventsB as unknown as WeltEreignis[])];
  const gesehen: Record<string, boolean> = {};
  const ergebnis: WeltEreignis[] = [];
  for (const roh of alle) {
    if (!roh || typeof roh.id !== "string" || gesehen[roh.id]) continue;
    gesehen[roh.id] = true;
    ergebnis.push(bereinige(roh));
  }
  return ergebnis;
}

export const EREIGNISSE: WeltEreignis[] = ladeEreignisse();

const EREIGNIS_MAP: Record<string, WeltEreignis> = {};
const FOLGE_IDS: Record<string, boolean> = {};
for (const e of EREIGNISSE) EREIGNIS_MAP[e.id] = e;
for (const e of EREIGNISSE) {
  if (e.folgeEventId && EREIGNIS_MAP[e.folgeEventId]) FOLGE_IDS[e.folgeEventId] = true;
}

export function createWorld(): WorldState {
  return { aktiv: [], verlauf: [], gesperrtBis: {}, geplanteFolgen: [] };
}

type Pruefung = "ok" | "einstieg" | "blockiert";

function beschreibeWirkung(e: WeltEreignis, region?: string): string {
  const teile = e.effekte
    .filter((ef) => !ef.ziel.startsWith("region.") || (region !== undefined && ef.ziel === `region.${region}`))
    .map((ef) => {
      const pct = Math.round((ef.multiplikator - 1) * 100);
      const vz = pct >= 0 ? "+" : "";
      return `${ef.ziel} ${vz}${pct} % für ${ef.dauerWochen} Wo.`;
    });
  return teile.length > 0 ? ` [Wirkung: ${teile.join("; ")}]` : "";
}

/** Eine Spielwoche weiterschalten. Reihenfolge im Spiel: world → market → guests. */
export function stepWorld(state: WorldState, ctx: WorldCtx): WorldStepResult {
  const woche = Math.max(0, Math.floor(sicher(ctx.woche, 0)));
  const notes: string[] = [];
  const rng = (): number => {
    const r = ctx.rng();
    return Number.isFinite(r) ? Math.min(0.999999, Math.max(0, r)) : 0;
  };

  let aktiv: AktiveWirkung[] = state.aktiv
    .map((w) => ({ ...w, restWochen: w.restWochen - 1 }))
    .filter((w) => w.restWochen > 0);

  let verlauf: VerlaufEintrag[] = state.verlauf
    .filter((v) => woche - v.woche < FENSTER_WOCHEN)
    .map((v) => ({ ...v }));
  const gesperrtBis: Record<string, number> = {};
  for (const id of Object.keys(state.gesperrtBis)) {
    const bis = sicher(state.gesperrtBis[id], 0);
    if (bis > woche) gesperrtBis[id] = bis;
  }

  const faellig = state.geplanteFolgen
    .filter((f) => f.woche <= woche)
    .map((f) => ({ ...f }))
    .sort((a, b) => a.woche - b.woche || a.eventId.localeCompare(b.eventId));
  let folgen: GeplanteFolge[] = state.geplanteFolgen.filter((f) => f.woche > woche).map((f) => ({ ...f }));

  const pruefe = (e: WeltEreignis): Pruefung => {
    if (e.seltenheit === "gross" && woche <= EINSTIEG_WOCHEN) return "einstieg";
    if ((gesperrtBis[e.id] ?? 0) > woche) return "blockiert";
    const limit =
      e.seltenheit === "gross" ? LIMIT_GROSS : e.seltenheit === "mittel" ? LIMIT_MITTEL : Infinity;
    if (limit !== Infinity) {
      const anzahl = verlauf.filter((v) => EREIGNIS_MAP[v.eventId]?.seltenheit === e.seltenheit).length;
      if (anzahl >= limit) return "blockiert";
    }
    return "ok";
  };

  const ausloesen = (e: WeltEreignis, ursache?: WeltEreignis): void => {
    const neu: AktiveWirkung[] = e.effekte
      .filter((ef) => {
        if (!ef.ziel.startsWith("region.")) return true;
        return ctx.region !== undefined && ef.ziel === `region.${ctx.region}`;
      })
      .map((ef) => ({
        eventId: e.id,
        ziel: ef.ziel,
        multiplikator: ef.multiplikator,
        restWochen: ef.dauerWochen,
      }));
    aktiv = [...aktiv, ...neu];
    verlauf = [...verlauf, { eventId: e.id, woche }];
    gesperrtBis[e.id] = woche + FENSTER_WOCHEN;
    const vorspann = ursache ? `Folge von „${ursache.titel}“: ` : "";
    notes.push(`${vorspann}${e.titel} – ${e.nachricht}${beschreibeWirkung(e, ctx.region)}`);
    if (e.folgeEventId && EREIGNIS_MAP[e.folgeEventId]) {
      const schonGeplant = folgen.some((f) => f.eventId === e.folgeEventId);
      if (!schonGeplant && rng() < FOLGE_CHANCE) {
        const spanne = FOLGE_MAX_WOCHEN - FOLGE_MIN_WOCHEN + 1;
        const d = FOLGE_MIN_WOCHEN + Math.floor(rng() * spanne);
        folgen = [...folgen, { eventId: e.folgeEventId, woche: woche + d, ursacheId: e.id }];
      }
    }
  };

  for (const f of faellig) {
    const e = EREIGNIS_MAP[f.eventId];
    if (!e) continue;
    const p = pruefe(e);
    if (p === "ok") ausloesen(e, f.ursacheId ? EREIGNIS_MAP[f.ursacheId] : undefined);
    else if (p === "einstieg") folgen = [...folgen, { ...f, woche: Math.max(f.woche, woche + 1) }];
  }

  if (notes.length === 0) {
    const treffer: WeltEreignis[] = [];
    for (const e of EREIGNISSE) {
      if (FOLGE_IDS[e.id] || e.ausloeseChanceProWoche <= 0) continue;
      if (pruefe(e) !== "ok") continue;
      if (rng() < e.ausloeseChanceProWoche) treffer.push(e);
    }
    if (treffer.length > 0) {
      const summe = treffer.reduce((s, e) => s + e.ausloeseChanceProWoche, 0);
      let r = rng() * summe;
      let gewaehlt = treffer[treffer.length - 1];
      for (const e of treffer) {
        r -= e.ausloeseChanceProWoche;
        if (r < 0) {
          gewaehlt = e;
          break;
        }
      }
      if (gewaehlt) ausloesen(gewaehlt);
    }
  }

  return {
    state: { aktiv, verlauf, gesperrtBis, geplanteFolgen: folgen },
    ledger: [],
    notes,
  };
}

/** Gesamtmultiplikator für ein Ziel (1 ohne aktive Wirkung), begrenzt auf 0.5..2.0. */
export function modifier(state: WorldState, ziel: string): number {
  let produkt = 1;
  for (const w of state.aktiv) {
    if (w.ziel === ziel) produkt *= sicher(w.multiplikator, 1);
  }
  return klemme(produkt, MOD_MIN, MOD_MAX, 1);
}

/** Multiplikatoren je Branche (nur Branchen mit aktiver Wirkung), für market.ts. */
export function branchenMultiplikatoren(state: WorldState): Record<string, number> {
  const ergebnis: Record<string, number> = {};
  const praefix = "branche.";
  for (const w of state.aktiv) {
    if (!w.ziel.startsWith(praefix)) continue;
    const id = w.ziel.slice(praefix.length);
    if (id.length === 0 || id in ergebnis) continue;
    ergebnis[id] = modifier(state, w.ziel);
  }
  return ergebnis;
}
