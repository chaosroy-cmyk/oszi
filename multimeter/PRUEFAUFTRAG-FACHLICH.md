# Prüfauftrag: Fachliche und inhaltliche Richtigkeit — KFZ Multimeter Profi v8.5

> **An den Prüfer:** Dieser Text ist der vollständige Auftrag. Arbeite ihn in
> Phasen ab und halte dich an die Schleifenmechanik in Abschnitt E. Beginne
> nicht mit Phase 1, bevor Phase 0 abgeschlossen ist.

---

## A · Rolle und Maßstab

Du prüfst als **Kfz-Meister mit Werkstatterfahrung und Ausbildererfahrung an
einer Berufsschule**. Beide Rollen zugleich, und beide zählen:

- **Als Meister** fragst du: Kann ich damit am Fahrzeug arbeiten? Führt mich die
  Karte zu einem belastbaren Befund oder zu einem teuren Fehlkauf?
- **Als Ausbilder** fragst du: Lernt ein Geselle daraus das Richtige? Oder
  verinnerlicht er eine Regel, die ihn später auf die falsche Fährte führt?

**Zielbild:** Das Werkzeug soll *das* Multimeter-Handbuch für Kfz-Betriebe
werden — vom Lehrling im ersten Lehrjahr bis zum Diagnosetechniker. Ein Wert,
der in der Halle zu einem falschen Teiletausch führt, ist ein schwerer Fehler.
Eine Anleitung, die ein Lehrling nicht ausführen kann, ist ebenfalls ein Fehler.

**Kompromisslos, aber begründet.** Jede Beanstandung braucht eine Begründung,
die ein Sachverständiger nachvollziehen kann. „Fühlt sich falsch an" ist keine
Beanstandung. „Kommt mir hoch vor" auch nicht.

## B · Was geprüft wird — und was nicht

**Gegenstand dieser Prüfung:**

| | |
|---|---|
| Fachliche Richtigkeit | Stimmen Messverfahren, Messstelle, Gerätemodus, Buchse, Polarität, Einheit? |
| Zahlen und Grenzen | Ist jeder Zahlenwert belegt oder als Orientierung gekennzeichnet? Ist die Einheit richtig? Stimmt die Größenordnung? |
| Vollständigkeit | Fehlt ein Schritt, ohne den die Messung nicht funktioniert oder gefährlich wird? |
| Reihenfolge | Steht die Gefahrenwarnung vor der Arbeitsanweisung? Kommt die Voraussetzung vor der Messung? |
| Diagnoselogik | Führen die Fehlersuchketten und Diagnosebäume zu einem richtigen Befund? Gibt es Sackgassen oder falsche Verzweigungen? |
| Werkstatttauglichkeit | Ist die Karte in der Halle, mit schmutzigen Händen, am Fahrzeug benutzbar? |
| Lerntauglichkeit | Versteht ein Lehrling den Einsteigertext? Ist er richtig *und* verständlich? |
| Sprache | Eindeutige Werkstattsprache, keine schiefen Fachbegriffe, keine Verwechslungsgefahr |

**Nicht Gegenstand dieser Prüfung** (bereits durch `validate.js` mit
153 automatischen Prüfungen abgedeckt, bitte nicht doppeln):

JavaScript-Fehler · Renderfehler · Service Worker · Cache · Update-Mechanik ·
Barrierefreiheit · Touchziele · Layout · Rechtstexte · Lizenz · Impressum.

Wenn dir dabei trotzdem etwas auffällt: in einem eigenen Abschnitt
„Nebenbefunde" notieren, nicht in den Fachbefunden mischen.

## C · Redaktionelle Linie — bitte nicht „reparieren"

Diese Entscheidungen sind bewusst so getroffen. Wer sie für Fehler hält, hat den
Auftrag missverstanden. **Beanstande sie nur, wenn du die Linie selbst für
fachlich falsch hältst — und dann ausdrücklich als Grundsatzeinwand, nicht als
Einzelbefund.**

1. **Keine universellen Festgrenzen als Entscheidungskriterium.** Wo es keine
   seriöse Universalgrenze gibt, verweist die App auf die Herstellervorgabe.
   Eine Karte, die *keinen* festen Grenzwert nennt, ist deshalb nicht
   unvollständig — sie ist absichtlich so.
2. **Eine einzelne Messung ist nie ein Urteil.** Kein Bauteiltausch ohne
   vorgelagerte Gegenprobe.
3. **Ampelfarben zeigen Prüfpriorität, nicht Freigabe.** Grün heißt „plausibel",
   nicht „Bauteil in Ordnung".
4. **Gefahrenwarnungen stehen vor der ersten Arbeitsanweisung.**
5. **Systemvariante zuerst.** Erst Bauart/Schaltplan klären, dann messen.

## D · Beweisregeln für Zahlenwerte

`SOURCES.md` unterscheidet drei Stufen. Prüfe jeden Zahlenwert dagegen:

| Stufe | Bedeutung | Zulässig, wenn |
|---|---|---|
| **1 · Norm/Kennlinie** | Gilt nur für die genannte Norm, Baureihe oder Teilenummer | Norm/Teilenummer steht dabei |
| **2 · Herstellerbeispiel** | Zeigt, dass solche Bereiche existieren | Ausdrücklich als Beispiel gekennzeichnet |
| **3 · OEM erforderlich** | Kein fester Wert | Auf Herstellervorgabe verwiesen |

**Für deine eigenen Gegenvorschläge gilt derselbe Maßstab:**

- Nenne **keine Zahl ohne Quelle**. Nicht interpolieren, nicht schätzen, nicht
  aus Plausibilität ableiten.
- Kannst du einen Wert nicht belegen, ist die richtige Beanstandung: *„Wert X
  ist nicht belegt und sollte als Orientierung gekennzeichnet oder durch einen
  Verweis auf die Herstellervorgabe ersetzt werden."* — **nicht** ein anderer,
  ebenfalls unbelegter Wert.
- Quellenformat wie in `SOURCES.md`: Quelle, Revision oder Abrufdatum,
  Anwendungsbereich, Grenze der Übertragbarkeit.

## E · Schleifenmechanik — so wird gearbeitet

Der Umfang ist zu groß für einen Durchgang. Deshalb **Phasen, und innerhalb
jeder Phase Chargen zu maximal 5 Karten.**

### Ablauf je Charge

```
1  Charge auswählen (nächste offene Karten aus dem Laufprotokoll)
2  Für jede Karte: alle Felder lesen — was, set, probes, mess, good, bad,
   next, beg, requires, limits, dont, warn, sourceRef
   sowie den Tiefenteil — anl, rt, rt2, urs, fs
3  Karte nach dem Prüfraster (Abschnitt F) bewerten
4  Befunde im Befundformat (Abschnitt G) notieren
5  Laufprotokoll fortschreiben: Karte -> Urteil -> Anzahl Befunde
6  Zwischenstand ausgeben, dann nächste Charge
```

### Laufprotokoll

Führe eine Tabelle mit, die nach jeder Charge ausgegeben wird. Sie ist der
Wiedereinstiegspunkt, falls die Arbeit unterbrochen wird:

| Phase | Karte | Urteil | Befunde | Schwerster |
|---|---|---|---|---|
| 3 | `ruhestrom` | mit Auflagen | 2 | mittel |

**Urteile:** `frei` · `mit Auflagen` · `nachbessern` · `gesperrt`

- **frei** — fachlich richtig, vollständig, in der Halle benutzbar
- **mit Auflagen** — richtig, aber Formulierung, Reihenfolge oder Ergänzung nötig
- **nachbessern** — fachlicher Fehler ohne Gefährdung, oder relevante Lücke
- **gesperrt** — Gefahr für Personen, Fahrzeug oder Messgerät, oder ein Wert,
  der zu einem Fehlkauf führt. Diese Karte darf so nicht in die Werkstatt.

### Wiedereinstieg

Beim Fortsetzen: letzte Zeile des Laufprotokolls lesen, dort weitermachen,
**nichts doppelt prüfen und nichts überspringen.** Bereits geschlossene Phasen
werden nicht neu aufgerollt.

### Abbruchbedingungen

- Findest du **eine `gesperrt`-Karte**: Charge zu Ende führen, dann sofort
  melden, bevor die nächste Charge beginnt. Nicht bis zum Schlussbericht warten.
- Findest du in einer Phase **dreimal denselben systematischen Fehler**: Phase
  anhalten, das Muster melden, und erst nach Rückmeldung weiterarbeiten. Es ist
  wertlos, denselben Befund 20-mal einzeln aufzuschreiben.

## F · Prüfraster je Karte

Zehn Fragen, jede mit ja/nein/nicht anwendbar zu beantworten. Ein „nein" ist ein
Befund.

1. **Messgröße und Modus** — Passen `set.mode` und `set.buchse` zur Messgröße?
   Wird die A-Buchse nur dort verlangt, wo sie hingehört?
2. **Messstelle** — Sind `probes` eindeutig? Ist die Bezugsmasse benannt
   (Sensormasse gegen Karosseriemasse!)? Ist die Polarität richtig?
3. **Fahrzeugzustand** — Steht dabei, ob Zündung aus/an, Motor läuft, Stecker
   getrennt, Bauteil spannungsfrei? Fehlt eine dieser Angaben, wo sie das
   Ergebnis ändert?
4. **Einheiten und Größenordnung** — mV/V, mΩ/Ω, mA/A, Hz/%: richtig und
   konsistent? Sind Kommastellen plausibel?
5. **Zahlenwerte** — Jeder Wert nach Abschnitt D geprüft. Falscher Wert,
   fehlende Kennzeichnung, oder unzulässig verallgemeinert?
6. **Gefahren** — Fehlt eine Warnung, die an diesem Bauteil zwingend ist?
   (Hochstrom, Kraftstoffdruck, Airbag, HV, Batteriegase, Zündanlage,
   bewegliche Teile, Verbrennungsgefahr.) Steht sie an der richtigen Stelle?
7. **Vollständigkeit der Anleitung** — Kann ein Geselle die Messung allein nach
   `anl` durchführen? Fehlt ein Schritt, ohne den es nicht geht?
8. **Fehlerursachen** — Sind die häufigen Ursachen wirklich die häufigen?
   Fehlt eine, die in der Praxis regelmäßig vorkommt? Ist die Gewichtung
   (häufig/mittel/selten) realistisch?
9. **Fehlersuchkette** — Führt jeder Zweig zu einem verwertbaren Ergebnis?
   Gibt es eine Sackgasse, eine Verzweigung mit falschem Schluss, oder einen
   Bauteiltausch ohne vorherige Absicherung?
10. **Einsteigertext** — Ist `beg` fachlich richtig *und* für einen Lehrling
    verständlich? Vereinfacht er so stark, dass etwas Falsches entsteht?

### Zusätzlich der Werkstatt-Test

Beantworte je Karte in einem Satz: **„Was tut ein Geselle nach dieser Karte als
Nächstes — und ist das richtig?"** Wenn du diese Frage nicht beantworten kannst,
ist die Karte unvollständig, egal wie viele Zahlen darin stehen.

## G · Befundformat

Jeder Befund einzeln, in dieser Form. Keine Sammelbefunde.

```
BEFUND <lfd. Nr.>
Karte:        <id> — <Name>
Feld:         <mess | good | bad | next | beg | anl Schritt 3 | rt Zeile 2 | urs | fs Schritt 4 | warn | requires | limits | dont>
Schwere:      kritisch | hoch | mittel | niedrig
Ist:          <wörtliches Zitat aus der App>
Warum falsch: <fachliche Begründung, nachvollziehbar>
Folge:        <was passiert in der Werkstatt, wenn es so bleibt>
Vorschlag:    <konkreter Ersatztext ODER die Feststellung, dass ein Wert
               unbelegt ist und zu kennzeichnen wäre>
Beleg:        <Quelle mit Revision/Abrufdatum — oder ausdrücklich "kein Beleg
               gefunden, deshalb nur Kennzeichnung vorgeschlagen">
```

**Schweregrade:**

| Schwere | Bedeutung |
|---|---|
| **kritisch** | Personen-, Fahrzeug- oder Geräteschaden möglich |
| **hoch** | Führt zu falschem Befund und damit zu Fehlkauf oder Fehlreparatur |
| **mittel** | Fachlich unsauber, verwirrt oder lehrt Falsches, ohne direkt zu schaden |
| **niedrig** | Formulierung, Begriff, Konsistenz |

## H · Die Phasen

**Reihenfolge einhalten.** Sie ist nach Risiko und Abhängigkeit sortiert: Die
Sicherheitskarten zuerst, weil sie alles andere überlagern; die Querschnitts-
prüfung zuletzt, weil sie die Einzelbefunde voraussetzt.

### Phase 0 · Rüstzeit (keine Befunde)

- `SOURCES.md` vollständig lesen — die drei Evidenzstufen und die Liste
  „Bewusst OEM-/bauteilabhängig" sind die Messlatte für alles Weitere.
- `README.md`, Abschnitt „Konventionen", lesen.
- Zwei Stichproben aus `SOURCES.md` gegen die Primärquelle nachprüfen.
  Weichen sie ab, ist das bereits ein Befund und die ganze Matrix ist
  verdächtig — dann melden, bevor Phase 1 beginnt.
- Ergebnis von Phase 0: eine Aussage, ob die Quellenbasis trägt.

### Phase 1 · Sicherheit (3 Karten) — höchste Priorität
`sicherheitscheck` · `srs-airbag` · `hv-hybrid`

Diese drei entscheiden, ob jemand zu Schaden kommt. Prüfe besonders: Sind die
Abgrenzungen zur nötigen Qualifikation eindeutig? Wird irgendwo eine Arbeit
beschrieben, die ohne Freigabe nicht stattfinden darf?

### Phase 2 · Grundmessungen und Leitung/Masse (10 Karten)
`spannung` · `widerstand` · `durchgang` · `diodentest` · `spannungsabfall` ·
`klemmen` — `masse` · `leitung` · `backprobe` · `kurzschluss-plus-masse`

Das methodische Fundament. Ein Fehler hier vererbt sich auf alle anderen Karten.
`leitung` ist die umfangreichste Karte der App (12 Anleitungsschritte,
10 Fehlersuchschritte) — sie verdient eine eigene Charge.

### Phase 3 · Strom und Versorgung (10 Karten)
`strom` · `sicherung` · `ruhestrom` · `ruhestrom-fuse` · `prueflampe-last` ·
`stromzange-dc` — `relais` · `relais-typen` · `relais-leistung` ·
`relais-elektronisch`

Hier liegt das größte Gefährdungspotenzial für das Messgerät (A-Buchse) und der
mV-Drop-Rechner. **Rechne mindestens drei Werte des Rechners nach**
(Sicherungsbauform, mV-Eingabe, erwartete mA) und prüfe, ob die
Kaltwiderstände zur genannten Datenblattreihe passen.

### Phase 4 · Batterie, Laden, Starten (4 Karten)
`batterie` · `generator` · `starter` · `starter-drop-profi`

Achte auf intelligente Generatorregelung und Start-Stopp: Werden veraltete
Faustregeln als allgemeingültig dargestellt?

### Phase 5 · Sensoren I — Temperatur, Druck, Position (13 Karten)
`ref5v` · `ntc-kts` · `ntc-ats` · `ptc-sensor` · `poti-dk` · `map` ·
`raildruck` · `klimadruck` · `oeldruck` · `dpf-diff` · `agr-pos` ·
`tankgeber` · `sensor-masseversatz`

Kennlinien sind hier der Kern. Prüfe, ob Kennlinienrichtung, Bezugsmasse und
Temperaturabhängigkeit stimmen und ob unzulässig von einer Baureihe auf alle
verallgemeinert wird.

### Phase 6 · Sensoren II — Drehzahl, Gemisch, Abgas, Fahrwerk (17 Karten)
`lmm-a` · `lmm-d` · `lambda-sprung` · `lambda-breit` · `radsensor` · `kw-ind` ·
`hall` · `klopf` · `agt` · `nox` · `lenkwinkel` · `ibs` · `schalter`
sowie der 5-V-Kartensatz: `ref5v-basis` · `ref5v-masseschluss` ·
`ref5v-plusschluss` · `ref5v-vergleich`

Besonderes Augenmerk: Wo endet die Aussagekraft des Multimeters, und sagt die
Karte das deutlich? Bei `radsensor` und `hall`: Wird der Fehlschluss
„Pinzahl = Sensortyp" sauber vermieden?

### Phase 7 · Aktuatoren (14 Karten)
`pwm` · `magnetventil` · `taktventil` · `injektor-benzin` · `injektor-diesel` ·
`zuendspule` · `gluehkerze` · `ptc-heizung` · `luefter` · `kraftstoffpumpe` ·
`stellmotor` · `ventil-tank` · `motor-allg` · `hupe`

Spulenwiderstände, Ansteuerungsart (High-Side/Low-Side/PWM) und die Frage, ob
eine Widerstandsmessung überhaupt etwas beweist.

### Phase 8 · Bus, Signal, Profi (6 Karten)
`can` · `lin` · `pullup-pulldown` · `generator-lin-bsd` ·
`ecu-nicht-erreichbar` · `messprotokoll`

Prüfe insbesondere, ob die Grenzen der Multimetermessung am Bus deutlich genug
benannt sind und ob Topologie-Annahmen als solche gekennzeichnet sind.

### Phase 9 · Querschnitt (15 Bäume, 53 Glossareinträge, Suche, Rechner)

- **Diagnosebäume:** Führt jeder Pfad zu einem richtigen Befund? Gibt es einen
  Zweig, der zu einem Bauteiltausch führt, ohne vorher etwas auszuschließen?
  Steht am Anfang die richtige Frage — Systemvariante statt Messwert?
- **Glossar:** Sind die 53 Begriffe fachlich sauber definiert und
  widerspruchsfrei zu den Karten?
- **Suche:** Findet ein Geselle die richtige Karte mit den Wörtern, die er
  tatsächlich benutzt? Prüfe mit mindestens 20 Begriffen aus der Werkstatt-
  sprache und mit generischen Fehlercodes.
- **Rechner:** Formel, Einheiten, Plausibilitätsprüfung, und ob die Ausgabe
  richtig eingeordnet statt bewertet wird.

### Phase 10 · Gesamtbild

Erst jetzt, mit allen Einzelbefunden im Rücken:

1. **Widersprüche zwischen Karten.** Wird dieselbe Größe an zwei Stellen
   unterschiedlich beschrieben oder bewertet?
2. **Lücken im Kartensatz.** Welche Messung braucht ein Kfz-Betrieb im Alltag,
   die hier fehlt? Nenne höchstens fünf, nach Nutzen sortiert, jeweils mit
   Begründung, warum sie fehlt und was sie leisten würde.
3. **Einstiegsfrage.** Findet ein Geselle mit einem Symptom — nicht mit einem
   Bauteilnamen — den Weg in die App?
4. **Ist das Werkzeug für Kfz-Betriebe geeignet?** Klare Aussage:
   `einsatzbereit` · `einsatzbereit nach Nachbesserung` · `nicht einsatzbereit`.

## I · Schlussbericht

Nach Phase 10:

1. **Gesamturteil** in einem Satz, plus die Einstufung aus Phase 10 Punkt 4.
2. **Befundtabelle**, sortiert nach Schwere: Nr. · Karte · Feld · Schwere ·
   Kurzfassung · Vorschlag in Kurzform.
3. **Alle `gesperrt`- und `kritisch`-Befunde** noch einmal ausführlich.
4. **Systematische Muster** — Fehler, die mehrfach auftreten und eine
   Regeländerung statt Einzelkorrekturen verlangen.
5. **Bewertung je Phase**, 0–10, mit einem Satz Begründung.
6. **Was du nicht prüfen konntest** — Pflichtabschnitt, darf nicht leer sein.
   Nenne, wofür dir Quellen, Fahrzeugzugang oder Fachwissen gefehlt haben, und
   welche Aussagen damit ungeprüft bleiben.
7. **Empfehlung zur Reihenfolge der Nachbesserung.**

## J · Ausdrücklich unerwünscht

- Zahlenwerte ohne Beleg vorschlagen — auch nicht „ungefähr", auch nicht als
  Ersatz für einen beanstandeten Wert.
- Universelle Grenzwerte einführen, wo die App bewusst auf die
  Herstellervorgabe verweist.
- Lob ohne Prüfung. Eine Karte, die du für richtig hältst, bekommt `frei` und
  eine Zeile Begründung — keinen Absatz.
- Codebefunde unter die Fachbefunde mischen.
- Mehrere Karten in einem Sammelbefund zusammenfassen.
- Phasen überspringen oder die Reihenfolge ändern.
- Den Schlussbericht schreiben, bevor alle Phasen abgeschlossen sind.

---

## Anhang · Zu prüfender Stand

| | |
|---|---|
| Version | `8.5-Profi` |
| Inhaltsstand | 09.08.2026 |
| Umfang | 77 Prüfkarten, 15 Diagnosebäume, 53 Glossareinträge |
| Dateien | `index.html` (App, Daten inline), `SOURCES.md` (Quellenmatrix), `README.md` (Konventionen) |
| Automatische Prüfung | `npm ci && npm run validate` — 153 Prüfungen, muss vollständig grün sein |

Die Daten stehen als `TESTS` (Karten), `DEEP` (Anleitung/Richtwerte/Ursachen/
Fehlersuche je Karte), `TREES` (Diagnosebäume) und `GLOSS` (Glossar) im
Skriptblock von `index.html`. Sie lassen sich ohne Browser auslesen; wer lieber
in der Oberfläche prüft, öffnet `index.html` über einen lokalen Webserver.
