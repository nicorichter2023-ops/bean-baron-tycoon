// Pure content for café depth: menu, research tree, 5-level gear and decor catalog.
export interface MenuItem { id: string; name: string; kind: 'drink' | 'snack'; price: number; art: number; research?: string; fit: string[] }
export const DRINKS: MenuItem[] = [
  { id: 'espresso', name: 'Espresso', kind: 'drink', price: 2.4, art: 1, fit: ['connoisseur', 'business'] },
  { id: 'americano', name: 'Americano', kind: 'drink', price: 2.9, art: 2, fit: ['business'] },
  { id: 'cappuccino', name: 'Cappuccino', kind: 'drink', price: 3.6, art: 3, fit: ['tourists', 'students'] },
  { id: 'latte', name: 'Latte Macchiato', kind: 'drink', price: 3.9, art: 4, research: 'd1', fit: ['students'] },
  { id: 'flatwhite', name: 'Flat White', kind: 'drink', price: 4.1, art: 5, research: 'd2', fit: ['connoisseur'] },
  { id: 'mocha', name: 'Mocha', kind: 'drink', price: 4.3, art: 6, research: 'd4', fit: ['students', 'tourists'] },
  { id: 'caramel', name: 'Caramel Macchiato', kind: 'drink', price: 4.6, art: 7, research: 'd4', fit: ['tourists'] },
  { id: 'iced', name: 'Iced Coffee', kind: 'drink', price: 3.8, art: 8, research: 'd3', fit: ['students', 'tourists'] },
  { id: 'coldbrew', name: 'Cold Brew', kind: 'drink', price: 4.4, art: 9, research: 'd3', fit: ['business'] },
  { id: 'nitro', name: 'Nitro Cold Brew', kind: 'drink', price: 5.2, art: 10, research: 'd6', fit: ['connoisseur'] },
  { id: 'matcha', name: 'Matcha Latte', kind: 'drink', price: 4.8, art: 11, research: 'd5', fit: ['students'] },
  { id: 'chai', name: 'Chai Latte', kind: 'drink', price: 4.2, art: 12, research: 'd5', fit: ['tourists'] },
];
export const SNACKS: MenuItem[] = [
  { id: 'croissant', name: 'Croissant', kind: 'snack', price: 2.6, art: 1, fit: ['business', 'tourists'] },
  { id: 'muffin', name: 'Muffin', kind: 'snack', price: 2.9, art: 2, fit: ['students'] },
  { id: 'cinnamon', name: 'Zimtschnecke', kind: 'snack', price: 3.2, art: 3, research: 'o2', fit: ['tourists'] },
  { id: 'cookie', name: 'Cookie', kind: 'snack', price: 2.2, art: 4, fit: ['students'] },
  { id: 'bagel', name: 'Bagel', kind: 'snack', price: 4.5, art: 5, research: 'o2', fit: ['business'] },
  { id: 'avocado', name: 'Avocado-Toast', kind: 'snack', price: 7.5, art: 6, research: 'm3', fit: ['connoisseur', 'business'] },
  { id: 'sandwich', name: 'Sandwich', kind: 'snack', price: 6.2, art: 7, research: 'o4', fit: ['business'] },
  { id: 'cheesecake', name: 'Cheesecake', kind: 'snack', price: 4.8, art: 8, research: 'm2', fit: ['tourists', 'connoisseur'] },
  { id: 'donut', name: 'Donut', kind: 'snack', price: 2.4, art: 9, fit: ['students'] },
  { id: 'fruit', name: 'Obstbecher', kind: 'snack', price: 3.9, art: 10, research: 'm5', fit: ['business'] },
];
export const MENU_ITEMS = [...DRINKS, ...SNACKS];
export const DEFAULT_MENU = ['espresso', 'americano', 'cappuccino', 'croissant'];
export const MENU_LIMIT = { drink: 8, snack: 6 } as const;

export type Branch = 'bean' | 'drink' | 'ops' | 'brand';
export interface ResearchNode { id: string; branch: Branch; tier: number; name: string; effect: string; sheet: 'research-a' | 'research-b'; art: number }
const node = (branch: Branch, prefix: string, sheet: ResearchNode['sheet'], items: [string, string, number][]): ResearchNode[] =>
  items.map(([name, effect, art], i) => ({ id: `${prefix}${i + 1}`, branch, tier: i + 1, name, effect, sheet, art }));
export const RESEARCH: ResearchNode[] = [
  ...node('bean', 'b', 'research-a', [['Rohkaffee-Sortierung', '+1,5 % Umsatz', 1], ['Helle Röstung', '+1,5 % Umsatz', 2], ['Dunkle Röstung', '+1,5 % Umsatz', 3], ['Trommelröster', '+2 % Umsatz', 4], ['Röstprofile', '+2 % Umsatz', 5], ['Cupping-Labor', '+2 % Umsatz', 6], ['Direkthandel', '+2,5 % Umsatz', 7], ['Haus-Blend', '+3 % Umsatz', 8]]),
  ...node('drink', 'd', 'research-a', [['Milchschaum-Technik', 'Latte Macchiato', 9], ['Latte Art', 'Flat White', 10], ['Kaltextraktion', 'Iced Coffee & Cold Brew', 11], ['Sirup-Küche', 'Mocha & Caramel', 12], ['Tee-Bar', 'Matcha & Chai', 13], ['Stickstoff-Zapfanlage', 'Nitro Cold Brew', 14], ['Pflanzenmilch', '+2 % Umsatz', 15], ['Saisonkarte', '+3 % Umsatz', 16]]),
  ...node('ops', 'o', 'research-b', [['Stoppuhr-Abläufe', '+1,5 % Umsatz', 1], ['Back-Partner', 'Zimtschnecke & Bagel', 2], ['Kassensystem', '−3 % Personalkosten', 3], ['Mobile Order', 'Sandwich · +2 % Umsatz', 4], ['Lieferdienst', '+2 % Umsatz', 5], ['Wartungsplan', '−3 % Personalkosten', 6], ['Barista-Akademie', 'Baristas lernen doppelt', 7], ['Lager-Software', '+2,5 % Umsatz', 8]]),
  ...node('brand', 'm', 'research-b', [['Werbekampagne', '+0,2 Ruf/Woche', 9], ['Treuekarte', 'Cheesecake · +1,5 %', 10], ['Social Media', 'Avocado-Toast · +2 %', 11], ['Markendesign', '+0,2 Ruf/Woche', 12], ['Öko-Zertifikat', 'Obstbecher · +2 %', 13], ['Lieferanten-Netz', '+2,5 % Umsatz', 14], ['Promi-Kooperation', '+0,3 Ruf/Woche', 15], ['Franchise-Handbuch', '+3 % Umsatz', 16]]),
];
export const BRANCH_LABEL: Record<Branch, string> = { bean: 'Bohne & Röstung', drink: 'Getränke', ops: 'Betrieb', brand: 'Marke' };
export const researchCost = (tier: number) => Math.round(1500 * Math.pow(1.55, tier - 1) / 100) * 100;
export const researchWeeks = (tier: number) => 1 + Math.ceil(tier / 2);
const BONUS: Record<string, number> = { b1: .015, b2: .015, b3: .015, b4: .02, b5: .02, b6: .02, b7: .025, b8: .03, d7: .02, d8: .03, o1: .015, o4: .02, o5: .02, o8: .025, m2: .015, m3: .02, m5: .02, m6: .025, m8: .03 };
export const researchRevenueBonus = (done: string[]) => done.reduce((n, id) => n + (BONUS[id] ?? 0), 0);
export const researchRepBonus = (done: string[]) => (done.includes('m1') ? .2 : 0) + (done.includes('m4') ? .2 : 0) + (done.includes('m7') ? .3 : 0);
export const researchWageFactor = (done: string[]) => 1 - (done.includes('o3') ? .03 : 0) - (done.includes('o6') ? .03 : 0);

export type GearCategory = 'espresso' | 'grinder' | 'seating' | 'vitrine' | 'terrace';
export const GEAR: Record<GearCategory, { label: string; levels: string[]; base: number; bonus: number }> = {
  espresso: { label: 'Espressomaschine', levels: ['Einkreiser', 'Zweikreiser', 'Multi-Boiler', 'Präzisions-Bar', 'Handcraft Custom'], base: 2500, bonus: .025 },
  grinder: { label: 'Kaffeemühle', levels: ['Standardmühle', 'Flachscheibe', 'Kegelmahlwerk', 'Wiegemühle', 'Einzeldosierer'], base: 900, bonus: .015 },
  seating: { label: 'Sitzbereich', levels: ['Stehtresen', 'Bistrotische', 'Sitzgruppe', 'Lounge', 'Designer-Lounge'], base: 1800, bonus: .02 },
  vitrine: { label: 'Vitrine', levels: ['Keksglas', 'Kuchentheke', 'Kühlvitrine', 'Patisserie', 'Showküche'], base: 1200, bonus: .018 },
  terrace: { label: 'Terrasse', levels: ['Keine', 'Zwei Stühle', 'Gehweg-Terrasse', 'Markise & Heizer', 'Gartenlounge'], base: 1500, bonus: .02 },
};
export const GEAR_KEYS = Object.keys(GEAR) as GearCategory[];
export const gearPrice = (c: GearCategory, level: number) => level <= 0 ? 0 : Math.round(GEAR[c].base * Math.pow(2.3, level - 1) / 100) * 100;
/** Minimum store stage needed for each gear level (1..4). */
export const gearStageNeed = (level: number) => [0, 1, 3, 4, 6][level] ?? 7;

export type DecorSlot = 'floor' | 'wall' | 'light' | 'plant' | 'art' | 'extra' | 'sign';
export const DECOR: Record<DecorSlot, { label: string; sheet: 'decor-a' | 'decor-b'; options: { name: string; art: number }[]; price: number }> = {
  floor: { label: 'Boden', sheet: 'decor-a', price: 600, options: [{ name: 'Eichendiele', art: 1 }, { name: 'Schachbrett', art: 2 }, { name: 'Sichtbeton', art: 3 }, { name: 'Marmor', art: 4 }] },
  wall: { label: 'Farbschema', sheet: 'decor-a', price: 400, options: [{ name: 'Creme', art: 5 }, { name: 'Salbei', art: 6 }, { name: 'Terrakotta', art: 7 }, { name: 'Marine', art: 8 }, { name: 'Backstein', art: 9 }, { name: 'Anthrazit', art: 10 }, { name: 'Rosé', art: 11 }, { name: 'Petrol', art: 12 }] },
  light: { label: 'Licht', sheet: 'decor-a', price: 500, options: [{ name: 'Edison-Birnen', art: 13 }, { name: 'Spots', art: 14 }, { name: 'Neon', art: 15 }, { name: 'Kronleuchter', art: 16 }] },
  plant: { label: 'Pflanzen', sheet: 'decor-b', price: 250, options: [{ name: 'Monstera', art: 1 }, { name: 'Efeu', art: 2 }, { name: 'Kakteen', art: 3 }, { name: 'Olivenbaum', art: 4 }] },
  art: { label: 'Wandbild', sheet: 'decor-b', price: 350, options: [{ name: 'Kaffee-Poster', art: 5 }, { name: 'Abstrakt', art: 6 }, { name: 'Vinyl-Wand', art: 7 }, { name: 'Weltkarte', art: 8 }] },
  extra: { label: 'Extras', sheet: 'decor-b', price: 450, options: [{ name: 'Bücherregal', art: 9 }, { name: 'Plattenspieler', art: 10 }, { name: 'Wanduhr', art: 11 }, { name: 'Teppich', art: 12 }] },
  sign: { label: 'Schild', sheet: 'decor-b', price: 700, options: [{ name: 'Holzschild', art: 13 }, { name: 'Neon-Tasse', art: 14 }, { name: 'Messingschild', art: 15 }, { name: 'Markise', art: 16 }] },
};
export const DECOR_SLOTS = Object.keys(DECOR) as DecorSlot[];
/** CSS tint per wall colour (index into DECOR.wall.options). */
export const WALL_TINT = ['oklch(0.93 0.03 85)', 'oklch(0.75 0.06 140)', 'oklch(0.62 0.12 45)', 'oklch(0.35 0.07 255)', 'oklch(0.5 0.1 35)', 'oklch(0.3 0.01 250)', 'oklch(0.85 0.05 10)', 'oklch(0.5 0.07 200)'];
export const BARISTA_LEVELS = [0, 40, 120, 260, 500];

/** Café design editor: 3 complete deco concepts per stage (each with its own seating), colour moods and terrace styles. */
export const DESIGN_STYLES = [
  { id: 'bistro', name: 'Holz-Bistro', seats: 'Holztische & Bistrostühle' },
  { id: 'lounge', name: 'Lounge', seats: 'Polsterbänke & Sessel' },
  { id: 'botanic', name: 'Botanisch', seats: 'Rattanstühle & Pflanzen' },
] as const;
/** Colour moods re-tone the complete painted scene (no rectangle overlays). */
export const PALETTES = [
  { name: 'Salbei', swatch: 'oklch(0.62 0.07 145)', filter: 'none' },
  { name: 'Petrol', swatch: 'oklch(0.45 0.07 210)', filter: 'hue-rotate(80deg) saturate(.85) brightness(.97)' },
  { name: 'Terrakotta', swatch: 'oklch(0.6 0.13 45)', filter: 'hue-rotate(-75deg) saturate(1.05)' },
  { name: 'Kreideweiß', swatch: 'oklch(0.94 0.02 90)', filter: 'saturate(.5) brightness(1.08)' },
] as const;
export const TERRACE_STYLES = [
  { name: 'Bistro', bonus: .02 },
  { name: 'Garten', bonus: .03 },
  { name: 'Lounge', bonus: .04 },
] as const;
/** Share of a store's revenue that comes from the terrace; terrace style bonus applies only to this share. */
export const TERRACE_SHARE = 0.25;
export const designPrice = { style: (stage: number) => 500 * stage, palette: (stage: number) => 300 + 100 * stage, terrace: 900 } as const;
