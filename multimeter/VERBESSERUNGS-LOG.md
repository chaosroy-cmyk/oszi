# Verbesserungs-Log · KFZ Multimeter Profi

Fortschrittsregister des Verbesserungs-Loops. Arbeitsanweisung:
[`PROMPT-VERBESSERUNG.md`](PROMPT-VERBESSERUNG.md).

**Zweiter Durchgang läuft.** Er arbeitet nicht Karte für Karte, sondern nutzt die
vier Fehlermuster aus Durchgang 1 als systematische Suchraster über den gesamten
Bestand.

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

---

## Runde 4 · Energie & Anlasser · 2026-09-05

Baseline: 108/108 grün → Abschluss: 115/115 grün · Version 8.6-Profi → 8.7-Profi

Geprüft: `batterie`, `generator`, `starter`, `starter-drop-profi` — dazu ein
projektweiter Abgleich, welche Karten eine OEM-gebundene Tabelle, aber harte
Grenzen in den Schritten führen.

### Befunde

- **Die OEM-Umstellung erreichte die Tabellen, nicht die Arbeitsschritte**
  (`batterie`, `generator`, `starter` — zehn Stellen)
  Die Richtwerttabellen dieser drei Karten waren bereits auf „nach OEM-Vorgabe"
  umgestellt. Anleitung und Fehlersuchkette verteilten aber weiter feste
  Grenzen: `starter` anl3 „< 0,5 V", anl4 „< 0,2 V", fs1 „≥10 V → weiter" und
  „<9,6 V → Batterie/Klemmen", fs2 „>8 V → Ansteuerung ok", fs3/fs4 „<0,5 V"
  und „<0,2 V"; `generator` anl5 „< 0,3 V", anl6 „< 0,2 V"; `batterie` anl4 und
  fs3 „< 0,1 V = guter Kontakt".
  Beleg intern und eindeutig: Die `starter`-Tabelle bezeichnet 9,6–10 V
  wörtlich als „verbreiteten Orientierungswert, keine allgemeingültige
  Bestehensgrenze" — und die Fehlersuchkette derselben Karte benutzte genau
  diese Zahl als Bestehensgrenze. Ein Monteur arbeitet die Schritte ab, nicht
  die Tabelle; die Umstellung war dort nie angekommen, wo sie wirkt.
  Fix: alle zehn Stellen an die jeweilige Tabelle angeglichen und, wo belegbar,
  an die HELLA-Tabelle gebunden (Starter-Pluskabel 0,5 V,
  Batterieminus→Startergehäuse 0,3 V, Generator-Pluskabel 0,4 V,
  Batterieminus→Generatorgehäuse 0,3 V, Gehäuse→Karosserie 0,1 V — jeweils
  ausdrücklich als Herstellerbeispiel, OEM-Vorgabe hat Vorrang). Bei `batterie`
  ersetzt der Seitenvergleich Plus gegen Minus die feste 0,1-V-Grenze; im
  Messpfad liegt dort nur eine einzige Klemmverbindung, der Vergleich ist
  aussagekräftiger als eine Zahl, die den Startstrom nicht kennt.
  Regression: `validate.js` Abschnitt 22, 7 Prüfungen. Die Leitprüfung ist
  verallgemeinert: keine Karte mit OEM-gebundener Tabelle darf in Anleitung
  oder Fehlersuchkette noch eine feste Abfallgrenze unter 1 V tragen.

### Bewusst nicht geändert

- `batterie` fs1 („< 12,4 V → laden & Ruhestrom prüfen") ist keine
  Defektentscheidung, sondern eine Handlungsschwelle aus der belegten
  SOC-Tabelle (GS Yuasa). Bleibt.
- HELLA führt für den „Hauptanschluss Starter unter Last beim Startvorgang"
  3,5 V. Ob dieser Wert denselben Messpfad meint wie der App-Schritt
  (Batterieplus→Kl.30 während des Startens), geht aus der Quelle nicht
  zweifelsfrei hervor. Deshalb wurde **nicht** auf 3,5 V geändert, sondern der
  eindeutige 0,5-V-Wert für das Pluskabel als Beispiel gesetzt. Vermerkt als
  offene Frage.

### Geprüft und für korrekt befunden

- `starter-drop-profi`: bereits durchgehend OEM-gebunden, Tabelle **und**
  Schritte. Diente als Vorbild für die Angleichung.
- `generator`: intelligente Ladesysteme (LIN/BSD/BMS, Rekuperation) fachlich
  richtig behandelt; der Hinweis, dass AC-Ripple am Multimeter nur ein Grobtest
  ist und viele Geräte bei überlagerter Gleichspannung falsch anzeigen, ist
  korrekt und wird oft ausgelassen.

### Offen

- Verbleibende feste Abfallgrenzen in Karten **ohne** OEM-gebundene Tabelle:
  `luefter` fs2 „< 0,2 V", `hupe` fs2 „< 0,3 V" und fs3 „< 0,2 V", `leitung`
  fs9 „< 0,2 V". Gehören zu Runde 8 (Aktoren) und Runde 9 (Leitungen).
- `ruhestrom-fuse` anl2 „< 10 mV" ist eine Auflösungsangabe, keine
  Entscheidungsgrenze — kein Befund.

---

## Runde 5 · Sensorik I – Temperatur & Druck · 2026-09-05

Baseline: 115/115 grün → Abschluss: 123/123 grün · Version 8.7-Profi → 8.8-Profi

Geprüft: `ntc-kts`, `ntc-ats`, `ptc-sensor`, `map`, `raildruck`, `klimadruck`,
`oeldruck`, `agt`, `dpf-diff`.

### Befunde

- **Signalspannungstabelle, die keine reale Konfiguration erzeugt** (`ntc-kts`)
  Die Karte führte eine Spalte „Signal (typ.)" mit absoluten Spannungen. Ein NTC
  ist aber ein passiver Widerstand ohne eigene Spannung — sie entsteht erst im
  Spannungsteiler mit dem Pull-up des Steuergeräts:
  U = Uref × R / (R + Rpullup).
  Beleg durch Rückrechnung: Aus Widerstand und angegebener Spannung folgt ein
  Pull-up von 2375 Ω bei −10 °C, 1212 Ω bei 20 °C, 1150 Ω bei 40 °C, 968 Ω bei
  80 °C und 760 Ω bei 100 °C. Der unterstellte Pull-up schwankt um mehr als den
  Faktor drei — keine reale Steuergerätekonfiguration erzeugt diese Spalte, die
  Werte waren an keinem Fahrzeug nachprüfbar.
  Die Karte widerlegte sich zusätzlich selbst: Ihre eigene Notiz vermerkt, dass
  VAG häufig eine 2-Stufen-Kennlinie fährt und das Steuergerät den Pull-up im
  Messbereich umschaltet. Und `map` verweigert im selben Projekt ausdrücklich
  einen universellen Spannungswert.
  Fix: Spalte heißt jetzt „Rechenbeispiel 5 V über 1 kΩ" mit Werten, die aus den
  angegebenen Widerständen tatsächlich folgen (4,52/3,46/2,67/1,27/0,80 V); jede
  Zeile nennt den zugrunde gelegten Widerstand mit. Notiz erklärt Formel und
  Abhängigkeit und benennt den Widerstand als die belastbare Messgröße.
  Regression: `validate.js` Abschnitt 23. Zwei Prüfungen rechnen aktiv nach —
  die NTC-Spannungen aus U = 5 V × R/(R+1 kΩ) und die PT1000/PT200-Werte gegen
  die Callendar-Van-Dusen-Gleichung aus IEC 60751. Zahl und Physik können damit
  nicht mehr auseinanderdriften.

### Regel zuerst zu weit gefasst — korrigiert

Der erste Entwurf der verallgemeinerten Prüfung verlangte von **jeder**
Sensorkarte eine Begründung für absolute Signalspannungen und schlug bei
`poti-dk` und `lambda-sprung` an. Nachprüfung ergab: Die Karten sind richtig,
die Regel war falsch.
- `poti-dk` ist ein Potentiometer an der 5-V-Referenz — ein ratiometrischer
  Teiler im Sensor selbst. 0,5–0,9 V und 4,0–4,5 V sind Sensoreigenschaften.
- `lambda-sprung` ist eine Zirkonia-Zelle, die ihre Spannung galvanisch selbst
  erzeugt. 0,1–0,9 V gehören ihr.
Die Regel greift jetzt nur noch bei passiv-resistiven Sensoren, erkennbar an
einer Widerstandsspalte — dem einzigen Fall, in dem die Spannung erst durch die
Beschaltung entsteht.

### Geprüft und für korrekt befunden

- `ptc-sensor`: PT1000 (1078 Ω bei 20 °C, 1385 Ω bei 100 °C) und PT200
  (216/277 Ω) gegen IEC 60751 nachgerechnet — korrekt. KTY81-1xx mit 1000 Ω bei
  25 °C und ~1700 Ω bei 100 °C trifft die NXP-Kennlinie. Der Hinweis auf den
  Messleitungswiderstand bei kleinen PT200-Werten ist fachlich wichtig.
- `map`: vorbildlich — verweigert universelle Spannungswerte und begründet das
  mit dem Messbereich (1 bar Saugmotor gegen 2,5/3 bar Ladedruck).
- `oeldruck`: Ölstand zuerst, Elektrikprüfung ersetzt nie die Manometermessung,
  klares STOPP bei Warnung im Betrieb — richtig gewichtet.
- `dpf-diff`, `agt` (NTC/PTC/aktiv sauber unterschieden, Kaltvergleich mehrerer
  Sensoren), `klimadruck`, `ntc-ats`, `raildruck`: unauffällig.

### Offen

- Die NTC-Widerstandstabellen (`ntc-kts`, `ntc-ats`) sind generische
  „typ."-Werte ohne Quellenbindung. NTC-Kennlinien unterscheiden sich je
  Hersteller deutlich. Sie sind als Spannen gekennzeichnet und wurden deshalb
  nicht angetastet; eine Bindung an ein konkretes Bosch- oder VDO-Datenblatt
  wäre die saubere Ergänzung.

---

## Runde 6 · Sensorik II – Position, Drehzahl, Gemisch · 2026-09-05

Baseline: 123/123 grün → Abschluss: 130/130 grün · Version 8.8-Profi → 8.9-Profi

Geprüft: `poti-dk`, `lmm-a`, `lmm-d`, `lambda-sprung`, `lambda-breit`,
`radsensor`, `kw-ind`, `hall`, `klopf`, `nox`, `tankgeber`, `schalter`,
`sensor-masseversatz`.

### Befunde

- **High-Pegel an die Versorgung gebunden statt an den Pull-up** (`hall`)
  Die Tabelle führte „Signal HIGH — ≈ Versorgung" als grünes Kriterium. Viele
  Kfz-Hallgeber haben aber einen Open-Collector-Ausgang: Der Sensor zieht nur
  nach Masse, den High-Pegel legt der Pull-up im Steuergerät fest. Ein mit 12 V
  versorgter Geber mit 0↔5-V-Signal ist normal — nach der alten Tabelle wäre er
  durchgefallen.
  Beleg intern und eindeutig: Anleitungsschritt 4 derselben Karte nennt
  „fehlenden Pull-up" als mögliche Ursache, und das Feld `was` sagt
  „0↔5 V **oder** 0↔12 V". Die Karte `pullup-pulldown` erklärt im selben
  Projekt Pull-up-Kreise mit 5 V und 12 V samt typischer 1–10 kΩ.
  Fix: Tabellenzeile an den Pull-up gebunden, neue Zeile für den Fall
  „12 V versorgt / 0↔5 V Signal — kein Fehler", Notiz erklärt den
  Open-Collector-Ausgang und verweist per Chip auf `pullup-pulldown`.
  Regression: `validate.js` Abschnitt 24, verallgemeinert — keine Karte darf den
  Pull-up in den Schritten kennen und in der Tabelle „HIGH ≈ Versorgung"
  behaupten.

- **AC-Wert am Induktivgeber ohne Bandbreitenvorbehalt** (`kw-ind`)
  „AC beim Anlassen ~1–5 V" stand als Richtwert ohne Hinweis darauf, dass
  Multimeter für sinusförmige Netzfrequenz ausgelegt sind. Das Gebersignal ist
  weder sinusförmig noch 50 Hz und ändert seine Frequenz mit der Drehzahl; zwei
  Geräte zeigen am selben Geber unterschiedliche Werte.
  Beleg intern: `generator` macht genau diese Einschränkung bereits ausdrücklich
  („viele MM zeigen bei Gleichspannung/Regler-PWM falsche AC-Werte").
  Fix: Notiz ordnet den AC-Wert als Anwesenheitsnachweis ein — bewertet wird
  „steigt mit der Drehzahl", nicht die Zahl.

### Geprüft und für korrekt befunden

- `radsensor`: Strommodulation 7 ↔ 14 mA zutreffend; der Hinweis, dass die
  Pinzahl kein sicherer Typhinweis ist, ist ein häufig übersehenes Detail.
- `lambda-breit`: Pumpstrom ausdrücklich „nicht sinnvoll mit MM" — korrekt.
- `klopf`: ehrlich über die Unzuverlässigkeit der Piezo-Prüfung; Anzugsmoment
  zutreffend als kritisch.
- `nox`, `lmm-a`, `lmm-d`, `tankgeber`, `schalter`: unauffällig.
- `sensor-masseversatz`: verzichtet weiterhin bewusst auf eine Universalgrenze.
- `hall` im Übrigen: „MM zeigt nur Mittelwert" beim getakteten Rechteck ist
  korrekt.

---

## Runde 7 · 5-V-Referenzsatz · 2026-09-05

Baseline: 130/130 grün → Abschluss: 137/137 grün · Version 8.9-Profi → 8.10-Profi

Geprüft: `ref5v`, `ref5v-basis`, `ref5v-masseschluss`, `ref5v-plusschluss`,
`ref5v-vergleich`.

### Befunde

- **Einstiegskarte widerspricht der Detailkarte** (`ref5v-vergleich`)
  Die Vergleichsübersicht nannte als Erstmessung für den Plusschluss „Spannung
  Referenz ↔ Masse bei Zündung AUS" und als Befund „Spannung ohne Zündung
  vorhanden". Die Detailkarte `ref5v-plusschluss` sagt dagegen ausdrücklich:
  „‚Zündung aus' genügt NICHT" — es braucht die OEM-Nachlauf-/Power-down-Zeit,
  und „kurzzeitige Restspannung, Nachlauf oder ein Wake-up sind KEIN Befund".
  Analog war die Masseschluss-Spalte zu kurz gefasst („spannungsfrei" statt
  „am vollständig isolierten Leiter").
  Warum es zählt: Die Übersicht ist der Einstieg. Wer nach ihr arbeitet, trifft
  die Zuordnung, bevor er die Detailkarte überhaupt öffnet — und hätte eine
  Nachlaufspannung als belegte Fremdeinspeisung gewertet. Genau diesen
  Fehlschluss soll die Detailkarte verhindern.
  Fix: Beide Erstmessungs- und Befundzeilen an die Bedingungen der Detailkarten
  angeglichen, neue Zeile „Kein Befund" für Zwischenwerte und Restspannung,
  Notiz stellt klar, dass die Übersicht nur zuordnet und eine Zuordnung daraus
  ein Verdacht, kein Befund ist.
  Regression: `validate.js` Abschnitt 25, darunter eine Prüfung, die Übersicht
  und Detailkarte gegeneinander hält — beide müssen den Power-down fordern.

- **Verdacht als Gleichung formuliert** (`ref5v`)
  Das Feld `bad` sagte „0 V oder eingebrochen = Kurzschluss nach Masse/Plus oder
  Versorgung defekt", während die Richtwerttabelle derselben Karte korrekt
  „auffällig – erst nach Isolation bewertbar" führt. Jetzt als Verdacht
  formuliert.

### Geprüft und für korrekt befunden

`ref5v-basis`, `ref5v-masseschluss`, `ref5v-plusschluss` — fachlich vorbildlich,
unverändert. Besonders sauber: Messpunkt am Sensorstecker statt am Steuergerät;
Gegenprobe gegen Batterieminus zur Trennung von Masseversatz; Widerstand gegen
Masse erst am vollständig isolierten Leiter belastbar, Zwischenwerte
ausdrücklich Verdacht und möglicherweise Halbleiterstrecke im Steuergerät;
Bewertung von Stabilität und Abweichungsrichtung statt der zweiten
Nachkommastelle.

---

## Runde 8 · Aktoren · 2026-09-05

Baseline: 137/137 grün → Abschluss: 147/147 grün · Version 8.10-Profi → 8.11-Profi

Geprüft: alle 14 Aktorkarten sowie die aus Runde 1 zurückgestellte
Grundsatzfrage `warn` gegen `dont`.

### Grundsatzfrage aus Runde 1 — entschieden

Bestandsaufnahme statt Geschmacksentscheidung: Von zwölf Karten, die eine
Personen- oder Brandgefahr im `dont`-Block nennen, trugen **neun** bereits einen
sichtbaren Warnblock dazu. Das ist keine Konvention, sondern eine Lücke bei den
übrigen. Tragende Regel des Bestands: `dont` für das, was Bauteile beschädigt —
`warn` für das, was Menschen verletzt oder brennt.

### Befunde

- **Vier Karten mit Personen- oder Brandgefahr ohne jeden Warnblock**
  `tankgeber` („keine Funken/Zündquellen am offenen Tank – Explosionsgefahr"),
  `kraftstoffpumpe` („keine Funken am Kraftstoffsystem"), `lambda-sprung`
  („heiße Abgasteile nicht berühren"), `agt` („nicht am heißen Abgasstrang
  arbeiten"). Dazu `klimadruck`, das den Kältemittelkreis nur indirekt
  absicherte, ohne die Gefahr zu benennen.
  `tankgeber` sticht heraus: Die Karte schrieb das Wort „Explosionsgefahr"
  selbst in ihren `dont`-Block und zeigte dem Anwender trotzdem keine Warnung.
  Fix: `danger` für `tankgeber` (zündfähiges Dampf-Luft-Gemisch, keine
  Schaltvorgänge in Tanknähe – auch Relais und Prüflampe zünden) und
  `kraftstoffpumpe` (Kraftstoff, Dämpfe, Restdruck, OEM-Druckabbau), jeweils
  `risk` auf `hoch`; `caution` für `lambda-sprung`, `agt` und `klimadruck`
  (Erfrierungen, R1234yf entzündlich).
  Regression: `validate.js` Abschnitt 26, verallgemeinert auf jede Karte mit
  Personen- oder Brandgefahr im `dont`-Block. Drei weitere Prüfungen sichern die
  Gegenrichtung: Die elektrische Prüfung muss zulässig erkennbar bleiben.

- **Restliche feste Abfallgrenzen in Aktorkarten** (`luefter` fs2, `hupe`
  fs2/fs3) an die Vorgabe des jeweiligen Kreises gebunden — wie seit v8.5 in
  `spannungsabfall` und seit v8.7 in `batterie`, `generator`, `starter`.
  Projektweit verbleibt damit **eine einzige** feste Abfallgrenze in einem
  Arbeitsschritt: `leitung` fs9, Runde 9.

### Geprüft und für korrekt befunden

`pwm`, `magnetventil`, `taktventil`, `stellmotor`, `ventil-tank`, `motor-allg`,
`zuendspule` (Sekundärseite nur per Oszilloskop, Warnung gegen Hineingreifen),
`gluehkerze` (Niedervolt-Kerzen 4,4/7 V nie an 12 V — wichtiger Bauartschutz),
`ptc-heizung` (bis ~80 A, Gefahrblock gegen Reihenmessung),
`injektor-benzin`/`injektor-diesel` (in Runde 1 bearbeitet), `luefter`, `hupe`.

---

## Runde 9 · Bus & Leitungen · 2026-09-05

Baseline: 147/147 grün → Abschluss: 155/155 grün · Version 8.11-Profi → 8.12-Profi

Geprüft: `can`, `lin`, `pullup-pulldown`, `generator-lin-bsd`, `masse`,
`leitung`, `backprobe`, `kurzschluss-plus-masse`.

### Befunde

- **„120 Ω = ein Abschluss fehlt" ist zu kurz gegriffen** (`can`)
  Derselbe Messwert entsteht auch, wenn CAN-High oder CAN-Low **zwischen** den
  beiden Abschlüssen unterbrochen ist: Der Bruch trennt den entfernten Abschluss
  ab, gemessen wird nur noch der nähere. Zwei grundverschiedene Reparaturen —
  fehlendes Steuergerät gegen Kabelbruch — mit identischem Messwert. Wer nur den
  ersten Fall kennt, sucht am falschen Ende und findet nichts, weil alle
  Steuergeräte da sind.
  Fix: `bad`, Einsteigertext und Anleitung benennen beide Ursachen und den
  Schritt, der sie trennt (spannungsfrei beide Adern über die gesamte Strecke auf
  Durchgang prüfen). Tabelle löst die eine Zeile in drei auf.
  Zwei weitere Klarstellungen in der Notiz: ~60 Ω belegt nur zwei parallele
  Abschlüsse, nicht intakte Adern und nicht fehlerfreie Kommunikation; und
  „Zündung aus" ist nicht spannungsfrei, weil Steuergeräte an Klemme 30 versorgt
  bleiben und den Bus wecken können — dieselbe Unterscheidung, die der
  5-V-Referenzsatz seit v8.10 ausdrücklich trifft.
  Regression: `validate.js` Abschnitt 27, dazu eine Prüfung der CAN-Pegel gegen
  die klassische High-Speed-Physik (rezessiv 2,5 V, dominant 3,5/1,5 V).

- **Letzte ungebundene Abfallgrenze** (`leitung` fs9, „< 0,2 V → belastbar")
  an die Vorgabe des Kreises gebunden. Damit ist die in Runde 2 begonnene
  Umstellung projektweit abgeschlossen: `spannungsabfall` (v8.5),
  `batterie`/`generator`/`starter` (v8.7), `luefter`/`hupe` (v8.11), `leitung`
  (v8.12). Eine neue projektweite Prüfung hält den Zustand.

### Geprüft und für korrekt befunden

- `lin`: rezessiv nahe Bordspannung, dominant nahe 0 V, Master/Slave-Rollen
  korrekt; besonders gut die Klarstellung, dass ein fester High-Pegel keinen
  Leitungsfehler beweist, sondern Idle, Sleep oder fehlender Master sein kann.
- `pullup-pulldown`: Pegel gegen Sensor-Masse UND Batterieminus vergleichen —
  richtig und selten so sauber formuliert.
- `masse`, `backprobe`, `kurzschluss-plus-masse`, `generator-lin-bsd`:
  unauffällig.

---

## Runde 10 · Diagnosebäume · 2026-09-05

Baseline: 155/155 grün → Abschluss: 161/161 grün · Version 8.12-Profi → 8.13-Profi

Geprüft: alle 15 Bäume, 109 Knoten — Struktur, Verzweigungskriterien,
Sicherheitsgates, Tauschempfehlungen.

### Befunde

- **Verzweigung über eine Schwelle mit Deckungslücke** (`starter-langsam[0]`)
  Die Einstiegsfrage bot „Bricht stark ein (< 9,6 V)" gegen „Bleibt > 10 V".
  Zwischen 9,6 und 10 V passte keine der beiden Antworten — wer 9,8 V misst,
  stand ohne gangbaren Weg im Baum. Zusätzlich entschied der Baum über eine
  feste Zahl, obwohl die verlinkte Karte `starter` 9,6–10 V ausdrücklich als
  Orientierungswert und nicht als Bestehensgrenze führt (seit v8.7 auch in
  ihren Schritten).
  Fix: Frage nennt Orientierungswert samt Vorbehalt und Einflussgrößen, beide
  Antworten lauten „unter der OEM-Vorgabe" und „im Rahmen der OEM-Vorgabe" —
  lückenlos und ohne feste Zahl.
  Regression: verallgemeinert — keine Baumverzweigung darf über eine feste
  Zahlenschwelle entscheiden, geprüft über alle 109 Knoten für V, mV, A, mA, Ω
  und °C.

- **Relaistausch ohne Sockelbeurteilung** (`keine-spannung[4]`)
  „Relaiskontakt verbrannt … Relais tauschen." — während der Spezialbaum
  `relais-schaltet-nicht` an derselben Stelle warnt: „Ein neues Relais im
  beschädigten Sockel brennt erneut ab." Der allgemeine Baum gab die Empfehlung,
  vor der der spezielle warnt.
  Fix: Ergebnis verlangt Beurteilung von Halteklemmen und Kontaktflächen,
  Nachweis durch erneute Messung unter derselben Last, Verweis auf `relais` und
  `relais-leistung`.

### Regel zweimal nachgeschärft

Die Relais-Regel schlug zunächst bei drei Ergebnissen an, die sich beim
Nachlesen als richtig erwiesen: `relais-schaltet-nicht[8]` („Bauart
gegenprüfen, **bevor** ersetzt wird" — Vorbedingung), `[10]` („Relais **nicht**
ersetzen" — Verneinung) und `keine-spannung[1]` (dort wird die **Sicherung**
getauscht, „Relais" stand nur im Querverweis). Die Regel nimmt Verneinungen,
Vorbedingungen und Querverweise jetzt aus.

### Geprüft und für korrekt befunden

Keine Sackgassen, alle Knoten erreichbar, alle Sprungziele gültig. Inhaltlich
besonders sauber: `generator-laedt-nicht[6]` („nicht den Generator tauschen"),
`[11]` (AC-Anteil nur ein Verdacht, Oszilloskop vor dem Tausch),
`steuergeraet-offline[1]` („Nicht das Steuergerät tauschen, bevor Versorgung
unter Last stimmt"), `5v-kurzschluss[8]` („Noch kein Austauschgrund") und `[12]`
(„Erst jetzt darf der Steuergeräteausgang bewertet werden").

---

## Runde 11 · Glossar, Suche, Querverweise · 2026-09-05

Baseline: 161/161 grün → Abschluss: 176/176 grün · Version 8.13-Profi → 8.14-Profi

Geprüft: Suchindex, `syn`-Felder, `linkifyRefs`, 53 Glossareinträge,
Begriffskonsistenz.

### Befunde

- **Die Suche erfasste den Großteil des Inhalts nicht**
  Der Index umfasste nur die Kopffelder (`nm`, `was`, `id`, `mess`, `next`,
  `syn` und die Meta-Listen). Die gesamten `DEEP`-Inhalte — Anleitung,
  Richtwerttabellen samt Notizen, Ursachenlisten, Fehlersuchketten — sowie
  `good`, `bad` und `beg` blieben außen vor. Das ist der weitaus größte Teil des
  Textes.
  Beleg durch Messung: Zehn Begriffe, die in der App stehen, lieferten null
  Treffer — `AGM` (Ladetabelle `batterie`), `Wegfahrsperre` (Notiz `starter`),
  `Rekuperation` (Anleitung `generator`), `Schleifring` (Ursachen `srs-airbag`),
  `Common Rail`, `TFSI`, `Spannungsteiler`, `Sulfatierung`, `Nullabgleich`,
  `Open Collector`. Für ein Werkstatt-Nachschlagewerk ist das die teuerste Sorte
  Fehler: Der Inhalt ist da, die Arbeit steckt drin, und der Anwender findet ihn
  nicht.
  Fix: einmalig aufgebauter Suchindex über den gesamten Karteninhalt
  einschließlich `DEEP`, HTML-Auszeichnung beim Aufbau entfernt. Einmalig statt
  pro Tastendruck, weil 74 Karten samt Tiefeninhalten bei jedem Anschlag neu zu
  serialisieren auf dem Handy spürbar wäre.
  Regression: `validate.js` Abschnitt 29, 15 Prüfungen. Darunter eine, die aus
  dem letzten Anleitungsschritt jeder Karte ein Wort zieht und im Index sucht —
  damit kann der Index nicht wieder auf die Kopffelder zusammenschrumpfen. Dazu
  die Gegenprobe, dass ein Unsinnsbegriff weiterhin null Treffer liefert.

### Damit erledigt sich die offene Frage aus Runde 1

`injektor-benzin` hat kein `syn`-Feld — braucht es aber nicht mehr:
„Direkteinspritzer", „TFSI" und „GDI" stehen in den Tiefeninhalten der Karte
und werden jetzt gefunden.

### Geprüft und für korrekt befunden

- Alle 74 Kartennamen waren schon vorher auffindbar und sind es weiterhin.
- Querverweis-Chips lösen sämtlich auf gültige Ziele auf.
- 14 Karten führen ein `syn`-Feld; die Pflege bleibt sinnvoll für Begriffe, die
  sonst nirgends im Text stehen (etwa `P0130`, `Arbeitsstromrelais`).
- „Kaltwiderstand" liefert weiterhin null Treffer — der Begriff steht
  tatsächlich nur in `SOURCES.md`, nicht in der App. Kein Befund.

---

## Runde 12 · PWA, Offline, A11y, Theme · 2026-09-05

Baseline: 176/176 grün → Abschluss: 181/181 grün · Version 8.14-Profi → 8.15-Profi

### Befunde

- **Bewegungsreduktion deckte 3 von 11 Bewegungen ab**
  Der `prefers-reduced-motion`-Block erfasste nur `scroll-behavior`, `.overlay`
  und `.install-banner`. Im Stylesheet stehen zehn Transitions und eine
  Animation; Transform- und Opacity-Übergänge an Karten, Chips und Buttons
  liefen trotz eingestellter Bewegungsreduktion weiter. Diese Einstellung wird
  nicht aus Geschmack gesetzt — vestibuläre Störungen, Migräne und
  Anfallsleiden sind die üblichen Gründe; sie teilweise zu respektieren hilft
  niemandem.
  Fix: globale Fassung für alle Elemente samt Pseudoelementen, mit Restdauer
  `.01ms` statt `0s`, damit ein `transitionend` weiterhin feuert.
  Nachgezogenes Detail: Das Overlay schaltet `visibility` über eine
  `transition-delay` von 0,26 s. `transition-duration` allein hätte diese
  Verzögerung stehen lassen — die alte Einzelregel `.overlay{transition:none}`
  hatte sie mit abgedeckt. Deshalb `transition-delay` und `animation-delay`
  ebenfalls auf `0s`.
  Regression: `validate.js` Abschnitt 30, vier Prüfungen einschließlich der
  Verzögerungen.

### Kontrollumfang erweitert, ohne Reparaturbedarf

Der Validator prüfte Kontraste an **zwei fest verdrahteten Farbpaaren**. Jetzt
rechnet er die WCAG-Formel für alle acht Textfarben gegen beide Hintergründe in
beiden Schemata durch — 32 Paare. **Alle bestehen**, Minimum 4,74:1 (`--red` auf
`--card`, dunkel), Maximum 17,48:1. Hier gab es nichts zu reparieren; ab jetzt
fällt aber eine Palettenänderung sofort auf, die einen Wert unter 4,5:1 drückt.

### Geprüft und für korrekt befunden

Service Worker, Cache-Isolation, Precache, Update-Banner, Versionssynchronität
(Abschnitt 13); Fokus-Trap, `inert`-Hintergrund, `aria-current`, `aria-pressed`,
Touchziele ≥ 44 px (Abschnitt 14); genau ein Light-Block an der richtigen Stelle
(Abschnitt 15). `role="dialog"`, `aria-modal`, `aria-live`, `@media print`,
`:focus-visible` und `lang` sind vorhanden.

---

## Runde 13 · Quellenpflege · 2026-09-05

Baseline: 181/181 grün → Abschluss: 189/189 grün · Version 8.15-Profi → 8.16-Profi

Geprüft: alle 24 in `SOURCES.md` verlinkten Adressen, dazu die Normstände.

### Befunde

- **Ein echter Totlink** (NXP KTY81-Datenblatt)
  `nxp.com/docs/en/data-sheet/KTY81_SER.pdf` liefert HTTP 404 — zweifach
  geprüft, auch über Umleitungen. NXP hat das Dokument nach der Abkündigung
  entfernt.
  Fix: Die Zeile führt die Adresse nicht mehr als Link, sondern nennt den Befund
  samt Datum. Der Zahlenwert der Karte `ptc-sensor` (KTY81-1xx: ~1000 Ω bei
  25 °C, ~1700 Ω bei 100 °C) bleibt unverändert — er stützt sich auf die
  Dokumentausgabe Rev. 05 vom 25.04.2008, nicht auf die Erreichbarkeit einer
  URL. Entfallen ist der Abrufweg, nicht der Beleg.

- **Acht 403-Antworten sind KEINE toten Links** (ISO ×4, Littelfuse ×3,
  GS Yuasa Info-Hub). Die Seiten bestehen; der Anbieter weist automatisierte
  Abrufe ab. Diese Unterscheidung ist jetzt in `SOURCES.md` festgehalten — wer
  403 und 404 in einen Topf wirft, wirft gute Quellen weg.

- **Zwei Ford-PDFs nicht abschließend beurteilbar.** Der Host antwortet mit 200,
  die beiden Dateien brechen die Verbindung ab. Genau so vermerkt, statt es in
  die eine oder andere Richtung zu behaupten.

### Bewusst nicht getan

Kein Ersatzlink für das KTY81-Datenblatt. Distributor-Spiegel existieren, weisen
automatisierte Abrufe aber ihrerseits mit 403 ab und konnten nicht gegengeprüft
werden. Sie als Quelle zu führen, hätte eine Prüfung vorgetäuscht, die nicht
stattgefunden hat.

### Regression

`validate.js` Abschnitt 31. Darunter die **Linkbilanz**: 24 geprüft − 1 entlinkt
= 23 vorhanden, gezählt an der Datei selbst. Damit kann die Dokumentation nicht
stillschweigend von der Realität abweichen. Dazu die Normstände: ISO 8820-3:2015
gültig, FDIS ausdrücklich nicht als publiziert, IEC 60751, ISO 11898-2:2026,
ISO 17987-3:2025.

---

## Runde 14 · Zweiter Durchgang: Begriffsschärfe und Restgrenzen · 2026-09-05

Baseline: 190/190 grün → Abschluss: 199/199 grün · Version 8.16-Profi → 8.17-Profi

Methode: kein Einzelthema, sondern die vier Fehlermuster aus Durchgang 1 als
Suchraster über alle 74 Karten, 15 Bäume und `FUSE_TYPES`.

### Befunde

- **„stromlos" statt „spannungsfrei" als Bedingung der Ohm-Messung**
  (`widerstand` `was`, `magnetventil`, `can`, `ref5v-plusschluss`,
  `ref5v-vergleich`)
  Ein Ohmmeter speist einen eigenen Prüfstrom ein; eine anliegende
  Fremdspannung überlagert ihn und verfälscht das Ergebnis — auch dann, wenn
  gerade kein Strom fließt. Ein Kreis mit offenem Verbraucher ist stromlos und
  trotzdem spannungsführend. Beleg intern: `widerstand` fordert im Feld `mess`
  selbst „NUR spannungsfrei!", sagt im Feld `was` aber „im stromlosen Zustand".
  Fix: alle fünf Stellen auf „spannungsfrei" gezogen; `magnetventil` erklärt den
  Unterschied jetzt ausdrücklich, statt ihn nur zu vermeiden.
  Nicht geändert, weil korrekt: `relais` („87 stromlos" = unbestromter
  Ruhezustand der Spule), `spannung`, `sicherung`.

- **Neun Festgrenzen, die alle bisherigen Prüfungen überlebt hatten**
  Die projektweite Regel war über vier Runden gewachsen und jedes Mal
  unvollständig: v8.7 prüfte `anl`/`fs` nur bei OEM-gebundenen Tabellen, v8.12
  `anl`/`fs` projektweit — Kopffelder, Tabellenzeilen, Notizen, Meta-Listen und
  Baumknoten blieben außen vor. Dort überlebten: `masse.good`
  („< 0,1–0,2 V unter Last", während die eigene Tabelle korrekt OEM-gebunden
  ist) sowie acht Tabellenzeilen in `ptc-heizung`, `luefter`,
  `kraftstoffpumpe`, `motor-allg`, `leitung`, `hupe` (zwei) und `relais`.
  Fix: alle neun an die Vorgabe des Kreises gebunden, Vergleichskreis als
  Ersatzregel. Die Prüfung erfasst ab sofort den **gesamten** Bestand.

- **`radsensor`: Ohm fehlte in der Geräteeinstellung**, obwohl die Karte für
  sicher passive Geber eine Spulen-Ohm-Messung vorschreibt. Ergänzt mit dem
  Vorbehalt „nur bei sicher passivem Geber".

### Neu abgesichert, ohne Reparaturbedarf

Die Tabelle „≈ mV pro 100 mA" (`ruhestrom-fuse`) ist aus `FUSE_TYPES` ableitbar
(U = R/10) und war korrekt, aber nirgends gesichert. Der Validator rechnet jetzt
alle sieben Zeilen nach; Zeilen wie „Mini/Standard 3 A" decken zwei Bauformen ab
(ATOF 3,11 mV, MINI 3,38 mV), die Spanne folgt aus beiden. Dazu die
Monotonieprüfung der Widerstandsreihen — ein Tippfehler in einem Einzelwert
fiele sofort auf.

### Ergebnislos geprüft

Scan über alle Karten nach harten Entscheidungsgrenzen in anderen Einheiten
(mV, mA, A, Ω, kΩ, °C, %): keine einzige ungebundene Stelle.

---

## Runde 15 · Zweiter Durchgang: Freigabekriterien und Spaltenköpfe · 2026-09-05

Baseline: 199/199 grün → Abschluss: 207/207 grün · Version 8.17-Profi → 8.18-Profi

### Befunde

- **Grünes Freigabekriterium für eine Messung, die die Karte selbst verwirft**
  (`zuendspule`)
  Die Tabelle führte „Primär-Ohm (falls messbar) — < 1 Ω typ." als grün. Dieselbe
  Karte sagt an drei Stellen das Gegenteil: Anleitung Schritt 1
  („bei integrierter Elektronik oft nicht direkt messbar"), Tabellennotiz
  („Primär kaum sinnvoll mit MM") und `quality` („nur Primär-Grundprüfung").
  Bei Stab- und COP-Spulen mit integrierter Endstufe misst man die Elektronik
  statt der Wicklung; bei Werten um 1 Ω liegt zudem der Messleitungswiderstand in
  derselben Größenordnung wie das Messobjekt.
  Fix: Bauartbedingung und OEM-Bindung in die Zeile, Hinweis auf den
  Messleitungswiderstand, Ampel von grün auf gelb (keine Freigabe).
  `mess`/`good`/`bad` tragen den Vorbehalt mit; Versorgung und Masse bleiben als
  brauchbare Prüfung erhalten — der Validator prüft diese Gegenrichtung.

- **Zwölf Tabellen mit fehlendem oder falschem Spaltenkopf**
  Sieben (`ntc-ats`, `lmm-d`, `lambda-breit`, `klopf`, `agt`, `nox`, `tankgeber`)
  rendern ein komplett leeres `<th>`, obwohl die Zellen darunter
  „plausibel"/„auffällig" mit Ampelfarbe tragen — für Screenreader ist die
  Spalte unbenannt, während alle übrigen rund sechzig Tabellen sie beschriften.
  Fünf weitere waren falsch beschriftet: `widerstand` und `durchgang`
  („Bedeutung"), `injektor-diesel` und `ruhestrom-fuse` („Hinweis"). Bei
  `sensor-masseversatz` waren die Köpfe verschoben — „Bewertung" stand über dem
  Text, „Hinweis" über der Ampel; jetzt „Beobachtung | Einordnung | Bewertung".
  Regression: drei Prüfungen, darunter eine, die alle 74 Detailansichten im DOM
  auf leere `<th>` prüft statt nur die Daten.

### Ergebnislos geprüft

- Zustandslogik: Suche mit Regex-Sonderzeichen, Umlauten, `Ω`, `→`; Kategorie
  plus Suche; Merkliste anlegen/listen/entfernen; Overlay-Verschachtelung
  Detail → Baum → Detail; Einsteiger-Umschaltung bei offenem Detail; Rechner mit
  negativen, leeren, riesigen und textuellen Eingaben. Keine Auffälligkeit,
  kein Laufzeitfehler.
  (Ein vermeintlicher Befund „Kategorie + Suche filtert nicht" war ein Fehler im
  Testaufbau: `activeCat` ist eine Closure-Variable und lässt sich nicht von
  außen setzen. Über den echten Kategorie-Chip verhält sich die App korrekt.)
- Struktur: alle Pflichtfelder vorhanden, `DEEP`-Daten vollständig, keine leere
  Tabellenzelle, keine ungültige Ampelwertung.
- Querabgleich der Zahlenwerte über Kartengrenzen: Unterschiede bei „Heizung
  (Ohm, kalt)", „Spulen-Ohm" und „Ruhespannung" sind sachlich begründet.

---

## Runde 16 · Zweiter Durchgang: Glossar · 2026-09-06

Baseline: 207/207 grün → Abschluss: 218/218 grün · Version 8.18-Profi → 8.19-Profi

Geprüft: alle 53 Glossareinträge auf Fachrichtigkeit, Widerspruchsfreiheit zu den
Karten und Erreichbarkeit.

### Befunde

- **Das Glossar war von der Suche nicht erreichbar**
  Runde 11 hatte den Suchindex auf die gesamten Karteninhalte erweitert, das
  Glossar aber nicht erfasst — es lebt in einem eigenen Overlay und wurde von
  `filterTests` nie berührt. „True-RMS" und „CAT-Messkategorie" stehen
  ausschließlich dort und lieferten null Treffer, obwohl die App sie erklärt.
  Derselbe Fehlertyp wie in Runde 11, eine Ebene tiefer.
  Fix: Glossartreffer erscheinen bei aktiver Suche direkt im Suchergebnis, mit
  derselben aufklappbaren Auszeichnung wie in der Glossaransicht. Bei null
  Kartentreffern sagt die Leermeldung ausdrücklich, dass das Glossar den Begriff
  kennt. Ohne Suchbegriff wird kein Glossarblock angehängt.
  Regression: sieben Prüfungen, beide Richtungen abgedeckt.

- **`KTY`-Eintrag verallgemeinerte einen Reihenwert**
  „Silizium-PTC-Temperatursensor (~1000 Ω bei 25 °C)" — dieser Nennwert gehört
  zur Reihe, nicht zum Namen: KTY81-1xx ~1000 Ω, KTY81-**2xx** ~2000 Ω. Für die
  halbe KTY81-Familie also um den Faktor zwei daneben. Widerspruch im eigenen
  Bestand: Die Karte `ptc-sensor` bindet korrekt an „KTY81-1xx", und
  `SOURCES.md` schreibt „Nur die konkrete KTY81-Type, nicht auf beliebige
  Kfz-PTC übertragen".
  Fix: Eintrag nennt beide Reihen mit Nennwerten und stellt klar, dass ohne die
  konkrete Type kein Sollwert ableitbar ist.

### Fachlich geprüft, ohne Befund

Alle übrigen 52 Einträge. Nachgerechnet und bestätigt: PT200/PT1000
(„200 bzw. 1000 Ω bei 0 °C, ca. +0,39 %/°C" deckt sich mit IEC 60751),
Flussspannung (identisch mit der Karte `diodentest`), Watt (P = U × I),
Sicherungs-Innenwiderstand (I = U / R). Open Collector deckt sich mit der in
Runde 6 korrigierten Karte `hall`. V⎓/V~, CAT-Messkategorie, True-RMS,
Autorange, MIN/MAX und Polyfuse sachlich korrekt.
