# CHANGELOG v8.7-Profi — Sicherungsdaten vervollständigt

**v8.7 = v8.6 plus vollständige Sicherungsdaten.** Kartenzahl, Diagnosebäume,
Glossar und Grenzwertlinie sind unverändert (77 Karten, 15 Bäume). Eigener
`CACHE_NAME` `kfz-multimeter-profi-v8-7`, damit v8.6-Installationen das Update
angeboten bekommen.

Anlass war eine Unterrichtsunterlage zur *Kriechstrommessung mittels
Spannungsverlustprüfung* (Landesberufsschule, Verweis auf
doerfler-elektronik.de) mit einer Wertetabelle für Kfz-Sicherungen. Alle zehn
Nennströme, die es bereits in der App gab, stimmten **exakt** mit den
hinterlegten Datenblattwerten überein — die Unterlage gibt das
Littelfuse-ATOF-Datenblatt wieder. Drei Nennströme, die Kennfarben und der
Spannungsabfall bei Nennstrom fehlten in der App und wurden ergänzt.

---

## 1 · Drei fehlende Nennströme (1 A, 2 A, 4 A)

Die ATOF-Reihe deckte bisher 3–40 A ab und begann damit oberhalb der kleinen
Steuergerätesicherungen — ausgerechnet dort, wo die mV-Methode am besten
funktioniert, weil der Innenwiderstand am größten und der Messwert am
deutlichsten ist.

| Nennstrom | Widerstand (kalt) | Abfall bei Nennstrom | Kennfarbe |
|---|---|---|---|
| 1 A | 123,00 mΩ | 176 mV | schwarz |
| 2 A | 53,50 mΩ | 141 mV | grau |
| 4 A | 22,80 mΩ | 136 mV | pink |

Vor der Übernahme gegen die Herstellerangaben derselben Reihe geprüft
(Artikeldaten zu 0287001, 0287002, 0287004); die Werte der Unterlage stimmen
damit überein. Quellenzeile in `SOURCES.md` entsprechend erweitert.

## 2 · Kennfarben

Jeder Nennstrom trägt jetzt seine Kennfarbe — im Sicherungskasten greift man
nach der Farbe, nicht nach der aufgedruckten Zahl.

- In der Auswahlliste des Rechners: „10 A · rot".
- In der neuen Tabelle auf der Karte mit farbigem Feld.
- Farbcode nach ISO 8820-3 / DIN 72581 (SAE J1284, für MAXI J1888), die
  Zuordnung hängt am **Nennstrom**, nicht an der Bauform. Der Validator prüft
  das: gleicher Nennstrom, gleiches Farbwort über alle Bauformen.
- MAXI 25 A und 35 A stehen nicht im Standard-Farbcode der Reihe und bleiben
  bewusst **ohne** Farbe, statt eine zu raten.
- Der Farbton schwankt je Hersteller und Bauform; die aufgedruckte Zahl gilt.
  Steht so auf der Karte.

## 3 · Spannungsabfall bei Nennstrom

Neues Datenfeld `u` und zweite Zeile je Tabellenzelle. Das ist eine **andere**
Größe als der Kaltwiderstand: bei Nennstrom ist die Sicherung heiß, ihr
Widerstand liegt rund 40–50 % über dem Kaltwert (10 A: 109 mV bei 10 A
entsprechen ≈ 10,9 mΩ statt 7,70 mΩ). Sie ordnet nur die Größenordnung einer
voll belasteten Sicherung ein und ist ausdrücklich **kein Grenzwert und keine
Rechengrundlage für den Ruhestrom** — Text steht in der Tabellenfußnote, der
Validator prüft, dass er da ist, und dass der Rechner weiterhin ausschließlich
mit dem Kaltwiderstand rechnet.

## 4 · Neue Tabelle auf der Karte „Ruhestrom über Sicherung (mV-Drop)"

Zweittabelle (`rt2`) mit allen 13 Nennströmen, Farbfeld, Kaltwiderstand und
Nennstromabfall. Damit ersetzt die Karte das Papierblatt am Fahrzeug.

Dafür war eine Renderer-Ergänzung nötig: dreispaltige Tabellen ohne Ampelspalte
bekamen bisher pauschal 520 px Mindestbreite und damit Querscrollen — bei
kurzen Zellen stand die letzte Spalte unsichtbar außerhalb des Telefondisplays.
Solche Tabellen bekommen jetzt `narrow:true`. Konvention in `README.md`
ergänzt, Validator prüft, dass die Sicherungstabelle ohne Querscrollen passt.

## 5 · Formeldreieck U / (R · I)

Im Einsteiger-Modus steht über dem Rechner das Formeldreieck aus der
Unterrichtsunterlage: U oben, R · I unten, dazu die drei Umstellungen und ein
durchgerechnetes Beispiel (2,4 mV an einer 10-A-Sicherung → 312 mA). Wer die
Umstellung einmal gesehen hat, rechnet auch ohne App. Im Profi-Modus
ausgeblendet.

## 6 · Kleinigkeiten

- Vorauswahl im Rechner steht auf **10 A** statt auf dem neuen ersten
  Listeneintrag 1 A.
- Suchbegriffe der Werkstatt- und Schulsprache ergänzt: Kriechstrom,
  Kriechstrommessung, Spannungsverlustprüfung, Kennfarbe, Flachsicherung.

## 7 · Validator

Abschnitt 22 neu, 187 statt 174 Prüfungen: alle 13 ATOF-Werte gegen das
Datenblatt, Kennfarbe und Farbfeld auf jeder ATOF-/MINI-Sicherung, Farbcode
konsistent über die Bauformen, unbelegte Farben bleiben leer, Rechner nutzt den
Kaltwert (2,4 mV an 10 A = 312 mA), Kennfarbe in der Auswahlliste, 13 Farbfelder
und 13 Nennstromwerte in der Tabelle, Warntext vorhanden, Tabelle ohne
Querscrollen, Formeldreieck nur im Einsteiger-Modus, Suche findet die neuen
Begriffe.

## 8 · Versionen

| Stelle | Wert |
|---|---|
| `APP_VERSION` | `8.7-Profi` |
| `APP_CACHE_NAME` / `sw.js` `CACHE_NAME` | `kfz-multimeter-profi-v8-7` |
| `package.json` | `8.7.0` |
| `DATA_STAND` | `30.09.2026` |
