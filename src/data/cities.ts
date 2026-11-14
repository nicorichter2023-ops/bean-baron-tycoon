import type { City } from "@/engine/types";

// Mock content — wird später durch das Content-JSON ersetzt.
export const CITIES: City[] = [
  { id: "berlin", name: "Berlin", country: "Deutschland", region: "Europa", biome: "Gemäßigt", population: 3_700_000, demand: 0.8, rent: 4200, cafeCost: 85_000 },
  { id: "saopaulo", name: "São Paulo", country: "Brasilien", region: "Südamerika", biome: "Tropisch", population: 12_300_000, demand: 0.9, rent: 2600, cafeCost: 60_000 },
];
export const REGIONS = Array.from(new Set(CITIES.map((c) => c.region)));
export const BIOMES = Array.from(new Set(CITIES.map((c) => c.biome)));
