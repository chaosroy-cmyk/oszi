# CHANGELOG v8.5-Profi — Spannungsabfall: Grenzen gehören zum Kreis, nicht zur Faustzahl

## Ausgangslage

Die Basiskarte `spannungsabfall` — im eigenen Text „Wichtigste Profi-Messung!" —
gab absolute Abfallgrenzen als Ampelurteil aus:

| Zeile der alten Tabelle | Bewertung |
|---|---|
| Sensorsignal/-versorgung < 0,1 V | grün |
| Normalverbraucher Plus < 0,2–0,3 V | grün |
| Masseband/Massepunkt < 0,1–0,2 V | grün |
| Kompletter Massepfad Verbraucher < 0,3 V | grün |
| Starterkreis (Hochstrom) < 0,5 V Plus, < 0,2 V Masse | Warnung |
| **> 0,5 V Signalkreis** | **kritisch (rot)** |

Dazu die Notiz: „Faustregel: je 0,1 V Verlust = relevant bei kleinen Strömen."

## Warum das ein Fehler ist

Der zulässige Spannungsabfall ist **kreisabhängig**, weil er am Strom hängt:
`U = I × R`. Dieselben 0,5 V bedeuten an einer Signalleitung einen schweren
Übergangswiderstand und an einem Starterkabel gar nichts.

HELLA Techworld — eine Quelle, die bereits in `SOURCES.md` steht und die
Generator- und Ladesystemkarten trägt — führt dazu eine Tabelle zulässiger
Spannungsabfälle für 12-V-Fahrzeuge:

| Kreis | Zulässiger Abfall |
|---|---|
| Startergehäuse → Karosserie/Motorblock (Minuskabel) | 0,1 V |
| Batterieminus → Startergehäuse | 0,3 V |
| Batterieplus → Hauptanschluss Starter (Pluskabel) | 0,5 V |
| **Hauptanschluss Starter unter Last (beim Startvorgang)** | **3,5 V** |
| Generatorgehäuse → Karosserie/Motorblock (Minuskabel) | 0,1 V |
| Batterieplus → Hauptanschluss Generator (Pluskabel) | 0,4 V |
| Lichtschalter Kl.30 → Leuchtmittel **unter** 15 W | 0,1 V (gesamt 0,6 V) |
| Lichtschalter Kl.30 → Leuchtmittel **über** 15 W | 0,5 V (gesamt 0,9 V) |
| **Zündschalter → Steuerstromanschluss Starter** | **1,5 V** |

Daraus folgen zwei konkrete Fehlalarme der alten Karte:

- Am **Hauptanschluss des Starters unter Last** erlaubt der Hersteller 3,5 V.
  Die Karte stufte bereits ab 0,5 V auf Warnung — das **Siebenfache**
  Sicherheitsmargin wurde als Verdacht ausgegeben.
- Am **Steuerstromkreis vom Zündschalter zum Starter** erlaubt der Hersteller
  1,5 V. Die Karte bewertete „> 0,5 V Signalkreis" als **kritisch (rot)** —
  ein intakter Kreis wäre als defekt verurteilt worden.

Die Spanne innerhalb **eines** Systems belegt das Prinzip am deutlichsten:
derselbe Lichtkreis darf unter 15 W nur 0,1 V verlieren, über 15 W aber 0,5 V.
Faktor fünf, gleiche Bauart, gleicher Schalter — nur ein anderer Strom.

## Widerspruch im eigenen Bestand

Die App hatte das Prinzip an anderer Stelle bereits korrekt formuliert. Die
Karte `relais-leistung` aus v8.3 sagt wörtlich: „Absolute Abfallgrenzen sind
strom- und fahrzeugabhängig – ohne OEM-Vorgabe zählt der Vergleich mit einem
intakten Kreis und die tatsächliche Verbraucherleistung."

Ebenso wurde `sensor-masseversatz` die feste `< 50 mV`-Freigabegrenze bewusst
entzogen; `validate.js` bewacht das seit v8.2. Nur die Basiskarte, von der alle
anderen die Methode lernen, verteilte weiter Universalgrenzen.

## Änderungen

**`spannungsabfall`**

- Richtwerttabelle vollständig ersetzt: 10 **kreisbezogene** Zeilen nach der
  HELLA-Tabelle statt 6 Zeilen nach Bauteilklasse. Kopfzeile weist die Werte
  als „Herstellerbeispiel HELLA (12 V)" aus, Spalte 3 heißt jetzt
  **Prüfpriorität** statt „Bewertung".
- Tabellennotiz verneint die Allgemeingültigkeit ausdrücklich, nennt den
  Vorrang des OEM-Prüfplans und erklärt die Stromabhängigkeit am
  Lichtkreis-Beispiel.
- Neuer Anleitungsschritt: gegen die Vorgabe **dieses** Kreises bewerten, nicht
  gegen eine Faustzahl. Ohne OEM-Vorgabe: Vergleich mit einem baugleichen
  intakten Kreis — dieselbe Ersatzregel wie in `relais-leistung`.
- `good` und `bad` binden die Bewertung an den Kreis statt an feste Zahlen.
- Neuer `caution`-Block gegen die Übertragung von Faustzahlen auf fremde Kreise.
- Fehlersuchkette: „Wert niedrig → ok" wurde zu „unter der Vorgabe dieses
  Kreises → ok".
- `requires` und `limits` um die fehlende Voraussetzung ergänzt: Ohne Vorgabe
  für den konkreten Kreis ist der Messwert nicht bewertbar.
- `sourceRef` ergänzt.

**Sachfehler nebenbei korrigiert:** Anleitung und `dont` behaupteten, ohne Last
sei der Wert „immer 0". Das gilt nur für eine **intakte** Leitung. Ist die
Leitung **unterbrochen**, zeigt dieselbe Messung auch ohne Last nahezu die
volle Bordspannung — kein Spannungsabfall, sondern ein Leitungsbruch. Beide
Stellen benennen die Ausnahme jetzt.

**`SOURCES.md`** — neue Zeile mit der vollständigen HELLA-Tabelle als
Herstellerbeispiel, samt Hinweis auf die Stromabhängigkeit und den Vorrang des
OEM-Prüfplans.

**`validate.js`** — neuer Abschnitt 20, 15 Prüfungen (86 → 101). Sie sichern
beide Richtungen: dass die alten Universalzeilen weg sind **und** dass die
kreisbezogenen Werte samt Stromabhängigkeit, Ersatzregel und
Prüfprioritäts-Semantik vorhanden bleiben.

Nachweis der Wirksamkeit: Gegen den Stand vor dieser Änderung schlagen 14 der
15 neuen Prüfungen fehl.

## Bewusst nicht geändert

Die übrigen Karten führen weiterhin absolute Abfallgrenzen (`< 0,2 V` und
ähnlich, projektweit rund 27 Fundstellen). Diese Umstellung ist eine eigene,
zusammenhängende Aufgabe und keine Beifang-Änderung — sie gehört in eine
Runde, die alle betroffenen Karten gemeinsam und einheitlich anfasst.
Vermerkt in `VERBESSERUNGS-LOG.md`.
