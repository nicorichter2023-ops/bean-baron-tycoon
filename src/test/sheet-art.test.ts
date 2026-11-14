import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { beanArt, eventArt, rivalArt, startupArt, SHEET_COUNTS, art } from "@/game/sheetArt";

describe("Sheet-Grafiken", () => {
  it("ordnet Bohnen ihrem Länder-Jutesack zu", () => {
    expect(beanArt("ethiopia_yirgacheffe")).toBe("/assets/sheets/beans/0.webp");
    expect(beanArt("panama_geisha")).toBe("/assets/sheets/beans/12.webp");
  });
  it("trennt Startups (10–21) und Börsen-Rivalen (22–33)", () => {
    expect(startupArt(0)).toBe("/assets/sheets/partners/10.webp");
    expect(rivalArt(0)).toBe("/assets/sheets/partners/22.webp");
  });
  it("zeigt bei Frost die Frost-Ereigniskarte", () => {
    expect(eventArt("Frost in Brasilien")).toBe("/assets/sheets/people/12.webp");
  });
  it("jede referenzierte Datei existiert", () => {
    for (const [sheet, n] of Object.entries(SHEET_COUNTS)) for (let i = 0; i < n; i++)
      expect(existsSync(`public${art(sheet as keyof typeof SHEET_COUNTS, i)}`)).toBe(true);
  });
});
