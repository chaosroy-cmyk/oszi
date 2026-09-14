# CHANGELOG v8.6-Profi — Einsteiger/Profi-Modus, „Warum", Oszi-Abgrenzung, Schaltplan-Hilfe

**v8.6 = v8.5 plus vier Funktionsblöcke.** Kartenzahl, Diagnosebäume,
Glossar, Rechner, Sollwerte und Quellenmatrix sind gegenüber v8.5
**unverändert** (77 Karten, 15 Bäume). Eigener `CACHE_NAME`
`kfz-multimeter-profi-v8-6`, damit bestehende v8.5-Installationen das Update
angeboten bekommen.

Diese Funktionen wurden zuerst auf der v7.3-Linie entwickelt (Stand
„8.1-Profi", Tag `alt-linie-v8.1`) und für v8.6 vollständig auf den
ausgelieferten v8.5-Stand übertragen. Die Zwischenstände 8.0/8.1 der alten
Linie sind **kein** gültiger Updatepfad; ausgeliefert wird nur 8.5 → 8.6.

---

## 1 · Einsteiger-/Profi-Modus: dieselbe Karte, zwei Lesetiefen

- **Einsteiger-Modus ist Standard.** Neu je Karte: „So gehst du vor (6
  Schritte)" – Sicherheit klären, Multimeter einstellen, Messspitzen, Messen,
  Wert bewerten, nächster Schritt – als Kurzüberblick vor der eigentlichen
  Karte.
- **Profi-Modus** (Umschalter 🎓/🛠 im Kopf der App, in jeder Karte und in der
  Schaltplan-Hilfe): „Einfach erklärt" und der 6-Schritte-Ablauf werden
  ausgeblendet; „Warum messe ich das?", „Voraussetzungen", „Grenzen der
  Messung", Info-Hinweise, „Häufige Fehlerursachen" und „Wann Oszilloskop?"
  (bei Multimeter-Karten) sind **eingeklappt** und per „Aufklappen" erreichbar
  – nichts wird entfernt. Gefahrenhinweise, Messampel, Sollwertquelle,
  Einstellung, Messpunkte, Gut-/Schlechtwert, Richtwerte, Fehlersuche,
  Rechner und nächster Schritt bleiben in beiden Modi sichtbar. Die
  ausführliche Anleitung verhält sich wie bisher (offen im Einsteiger-, zu im
  Profi-Modus).
- Der Umschalter ist aus der unteren Navigation in den Kopf gewandert; der
  Platz unten gehört jetzt „Schaltplan". Gespeichert wird `mm_mode`
  (`beg`/`pro`); ein vorhandenes `mm_beginner` aus v8.5 wird beim ersten Start
  übernommen. Datenschutzentwurf entsprechend ergänzt.

## 2 · „Warum messe ich das?" auf allen 77 Karten

Je Karte zwei bis vier Sätze: welche Frage die Messung beantwortet, welches
Fehlerbild dahintersteckt, was man sich erspart (Teiletausch auf Verdacht).
Die Texte wurden in einem zweiten Durchgang aus Kfz-Meister-Sicht mit 25
Befunden korrigiert; sicherheitsrelevant darunter: Injektortyp vor der Messung
über Teilenummer/Schaltplan klären statt per Messung (Piezo tabu),
Glühkerzenstrom nur per Stromzange statt über die 10-A-Buchse, Ohm gegen Plus
nur spannungsfrei, Primärwiderstand nur bei 2-poligen Zündspulen messbar.
Keine neuen Freigabegrenzen; die redaktionelle Linie (keine universellen
Festgrenzen) gilt unverändert und wird vom Validator weiter geprüft.

## 3 · „Wann Oszilloskop?" und Übersicht „Multimeter oder Oszilloskop?"

- Auf 64 Karten ein Abschnitt (56 davon mit Link), der fachlich begründet, was das Multimeter an
  dieser Stelle nicht sieht (Mittelwert statt Signalform, Flanken, Tastgrad,
  Aussetzer, Busrahmen, Einschaltströme) – mit Direktlink auf die passende
  Messkarte (`../index.html#pg-karten~c-…`) bzw. das Fehlermuster
  (`#pg-fdb~f-…`) im KFZ-Oszilloskop-Kompendium. Der Validator prüft jeden
  Link gegen `KARTEN`/`FEHLERDB` des Kompendiums.
- Neue Übersicht „Multimeter oder Oszilloskop?" (Startseite und
  Diagnose-Menü): Faustregel, Entscheidungstabelle nach Messaufgabe, alle
  Karten nach Eignung gruppiert. Die App bleibt ein reines
  Multimeter-Werkzeug: keine Oszi-Anleitungen, nur die Abgrenzung mit Link.

## 4 · Kapitel „Schaltpläne verstehen" (Navigationspunkt „Schaltplan")

Neun Kapitel, weil jede Messung im Schaltplan beginnt:

| Kapitel | Inhalt |
|---|---|
| Lesen | Aufgelöster Stromlaufplan in 10 Schritten (Potentialschienen, Strompfade, Massepunkte, Leitungsverbindungen, Steuergeräte-Innenschaltung) |
| Klemmen | 26 Klemmenbezeichnungen nach DIN 72552 mit Sollzustand bei Zündung aus/an/beim Starten |
| Farben | 14 Leitungsfarben (DIN-Kürzel, englische Kürzel, Farbfeld) und 8 Beschriftungsregeln (Streifen, Querschnitt, verdrillt, geschirmt, orange = HV, gelb = Airbag) |
| Symbole | 25 Schaltzeichen als SVG, antippen zeigt Bedeutung und passende Multimeter-Messung |
| Relais | Interaktives Relais (Pin antippen → Rolle und Sollwert), 7 Bauarten, 7-Schritt-Prüfung, Verweis auf die Karte „Relais prüfen" |
| Stecker & Hersteller | 9 Schreibweisen (T94/3, X1234, C123-4, N3/10x1/5, Massepunkte, Splices, PSA-Nummern) und Eigenheiten von VAG, BMW, Mercedes, Ford, Stellantis, asiatischen Herstellern, Werkstattdatenbanken |
| Plan → Messung | Fertige Messpläne für 8 Bauteiltypen: Pin, Fahrzeugzustand, Sollwert, Deutung bei Abweichung |
| Fallen | 12 typische Fehldeutungen (12 V beidseitig bei massegeschaltetem Verbraucher, Pull-up bei abgestecktem Sensor, gespiegelte Pin-Zählung, Ruhezustand im Plan …) |
| Quiz | 12 Fragen mit Erklärung und Auswertung |

Die Suche findet Klemmen, Farben, Symbole und die Kapitel. Alle Zahlen im
Kapitel sind Orientierungswerte (siehe Nachtrag in `SOURCES.md`).

## 5 · Validator

`validate.js` um Abschnitt 21 erweitert (174 statt 153 Prüfungen): Warum auf
jeder Karte, Oszi-Begründung auf jeder Oszi-Karte, Oszi-Links gegen das
Kompendium, Profi-Modus blendet aus/klappt ein/lässt Gefahren sichtbar,
Einsteiger-Modus zeigt alles, Umschalter vorhanden, Übersicht vollständig,
alle Schaltplan-Kapitel rendern, Relais-Pin, Messpläne, Quiz-Durchlauf,
Symbol-SVGs, Suche, Standardmodus. `baseline.json` unverändert (keine Karte
hinzugekommen oder entfallen).

## 6 · Versionen

| Stelle | Wert |
|---|---|
| `APP_VERSION` | `8.6-Profi` |
| `APP_CACHE_NAME` / `sw.js` `CACHE_NAME` | `kfz-multimeter-profi-v8-6` |
| `package.json` | `8.6.0` |
| `DATA_STAND` | `14.09.2026` (neue Texte; Primärquellen zuletzt am 09.08.2026 geprüft) |

Loop-Prompt für weitere Runden: `PROMPT.md`.
