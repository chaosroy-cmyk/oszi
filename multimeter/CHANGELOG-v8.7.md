# CHANGELOG v8.7-Profi — Energie: Tabelle und Arbeitsschritte sagen dasselbe

## Ausgangslage

In `batterie`, `generator` und `starter` waren die Richtwerttabellen bereits
sauber auf „nach OEM-Vorgabe" umgestellt. Die **Anleitungs- und
Fehlersuchschritte** derselben Karten verteilten aber weiter harte Grenzen:

| Karte | Stelle | Alte Aussage |
|---|---|---|
| `starter` | anl 3 | „Plus-Spannungsabfall … beim Startvorgang messen. **< 0,5 V**." |
| `starter` | anl 4 | „Masse-Spannungsabfall … beim Starten. **< 0,2 V**." |
| `starter` | fs 1 | ok `≥10 V → weiter` / ng `<9,6 V → Batterie/Klemmen` |
| `starter` | fs 2 | ok `>8 V → Ansteuerung ok` |
| `starter` | fs 3/4 | ok `<0,5 V → ok` / `<0,2 V → ok` |
| `generator` | anl 5/6 | „< 0,3 V" bzw. „< 0,2 V" |
| `batterie` | anl 4, fs 3 | „**< 0,1 V** = guter Kontakt" |

Besonders deutlich bei `starter`: Die Tabelle bezeichnet 9,6–10 V ausdrücklich
als „verbreiteten Orientierungswert, **keine allgemeingültige Bestehensgrenze**"
— und zwei Zeilen weiter benutzte die Fehlersuchkette genau diese Zahl als
Bestehensgrenze.

## Warum das zählt

Ein Monteur arbeitet die **Schritte** ab, nicht die Tabelle. Die Umstellung auf
OEM-Bindung war also genau dort nie angekommen, wo sie wirkt. Die Karte sagte
an einer Stelle „das ist keine Grenze" und an der anderen „unter diesem Wert
ist es defekt".

## Änderungen

Alle zehn Stellen an die jeweilige Tabelle angeglichen und, wo möglich, an ein
belegtes Herstellerbeispiel gebunden (HELLA Techworld, Klemme 31, 12 V):

- **`starter`**: Pluskabel Batterie→Hauptanschluss Starter 0,5 V,
  Batterieminus→Startergehäuse 0,3 V, Startergehäuse→Karosserie 0,1 V — jeweils
  als Herstellerbeispiel benannt, OEM-Vorgabe hat Vorrang. Startspannung und
  Kl.50 sind jetzt Orientierung statt Bestehensgrenze; die Austauschentscheidung
  bleibt beim definierten Last-/Leitwerttest.
- **`generator`**: Pluskabel Batterie→Hauptanschluss Generator 0,4 V,
  Batterieminus→Generatorgehäuse 0,3 V, Gehäuse→Karosserie 0,1 V — analog.
- **`batterie`**: Die Polklemmenprüfung ersetzt die feste 0,1-V-Grenze durch das
  fachlich tragfähigere Kriterium: Seitenvergleich Plus gegen Minus und
  Nachmessen unter gleicher Last nach dem Reinigen. Im Messpfad liegt dort nur
  eine einzige Klemmverbindung — der Vergleich ist aussagekräftiger als eine
  Zahl, die den Startstrom nicht kennt.

**Nicht angetastet:** `batterie` fs 1 („< 12,4 V → laden & Ruhestrom prüfen").
Das ist keine Defektentscheidung, sondern eine Handlungsschwelle aus der
belegten SOC-Tabelle (GS Yuasa).

## Regression

`validate.js` Abschnitt 22, 7 Prüfungen (108 → 115). Die Leitprüfung ist
verallgemeinert: **keine** Karte mit OEM-gebundener Tabelle darf in ihren
Anleitungs- oder Fehlersuchschritten noch eine feste Abfallgrenze unter 1 V
tragen. Damit fällt derselbe Widerspruch künftig überall auf, nicht nur in
diesen drei Karten.

## Geprüft und für korrekt befunden

`starter-drop-profi` war bereits durchgehend OEM-gebunden — Tabelle **und**
Schritte. Die Karte diente als Vorbild für die Angleichung der anderen.
`generator` behandelt intelligente Ladesysteme (LIN/BSD/BMS, Rekuperation)
fachlich richtig und warnt zutreffend, dass AC-Ripple am Multimeter nur ein
Grobtest ist.
