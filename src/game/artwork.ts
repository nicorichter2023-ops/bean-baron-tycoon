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

const CITY_LANDMARKS: Partial<Record<string, { src: string; label: string }>> = {
  paris: { src: "/assets/landmarks/paris-eiffelturm.webp", label: "Eiffelturm" },
  wien: { src: "/assets/landmarks/wien-riesenrad.webp", label: "Wiener Riesenrad" },
  berlin: { src: "/assets/landmarks/berlin-brandenburger-tor.webp", label: "Brandenburger Tor" },
  london: { src: "/assets/landmarks/london-big-ben.webp", label: "Big Ben" },
  seattle: { src: "/assets/landmarks/seattle-space-needle.webp", label: "Space Needle" },
  new_york: { src: "/assets/landmarks/new-york-freiheitsstatue.webp", label: "Freiheitsstatue" },
  sydney: { src: "/assets/landmarks/sydney-opernhaus.webp", label: "Sydney Opera House" },
  tokio: { src: "/assets/landmarks/tokio-tower.webp", label: "Tokyo Tower" },
  mailand: { src: "/assets/landmarks/mailand.webp", label: "Mailänder Dom" },
  kopenhagen: { src: "/assets/landmarks/kopenhagen.webp", label: "Nyhavn" },
  toronto: { src: "/assets/landmarks/toronto.webp", label: "CN Tower" },
  melbourne: { src: "/assets/landmarks/melbourne.webp", label: "Flinders Street Station" },
  seoul: { src: "/assets/landmarks/seoul.webp", label: "Gyeongbokgung" },
  singapur: { src: "/assets/landmarks/singapur.webp", label: "Marina Bay Sands" },
  ho_chi_minh_stadt: { src: "/assets/landmarks/ho_chi_minh_stadt.webp", label: "Hauptpostamt Saigon" },
  bogota: { src: "/assets/landmarks/bogota.webp", label: "Monserrate" },
  sao_paulo: { src: "/assets/landmarks/sao_paulo.webp", label: "MASP" },
  addis_abeba: { src: "/assets/landmarks/addis_abeba.webp", label: "Meskel-Platz" },
  kapstadt: { src: "/assets/landmarks/kapstadt.webp", label: "Tafelberg" },
  havanna: { src: "/assets/landmarks/havanna.webp", label: "Capitolio" },
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
    src: landmark?.src ?? getStoreArtwork(city.biome, 3),
    alt: landmark ? `${city.name} – ${landmark.label}` : `${city.name} – ${BIOME_LABEL[city.biome]}`,
    label: landmark?.label ?? city.landmarkName,
    isLandmark: Boolean(landmark),
    badge: `/assets/badges/${city.id}.webp`,
  };
}
