import type { City } from "@/engine/types";

// Mock-Städte — werden durch das Content-JSON ersetzt.
export const CITIES: City[] = [
  {
    id: "berlin", name: "Berlin", biome: "european_classic", purchasingPower: 1.2, coffeeCultureIndex: 70,
    districts: [
      { id: "ber-mitte", name: "Mitte", footTraffic: 85, rentWeekly: 1800, competition: 60, maxStoreTier: 3 },
      { id: "ber-kreuzberg", name: "Kreuzberg", footTraffic: 70, rentWeekly: 1100, competition: 45, maxStoreTier: 2 },
    ],
  },
  {
    id: "saopaulo", name: "São Paulo", biome: "tropical_colonial", purchasingPower: 0.8, coffeeCultureIndex: 90,
    districts: [
      { id: "sp-paulista", name: "Avenida Paulista", footTraffic: 90, rentWeekly: 900, competition: 55, maxStoreTier: 3 },
      { id: "sp-vila", name: "Vila Madalena", footTraffic: 65, rentWeekly: 500, competition: 35, maxStoreTier: 2 },
    ],
  },
];
