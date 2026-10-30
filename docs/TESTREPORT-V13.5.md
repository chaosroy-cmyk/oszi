# Testbericht V13.5 – 25. Oktober 2026

Ausgeführt unter Linux, Python 3.12.14, NumPy 2.3.5, websockets 16.0, Node 24.19.0, npm 11.9.0, Playwright 1.58.2 und installiertem `/usr/bin/chromium`. Keine echte USB-Hardware angeschlossen.

| Prüfung | Ergebnis |
|---|---|
| Originale Live-Logik | 39/39 bestanden, ursprüngliche Assertionen unverändert |
| Originale W2-Engine | 11/11 bestanden, darin 149 Modelle endlich/deterministisch geprüft |
| Zusätzliche Messlogik | 15/15 bestanden: ungültige/fehlende Daten, dt, Pegel, Impulse, Trigger, Toleranzen, FFT, RMS, Phase bei 262.144 Samples |
| Austauschformat / Import / CSV | 10/10 bestanden: Legacy, Binärformat, Größen, vier Kanäle, Einheiten, CSV-Roundtrip mit 262.144 Samples, lokale Analyse |
| Service-Worker-Unit-Tests | 5/5 bestanden: Cache-Namensräume, Fehlerantworten, Navigation, GET/Origin, Subpfad |
| Python-Bridge | 18/18 bestanden: striktes Protokoll, echte lokale WebSocket-Verbindungen, Origin/Auth/Konkurrenz, Rate/Größe, Queues, Fake-USB-Reconnect, Einstellungs-Rollback |
| Browser-Integration | 5/5 bestanden: gesamte Bibliothek/Suche, Mock/Bedienung/CSV/JSON/XSS/Wiedergabe/Kanalwechsel, authentifizierter OSZ1-Transport mit Fake-Treiber, echter Worker-Upgrade, Bildschirmgrößen |
| Gesamtdatenvalidierung | 82 Karten, 1.087 Kartenbilder und zusätzlich alle 45 Erklär-/Fehlermusterbilder: null Fehler und null Warnungen; 18 Fehlermuster und 65 Glossareinträge vorhanden |
| W2-Autorenwerkzeug | Vorhandene erste Karte unverändert als Patch geprüft/gerendert: 15 Bilder, null Fehler |
| Syntax und Konfiguration | Alle aktuellen JS-/CJS-/Inline-Scripts, Python-Dateien und JSON-/Manifestdateien geprüft; keine Syntaxfehler |
| Public-Build | `bash build-dist.sh` erfolgreich; ausschließlich öffentliche HTML/JS/Manifest/Icon/Header-Dateien, kein Backend/Prompt/Review/Test im `dist/` |
| ZIP | Vollständiger Release mit SHA-256-Dateiliste; Struktur und Prüfsummen nach dem Entpacken kontrolliert |

Zum Zeitpunkt des Gesamtlaufs: **103 bestandene automatisierte Tests** (39+11+15+10+5+18+5), keine fehlgeschlagenen/übersprungenen/deaktivierten Tests. Bibliotheksvalidierung und Autorenwerkzeug zählen zusätzlich und sind nicht als weitere einzelne Unit-Tests umetikettiert.

Browsergrößen: 360×800, 1280×720 und 1920×1080 mit Device-Scale 1,25 sowie Desktop 1366×768. Keine horizontale Seitenüberbreite im Live-Tab. Das ist kein nativer Windows-Test und keine vollständige Prüfung sämtlicher Browser-/Zoom-Kombinationen.

Der Upgrade-Test liefert zuerst die originale V13.4 aus `tests/fixtures/v13.4/`, installiert deren echten Worker, speichert eine Legacy-Aufnahme in IndexedDB, stellt den Server auf V13.5 um und betätigt den echten Update-Knopf. Danach werden Aufnahme/LocalStorage, fremde Caches sowie beide PWAs online/offline geprüft. Die Original-Fixtures bleiben für Regressionen unverändert erhalten.

Origin-, Auth-, Größen- und Rate-Negativtests provozieren erwartete WebSocket-Abweisungen. Entsprechende Serverlogs sind erwartete Testereignisse, keine verschwiegenen fehlgeschlagenen Tests.

## Reproduktion

```sh
npm ci
python3 -m pip install -r requirements.txt
npm test
npm run test:python
# Vorhandenes Chromium bevorzugen; sonst einmal: npx playwright install chromium
CHROME_PATH=/usr/bin/chromium npm run test:browser
CHROME_PATH=/usr/bin/chromium npm run validate
npm run build
python3 tools/package-release.py /tmp/kfz-oszi-v13.5.zip
```

Unter Windows heißt der Python-Aufruf üblicherweise `python`; `CHROME_PATH` auf Chrome/Chromium setzen oder den von Playwright installierten Browser ohne diese Variable verwenden. Die Browser-Tests starten eigene temporäre HTTP-/WebSocket-Server auf freien lokalen Ports. Dafür wird kein echter OWON-Treiber benötigt. Einzelne Einträge in einer Testfunktion prüfen mehrere Randfälle; sie werden nicht zusätzlich gezählt.

Nicht ausgeführt: echter OWON-/Windows-/Kalibrierungs-/Hochvolt-Test, Tage-Dauertest, künftiger Vierkanaltreiber und kostenpflichtige KI-APIs. Keine Cloudflare-Veröffentlichung, kein Git-Push. Details/Restgrenzen im Fehlerbericht.
