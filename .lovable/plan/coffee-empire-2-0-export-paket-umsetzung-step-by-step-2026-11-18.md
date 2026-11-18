# Coffee Empire 2.0 – Export-Paket „Umsetzung Step by Step“

Ziel: Ein einziges, aktuelles Export-Paket, mit dem du (oder Gemini/Claude/ein anderer Workspace) den kompletten Umbau Schritt für Schritt umsetzen kannst. Veraltete Inhalte (Futures, Patente, BeanPay/Crypto, Bio-Siegel, Dynastie, Stadtrat-Mikromanagement, alte Grafiken) werden entfernt bzw. ausdrücklich als „gestrichen“ markiert.

## Was erstellt wird (in Dateien)

1. **Coffee-Empire-2.0-Umsetzungsplan_v3.md** – das Hauptdokument (ersetzt nicht, sondern versioniert Dossier v2)
2. **Coffee-Empire-2.0-Prompts_v2.md** – alle kopierfertigen Prompts, sortiert nach Schritt und Ziel-KI
3. **coffee-empire-2.0-export_v2.zip** – beide Dokumente + Design-Referenzen (design-sheet-v4, v6, map-sheet-v4, gesamtdesign-v2) + schlanker Quellcode (ohne node_modules/.git)
4. Eine Dokument-Sammlung „Coffee Empire 2.0 – Export“ in Files

## Inhalt des Umsetzungsplans (Kapitel)

1. **Vision in 10 Sätzen** – vom Kiez-Café zum Börsenkonzern, Anno-1800-Stimmung modern, Geld fühlt sich nie wertlos an
2. **Was bleibt / was fliegt raus** – Tabelle mit Begründung je Mechanik
3. **Gameloop & Progression** – 4 Phasen (Kiez-Barista → Regionale Kette/Rösterei → Konzern → Börsen-Konglomerat/Prestige), je Phase: Ziel, freigeschaltete Systeme, Kapital-Senken, typische Dauer in Wochen
4. **Mechaniken final** – Cafés (4 Gästetypen, Preis-Elastizität, Personal/Lohnregler/Akademie), klassischer Café-Editor (4 Raumstufen × 5 Slots: Maschine, Theke, Möbel, Wände/Licht, Terrasse), Bohnen/Lieferkette/Fincas/B2B, Expansion/Rivalen/Übernahmen, Immobilien Mieten→Kaufen/HQ-Tower, Forschung (4 Wege), lokales Marketing, C-Level-Automation
5. **Lebendige Welt** – Weltkrisen, Erfindungen, Trends mit Ursache→Wirkung auf Kunden, Märkte, Kurse; seltene, logische Überraschungen
6. **Finanz-Hauptmechanik** – prozedural generierte Firmen mit Lebenszyklen (scheitern, seitwärts, Durchbruch), Aktien, VC-Runden, PE-Übernahmen, eigener IPO, Synergien zu deinen Cafés
7. **Balancing-Leitwerte** – Startkapital, Margen, Kapital-Senken je Phase, Renditekorridore; klar markiert als „Startwerte, per Simulation zu prüfen“
8. **Design-System** – Karten im Tageslicht (map-v4), gemalte Szenen/Menschen (design-v4), dunkle UI + Goldakzente (design-v6); Farbpalette, Grün/Rot für Gewinn/Verlust, Icons Dual-Tone, keine alten Grafiken
9. **Karten** – hochkant, isometrisch, X/Y-Pan + Zoom ohne Drehung, 20 Städte, 4 Regionalsets à 18 Gebäudetypen, Café-Gebäude ändern sich mit Stufe, Baukasten für 600+ Cafés
10. **Bedienung** – 4 Säulen-Navigation, Wochenbutton in der Mitte, Daumen-Sheets, Wischen, kaum Scrollen, 3 Speicherstände, Onboarding
11. **Code-Umbau & Verschlankung** – eine zentrale Wochen-Simulation statt Kette (management→progress→empire→tycoon), ein Filialmodell, ein Spielstand mit Migration, neue Ordnerstruktur, Komplexitäts-Check, was gelöscht wird
12. **Step-by-Step-Reihenfolge** (siehe unten)
13. **Gameloop-Testplan** – 52- und 200-Wochen-Simulation, Kriterien „Spaß/Fortschritt/Geldwert“
14. **Credit-Spar-Strategie** – was Gemini/AI Studio macht, was hier gemacht wird

## Step-by-Step-Reihenfolge (im Dokument je Schritt: Ziel, wer, Prompt, Ergebnis, Prüfung)

```text
0  Vorbereitung     Ordner, Referenzbilder, Regeln              (du)
1  Daten extern     Städte, Firmen-Generator-Regeln, Events     (Gemini/AI Studio)
2  Engine-Kern      zentrale Wochen-Simulation + Filialmodell   (hier)
3  Spielstand       neues Schema + Migration alter Saves        (hier)
4  Grafik-Basis     Icons, UI-Elemente, Farbsystem              (Gemini Bild)
5  Karten-Baukasten 4×18 Gebäude, Café-Stufen, Böden            (Gemini Bild)
6  Café-Editor      Raumstufen + Slot-Layer                     (Gemini Bild + hier)
7  Heros/Artworks   Führung, Meilensteine, Krisen               (Gemini Bild)
8  UI-Neubau        4 Säulen, Sheets, Wochenabschluss           (hier)
9  Finanzen         Aktien/VC/PE/IPO + lebendige Welt           (Logik extern, Einbau hier)
10 Integration      alles verbinden, alte Grafiken entfernen    (hier)
11 Simulation       Gameloop-Test, Balancing-Korrektur          (hier)
12 Feinschliff      Animationen, Sound/Haptik, PWA              (hier)
```

Begründung der Reihenfolge: Daten und Engine zuerst, weil Grafik und UI darauf aufbauen; Spielstand vor UI, damit nichts verloren geht; Grafik parallel extern, damit hier keine Credits verbraucht werden; Simulation zum Schluss, wenn alles verbunden ist.

## Prompt-Dokument

- Je Schritt fertige Prompts auf Deutsch, mit Stil-Block (einmal definiert, überall eingefügt)
- Bild-Prompts mit Format, Hintergrund (transparent), Raster, Dateinamen-Schema
- Daten-Prompts mit JSON-Vorlage, damit das Ergebnis direkt einsetzbar ist
- Code-Prompts für reine Rechenmodule (ohne UI), mit Testanforderungen
- Hinweis bei Gemini-Chat: ein Bild pro Prompt einplanen, Batch über AI Studio

## Qualitätsprüfung vor Abgabe

- Alles gegen den Gesprächsverlauf geprüft (gestrichene Features nicht mehr drin, 360° korrigiert, keine alten Grafiken)
- Dateiliste des ZIP geprüft, keine .git/node_modules
- Projektgedächtnis um die Architektur-/Stilregeln ergänzt, die noch fehlen (Baukastenregel)

## Technische Details

- Nur Dokumente in /mnt/documents, keine Änderungen am Spielcode
- ZIP wird in /tmp gebaut, geprüft, dann kopiert
- Neue Versionen statt Überschreiben (_v3, _v2)
