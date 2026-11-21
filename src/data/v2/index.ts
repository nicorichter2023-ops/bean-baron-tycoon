import emea from './cities-emea.json';
import world from './cities-world.json';
import companyRules from './company-rules.json';
import eventsA from './events-a.json';
import eventsB from './events-b.json';
import editor from './editor.json';

/** Coffee Empire 2.0 content (step 1, externally generated). Pure data, no engine logic. */
export type GuestMix = { pendler: number; studenten: number; geniesser: number; touristen: number };
export interface V2Neighborhood { id: string; name: string; typ: string; gaestemix: GuestMix; mieteBasisWoche: number; passantenFrequenz: number }
export interface V2City { id: string; name: string; land: string; region: string; bevoelkerung: number; kaufkraft: number; kaffeekultur: number; mietindex: number; gaestemix: GuestMix; nachbarschaften: V2Neighborhood[] }
export interface V2EventEffect { ziel: string; multiplikator: number; dauerWochen: number }
export interface V2Event { id: string; titel: string; nachricht: string; kategorie: string; seltenheit: 'gross' | 'mittel' | 'klein'; ausloeseChanceProWoche: number; effekte: V2EventEffect[]; folgeEventId: string | null }
export interface V2EditorLevel { stufe: number; titel: string; kostenEinmalig: number; wartungWoche: number; effekte: Record<string, number>; farbvarianten: string[] }
export type EditorSlot = 'maschine' | 'theke' | 'moebel' | 'waende_licht' | 'terrasse';

export const V2_CITIES = [...emea, ...world] as V2City[];
export const V2_EVENTS = [...eventsA, ...eventsB] as V2Event[];
export const V2_COMPANY_RULES = companyRules;
export const EDITOR_SLOTS = editor.slots as unknown as Record<EditorSlot, { name: string; stufen: V2EditorLevel[] }>;
