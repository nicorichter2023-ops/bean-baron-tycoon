# Coffee Empire 2.0 – Gesamtumbau und Grafik-Update

Ziel: Neues, zusammenhängendes Design nach den v2-Vorschaubildern (Anthrazit/Nachtblau, Gold nur für Aktionen und Sterne, Grün/Rot für Kurse). Weniger Menüs, kaum Scrollen, Einhandbedienung, regionale Café-Szenen. Dazu Futures und Optionen, mehr Café-Varianten und am Ende ein 52-Wochen-Test des Spielablaufs.

## Arbeitsteilung, um Credits zu sparen

| Aufgabe | Wo | Lovable-Credits |
|---|---|---|
| Alle Bilder, Hero-Header, Icons, Café-Innenräume, Terrassen | Gemini Enterprise (Bilder) | 0 |
| Texte und Daten (Events, Patente, Startups, Bohnen-Steckbriefe, Bewerber-Namen) | Gemini Enterprise / AI Studio | 0 |
| Rechenmodule (Futures- und Optionspreise) als fertige .ts-Datei | Gemini 2.5 Pro | 0 |
| Einbauen, Freistellen, WebP, Menüs, Tests, Veröffentlichen | Lovable | wenig, gebündelt |

Regel: Du lieferst pro Phase **ein** Paket (ZIP oder mehrere Dateien auf einmal), ich baue es in **einem** Durchgang ein.

Bildregeln für Gemini (gelten für jeden Bild-Prompt):
- Hintergrund einfarbig Magenta (#FF00FF) bei freizustellenden Motiven, damit weiße Fassaden erhalten bleiben
- Kein Text, keine Logos, keine Menschen im Vordergrund
- Gleiche Kamera und gleicher Bildausschnitt für alle Varianten einer Serie
- Stil-Satz immer anhängen: „premium mobile tycoon game art, painterly semi-realistic, soft cinematic light, dark anthracite and midnight blue palette with warm gold accents, clean edges, no text“

## Phase 0 – Grundlagen festlegen (Lovable, klein)
1. Farbpalette und Schriften als Design-Tokens setzen (Anthrazit #121316, Schiefer #1a1d24, Nachtblau, Gold, Kupfer, Grün/Rot).
2. Zentrale Bildliste anlegen: Jede Bildstelle im Spiel hat einen festen Namen und eine Ersatzgrafik. Damit kann jedes neue Bild ohne Codeänderung getauscht werden.
3. Liste aller benötigten Dateinamen an dich ausgeben (Checkliste für Gemini).

## Phase 1 – Neue Menüstruktur (Lovable)
Vier Bereiche plus runder Weiter-Knopf in der Mitte der unteren Leiste:

```text
[STADT]            [CAFÉS]            ( WEITER )   [MARKT]              [KONZERN]
Karte + Pins       Filialen-Liste                  Rösterei & Fincas    C-Level & Bewerbung
Flughafen/Reisen   Café-Editor                     Bohnen & Futures     Finanzen, Bank, BeanPay
Lokalpolitik       Menü & Marketing                B2B & Supermarkt     Börse & Startups
Rivalen/Immob.*                                                         Forschung & Labor
```
*Rivalen und Immobilien nur über die Karte und das Pin-Fenster, kein eigenes Menü mehr.

- Höchstens 3–4 Unterpunkte je Bereich, Wechsel per Wischen.
- „Bildschirm passt“-Regel: Header max. 120 px, Inhalte in aufklappbaren Karten, lange Listen als Raster mit Detail-Fenster von unten.
- Zusammenstreichen: doppelte Upgrade-Wege, separates Expansions-Menü, getrennte Forschung/Labor, alter Talentpool-Rest, toter Code der alten Menüs.
- Fortschritt/Erfolge wandern als kleines Abzeichen in die obere Leiste.

## Phase 2 – Spielmechanik schärfen (Lovable + Gemini-Rechenmodul)
1. **Futures**: Terminkontrakte 4/12/24 Wochen, fester Preis, Lieferung automatisch ins Lager, Strafe bei Nichtabnahme.
2. **Optionen**: Call/Put mit Prämie, Ausübung am Fälligkeitstag, einfache Ampel „lohnt sich / lohnt sich nicht“.
3. **COO-Auto-Einkauf**: kauft bei Engpass automatisch, Grenze einstellbar.
4. **Café-Gestaltung mit Wirkung**: Stimmung, Sitze, Theke, Farbe und Terrasse beeinflussen Zielgruppe und Bewertung – einmal bezahlen, bleibt dauerhaft.
5. **Motivation**: klarere Wochenziele (3 pro Woche), Meilenstein-Banner (erste Übernahme, IPO, 100 t Kaffee), Rivalen reagieren sichtbar.
6. Gesamtbewertung im Café farbig (grün/gold/rot) mit Badge.
7. Alle neuen Werte in den Spielstand mit Versions-Migration, alte Spielstände bleiben gültig.

## Phase 3 – Grafik-Paket (Gemini, dann ein Einbau in Lovable)
Gebäude bleiben je Stufe gleich (außen). Innen komplett unterschiedlich je Stimmung, Ausstattung und Farbe. Szenen passen zur Region.

Umfang:
- **Gebäude außen**: 7 Stufen x 4 Regionen = 28 (mit leerem Terrassenplatz)
- **Innenräume**: 7 Stufen x 3 Stimmungen (skandinavisch, edel, traditionell) x 2 Ausstattungen = 42; Farben per Tapete/Flächen-Ebene, nicht als eigenes Bild
- **Terrassen**: 3 Stimmungen x 3 Stile = 9, passend zum Gebäude angedockt
- **Hero-Header**: 14 (Karte, Flughafen, Filialen, Editor, Marketing, Rösterei, Fincas, Futures, B2B, HQ, Finanzen, Börse, Forschung, Politik)
- **Icons**: 40 einheitliche Icons (Menü, Ressourcen, Aktionen)
- **C-Level-Porträts**: 12
- **Meilenstein-Banner**: 6
- **Splash/Ladebild + Flugszene**: 2

Regionen: Europa, Nordamerika, Asien, Südamerika/Afrika (je Stadt fest zugeordnet).

## Phase 4 – Bereiche neu gestalten (Lovable)
Flughafen, Stadtkarte, Café-Ansicht und Editor, Börse mit Futures-Rechner, Forschungsbaum, HQ mit Bewerbung – alle im neuen Stil, mit Filial-Vorschaubildern in der Liste und sanften Animationen (Weiter-Knopf pulsiert, weiche Überblendung im Editor, Rücksicht auf „Bewegung reduzieren“).

## Phase 5 – 52-Wochen-Simulationstest (Lovable)
Automatischer Durchlauf mit drei Spielweisen (vorsichtig, normal, aggressiv). Prüfung: kein Dauerverlust am Anfang, Mieten im Mittelteil tragbar (15–30 Filialen), kein endloses Geldwachstum am Ende, Bohnenbedarf passt zur Röstkapazität, Futures schützen vor Preisschocks. Ergebnis als Bericht, danach Feinabstimmung der Zahlen.

## Reihenfolge und Abhängigkeiten
```text
Phase 0 (Tokens, Bildliste) ──► Phase 1 (Menüs) ──► Phase 4 (Bereiche)
        │                           │
        └─► Phase 3 (Gemini-Bilder parallel, sobald Dateiliste da)
Phase 2 (Mechanik) ──────────────────┴──► Phase 5 (Simulation, zuletzt)
```
Während ich Phase 1 und 2 baue, erstellst du parallel die Bilder.

## Kopier-Prompts für Gemini Enterprise

**A – Gebäude außen (je Stufe und Region):**
„Isometric exterior of a coffee shop, stage {1–7: kiosk, small café, corner café, café with seating, flagship, roastery café, landmark coffee house}, {region} architecture, empty paved terrace area on the right side, solid #FF00FF background, same camera angle for all images, [Stil-Satz]“

**B – Innenraum:**
„Isometric cutaway interior of a {stage} coffee shop, {Scandinavian light wood / elegant marble and brass / traditional Viennese dark wood} style, {basic / premium} furniture and counter, neutral light grey walls (will be recoloured), same camera and room shape as reference, solid #FF00FF background, [Stil-Satz]“

**C – Terrasse:**
„Isometric café terrace extension, {mood} style, {bistro / garden / lounge} seating, fits to the right side of a coffee shop building, solid #FF00FF background, [Stil-Satz]“

**D – Hero-Header (16:6, 1536x576):**
„Wide cinematic banner for the {area} screen of a coffee tycoon game: {Motiv}, dark anthracite and midnight blue mood, gold highlights, left third calm for overlay text, [Stil-Satz]“

**E – Icons (1:1, 512 px):**
„Set-consistent game icon of {Motiv}, flat-painted with soft gold rim light, centered, solid #FF00FF background, [Stil-Satz]“

**F – Porträts:**
„Bust portrait of a {age} {role} executive, {character}, dark slate studio background, gold rim light, [Stil-Satz]“

**G – Daten (Text):**
„Erstelle als gültiges JSON-Array {N} Wochen-Events für ein Kaffee-Tycoon-Spiel. Felder: id, title, text (max 140 Zeichen, Deutsch), region, weight (1–5), effects {cash, demand, beanPrice, reputation} als kleine Prozentwerte. Keine Wiederholungen, realistische Kaffeebranche.“

**H – Rechenmodul:**
„Schreibe eine reine TypeScript-Datei commodities.ts ohne Abhängigkeiten: futurePrice(spot, weeks, volatility), optionPremium(type, spot, strike, weeks, volatility) nach vereinfachtem Black-Scholes, settleOption(...). Mit Vitest-Tests.“

Dateinamen exakt nach meiner Checkliste aus Phase 0 vergeben, als ZIP hochladen.

## Technische Details
- Neue Engine-Teile: commodities.ts (Futures/Optionen), Erweiterung tycoon-Wochenablauf über bestehende Kette, ein Buchungseintrag pro Woche.
- regionalThemes.ts: Stadt → Region → Bildsatz; Ersatzbild bei Ladefehler.
- Bildaufbereitung: Magenta entfernen inkl. Farbrand, WebP, trimmen; Innenraum-Farben über eine farbige Ebene.
- Navigation in index.tsx neu, alte Zweige gelöscht; Spielstand-Version +1 mit Migration.
- Tests: bestehende Tests grün halten, neue Tests für Futures, Optionen, Migration und 52-Wochen-Lauf.

## Was du nach Freigabe tun musst
1. Ich setze Phase 0 um und gebe dir die Dateiliste.
2. Du erzeugst die Bilder mit den Prompts und lädst sie gesammelt hoch.
3. Ich baue Phase 1, 2, 4 und 5 und die Bilder ein.
