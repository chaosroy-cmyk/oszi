# CHANGELOG v8.17-Profi — Zweiter Durchgang: Begriffsschärfe und die letzten Festgrenzen

## Befund 1 · „stromlos" ist nicht „spannungsfrei"

Die Karte `widerstand` sagte im Feld `was`: „Wert eines Bauteils/Leitung im
**stromlosen** Zustand prüfen." Ihr eigenes Feld `mess` fordert dagegen richtig:
„**NUR spannungsfrei!**"

Das ist kein Wortspiel. Ein Ohmmeter speist einen eigenen Prüfstrom ein und
misst den Spannungsabfall darüber. Eine anliegende **Fremdspannung** überlagert
diesen Prüfstrom und verfälscht das Ergebnis — auch dann, wenn gerade **kein
Strom fließt**. Ein Kreis mit offenem Verbraucher ist stromlos und trotzdem
spannungsführend. Für die Ohm-Messung ist Spannungsfreiheit die Bedingung,
Stromlosigkeit genügt nicht.

Betroffen und korrigiert:

- **`widerstand`** `was` — die Kernaussage der Basiskarte für Ohm-Messungen.
- **`magnetventil`** — „Spule misst man stromlos (Ohm)." Der Einsteigertext
  erklärt jetzt den Unterschied ausdrücklich, statt ihn nur zu vermeiden.
- **`can`** — „Schnelltest am HS-CAN: stromlos zwischen High und Low messen."
- **`ref5v-plusschluss`** und **`ref5v-vergleich`** — „einspeisende Leitung
  stromlos machen": Bei einer Fremdeinspeisung ist Spannungsfreiheit das Ziel.

**Nicht geändert**, weil dort korrekt: `relais` („87 stromlos" beschreibt den
unbestromten Ruhezustand der Spule), `spannung` („der letzte spannungslose
Abschnitt") und `sicherung` („bei ausgeschalteter Zündung zu Recht
spannungslos").

## Befund 2 · Neun Festgrenzen, die alle bisherigen Prüfungen überlebt hatten

Die projektweite Regel gegen ungebundene Abfallgrenzen wurde über vier Runden
aufgebaut — und war jedes Mal **unvollständig**:

| Fassung | prüfte | übersah |
|---|---|---|
| v8.7 (Runde 4) | `anl`, `fs` bei OEM-gebundenen Tabellen | alles andere |
| v8.12 (Runde 9) | `anl`, `fs` projektweit | Kopffelder, Tabellen, Meta, Bäume |
| **jetzt** | **alles** | — |

Dadurch überlebten neun Grenzen:

- `masse` **`good`**: „< 0,1–0,2 V unter Last" — während die Tabelle derselben
  Karte korrekt „OEM-Grenze für Kreis und Last verwenden" sagt.
- Acht Tabellenzeilen: `ptc-heizung`, `luefter`, `kraftstoffpumpe`,
  `motor-allg`, `leitung` (je „Masseabfall unter Last < 0,2 V"), `hupe`
  (Plus < 0,3 V und Masse < 0,2 V), `relais` („Beispielzielwert < 0,2 V").

Alle neun sind jetzt an die Vorgabe des jeweiligen Kreises gebunden, mit dem
Vergleichskreis als Ersatzregel. Die Prüfung erfasst ab sofort **Kopffelder,
Richtwerttabellen samt Notizen, Warnblöcke, Voraussetzungen, Grenzen, Verbote
und sämtliche Baumknoten**.

## Befund 3 · `radsensor`: Ohm fehlte in der Geräteeinstellung

Die Karte schreibt für sicher passive Geber eine Spulen-Ohm-Messung vor, führte
in `set.mode` aber nur „DC V / AC V / ggf. mA". Ergänzt um „Ohm nur bei sicher
passivem Geber" — mit dem Vorbehalt, der den Sinn der Karte trägt.

## Neu abgesichert, ohne Reparaturbedarf

Die Tabelle „≈ mV pro 100 mA" der Karte `ruhestrom-fuse` ist aus `FUSE_TYPES`
ableitbar: `U[mV] = R[mΩ] / 10`. Sie war **korrekt** — aber nirgends gesichert;
eine Änderung an `FUSE_TYPES` hätte sie stumm falsch werden lassen.

Der Validator rechnet jetzt alle sieben Zeilen nach. Zeilen wie
„Mini/Standard 3 A" decken zwei Bauformen ab (ATOF 3,11 mV, MINI 3,38 mV), die
zulässige Spanne folgt deshalb aus beiden Reihen. Dazu eine Plausibilitätsregel:
Die Widerstände müssen in jeder Bauform monoton mit dem Nennstrom fallen — ein
Tippfehler in einem einzelnen Wert fiele damit sofort auf.

## Regression

`validate.js` Abschnitte 32 und 33, 9 Prüfungen (190 → 199).

## Ergebnislos geprüft

Ein Scan über alle Karten nach harten Entscheidungsgrenzen in **anderen
Einheiten** (mV, mA, A, Ω, kΩ, °C, %) fand keine einzige ungebundene Stelle.
