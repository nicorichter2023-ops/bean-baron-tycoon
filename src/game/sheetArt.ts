// Individually cut images from the 10 uploaded sheets under /public/assets/sheets/<sheet>/<index>.webp.
export type SheetName = 'districts' | 'traffic' | 'interior' | 'menu' | 'storefronts' | 'beans' | 'hud' | 'partners' | 'people';
export const SHEET_COUNTS: Record<SheetName, number> = { districts: 44, traffic: 49, interior: 38, menu: 46, storefronts: 44, beans: 40, hud: 47, partners: 39, people: 34 };
export const art = (sheet: SheetName, index: number) => `/assets/sheets/${sheet}/${((index % SHEET_COUNTS[sheet]) + SHEET_COUNTS[sheet]) % SHEET_COUNTS[sheet]}.webp`;

export const HUD = { cash: art('hud', 0), valuation: art('hud', 6), calendar: art('hud', 46), nextWeek: art('hud', 45), empire: art('hud', 5), map: art('hud', 17), market: art('hud', 25), finance: art('hud', 7), news: art('hud', 29), deal: art('hud', 43), rejected: art('hud', 44) };

const BEAN_SACKS: Record<string, number> = {
  ethiopia_yirgacheffe: 0, colombia_supremo: 1, brazil_santos: 2, kenya_aa: 3, costa_rica_tarrazu: 4, guatemala_antigua: 5,
  sumatra_mandheling: 6, jamaica_blue_mountain: 7, yemen_mocca_matari: 8, rwanda_bourbon: 9, vietnam_robusta_dak_lak: 10,
  india_monsooned_malabar: 11, panama_geisha: 12, hawaii_kona: 13, peru_chanchamayo: 14, tanzania_peaberry: 15,
};
export const beanArt = (beanId: string) => art('beans', BEAN_SACKS[beanId] ?? 16);

export const b2bPartnerArt = (i: number) => art('partners', i % 10);
export const startupArt = (i: number) => art('partners', 10 + (i % 12));
export const rivalArt = (i: number) => art('partners', 22 + (i % 12));
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

// District tiles: shopping, scene/art, nightlife, finance, old town, park, office, campus…
const DISTRICT_TILE_ORDER = [0, 2, 4, 12, 5, 1, 13, 14, 6, 9];
export const districtTileArt = (i: number) => art('districts', DISTRICT_TILE_ORDER[i % DISTRICT_TILE_ORDER.length]);
