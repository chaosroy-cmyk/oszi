# V13.7 – Gerätefunktionen des VDS1022I über die Bridge (15. November 2026)

Die Bridge nutzt jetzt alles, was der offene Treiber (florentbr/OWON-VDS1022, Modul `vds1022`) dokumentiert. Bedienung im Live-Tab unter „Bedienung“ (Zeilen „Trigger +“, „Gerät“, „Langzeit“). Die App schaltet die Elemente nur frei, wenn die verbundene Bridge die Funktionen ankündigt; eine ältere Bridge läuft unverändert weiter.

- **Lückenlose Langzeitaufnahme** (Roll-Modus des Treibers, laut Treiber bis etwa 100 kS/s): bis 262 144 Punkte je Kanal, z. B. 5 s bei 50 kS/s oder 26 s bei 10 kS/s – statt 5 000 Punkten. Sofort oder ab Trigger mit Vorlauf. Die Aufnahme erscheint gestoppt in voller Länge; Zeitzoom, Decoder, Zyklus-Messung, Bit-Monitor, Bibliothek und CSV arbeiten darauf.
- **Trigger:** Pulsbreite und Flankensteilheit (länger/gleich/kürzer als), Holdoff, Modus Normal (nur getriggerte Bilder; Single wartet auf das Ereignis), externer Trigger an der Multi-Buchse. **Voreinstellung „LIN-Break“** (Low länger als 11 Bitzeiten) stellt den LIN-Frame stabil an den Bildanfang.
- **Spitzenwert-Erfassung (Peak)**, **Autoset** (Messbereich und Zeitbasis vom Gerät, Triggerpegel auf Signalmitte), **Frequenzzähler des Geräts** in der Messwertzeile.
- **Eingangsfenster folgt der Position am Schirm:** Wird die Nulllinie verschoben, verschiebt die Bridge das Messfenster des Geräts mit. Ein einseitiges Signal (z. B. 0–14 V) nutzt den 8-Bit-Wandler damit besser aus (kleinerer Messbereich möglich).
- **Zeitbasen 5, 10 und 20 s/div** (Roll-Modus des Geräts).
- Bridge: blockierende Treiberaufrufe (Warten auf Trigger, lange Aufnahme) werden über `stop()` des Treibers sauber abgebrochen; gestoppt werden keine Bilder mehr abgeholt. Der Treiber schaltet in den Alternate-Trigger, wenn `set_trigger` zweimal direkt hintereinander aufgerufen wird – die Bridge hält deshalb immer die Reihenfolge Kanäle → Abtastung → Trigger ein.
- **Bewusst nicht angeboten:** Kalibrieren und alles, was in den Gerätespeicher schreibt (Werks-Kalibrierdaten). Das Protokoll kennt dafür keinen Befehl; ein Test stellt sicher, dass der Schreibbefehl nie gesendet wird.
- Tests: 6 neue Bridge-Tests ohne Treiber, 14 Tests der Bridge gegen den **echten Treiber-Code mit simuliertem USB-Gerät** (`tests/test_bridge_driver.py`, übersprungen, wenn der Treiber nicht installiert ist), ein neuer Browser-Test über die ganze Kette.

**Nicht erfolgt: Test am echten VDS1022I.** Die Simulation bildet nur nach, was der Treiber-Quelltext beschreibt. Prüfliste für den ersten Versuch: `docs/HARDWARETEST-V13.7.md`.

# V13.6.2 – Korrekturen nach Durchsicht (15. November 2026)

- **Bit-Monitor, Fehler behoben:** Wer eine Taste mehrmals drückte und losließ, bekam das Bit ab dem dritten Mal als „laufend“ ausgeblendet. Jetzt gilt ein Bit nur noch als laufend, wenn es sich innerhalb einer Aufnahme ändert (in mindestens zwei Aufnahmen), wenn sein Byte/Halbbyte als Zähler weiterzählt oder wenn es schon vor dem Merken der Referenz oft gewechselt hat. „Referenz löschen“ setzt auch das Gelernte zurück.
- **Bit-Monitor:** SENT-Botschaften bilden eine gemeinsame Zeile (vorher eine Zeile je Datenwert, damit unbrauchbar), Anzeige in 4-Bit-Nibbles. Decodierung an CH2 füttert den Monitor jetzt zuverlässig. Unbekannte Werte werden nicht als 0 verglichen.
- **CAN „Signal: automatisch“** erkennt an einer Einzelleitung jetzt CAN-H oder CAN-L (vorher wurde immer CAN-H angenommen; CAN-L ergab „keine Frames“). Die erkannte Leitung steht als Hinweis über der Tabelle.
- **Beispielsignal/Simulator:** V/div und Position von CH1 werden beim Verlassen der Wiedergabe wiederhergestellt.
- `SHA256SUMS` passte seit der Test-Korrektur vom 31.10. nicht mehr zu `tests/browser.test.cjs` – neu erzeugt.
- Nachgeprüft: CRC-15/CAN-Prüfwert 0x059E (Polynom 0x4599) gegen öffentliche Kataloge; ISO-11898-2-Werte dominant 1,5–3,0 V und Empfängerschwellen 0,5/0,9 V gegen Hersteller-Datenblätter. Nicht belegt bleibt das rezessive Sender-Fenster −0,5…+0,05 V (Normtext kostenpflichtig); Abweichungen dort sind deshalb nur Hinweise.
- 4 neue Node-Tests, Browser-Tests erweitert.

# V13.6.1 – Bit-Monitor und LIN-Bauteil-Simulator (31. Oktober 2026)

- **Bit-Monitor** in der Seriellen Entschlüsselung (alle Busse): Referenz merken, Taste/Schalter betätigen, neu aufnehmen – geänderte Bits werden rot markiert, mit Bedeutung, soweit bekannt. Bits, die sich laufend ändern (Alive-Zähler, Prüfsummen), werden gepunktet markiert und nicht als „Taste“ gemeldet: Wechsel innerhalb einer Aufnahme, ≥ 3 Wechsel in den letzten 20 Botschaften oder ein Byte/Halbbyte, das um genau 1 weiterzählt. Fehlerhafte Frames werden nicht verglichen.
- **Bauteil-Simulator (Übung, LIN):** Klimabedienteil (Tasten AUTO/OFF/FRONT/Umluft/A/C/Heckscheibe, Temperatur, Gebläse, Alive-Zähler), Generator mit LIN-Regler und Batteriesensor (IBS), jeweils mit Steckbrief und Prüfschritten; sieben Fehler zuschaltbar (keine Antwort, Checksumme, Massefehler, Ruhepegel, Taktabweichung, Kurzschluss Masse, kein Verkehr). Jede Bedienung erzeugt eine gekennzeichnete Wiedergabe. IDs und Belegungen sind Beispiele, keine Herstellerdaten.
- 7 neue Node-Tests (`tests/decode/linsim.test.js`), ein neuer Browser-Test.

# V13.6 – Serielle Entschlüsselung und Zyklus-Messung (30. Oktober 2026)

Basis: unveränderte V13.5.1 (`releases/kfz-oszi-v13.5.1.zip`, SHA-256 geprüft). Neu im Kapitel **Live**, direkt unter dem Oszi-Bild:

- **Serielle Entschlüsselung** für LIN, CAN (klassisch, ISO 11898), K-Leitung (ISO 9141-2/14230) und SENT (SAE J2716): farbige Felder über der Kurve, Frame-Tabelle mit Prüfungen (Prüfsummen, Parität, Stuffing, ACK, Rahmen, Pegel, Bitrate/Tick mit Messunsicherheit). Ein Frame in der Tabelle springt bei Stop dorthin (Zeitzoom der V13.5.1). CAN-FD wird erkannt, die Datenphase aber nicht dekodiert.
- **Zyklus-Messung (DeepMeasure):** jeder vollständige Zyklus einzeln (Periode, Frequenz, Pulsbreiten, Tastgrad, Anstieg/Abfall 10/90 bzw. 20/80, Max/Min), Statistik je Messgröße, robuste Ausreißererkennung (Median/MAD), CSV-Export.
- **Beispielsignal** je Bus als gekennzeichnete Wiedergabe (keine Messung) zum Kennenlernen ohne Gerät.
- Abtastprüfung für die 5 000 Punkte des VDS1022I: unter 8 Punkten pro Bit Hinweis mit passender Zeitbasis, unter 4 Punkten keine Inhalte (statt geratener Werte).
- DOM-freier Block `oszi-decode` (`OsziDecode.decode/cycles/synth`), 148 neue Node-Tests (`tests/decode/`) gegen den ausgelieferten Block, ein neuer Browser-Test.

Nicht erfolgt: Test mit echtem Gerät und echten Fahrzeugsignalen. Bedeutung der Datenbytes bleibt herstellerspezifisch (LDF/DBC/Tester). Details: `docs/DECODER.md`.

# V13.5.1 – Zeitzoom bei Stop (26. Oktober 2026)

- Zeitbasisänderungen bei Stop erhalten die Aufnahme und ändern ausschließlich den sichtbaren Ausschnitt. Keine Zeitbasisbefehle beim Zoomen; das ursprüngliche dt und beide Kanäle bleiben erhalten.
- Der Regler „Ausschnitt“ verschiebt das Zeitfenster innerhalb der Aufnahme. Herauszoomen endet an deren tatsächlicher Länge; fehlende Messdaten werden nicht erfunden.
- Funktioniert auch nach Single und bei Bibliotheks-Wiedergabe. Bei Run/Single wird eine geänderte Zeitbasis vor der nächsten Aufnahme angewendet. Beide Zeitbasis-Bedienelemente bleiben synchron.
- FFT/Referenz/Messwerte werden für den neuen Ausschnitt aktualisiert. CSV-/Messdatenexport verwenden die sichtbaren Originalsamples.
- Die vorherige Defender-Erkennung ist weiterhin ungeklärt. Dieser Funktionspatch ist keine Virenfreigabe und keine Umgehung der Erkennung. Die beanstandete V13.5-ZIP bleibt unverändert erhalten.

Siehe `docs/ZEITZOOM-V13.5.1.md` für Bedienung und Testnachweise.

# V13.5 – 25. Oktober 2026

Basis: unveränderte hochgeladene V13.4 (`kfz-oszi-v13.4.zip`), anschließend gezielte Korrekturen. Die ältere Git-Ausgangsversion besaß weder Live-Bridge noch den vollständigen V13.4-Datenbestand. Alle 82 Messkarten, 1.087 Kartenbilder, 45 Erklär-/Fehlermusterbilder, 149 Signalmodelle und die eigenständige Multimeter-PWA bleiben enthalten. Die Eigentümer-Signaturen bleiben erhalten.

- Lokale Bridge: explizite Origin-Allowlist, zufälliger Kopplungscode je Bridge-Start, genau eine steuernde Verbindung, begrenzte Nachrichten/Queues/Rate, Sendefristen, native WebSocket-Keepalives. Keine Tokens in URLs oder Browser-Speichern.
- Gerätebefehle werden vor dem USB-Thread streng validiert. Unpassende Trigger-/Bereichskombinationen werden zurückgerollt und in der Oberfläche gemeldet. Beim USB-Abbruch wird das Gerät freigegeben und mit den letzten Einstellungen neu geöffnet.
- Messlogik: fehlende/ungültige Daten ergeben keine fiktiven Messwerte; Histogramm-Pegel ohne halben Bin-Versatz; robustes RMS; interpolierter Schmitt-Trigger. Keine Vermischung unabhängiger Geräteaufnahmen, keine Messung über alte Sampleintervalle. Originalsamples bleiben für Frequenz-/Flankenmessungen erhalten.
- Begrenzte Phasenkorrelation und FFT-Cache; Nachleuchten pro Aufnahme statt pro Bildschirm-Refresh. Stromzangen-Skalierung von Kurve, Achsen und Trigger konsistent; X-Y-Achsen passend zu ihren Bildschirmabmessungen.
- Verlustfreier CSV-Export bis 262.144 Samples/Kanal, neuer geprüfter CSV-Import für CH1/CH2 in Volt. JSON-Import V13.4 bleibt kompatibel, wird begrenzt und vor dem Speichern geprüft. Bibliotheks-Metadaten werden als Text behandelt; gefährliche IDs werden verworfen.
- Aufnahmen entsprechen einem aktuellen Zeitfenster, statt unabhängige Aufnahmen zu einem vermeintlich lückenlosen Verlauf zu verbinden. CH2 allein kann gespeichert werden; Wiedergabe stellt anschließend die vorherigen Live-Einstellungen wieder her.
- Neues neutrales Messdatenformat und lokale Analyse-Schnittstelle (`OsziData`, vier Kanäle im Austauschformat). Keine KI-API und keine automatische Datenübermittlung.
- Getrennte Offline-Caches, korrekter Navigation-Fallback, keine Cache-Vergiftung durch HTTP-Fehler, bestätigtes Update V13.4 → V13.5 mit Erhalt gespeicherter Aufnahmen. Kein unnötiger Reload bei Erstinstallation. Multimeter erhält den Infrastruktur-Patch `7.3.1-Profi`.
- Reproduzierbare Node-Installation mit Lockfile, Python-Anforderungen, erweiterte Tests, HTTP-basierte Validierungs-/Autorenwerkzeuge, sichere Public-Whitelist. GitHub-Deploy-Workflow ausschließlich manuell auslösbar; keine Veröffentlichung ausgeführt.

Details: `docs/FEHLERBERICHT-V13.5.md`, `docs/TESTREPORT-V13.5.md`, `docs/ARCHITEKTUR-V13.5.md` und `docs/MESSDATENFORMAT.md`.

Echte USB-/Windows-/Kalibrierungs- und Hochvoltprüfungen sind nicht erfolgt. Die neue Version ist keine Freigabe für Hochvolt-Messungen; das Austauschformat mit vier Kanälen ist kein implementierter Vierkanal-Hardwaretreiber.
