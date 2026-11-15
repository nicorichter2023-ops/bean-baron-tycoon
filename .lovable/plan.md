# Coffee Empire: gebündelte Fehlerkorrektur und stimmige Gestaltung

## 1. Bedienung zuerst
- Überlagerte Schaltflächen, Symbole, Szenenbeschriftungen und Fenster in Karte, Café und Terrasse entflechten. Wichtige Aktionen in einer eigenen Leiste statt über dem Bild anordnen.
- Die Screenshots zeigen konkret: Ausstattungskarten verdecken Umsatz/Qualität, die Überschrift „Ausstattung“ kollidiert mit Kennzahlen und „Nächste Woche“ liegt über dem Filialbereich. Diese Bereiche getrennt anordnen und den Wochenknopf mit reserviertem Platz oberhalb der unteren Navigation verankern.
- Touchflächen mindestens 44 × 44 Pixel, auch bei großer Schrift. Schließen und Weiter bleiben erreichbar; dekorative Ebenen fangen keine Berührungen ab.
- Erfolge als kompakte Übersicht mit letzten zwei freigeschalteten Erfolgen und einklappbarer Gesamtliste zeigen. Nach dem Wochenabschluss dürfen Meldungen keine Aktionen verdecken.

## 2. Karten und bestehende Filialen
- Zoomen und Verschieben auf die tatsächlichen Bildgrenzen begrenzen. Kein grauer Rand, keine Bildverzerrung, auch nach Fokus-Sprüngen und Zurücksetzen.
- Eigene Standorte aus älteren Spielständen sichtbar machen. Bestehende Miet-, Eigentums- und Standortwerte erhalten; keine pauschale Zuweisung an möglicherweise belegte neue Gebäude.
- „Meine“ führt zur passenden Filiale; „Frei“/Miet-Pins und „Rivalen“ öffnen das zugehörige Kontextfenster. Flughafen-Schnellwahl öffnet die Reiseansicht statt nur das Bild zu verschieben.

## 3. Terrasse als echter Teil der Filiale
- Die alte Terrassenkulisse und unpassende Terrassen-Einzelbilder durch stimmige gemalte Außenbereiche ersetzen: klein und einfach für frühe Geschäfte, größer und hochwertiger bei späteren Stufen.
- Terrassenansicht, Gestaltungswahl und Gestaltungsboni nur anbieten, wenn die ausgewählte Filiale tatsächlich eine Terrasse besitzt. Ohne Terrasse keine aktive Terrassenansicht und keine Terrassenboni.
- Den Erwerb beziehungsweise Ausbau einer Terrasse getrennt von ihrer Gestaltung darstellen; nicht jedes große Geschäft allein wegen seiner Stufe als Terrassenbesitzer behandeln.
- Zusammenhängende Gestaltungsvarianten: Bistro, begrünter Außenbereich und Lounge; Tische/Stühle, Beschattung und Pflanzen verändern den erkennbaren Außenbereich statt frei schwebende Bilder zu erzeugen.
- Sonderboni als Vorschlag: Bistro +2 % Terrassenumsatz, Garten +3 %, Lounge +4 %. Nur eine Stilvariante zählt gleichzeitig; der Bonus gilt nur auf den Terrassenanteil, nicht pauschal auf den ganzen Laden. Vor Kauf Preis, Nutzen und mögliche laufende Kosten zeigen.
- Bereits bezahlte Terrassen und höhere Ausbaustufen bleiben beim Laden älterer Spielstände erhalten.

## 4. Café und alte Grafiken
- Stufenfolge vom kleinen Stand über Wandgeschäft/Kiez-Café bis zur großen Filiale erhalten. Keine Flagship-Einrichtung im Kiosk.
- Ziel ist ein vollständiges, erkennbares und belebtes Café pro Stufe, angelehnt an Coffee Inc 2: Verkaufsfläche, Theke, Geräte und passende Sitzbereiche bilden eine zusammenhängende Szene. Personal hinter der Theke und Gäste an plausiblen Plätzen zeigen; keine Passanten oder Fahrzeuge auf den Stadtkarten ergänzen.
- Den bisherigen Ansatz frei aufgesetzter Bilder ersetzen: gleiche Perspektive, Licht, Schatten, Größenverhältnisse und verdeckte Flächen für alle austauschbaren Teile. Maschinen stehen auf der Theke, Stühle am Tisch; keine schwebenden Geräte oder Miniaturtexte aus alten Grafikbögen.
- Gestaltung als zusammenhängende Ladenvarianten umsetzen; Wand, Boden, Licht und Ausstattung müssen zur Perspektive und zur verfügbaren Fläche passen. Nicht passende Optionen bei kleinen Ständen ausblenden. Farbwahl verändert gezielt echte Ladenflächen statt rechteckige Farbflächen über das Bild zu legen.
- „Gestalten“ bleibt in jeder geöffneten Café-Ansicht unmittelbar erreichbar, unabhängig vom ausgewählten Bereich. Der Editor zeigt das vollständige Café mit sofortiger Vorschau und klaren Bereichen für Farben, Materialien, Ausstattung und – bei Besitz – Terrasse. Änderungen erst beim Bestätigen bezahlen; Abbrechen stellt den bisherigen Zustand wieder her.
- Ausstattungskauf und Editor auf einen gemeinsamen sichtbaren Katalog vereinheitlichen: dieselben Namen, Modelle, Stufen und Kaufzustände. Das gekaufte Modell muss anschließend im Café erscheinen; kein zweiter widersprüchlicher Upgrade-Weg.
- Alte Grafiken in Filialliste, Eröffnungsansicht, Ortswahl und Ausstattung mitprüfen und durch dieselbe aktuelle Stufenfamilie ersetzen.
- Sternebewertungen mit dunkler Kontur beziehungsweise kontrastreichem Untergrund und gut sichtbaren goldenen gefüllten Sternen zeigen.
- Fehlende Grafiken gebündelt erstellen und gemeinsam einbauen; vorhandene passende Bilder wiederverwenden. Keine Zusicherung des verbleibenden Budgets ohne belegte Kosten.

## Technische Umsetzung
- Terrassenbesitz, Gestaltungswahl und Bonusberechnung zentral in der bestehenden reinen Café-Engine verwalten; Oberfläche darf keine Wirtschaftsregeln selbst berechnen.
- Schema-Version und Migration erweitern, soweit neue persistierte Terrassendaten nötig sind. Abgleich mit bereits gespeichertem Terrassenlevel; gekaufte Ausstattung nicht zurücksetzen.
- Bonus in den bestehenden Wochenablauf und dieselbe Buchungszeile integrieren, ohne doppelte Kosten oder doppelte Umsatzboni. Konkrete Tests für Besitzprüfung, Stilwechsel, Bonusbegrenzung und Migration hinzufügen.
- Karten-Begrenzungen aus den wirklichen Bild-/Ansichtsmaßen ableiten. Alte Standorte explizit auflösen, ohne Eigentum oder Rivalen zu überschreiben.
- Bildzuordnung zentral halten; Gestaltung und Stufe wählen passende Szenen und räumlich passende Ausstattung.
- Die bisherigen Ausstattungsaktionen und den Café-Katalog vor der Zusammenführung auf unterschiedliche Preise und Effekte abgleichen. Bestehende Werte und bezahlte Upgrades erhalten; gemeinsame Auswahl und eindeutige Zuordnung statt stiller Neuberechnung oder Doppelkäufe.
- Für die Grafikproduktion eine gemeinsame Vorlage je Stufe mit festgelegter Perspektive, Licht und Austauschflächen verwenden. Zusammenpassende Teile und Stilvarianten gebündelt erstellen; keine Neugenerierung eines ganzen Cafés für jede mögliche Kombination. Jede Kombination muss dennoch ein geschlossenes Gesamtbild ergeben.
- Editor-Vorschau getrennt vom gespeicherten Zustand halten; Bestätigung über reine Engine-Aktionen mit einmaliger Kostenbuchung, Abbrechen ohne Kosten. Sichtbare Gäste bleiben Präsentation und verändern keine Wirtschaftswerte.

## Prüfung vor Abschluss
- Auf Galaxy-S21-FE-Größe sowie breiter Ansicht testen: echte Klicks und Wischbewegungen, keine künstlich ausgelösten Klick-Ereignisse als Ersatz.
- Alten Berlin-Spielstand prüfen: Filiale auf der Karte finden, öffnen, Gestaltung ändern, speichern und neu laden.
- Je eine Filiale ohne und mit Terrasse prüfen: Auswahl korrekt, Kauf/Gestaltung sichtbar, Bonus nach einer Woche im Bericht nachvollziehbar und nach Neuladen erhalten.
- Kartenränder bei minimalem/maximalem Zoom sowie Fokus-Sprüngen prüfen; Kontextfenster schließen und wieder öffnen.
- Woche mit Erfolg und Rangaufstieg abschließen; Weiter muss erreichbar bleiben.
- Alle sieben Ladenstufen ansehen, Farb-/Materialwahl und mehrere Ausstattungskombinationen prüfen: vollständige Szene, passende Perspektive, keine schwebenden Teile. Ausstattung einmal über die Kaufansicht ändern und im Editor sowie nach Neuladen dasselbe Modell bestätigen.
- „Gestalten“ aus jedem Café-Bereich öffnen; Vorschau ändern und abbrechen (kein Geldverlust), erneut ändern und bestätigen (genau eine Abbuchung).

## Abgrenzung
Die Screenshots belegen widersprüchliche Ausstattungsbilder und mehrere überlagerte Bereiche; der Plan umfasst deshalb die Zusammenführung der Kauf-/Gestaltungsansichten statt bloßer Bildkorrekturen. Das langfristige Rang-Balance-Feintuning bleibt getrennt von diesem Fehlerpaket. Dies ist der überarbeitete Plan, noch keine umgesetzte Korrektur.