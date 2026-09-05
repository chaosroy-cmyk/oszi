# CHANGELOG v8.11-Profi — Personen- und Brandgefahr gehört in den Warnblock

## Die zurückgestellte Grundsatzfrage, jetzt entschieden

Runde 1 hatte eine Frage offengelassen: Mehrere Karten führten Brand- und
Verletzungsgefahren ausschließlich im `dont`-Block, ohne sichtbaren Warnblock.
War das Hauskonvention oder Lücke? Die Frage wurde bewusst nicht im
Vorbeigehen beantwortet, sondern mit einer Bestandsaufnahme.

**Ergebnis:** Von zwölf Karten, die eine Personen- oder Brandgefahr im
`dont`-Block nennen, trugen **neun** bereits einen sichtbaren Warnblock dazu —
`batterie`, `starter`, `relais-leistung`, `raildruck`, `injektor-benzin`,
`injektor-diesel`, `zuendspule`, `luefter` und der Rest. Nur vier fielen heraus.

Das ist keine Konvention, das ist eine Lücke. Die tragende Regel des Bestands
lautet: **`dont` ist für das, was Bauteile beschädigt — `warn` für das, was
Menschen verletzt oder brennt.**

## Die vier Ausreißer

| Karte | Gefahr im `dont` | Warnblock |
|---|---|---|
| `tankgeber` | „keine Funken/Zündquellen am offenen Tank – **Explosionsgefahr**" | **keiner** |
| `kraftstoffpumpe` | „keine Funken am Kraftstoffsystem" | **keiner** |
| `lambda-sprung` | „heiße Abgasteile nicht berühren" | **keiner** |
| `agt` | „nicht am heißen Abgasstrang arbeiten" | **keiner** |

Dazu `klimadruck`, das den Kältemittelkreis nur indirekt absichert
(„nicht ohne Klimaservicegerät öffnen"), ohne die eigentliche Gefahr zu nennen.

Besonders `tankgeber` sticht heraus: Die Karte schrieb das Wort
„Explosionsgefahr" selbst in ihren `dont`-Block — und zeigte dem Anwender
trotzdem keine Warnung.

## Änderungen

- **`tankgeber`** — `danger`: Am geöffneten Tank steht ein zündfähiges
  Benzindampf-Luft-Gemisch. Keine Funken, keine Flamme, keine Schaltvorgänge in
  Tanknähe (auch Relais und Prüflampe zünden), Batterie nach OEM-Prozedur ab,
  belüften, Löschmittel bereit. `risk` von `mittel` auf `hoch`.
- **`kraftstoffpumpe`** — `danger` zu Kraftstoff, Dämpfen und Restdruck (bei
  Direkteinspritzern mehrere hundert bar) mit OEM-Druckabbau; `caution` gegen
  Trockenlauf beim Dauerbestromen. `risk` von `mittel` auf `hoch`.
- **`lambda-sprung`** — `caution`: Die Sonde ist nur betriebswarm
  aussagekräftig, genau dann sind Sonde und Abgasrohr mehrere hundert Grad heiß.
  Zusätzlich der Praxishinweis, dass heiß ausgebaute Sonden oft im Gewinde
  abreißen.
- **`agt`** — `caution`: Der Sensor sitzt dort, wo es am heißesten ist; die
  Ohm-Messung verlangt ohnehin den abgekühlten Strang.
- **`klimadruck`** — `caution`: Erfrierungen an Haut und Augen, R1234yf
  zusätzlich entzündlich, Servicearbeiten nur mit zugelassenem Gerät.

**Gegenprobe gegen Überwarnung:** Jede der fünf Karten benennt weiterhin
ausdrücklich, dass die elektrische Prüfung selbst zulässig ist — bei
`tankgeber` sogar wörtlich: „Die Ohm-Messung selbst am ausgebauten Geber ist
unkritisch, der geöffnete Tank ist es nicht." Der Validator prüft das.

## Nachgezogen: Abfallgrenzen in den Aktorkarten

`luefter` (fs 2) und `hupe` (fs 2 und 3) trugen noch feste Grenzen
(„< 0,2 V → ok", „< 0,3 V → ok") aus der Zeit vor v8.5. Sie sind jetzt an die
Vorgabe des jeweiligen Kreises gebunden — wie in `spannungsabfall` seit v8.5
und in `batterie`/`generator`/`starter` seit v8.7.

Damit verbleibt projektweit **eine einzige** feste Abfallgrenze in einem
Arbeitsschritt: `leitung` fs 9. Sie gehört zu Runde 9.

## Regression

`validate.js` Abschnitt 26, 10 Prüfungen (137 → 147). Die Leitprüfung ist
verallgemeinert: **jede** Karte, die eine Personen- oder Brandgefahr im
`dont`-Block nennt, muss einen sichtbaren Warnblock tragen. Drei weitere
Prüfungen sichern die Gegenrichtung ab, damit aus der Warnung keine
Arbeitsverhinderung wird.
