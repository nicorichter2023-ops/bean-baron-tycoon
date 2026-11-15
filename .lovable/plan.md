# Coffee Empire – Restumsetzung (alles Offene in einem Durchgang)

## Was laut Unterhaltung noch fehlt
1. **Städtekarten im New-York-Stil**: Bisher hat nur New York eine gemalte Karte mit Pins auf Häuserblöcken. Die anderen 19 Städte nutzen noch das alte Isometrie-Raster.
2. **Grafiken**: Es fehlen die Stadtkarten (19), die Getränke und Snacks, Symbole für die Forschung, einheitliche Porträts für Team, Rivalen und Startups (die alten Avatare passen nicht zusammen) sowie ein Flughafen-Bild.
3. **Inhalte**: Es fehlen 12 Getränke und 10 Snacks, Erfahrung für Baristas, 32 Forschungsziele, 5 Stufen in jedem der 5 Ausstattungsbereiche und eine Konkurrenz, die mit der Zeit stärker wird.
4. **Bedienung zu umständlich**: zu viel Scrollen, zu viele Tipps bis zur Aktion, Upgrades sind schwer zu finden.
5. **Balance**: Die 300-Wochen-Prüfung mit drei Spielweisen ist noch nicht gemacht.

## Grafiken (sparsam gebündelt, ca. 27 Bilder)
- **19 Stadtkarten**, eine pro Stadt, im gleichen gemalten Stil wie New York. Sie entstehen durch Bearbeitung der New-York-Karte, damit der Stil gleich bleibt, und zeigen echte Wahrzeichen und Geografie wie Themse, Eiffelturm, Shibuya oder Golden Gate.
- **Ein Flughafen-Bild** für den Reisebildschirm.
- **Fünf Bildbögen mit je 16 Bildern:**
  - Getränke: 12 Getränke und 4 Becher oder Größen
  - Snacks: 10 Snacks und 6 Vitrinen-Deko
  - Forschung: zwei Bögen für 32 Symbole
  - Porträts: einheitliche Porträts für 4 Rivalen-Chefs, C-Suite, Baristas und Startup-Gründer
- Alles wird in einem Durchgang erstellt, zugeschnitten und eingebaut. Es werden keine Bilder nachträglich neu gemacht.
- Geschätzt kostet das etwa 27 bis 35 Credits. Du hast rund 189 Credits und ein Budget von 280 Credits; das bleibt im Rahmen.

## Karten aller Städte
- Gleiches Bedienschema wie New York: Wischen und Zoomen, Schilder FOR LEASE und FOR SALE, eigene Pins und Rivalen-Pins, Flughafen-Pin.
- 30 Standorte pro Stadt liegen auf festgelegten Häuserblöcken der jeweiligen Karte, nicht mehr in einem gleichmäßigen Raster.
- Ein Tipp auf einen Standort öffnet den Inspektor mit Nachbarschaft und den Optionen Mieten und Kaufen. Bei einer eigenen Filiale öffnet sich direkt das Café.

## Bedienung vereinfachen
- **Café-Ansicht**: oben das Bild, darunter 4 große Reiter (Service, Produkt, Ausstattung, Finanzen) ohne langes Scrollen. Der nächste sinnvolle Ausbau steht als großer Knopf ganz oben.
- **Schnellaktionen**: In der Filialliste kannst du „Ausbauen“, „Personal“ und „Preis“ direkt antippen.
- **Benachrichtigung**: Ein Punkt an den Reitern zeigt, wo etwas zu tun ist, zum Beispiel ein Ausbau ist möglich oder ein Ziel ist fast erreicht.
- **Speisekarte**: Getränke und Snacks schaltest du mit Bild und einem Tipp an oder aus.

## Inhalte und Spielablauf
- **12 Getränke und 10 Snacks** mit Preis, Marge, Beliebtheit je Kundschaft und Freischaltung nach Rang oder Forschung.
- **Baristas sammeln Erfahrung** (Stufe 1–5). Das verbessert Service und Bewertung, macht aber Gehaltswünsche.
- **32 Forschungsziele** in 4 Bereichen: Röstung, Getränke, Abläufe, Marke. Sie bauen aufeinander auf und schalten Produkte und Ausstattung frei.
- **5 Stufen pro Ausstattung** (Maschine, Mühle, Sitzplätze, Vitrine, Terrasse), sichtbar im Café-Bild über die vorhandenen Bildbögen.
- **Die Konkurrenz wächst**: Rivalen eröffnen mit der Zeit neue Standorte, starten Preisaktionen und greifen gute Lagen ab. Ihre Stärke steigt mit deinem Rang.

## Icons, Upgrades und eigene Café-Gestaltung
- **Einheitliche Symbole**: Alle bisherigen Symbole für Anzeige, Ausstattung, Ränge und Status werden in einem gemeinsamen Stil neu gezeichnet. Dafür gibt es 3 neue Bildbögen mit je 16 Bildern; die alten, uneinheitlichen Symbole fliegen raus.
- **Upgrades sichtbar im Café**: Jede Ausstattungsstufe ist ein eigenes Bild, das im Café-Bild an seinem festen Platz liegt (Theke, Mühle, Sitzbereich, Vitrine, Terrasse). Jeder Kauf verändert das Café sofort sichtbar.
- **Eigene Gestaltung pro Café** (rein optisch, ohne Kosten für den Spielablauf außer dem Kaufpreis):
  - Farbschema: 6 Varianten für Wände und Theke
  - Boden: Holz, Fliesen, Beton oder Marmor
  - Beleuchtung: warm, hell oder Neon
  - Pflanzen und Deko frei wählbar
  - Ladenschild und Name frei wählbar
- Ausgewählte Stile können die Atmosphäre-Bewertung leicht verbessern, wenn sie zur Spezialisierung des Cafés passen.
- **Zusätzliche Bilder**: 2 Bildbögen für Deko, Böden und Lampen. Damit steigt die Schätzung auf etwa 32 bis 42 Credits.

## Balance
- Eine Simulation über 300 Wochen mit drei Spielweisen: vorsichtig, ausgewogen und aggressiv.
- Zielwerte: Rang 3 nach 15–25 Wochen, Rang 6 nach 80–120 Wochen, Rang 10 nach mehr als 250 Wochen. Investitionen sollen sich in 8–40 Wochen bezahlt machen.
- Wo die Zielwerte nicht erreicht werden, werden die Zahlen angepasst und erneut geprüft.

## Abschluss
- Alle Tests und die Typprüfung sind grün. Danach spiele ich in Handygröße durch: eine Stadt wechseln, ein Café eröffnen, einen Ausbau machen und ein paar Wochen weiterspielen.
- Alte Spielstände werden übernommen.

## Technische Details
- Karten: `src/data/cityMaps.ts` (Stadt-ID → Bild und 30 Pin-Koordinaten plus Flughafen); `NewYorkPhotoMap` wird generalisiert zu `PhotoCityMap`, CityMap nutzt sie für alle Städte, das Isometrie-Raster bleibt als Rückfall bei Bildfehlern.
- Bilder: Karten per edit_image auf Basis von `src/assets/nyc-city-map.jpg` (1088×1920) nach `src/assets/maps/<city>.jpg`; Bögen 4×4 nach `public/assets/sheets/{drinks,snacks,research-a,research-b,portraits}/1..16.webp`, Index-Maps in `sheetArt.ts`.
- Neue reine Module: `src/engine/menu.ts` (Produkte, Effekt auf Umsatz/Marge), `src/engine/staff.ts` (XP), `src/engine/research.ts` (32 Knoten, Graph), Rivalen-Eskalation in `world.ts`; Ausstattung 5 Stufen in `equipment.ts` mit Migration (0–2 → passende neue Stufen, nie herabgestuft).
- Alles wirkt über `processProgressWeek`; Schema 7 mit Migration v6→v7.
- Gestaltung: `src/engine/decor.ts` (rein; Farbschema, Boden, Licht, Deko, Schild je Filiale, persistiert), CafeCutaway setzt Ausstattungs-Layer an feste Ankerpunkte; Symbole über `sheetArt.ts` auf neue Bögen `icons-a/b/c`, `decor-a/b` umgestellt.
- Tests: decor, menu, staff, research, equipment-Migration, Rivalen, `balance.test.ts` (300 Wochen, 3 Bots).
