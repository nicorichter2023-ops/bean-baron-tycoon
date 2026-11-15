# Plan: Karte, Kontextfenster, Sterne, Café-Editor und fehlende Anforderungen

## A. Deine aktuellen Punkte
1. **Karte randlos**: Karte füllt die volle Breite im natürlichen Seitenverhältnis, kein Strecken. Start auf Breite eingepasst, Zoom per Fingern.
2. **Kontextfenster**: Antippen von „Frei/Lease/Sale“ öffnet sofort ein Fenster von unten mit Miete, Kaufpreis, Passanten, Viertel-Bonus und Knöpfen Kiosk/Café/Flagship eröffnen. Antippen eines Rivalen öffnet sein Profil (Preis, Qualität, Aggressivität, Übernahme). Gilt auch für die Fokus-Tasten „Frei“ und „Rivalen“.
3. **Sterne lesbar**: Kräftiges Gold mit dunkler Kontur, leere Sterne dunkelgrau; geprüft auf hellen und dunklen Flächen.
4. **Café-Editor neu**: Basis ist pro Ausbaustufe eine echte gemalte Raumansicht (Stand, Wand-Geschäft/Kiosk, kleines Café, Kaffeebar, Bistro, Rösterei-Café, Flagship). Pro Stufe 3 Stilvarianten (z. B. Holz, Industrie, Modern), die sich mit Wand/Boden/Licht im Editor ändern. Maschine, Mühle, Vitrine, Sitzplätze werden an festen, passenden Plätzen pro Raum eingesetzt statt frei schwebend.
5. **Alte Grafiken ersetzen**: Alte Vor-Update-Bilder (Szenen, Fassaden, Icons) werden gesucht und durch den einheitlichen gemalten Stil ersetzt oder entfernt.

## B. Weitere fehlende Anforderungen aus unserem Verlauf
- Schnellaktionen direkt in der Filialliste (Upgrade, Preis, Personal) – zugesagt, nicht gebaut.
- Schubladen von unten statt langer Seiten – zugesagt, nicht gebaut.
- Erfolgsmeldungen/Rang-Fenster: im Spiel noch nicht nachgetestet.
- Café-Größe von Maschine/Mühle/Sitzplätzen nicht optisch geprüft.
- Balance-Feintuning (Rang 3 nach 15–25, Rang 6 nach 80–120, Rang 10 nach 250+ Wochen).
- 44px-Touchziele und Scrollmenge auf 360×630 erneut prüfen.
- Projektnotizen (Roadmap, technische Regeln) nachtragen.

## C. Grafiken (credit-effizient, gebündelt)
- 7 Raumansichten × 3 Stile = 21 Bilder, als Bögen erzeugt (wenige Aufrufe).
- 1 Bogen mit freigestellten Möbel-/Maschinen-Teilen im selben Stil.
- Ersatz für alte Fassaden/Icons nur, wo die Suche alte Bilder findet.

## D. Prüfung
- Test auf Handygröße 360×630: Karte, Lease-Fenster, Rivalen-Fenster, Editor-Wechsel, Woche abschließen mit Erfolg.
- Bestehende Tests laufen lassen; neue Tests für Kontextfenster-Daten (Miete/Preis) und Raumwahl je Stufe.

## Technische Details
- styles.css: `.nyc-photo-viewport` ohne feste Höhe; `.ci-stars` mit festen Goldwerten.
- PhotoCityMap: Pin-Klick setzt ausgewählten Standort, Drawer (shadcn) mit Aktionen aus world.ts.
- CafeRoom: Raumbild nach Stufe+Stil aus sheetArt-Index, Ausstattung an Ankerpunkten je Raum.
