import { modularGearArt } from './modularCafeArt';
// Individually cut images from the 10 uploaded sheets under /public/assets/sheets/<sheet>/<index>.webp.
export type SheetName = 'districts' | 'traffic' | 'interior' | 'menu' | 'storefronts' | 'beans' | 'hud' | 'partners' | 'people';
export const SHEET_COUNTS: Record<SheetName, number> = { districts: 44, traffic: 49, interior: 38, menu: 46, storefronts: 44, beans: 40, hud: 47, partners: 39, people: 34 };
export const art = (sheet: SheetName, index: number) => `/assets/sheets/${sheet}/${((index % SHEET_COUNTS[sheet]) + SHEET_COUNTS[sheet]) % SHEET_COUNTS[sheet]}.webp`;

// Unified HUD icon sheet (4×4, 1-based): coins, calendar, crown, star, barista, menu, machine, chart, pin, plane, gear, upgrade, lock, check, warning, trophy.
export type NewSheet = 'drinks' | 'snacks' | 'research-a' | 'research-b' | 'portraits' | 'icons' | 'decor-a' | 'decor-b';
export const sheet16 = (name: NewSheet, i: number) => `/assets/sheets/${name}/${Math.max(1, Math.min(16, i))}.webp`;
export const ICONS = { coins: 1, calendar: 2, crown: 3, star: 4, barista: 5, menu: 6, machine: 7, chart: 8, pin: 9, plane: 10, gear: 11, upgrade: 12, lock: 13, check: 14, warning: 15, trophy: 16 } as const;
export const icon = (k: keyof typeof ICONS) => sheet16('icons', ICONS[k]);
export const HUD = { cash: icon('coins'), valuation: icon('chart'), calendar: icon('calendar'), nextWeek: art('hud', 45), empire: icon('crown'), map: icon('pin'), market: art('hud', 25), finance: icon('coins'), news: art('hud', 29), deal: icon('check'), rejected: icon('warning') };
export const menuItemArt = (kind: 'drink' | 'snack', i: number) => sheet16(kind === 'drink' ? 'drinks' : 'snacks', i);
export const baristaArt = (level: number) => sheet16('portraits', 8 + Math.max(1, Math.min(4, level === 5 ? 4 : level)));
export const executiveArt = (role: string) => sheet16('portraits', ({ coo: 5, cfo: 6, cmo: 7, cto: 8 } as Record<string, number>)[role] ?? 5);

const BEAN_SACKS: Record<string, number> = {
  ethiopia_yirgacheffe: 0, colombia_supremo: 1, brazil_santos: 2, kenya_aa: 3, costa_rica_tarrazu: 4, guatemala_antigua: 5,
  sumatra_mandheling: 6, jamaica_blue_mountain: 7, yemen_mocca_matari: 8, rwanda_bourbon: 9, vietnam_robusta_dak_lak: 10,
  india_monsooned_malabar: 11, panama_geisha: 12, hawaii_kona: 13, peru_chanchamayo: 14, tanzania_peaberry: 15,
};
export const beanArt = (beanId: string) => art('beans', BEAN_SACKS[beanId] ?? 16);

export const b2bPartnerArt = (i: number) => art('partners', i % 10);
export const startupArt = (i: number) => art('partners', 10 + (i % 12));
export const rivalArt = (i: number) => `/assets/sheets/portraits/${(i % 4) + 1}.webp`;
export const staffArt = (role: string, i = 0) => art('people', role === 'manager' ? 2 : i % 2);

const EVENT_CARDS: [RegExp, number][] = [
  [/frost|kälte|schnee/i, 12], [/hafen|schiff|liefer|container|streik/i, 13], [/viral|social|hype|influenc|tiktok/i, 14],
  [/meister|award|preis gewonnen|auszeichnung|wettbewerb/i, 15], [/hitze|sommer/i, 16], [/rezession|krise|konjunktur/i, 17],
  [/marathon|fest|event|stadtfest/i, 18], [/fair|zertif|audit|inspekt|hygiene/i, 19], [/rost|pilz|schädling|krankheit/i, 20],
  [/festival|messe/i, 21], [/miete|vermieter/i, 22], [/kredit|bank/i, 24], [/zins/i, 25], [/strom|ausfall/i, 26],
  [/ernte|bio|plantage/i, 27], [/crash|börse|aktie|markt/i, 28],
];
export function eventArt(text: string) {
  const hit = EVENT_CARDS.find(([re]) => re.test(text));
  return hit ? art('people', hit[1]) : HUD.news;
}

export const STREET_LIFE = [art('traffic', 0), art('traffic', 2), art('traffic', 5), art('traffic', 13)];
export const STREET_VEHICLES = [art('traffic', 30), art('traffic', 33)];
export const CAFE_MENU = [0, 2, 4, 6, 8, 13, 20, 26].map((i) => art('menu', i));
export const ROAST_LEVELS = [16, 17, 18, 19, 20].map((i) => art('beans', i));
export const STOREFRONT_DECOR = { forLease: art('storefronts', 40), grandOpening: art('storefronts', 41), sold: art('storefronts', 43) };
export const DISTRICT_TILES = [0, 3, 5, 9].map((i) => art('districts', i));

// Café interior pieces unlocked per store tier (1 Kiosk, 2 Café, 3 Flagship).
export const CAFE_LOADOUT: { tier: 1 | 2 | 3; label: string; index: number }[] = [
  { tier: 1, label: 'Siebträger', index: 1 }, { tier: 1, label: 'Mühle', index: 4 }, { tier: 1, label: 'Kasse', index: 16 }, { tier: 1, label: 'Bistrotisch', index: 20 },
  { tier: 2, label: 'Dual-Boiler', index: 2 }, { tier: 2, label: 'Präzisionsmühle', index: 5 }, { tier: 2, label: 'Vitrine', index: 11 }, { tier: 2, label: 'Bartheke', index: 21 }, { tier: 2, label: 'Sitzgruppe', index: 26 },
  { tier: 3, label: 'Custom-Maschine', index: 3 }, { tier: 3, label: 'Cold Drip', index: 6 }, { tier: 3, label: 'Sandwich-Vitrine', index: 12 }, { tier: 3, label: 'Lounge-Sessel', index: 19 }, { tier: 3, label: 'Eckbank', index: 22 }, { tier: 3, label: 'Menü-Screens', index: 29 }, { tier: 3, label: 'Mooswand', index: 25 },
].map((p) => ({ ...p, tier: p.tier as 1 | 2 | 3 }));
export const cafeLoadoutArt = (index: number) => art('interior', index);
export const EQUIPMENT_ART = { espresso: [1, 2, 3], grinder: [4, 5], interior: [20, 26, 19] } as const;
export const equipmentArt = (category: keyof typeof EQUIPMENT_ART, level: number) => art('interior', EQUIPMENT_ART[category][level] ?? 1);

// District tiles: shopping, scene/art, nightlife, finance, old town, park, office, campus…
const DISTRICT_TILE_ORDER = [0, 2, 4, 12, 5, 1, 13, 14, 6, 9];
export const districtTileArt = (i: number) => art('districts', DISTRICT_TILE_ORDER[i % DISTRICT_TILE_ORDER.length] ?? 0);

const CITY_BUILDING_ART: Record<string, number[]> = {
  shopping: [0, 17, 18, 22, 25, 31], pedestrian: [0, 13, 17, 25, 27, 30],
  financial: [6, 7, 9, 12, 14, 16, 21, 28], residential: [0, 13, 17, 25, 31], student: [6, 14, 20, 21, 27],
};
export const cityBuildingArt = (zone: string, index: number) => {
  const options = CITY_BUILDING_ART[zone] ?? [0]; return art('districts', options[index % options.length] ?? 0).replace('.webp', '-map.webp');
};
export const airportArt = art('districts', 32).replace('.webp', '-map.webp');
export const MAP_PEOPLE = STREET_LIFE.map(src => src.replace('.webp', '-map.webp'));

// Progression sheets (4×4, 1-based files): equipment tiers, store stages + furniture, rank emblems + UI icons.
const prog = (sheet: 'equipment-tiers' | 'store-stages' | 'rank-icons', i: number) => `/assets/sheets/${sheet}/${i}.webp`;
export const stageArt = (stage: number) => prog('store-stages', Math.max(1, Math.min(7, stage)));
export const rankArt = (rank: number) => prog('rank-icons', Math.max(1, Math.min(10, rank)));
export const PROGRESS_ICONS = { trophy: icon('trophy'), goal: prog('rank-icons', 12), streak: prog('rank-icons', 13), gift: prog('rank-icons', 14), medal: prog('rank-icons', 15), lock: icon('lock') };
/** Visible upgrade parts: espresso 1-5, grinder 6-9, vitrine 10-13, terrace 14-16; furniture/decor from the stage sheet. */
export const espressoTierArt = (level: number) => prog('equipment-tiers', [1, 3, 5][Math.min(2, level)] ?? 1);
export const grinderTierArt = (level: number) => prog('equipment-tiers', [7, 8][Math.min(1, level)] ?? 7);
export const vitrineArt = (stage: number) => prog('equipment-tiers', stage <= 2 ? 10 : stage <= 4 ? 11 : stage <= 6 ? 12 : 13);
export const terraceArt = (stage: number) => prog('equipment-tiers', stage <= 3 ? 14 : stage <= 5 ? 15 : 16);
export const seatingArt = (interior: number, stage: number) => prog('store-stages', interior >= 2 ? 12 : interior === 1 ? 10 : stage >= 3 ? 9 : 8);
export const decorArt = (stage: number) => prog('store-stages', [13, 14, 15, 16][Math.min(3, Math.floor(stage / 2))] ?? 13);

/** 5-level gear art from the equipment-tiers sheet (espresso 1-5, grinder 6-9, vitrine 10-13, terrace 14-16; seating from store-stages 8-12). */
export const gearArt = (c: string, level: number) => {
  const modular = modularGearArt(c, level);
  if (modular) return modular;
  const l = Math.max(0, Math.min(4, level));
  if (c === 'espresso') return prog('equipment-tiers', 1 + l);
  if (c === 'grinder') return prog('equipment-tiers', 6 + Math.min(3, l));
  if (c === 'vitrine') return prog('equipment-tiers', 10 + Math.min(3, l));
  if (c === 'terrace') return prog('equipment-tiers', 14 + Math.min(2, Math.max(0, l - 1)));
  return prog('store-stages', 8 + l);
};
