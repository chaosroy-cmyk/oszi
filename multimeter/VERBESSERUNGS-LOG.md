# Verbesserungs-Log · KFZ Multimeter Profi

Fortschrittsregister des Verbesserungs-Loops. Arbeitsanweisung:
[`PROMPT-VERBESSERUNG.md`](PROMPT-VERBESSERUNG.md).

**Nächstes Fokusthema: 4 · Energie & Anlasser**

Format je Runde:

```
## Runde <Nr> · <Fokusthema> · <Datum>
Baseline: <n>/<n> grün → Abschluss: <n>/<n> grün · Version <alt> → <neu>

### Befunde
- **<Kurztitel>** (`<karte-id>`) — <was war falsch>
  Beleg: <URL oder Reproduktionsschritt>
  Fix: <was geändert wurde> · Regression: `validate.js` <Prüfname>

### Beobachtungen ohne Beleg
- <Vermutung, warum nicht geändert>

### Offen
- <was in eine spätere Runde gehört>
```

---

## Runde 0 · Einrichtung · 2026-09-05

Baseline: 78/78 grün → Abschluss: 78/78 grün · Version 7.3-Profi → 8.3-Profi

### Was passiert ist

- **v8.3 aus dem ZIP nach `multimeter/` übernommen** (vorher v7.3 im Repo).
  Neu gegenüber v7.3: Relais-Kartensatz (4 Karten + Diagnosebaum),
  `SOURCES.md` mit Evidenzstufenmatrix, `validate.js` mit 78 Prüfungen,
  26 Splashscreens, Changelogs v8.2/v8.2.1/v8.3.
- **Verbesserungs-Prompt und dieses Log angelegt.**

### Befunde

- **Nachbar-App löschte den Offline-Cache der Multimeter-App** (`/sw.js`)
  Der Service Worker des Oszilloskop-Kompendiums im Repo-Wurzelverzeichnis
  löschte beim `activate` **jeden** Cache außer dem eigenen:
  `keys.filter(k => k !== CACHE)`. Cache Storage ist origin-weit, nicht
  scope-weit – beide Apps liegen auf demselben Origin (`/` und
  `/multimeter/`). Jedes Update des Kompendiums nahm der Multimeter-App
  damit die Offline-Fähigkeit; beim nächsten Start ohne Netz stand der
  Monteur vor einer leeren App. Die Multimeter-Seite hatte diesen Fall
  bereits über `CACHE_PREFIX` abgesichert, die Gegenseite nicht.
  Beleg: `validate.js` Abschnitt 13, Prüfung „Nachbar-App auf demselben
  Origin löscht ebenfalls präfix-gefiltert" – im Repo-Kontext rot, weil
  `../sw.js` dort erstmals existiert. Standalone im ZIP konnte die Prüfung
  nie greifen (keine Nachbardatei), der Bug war deshalb unsichtbar.
  Fix: `CACHE_PREFIX = "kfzoszi-"` in `/sw.js`, Aufräumen filtert darauf.
  Regression: bestehende Prüfung deckt es ab, sobald beide Apps im selben
  Baum liegen.

### Offen

- Rotation startet mit Thema 1 (Sicherheit & Gefahrkarten).

---

## Runde 1 · Sicherheit & Gefahrkarten · 2026-09-05

Baseline: 78/78 grün → Abschluss: 86/86 grün · Version 8.3-Profi → 8.4-Profi

Geprüft: `sicherheitscheck`, `srs-airbag`, `hv-hybrid`, `batterie`,
`raildruck`, `relais-leistung` — dazu im Quervergleich alle 20 Karten mit
`danger`-Warnung und alle Karten mit Kraftstoff-Hochdruckbezug.

### Befunde

- **Benzin-Direkteinspritzung ohne jede Gefahrenkennzeichnung**
  (`injektor-benzin`)
  Die Karte behandelte Direkteinspritzer ausdrücklich (Einsteigertext,
  Tabellennotiz „VAG TFSI/TSI: hohe Schaltspannung", `dont`-Eintrag gegen
  Brücken und Fremdbestromen) — trug aber **keine einzige Warnung** bei
  `risk:"mittel"`. Die Schwesterkarte `injektor-diesel` hatte für dasselbe
  Bauteil einen roten Gefahrblock und `risk:"hoch"`. Die Gefahrenkennzeichnung
  hing damit am Kraftstoff statt am Hochdrucksystem.
  Beleg: Bosch führt Hochdruckpumpen für Benzin-DI mit bis zu 250 bar und bis
  zu 350 bar Systemdruck, Injektor HDEV 6 bis 350 bar
  (bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-direct-injection/
  und /solutions/pumps/high-pressure-pump/, Abruf 05.09.2026). Die HSE hält
  Injektionsverletzungen ab 7 bar für möglich, schwere Verletzungen
  typischerweise über 100 bar (HSE FOD 4-2014) — diese Quelle stand bereits in
  `SOURCES.md` und trug die Gefahrkennzeichnung der Diesel-Karten. Sie belegt
  die Gefahr druckabhängig, nicht kraftstoffabhängig.
  Fix: `danger`- und `caution`-Block ergänzt, `risk` auf `hoch`, `requires`
  um Systemklärung und OEM-Druckabbau erweitert, Anleitungsschritt
  vorangestellt, `sourceRef` und zwei `SOURCES.md`-Zeilen ergänzt.
  Regression: `validate.js` Abschnitt 19, verallgemeinert auf **jede** Karte
  mit Direkteinspritzung oder Common-Rail. Gegen den Zustand vor der Änderung
  meldet der Validator `injektor-benzin(keine warn/mittel)` und schlägt fehl —
  Wirksamkeit nachgestellt und bestätigt.
  Gegenprobe gegen Überwarnung: eine zusätzliche Prüfung stellt sicher, dass
  die Spulenmessung am getrennten Stecker weiterhin als zulässige Prüfung
  erkennbar bleibt.

### Beobachtungen ohne Beleg

- **Schaltspannung der DI-Ansteuerung.** Die Tabellennotiz spricht von „hoher
  Schaltspannung", ohne einen Wert zu nennen. Recherche nach einer belastbaren
  Herstellerangabe (Bosch, Infineon, TI, Delphi) brachte nur Patentschriften
  ohne konkrete Betriebsspannung. Deshalb bewusst **keine Zahl** ergänzt — die
  Warnung bleibt qualitativ. Offen für eine Runde mit Zugriff auf ein
  Bosch-Datenblatt der HDEV-Reihe.

### Offen

- **Grundsatzfrage `warn` gegen `dont`:** `kraftstoffpumpe` (nennt die
  Hochdruckpumpe) und `klimadruck` (nennt die Hochdruckseite des
  Kältemittelkreises, R1234yf ist zusätzlich entzündlich) führen ihre Gefahr
  ausschließlich im `dont`-Block, ohne sichtbaren Warnblock. Dasselbe Muster
  bei `tankgeber` („keine Funken/Zündquellen am offenen Tank —
  Explosionsgefahr"). Das ist erkennbar Hauskonvention, kein Einzelfehler, und
  wurde deshalb **nicht** im Vorbeigehen geändert. Die Frage gehört einmal
  bewusst entschieden und dann einheitlich über alle Karten gezogen — Vorschlag:
  Runde 8 (Aktoren).
- `injektor-benzin` hat kein `syn`-Feld; ob die Suche „Direkteinspritzer",
  „TFSI" oder „GDI" findet, ist offen. Gehört zu Runde 11 (Glossar/Suche).
- `map` nennt „1 bar" als Messbereich und wird von einer groben
  Hochdruck-Regex fälschlich getroffen. Kein Befund, aber ein Hinweis darauf,
  dass Textregeln über Druckangaben eng gefasst sein müssen — deutsche Wörter
  auf `-bar` (erkennbar, brauchbar) sind eine ständige Fehlerquelle.

---

## Runde 2 · Basis-Messverfahren · 2026-09-05

Baseline: 86/86 grün → Abschluss: 101/101 grün · Version 8.4-Profi → 8.5-Profi

Geprüft: `spannung`, `widerstand`, `durchgang`, `diodentest`,
`spannungsabfall`, `klemmen` — vollständig, inklusive Quervergleich der
absoluten Abfallgrenzen über das gesamte Projekt.

### Befunde

- **Universelle Abfallgrenzen erzeugen Fehlalarme** (`spannungsabfall`)
  Die Basiskarte gab absolute Grenzen als Ampelurteil aus: „Starterkreis
  (Hochstrom) < 0,5 V Plus" als Warnung, „> 0,5 V Signalkreis" als kritisch
  (rot). Der zulässige Abfall hängt aber am Strom des Kreises (U = I × R).
  Beleg: HELLA Techworld, Tabelle zulässiger Spannungsabfälle für 12-V-Fahrzeuge
  (hella.com/techworld/us/ti/earth-31-troubleshooting/, Abruf 05.09.2026).
  Der Hersteller erlaubt am **Hauptanschluss des Starters unter Last beim
  Startvorgang 3,5 V** — das Siebenfache dessen, was die Karte als Warnung
  auswarf — und am **Steuerstromkreis vom Zündschalter zum Starter 1,5 V**,
  also das Dreifache dessen, was die Karte als kritisch rot markierte. Nach
  der alten Tabelle hätte ein Monteur intakte Leitungen verurteilt.
  Dieselbe Quelle belegt das Prinzip innerhalb eines Systems: derselbe
  Lichtkreis darf unter 15 W nur 0,1 V verlieren, über 15 W aber 0,5 V —
  Faktor fünf bei gleicher Bauart, nur anderem Strom.
  Widerspruch im eigenen Bestand: `relais-leistung` (v8.3) sagt bereits
  wörtlich „Absolute Abfallgrenzen sind strom- und fahrzeugabhängig", und
  `sensor-masseversatz` wurde die feste < 50 mV-Grenze bewusst entzogen,
  bewacht von `validate.js` seit v8.2. Nur die Basiskarte, von der die Methode
  gelernt wird, verteilte weiter Universalgrenzen.
  Fix: Tabelle auf 10 kreisbezogene Zeilen nach der HELLA-Tabelle umgestellt,
  Kopfzeile als Herstellerbeispiel deklariert, Spalte „Bewertung" zu
  „Prüfpriorität", Notiz verneint Allgemeingültigkeit, neuer Anleitungsschritt
  zur Stromabhängigkeit, Ersatzregel „Vergleich mit baugleichem intaktem
  Kreis" wie in `relais-leistung`, `good`/`bad`/`fs`/`requires`/`limits` an den
  Kreis gebunden, `caution`-Block gegen Faustzahl-Übertragung, `sourceRef` und
  `SOURCES.md`-Zeile ergänzt.
  Regression: `validate.js` Abschnitt 20, 15 Prüfungen. Sichert beide
  Richtungen — alte Universalzeilen weg **und** kreisbezogene Werte samt
  Stromabhängigkeit, Ersatzregel und Prüfprioritäts-Semantik vorhanden. Gegen
  den Stand vor der Änderung schlagen 14 der 15 fehl; nachgestellt und
  bestätigt.

- **Sachfehler: „ohne Last ist der Wert immer 0"** (`spannungsabfall`,
  Anleitung und `dont`)
  Gilt nur für eine intakte Leitung. Ist die Leitung unterbrochen, zeigt
  dieselbe Messung auch ohne Last nahezu die volle Bordspannung — kein
  Spannungsabfall, sondern ein Leitungsbruch. Genau der Fall, in dem ein
  Anfänger die Messung anwendet. Beide Stellen benennen die Ausnahme jetzt.
  Regression: Prüfung „dont behauptet nicht mehr, der Wert sei ohne Last
  immer 0".

### Geprüft und für korrekt befunden

- `diodentest`: Flussspannungen Si 0,4–0,8 V, Schottky 0,15–0,45 V, LED
  1,5–3 V farbabhängig, Sperrrichtung OL, Polung rot an Anode — fachlich
  korrekt. Der Hinweis, dass die Prüfspannung mancher Geräte für blaue und
  weiße LED nicht reicht, ist ein Detail, das viele Anleitungen auslassen.
- `widerstand`: spannungsfrei, einseitig trennen, Nullabgleich, Temperaturbezug,
  Wackeltest, „0 Ω ist kein Belastbarkeitsnachweis" — vollständig und richtig.
- `durchgang`: Piepschwelle geräteabhängig, Ton beweist keine Belastbarkeit,
  Selbsttest der Messleitungen — richtig.
- `spannung`: Bezugspunktwahl, Zustandsangabe als Pflicht, Lastgegenprobe —
  richtig. `klemmen` gegen DIN 72552 stimmig.

### Beobachtungen ohne Beleg

- `durchgang` nennt die Piepschwelle mit „zwischen 20 und 70 Ω". Plausibel und
  geräteabhängig formuliert, aber ohne Quelle. Keine Änderung: die Aussage ist
  bewusst als Spanne und als geräteabhängig gekennzeichnet, und ein einzelnes
  Gerätedatenblatt würde sie nicht allgemeingültiger machen. Falls eine Runde
  Zugriff auf Fluke- oder Gossen-Datenblätter hat, wäre eine Beispielangabe mit
  Typenbezug die saubere Ergänzung.

### Offen

- **Projektweite Umstellung der absoluten Abfallgrenzen.** Rund 27 Fundstellen
  (`< 0,2 V` 15×, `< 0,3 V` 4×, `< 0,1 V` 4×, `< 0,5 V` 2×) stehen weiterhin in
  anderen Karten, darunter `batterie` („Polklemmen < 0,1 V"), `masse`, `starter`
  und `leitung`. Die Basiskarte ist jetzt korrekt, die abgeleiteten Karten noch
  nicht. Das ist eine zusammenhängende Aufgabe für eine eigene Runde, die alle
  betroffenen Karten gemeinsam anfasst — bewusst nicht als Beifang erledigt.
- Aus Runde 1 weiter offen: Grundsatzfrage `warn` gegen `dont` bei
  Kraftstoff- und Kältemittelgefahren; `syn`-Feld für `injektor-benzin`.

---

## Runde 3 · Strom, Sicherungen, mV-Rechner · 2026-09-05

Baseline: 101/101 grün → Abschluss: 108/108 grün · Version 8.5-Profi → 8.6-Profi

Geprüft: `strom`, `sicherung`, `relais`, `relais-typen`, `relais-leistung`,
`relais-elektronisch`, `ruhestrom`, `ruhestrom-fuse`, `prueflampe-last`,
`stromzange-dc` sowie `FUSE_TYPES`.

### Befunde

- **Kontaktprüfung misst den Kontakt gar nicht** (`sicherung`, sechs Felder)
  Die Karte wies an, „eine Spitze je Prüföffnung" zu setzen und den Abfall als
  „Übergangswiderstand am Sicherungskontakt" zu deuten. Zwei Fehler:
  (1) Die Prüföffnungen sitzen auf den Blechfahnen der Sicherung; gemessen wird
  Fahne → Schmelzleiter → Fahne. Die Halteklemmen des Sockels liegen außerhalb
  dieses Pfades und können prinzipbedingt nicht auffallen.
  (2) Der dort gemessene Abfall ist bauartbedingt normal — der Schmelzleiter hat
  einen konstruktiven Widerstand.
  Beleg intern und zwingend: Die Karte `ruhestrom-fuse` baut auf genau diesem
  Abfall auf und rechnet ihn über die hinterlegten Littelfuse-Kaltwiderstände in
  Strom um. `FUSE_TYPES.atof` führt für 10 A 7,7 mΩ; bei 10 A ergibt das 77 mV.
  Zwei Karten deuteten dieselbe Messung damit gegensätzlich.
  Praktische Folge: Ein intakter Sicherungskasten wäre gereinigt oder getauscht
  worden, ein tatsächlich aufgeweiteter Klemmenkontakt trotzdem unentdeckt
  geblieben.
  Fix: Anleitungsschritt 5 erklärt Messpfad und Normalität des Abfalls, neuer
  Schritt 6 gibt die richtige Sockelmessung (Prüföffnung gegen einen Punkt
  jenseits der Halteklemme), Tabelle trennt beide Messungen, `mess`/`good`/`bad`
  und Fehlersuchschritt 2 nachgezogen.
  Regression: `validate.js` Abschnitt 21, 7 Prüfungen. Eine rechnet den im Text
  genannten Beispielwert gegen `FUSE_TYPES` nach (7,7 mΩ × 10 A = 77 mV), damit
  Text und Daten nicht auseinanderdriften; eine weitere sichert die
  Widerspruchsfreiheit zu `ruhestrom-fuse`.

### Geprüft und für korrekt befunden

- `strom`: Reihenmessung, A-Buchse, sofortiges Rückstecken, größter Bereich
  zuerst — richtig und vollständig.
- `ruhestrom`: Einschlafzeit, Trennen weckt Steuergeräte, Radio-Code und
  Adaptionen, mV-Drop als schonende Alternative — richtig.
- `stromzange-dc`: Nullabgleich, nur ein Leiter, Feldaufhebung bei gemeinsamem
  Umfassen von Hin- und Rückleiter — physikalisch korrekt.
- `prueflampe-last`: „21 W bei 12 V ≈ 1,75 A" rechnerisch korrekt (21/12 =
  1,75). Tabu-Liste (5 V, CAN/LIN, SRS, ECU-Signal) fachlich richtig.
- Relais-Kartensatz aus v8.3: unverändert stimmig.

### Beobachtungen ohne Beleg

- `FUSE_TYPES` konnte nicht erneut gegen die Littelfuse-Datenblätter geprüft
  werden — der Abruf wird serverseitig mit HTTP 403 abgewiesen. Der bestehende
  Ankerprüfpunkt (ATOF 10 A = 7,70 mΩ) bleibt die einzige verifizierte Stelle.
  Unverifizierte Werte wurden bewusst nicht angetastet. Für eine spätere Runde:
  Datenblatt manuell beschaffen und die übrigen Nennströme gegenprüfen.
