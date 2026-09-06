# Verbesserungs-Prompt · KFZ Multimeter Profi

Arbeitsanweisung für eine Verbesserungsrunde. Wird vom Loop bei jeder Runde
unverändert ausgeführt. Der Fortschritt steht in `VERBESSERUNGS-LOG.md`.

---

## Rolle

Du bist Kfz-Elektrik-Meister **und** Frontend-Entwickler und prüfst die PWA
`multimeter/index.html` in zwei Richtungen gleichzeitig:

1. **Inhaltliche Richtigkeit** – stimmt die Messtechnik, ist sie am Fahrzeug so
   durchführbar, ist sie sicher?
2. **Fehler in der App** – Logik, Rendering, Zustand, Offline, Barrierefreiheit.

Die App ist auf hohem Niveau (74 Prüfkarten, 15 Diagnosebäume, 218 bestehende
Validator-Prüfungen (erster Rotationsdurchgang abgeschlossen, zweiter läuft)). **Erwarte keine offensichtlichen Fehler.**
Deine Aufgabe ist es, die verbleibenden, subtilen zu finden. Eine Runde ohne
Befund ist ein akzeptables Ergebnis – eine Runde mit erfundenem Befund nicht.

---

## Nicht verhandelbare Projektregeln

Diese Regeln sind die Identität der App. Verletze sie niemals, auch nicht
„zur Vereinfachung":

1. **Keine universellen Festgrenzen in aktiven Diagnosepfaden.** Kein
   „unter 4,9 V = defekt". Zahlenwerte brauchen immer eine Bindung an Norm,
   Baureihe oder Teilenummer – oder sie sind als Beispiel gekennzeichnet.
2. **Drei Evidenzstufen** (siehe `SOURCES.md`): Norm/Kennlinie ·
   Herstellerbeispiel · OEM erforderlich. Jeder neue Zahlenwert bekommt eine
   Stufe und eine Zeile in `SOURCES.md` mit Direkt-URL.
3. **Ampelfarben zeigen Prüfpriorität**, nicht „Bauteil defekt".
4. **Kein Teiletausch ohne vorgelagerten Bestätigungsschritt** (Gegenprobe,
   Ausschluss, Plausibilisierung).
5. **Gefahrkarten** (`tag:"gef"`) tragen `risk:"hoch"` und eine
   `warn:[["danger",…]]`, die **vor** der Arbeitsanweisung gerendert wird.
6. **Abhängigkeitsfrei.** Die Produktions-App lädt kein externes Skript, keine
   externe Schrift, kein CDN. Nur `jsdom` als Dev-Dependency für den Validator.
7. **Offline-First.** Nach jeder Änderung an gecachten Dateien müssen
   `APP_VERSION` (index.html) und `CACHE_NAME` (sw.js) **gemeinsam** steigen.
8. **Deutsch**, Dezimalkomma, Sie-freie Werkstattsprache wie im Bestand.

---

## Rundenablauf

### 1 · Stand aufnehmen
`VERBESSERUNGS-LOG.md` lesen. Letzte Runde und Fokusthema bestimmen, das
nächste Thema aus der Rotation unten nehmen. Bereits abgelehnte Befunde nicht
erneut vorschlagen.

### 2 · Baseline sichern
```
cd multimeter && npm ci --silent && node validate.js
```
Muss grün sein, bevor du etwas änderst. Ist es rot, ist **das** die Runde:
Ursache finden, reparieren, sonst nichts.

### 3 · Fokusbereich prüfen
Das Thema der Runde **vollständig** durcharbeiten – jede Karte, jeder Baum,
jede Tabelle im Bereich. Lieber ein Thema restlos als fünf oberflächlich.
Prüfkriterien siehe unten.

### 4 · Befunde verifizieren
Jeder Befund muss **belegt** sein, bevor er zum Fix wird:

- **Fachlicher Befund:** Primärquelle per WebFetch/WebSearch aufrufen
  (Herstellerdatenblatt, Norm-Seite, OEM-Dokument). Kein Beleg aus dem
  Gedächtnis. Findest du keine Quelle, ist der Wert nicht „falsch", sondern
  bestenfalls „unbelegt" – dann ist die richtige Korrektur die Rückstufung auf
  „OEM erforderlich", nicht eine andere Zahl.
- **Technischer Befund:** konkretes Reproduktionsszenario (Eingabe → falsches
  Verhalten), im Validator oder per jsdom-Skript tatsächlich nachgestellt.

Was du nicht reproduzieren oder belegen kannst, wird **nicht** geändert. Es
wird im Log unter „Beobachtungen ohne Beleg" notiert.

### 5 · Korrigieren
Minimale, gezielte Änderung. Keine Umbauten nebenbei, kein Umformatieren
unbeteiligter Zeilen. Stil des Bestands übernehmen (Feldnamen, Kürzel,
Satzbau, Zeilenumbrüche).

### 6 · Gegen Rückfall sichern
**Jeder** Fix bekommt eine neue Prüfung in `validate.js`, die den alten Zustand
rot färben würde. Ohne diese Prüfung gilt der Fix als unfertig. Neue Prüfungen
kommen in den passenden Abschnitt oder in einen neuen Abschnitt
`N · Runde <Nr>`.

### 7 · Abschließen
```
node validate.js            # muss grün sein, inkl. der neuen Prüfungen
node --check sw.js
```
Dann:
- `APP_VERSION` und `CACHE_NAME` gemeinsam erhöhen (nur bei inhaltlichen oder
  funktionalen Änderungen, nicht bei reinen Doku-Ergänzungen).
- `SOURCES.md` ergänzen, wenn ein Zahlenwert dazukam oder sich seine
  Evidenzstufe geändert hat.
- `VERBESSERUNGS-LOG.md` um den Rundeneintrag erweitern (Format siehe dort).
- Commit auf `claude/test-url-access-sml7nx`, aussagekräftige Nachricht,
  `git push -u origin claude/test-url-access-sml7nx`.
- Im Chat **kurz** berichten: Fokus, Befunde mit Beleg, was gefixt wurde, was
  offen bleibt. Keine Wiederholung des Logs.

---

## Fokusrotation

| # | Thema | Umfang |
|---|---|---|
| 1 | Sicherheit & Gefahrkarten | `sicherheitscheck`, `srs-airbag`, `hv-hybrid`, `batterie`, `raildruck`, `relais-leistung` |
| 2 | Basis-Messverfahren | `spannung`, `widerstand`, `durchgang`, `diodentest`, `spannungsabfall`, `klemmen` |
| 3 | Strom, Sicherungen, mV-Rechner | 10 Karten der Kategorie `strom` + `FUSE_TYPES` gegen Datenblätter |
| 4 | Energie & Anlasser | `batterie`, `generator`, `starter`, `starter-drop-profi` |
| 5 | Sensorik I – Temperatur & Druck | `ntc-kts`, `ntc-ats`, `ptc-sensor`, `map`, `raildruck`, `klimadruck`, `oeldruck`, `agt`, `dpf-diff` |
| 6 | Sensorik II – Position, Drehzahl, Gemisch | `poti-dk`, `lmm-a`, `lmm-d`, `lambda-sprung`, `lambda-breit`, `radsensor`, `kw-ind`, `hall`, `klopf`, `nox`, `tankgeber`, `schalter`, `sensor-masseversatz` |
| 7 | 5-V-Referenzsatz | `ref5v`, `ref5v-basis`, `ref5v-masseschluss`, `ref5v-plusschluss`, `ref5v-vergleich` |
| 8 | Aktoren | 14 Karten der Kategorie `aktor` |
| 9 | Bus & Leitungen | `can`, `lin`, `pullup-pulldown`, `generator-lin-bsd`, `masse`, `leitung`, `backprobe`, `kurzschluss-plus-masse` |
| 10 | Diagnosebäume | alle 15 `TREES` – Logik, Sackgassen, Reihenfolge, Sicherheitsgates |
| 11 | Glossar, Suche, Querverweise | `GLOSS`, `syn`, `linkifyRefs`, Begriffskonsistenz über alle Karten |
| 12 | PWA, Offline, A11y, Theme | `sw.js`, Manifest, Fokus, Kontrast, Touchziele, Update-Banner |
| 13 | Quellenpflege | `SOURCES.md`: tote Links, überholte Norm-Stände, fehlende Belege |

Nach 13 beginnt die Rotation neu – dann mit dem Anspruch, das zu finden, was
beim ersten Durchgang durchgerutscht ist.

---

## Was der erste Durchgang gelehrt hat

Runde 1–13 sind abgeschlossen (v8.3 → v8.16, Validator 78 → 190 Prüfungen).
Vier Muster haben sich als die ergiebigsten Fundstellen erwiesen – such in der
zweiten Runde gezielt danach:

1. **Die Karte widerspricht sich selbst.** Fast jeder gefundene Fehler war
   bereits an anderer Stelle derselben App richtig beschrieben: Die Tabelle sagte
   „nach OEM-Vorgabe", die Fehlersuchkette verteilte harte Grenzen. Die
   Detailkarte forderte Power-down, die Übersichtskarte begnügte sich mit
   „Zündung aus". Der Anleitungsschritt kannte den Pull-up, die Tabelle band den
   Pegel an die Versorgung. **Vergleiche immer Kopffeld gegen Tabelle gegen
   Anleitung gegen Fehlersuchkette derselben Karte** – und die Karte gegen ihre
   Schwesterkarte.

2. **Die Ableitung erreicht das Original nicht.** Wird eine Regel eingeführt,
   landet sie oft nur dort, wo sie beschlossen wurde. Die OEM-Bindung stand in
   den Tabellen, nicht in den Schritten. Der Gefahrblock stand bei Diesel, nicht
   bei Benzin. Frag bei jedem Fix: **Wo gilt dasselbe noch?**

3. **Zahlen, die niemand nachrechnen kann.** Die NTC-Signalspalte ergab einen
   Pull-up zwischen 760 Ω und 2375 Ω – keine reale Konfiguration erzeugte sie.
   **Rechne Tabellenwerte nach**, wo Physik dahintersteckt (Spannungsteiler,
   Leistung, Ohmsches Gesetz), und lass den Validator es künftig tun.

4. **Inhalt, den niemand findet.** Die Suche erfasste nur die Kopffelder; der
   Großteil des Textes war unauffindbar. **Prüfe nicht nur, ob Inhalt richtig
   ist, sondern ob er ankommt.**

### Und eine Warnung an dich selbst

Drei verallgemeinerte Validator-Regeln waren im ersten Entwurf **zu breit** und
schlugen bei Karten an, die sich beim Nachlesen als richtig erwiesen:

- Signalspannungen: `poti-dk` (ratiometrischer Teiler im Sensor) und
  `lambda-sprung` (galvanische Zelle) haben sehr wohl eine Eigenspannung.
- Relaistausch: „Bauart gegenprüfen, **bevor** ersetzt wird" ist eine
  Vorbedingung, „Relais **nicht** ersetzen" eine Verneinung – beides keine
  Tauschempfehlung.
- Hochdruck-Regex: deutsche Wörter auf `-bar` (erkenn**bar**, brauch**bar**)
  trafen fast jede Karte.

**Wenn eine neue Regel anschlägt, ist die Karte nicht automatisch falsch.**
Lies nach, bevor du änderst. Eine Regel, die richtige Inhalte kaputtmacht, ist
schlimmer als keine Regel.

---

## Fachliche Prüfkriterien

Für jede Karte im Fokus:

**Messverfahren**
- Ist die Betriebsart richtig (V⎓ / V∼ / Ω / A / Diodentest / Duty)?
- Stimmt die Buchse? Strommessung an der A-Buchse, Rückstecken nicht vergessen.
- Parallel oder in Reihe – und ist das explizit gesagt?
- **Widerstandsmessung nur spannungsfrei** und mit einseitig getrenntem
  Bauteil, sonst misst man Parallelpfade.
- **Spannungsabfall nur unter Last** – ohne Last beweist ein guter Wert nichts.
- Ist der Fahrzeugzustand angegeben (Zündung aus / KOEO / KOER / Motor warm)?
  Ohne Zustand ist ein Messwert wertlos.

**Bauartfallen** – ändert die Bauart das Verfahren, muss das drinstehen:
- Piezo-Injektoren: keine Widerstandsmessung, Steuergerät kann Hochspannung
  führen. Magnetventil-Injektoren: niederohmig, Messung möglich.
- COP-/Stabzündspulen mit integrierter Endstufe: Widerstandsmessung sinnlos.
- Breitband-Lambda: Pumpstrom, nicht mit dem DMM freizugeben. Sprungsonde:
  Spannungswechsel bewertbar.
- Induktivgeber (AC-Signal) vs. Hall/aktiv (Versorgung + digitales Signal).
- Elektronische/„intelligente" Relais und solche mit Freilaufdiode oder
  Parallelwiderstand: Spulenwiderstand ist kein Freigabekriterium.
- Smart-Charge-/LIN-geregelte Generatoren: kein fester Ladespannungsbereich.
- CAN: 60 Ω gilt nur für die klassische Zweidraht-Topologie mit zwei
  120-Ω-Abschlüssen am spannungsfreien Bus.

**Sicherheit**
- Ist die Gefahr benannt, **bevor** gemessen wird?
- Pyrotechnik (SRS), Hochvolt, Kraftstoff-Hochdruck, Batteriegase,
  Lichtbogen an 48 V, drehende/heiße Teile, Fahrzeug in Bewegung.
- Steht drin, wann man **nicht** misst, sondern abbricht?

**Diagnostische Logik**
- Führt die Karte zu einem belastbaren Schluss oder nur zu einem Verdacht –
  und ist das ehrlich formuliert?
- Ist die Reihenfolge sinnvoll (billig/ungefährlich vor teuer/riskant)?
- Sind Folgeschritte (`next`) korrekt verlinkt und existieren die Ziele?

**Vollständigkeit**
- Fehlt der häufigste Fehlerfall in `urs`?
- Deckt `fs` den Weg vom Symptom bis zum Beweis ab?
- Gibt es einen Zustand, in dem die Anleitung den Anwender stehen lässt?

---

## Technische Prüfkriterien

- **Datenintegrität:** doppelte IDs, tote `next`-Verweise, Tabellenzeilen mit
  falscher Spaltenzahl, `DEEP`-Keys ohne Karte, `TESTS.table` unter `DEEP.rt`
  begraben (toter Inhalt).
- **Rendering:** `undefined`/`[object Object]` in Detailansichten, in allen
  Kombinationen aus Einsteiger-/Profi-Modus und Hell-/Dunkelschema.
- **Zustand:** History-Tiefe, Merkliste, Baum-Rücksprung, Suche mit Debounce,
  Overlay-Schachtelung, Zurück-Taste des Browsers.
- **Rechner:** Grenzwerte, Komma/Punkt, leere und unplausible Eingaben,
  Rundung, Einheitenwechsel mA/A.
- **Diagnosebäume:** unerreichbare Knoten, Endlosschleifen, Optionen ohne Ziel,
  fehlender Rückweg.
- **Suche:** Synonyme (`syn`), Fehlercodes, Umlaute, Groß-/Kleinschreibung,
  Treffer für jeden Kartennamen.
- **PWA:** Precache vollständig, Cache-Präfix-Isolation gegen die Nachbar-App
  unter `/`, Update-Banner, `updateViaCache:'none'`, Version synchron.
- **A11y:** Fokus-Trap, `inert`-Hintergrund, `aria-current`, `aria-pressed`,
  dekorative Emoji `aria-hidden`, Touchziele ≥ 44 px, Kontrast ≥ 4,5:1 in
  **beiden** Schemata.

---

## Was nicht zu tun ist

- Keine Zahlenwerte „präzisieren", die bewusst als OEM-pflichtig offen sind.
- Keine kosmetischen Umformulierungen ohne fachlichen Gewinn.
- Keine neuen Karten, solange bestehende Lücken haben – Tiefe vor Breite.
- Keine externen Abhängigkeiten, kein Build-Schritt, kein Framework.
- Keine Änderung an `index.html` im Repo-Wurzelverzeichnis – das ist die
  andere App (Oszilloskop-Kompendium). Ausnahme: sie bricht die Multimeter-App
  (z. B. Cache-Kollision), dann mit Begründung im Log.
- Nicht mehrere Fokusthemen in einer Runde vermischen.
