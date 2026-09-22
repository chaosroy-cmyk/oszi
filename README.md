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
| `lernquiz/` | Dritte, eigenständige PWA „KFZ Lernquiz" – Selbstüberprüfung zum Schulstoff (s. u.) |

## Zweite App: KFZ Multimeter Profi (`multimeter/`)

Eigenständige Schwester-PWA mit Multimeter-Prüfanleitungen (Spannung,
Strom, Widerstand, Diodentest, Spannungsabfall, Ruhestrom inkl.
mV-Drop-Rechner), Diagnosebäumen, Sicherheits-Checks und Glossar.
Sie hat eigenes Manifest, eigenen Service Worker und eigenen Scope
(`/multimeter/`) und ist damit getrennt vom Kompendium installierbar.
Prüfbericht und Änderungshistorie: `multimeter/REVIEW.md`.

Nach Änderungen dort `APP_VERSION` in `multimeter/index.html` **und**
`CACHE_NAME` in `multimeter/sw.js` gemeinsam erhöhen.

## Dritte App: KFZ Lernquiz (`lernquiz/`)

Eigenständige Lern-PWA zur Selbstüberprüfung des Berufsschulstoffs
„Gemischbildung" und „Sensoren und Aktoren" (vollständige Verbrennung,
Lambda, Otto-/Diesel-Prinzip, Betriebszustände, Motormanagement,
Induktiv-/Hallsensor) sowie als gekennzeichneten **Teil 2** Lasterfassung,
Weg-/Temperatur-/Druck-/Luftmassen-Sensoren, Lambdasonden und Aktoren
(Magnetventil, Piezoinjektor, E-/Schrittmotor, Zündspule, PTC).
Dazu ein eigener Bereich **Schaltzeichen** mit gezeichneten Symbolen
(Bild → Name und Name → Bild). Enthält 210 Quizfragen (Teil 2: 74,
Schaltzeichen: 31) in sechs Fragetypen
(Einfach-/Mehrfachauswahl, Wahr/Falsch, Eingabe, Zahl, Zuordnung) mit
Erklärung und Quellenangabe, 107 Karteikarten mit Leitner-Boxen, Merkzettel
je Thema sowie eine lokal gespeicherte Lernstatistik („Wackelkandidaten"
wiederholen). Eigenes Manifest, eigener Service Worker, eigene `_headers`/`_redirects`, daher
auch als eigenes Cloudflare-Pages-Projekt deploybar (Output-Verzeichnis
`lernquiz` oder Direkt-Upload) – Anleitung in `lernquiz/DEPLOY.md`.

Nach Änderungen dort `APP_VERSION` in `lernquiz/index.html` **und**
`CACHE_NAME` in `lernquiz/sw.js` gemeinsam erhöhen. Die Daten prüfen sich
beim Laden selbst (Konsole: „Lernquiz-Daten OK").

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
