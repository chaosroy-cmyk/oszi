# CHANGELOG v8.6-Profi — Sicherung: der Messpfad entscheidet, was man findet

## Ausgangslage

Die Karte `sicherung` wies an, den Kontaktzustand so zu prüfen: „Verbraucher
einschalten und die Spannung über der Sicherung selbst messen (eine Spitze je
Prüföffnung). Ein nennenswerter Abfall bedeutet Übergangswiderstand am
Sicherungskontakt – oft durch Korrosion im Sicherungskasten."

Dieselbe Aussage stand in `mess`, `good`, `bad`, im Anleitungsschritt 5, in
zwei Zeilen der Richtwerttabelle und in Schritt 2 der Fehlersuchkette.

## Zwei Fehler in einer Anweisung

**1 · Der gemessene Pfad enthält den Kontakt gar nicht.** Die beiden
Prüföffnungen sitzen oben auf den Blechfahnen der Sicherung. Wer eine Spitze je
Öffnung setzt, misst Fahne → Schmelzleiter → Fahne. Die Halteklemmen des
Sockels liegen **außerhalb** dieses Pfades. Eine korrodierte Klemme kann in
dieser Messung grundsätzlich nicht auffallen — die Anweisung konnte den Fehler,
den sie sucht, prinzipbedingt nicht finden.

**2 · Der gemessene Abfall ist normal, kein Defekt.** Der Schmelzleiter hat
einen konstruktiv vorgesehenen Widerstand. Eine ATOF 10 A liegt bei rund
7,7 mΩ; bei 10 A fallen dort etwa 77 mV ab. Das ist kein Fehler, sondern
Physik — und die App weiß das an anderer Stelle bereits sehr genau: Die Karte
`ruhestrom-fuse` **baut** auf genau diesem Abfall auf und rechnet ihn über die
hinterlegten Littelfuse-Kaltwiderstände in Strom um.

Zwei Karten beschrieben damit dieselbe Messung gegensätzlich: die eine als
Messgröße für den Strom, die andere als Beweis für einen Kontaktfehler.

## Praktische Folge

Ein Monteur nach der alten Anweisung hätte den bauartbedingt normalen Abfall
als Korrosion gedeutet und einen intakten Sicherungskasten gereinigt oder
getauscht — und einen tatsächlich aufgeweiteten Halteklemmenkontakt trotzdem
nicht gefunden, weil dieser nie im Messpfad lag.

## Änderungen

**`sicherung`** — alle sechs betroffenen Stellen korrigiert:

- Anleitungsschritt 5 erklärt jetzt, dass die Prüföffnungen auf der Sicherung
  selbst sitzen, der Abfall dort bauartbedingt normal ist (mit dem konkreten
  ATOF-10-A-Beispiel) und dass die Halteklemmen außerhalb dieses Pfades liegen.
- Neuer Anleitungsschritt 6 gibt die richtige Sockelmessung an: eine Spitze auf
  die Prüföffnung, die andere **jenseits der Halteklemme** — versorgungsseitig
  Batterieplus oder Sammelschiene, lastseitig Verbraucheranschluss. Erst dann
  liegt der Kontakt im Messpfad. Warmer oder verfärbter Sockel als bestätigender
  Befund ergänzt.
- Richtwerttabelle trennt die beiden Messungen in eigene Zeilen: Abfall zwischen
  den Prüföffnungen (normal, kein Kontaktbefund) gegenüber Abfall über dem
  Sockel (bewertbar).
- `mess`, `good`, `bad` und Fehlersuchschritt 2 entsprechend gefasst; Schritt 2
  benennt ausdrücklich, dass Prüföffnung gegen Prüföffnung **kein** Kontakttest
  ist.

**`validate.js`** — neuer Abschnitt 21, 7 Prüfungen (101 → 108). Eine davon
rechnet den im Text genannten Beispielwert gegen die hinterlegte
Sicherungstabelle nach: `FUSE_TYPES.atof` 10 A × 10 A muss die genannten 77 mV
ergeben. Damit kann der Beispielwert nicht mehr von den Daten wegdriften. Eine
weitere sichert die Widerspruchsfreiheit zu `ruhestrom-fuse`.

## Geprüft und für korrekt befunden

`strom` (Reihenmessung, A-Buchse, Rückstecken), `ruhestrom` (Einschlafzeit,
Trennen weckt Steuergeräte, mV-Drop als Alternative), `stromzange-dc`
(Nullabgleich, nur ein Leiter, Feldaufhebung bei Hin- und Rückleiter),
`prueflampe-last` (21 W bei 12 V ≈ 1,75 A — rechnerisch korrekt; Tabu für
5 V, CAN/LIN, SRS, ECU-Signal), `relais`, `relais-typen`, `relais-elektronisch`,
`relais-leistung`.

Die Kaltwiderstände in `FUSE_TYPES` konnten nicht erneut gegen das
Littelfuse-Datenblatt geprüft werden: Der Abruf wird serverseitig mit HTTP 403
abgewiesen. Der bestehende Prüfpunkt für ATOF 10 A = 7,70 mΩ bleibt der
Anker; unverifizierte Werte wurden nicht angetastet.
