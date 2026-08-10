# CHANGELOG v8.4-Profi — Release Candidate

Auftrag war „v8.2 → v8.3". **v8.3 war bereits vergeben** (Relais-Kartensatz,
Commit `a062901`, ausgeliefert). Der Release Candidate ist deshalb **v8.4**.
Der ausgelieferte v8.3-Stand bleibt unangetastet, der Updateweg 8.3 → 8.4 ist
testbar.

Zwei weitere Abweichungen von den Auftragsannahmen, damit die Zahlen im
Testbericht nachvollziehbar sind:

- Der Auftrag rechnet mit **70 Karten** (v8.2) und fordert als Abnahme
  „73 Karten". Ausgangsstand war **74** (v8.3 hat vier Relaiskarten ergänzt und
  `sicherung` entflochten). Ziel und Ist sind daher **77**, nicht 73.
- Die drei Karten sind **nicht in diesem Repository verlorengegangen**.
  `lenkwinkel`, `agr-pos` und `ibs` kommen in der gesamten Git-Historie über
  alle Branches kein einziges Mal vor. Der Verlust liegt in der extern
  erstellten v8.2-Linie. Am Ergebnis ändert das nichts — der Auftrag verlangte
  ohnehin Neuschrift statt Kopie —, aber die Merge-Geschichte gehört korrekt
  wiedergegeben.

---

## 1 · Drei Bauteilprüfungen ergänzt

Neu geschrieben im v8.2-Stil, nicht aus einer Altversion kopiert. Alle drei mit
`syn`, vollständigen Meta-Feldern (`quality`, `risk`, `requires`, `limits`,
`dont`), eigenem Eintrag in der `sourceRefs`-Zuordnung, Anleitung, Richtwerten,
Fehlerursachen und Fehlersuchkette.

| Karte | Kern | Anleitung |
|---|---|---|
| **`ibs`** — Batteriesensor (IBS), `sensor` · `osz` · Risiko mittel | Shunt an der Massepolklemme, meldet Ladezustand über LIN ans Energiemanagement. Prüfbar sind ausschließlich Versorgung, Masseanbindung und Busaktivität — Strommessung und SOC-Berechnung laufen intern. | 7 Schritte |
| **`agr-pos`** — AGR-Positionssensor, `sensor` · `mm` · Risiko niedrig | Potentiometer oder Hall-Element im Steller, 5-V-versorgt, teils zwei gegenläufige Signale. Bewertet wird der **Verlauf** über den Stellbereich, nicht ein Einzelwert. | 8 Schritte |
| **`lenkwinkel`** — Lenkwinkelsensor, `sensor` · `osz` · Risiko hoch | Winkel und Lenkgeschwindigkeit für ESP; modern nur über CAN. Der Winkel ist mit dem Multimeter grundsätzlich nicht auswertbar. | 8 Schritte |

### Die drei fachlichen Kernaussagen

- **IBS und Ruhestrommessung.** Der Sensor sitzt im Massepfad. Wird das
  Messgerät hinter dem Sensor eingeschleift, fließt dessen Eigenverbrauch mit
  durch das Messgerät. Die Anschlussstelle ist bewusst zu wählen — das ist
  Schritt 1 der Anleitung, nicht eine Fußnote. Gegenseitig verlinkt mit
  `ruhestrom` und `ruhestrom-fuse`; der Diagnosebaum `ruhestrom-hoch` verweist
  im Zweig „Strom ändert sich beim Sicherungziehen nicht" ebenfalls dorthin.
  Überbrückungsverbot als `caution`, Anlernpflicht nach Batteriewechsel als `info`.
- **AGR: Verkokung schlägt Elektrik.** Ein mechanisch klemmendes Ventil liefert
  ein elektrisch einwandfreies Signal und meldet völlig korrekt, dass keine
  Bewegung stattfindet. Vor jedem Tausch das Ventil mechanisch beurteilen
  (`caution` + eigener Schritt in der Fehlersuchkette). Die Signalrichtung ist
  herstellerabhängig invertierbar — das steht in `requires`, nicht in einer
  Anmerkung. Bei doppelten Signalen: gleichsinniger Verlauf heißt Sensorfehler,
  nicht Mechanikfehler.
- **Lenkwinkel: Airbag zuerst.** Die `danger`-Warnung zur Deaktivierung des
  Rückhaltesystems samt Wartezeit steht vor der ersten Arbeitsanweisung — der
  Renderer zieht `danger`-Blöcke automatisch nach oben, und der Validator prüft
  die Position im gerenderten DOM. Wickelfeder als `caution`, Grundeinstellung
  als `info`. Gegenseitig verlinkt mit `can` und `srs-airbag`; der Baum
  `can-fehler` verweist im Zweig „einzelnes Modul stumm" dorthin.

### Fehlercodes

`syn` enthält Werkstattsprache und Fehlercodes, damit die Suche greift. Jeder
Code wurde vor Aufnahme einzeln gegen eine Quelle geprüft:

- `agr-pos`: **P0404, P0405, P0406** — generische SAE-J2012-Codes, belegt.
- `lenkwinkel`: **U0126, U0428** — generische SAE-J2012-Netzwerkcodes, belegt.
  Sie melden einen Kommunikations- beziehungsweise Datenfehler, **nicht** einen
  defekten Sensor. Das steht so in der Karte.
- `ibs`: **keine.** Für den Batteriesensor existiert kein generischer OBD-Code;
  die Codes sind herstellerspezifisch. Statt einen zu erfinden, benennt die
  Karte in `limits` ausdrücklich, dass es keinen gibt.

### Werte

Keine neuen absoluten Grenzwerte. Alle drei Karten arbeiten mit qualitativen
Erwartungen (stetiger Verlauf, reproduzierbare Endlagen, schwankender
LIN-Mittelwert) und verweisen für Zahlen auf die Fahrzeugvorgabe. `SOURCES.md`
listet die vier neuen Themen zusätzlich unter „Bewusst OEM-/bauteilabhängig".

## 2 · Rechner gegen ungültigen Widerstand gehärtet

`calcMvDrop()` prüfte `isNaN(mv)`, aber nicht `r`. Ergebnis wäre „≈ NaN mA"
gewesen. Jetzt derselbe Wächter für `r`, mit verständlicher Meldung
(„Sicherungsbauform und Nennwert auswählen"). Drei Regressionen im Validator:
kein `NaN`, verständlicher Hinweis, und der Rechner arbeitet nach dem Fehlerfall
wieder normal.

## 3 · Auslieferungsdateien vervollständigt

- **`offline.html`** — schlicht, im Farbschema der App, **ohne Skript und ohne
  fremde Ressourcen**. Der Wiederholen-Weg ist ein Verweis auf `./`, kein
  JavaScript. Liegt in `CORE_ASSETS` (nicht optional) und ist im `catch`-Zweig
  der Navigation der zweite Fallback hinter `index.html`.
- **`_headers`** — `no-cache` für `sw.js`, `manifest.webmanifest`, `/`,
  `index.html`, `offline.html`; ein Jahr `immutable` für `*.png` und `*.svg`;
  global `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `X-Frame-Options: DENY`.

## 4 · Rechtlicher und organisatorischer Rahmen

**In der App:**

- **Nutzungshinweis** (`ℹ️ Hinweis` in der Navigation, zusätzlich über die
  Fußzeile). Beim Erststart sichtbar, einmalige Bestätigung in
  `mm_hinweis_ok`, danach nie wieder von selbst. Kein harter Blocker: Er läuft
  über dieselbe Overlay- und History-Mechanik wie Detail, Glossar und
  Diagnosebaum. Inhalt: Orientierungswerte für Lern- und Diagnosezwecke;
  Hersteller- und WIS-Angaben haben Vorrang; ersetzt weder Ausbildung noch
  Fahrzeugdokumentation noch Herstellerprozedur; HV, Airbag und Bremse setzen
  die vorgeschriebene Qualifikation voraus.
- **Inhaltsstand** als eigene Konstante `DATA_STAND` neben `APP_VERSION`,
  sichtbar in der Fußzeile und im Nutzungshinweis. Bewusst getrennt von der
  Versionsnummer: Sollwerte veralten unabhängig davon, ob am Code etwas
  geändert wurde. Muss mit der Datierung in `SOURCES.md` übereinstimmen — der
  Validator koppelt beide.

**Als Entwurf im Projekt, bewusst nicht in der App** (Entscheidung des
Herausgebers, damit keine Platzhalter im sichtbaren Produkt stehen):

`LEGAL/00-UEBERSICHT.md` mit allen offenen Punkten, dazu
`IMPRESSUM-ENTWURF.md`, `DATENSCHUTZ-ENTWURF.md`, `LIZENZ-ENTSCHEIDUNG.md`,
`RUECKMELDEWEG.md` und ein `LICENSE`-Gerüst. Neu außerdem `README.md`.

### Was bewusst offen blieb

1. **Lizenzmodell.** Drei Varianten mit Folgen ausgearbeitet, keine gewählt.
2. **Rückmeldeweg.** Drei serverlose Varianten gegenübergestellt, keine gewählt.
3. **Impressum.** Struktur nach § 5 ECG mit Platzhaltern. **Mit ausdrücklichem
   Hinweis auf einen Konflikt:** Das entschiedene Copyright-Pseudonym „RS" ist
   für den Urheberrechtsvermerk unproblematisch, erfüllt aber die
   Offenlegungspflicht nach unserer Einschätzung nicht — die verlangt
   identifizierende, ladungsfähige Angaben. Das ist eine Rechtsfrage und hier
   nicht entschieden.
4. **Haftungsklausel.** Der sichtbare Nutzungshinweis beschreibt den Charakter
   des Werkzeugs. Ob zusätzlich eine förmliche Haftungsbeschränkung nötig ist
   und wie sie lauten muss, ist nicht vorformuliert.

### Datenschutzaussage: im Code belegt

Die Aussage „es verlassen keine Daten das Gerät" wurde nicht behauptet, sondern
geprüft — über `index.html`, `sw.js`, `offline.html`, `manifest.webmanifest`:

- Genau eine absolute URL: `http://www.w3.org/2000/svg`. Das ist eine
  XML-Namensraum-Kennung, **kein Netzwerkaufruf**.
- `fetch` nur im Service Worker, beide Aufrufe hinter
  `url.origin !== self.location.origin`. Kein `sendBeacon`, kein
  `XMLHttpRequest`, kein `WebSocket`, kein `EventSource`, kein `importScripts`.
- Keine externen `src`/`href`, keine Fremdschriften, keine Cookies.

Vier `localStorage`-Schlüssel, alle im Entwurf mit Zweck und Löschweg
aufgeführt: `mm_favs`, `mm_beginner`, `ib_dismissed`, `mm_hinweis_ok`.

**Eine Einschränkung, die dazugehört und im Entwurf steht:** Das Laden der App
ist selbst ein Aufruf im Netz. Der Hostinganbieter verarbeitet dabei
üblicherweise IP-Adresse und Zeitpunkt. Das ist keine Übermittlung durch die
App, aber es ist Datenverarbeitung — und es gehört benannt, statt unter „keine
Daten verlassen das Gerät" verschwiegen zu werden.

## 5 · Validator: 81 → 142 Prüfungen

**Abschnitt 19 (Release Candidate):** 52 neue Prüfungen für die drei Karten
(Meta-Vollständigkeit, Anleitungstiefe, konkrete Sollwertquelle statt
Standardhinweis), Auffindbarkeit über neun Suchbegriffe inklusive Fehlercodes,
Position des `danger`-Blocks im gerenderten DOM, beidseitige Verlinkung
IBS ↔ Ruhestrom und Lenkwinkel ↔ CAN/SRS als aufgelöste Chips, `offline.html`
und `_headers` inhaltlich, den vollständigen Lebenszyklus des Nutzungshinweises
in drei frischen DOM-Instanzen, den Inhaltsstand, die Belegprüfung „keine
externen Anfragen", die Vollständigkeit der Schlüsselliste im
Datenschutzentwurf **in beide Richtungen**, das Vorhandensein der
Rechtsentwürfe und den Versionsgleichstand über vier Stellen.

**Abschnitt 20 (Vollzähligkeit):** `baseline.json` hält den v8.3-Stand fest —
74 Karten, 74 DEEP-Schlüssel, 15 Bäume, 68 Warnungen, 375 Tabellenzeilen, 308
Fehlersuchschritte, 442 Anleitungsschritte, 295 Ursachenzeilen und **alle 74
Karten-Kennungen namentlich**. Der Lauf schlägt fehl, sobald ein Wert
unterschritten wird oder eine Kennung fehlt.

Die namentliche Prüfung ist der eigentliche Punkt: Eine reine Zählprüfung würde
„eine Karte weg, eine neu" nicht bemerken — und genau das ist der Fehler, der
diesen Auftrag ausgelöst hat.

## 6 · Version

`APP_VERSION = 8.4-Profi` ↔ `APP_CACHE_NAME` ↔ `CACHE_NAME =
kfz-multimeter-profi-v8-4` ↔ Paket `8.4.0`. Inhaltsstand `09.08.2026` in
`index.html` und `SOURCES.md`. Copyright einheitlich auf **„RS"** (zuvor
„R.S."), entsprechend der zuletzt getroffenen Entscheidung.
