# KFZ-Oszilloskop-Kompendium

Offline-Diagnoseunterlage für die Werkstatt als installierbare **PWA**:
Messkarten mit Oszi-Einstellungen, schematischen **und** fahrzeugspezifischen
Gut-/Fehlerbildern, Ursachen, Lösungen, Prüfplänen, Bussystemen und Glossar.
Für Smartphone optimiert, ohne externe Abhängigkeiten.

© 2026 Roy Sperlich – Alle Rechte vorbehalten.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Die komplette App (HTML, CSS, JS, Signal-Engine, Daten) |
| `manifest.webmanifest` | PWA-Manifest (Name, Icons, Standalone-Anzeige) |
| `service-worker.js` | Service Worker – App-Shell-Cache, Offline-Betrieb (Update-Banner, **kein** `skipWaiting` im install) |
| `_headers` | Cloudflare-Pages-HTTP-Header (Cache/MIME) |
| `icons/` | App-Icons (192/512 + maskable) |
| `tools/validate.js` | Datenvalidierung (headless, für CI) |
| `bridge.py` | Live-Modus: WebSocket-Bridge zum OWON VDS1022I (lokal, **nicht** deployt) |
| `tests/live-logic.test.js` | Node-Tests der Live-Logik (`OsziLogic`, 38 Tests) |
| `tests/signal-engine.test.js` | Node-Tests der Signalbild-Engine W2 und aller Kartenmodelle |
| `tools/w2/` | Kit für neue Signalbilder: Regeln (`API.md`), Prüf-/Render-Werkzeug, Einbau, Textkorrektur |
| `docs/SIGNAL-KATALOG.md` | Katalog aller am Fahrzeug messbaren Signale (146) mit Abdeckung, Priorität, Quellen; `docs/signal-katalog.json` maschinenlesbar |
| `start-live.cmd` / `stop-live.cmd` | Windows-Starter für Bridge + lokalen Server |
| `build-dist.sh` | Baut das öffentliche `dist/` (Deploy-Whitelist, ohne Backend/Doku) |
| `DEPLOY.md` | Deployment über Cloudflare Pages |
| `multimeter/` | Zweite, eigenständige PWA „KFZ Multimeter Profi" (s. u.) |

## Zweite App: KFZ Multimeter Profi (`multimeter/`)

Eigenständige Schwester-PWA mit Multimeter-Prüfanleitungen (Spannung,
Strom, Widerstand, Diodentest, Spannungsabfall, Ruhestrom inkl.
mV-Drop-Rechner), Diagnosebäumen, Sicherheits-Checks und Glossar.
Sie hat eigenes Manifest, eigenen Service Worker und eigenen Scope
(`/multimeter/`) und ist damit getrennt vom Kompendium installierbar.
Prüfbericht und Änderungshistorie: `multimeter/REVIEW.md`.

Nach Änderungen dort `APP_VERSION` in `multimeter/index.html` **und**
`CACHE_NAME` in `multimeter/sw.js` gemeinsam erhöhen.

## Nutzung

- **Direkt:** `index.html` im Browser öffnen – läuft auch als lokale
  Einzeldatei offline (ohne Service Worker).
- **Als PWA:** über `https` ausliefern (siehe `DEPLOY.md`), dann
  installierbar, Vollbild und verlässlich offline gecacht.

## Funktionen

- **Messkarten** mit Gut-/Fehlerbild-Umschaltung, Einsteiger-/Profi-Modus.
- **Quellenbelegte Signalbilder (V11, Engine W2):** Die 20 Sensor- und Lambdakarten zeigen je
  5–7 Zustände und 6–12 Fehlerbilder (293 Bilder), gerechnet aus Signalmodellen in echter Zeit.
  Achsen in echten Einheiten, Sollbild gestrichelt in jedem Fehlerbild, Quellen je Karte.
  Jedes Bild ist maschinell nachgemessen (`expect`) und von unabhängigen Prüfern abgenommen.
- **Fahrzeugspezifische Signalbilder:** je Karte umschaltbare Varianten
  (schematisch neutral + fahrzeugspezifisch).
- **Eigene Messungen importieren:** Scope-CSV (`Zeit,Spannung`) einlesen,
  benennen, als Gut-/Fehlerbild speichern (lokal im Browser), als JSON
  exportieren/importieren.
- **Suche** über Bauteile, Fehlercodes, Kapitel und Glossar.
- **Barrierefrei:** volle Tastaturbedienung, ARIA, WCAG-AA-Kontraste,
  farbcodierungssichere Gut-/Fehler-Kennzeichnung.
- **Hell-/Dunkel-Theme**, druckfreundliche Ansicht.

## Entwicklung

Datenvalidierung (prüft Karten, Referenzen, Varianten-Generatoren):

```
npm i -D playwright
node tools/validate.js
```

Im Browser: `index.html?validate` öffnen und die Konsole prüfen.

Nach Änderungen an gecachten Dateien die Cache-Version in `service-worker.js`
(Konstante `CACHE_NAME`, Schema `kfz-oszi-pwa-signed-…-vN`, aktuell **…-v11**)
erhöhen **und** den Footer „Stand vN" in `index.html` anpassen — sonst
erscheint bei installierten Clients kein „Update verfügbar"-Banner.

Live-Modus (OWON VDS1022I) lokal testen: `bridge.py` starten (bzw.
`start-live.cmd`), Logik-Tests via `node tests/live-logic.test.js`.

Tests der Signalbild-Engine: `node tests/signal-engine.test.js`.

### Neue Signalbilder (W2)

Ablauf und Regeln stehen in `tools/w2/README.md` und `tools/w2/API.md`. Kurz: Ein Autor
recherchiert und belegt die Werte, schreibt eine Kartendatei und prüft sie mit
`tools/w2/render-card.js`, bis 0 Fehler gemeldet werden. Danach prüft ein unabhängiger Prüfer
und der Autor korrigiert. Erst dann baut `tools/w2/integrate.js` die Datei in `index.html` ein.
Welche Karten noch fehlen, steht in `docs/SIGNAL-KATALOG.md`.
