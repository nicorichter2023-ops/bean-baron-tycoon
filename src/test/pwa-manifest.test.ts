import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("PWA-Manifest", () => {
  it("startet installiert im Vollbild und bietet die benötigten Android-Symbole", () => {
    const manifest = JSON.parse(readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"));

    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toContain("fullscreen");
    expect(manifest.orientation).toBe("portrait");
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: "/icon-192.png", sizes: "192x192" }),
      expect.objectContaining({ src: "/icon-512.png", sizes: "512x512" }),
      expect.objectContaining({ src: "/icon-maskable-512.png", purpose: "maskable" }),
    ]));
  });
});
