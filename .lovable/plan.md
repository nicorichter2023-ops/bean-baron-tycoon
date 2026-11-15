# Coffee Empire: Mehr Inhalt und längerer Fortschritt

## Ziel
Mehr Stufen und mehr Freischaltungen, damit das Spiel nicht nach wenigen Stunden fertig ist. Spielstände bleiben erhalten (alte Spielstände werden automatisch übernommen).

## 1. Filialen: von 3 auf 7 Stufen
Wagen, Kiosk, Kaffeebar, Kiez-Café, Bistro, Rösterei-Café, Flagship. Jede Stufe hat eigene Kosten, Platz für Gäste, Personal und Ausstattung. Das Aussehen der Filiale wechselt bei jeder Stufe, beim Kiosk bleibt es schlicht.

## 2. Ausstattung: 5 Bereiche mit je 5 Stufen
Espressomaschine, Mühle, Vitrine, Sitzplätze/Ambiente und Terrasse. Die höchsten Stufen werden erst durch Forschung oder einen höheren Firmenrang freigeschaltet.

## 3. Angebot
- 12 Getränke und 10 Snacks, die nach und nach freigeschaltet werden.
- Preise pro Filiale einstellbar. Zu hohe Preise kosten Gäste.
- Bohnen pro Filiale auswählbar: Hausmischung oder Single Origin.

## 4. Personal mit Erfahrung
Baristas haben drei Werte: Tempo, Freundlichkeit und Latte-Art. Sie sammeln jede Woche Erfahrung, steigen bis Stufe 10 auf und erwarten dann mehr Gehalt. Optional gibt es Schulungen.

## 5. Firmenrang (Meta-Fortschritt)
10 Ränge, vom Straßenhändler bis zum Kaffee-Imperium. Ein Rang gilt erst, wenn mehrere Ziele erreicht sind: Umsatz, Anzahl der Städte, Bewertung und Firmenwert. Jeder Rang schaltet Städte, Ausstattung, Produkte und Führungskräfte frei. Außerdem gibt es 40 Erfolge mit kleinen Boni.

## 6. Forschung erweitern
Statt 16 gibt es 32 Forschungsziele in 4 Bereichen mit je 8 Stufen. Die Forschung dauert länger und kostet mehr. Die Führungskraft für Technik verkürzt die Forschungszeit.

## 7. Städte freischalten
Zu Beginn sind 3 Städte offen. Weitere Städte öffnen sich über Firmenrang und Flugverbindungen. Die Konkurrenz wird mit der Zeit stärker.

## 8. Bedienung
Eine neue Übersicht „Fortschritt“ zeigt den nächsten Rang, die offenen Ziele und die nächsten Freischaltungen. Die Bereiche werden mit Reitern umgeschaltet statt lang gescrollt.

## 9. Ereignisse seltener und besser
Bisher kommt jede Woche ein Ereignis, das man bestätigen muss. Künftig gilt:
- Im Durchschnitt gibt es etwa alle 4 bis 6 Wochen ein Ereignis, danach mindestens 3 ruhige Wochen.
- Kleine Ereignisse erscheinen nur als kurze Meldung im Protokoll und halten das Spiel nicht an. Nur wichtige Entscheidungen öffnen ein Fenster.
- Ereignisse passen zum Spielstand, zum Beispiel zu Stadt, Firmenrang und Jahreszeit. Ein Ereignis wiederholt sich frühestens nach 20 Wochen.
- In den Einstellungen kann man die Häufigkeit wählen: selten, normal oder oft.

## 10. Grafiken und Assets
- Für die 7 Filialstufen gibt es eigene Innenansichten im bestehenden Stil. Die vorhandenen Bilder für Kiosk, Kiez-Café, Bistro und Flagship werden weiterverwendet, neu kommen Wagen, Kaffeebar und Rösterei-Café.
- Die Fassaden auf der Karte bekommen je Stufe ein eigenes Aussehen.
- Für jedes der 5 Ausstattungsbereiche wird jede Stufe sichtbar. Dafür entstehen bis zu 3 Bildbögen mit Maschinen, Mühlen, Vitrinen, Möbeln und Terrassen, jeweils 4×4 Kacheln.
- Neue Symbole für Produkte, Ränge und Erfolge kommen als Bildbögen dazu.
- Kosten: etwa 8 bis 10 neue Bilder. Vorher prüfe ich das verbleibende Budget.

## Reihenfolge
1. Regeln und Spielstand-Übernahme: Stufen, Ränge, Freischaltungen
2. Ausstattung, Angebot und Personal
3. Forschung und Städte
4. Ereignisse überarbeiten
5. Grafiken erstellen und einbinden
6. Bedienung und Fortschrittsübersicht
7. Tests und Prüfung auf dem Handy

## Technische Details
- Neue reine Module in src/engine/: progression.ts (Ränge, Erfolge, Freischaltungen), menu.ts (Produkte, Preiselastizität) und staff.ts (Erfahrung). Inhalte kommen nach src/data/progression.ts.
- Die Wochenwirkung läuft über processManagementWeek, damit Buchhaltung und Abrechnung stimmig bleiben.
- Das Spielstand-Schema bekommt eine neue Version. Alte Filialstufen 1/2/3 werden auf die neuen Stufen 2/4/7 abgebildet, vorhandene Ausstattung bleibt erhalten, und alle bisher besuchten Städte bleiben offen.
- Neue Tests für Rangbedingungen, Freischaltungen, Preiselastizität, Personal-Erfahrung und die Spielstand-Übernahme.
- Ereignisse: In engine.ts wird aktuell jede Woche ein pendingEvent gezogen. Künftig entscheidet eine deterministische Wahrscheinlichkeit plus Abklingzeit, ob überhaupt ein Ereignis kommt. Die Einstufung in klein und wichtig steht in den Daten. Die gewählte Häufigkeit wird im Spielstand gespeichert.
- Grafiken: Bildbögen werden nach public/assets/sheets/ geschnitten und nur über sheetArt.ts und visualAssets.ts eingebunden, jeweils mit Ersatzbild.
