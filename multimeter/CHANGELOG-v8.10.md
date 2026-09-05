# CHANGELOG v8.10-Profi — 5-V-Referenz: die Übersicht sagt jetzt dasselbe wie die Detailkarte

## Ausgangslage

`ref5v-vergleich` ist die Einstiegskarte des Referenzsatzes: Sie stellt
Masseschluss und Plusschluss gegenüber, damit der Monteur schnell zuordnen kann.
Zwei ihrer Zeilen widersprachen der zugehörigen Detailkarte.

| Zeile | `ref5v-vergleich` (alt) | `ref5v-plusschluss` |
|---|---|---|
| Erstmessung | „Spannung Referenz ↔ Masse **bei Zündung AUS**" | „‚Zündung aus' genügt **NICHT**: OEM-Nachlauf-/Power-down-Zeit abwarten" |
| Befund bei Schluss | „**Spannung ohne Zündung vorhanden**" | „Kurzzeitige Restspannung, Nachlauf oder ein Wake-up sind **KEIN Befund**" |

Auch die Masseschluss-Spalte war zu kurz gefasst: „Ohm Referenz ↔ Masse,
spannungsfrei" gegenüber der Detailforderung, erst am **vollständig isolierten**
Leiter zu bewerten.

## Warum das zählt

Die Übersicht ist der Einstieg — wer nach ihr arbeitet, kommt gar nicht bis zur
Detailkarte, bevor er die Zuordnung getroffen hat. Nach der alten Tabelle hätte
er eine Nachlauf- oder Restspannung als belegte Fremdeinspeisung gewertet und
wäre in eine Kabelbaumsuche eingestiegen, die es nicht braucht. Genau diesen
Fehlschluss ist die Detailkarte geschrieben zu verhindern.

## Änderungen

- **Erstmessung** verlangt jetzt in beiden Spalten die Bedingung der jeweiligen
  Detailkarte: vollständig isolierter Leiter beziehungsweise vollständiger
  Power-down mit OEM-Nachlaufzeit.
- **Befund bei Schluss** verlangt den niederohmigen Pfad am isolierten Leiter
  beziehungsweise die dauerhafte, bis zur Quelle zurückverfolgte Spannung.
- **Neue Zeile „Kein Befund"** benennt ausdrücklich die beiden häufigsten
  Fehlschlüsse: Zwischenwerte bei nicht getrennten Pfaden und kurzzeitige
  Restspannung, Nachlauf oder Wake-up.
- **Notiz** stellt klar: Diese Übersicht ordnet nur zu und ersetzt die
  Bedingungen der Detailkarten nicht. Eine Zuordnung aus der Tabelle ist ein
  **Verdacht, kein Befund**.
- **`ref5v`**: Das Feld `bad` formulierte „0 V oder eingebrochen = Kurzschluss
  nach Masse/Plus oder Versorgung defekt" als Gleichung, während die
  Richtwerttabelle derselben Karte korrekt „auffällig – erst nach Isolation
  bewertbar" sagt. Jetzt als Verdacht formuliert.

## Regression

`validate.js` Abschnitt 25, 7 Prüfungen (130 → 137), darunter eine, die
Übersicht und Detailkarte gegeneinander hält: Beide müssen den Power-down
fordern.

## Geprüft und für korrekt befunden

`ref5v-basis`, `ref5v-masseschluss` und `ref5v-plusschluss` sind fachlich
vorbildlich und blieben unverändert. Besonders sauber gelöst:

- Messpunkt ist der **Sensorstecker**, nicht das Steuergerät — nur so liegen
  Leitung, Kontakt und Steckverbindung im Messpfad.
- Gegenprobe gegen Batterieminus zur Trennung von Masseversatz.
- Der Widerstand gegen Masse ist erst am **vollständig isolierten** Leiter
  belastbar; Zwischenwerte sind ausdrücklich Verdacht, nicht Beweis, und können
  ebenso von einer Halbleiterstrecke im Steuergerät stammen.
- Bewertet werden Stabilität und Abweichungsrichtung, „nicht die zweite
  Nachkommastelle".
- Die Herstellerbeispiele 4,75–5,25 V und 4,7–5,3 V sind durchgehend als
  Beispiele gekennzeichnet — bewacht seit v8.2 von `validate.js` Abschnitt 12.
