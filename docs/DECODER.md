# Serielle Entschlüsselung und Zyklus-Messung (V13.6.1)

Beide Funktionen stehen im Kapitel **Live** direkt unter dem Oszi-Bild. Sie werten die aktuelle
Aufnahme aus – live von der Bridge, gestoppt (mit Zeitzoom), aus der Bibliothek oder aus einem
CSV-Import. Es werden keine Daten übertragen.

## Serielle Entschlüsselung

| Bus | Quelle | Bitrate | Geprüft |
|---|---|---|---|
| LIN (LIN 2.x / ISO 17987) | LIN-Leitung gegen Masse | automatisch aus dem Sync-Feld oder fest | Break, Sync 0x55, PID-Parität, Checksumme klassisch/erweitert, Antwort vorhanden, Takt der Antwort (±2 %), Ruhe- und Low-Pegel bezogen auf U_Bat |
| CAN (ISO 11898, klassisch) | CAN-H, CAN-L oder CH1−CH2 | automatisch oder fest | Bit-Stuffing, CRC-15, Delimiter, ACK, Error-Frames, Pegel; CAN-FD-Frames werden erkannt, die Datenphase aber nicht dekodiert |
| K-Leitung (ISO 9141-2 / ISO 14230) | K-Leitung gegen Masse | automatisch oder fest | Byte-Rahmen, KWP2000-/ISO-9141-Kopf, Länge, Checksumme, Fast-Init, Pegel |
| SENT (SAE J2716) | Signalleitung gegen Masse | Tick automatisch aus dem Sync-Puls oder fest | Sync, Nibble-Bereich, CRC-4, Tick-Abweichung, Pausenpuls |

Die farbigen Bänder über der Kurve zeigen die Felder jedes Frames. Ein Frame in der Tabelle antippen
markiert ihn; bei **Stop** springt die Anzeige zu diesem Frame (Zeitzoom der V13.5.1).

**Grenzen:** Ausgewertet werden Physik und Protokoll. Was ein Datenbyte bedeutet, legt der Hersteller
fest (LDF, DBC, Reparaturleitfaden). Der VDS1022I nimmt 5 000 Punkte je Aufnahme auf. Für eine sichere
Dekodierung braucht es mindestens 8 Punkte pro Bit – die App nennt die passende Zeitbasis, wenn es
nicht reicht (z. B. CAN 500 kbit/s: höchstens 125 µs/div; LIN 19,2 kbit/s: höchstens 3,3 ms/div).
Unter 4 Punkten pro Bit gibt der Decoder keine Inhalte aus.

**Beispielsignal:** lädt ein simuliertes Signal des gewählten Busses als Wiedergabe (gekennzeichnet,
keine Messung) – zum Kennenlernen ohne Gerät.

## Bit-Monitor

Unter der Frame-Tabelle. Zeigt je Kennung (LIN-ID, CAN-ID …) die Datenbytes bitweise. Ablauf in der
Werkstatt: ohne Tastendruck aufnehmen → **Referenz merken** → Taste oder Schalter betätigen → neu
aufnehmen (Single). Rot = gegenüber der Referenz geändert. Ohne Referenz wird mit der vorigen Aufnahme
verglichen. Gepunktet = ändert sich laufend und ist deshalb nicht die gesuchte Taste: Wechsel zwischen
zwei Botschaften derselben Aufnahme, mindestens 3 Wechsel in den letzten 20 Botschaften, oder ein
Byte/Halbbyte zählt um genau 1 weiter (Alive-Zähler). Frames mit Prüfsummen- oder Rahmenfehler werden
nicht verglichen.

## Bauteil-Simulator (Übung, LIN)

Erscheint bei Bus = LIN. Simuliert ein Klimabedienteil, einen Generator mit LIN-Regler oder einen
Batteriesensor mit Tasten, Reglern und zuschaltbaren Fehlern. Jede Bedienung erzeugt eine neue,
als Wiedergabe gekennzeichnete Aufnahme; Decoder und Bit-Monitor reagieren wie bei einer echten
Messung. Steckbrief und Prüfschritte je Bauteil stehen darunter. IDs und Bit-Belegungen sind frei
gewählte Beispiele – die echte Belegung steht in der LDF des Herstellers.

## Zyklus-Messung (DeepMeasure)

Vermisst jeden vollständigen Zyklus der Aufnahme einzeln: Periode, Frequenz, Pulsbreiten, Tastgrad,
Anstiegs-/Abfallzeit (10/90 % oder 20/80 % des Hubs), Maximal- und Minimalwert. Darüber stehen Min,
Max, Mittelwert und Streuung je Messgröße. Ausreißer werden robust über Median und MAD erkannt
(|x − Median| / (1,4826 · MAD) > 3,5) und rot markiert – im Bild als Band, in der Tabelle als Zelle.
Schwelle und Hysterese sind automatisch oder fest einstellbar. Die Tabelle lässt sich als CSV exportieren.

## Schnittstelle (für Tests und eigene Auswertungen)

`OsziDecode.decode(bus, values, dt, opt)`, `OsziDecode.cycles(values, dt, opt)` und
`OsziDecode.synth(bus, opt)` sind DOM-frei (Script-Block `oszi-decode`). Ergebnisformat und Optionen:
siehe Kommentare im Block. Tests: `tests/decode/*.test.js` laufen gegen den ausgelieferten Block.
