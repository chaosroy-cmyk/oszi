# Testbericht v8.2-Profi — Vollversion

Datum: 27.07.2026  
Teststand: Inhalt der auszuliefernden v8.2-Arbeitskopie

## Ergebnis

**Freigabe erteilt.**

- Automatisierte Abnahme: **62/62 bestanden**
- Karten: **70/70**
- Detailansichten: **70/70 fehlerfrei**
- Ausführliche Anleitungen: **70/70**
- DEEP-Schlüssel: **70/70**
- Diagnosebäume: **14/14**, alle Ziele gültig und Knoten erreichbar
- Paketinstallation: reproduzierbar per `npm ci`
- Paketprüfung: **0 gemeldete Sicherheitslücken**
- Browser-Konsolenfehler in Haupt- und Updateablauf: **0**

## Automatisierte Abnahme

Ausgeführt:

```text
npm ci --ignore-scripts
npm test
```

Der Validator prüft unter anderem:

- Datenintegrität, Renderer und Querverweise
- alle 70 ausführlichen Anleitungen mit mindestens vier Schritten
- Rechnerregression und Eingabevalidierung
- Merkliste, Suche, History und Diagnosebäume
- Fokus-Trap und Fokus-Rückgabe auf die neu gerenderte Ausgangskarte
- Gefahrblöcke vor Arbeitsanweisungen
- keine aktiven universellen 5-V-, 80-mA- oder 50-mV-Entscheidungsgrenzen
- keine pauschalen Stromampeln im Sicherungs-mV-Rechner
- versionssynchronen App-/Service-Worker-Cache
- Cache-Isolation und 26 Splash-Assets
- Service-Worker-Versionsabfrage und cachefreien Updatecheck
- `inert`, ARIA-Zustände und 44×44-Touchziele
- Hellmodus-Reihenfolge und Mindestkontrast 4,5:1 für Aktionsfarben
- direkte Quellenlinks und korrekte WCAG-Zuordnung
- sichtbare Sollwertquelle beziehungsweise OEM-Pflicht in jeder Detailansicht

## Reale Browserprüfung

### Mobil und Hellmodus

Getestet bei explizit **360 × 640 CSS-Pixeln**:

- `innerWidth`: 360 px
- Dokumentbreite: 345 px
- kein horizontaler Überlauf
- 70 Karten sichtbar
- System-Hellmodus tatsächlich aktiv
- Body: helle Fläche mit dunkler Schrift
- Header: weißer Verlauf mit dunkler Schrift
- aktiver Chip: `rgb(117, 72, 0)` mit weißer Schrift
- Chip-Höhe: 44 px
- Zurück- und Favoritenbutton: jeweils 44 × 44 px

### Dialog und Fokus

- Hintergrund während des Dialogs: `inert` und `aria-hidden="true"`
- Anleitung und Sollwertquelle im Dialog sichtbar
- nach Schließen: Hintergrund wieder bedienbar
- Fokus kehrt auf den Button mit `data-card-id="masse"` zurück
- aktives Element danach: `BUTTON`, nicht `BODY`

### Offline-Neustart

Ablauf:

1. v8.2 online laden und Service Worker aktivieren.
2. Lokalen Webserver vollständig stoppen.
3. Seite neu laden.

Ergebnis:

- Titel korrekt
- Version `8.2-Profi`
- 70 Karten verfügbar
- Mobilbreite weiterhin korrekt

### Update v8.1 → v8.2

Ablauf auf einem frischen isolierten Origin:

1. v8.1 laden und als aktiven Service Worker übernehmen.
2. Server auf v8.2 umschalten.
3. Seite neu laden.
4. Updatebanner erscheint.
5. „Aktualisieren“ auslösen.
6. Aktivierung und automatischen Reload abwarten.
7. Noch einmal manuell neu laden.

Ergebnis:

- v8.2-Netzseite erkannt
- Updatebanner erscheint genau für den wartenden neuen Worker
- nach Aktivierung: Version `8.2-Profi`, 70 Karten
- Updatebanner nach automatischem Reload: `display: none`
- Updatebanner nach zusätzlichem Reload: `display: none`
- Buttonzustand sauber zurückgesetzt
- keine Update-Schleife

## Bekannte Abgrenzung

- Kein physischer Fahrzeugtest und keine Freigabe für eine konkrete
  Herstellerdiagnose.
- Kein realer iOS-/Safari-Gerätetest; Splash-Dateien und PWA-Verhalten wurden
  strukturell und im Chromium-basierten Testbrowser geprüft.
- Orientierungswerte ersetzen keine Kennlinie, Teilenummer oder
  Herstellerprozedur. Diese Grenze wird in jeder Detailansicht ausgewiesen.

