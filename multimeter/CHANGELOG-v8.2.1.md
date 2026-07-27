# CHANGELOG v8.2.1-Profi

Nachbesserung der drei Befunde aus der unabhängigen Verifikation von v8.2.
v8.2 selbst hielt der Prüfung stand — die folgenden Punkte waren keine
Sicherheits- oder Diagnosefehler, sondern ein Zitationsmangel, Codehygiene und
eine Abwägung zulasten der Einsteiger.

## 1 · Normzitat ISO 8820-3 korrigiert

v8.2 führte die Sicherungsnorm als **ISO 8820-3:2026, Edition 5, 2026-07**.
Die dort verlinkte ISO-Seite (`standard/85282.html`) ist jedoch die Seite des
**ISO/FDIS 8820-3** — eines Schlussentwurfs im Genehmigungsverfahren. Gültig
veröffentlicht ist weiterhin **ISO 8820-3:2015**.

Ein Entwurf darf nicht als publizierte Norm zitiert werden. `SOURCES.md` führt
jetzt beide Stände getrennt: die gültige Ausgabe 2015 und den FDIS als
laufende Überarbeitung, mit ausdrücklichem Hinweis.

Die beiden anderen Normstände wurden gegengeprüft und sind **korrekt**:
ISO 11898-2:2026 (Edition 4, 2026-05) und ISO 17987-3:2025 (Edition 2).

## 2 · Doppelter Hellmodus-Block entfernt

`@media (prefers-color-scheme: light)` war **zweimal** definiert — die
v8.1-Fassung und die neue, kontraststärkere von v8.2. Funktional gewann die
spätere Definition, gemessen greifen ausschließlich die neuen Werte. Es blieb
aber toter, widersprüchlicher Code: Wer die erste Definition ändert, sieht
keine Wirkung.

Die alte Definition ist entfernt. Die Kontraste sind unverändert (nachgemessen
gegen den Kartenhintergrund): **7,07 : 1 bis 17,48 : 1** — sämtlich über
WCAG AA (4,5 : 1), praktisch durchweg auf AAA-Niveau (7 : 1).

## 3 · Rechner: Einordnung ohne erfundene Schwellen

v8.2 hatte die pauschale 5-/50-/200-mA-Ampel entfernt — fachlich richtig, die
Schwellen waren nicht belegt. Für Auszubildende blieb damit aber eine nackte
Zahl ohne jede Einordnung.

Ergänzt wurde ein **optionales Feld „gemessener Gesamt-Ruhestrom"**. Ist es
gefüllt, zeigt der Rechner den **Anteil dieses Kreises am tatsächlich
gemessenen Gesamtstrom** — eine Einordnung aus echten Messwerten des Fahrzeugs
statt aus einer erfundenen Grenze:

- ohne Eingabe: Aufforderung zum Vergleich mit Gesamtstrom und OEM-Soll
- mit Eingabe: „entspricht ≈ 40 % des gemessenen Gesamt-Ruhestroms (250 mA)"
- übersteigt der berechnete Strom den eingegebenen Gesamtstrom: Hinweis auf
  Messwert, Bauform und Bezugsmessung

Die Plausibilitätsprüfung gegen den Sicherungs-Nennstrom bleibt unverändert
erhalten (verifiziert: 200 mV an 10 A ⇒ „unplausibel, 26,0 A über Nennstrom").

## Version und Tests

`APP_VERSION = 8.2.1-Profi` ↔ `APP_CACHE_NAME` ↔ `CACHE_NAME =
kfz-multimeter-profi-v8-2-1`, Paket 8.2.1.

Der Versions-Synchronitätstest im Validator verglich bisher nur bis zum ersten
Punkt (`replace(".","-")`) und hätte dreiteilige Versionen falsch bewertet —
korrigiert auf `split(".").join("-")`.

**Validator: 65 Prüfungen, alle bestanden** (v8.2: 62). Neu sind drei
Regressionen für genau die drei Nachbesserungen.

**Praktische Abnahme in Chromium** (360 × 640 und 390 × 844):
Offline-Neustart mit 70 Karten, Update v8.2 → v8.2.1 inklusive wartendem
Worker, Banner, Tastaturbedienung und Entfernen des alten Caches,
Fremdcache-Isolation gegen die Nachbar-App, keine Touchziele unter 44 px,
kein horizontaler Überlauf, 0 Konsolenfehler.
