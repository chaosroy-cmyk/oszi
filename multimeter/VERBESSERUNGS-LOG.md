# Verbesserungs-Log · KFZ Multimeter Profi

Fortschrittsregister des Verbesserungs-Loops. Arbeitsanweisung:
[`PROMPT-VERBESSERUNG.md`](PROMPT-VERBESSERUNG.md).

**Nächstes Fokusthema: 9 · Bus & Leitungen**

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
