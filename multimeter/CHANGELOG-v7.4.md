# CHANGELOG v7.4 – v7.9

## v7.9 — Stufe A: Lernkarten für die Methodenkarten + Einklapp-Mechanik

**Einklappbare Anleitung.** Die ausführliche Anleitung wurde bisher jedem
angezeigt – auch dem Meister, der nur den Sollwert sucht. Sie liegt jetzt in
einem `<details>`-Block: im **Einsteiger-Modus automatisch offen**, im
Profi-Modus zugeklappt auf eine Zeile mit Schrittzähler („10 Schritte ▶").
Der Inhalt bleibt im DOM (Suche, Screenreader, Drucken unberührt). Damit
bekommt der Einsteiger-Modus echtes Gewicht, ohne die Werkstattnutzung zu
verlangsamen.

**Vier fehlende Anleitungen ergänzt** – die auffälligste Lücke des Tools:
`spannung`, `widerstand`, `durchgang` und `sicherung` hatten keine, während
Randthemen wie „Messprotokoll führen" eine hatten. Jeder Schritt erklärt
zusätzlich das *Warum*:

- **Spannung messen** (8 Schritte + Merksatz): Spannung besteht immer zwischen
  zwei Punkten; Bezugspunkt bewusst wählen; Sollwert **vor** der Messung
  notieren; Zustand dokumentieren; unter Last gegenprüfen.
- **Widerstand messen** (9 + Merksatz): wie das Ohmmeter arbeitet und warum
  daraus „nur spannungsfrei" und „Bauteil isolieren" zwingend folgen;
  Nullabgleich; Temperaturabhängigkeit; 0 Ω ist kein Belastbarkeitsnachweis.
- **Durchgang prüfen** (7 + Merksatz): Piepschwelle 20–70 Ω je Gerät;
  Selbsttest der Messleitungen; wann Durchgang genügt und wann nicht.
- **Sicherung/Relais** (10 + Merksatz): Haarriss-Problematik; Messung an der
  gesteckten Sicherung; Klemmenlogik 30/87/85/86; der klickende, aber
  abgebrannte Relaiskontakt; niemals höher absichern.

**Einsteiger-Texte** dieser vier Karten von Stichworten auf didaktische
Erklärungen ausgebaut (je 600–900 Zeichen, Niveau der `leitung`-Karte).

**Nebenbefund behoben:** Die 5-V-Toleranz stand an sechs Stellen, die
Vereinheitlichung in v7.7 hatte nur eine erwischt. Jetzt durchgängig
4,9–5,1 V (Karte `ref5v`, DEEP `spannung`, DEEP `ref5v` in drei Feldern,
Diagnosebaum `sensor-unplausibel`).

`validate.js` prüft jetzt zusätzlich, dass jede Anleitung als einklappbarer
Block erscheint, im Profi-Modus zu und im Einsteiger-Modus offen ist und der
Inhalt in beiden Fällen im DOM liegt.

Version 7.9-Profi ↔ Cache v7-9. Validierung: 29/29 bestanden.

---

## v7.8 — Karte „Leitung prüfen" zur Lernkarte ausgebaut

Die Karte hatte bisher keinen Anleitungsblock (`DEEP.anl`) und beschrieb den
Ablauf nur in einer Zeile. Für Auszubildende war daraus weder die Reihenfolge
noch der Zweck der einzelnen Schritte ableitbar.

- **12-stufige Anleitung** ergänzt: Auftrag klären → spannungsfrei →
  Nullabgleich → Sichtprüfung → Pin-Fit → Unterbrechung → Schluss nach Masse →
  nach Plus → gegen Nachbarader → Wackeltest → Spannungsabfall unter Last →
  Reparatur nachweisen. Jeder Schritt erklärt zusätzlich das *Warum*.
- **Einsteiger-Text** didaktisch ausgebaut (Gartenschlauch-Modell der vier
  Fehlerarten statt Stichworten).
- **Lernübersicht als Zweittabelle** (`rt2`): Fehlerart → Messbefund →
  typisches Symptom am Fahrzeug, inklusive der Kernaussage, dass sich der
  Übergangswiderstand nur unter Last nachweisen lässt.
- **Fehlersuche** von 5 auf 10 Schritte erweitert, Schluss gegen Nachbarader
  und Nullabgleich als eigene Schritte.
- Zwei Merksatz-Hinweise ergänzt (Durchgang ≠ Belastbarkeit; Reihenfolge).

**Dabei gefundener Fehler:** Der in v7.7 eingeführte `rt2`-Block wurde nur in
der Basis-`openDetail` gerendert, nicht in der v6-Überschreibung – und die
gewinnt. Beide Zweittabellen (5-V-Eingrenzung und Leitungs-Lernübersicht)
waren dadurch unsichtbar. Hook in beiden Definitionen ergänzt; `validate.js`
prüft jetzt zusätzlich, ob jede `rt2` im gerenderten DOM tatsächlich
erscheint – ein stiller Inhaltsverlust dieser Art fällt künftig sofort auf.

Version 7.8-Profi ↔ Cache v7-8. Validierung: 26/26 bestanden.

---

## v7.7 — Kartensatz „5-V-Referenz Kurzschluss"

Neue Kategorie **5-V-Referenz** (`CATS`, nach „Sensoren") mit vier Karten,
vier DEEP-Blöcken und dem Diagnosebaum `5v-kurzschluss` (11 Knoten):
`ref5v-basis`, `ref5v-masseschluss`, `ref5v-plusschluss`, `ref5v-vergleich`.
Inhalt und freigabepflichtige Werte: siehe REVIEW.md.

Zwei Renderer-Ergänzungen waren dafür nötig:

- **`DEEP.rt2`** (optionale Zweittabelle): Konvention 6 (`DEEP.rt` verdrängt
  `TESTS.table`) hätte die geforderte Eingrenzungstabelle „Sensor abgesteckt →
  Schluss weg/bleibt" unsichtbar gemacht. Statt die Konvention zu umgehen,
  rendert `openDetail` jetzt zusätzlich ein `rt2` mit eigener Überschrift.
- **Horizontal scrollbare Tabellen** (`.tbl-wrap`): Die dreispaltige
  Vergleichstabelle wurde am Displayrand abgeschnitten. Alle Tabellen liegen
  jetzt in einem `overflow-x`-Container, dreispaltige ohne Bewertungsspalte
  bekommen zusätzlich eine Mindestbreite.

`validate.js` erweitert: prüft `rt2`-Spaltenkonsistenz und meldet als
**Hinweis** (kein Fehler), wo `TESTS.table` unter einem `DEEP.rt` liegt und
deshalb nie gerendert wird — aktuell 12 Altkarten.

Version 7.7-Profi ↔ Cache v7-7. Validierung: 25/25 bestanden, 70 Karten,
14 Diagnosebäume.

---

# CHANGELOG v7.4 / v7.5 / v7.6

## v7.6 — Einsteiger-Modus mit Rückmeldung, Copyright

**Einsteiger-Schalter wirkte funktionslos.** Technisch war er in Ordnung
(der Block „Einfach erklärt" erschien in der Detailansicht), aber beim
Antippen auf der Startseite passierte sichtbar **nichts** – der Einsteiger-
Text steht erst eine Ebene tiefer. Für den Nutzer war der Schalter damit
tot. Behoben durch drei Ergänzungen:

1. **Kurzmeldung (Toast)** beim Umschalten: „Einsteiger-Modus AN – ‚Einfach
   erklärt' wird angezeigt" bzw. „AUS".
2. **Sichtbarer Hinweisbalken** auf Start- und Merklisten-Ansicht, solange
   der Modus aktiv ist (erklärt, wo der Text erscheint und wie man ihn
   wieder ausschaltet).
3. **Sofortwirkung bei offener Prüfung:** Wird während einer geöffneten
   Detailansicht umgeschaltet, wird diese neu aufgebaut (Scrollposition
   bleibt erhalten) – vorher musste man die Karte erst schließen und neu
   öffnen.

**Copyright ergänzt** (© 2026 Roy Sperlich – Alle Rechte vorbehalten):
Fußzeile auf Start-, Merklisten- und Glossaransicht (mit Versionsangabe und
Richtwert-Hinweis), Kommentarkopf in `index.html` und `sw.js`, Meta-Tags
`author` und `copyright`.

Version 7.6-Profi ↔ Cache v7-6. Validierung: 25/25 bestanden.

---


## v7.5 — FUSE_R-Konflikt behoben (Datenblatt-Verifikation)

Der unter „Entscheidungen bei Widersprüchen" offen gelassene Punkt ist
geklärt. Prüfung gegen die Original-Datenblätter (Littelfuse ATOF 287
Rev. 02/2025, MAXI 299 Rev. 01/2025, Abgleich MINI 297) ergab: **die bis v7.4
hinterlegten Widerstände waren zu hoch**, die Erwartung des Auftrags war
korrekt. `FUSE_R` enthält jetzt die exakten Datenblattwerte
(10 A: 11 → **7,70 mΩ**, 20 A: 5,8 → **3,38 mΩ**, vollständige Tabelle in
REVIEW.md). Der Rechner hatte dadurch Ruheströme um Faktor ~1,4 zu niedrig
ausgewiesen — ein 100-mA-Verbraucher erschien als 70 mA und damit als
unauffällig.

Ebenfalls angepasst: Richtwerttabelle „≈ mV pro 100 mA" in der Karte
„Ruhestrom über Sicherung"; die Regression in `validate.js` prüft jetzt den
festen Sollwert 0,77 mV @ 10 A = 100 mA **und** die Datenblatttreue von
`FUSE_R`. Version 7.5-Profi ↔ Cache v7-5.

---

# CHANGELOG v7.4 (Auftrag „v7.2 → v7.3", ausgeführt auf Basis v7.3)

## Versionshinweis (Abweichung vom Auftragstext)

Der Auftrag nannte als Ausgangsstand v7.2 und Ziel v7.3. Das Repository stand
zu Auftragsbeginn jedoch bereits auf **v7.3** (Vollkontrolle vom selben Tag).
Diese Lieferung ist deshalb **v7.4** (`APP_VERSION 7.4-Profi` ↔
`CACHE_NAME kfz-multimeter-profi-v7-4`). Inhaltlich wurden alle Punkte des
Auftrags umgesetzt.

## Block A — Code

- **A1 Querverweis-Chips:** `linkifyRefs()` wandelt „→ Prüfung: …" /
  „→ Entscheidungsbaum: …" beim Rendern in antippbare `<button class="xref">`
  um. Lookup gegen `TESTS[].nm` und `TREES[].title` mit Normalisierung
  (Klammerzusätze, Verb-Endungen, Slash-Schreibweisen); Sammelverweise
  („Starter / Masse") werden in Einzel-Chips zerlegt. Unauflösbares bleibt
  unveränderter Text. Ergebnis: 33 Chips aus 29 Textverweisen, 0 tote Ziele.
  Datentexte wurden nicht umgeschrieben.
- **A2 Schritt-zurück in Bäumen:** Pfad-Stack (`treePath`) + Button
  „← Ein Schritt zurück" (sichtbar ab Tiefe 2). Bestehende Buttons unverändert.
- **A3 Fokus-Trap:** Tab/Shift+Tab zirkulieren im offenen Overlay;
  History-Mechanik unangetastet (Konvention 7).
- **A4 Suche:** 130-ms-Debounce, Lösch-X, Kategorie-Badge auf Treffer-Kacheln
  bei aktiver Suche. Zusätzlich Mehrwortsuche (alle Begriffe, Reihenfolge
  egal) und Synonymfeld `syn` im Suchindex.
- **A5 iOS-Splashscreens:** 13 Portrait-Startbilder (iPhone SE bis 15 Pro Max,
  iPad 10.2 bis Pro 12.9) aus dem App-Icon auf `#0d1117` generiert, per
  `apple-touch-startup-image`-Media-Queries eingebunden, im SW-Precache.
- **A6 Aufräumen:** Totes CSS entfernt (`.tree-back`, `.rank*`, `.micro`,
  `.hidden`, `.setbadge .dot`, `.dot.red/.black`); Glossar-Dublette
  Backprobe/Backprobing zu „Backprobing" zusammengeführt (der in den
  Prüftexten verwendete Begriff); Versionen synchron auf 7.4.
  Hinweis: der doppelte Ternary in `deepTableHTML()` war bereits in v7
  bereinigt.
- **Rechner:** Plausibilitätsprüfung gegen den Sicherungs-Nennstrom ergänzt
  („unplausibel – Sicherung hätte ausgelöst"); Anzeige jetzt durchgehend mit
  Dezimalkomma.

## Block B — Inhalt (alles mit `/* PRÜFEN */` markiert, Liste in REVIEW.md)

- Meta-Felder (`quality/risk/requires/limits/dont`) für 29 Karten ergänzt.
- `dont` für 24 weitere Karten ergänzt.
- Neue Karte **„Öldruckschalter / Öldrucksensor"** (`oeldruck`) inkl.
  DEEP-Eintrag — ohne erfundene Zahlenwerte (Schaltdruck → Aufdruck/
  Herstellerangabe; Druckmessung → Manometer).
- Such-Synonyme inkl. generischer OBD-II-Codes (SAE J2012) für Lambda-,
  Hall-/CMP- und Kurbelwellen-/CKP-Karten.

## Entscheidungen bei Widersprüchen im Auftrag

- **FUSE_R / Regression „0,77 mV @ 10 A ≈ 100 mA":** Der Auftrag verbietet
  Änderungen an `FUSE_R` („verifiziert"), erwartet aber eine Regression, die
  10 A ↔ 7,7 mΩ entspräche. Unsere verifizierte Tabelle führt 10 A mit 11 mΩ
  (Kalt-Innenwiderstand, ATO-Herstellerdaten) → 0,77 mV ≈ **70 mA**.
  Entscheidung: `FUSE_R` unverändert gelassen; die Regression prüft die
  Konsistenz Anzeige ↔ hinterlegte Tabelle statt einer festen Zahl.
  **Bitte fachlich klären**, ob die 7,7-mΩ-Quelle (MINI-Bauform?) übernommen
  werden soll — dann nur `FUSE_R` austauschen, Rechner bleibt korrekt.
- **`DEEP["ptc-kty"]` / Karten `oeldruck`, `ibs`:** Der Auftrag referenziert
  einen Datenstand mit diesen IDs. Hier heißt die PTC-Karte `ptc-sensor`
  (Kennlinie unverändert gelassen), `oeldruck` wurde neu angelegt, `ibs`
  existiert nicht (nicht gefordert, nicht erfunden).
- **`offline.html`:** im Auftrag als vorhanden genannt, existiert hier nicht;
  Offline-Fallback läuft über die gecachte `index.html`. Bewusst offen.

## Bewusst offen geblieben

- `DEEP.anl` (ausführliche Anleitung) für die restlichen Karten ohne eigenen
  Anleitungsblock: reiner Fachinhalt in größerem Umfang → gehört in eine
  eigene, fachlich begleitete Iteration.
- Landscape-Splashscreens für iPads.
- Zusammenführung der doppelten `openDetail`-Definition (Basis + v6-Block):
  bewusst nicht angefasst, um die dokumentierte Architektur nicht umzubauen.

## Validierung

`node validate.js` (jsdom): **24/24 Prüfungen bestanden** — Laden ohne
Laufzeitfehler, Datenintegrität (66 Prüfungen/66 DEEP-Keys), alle
Detailansichten ohne `undefined`/`[object`, Konventionen gegen die Renderer
geprüft, 13 Bäume ohne tote/unerreichbare Knoten, Schritt-zurück über
3 Ebenen, 33 Chips mit existierenden Zielen, Rechner-Regressionen inkl.
Komma/Punkt und Nennstrom-Abfang, genau 1 History-Eintrag bei 3×openDetail,
Merklisten-Aktualisierung, alle 5 Suchbegriffe, Versions-Sync, Fokus-Trap.
