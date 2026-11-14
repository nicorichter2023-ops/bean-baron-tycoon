import type { Biome, City, StoreTier } from "@/engine/types";

const STORE_SPRITES: Record<Biome, Record<StoreTier, string>> = {
  european_classic: {
    1: "/assets/buildings/european-kiosk.webp",
    2: "/assets/buildings/european-cafe.webp",
    3: "/assets/buildings/european-flagship.webp",
  },
  modern_industrial: {
    1: "/assets/buildings/modern-industrial-kiosk.webp",
    2: "/assets/buildings/modern-industrial-cafe.webp",
    3: "/assets/buildings/modern-industrial-flagship.webp",
  },
  asian_zen: {
    1: "/assets/buildings/east-asian-kiosk.webp",
    2: "/assets/buildings/east-asian-cafe.webp",
    3: "/assets/buildings/east-asian-flagship.webp",
  },
  tropical_colonial: {
    1: "/assets/buildings/tropical-kiosk.webp",
    2: "/assets/buildings/tropical-cafe.webp",
    3: "/assets/buildings/tropical-flagship.webp",
  },
};

const CITY_LANDMARKS: Partial<Record<string, string>> = {
  paris: "/assets/landmarks/paris-eiffelturm.webp",
  wien: "/assets/landmarks/wien-riesenrad.webp",
  berlin: "/assets/landmarks/berlin-brandenburger-tor.webp",
  london: "/assets/landmarks/london-big-ben.webp",
  seattle: "/assets/landmarks/seattle-space-needle.webp",
  new_york: "/assets/landmarks/new-york-freiheitsstatue.webp",
  sydney: "/assets/landmarks/sydney-opernhaus.webp",
  tokio: "/assets/landmarks/tokio-tower.webp",
};

export const COMPANY_ARTWORK = {
  holding: "/assets/icons/holding-tower.webp",
  roastery: "/assets/icons/roesterei.webp",
  port: "/assets/icons/hafen.webp",
  stockExchange: "/assets/icons/boerse.webp",
} as const;

export const BIOME_LABEL: Record<Biome, string> = {
  european_classic: "Europäisch klassisch",
  modern_industrial: "Modern industriell",
  asian_zen: "Asiatisch Zen",
  tropical_colonial: "Tropisch kolonial",
};

export function getStoreArtwork(biome: Biome, tier: StoreTier) {
  return STORE_SPRITES[biome][tier];
}

export function getCityArtwork(city: Pick<City, "id" | "name" | "biome" | "landmarkName">) {
  const landmark = CITY_LANDMARKS[city.id];
  return {
    src: landmark ?? getStoreArtwork(city.biome, 3),
    alt: landmark ? `${city.name} – regionale Landmark-Miniatur` : `${city.name} – ${BIOME_LABEL[city.biome]}`,
    isLandmark: Boolean(landmark),
  };
}
