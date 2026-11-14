import { describe, expect, it } from "vitest";
import { getCityArtwork, getStoreArtwork } from "@/game/artwork";
import type { Biome, StoreTier } from "@/engine/types";

describe("Spielgrafiken", () => {
  it("wählt für jedes Biom und jede Ausbaustufe das passende Gebäude", () => {
    const expected: Record<Biome, Record<StoreTier, string>> = {
      european_classic: { 1: "european-kiosk", 2: "european-cafe", 3: "european-flagship" },
      modern_industrial: { 1: "modern-industrial-kiosk", 2: "modern-industrial-cafe", 3: "modern-industrial-flagship" },
      asian_zen: { 1: "east-asian-kiosk", 2: "east-asian-cafe", 3: "east-asian-flagship" },
      tropical_colonial: { 1: "tropical-kiosk", 2: "tropical-cafe", 3: "tropical-flagship" },
    };

    for (const biome of Object.keys(expected) as Biome[]) {
      for (const tier of [1, 2, 3] as StoreTier[]) {
        expect(getStoreArtwork(biome, tier)).toBe(`/assets/buildings/${expected[biome][tier]}.webp`);
      }
    }
  });

  it("gibt allen 20 Metropolen eigene Wahrzeichen und Badges", () => {
    expect(getCityArtwork({ id: "berlin", name: "Berlin", biome: "european_classic", landmarkName: "Brandenburger Tor" }).src)
      .toBe("/assets/landmarks/berlin-brandenburger-tor.webp");
    expect(getCityArtwork({ id: "sao_paulo", name: "São Paulo", biome: "tropical_colonial", landmarkName: "Avenida Paulista" }).src)
      .toBe("/assets/landmarks/sao_paulo.webp");
    expect(getCityArtwork({ id: "havanna", name: "Havanna", biome: "tropical_colonial", landmarkName: "x" }).badge)
      .toBe("/assets/badges/havanna.webp");
  });
});
