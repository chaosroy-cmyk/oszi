# CHANGELOG v8.20-Profi — Einsteigertexte: die Vereinfachung darf nicht falsch werden

Die 74 Einsteigertexte (`beg`) sind der erste Kontakt für Anfänger — und waren in
beiden Durchgängen noch nie systematisch fachlich geprüft. Sie sind genau die
Stelle, an der eine gut gemeinte Vereinfachung technisch falsch werden kann.

## Befund 1 · `kw-ind`: „erzeugt seinen **Strom** selbst"

Ein Induktivgeber erzeugt eine **Spannung** — das vorbeilaufende Geberrad ändert
das Magnetfeld in der Spule, daraus entsteht eine Induktionsspannung. **Strom**
fließt erst in eine Last, und das Multimeter belastet die Spule praktisch nicht.

Die Karte weiß das an zwei anderen Stellen richtig:

- Feld `was`: „Induktivgeber erzeugt beim Drehen selbst eine **Wechselspannung**."
- Glossar „Induktivgeber": „Sensor, der beim Drehen selbst **Wechselspannung**
  erzeugt."

Nur die Vereinfachung für Anfänger war falsch — ausgerechnet auf einer Karte,
deren eigentliche Messung eine **AC-Spannungsmessung** ist. Wer als Einsteiger
lernt, hier werde Strom erzeugt, sucht am Messgerät die falsche Betriebsart.

**Änderung:** Der Text nennt jetzt die erzeugte Spannung, erklärt die Induktion
in einem Satz und sagt ausdrücklich, dass dabei kaum Strom fließt, weil das
Multimeter die Spule nicht belastet.

## Befund 2 · `ref5v`: Satzfragment im Einsteigertext

Der Text endete mit „**Einzeln absteckmethode.**" — kein Satz, sondern ein
Wortpaar. Im Einsteigertext, wo Verständlichkeit die einzige Aufgabe ist.

**Änderung:** Das Verfahren steht jetzt als Handlung da — Sensoren einzeln
abstecken, nach jedem Schritt erneut messen, und kommt die Spannung zurück, war
es der zuletzt getrennte.

## Geprüft und für richtig befunden

Ein Verdacht bestätigte sich **nicht**: Der Einsteigertext von `hupe` spricht von
einer „Lampe, die schwach leuchtet". Das sah nach einer Verwechslung aus — die
Karte heißt aber **„Hupe / Lampen / LED"** und deckt beides ab; ihre
Ursachenliste nennt folgerichtig „Lampe schwach, Hupe leise". Kein Befund,
keine Änderung.

Die übrigen 72 Texte wurden durchgesehen. Stichhaltig unter anderem: `pwm`
(„zeigt z.B. 6 V statt 12 V" — korrekter Mittelwert bei 50 % Tastverhältnis),
`ptc-heizung` („kalt zieht er viel, warm immer weniger" — richtiges
PTC-Verhalten), `stromzange-dc` („weil sich die Felder aufheben"),
`sensor-masseversatz` („Wenn die Masse des Sensors nicht wirklich Masse ist,
lügt der Sensor"), `oeldruck` („zählt nur die Manometer-Messung, nicht die
Hoffnung auf einen kaputten Schalter").

## Regression

`validate.js` Abschnitt 37, 8 Prüfungen (218 → 226). Darunter eine
verallgemeinerte: **Kein Einsteigertext darf aus einer erzeugten Spannung einen
erzeugten Strom machen** — geprüft gegen das Feld `was` jeder Karte. Dazu die
Grundanforderungen: Jede Karte hat einen ausformulierten Einsteigertext, und
jeder endet mit einem Satzzeichen.
