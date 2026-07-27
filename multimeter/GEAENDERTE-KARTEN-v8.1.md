# Geänderte Karten und Diagnosebäume (v8.0 → v8.1)

## Fachlich geänderte Prüfkarten (19)

| Karte | Art der Änderung |
|---|---|
| `ref5v` | feste Grenzen entfernt, OEM-Bezug, Isolationspflicht |
| `ref5v-basis` | Gut-/Schlecht-Grenzen ersetzt, Abweichungsrichtung nur noch Pfadwahl |
| `ref5v-masseschluss` | vollständige Isolation als Voraussetzung, Feuchtigkeits-Pauschale entfernt |
| `ref5v-plusschluss` | Key-off-Logik (Power-down, Wake-up, Restspannung), Quellennachweis |
| `ref5v-vergleich` | Spannungsverhalten auf OEM-Bezug umgestellt |
| `spannung` | Sensorreferenz in der Grundlagentabelle ohne Festwert |
| `batterie` | tag/gef + Risiko hoch, Gefahrblock, Startspannung als Hinweis |
| `generator` | Ladesystemart als Voraussetzung, universelle Werte entfernt |
| `generator-lin-bsd` | Bewertung gegen Anforderung statt gegen feste Spannung |
| `starter` | Kl.50 als Orientierungswert gekennzeichnet |
| `starter-drop-profi` | Widerspruch zu `starter` aufgelöst, OEM-Bezug |
| `map` | kein universeller KOEO-Wert, Anschlag nur als Verdacht |
| `raildruck` | tag/gef, Gefahrblock, Kennlinien-/Teilenummernbezug |
| `lin` | Low-/High-Pegel differenziert, Vorprüfungen ergänzt |
| `ruhestrom` | Einschaltstrom, Gerätesicherung, Startverbot, Wake-up-Protokoll |
| `ruhestrom-fuse` | Rechner mit Bauformwahl, Näherungshinweis, Summierungsregel |
| `dpf-diff`, `klimadruck`, `tankgeber` u. a. | Austauschentscheidungen mit Bestätigungsschritt |
| 12 Karten | verdeckte `TESTS.table` entfernt (keine Anzeigeänderung) |
| 19 Karten | `danger`-Block vor der Arbeitsanweisung verifiziert |

## Umgebaute Diagnosebäume (2)

| Baum | Änderung |
|---|---|
| `5v-kurzschluss` | vollständig neu, 13 Knoten, OEM-Sollwert zuerst, Kurzschlussbefund erst am isolierten Leiter |
| `generator-laedt-nicht` | vollständig neu, 14 Knoten, Ladesystemart als Einstieg |

## Angepasste Bäume (1)

| Baum | Änderung |
|---|---|
| `sensor-unplausibel` | Option „4,75–5,25 V" durch „im OEM-Soll" ersetzt |
