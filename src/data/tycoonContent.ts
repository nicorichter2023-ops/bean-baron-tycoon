// Master GDD values take precedence over illustrative UI wireframes.
export const TREND_DRINKS = ['Pistachio Cloud Foam', 'Dalgona Coffee', 'Mushroom Coffee', 'Pumpkin Spice Latte'];
export const FARM_METHODS = [
  { id: 'shade', name: 'Schattenkaffee', yield: 1, quality: 3, esg: 10 },
  { id: 'perma', name: 'Permakultur', yield: .85, quality: 5, esg: 20 },
  { id: 'mono', name: 'Monokultur', yield: 1.3, quality: -2, esg: -10 },
] as const;
export const PROCESSES = [{ id: 'washed', name: 'Washed', quality: 0 }, { id: 'natural', name: 'Natural', quality: 2 }, { id: 'anaerobic', name: 'Anaerobic', quality: 4 }] as const;
export const ENTERPRISE = [
  { id: 'campus', name: 'Tech-Campus', kg: 1500, price: 18.5, score: 84, weeks: 52 },
  { id: 'airline', name: 'First-Class Airline', kg: 2500, price: 21, score: 86, weeks: 52 },
  { id: 'hotel', name: 'Luxushotel-Gruppe', kg: 1800, price: 22, score: 90, weeks: 52 },
] as const;
export const RETAIL = [
  { id: 'beans', name: 'Ganze Bohne · 500 g', fee: 75000, kg: .5, price: 9, volume: 1800 },
  { id: 'capsules', name: 'Kompostierbare Kapseln', fee: 150000, kg: .1, price: 5, volume: 4500 },
  { id: 'rtd', name: 'Cold-Brew-Dosen', fee: 100000, kg: .03, price: 2.5, volume: 6000 },
] as const;
export const PATENTS = [
  { id: 'brew', name: 'Präzisions-Brühgruppe', cost: 180000, weeks: 12, income: 2200 },
  { id: 'drum', name: 'Sensor-Rösttrommel', cost: 240000, weeks: 16, income: 3200 },
  { id: 'energy', name: 'Eco-Siebträger', cost: 200000, weeks: 14, income: 2600 },
  { id: 'grinder', name: 'Kühlmahlwerk', cost: 90000, weeks: 8, income: 1200 },
  { id: 'milk', name: 'Auto-Milchtextur', cost: 120000, weeks: 10, income: 1600 },
  { id: 'capsule', name: 'Kompostierbare Kapsel', cost: 260000, weeks: 18, income: 3800 },
  { id: 'cold', name: 'Nitro-Cold-Brew-Zapfanlage', cost: 150000, weeks: 11, income: 2000 },
  { id: 'robot', name: 'Barista-Roboterarm', cost: 420000, weeks: 24, income: 6200 },
  { id: 'aiRoast', name: 'KI-Röstprofile', cost: 320000, weeks: 20, income: 4600 },
] as const;
export const PERKS = [
  { id: 'diplomat', name: 'Diplomaten-Familie', effect: 'Keine Importzölle · +25 % Lobby-Einfluss' },
  { id: 'roast', name: 'Röst-Genie', effect: '+5 Cupping-Punkte für jede Röstung' },
  { id: 'property', name: 'Immobilien-Dynastie', effect: '20 % Rabatt auf Gewerbeimmobilien' },
  { id: 'tech', name: 'Tech-Visionär', effect: 'BeanPay ab der ersten Woche' },
] as const;
export type HeritagePerk = typeof PERKS[number]['id'];
export const ORIGINS: Record<string, { x: number; y: number }> = {
  Colombia: { x: 29, y: 53 }, Kolumbien: { x: 29, y: 53 }, Ethiopia: { x: 57, y: 53 }, Äthiopien: { x: 57, y: 53 },
  Guatemala: { x: 24, y: 48 }, 'Costa Rica': { x: 27, y: 51 }, Kenya: { x: 57, y: 58 }, Kenia: { x: 57, y: 58 },
  Brazil: { x: 34, y: 64 }, Brasilien: { x: 34, y: 64 }, Vietnam: { x: 77, y: 46 }, Indonesia: { x: 81, y: 59 }, Indonesien: { x: 81, y: 59 },
  Peru: { x: 28, y: 62 }, Jamaica: { x: 27, y: 46 }, Panama: { x: 27, y: 52 },
};