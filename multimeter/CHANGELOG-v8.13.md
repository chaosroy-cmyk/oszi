# CHANGELOG v8.13-Profi — Diagnosebäume: Verzweigungen ohne feste Schwellen

## Befund 1 · `starter-langsam` verzweigte über eine Schwelle mit Deckungslücke

Die Einstiegsfrage „Batteriespannung beim Starten:" bot genau zwei Antworten:

- „Bricht stark ein (**< 9,6 V**)"
- „Bleibt **> 10 V**"

**Zwei Fehler auf einmal:**

1. **Deckungslücke.** Zwischen 9,6 V und 10 V passt *keine* der beiden
   Antworten. Wer 9,8 V misst — ein völlig alltäglicher Wert — steht im Baum
   ohne gangbaren Weg.
2. **Feste Schwelle als Entscheidungsgrenze.** Die Karte `starter`, auf die der
   Baum verweist, bezeichnet 9,6–10 V ausdrücklich als „verbreiteten
   Orientierungswert, **keine allgemeingültige Bestehensgrenze**". Seit v8.7
   gilt das auch in ihren Arbeitsschritten. Nur der Baum entschied weiter über
   die Zahl.

**Änderung:** Die Frage nennt den Orientierungswert samt Vorbehalt und den
Einflussgrößen (Temperatur, CCA, Starterstrom, Startdrehzahl). Die beiden
Antworten lauten jetzt „unter der OEM-Vorgabe" und „im Rahmen der OEM-Vorgabe"
— lückenlos und ohne feste Zahl.

## Befund 2 · `keine-spannung` empfahl den Relaistausch ohne Sockelbeurteilung

Das Ergebnis lautete: „Relaiskontakt verbrannt (Kl.30→87 hoher Abfall). **Relais
tauschen.**"

Der Spezialbaum `relais-schaltet-nicht` warnt an derselben Stelle ausdrücklich:
„Ein neues Relais im beschädigten Sockel brennt erneut ab." Der allgemeine Baum
gab also die Empfehlung, vor der der spezielle warnt.

**Änderung:** Das Ergebnis verlangt jetzt die Beurteilung von Halteklemmen und
Kontaktflächen auf Schmorspuren, Verfärbung und Aufweitung, den Nachweis über
eine erneute Messung unter derselben Last, und verweist auf `relais` und
`relais-leistung` statt nur auf `spannungsabfall`.

## Regression

`validate.js` Abschnitt 28, 6 Prüfungen (155 → 161). Die Leitprüfung ist
verallgemeinert: **keine** Baumverzweigung darf über eine feste Zahlenschwelle
entscheiden — geprüft über alle 109 Knoten aller 15 Bäume, für V, mV, A, mA, Ω
und °C. Dazu die Strukturprüfung auf Sackgassen und die Relais-Sockel-Regel.

## Zwei Regeln, die beim Prüfen nachgeschärft werden mussten

Der erste Entwurf der Relais-Regel schlug bei drei Ergebnissen an, die sich beim
Nachlesen als **richtig** erwiesen:

- `relais-schaltet-nicht[8]`: „Bauart gegenprüfen, **bevor** ersetzt wird" —
  eine Vorbedingung, keine Tauschempfehlung.
- `relais-schaltet-nicht[10]`: „Relais **nicht** ersetzen." — das Gegenteil.
- `keine-spannung[1]`: Hier wird die **Sicherung** getauscht; „Relais" stand nur
  im Querverweis.

Die Regel nimmt Verneinungen, Vorbedingungen und Querverweise jetzt aus. Nicht
die Ergebnisse waren falsch, sondern die Prüfung.

## Geprüft und für korrekt befunden

Alle 15 Bäume, 109 Knoten: keine Sackgasse, keine unerreichbaren Knoten, alle
Sprungziele gültig (das prüft `validate.js` seit v8.2). Inhaltlich besonders
sauber gelöst:

- `generator-laedt-nicht[6]`: „nicht den Generator tauschen" bei
  anforderungsgerechtem Ladesystem — verweist stattdessen auf Ruhestrom,
  Batteriezustand und Fahrprofil.
- `generator-laedt-nicht[11]`: AC-Anteil am Multimeter ist „nur ein Verdacht",
  Bestätigung per Oszilloskop vor dem Generatortausch.
- `steuergeraet-offline[1]`: „Nicht das Steuergerät tauschen, bevor Versorgung
  unter Last stimmt."
- `5v-kurzschluss[8]`: „**Noch kein Austauschgrund**" trotz belasteter Referenz.
- `5v-kurzschluss[12]`: „**Erst jetzt** darf der Steuergeräteausgang bewertet
  werden — nach Ausschluss von Sensoren, Leitung, Masse und Versorgung."
