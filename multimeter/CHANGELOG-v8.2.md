# CHANGELOG v8.2-Profi — Vollversion

Veröffentlicht: 27.07.2026

## Vollständigkeit

- Alle **70 Karten** besitzen jetzt eine konkrete ausführliche Anleitung.
- Die 34 in v8.1 fehlenden Abläufe wurden fach- und bauteilspezifisch ergänzt.
- Jede Detailansicht zeigt eine konkrete Sollwertquelle oder ausdrücklich die
  Pflicht zur OEM-/Bauteilvorgabe.
- Tabellenampeln kennzeichnen Prüfpriorität statt pauschaler
  Austausch-/Freigabeentscheidung.

## Fachlogik und Grenzwerte

- Starre 80-mA-Ruhestromentscheidung aus Karte und Diagnosebaum entfernt.
- Sensor-Masseversatz verwendet keine pauschale 50-mV-Freigabegrenze mehr.
- Generatorprüfung bewertet Systemart, Soll-/Ist-Anforderung, Batteriestrom,
  Temperatur und Ladezustand statt eines Universalbereichs.
- Generator-Spannungsabfall und Ripple werden gegen OEM-Vorgabe beziehungsweise
  Oszilloskopbefund bewertet.
- Sicherungs-mV-Rechner gibt den berechneten Strom aus, klassifiziert ihn aber
  nicht mehr mit pauschalen 5-/50-/200-mA-Schwellen.
- Masse- und ECU-Prüfungen verwenden Lastzustand, Seitenvergleich,
  Teilstreckenmessung und OEM-Grenze.

## Quellen

- `SOURCES.md` zu einer Quellen- und Grenzwertmatrix ausgebaut.
- Direkte Links, Revision/Abrufdatum, Anwendungsbereich und Grenzen ergänzt.
- WCAG korrigiert:
  - 24 × 24 CSS-Pixel beziehungsweise Abstand: SC 2.5.8, Level AA.
  - 44 × 44 CSS-Pixel: SC 2.5.5 Enhanced, Level AAA.
- Normstände aktualisiert, unter anderem ISO 8820-3:2026,
  ISO 11898-2:2026 und ISO 17987-3:2025.

## Barrierefreiheit und Darstellung

- Hellmodus als letzter CSS-Block angeordnet, damit Basisregeln ihn nicht
  überschreiben.
- Kontraststärkere Light-Theme-Farben für aktive Chips, Schrittmarken und
  Aktionsbuttons.
- Dialog-Fokus wird nach dem Neurendern über die stabile Karten-ID auf das
  auslösende Element zurückgesetzt.
- Bestehende 44×44-Touchziele, Fokus-Trap, `inert`, ARIA-Zustände und
  Reduced-Motion-Unterstützung bleiben erhalten.

## PWA-Update

- Version auf `8.2-Profi`, Cache auf
  `kfz-multimeter-profi-v8-2` und Paket auf `8.2.0` erhöht.
- Service Worker beantwortet Versionsabfragen über einen `MessageChannel`.
- Wartender und aktiver Worker werden vor dem Anzeigen des Updatebanners
  verglichen.
- Veraltete HTTP-Caches für `sw.js` werden durch
  `updateViaCache: "none"` umgangen.
- Banner wird vor Aktivierung/Reload sicher verborgen und zurückgesetzt.
- Ein unbekannter alter Worker darf einen bereits passenden v8.2-Controller
  nicht wieder herunterstufen.

## Tests

- Validator von 48 auf **62 Prüfungen** erweitert.
- Neue Regressionen für 70/70 Anleitungen, Fokus-Rückgabe, Hellmodus-Reihenfolge,
  Kontrast, Cache-/Worker-Version, Updateprotokoll, Quellenkennzeichnung und
  entfernte Universalgrenzen.
- Reale Browserabnahme für Mobilansicht, Hellmodus, Dialog/Fokus,
  Offline-Neustart und Update v8.1 → v8.2.

