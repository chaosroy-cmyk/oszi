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
