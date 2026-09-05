# CHANGELOG v8.14-Profi — Die Suche findet jetzt, was in der App steht

## Ausgangslage

Der Suchindex umfasste nur die **Kopffelder** einer Karte: `nm`, `was`, `id`,
`mess`, `next`, `syn` und die Meta-Listen `quality`, `risk`, `requires`,
`limits`, `dont`.

Nicht durchsucht wurden:

- die gesamten **`DEEP`-Inhalte** — Anleitung, Richtwerttabellen samt Notizen,
  Ursachenlisten, Fehlersuchketten,
- die Kartenfelder **`good`, `bad` und `beg`**.

Das ist der weitaus größte Teil des Textes der App.

## Was das praktisch bedeutete

Ein Monteur tippt ein, was er am Fahrzeug vor sich hat. Diese Begriffe **stehen
in der App** — und lieferten trotzdem null Treffer:

| Suchbegriff | steht in | Treffer alt | neu |
|---|---|---|---|
| `AGM` | Ladetabelle der Karte `batterie` | 0 | 1 |
| `Wegfahrsperre` | Notiz der Karte `starter` | 0 | 1 |
| `Rekuperation` | Anleitung der Karte `generator` | 0 | 1 |
| `Schleifring` | Ursachenliste `srs-airbag` | 0 | 1 |
| `Common Rail` | `raildruck`, `injektor-diesel` | 0 | 2 |
| `TFSI` | `injektor-benzin`, `map` | 0 | 2 |
| `Spannungsteiler` | `ntc-kts`, `pullup-pulldown` | 0 | 2 |
| `Sulfatierung` | Ursachenliste `batterie` | 0 | 1 |
| `Nullabgleich` | `widerstand`, `stromzange-dc` | 0 | 3 |
| `Open Collector` | `hall` (seit v8.9) | 0 | 2 |

Die App kannte die Antwort — sie war nur nicht auffindbar. Für ein
Werkstatt-Nachschlagewerk ist das die teuerste Sorte Fehler: Der Inhalt ist da,
die Arbeit steckt drin, und der Anwender findet ihn nicht.

Besonders bitter: Das Feld `syn` existiert eigens für die Suche und war in der
**ersten** Definition von `filterTests` ebenfalls nicht enthalten. Erst eine
spätere Überschreibung nahm es auf — die Tiefeninhalte aber nie.

## Änderung

Ein **einmalig aufgebauter Suchindex** über den gesamten Karteninhalt
einschließlich `DEEP`. HTML-Auszeichnung aus den Anleitungstexten wird beim
Aufbau entfernt, damit `<b>` nicht als Suchtreffer zählt.

Einmalig statt pro Tastendruck: Der Index ändert sich zur Laufzeit nicht, und
74 Karten samt Tiefeninhalten bei jedem Anschlag neu zu serialisieren wäre auf
dem Handy spürbar. Die Mehrwortsuche (alle Begriffe, Reihenfolge egal) bleibt
unverändert.

## Regression

`validate.js` Abschnitt 29, 15 Prüfungen (161 → 176):

- Der Index deckt alle 74 Karten ab und enthält für jede tatsächlich den
  Anleitungstext — geprüft, indem aus dem letzten Anleitungsschritt jeder Karte
  ein Wort gezogen und im Index gesucht wird.
- HTML-Auszeichnung ist entfernt.
- Zehn Begriffe, die **ausschließlich** in den Tiefeninhalten stehen, müssen
  Treffer liefern.
- Gegenprobe: Ein Unsinnsbegriff liefert weiterhin null Treffer — die Suche darf
  nicht einfach alles finden.
- Alle 74 Kartennamen bleiben auffindbar.

## Geprüft und für korrekt befunden

- Alle 74 Kartennamen waren schon vorher auffindbar.
- Die Querverweis-Chips (`linkifyRefs`) lösen sämtlich auf gültige Ziele auf —
  das prüft `validate.js` seit v8.2, und der in v8.9 ergänzte Verweis von `hall`
  auf `pullup-pulldown` wurde beim Einbau auf den exakten Kartennamen gezogen,
  damit der Chip den ganzen Begriff umfasst.
- 14 der 74 Karten führen ein `syn`-Feld mit Synonymen und Fehlercodes; diese
  Pflege bleibt sinnvoll, weil sie Begriffe ergänzt, die sonst nirgends im Text
  vorkommen (etwa `P0130` oder `Arbeitsstromrelais`).
