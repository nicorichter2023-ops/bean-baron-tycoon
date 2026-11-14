# Coffee Empire – Masterprompt

Setze das bestehende Coffee-Empire-Spiel als mobiles, visuelles 2.5D/isometrisches Tycoon-Spiel um, inspiriert von Coffee Inc 2+ und Game Dev Tycoon, ohne deren Marken oder Oberfläche zu kopieren. Zielgerät: Galaxy S21 FE, Hochformat, installierbare Vollbild-PWA. Keine Landingpage und kein textlastiges Dashboard als Hauptansicht.

## Unveränderliche Grundlage
- Behalte `src/engine/engine.ts`, `types.ts`, `src/data/gameContent.json`, `processTurn()`, das LocalStorage-Savegame und schemaVersion unverändert. Keine Neuberechnung der Wirtschaft in der UI.
- Content ist verbindlich: 20 Städte, 20 Bohnen, 15 Aktiengesellschaften, 20 Startups und 60 Auswahlereignisse. Alle vorhandenen Aktionen, Freischaltungen und Fehlermeldungen bleiben wirksam.
- UI lebt in `src/game/`; Logik in `src/engine/`, Initialisierung und Inhalte in `src/data/`.

## Grafikstrategie und Budget
- Gesamtbudget maximal 280 Lovable-Credits inklusive bisheriger Arbeit. Keine garantierte Kostenzusage ohne belegte Abrechnung.
- Alle vorhandenen Uploads berücksichtigen: Gebäude, Wahrzeichen, Personen, Cafétechnik, Möbel, Rösterei, Lager, Fahrzeuge, Labor, Finanzen, VC, Farm, UI und Umgebung.
- Vorhandene Bilder priorisieren, keine neue Bild- oder Videogenerierung. Fehlende Motive erst gezielt später extern ergänzen.
- Szenen optimieren; Sprite-Sheets sauber ausschneiden, Beschriftungen nicht als Spiel-UI verwenden, weiße Hintergründe nur außen entfernen und Duplikate vermeiden. Unregelmäßige Raster gesondert behandeln, keine behaupteten Animationsframes aus unterschiedlichen Personen erzeugen.
- Binärdateien über Lovable Assets ausliefern. Bestehende öffentliche Gebäude/Wahrzeichen weiter nutzen. Sprites mit transparentem Hintergrund, statische Hintergründe als komprimierte Bilder; keine hunderten unnötigen Einzelanfragen.

## Spielansichten
Vier Haupttabs: Imperium, Weltkarte, Markt & B2B, Finanzen & M&A. Fester HUD mit Barvermögen, Firmenwert, Datum/Woche, Bohnenpreis und Nächste Woche. Szenen stehen im Mittelpunkt; Aktionen und Zahlen öffnen sich in kompakten Touch-Menüs.

### Imperium
- Interaktives Café mit Hotspots an Theke, Personal und Ausbau. Bestehende Filialen auswählen; Stadt, Stufe, Team, Kundenzahl und Wochenumsatz aus echtem GameState anzeigen.
- Terrasse als weiterer Café-Ort; keine erfundenen zusätzlichen Umsätze.
- Holding/Penthouse mit Beteiligungen, Startup-Pitches und Geschäftsübersicht. Vermögen und Firmenstufe aus dem echten Spielstand.
- Gebäude nach vier Biomen und drei Stufen: European, Modern Industrial, East Asian, Tropical; Kiosk, Café, Flagship.

### Weltkarte
- Gelieferte Weltkarte als verschiebbare/zoombare Ansicht; 20 auswählbare Stadtminiaturen und Stadtnamen, nicht bloß eine Liste.
- Stadt öffnet passendes Biom-Panorama und anklickbare Distrikt-/Grundstücksansicht.
- Freie Grundstücke zeigen Mietkosten, Konkurrenz, Laufkundschaft, erlaubte Stufen und Eröffnungskosten; belegte Grundstücke zeigen die Filiale und führen zur Verwaltung.
- Eröffnen und Ausbauen ausschließlich über bestehende Engine-Aktionen.

### Markt & B2B
- Rösterei als visualisierter Raum mit Maschinen, Lagerbestand und Kapazität.
- Hafen/Logistik und Rohstoffbörse als Spielorte. Bohnenauswahl, Preise, Einkauf, Lieferverträge und Wochenberichte aus dem echten State.
- Farmhintergrund für Herkunftsansicht; keine zusätzliche Farm-Simulation erfinden.

### Finanzen & M&A
- Chef-Büro/Trading-Floor: Schreibtisch öffnet Kreditverwaltung, Kurswand Aktienhandel, Verhandlungstisch M&A.
- Penthouse/Pitch-Lounge öffnet bestehende Startup-Finanzierung und Übernahmen.
- Verhandlungsraum visualisiert Deals; keine neue Verhandlungslogik, erfundene Erfolgschancen oder Freischaltungen.

## Feedback und Bedienung
- Mindestens 44×44 CSS-Pixel große Touch-Ziele, Safe-Areas, kein horizontales Überlaufen außer gezielt verschiebbarer Karte/Szene.
- „Nächste Woche“ ruft weiterhin processTurn auf und speichert unverändert. Pending Event blockiert weitere Runden bis zur Wahl.
- Wochenwechsel animiert Tageslicht/Status und zeigt tatsächlichen Umsatz beziehungsweise Ergebnis. Einzelne schwebende Cup-Umsätze dürfen nur echte Werte darstellen und niemals zusätzlich Geld gutschreiben.
- Dezente Bewegung, Dampf und Erfolgsfeedback; reduced-motion respektieren. Keine scheinbar funktionierenden Möbelkäufe, Wettermechanik oder Fahrzeuge ohne Engine-Unterstützung.
- Deutsche sichtbare Texte, aussagekräftige zugängliche Beschriftungen, bestätigtes Löschen des Spielstands.

## PWA und Prüfung
- Manifest, Icons und Service Worker für Installation und Offline-Wiederöffnung nach erster Nutzung. Service Worker nur für öffentliche Appdateien, niemals private Daten oder fremde API-Antworten.
- Vorhandene Engine-Tests ausführen. Mobil und Desktop: Rundenwechsel, Ereigniswahl, Filialeröffnung, Personal, Kredit, Karte/Distrikte, Speicherstand nach Reload und Bilddarstellung prüfen. Freigeschaltete Wirtschaftsfunktionen zusätzlich mit kontrolliertem Testspielstand testen, nicht den Nutzerstand überschreiben.
- Keine Kosten-, Geräteinstallations- oder Vollständigkeitsbehauptungen ohne Prüfung. Offen benennen, was von zukünftigen Grafiken oder neuen Engine-Funktionen abhängt.