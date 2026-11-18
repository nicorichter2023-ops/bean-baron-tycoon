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
export const ORIGINS: Record<string, { x: number; y: number }> = {
  Colombia: { x: 29, y: 53 }, Kolumbien: { x: 29, y: 53 }, Ethiopia: { x: 57, y: 53 }, Äthiopien: { x: 57, y: 53 },
  Guatemala: { x: 24, y: 48 }, 'Costa Rica': { x: 27, y: 51 }, Kenya: { x: 57, y: 58 }, Kenia: { x: 57, y: 58 },
  Brazil: { x: 34, y: 64 }, Brasilien: { x: 34, y: 64 }, Vietnam: { x: 77, y: 46 }, Indonesia: { x: 81, y: 59 }, Indonesien: { x: 81, y: 59 },
  Peru: { x: 28, y: 62 }, Jamaica: { x: 27, y: 46 }, Panama: { x: 27, y: 52 },
};