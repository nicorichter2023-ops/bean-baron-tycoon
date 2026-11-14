// Individually cut images from the 10 uploaded sheets under /public/assets/sheets/<sheet>/<index>.webp.
export type SheetName = 'districts' | 'traffic' | 'interior' | 'menu' | 'storefronts' | 'beans' | 'hud' | 'partners' | 'people';
export const SHEET_COUNTS: Record<SheetName, number> = { districts: 44, traffic: 49, interior: 38, menu: 46, storefronts: 44, beans: 40, hud: 47, partners: 39, people: 34 };
export const art = (sheet: SheetName, index: number) => `/assets/sheets/${sheet}/${((index % SHEET_COUNTS[sheet]) + SHEET_COUNTS[sheet]) % SHEET_COUNTS[sheet]}.webp`;

export const HUD = { cash: art('hud', 0), valuation: art('hud', 5), calendar: art('hud', 45), nextWeek: art('hud', 44), empire: art('hud', 4), map: art('hud', 16), market: art('hud', 24), finance: art('hud', 6), news: art('hud', 28), deal: art('hud', 42), rejected: art('hud', 43) };

const BEAN_SACKS: Record<string, number> = {
  ethiopia_yirgacheffe: 0, colombia_supremo: 1, brazil_santos: 2, kenya_aa: 3, costa_rica_tarrazu: 4, guatemala_antigua: 5,
  sumatra_mandheling: 6, jamaica_blue_mountain: 7, yemen_mocca_matari: 8, rwanda_bourbon: 9, vietnam_robusta_dak_lak: 10,
  india_monsooned_malabar: 11, panama_geisha: 12, hawaii_kona: 13, peru_chanchamayo: 14, tanzania_peaberry: 15,
};
export const beanArt = (beanId: string) => art('beans', BEAN_SACKS[beanId] ?? 16);

export const b2bPartnerArt = (i: number) => art('partners', i % 10);
export const startupArt = (i: number) => art('partners', 10 + (i % 12));
export const rivalArt = (i: number) => art('partners', 22 + (i % 12));
export const staffArt = (role: string, i = 0) => art('people', role === 'manager' ? 2 : [0, 1][i % 2]);

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
