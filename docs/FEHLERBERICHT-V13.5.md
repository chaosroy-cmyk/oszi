# Fehlerbericht V13.5

## Basis und Umfang

Entwicklungsbasis ist die vom Nutzer gelieferte V13.4. SHA-256 des Originalarchivs:
`285de123503b62207f3b02f8be9be691c3a103ccc0ffd1ef2d79be7d58181d2d`.
Archiv-Kommentar: `5751c665d59488f22b3cb268351355012224f43e`. Die Git-Ausgangsversion (`ffc292a`) war wesentlich älter. Es gab vor Beginn keine lokalen Änderungen. ZIP-Inhalte wurden als Quellmaterial behandelt, enthaltene historische Prompts nicht als Arbeitsanweisungen.

Geprüft wurden beide HTML-Anwendungen und deren Script-Blöcke, sämtliche Signalmodelle/Karten und `expect`-Prüfungen, Bridge, beide Worker und Legacy-Pfad, Manifeste/Headers, Windows-Starter, Build/Deploy, vorhandene Tests sowie die W2-Autorenwerkzeuge. Die drei historischen `workflow-*.js` benötigen ihren externen Agenten-Host mit `args`/Host-Funktionen; sie sind keine eigenständig ausführbaren Anwendungstests. Sie wurden nicht gestartet. Fachliche OEM-Werte wurden nicht neu zertifiziert.

## Bestätigte Fehler und Korrekturen

Dateien beziehen sich auf die ursprüngliche V13.4; Funktionen dienen als stabile Fundstellen trotz verschobener Zeilennummern. P1 = Sicherheit/Messintegrität, P2 = Funktion/Performance.

| ID | Prio / Datei / Funktion | Ursache | Auswirkung | Korrektur und Nachweis |
|---|---|---|---|---|
| B01 | P1 `bridge.py`, `handler/main` | Keine Origin-Prüfung/Authentifizierung | Fremde Webseiten konnten lokale Gerätebefehle senden | Exakte lokale Origins, zufälliger Sitzungscode vor jedem Befehl; echte WebSocket-Negativtests |
| B02 | P1 `bridge.py`, `handler/drain_cmds` | JSON ohne Schema, `float/int` im Geräte-Thread | Listen, Null, NaN oder falsche Typen konnten Handler/Worker abbrechen oder Zustände verfälschen | `bridge_protocol.py`, strenge Feld-/Typ-/Bereichsprüfung; negative Protokolltests |
| B03 | P1 `bridge.py`, Queues/Sender | Unbegrenzte Befehlsqueue/Nachrichtengröße, keine Sendefrist | Speicherwachstum/Blockade durch Clients; alte Frames bei Rückstau | 4 KiB, 128 Befehle, 100 Nachrichten/s, zwei Frames, ältesten Frame verwerfen, Sendefrist; Größen-/Raten-/Queue-Tests |
| B04 | P1 `bridge.py`, `CLIENTS` | Alle Clients durften gleichzeitig steuern | Konkurrierende Gerätekonfigurationen | Ein Controller; veraltete Sitzungsbefehle verwerfen; Konkurrenz-/Reconnect-Tests |
| B05 | P1 `bridge.py`, `device_worker` | Frame wurde vor `drain_cmds` aufgenommen, danach mit neuen Einstellungen beschriftet | Falsche Einheiten/Sampleintervalle bei Einstellungswechsel | Betroffenen alten Frame verwerfen, tatsächliches `sx`/Rate verwenden; Browser-Zeitbasistest |
| B06 | P1 `bridge.py`, `_volts` | `np.asarray` konnte auf wiederverwendeten Treiberpuffer zeigen | Spätere Aufnahme veränderte bereits eingereihte Samples | Begrenzte, endliche 1D-Kopie; Snapshot-Test |
| B07 | P1 `bridge.py`, `apply_settings` | Fehler wurden verschluckt; `set_timerange` erhielt Samplingrate statt Sekunden; Initialrate passte nicht zur Zeitbasis | Falsches Bereitschaftssignal und falsche Zeitachse bei Fallback-Treiber | Dokumentierte API-Einheiten, Ist-Rate, Fehler weitergeben; Fake-API-Tests |
| B08 | P2 `bridge.py`, `_dt/finally` | dt nur aus CH1 gelesen, nur `stop()` statt Ressourcenfreigabe | CH2-/Reconnect-Metadaten bzw. USB-Lebenszyklus unzuverlässig | CH2-Fallback, `dispose()` sofern vorhanden, erneutes Anwenden; simulierter USB-Abbruchtest |
| B09 | P2 `bridge.py`, Run/Stop | `SINGLE` blieb nach Run/Stop gesetzt | Weiteres unerwünschtes Einzelbild möglich | Beide Befehle löschen Single-Arm; Python-/Browser-Test |
| J01 | P1 `index.html`, Bibliotheks-Renderer/Import | Namen/Notizen/IDs ungefiltert in `innerHTML`/Attribute, unbeschränkte Base64-/Array-Daten | Gespeichertes XSS und Ressourcenüberlastung | Text-Escaping inklusive Quotes, sichere IDs/Dictionary, Typ-/Längen-/Finite-Prüfung, 16 MiB, atomarer Import; XSS-/Importtests |
| J02 | P1 `OsziLogic` | Leere Daten → Null/RMS=0 bzw. unendliche Extrema; ungültiges dt akzeptiert | Scheinwerte und unendliche/negative Frequenzen/Flankenzeiten | Eindeutige `null`-Ergebnisse, strikt endliche Samples/dt; Randfalltests |
| J03 | P2 `OsziLogic.levels` | Histogramm-Pegel um halbe Bin-Breite versetzt | Systematischer Top-/Base-/Amplitudenfehler | Tatsächlicher Mittelwert des ausgewählten Bins; exakt bekannte Rechteck-Pegel testen |
| J04 | P1 `windowSlices/onFrame` | Kurze Geräteframes fielen auf zusammengefügten Ringpuffer zurück; dt-/Kanalwechsel ließen alte Daten stehen | Sprünge, falsche Frequenzen, falsche Zuordnung | Jede Hardwareaufnahme isoliert, tatsächliche Zeitdauer, Reset bei Wechsel; Regression/Browsertests |
| J05 | P1 `windowSlices` | Letzter einfacher Schwellwertdurchgang ohne Hysterese | Rauschen konnte Triggerposition verschieben | Vollständiges Pre-/Post-Fenster, Schmitt-Hysterese und interpolierter Durchgang; steigende/fallende Randfälle |
| J06 | P1 `metricRowsFor/exportCSV` | Stride-Ausdünnung von Messdaten bzw. Export auf 20.000 Zeilen | Kurze Impulse/Spitzen fehlten in Messung oder Export | Messen/Exportieren aller Samples; 262.144-Sample-Spitzentest und CSV-Roundtrip |
| J07 | P2 `phase/drawFFT/PHIST` | Quadratische Korrelation großer Arrays, FFT und Nachleuchten bei jedem Refresh | Lange UI-Blockaden/unnötige Allokationen | Phasenkorrelation auf 2.048 gemittelte Buckets begrenzen, FFT nach Aufnahme/Parametern cachen, Nachleuchten je Frame; Großdaten-/Browser-Test |
| J08 | P1 `draw/chMul/drawXY` | In Ampere umgerechnete Werte auf Volt-Skala; X-Achse verwendete Bildschirmhöhe | Falsch skalierte Kurven/Trigger bzw. X-Y | Einheit und Skalierung gemeinsam umrechnen; X-Achse mit Breite/10; Einheiten-/Browser-/Codeprüfung |
| J09 | P1 `saveRecording/loadRecording` | Ring enthielt unabhängige Geräteaufnahmen; CH1 war zwingend; Metadaten verloren; Wiedergabe-UI inkonsistent | Scheinbar kontinuierliche Aufnahmen, CH2 nicht speicherbar, falsche Wiedergabezeit | Ein aktuelles Fenster speichern, CH2-only, Metadaten erhalten, Steuerelemente synchronisieren und Live-Zustand wiederherstellen |
| J10 | P2 `connect/disconnect` | Alte Socket-Callbacks konnten neue Verbindung überschreiben | Doppelte Reconnect-Timer oder falscher Status | Generation/Socket-Identität, alte Listener lösen, Retry nur bei vorübergehenden Fehlern; Browser-Reconnect-Test |
| J11 | P2 Auto-Setup | Programmatische Änderungen aktualisierten obere Bedienelemente nicht | Anzeige und aktive Einstellungen wichen ab | Spiegel explizit synchronisieren |
| S01 | P1 beide Service Worker | `activate` löschte alle fremden Caches | Schwester-PWA offline beschädigt | Nur eigenen Cache-Namensraum bereinigen; Worker-Unit- und echter Update-/Offline-Test |
| S02 | P2 Haupt-Worker | Offline zuerst altes `./`, Online schrieb nur `index.html`; HTTP-Fehler wurden gecacht | Veraltete oder fehlerhafte Offline-Seite | Kanonischer aktueller Shell-Eintrag, nur erfolgreiche Antworten, GET/same-origin/Whitelist; Fehler-/Subpfadtests |
| S03 | P2 beide App-Registrierungen | Erstes `clients.claim()` löste ungefragten Reload aus; Update-Promises ohne Catch | Unterbrochene Erstnutzung und unbehandelte Offline-Rejections | Erstinstallation ohne Reload, Updates weiterhin bestätigt, Rejections behandeln |
| D01 | P2 `build-dist.sh` | Komplettes `multimeter/` einschließlich interner REVIEW.md kopiert | Dokumentationsdateien im Public-Paket | Explizite Dateitypen-Whitelist; Build-Inhalt geprüft |
| N01 | P2 Nachprüfung `bridge.py` | Nach strenger Fehlerweitergabe konnte ungültiger Trigger bei kleinem Bereich wiederholte Reconnects auslösen | Unnötiger Verlust der Live-Verbindung | Zusammenhängende Einstellungen validieren/rollbacken und korrigierten Zustand melden; neuer Regressionstest |
| N02 | P2 Nachprüfung `frames_source` | `TypeError` aus laufender Treiberiteration wurde als alte API-Signatur behandelt | Verdeckter Treiberfehler/unerwarteter Neustart | Signatur vor Iteration prüfen, echte Fehler weitergeben; Regressionstest |

Zusätzliche Vorsorge: skalierter RMS-Akkumulator gegen Überlauf, sofortige FFT-Größenprüfung, begrenzte/importierte Aufnahmekontexte, IndexedDB-Fehlerbehandlung, kein Division-durch-null-Scheinwert. Diese Punkte wurden ebenfalls mit Randfalltests bzw. Fehlerpfadprüfung behandelt; daraus wird keine im Original beobachtete Hardwarestörung abgeleitet.

## Unbestätigte Risiken / außerhalb ausführbarer Prüfung

- Keine reale USB-Hardware: Kalibrierung, Versorgung, Treiberversion, echter USB-Abbruch unter Windows, physikalische Triggerjitter, tatsächliche Paketverluste und Latenzen bleiben ungeprüft. Der simulierte Treiber belegt Software-Verhalten, keine Messgenauigkeit.
- Geprüfte OWON-API-Quelle: florentbr/OWON-VDS1022, Commit `a21cee14fc0807ce804657a26772784c4e47b5ef` (Python-Modul 1.1.5). `set_channel` erwartet den Gesamtbereich über zehn Divisionen am Tastkopf; `Frame.y()` liefert bereits Tastkopf-Volt. Sehr alte APIs ohne `sweep=AUTO` werden nicht als zuverlässig unterstützt ausgegeben.
- Windows/Edge wurde nicht nativ ausgeführt. Chromium unter Linux wurde bei Laptop-/Mobil-Auflösungen und 125-%-Skalierung geprüft; echte DPI-/Touch-/Treiberbesonderheiten bleiben offen.
- Phasenmessung großer Aufnahmen ist eine begrenzte Näherung nach Bucket-Mittelung. Hochfrequente oder sehr kurze Phasenereignisse können nicht zuverlässig ausgewertet werden. Frequenz, RMS und Flankenzeiten verwenden Originalsamples.
- `single` bedeutet weiterhin nächstes vollständiges AUTO-Sweep-Bild, keine garantierte physikalische Triggerbestätigung. `trigger.confirmed` bleibt deshalb falsch.
- Aliasfreiheit, tatsächliche ADC-Clipping-Erkennung, Zubehörgrenzen und Kalibrierung werden nicht behauptet. Unbekannte Bereiche/Clipping bleiben `null`, Kalibrierungsstatus ist unbestätigt.
- Kein echter Vierkanaltreiber und keine Hochvoltfreigabe. Vor Arbeiten an Hybrid/EV gelten qualifiziertes Personal, geeignete isolierte Messmittel und Herstellervorgaben; das Datenformat ändert daran nichts.
- Große dauerhaft gespeicherte Bibliotheken hängen weiter vom Browser-Speicherkontingent ab. Importmengen sind begrenzt; Speicherfehler werden gemeldet. Es wurde kein Langzeit-Dauertest über Tage durchgeführt.

## Kontrollzyklus

Baseline: 39 vorhandene Logiktests, 11 Engine-Tests und Kartenvalidierung grün. Zuerst neue negative Tests gegen bestätigte Fehler (sieben neue Regressionstests zunächst rot), dann Korrekturen und gezielte Nachtests. Drei Korrekturrunden mit Browser-/Protokoll-Gegenprüfung; dabei Initial-Reload und Trigger-/Bereich-Rollback nachgebessert. Abschließend Gesamtlauf einschließlich Build/Archivprüfung. Keine Tests entfernt oder Assertionen abgeschwächt. Das Limit von fünf vollständigen Kontrollzyklen wurde nicht ausgeschöpft. Nach den ausgeführten Prüfungen sind keine bekannten kritischen Softwarefehler offen; die oben genannten Hardware-/Plattformgrenzen bleiben ausdrücklich unvalidiert.
