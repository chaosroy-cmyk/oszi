# Hardwaretest V13.7 am VDS1022I – Prüfliste

Die neuen Gerätefunktionen sind nur gegen eine Simulation getestet. Diese Liste führt in etwa
15 Minuten durch den ersten Versuch am echten Gerät. Als Signal reicht der **Rechteck-Testausgang
des Oszis** (ca. 1 kHz, ca. 5 V) oder ein LIN-Bus.

Vorbereitung: `start-live.cmd` (oder `python bridge.py`), App öffnen, Kopplungscode eingeben, verbinden.
Die Zeilen „Trigger +“, „Gerät“ und „Langzeit“ müssen dann bedienbar sein. Wenn nicht: Es läuft noch
eine alte `bridge.py`.

| Nr. | Schritt | Erwartung | Wenn nicht |
|---|---|---|---|
| 1 | Verbinden, Testsignal an CH1, 1:1, 2 V/div, 200 µs/div | stehendes Rechteck wie bisher | Bridge-Fenster: Fehlermeldung notieren |
| 2 | Messwertzeile ansehen | „Zähler“ zeigt etwa 1 kHz | Zähler fehlt: Triggerpegel in die Signalmitte stellen |
| 3 | Position CH1 auf −3 div, Messbereich 1 V/div | Signal vollständig sichtbar, nicht abgeschnitten | abgeschnitten: Position zurück auf 0, melden |
| 4 | Modus **Normal**, Tastkopf abnehmen | Bild bleibt stehen (kein neues Bild) | läuft weiter: melden |
| 5 | Tastkopf wieder anlegen | Bild läuft wieder | – |
| 6 | Im Modus Normal Zeitbasis ändern, während kein Signal anliegt | Einstellung wird übernommen, App reagiert | App hängt: Bridge-Fenster ansehen |
| 7 | Art **Pulsbreite**, Flanke ↑, „länger als“, Zeit 0,3 ms | triggert (Puls ist 0,5 ms breit) | – |
| 8 | Zeit auf 0,7 ms | triggert nicht mehr (Normal) | triggert trotzdem: melden |
| 9 | **Spitzenwert** an bei 50 ms/div | Rechteck erscheint als gefülltes Band | – |
| 10 | **Autoset** | sinnvolles Bild, Meldung „Autoset übernommen“ | „Autoset nicht möglich“: melden |
| 11 | **Langzeit** 2 s bei 50 kS/s, „Lückenlos aufnehmen“ | nach ca. 2 s gestopptes Bild, „fertig: 100000 Punkte“ | „Daten gingen verloren“: 20 kS/s probieren |
| 12 | In die Aufnahme zoomen (Zeitbasis kleiner, „Ausschnitt“ schieben) | Rechteck ohne Lücken oder Sprünge | Sprünge: Stelle als PNG speichern, melden |
| 13 | Zyklus-Messung an | etwa 2000 Zyklen, keine oder kaum Ausreißer | viele Ausreißer: Aufnahme hat Lücken |
| 14 | Langzeit 100 kS/s, 2 s | wie 11 | scheitert: Grenze des Rechners/USB – 50 kS/s nutzen |
| 15 | „ab Trigger“ mit Vorlauf 0,5 s, Tastkopf erst danach anlegen | wartet, startet beim Anlegen, 0,5 s Vorlauf sichtbar | – |
| 16 | Während „wartet auf Trigger“ **Stop** drücken | „abgebrochen“, App bedienbar | hängt: melden |
| 17 | Am LIN-Bus: Bus LIN wählen, **Voreinstellung LIN-Break**, Run | Frame steht stabil am linken Bildrand, Decoder zeigt IDs | kein Bild: Pegel (halbe Bordspannung) und Zeit prüfen |
| 18 | Externer Trigger (nur wenn Signal an der Multi-Buchse) | triggert auf das externe Signal | – |

Bitte bei Abweichungen den Text aus dem Bridge-Fenster (letzte 20 Zeilen) und die Nummer des Schritts
notieren. Die Kalibrierung des Geräts wird von keiner dieser Funktionen verändert.
