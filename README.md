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
| `sw.js` | Service Worker – App-Shell-Cache, Offline-Betrieb |
| `_headers` | Cloudflare-Pages-HTTP-Header (Cache/MIME) |
| `icons/` | App-Icons (192/512 + maskable) |
| `tools/validate.js` | Datenvalidierung (headless, für CI) |
| `DEPLOY.md` | Deployment über Cloudflare Pages |
| `multimeter/` | Zweite, eigenständige PWA „KFZ Multimeter Profi" (s. u.) |
| `planetengetriebe/` | Dritte PWA: Planetengetriebe-Lernmodell (s. u.) |
| `tools/validate-planeten.js` | Rechen- und Klickprüfung des Lernmodells |

## Zweite App: KFZ Multimeter Profi (`multimeter/`)

Eigenständige Schwester-PWA mit Multimeter-Prüfanleitungen (Spannung,
Strom, Widerstand, Diodentest, Spannungsabfall, Ruhestrom inkl.
mV-Drop-Rechner), Diagnosebäumen, Sicherheits-Checks und Glossar.
Sie hat eigenes Manifest, eigenen Service Worker und eigenen Scope
(`/multimeter/`) und ist damit getrennt vom Kompendium installierbar.
Prüfbericht und Änderungshistorie: `multimeter/REVIEW.md`.

Nach Änderungen dort `APP_VERSION` in `multimeter/index.html` **und**
`CACHE_NAME` in `multimeter/sw.js` gemeinsam erhöhen.

## Dritte App: Planetengetriebe-Lernmodell (`planetengetriebe/`)

Interaktives Lernmodell für Schule und Ausbildung, ebenfalls eigenständige PWA
mit eigenem Manifest, Service Worker und Scope (`/planetengetriebe/`):

- **Stufe 1 – Planetensatz:** Sonnenrad, Träger oder Hohlrad festhalten,
  Antrieb wählen, Zähnezahl ändern. Animierte Vorderansicht mit korrekt
  kämmenden Zahnrädern, Getriebeschema mit Kraftfluss, Drehzahlplan,
  Drehmomente und alle acht Schaltmöglichkeiten im Überblick.
- **Stufe 2 – 3-Gang-Automatik (Simpson-Satz):** Wählhebel P R N D L,
  Gänge 1–3, Kupplungen K1/K2, Bremsen B1/B2, Freilauf F und Parksperre.
  Kraftfluss inkl. Leistungsverzweigung im 1. Gang, Schaltmatrix,
  Anfahr-Demo mit automatischem Hochschalten.
- **Stufe 3 – 8-Gang-Automatik (Bauart ZF 8HP):** vier Planetensätze,
  Bremsen A/B, Kupplungen C/D/E, je Gang drei geschlossen. Gänge R, N, 1–8,
  Schaltmatrix mit Gangsprüngen, Demo durch alle Gänge. Drehzahlen,
  Drehmomente und Kraftfluss rechnet ein allgemeiner Löser
  (Willis-Gleichungen + Momentengleichgewicht je Bauteil); die
  Übersetzungen stimmen mit den veröffentlichten Werten überein.
- **Direkt am Zahnrad sichtbar:** Schloss-Markierung „Bremse …“ (beim
  Hohlrad zusätzlich Bremsbacken), „steht“ bzw. „steht, stützt ab“,
  gestrichelter Ring „verblockt durch …“ und „Satz steht still“.
- **Stufe 4 – Wissen & Quiz:** Aufbau, Willis-Gleichung, Merksätze,
  warum 8 Gänge, 10 Fragen.

Prüfung (rechnet alle Übersetzungen nach und klickt alle Zustände durch):
`node tools/validate-planeten.js`. Nach Änderungen `CACHE_NAME` in
`planetengetriebe/sw.js` erhöhen.

## Nutzung

- **Direkt:** `index.html` im Browser öffnen – läuft auch als lokale
  Einzeldatei offline (ohne Service Worker).
- **Als PWA:** über `https` ausliefern (siehe `DEPLOY.md`), dann
  installierbar, Vollbild und verlässlich offline gecacht.

## Funktionen

- **Messkarten** mit Gut-/Fehlerbild-Umschaltung, Einsteiger-/Profi-Modus.
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

Nach Änderungen an gecachten Dateien die Cache-Version in `sw.js`
(Konstante `CACHE`) erhöhen.
