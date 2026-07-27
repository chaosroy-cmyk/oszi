# CHANGELOG v8.1-Profi

Umsetzung des Auftrags „v8.0 fachlich und technisch auf Freigabestand bringen".
Leitprinzip aller Änderungen: **Ein Messwert allein ist kein Befund.**
Herstellerabhängige Größen erzeugen keine Gut-/Schlecht-Entscheidung mehr,
sondern verweisen auf den OEM-Prüfplan und wählen nur den nächsten Prüfpfad.

---

## A · Fachlich zwingende Korrekturen

### A1 · 5-V-Referenz vollständig bereinigt
Alle festen Grenzen (`4,9–5,1 V`, `unter 4,9 V`, `über 5,1 V`, `> 5,2 V`) sind
aus **allen** aktiven Diagnosepfaden entfernt: Karten `ref5v`, `ref5v-basis`,
`ref5v-masseschluss`, `ref5v-plusschluss`, `ref5v-vergleich`, deren
DEEP-Module, Grundlagen-Spannungstabelle sowie die Bäume `sensor-unplausibel`
und `5v-kurzschluss`. `4,75–5,25 V` und `4,7–5,3 V` erscheinen nur noch als
ausdrücklich gekennzeichnete Herstellerbeispiele.

**Neuer Baum `5v-kurzschluss` (13 Knoten)** folgt der geforderten Reihenfolge:
OEM-Sollbereich bekannt? → Messung gegen Sensor-Masse *und* Batterieminus →
Masseversatz ausschließen → mehrere Sensoren betroffen? → Sensoren kontrolliert
einzeln trennen → Leitung erst nach Isolation aller legitimen Verbraucher →
Masseschluss erst am vollständig isolierten Leiter → Plusschluss erst nach
zurückverfolgter Quelle → Steuergeräteausgang zuletzt.

**Key-off-Prüfung:** „Zündung aus" genügt nicht mehr. OEM-Nachlauf-/Power-down-
Zeit, Schlafzustand, Wake-ups und Restspannung sind Voraussetzung; nur eine
nach vollständigem Power-down dauerhaft anstehende und zurückverfolgte
Fremdspannung gilt als Einspeisung.

**Widerstandsmessung:** nur vollständig spannungsfrei und nach Trennung des
Steuergeräts *und* aller legitimen Pfade. Ohne vollständige Isolation lautet
das Ergebnis „nicht bewertbar". Die Pauschale „einige hundert Ohm bis kΩ =
Feuchtigkeit" ist entfernt – Zwischenwerte sind Verdacht, kein Befund.

### A2 · Generatorprüfung neu strukturiert
Universelle Aussagen entfernt (`Motor läuft → 13,5–14,8 V`, `unter 13,2 V unter
Last = Fehler`, `≈12 V = lädt nicht`) – aus Batteriekarte,
Grundlagen-Spannungstabelle, Generator-Tiefenmodul, Schrittfolge,
Ergebnistabelle, Einsteigertexten und Profi-Karte `generator-lin-bsd`.

**Neuer Baum `generator-laedt-nicht` (14 Knoten)** beginnt mit „Welche
Ladesystemart liegt vor?" (konventionell / intelligentes Lademanagement /
unbekannt). Bei „unbekannt" wird zuerst das System bestimmt, keine
Defektentscheidung aus einer Einzelspannung. Beim geregelten System entscheidet
die Abweichung zwischen Steuergeräteanforderung und Ist-Verhalten, bewertet
über Ladesollwert, Generatorfreigabe, Batteriestrom, SOC, Batterietemperatur,
Batteriesensor und Kommunikation.

### A3 · MAP-Sensor
Der Pfad endet nicht mehr mit „Referenz und Masse okay → Sensor tauschen".
Neue Schrittfolge: Versorgung/Sensor-Masse → Masseversatz → Signalleitung →
Schlauch/Dichtung/Druckanschluss → KOEO gegen barometrischen Druck →
Signalspannung gegen die konkrete Kennlinie/Teilenummer → Livedaten gegen
unabhängigen Druckwert → **Ersatz erst bei bestätigter Abweichung.**
Anschlagwerte sind als Verdacht formuliert, nicht als Beweis.

### A4 · Batterie
Karte auf `tag:"gef"` und `risk:"hoch"` umgestellt; der Gefahrblock steht vor
allen Messschritten (per Validator geprüft). Voraussetzungen ergänzt:
Schutzbrille, geeignete Handschuhe, Belüftung, keine Zündquellen, Schmuck
ablegen, Werkzeug gegen Polbrücke sichern.
**Startspannung** ist kein universelles Bestehenskriterium mehr: 9,6–10 V ist
als Orientierungswert gekennzeichnet; die Abhängigkeit von Temperatur, CCA,
Batteriechemie, Starterstrom, Ölviskosität und Startdrehzahl ist benannt, die
Entscheidung trifft ein definierter Last-/Leitwerttest.

### A5 · Raildruck
Karte auf `tag:"gef"` umgestellt, `risk:"hoch"` beibehalten, Gefahrblock vor
dem ersten Messschritt. Klargestellt: Die elektrische Sensorprüfung erfordert
kein Öffnen des Systems; keine Hand-/Finger-Lecksuche; Restdruck und
OEM-Druckabbauverfahren beachten; bei möglicher Flüssigkeitsinjektion sofortige
medizinische Notfallbehandlung. Universelle Werte („Zündung an ≈ 0,5 V",
„0 V/5 V beweist Schluss") ersetzt durch Sensorkennlinie, Teilenummer und
Soll-/Ist-Druck per Diagnose.

---

## B · Weitere fachliche Korrekturen

- **B1 Starter-Spannungsabfall:** Der Widerspruch zwischen „Plus <0,5 V /
  Masse <0,2 V" und „beide Seiten <0,3–0,5 V" ist aufgelöst. Beide Karten und
  alle Tabellen verweisen einheitlich auf die OEM-Vorgabe beim tatsächlichen
  Startstrom; ohne Vorgabe gilt der Seitenvergleich Plus/Masse plus
  Startdrehzahl. Keine neue erfundene Universalgrenze.
- **B2 LIN-Bus:** „0 V / fest = Leitung tot" ersetzt. Dauerhaft Low
  (Masseschluss, dominanter Fehler oder aktiv sendender Teilnehmer) und
  dauerhaft High (Idle, Sleep oder fehlender Master) werden unterschieden; vor
  jeder Fehlerentscheidung sind Masterversorgung, Wake-up,
  Kommunikationsanforderung, Diagnosekommunikation und Oszilloskopbild zu
  prüfen.
- **B3 Ruhestrom:** Ergänzt um Einschaltstrom beim Wiederverbinden über dem
  10-A-Bereich, Prüfung von Messbereich und Gerätesicherung, ausdrückliches
  Verbot von Startversuch/Verbraucherbetätigung bei eingeschleiftem Messgerät,
  Vorzug für Stromzange oder abgesicherte Überbrückung sowie Protokollierung
  von Schlafzustand und Wake-ups.
- **B4 Sicherungsrechner:** Bauform ist jetzt **explizit wählbar**
  (ATOF/Standard 287, MINI 297, MAXI 299) – die Nennströme überlappen zwischen
  den Reihen, die Widerstände unterscheiden sich deutlich. Werte werden nicht
  mehr vermischt. Ergebnis ist sichtbar als Näherung gekennzeichnet, mit
  Hinweis auf Temperatur-, Kontakt- und Fertigungstoleranz sowie auf das Verbot
  pauschaler Summierung (nur nicht überlappende Abgänge derselben
  Verteilungsebene; Haupt- und Untersicherungen nicht doppelt zählen).
- **B5 Richtwert-Inventar:** siehe `SOURCES.md` – belegte Werte mit Quelle und
  Revision, sowie die Liste der bewusst quellenlos belassenen Größen, die
  keine Diagnoseentscheidung auslösen.

---

## C · Sicherheit und Didaktik

- **C1 Gefahrenmatrix:** 19 Karten tragen einen `danger`-Block. Der Validator
  prüft, dass jeder davon **vor** der Arbeitsanweisung erscheint – auch im
  Einsteiger-Modus.
- **C2 Diagnose statt Teiletausch:** Alle Austauschentscheidungen in den
  Fehlersuch-Schritten sind mit einem vorgelagerten Bestätigungsschritt
  versehen (Gegenprobe, Ausschluss von Versorgung/Masse/Leitung oder
  Plausibilisierung per Livedaten). Der Validator prüft das automatisch.
- **C3 Datenkonsistenz:** Die zwölf ungenutzten `TESTS.table`-Datensätze, die
  von einem `DEEP.rt` verdeckt wurden, sind ohne Inhaltsverlust entfernt – es
  gibt keine doppelte Datenquelle mehr.

---

## D · Code, PWA, Accessibility

- **D1 Service Worker:** `CACHE_PREFIX`-Isolation beibehalten und im echten
  Browser verifiziert (fremder Cache eines Nachbar-Origins bleibt erhalten).
  Zusätzlich **gehärtet**: `cache.addAll` ist atomar – ein fehlendes
  Splash-Bild hätte die komplette Installation und damit die Offline-Fähigkeit
  verhindert. Kernumfang wird jetzt zwingend gecacht, optionale Assets nur
  best effort. Dieser Fehler wurde beim Update-Test praktisch reproduziert.
- **D2 Dialoge:** Hintergrund (`header`, `main`, `.botnav`, Banner) wird
  während eines Dialogs `inert` gesetzt und zusätzlich `aria-hidden` – damit
  ist er weder per Maus noch Tastatur noch Screenreader erreichbar. Fokus-Trap,
  Escape und Fokusrückgabe bleiben erhalten.
- **D3 Touchziele:** Favoriten-Button, Zurück-Button, Kategorie-Chips,
  Bottom-Nav, Banner-Schließer und Such-Löschbutton auf mindestens
  44 × 44 CSS-Pixel (WCAG 2.2 SC 2.5.8). Real gemessen bei 360 × 640: kein
  Element unter dem Mindestmaß.
- **D4 Zustandssemantik:** `aria-current="page"` auf der aktiven Navigation,
  `aria-pressed` auf Kategorie-Chips und Favoriten-/Einsteiger-Umschaltern,
  dekorative Emoji `aria-hidden`.
- **D5 Validator reproduzierbar:** `package.json`, `package-lock.json`,
  fixierte `jsdom`-Version (26.1.0) und `npm run validate`. Die
  Produktions-PWA bleibt abhängigkeitsfrei – jsdom ist reine devDependency.

---

## E · PWA- und UI-Politur

- Systemabhängiges **helles Farbschema** über `prefers-color-scheme: light`.
- **13 Landscape-Splashscreens** ergänzt (26 Assets gesamt), alle im Precache.
- Kein horizontaler Überlauf bei 360 × 640 (real geprüft), Tabellen mobil
  scrollbar, Safe-Area-Unterstützung unverändert.
- Update-Hinweis verständlich und **tastaturbedienbar** (verifiziert: Fokus auf
  den Aktualisieren-Button, Auslösung per Enter).
- Keine Konsolenfehler, keine `undefined`/`[object Object]`-Ausgabe.
- Suche, Favoriten, Glossar, Diagnosebäume, Rechner und Einsteiger-Modus
  unverändert funktionsfähig.

---

## F · Testumfang

`npm run validate` → **48 Prüfungen, alle bestanden.** Neu darunter:
semantische Tests gegen feste 5-V-Grenzen, gegen die Verwendung von
4,75–5,25 V als Entscheidungsgrenze, Startknoten der beiden umgebauten Bäume,
Gefahrklassifizierung von Batterie und Raildruck, MAP ohne universellen
KOEO-Wert, Teiletausch nur mit Bestätigungsschritt, Reihenfolge der
Gefahrblöcke, Cache-Präfix-Isolation beider Apps, Splash-Precache,
Inert-Zustand, ARIA-Semantik, Touchziel-Mindestmaße, helles Farbschema.

Zusätzlich praktische Tests im echten Chromium (Details im Testbericht):
Offline-Neustart, Update v8.0 → v8.1, Cache-Isolation, Touchziele,
Viewport 360 × 640.

---

## Version

`APP_VERSION = 8.1-Profi` ↔ `CACHE_NAME = kfz-multimeter-profi-v8-1`
(Synchronität wird vom Validator geprüft.)
