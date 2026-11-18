# Coffee Empire 2.0 – automatische Restumsetzung

Ich arbeite die Schritte nacheinander ab, ohne zwischendurch nachzufragen. Ich halte nur an, wenn eine echte Entscheidung von dir nötig ist oder das Credit-Limit erreicht ist. Nach jedem Schritt laufen die Tests, die Prüfung im Handyformat und eine Sicherung.

## Reihenfolge

1. **Bildmängel beheben (kleiner Bildaufwand):** Gemalten Text („COFFEE HOUSE“, „DINER“) entfernen. Weißen Hintergrund bei Kiosk und Kiez-Café durchsichtig machen, ohne neue Bilder zu erzeugen.
2. **Engine-Abschluss:** Börse, Weltereignisse und Gäste an den echten Wochenablauf anschließen. Dazu ein gemeinsames Kassenbuch und ein Startkapital, das nach einem Jahr nicht über rund 160 Tsd € hinausschießt.
3. **Café-Editor mit 5 Ausbau-Bereichen:** Maschine, Theke/Vitrine, Möbel, Wände/Licht und Terrasse aus den Editor-Daten. Die alte Ausstattung fällt weg, jeder Kauf ist im Raum sichtbar.
4. **Vier Säulen und weniger Scrollen:** Navigation auf Stadt, Bohnen, Börse und Konzern verdichten. Doppelte Menüs entfallen, der Wochenknopf bleibt in der Mitte.
5. **Börse, VC/PE und Weltereignisse sichtbar machen:** Kurse, Portfolio, Finanzierungsrunden, Übernahmen und IPO. Dazu eine Nachrichtenleiste mit den Folgen jedes Ereignisses.
6. **Animierter Wochenabschluss:** Gäste, Umsatz, Kurse und Ereignisse als kurze Bildschirmfolge, die man auch überspringen kann.
7. **Simulations-Audit und Balancing:** Testläufe über 52 und 300 Wochen. Geld soll nie wertlos werden, es darf keine Endlos-Geld-Lücken geben, und die Mieten großer Standorte werden geprüft.
8. **Feinschliff:** Desktop- und Handy-Prüfung aller Säulen, PWA-Offline-Test, Aufgabenliste aktualisieren.

## Halte-Punkte (nur falls nötig)
- Wunschwerte für Mieten und Startkapital, falls das Audit sie infrage stellt.
- Neue Bilder, falls Nachbessern ohne neue Bilder nicht reicht. Davor frage ich dich wegen der Credits.

## Technisches
- Der Wochenablauf läuft über einen einzigen Einstiegspunkt mit `src/engine/v2` als Stufen. Der Spielstand bekommt eine neue Schema-Version, alte Spielstände werden verworfen.
- Die Editor-Daten aus `src/data/v2/editor.json` werden die einzige Quelle für die Ausstattung.
