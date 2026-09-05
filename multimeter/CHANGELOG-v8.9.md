# CHANGELOG v8.9-Profi — Hall-Pegel und Induktiv-AC richtig einordnen

## Befund 1 · `hall`: der High-Pegel gehört dem Steuergerät

Die Richtwerttabelle führte „Signal HIGH — **≈ Versorgung**" als grünes
Kriterium.

Viele Kfz-Hallgeber haben einen **Open-Collector-Ausgang**: Der Sensor zieht
das Signal nur nach Masse, den High-Pegel legt der **Pull-up im Steuergerät**
fest. Versorgung und Signalpegel dürfen deshalb auseinanderfallen — ein mit
12 V versorgter Nockenwellengeber, dessen Signal zwischen 0 und 5 V schaltet,
ist völlig normal.

Nach der alten Tabelle hätte ein Monteur genau diesen intakten Sensor
verurteilt: gemessene 5 V HIGH bei 12 V Versorgung wären als „HIGH erreicht die
Versorgung nicht" durchgefallen.

**Die Karte widersprach sich dabei selbst.** Ihr eigener Anleitungsschritt 4
nennt „fehlenden Pull-up" ausdrücklich als mögliche Ursache eines festen
Pegels — und das Kartenfeld `was` sagt „Rechtecksignal (0↔5 V **oder** 0↔12 V)".
Nur die Tabelle band den Pegel an die Versorgung.

Die App hält das Wissen ohnehin bereits vor: Die Karte `pullup-pulldown`
erklärt Pull-up-Kreise mit 5 V und 12 V und nennt typische
Pull-up-Widerstände von 1–10 kΩ.

**Änderung:** Tabellenzeile auf „≈ Pull-up-Pegel des Steuergeräts, NICHT
zwingend die Sensorversorgung" geändert, neue Zeile „12 V versorgt, Signal
schaltet 0↔5 V — normal bei Open-Collector-Ausgang, kein Fehler", Notiz erklärt
das Prinzip und verweist per Querverweis-Chip auf `pullup-pulldown`.

## Befund 2 · `kw-ind`: der AC-Wert ist kein Messwert

Die Karte gab „AC beim Anlassen ~1–5 V" als Richtwert aus, ohne die
Bandbreitengrenze des Messgeräts zu nennen.

Multimeter sind für sinusförmige Netzfrequenz ausgelegt. Das Signal eines
Induktivgebers ist weder sinusförmig noch 50 Hz — und seine Frequenz ändert
sich mit der Drehzahl. Zwei Geräte zeigen am selben Geber unterschiedliche
Werte.

Die App macht diese Einschränkung an anderer Stelle bereits ausdrücklich: Die
Karte `generator` warnt, dass „viele MM bei Gleichspannung/Regler-PWM falsche
AC-Werte" zeigen. Bei `kw-ind` fehlte sie.

**Änderung:** Die Notiz ordnet den AC-Wert als Anwesenheitsnachweis ein — zu
bewerten ist „steigt mit der Drehzahl", nicht die Zahl. Amplitude, Flanken,
fehlende Zähne und Aussetzer bleiben dem Oszilloskop vorbehalten.

## Regression

`validate.js` Abschnitt 24, 7 Prüfungen (123 → 130). Die Leitprüfung ist
verallgemeinert: **keine** Karte darf den Pull-up in ihren Arbeitsschritten als
Ursache kennen und in der Tabelle gleichzeitig behaupten, der Pegel folge der
Versorgung.

## Geprüft und für korrekt befunden

- `poti-dk` und `lambda-sprung` — bereits in Runde 5 als korrekt bestätigt
  (ratiometrischer Teiler im Sensor bzw. galvanische Zelle).
- `radsensor`: Strommodulation 7 ↔ 14 mA zutreffend; der Hinweis, dass die
  Pinzahl kein sicherer Typhinweis ist und aktive Sensoren zweipolig sein
  können, ist ein häufig übersehenes Detail. Gefahrblock gegen Ohm-Messung am
  aktiven Sensor sitzt richtig.
- `lambda-breit`: Pumpstrom ausdrücklich als „nicht sinnvoll mit MM" markiert —
  korrekt.
- `klopf`: ehrlich über die Unzuverlässigkeit der Piezo-Prüfung mit dem
  Multimeter; Anzugsmoment zutreffend als kritisch benannt.
- `nox`: Sensormodul am Bus, MM nur für Versorgung/Masse — richtig.
- `hall` im Übrigen: „MM zeigt nur Mittelwert" bei getaktetem Rechteck ist
  korrekt und wird oft falsch gemacht.
- `sensor-masseversatz`: verzichtet weiterhin bewusst auf eine
  Universalgrenze — unverändert vorbildlich.
