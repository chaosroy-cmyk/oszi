# CHANGELOG v8.3-Profi — Relais-Kartensatz

## Ausgangslage

Die Karte hieß „Sicherung / Relais prüfen" und behandelte zwei Bauteile mit
völlig verschiedenen Fehlerbildern gemeinsam. Von 10 Anleitungsschritten
entfielen nur 4 auf das Relais, von 5 Richtwertzeilen nur 2 — beide teilten
sich eine Fehlerursachenliste und eine Fehlersuchkette. Neun weitere Karten
verwiesen auf Relais, ohne dass ein sauberes Sprungziel existierte.

Fachlich fehlten genau die Unterscheidungen, die das **Messverfahren** ändern:
Öffner und Wechsler (Klemme 87a kam in der ganzen App nicht vor),
Doppelschließer, Freilaufdiode, Parallelwiderstand über der Spule und
Halbleiter-/Steuergeräteausgänge.

## Entflechtung

`sicherung` heißt jetzt **„Sicherung prüfen"** und behandelt ausschließlich die
Sicherung: Anleitung von 10 auf 6 Schritte, Relaisinhalte aus `rt`, `urs`, `fs`
und dem Einsteigertext entfernt. Die Fehlersuchkette endet mit der Abgrenzung
zum geschalteten Kreis und verweist dorthin.

## Vier neue Karten (Kategorie Strom/Versorgung)

| Karte | Inhalt |
|---|---|
| **`relais`** — Relais prüfen | Methodenkarte, 11 Anleitungsschritte. Bauart als Schritt 0, Klemmenzuordnung nach DIN 72552, Ansteuerung, Hörprobe, Spulenwiderstand nur spannungsfrei und nur mit Sollwert, Freilaufdiode im Diodentest, **Kontakt unter Last (30→87)** als entscheidender Schritt, Ruhezustand nach Bauart, Sockel, Gegenprobe vor dem Austausch |
| **`relais-typen`** — Relaistypen verstehen | Lernkarte, 8 Schritte. Schließer, Öffner, Wechsler, Doppelschließer mit Klemmen und Ruhezustand; Freilaufdiode und Parallelwiderstand mit ihren Folgen für Polarität und Messung; ausdrücklich: die Bauform ist kein Prüfkriterium |
| **`relais-leistung`** — Leistungsrelais (Hochstrom) | Starter-, Vorglüh-, Lüfterrelais. `tag:gef`, Risiko hoch, roter Gefahrblock: Strom nur mit der Stromzange, niemals über die A-Buchse. Kontaktabfall unter realer Last, Sockelbeurteilung, Temperaturkontrolle, Vorher-Nachher-Nachweis |
| **`relais-elektronisch`** — Elektronische und Halbleiter-Relais | Halbleiterausgänge, ECU-Endstufen, Zeit-, Blink- und bistabile Relais. Kernaussage: **kein Klicken und kein Spulenwiderstand sind hier normal und kein Defektbeweis.** Prüfung über Versorgung, Masse, Ansteuersignal und Stellgliedtest; LED-Umbau und Ausfallerkennung erklärt |

## Diagnosebaum `relais-schaltet-nicht`

13 Knoten, Einstieg über die **Bauart** statt über einen Messwert — konsistent
zu `5v-kurzschluss` und `generator-laedt-nicht`. Getrennte Pfade für: kein
Klicken (Spulenkreis oder Ansteuerung), klickt aber Verbraucher tot oder schwach
(Kontakt unter Last), Halbleiterausgang (fehlendes Klicken ist dort normal).
Der Sockel wird vor jedem Relaistausch ausgeschlossen.

## Warum kein Kartensatz nach Bauform

Micro, Mini, Standard, 4- oder 5-polig unterscheiden sich in Größe und
Strombelastbarkeit, **nicht im Messverfahren**. Ein Kartensatz nach Bauform
hätte dieselbe Anleitung mehrfach dupliziert und die Werte auseinanderlaufen
lassen — und wäre derselbe Fehlschluss wie „Pinzahl = Sensortyp", den die App
beim Raddrehzahlsensor bereits ausdrücklich korrigiert. Fünf Pins bedeuten
nicht automatisch Wechsler: Doppelschließer sind ebenfalls fünfpolig.

Geschnitten wird deshalb nach **elektrischer Konstruktion**, mit Typbestimmung
als Schritt 0.

## Werte

Keine neuen Zahlenwerte. Spulenwiderstand (Beispiel 60–120 Ω) und
Kontaktabfall (Beispiel < 0,2 V) sind in den Karten ausdrücklich als Beispiele
gekennzeichnet und stehen unter OEM-Vorbehalt. `SOURCES.md` führt neu
**DIN 72552** für die Klemmenbezeichnungen — die Norm regelt die Bezeichnung,
keine Sollwerte.

## Tests

**Validator: 78 Prüfungen, alle bestanden** (v8.2.1: 65). Neu sind 13
Regressionen: Vorhandensein und Mindesttiefe der vier Karten, Entflechtung der
Sicherungskarte, Baumeinstieg über die Bauart, Gefahrklassifizierung des
Leistungsrelais, keine toten Verweise auf den alten Kartennamen sowie die
Abdeckung der fünf messrelevanten Bauartmerkmale (87a, Doppelschließer,
Freilaufdiode, Parallelwiderstand, Halbleiter).

Zusätzlich wurde die Versionsprüfung von `SOURCES.md` an `APP_VERSION`
gekoppelt — sie war auf „v8.2" festverdrahtet und hätte jede weitere
Versionsanhebung fälschlich beanstandet.

**Praktisch in Chromium bestätigt:** Offline-Neustart mit **74 Karten**,
Update v8.2.1 → v8.3 inklusive wartendem Worker, Banner und Tastaturbedienung,
Fremdcache-Isolation, keine Touchziele unter 44 px bei 360 × 640, kein
horizontaler Überlauf, 0 Konsolenfehler, 15 Diagnosebäume geladen.

## Version

`APP_VERSION = 8.3-Profi` ↔ `APP_CACHE_NAME` ↔ `CACHE_NAME =
kfz-multimeter-profi-v8-3`, Paket 8.3.0.
