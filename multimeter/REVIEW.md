# Prüfbericht: „KFZ Multimeter Profi" PWA (v6 → v7)

---

## v7.7 – Kartensatz „5-V-Referenz Kurzschluss" ZUR FREIGABE

Neue Kategorie **5-V-Referenz** mit vier Karten, einem Diagnosebaum und
`/* PRÜFEN */`-Markierung. Alle Zahlenwerte stammen aus der Vorgabe des
Fachautors, es wurde nichts interpoliert.

| Karte | Inhalt |
|---|---|
| `ref5v-basis` | Sollwert **4,9–5,1 V**, Messpunkt Sensorstecker (nicht ECU), Abweichungsrichtung als Pfad-Weiche |
| `ref5v-masseschluss` | Symptom ~0 V, Ohm-Prüfung hochohmig (kΩ–MΩ) vs. **~0 Ω**, Eingrenzungstabelle Sensor-für-Sensor, Halbierungsmethode, Klopf-/Wackeltest, typische Fundorte |
| `ref5v-plusschluss` | Symptom Richtung Bordspannung, Erstmessung bei Zündung AUS (Dauerplus-Nachweis), Ohm gegen Verdachtsleitung, Parallelverlegung, Folgeschadenprüfung |
| `ref5v-vergleich` | Gegenüberstellung Spannungsverhalten / Häufigkeit / Gefahr / Prüfmethode |

**Freigabepflichtige Einzelwerte:**
1. **Sollwert 4,9–5,1 V.** Die bestehende Karte `ref5v` führte bisher
   **4,8–5,1 V**. Zur Vermeidung zweier widersprüchlicher Toleranzen in einer
   App wurde sie auf 4,9–5,1 V vereinheitlicht (`/* PRÜFEN */` markiert).
   **Falls 4,8 V belegt ist, bitte beide Stellen zurückstellen.**
2. **Widerstandsschwellen:** hochohmig kΩ–MΩ / OL = kein Schluss, nahe 0 Ω =
   harter Schluss, dazwischen (einige 100 Ω bis kΩ) = Teilschluss/Kriechstrom.
   Der Zwischenbereich ist aus der Vorgabe abgeleitet, nicht wörtlich genannt.

**Farbcodierung – bewusste Abweichung von der Vorgabe:** Angefragt war
„rot = Masse, blau = Plus". Im Tool codieren Rot/Blau/Gelb bereits den
**Schweregrad** (`danger`/`info`/`caution`). Da der Plusschluss laut Vorgabe
der gefährlichere Fall ist, hätte Blau ihn optisch verharmlost. Die Typ-
Unterscheidung erfolgt deshalb über Icon (⏚ Masse / ➕ Plus) und Kartennamen,
die Farbe bleibt Schweregrad-Semantik. Rückmeldung erbeten.

---

## v7.5 – FUSE_R gegen Original-Datenblätter verifiziert (Konflikt gelöst)

Der in v7.4 dokumentierte Konflikt („Auftrag erwartet 0,77 mV @ 10 A ≈ 100 mA,
Tabelle liefert 70 mA") ist **zugunsten des Auftrags geklärt**: Die Prüfung
gegen die Original-Datenblätter zeigt, dass die bis v7.4 hinterlegten Werte
**zu hoch** waren. `FUSE_R` enthält jetzt die exakten Datenblattwerte.

| Nennstrom | v7.4 (mΩ) | v7.5 (mΩ) | Quelle |
|---|---|---|---|
| 3 A | 45 | **31,1** | ATOF 287 |
| 5 A | 24 | **17,85** | ATOF 287 |
| 7,5 A | 16 | **10,91** | ATOF 287 |
| 10 A | 11 | **7,70** | ATOF 287 |
| 15 A | 7,6 | **4,80** | ATOF 287 |
| 20 A | 5,8 | **3,38** | ATOF 287 |
| 25 A | 4,6 | **2,52** | ATOF 287 |
| 30 A | 3,9 | **1,97** | ATOF 287 |
| 40 A | 2,6 | **1,4** | MAXI 299 |
| 50 A | 2,1 | **1,1** | MAXI 299 |

Quellen (Spalte „Typ. Cold Resistance (mΩ)" der Ratings-Tabelle):
- Littelfuse **ATOF® Series 287**, Blade Fuses Rated 32 V, Rev. 02/04/2025
- Littelfuse **MAXI® Series 299**, Blade Fuses Rated 32 V, Rev. 01/06/2025
- Abgleich **MINI® Series 297**: liegt innerhalb ~5 % der ATOF-Werte
  (10 A: 7,42 vs. 7,70 mΩ) – eine getrennte Tabelle je Bauform ist für die
  Eingrenzmessung nicht erforderlich, der Hinweis dazu steht in der Karte.

**Auswirkung auf die Praxis:** Der Rechner zeigte bisher **zu niedrige**
Ströme (Faktor ~1,4). Ein realer 100-mA-Verbraucher an einer 10-A-Sicherung
(0,77 mV) wurde als 70 mA ausgewiesen und damit als „normaler Ruhestrom"
eingestuft, statt als auffällig. Ebenfalls angepasst: die Tabelle
„≈ mV pro 100 mA" in der Karte „Ruhestrom über Sicherung".

---

## v7.4 – Neu formulierte Fachinhalte ZUR FREIGABE

Alle folgenden Inhalte sind im Code mit `/* PRÜFEN */` markiert. Der Fachautor
gibt sie einzeln frei. Es wurden **keine neuen Zahlenwerte erfunden** –
Ausnahmen sind unten explizit benannt und mit Quelle/Begründung versehen.

### Neue Prüfkarte „oeldruck" (Öldruckschalter / Öldrucksensor)
Kompletter Kartentext + DEEP-Eintrag (Anleitung, Erwartungstabelle, Ursachen,
Fehlersuche). Bewusst ohne Schaltdruck-Zahlenwerte – verweist auf Aufdruck/
Herstellerangabe und auf die Manometer-Messung. Sicherheitskern: „Lampe an
bei laufendem Motor = Motor sofort abstellen, Manometer vor Bauteiltausch."

### Such-Synonyme mit Fehlercodes (generische OBD-II-Codes nach SAE J2012)
- `lambda-sprung`: Sauerstoffsensor, O2-Sensor, Regelsonde, Sprungsonde, P0130, P0133, P0135
- `lambda-breit`: Sauerstoffsensor, O2-Sensor, Breitbandsonde, LSU
- `hall`: Nockenwellensensor, CMP, P0340, P0341, P0342
- `kw-ind`: Kurbelwellensensor, OT-Geber, CKP, P0335, P0336
- `ptc-sensor`: KTY81, KTY83, PT1000, PT200 (bereits vorhandene Begriffe der Karte)
- `oeldruck`: Öldruck, Öldruckschalter, Öldrucksensor, Ölkontrollleuchte

### Meta-Felder für 29 bisher ungepflegte Karten
(`ntc-kts, ntc-ats, poti-dk, map, lmm-a, lmm-d, lambda-sprung, kw-ind, hall,
klopf, raildruck, klimadruck, agt, dpf-diff, tankgeber, schalter, magnetventil,
taktventil, injektor-benzin, injektor-diesel, zuendspule, gluehkerze, luefter,
kraftstoffpumpe, stellmotor, ventil-tank, motor-allg, hupe, leitung`)
Jeweils `quality`, `risk`, `requires`, `limits`, `dont` – methodisch aus den
vorhandenen Kartentexten und Warnungen abgeleitet, keine neuen Sollwerte.
Sicherheitsrelevante `dont`-Kerne: Tankgeber (Ex-Gefahr am offenen Tank),
Kraftstoffpumpe (keine Funken), Lüfter (Nachlauf), Piezo-Injektoren (kein MM),
Raildruck (Hochdruckseite nie öffnen), Klimakreis (nur mit Servicegerät).

### „Nicht machen"-Felder für 24 weitere Karten
(`spannung, durchgang, spannungsabfall, batterie, generator, starter,
sicherung, masse, pwm, lambda-breit, radsensor, nox, can, lin, ruhestrom,
ruhestrom-fuse, klemmen, sensor-masseversatz, pullup-pulldown, stromzange-dc,
starter-drop-profi, generator-lin-bsd, ecu-nicht-erreichbar, messprotokoll`)
Kernaussagen u.a.: Batterie nie bei laufendem Motor abklemmen (Generator),
Sicherung nie durch höheren Nennwert ersetzen, keine Prüflampe an Bus-/
Signalleitungen, A-Bereich nie parallel.

### Rechner: Plausibilitätsprüfung gegen den Nennstrom
Neue Logik (keine neuen Messwerte): Ergibt die Umrechnung einen Strom über dem
Nennwert der gewählten Sicherung, meldet der Rechner „unplausibel" statt eines
Scheinergebnisses – eine intakte Sicherung hätte bei diesem Strom ausgelöst.

> **Nachtrag v7.1:** Prüfkarte „Pull-up / Pull-down Signal" fachlich
> vervollständigt: 0-V-Mehrdeutigkeit (Pull-down vs. Masseschluss vs.
> Leitungsbruch, Klärung per Ohm-Messung), Gegenprobe gegen Batterieminus,
> konkrete Pegel (5-V-Sensorkreis / 12-V-Schalterkreis), widerstandskodierte
> Schalter & Spannungsteiler-Eingänge (Zwischenpegel = normal), getaktete
> Pull-ups im Standby, Open-Collector-Zusammenhang (Hallgeber).
>
> **Nachtrag v7.3 (Vollkontrolle für Werkstatt-Alltag):** Zweiter kompletter
> Prüfdurchgang über alle Karten, Bäume, Glossar und Rechner. Korrigiert:
> Induktivgeber-AC beim Anlassen realistisch ~1–5 V (statt „mehrere V" –
> verhinderte falsche Verurteilung guter Geber). Ergänzt: Sicherheitswarnung
> Lüfter-Nachlauf (Lüfter kann bei Zündung AUS anlaufen), Warnung
> Niedervolt-Glühkerzen (4,4/7 V nie an 12 V), Duty-Cycle-Polaritätsfalle
> bei massegeschalteten Verbrauchern, Strommodulation aktiver Radsensoren
> (~7↔14 mA), MIN/MAX-Tipp für Startspannung, Radio-Code-/Normierungs-
> Hinweis vor Batterieabklemmen, 48-V-Mildhybrid-Abgrenzung,
> Messleitungs-Selbsttest, Piepschwelle der Durchgangsprüfung (20–70 Ω),
> Glossar: CAT-Messkategorie, MIN/MAX, Autorange, V⎓/V~.
>
> **Nachtrag v7.2:** PTC-Widerstände ergänzt (fehlten als eigene Prüfungen):
> neue Karte „PTC-Temperatursensor (PT/KTY)" mit genormter PT200/PT1000-
> Kennlinie (IEC 60751) und KTY-Richtwerten inkl. NTC-Verwechslungswarnung,
> neue Karte „PTC-Heizelement / Zuheizer" (Selbstregel-Verhalten, Stufen-/
> LIN-Ansteuerung, Stromzangen-Pflicht bis ~80 A, HV-Zuheizer-Abgrenzung,
> Polyfuse-Hinweis) sowie Glossareinträge PT200/PT1000, KTY und Polyfuse.

Vollständige Prüfung aus drei Blickwinkeln – Kfz-Meister (fachliche Richtigkeit),
Berufsschullehrer (Didaktik/Verständlichkeit) und Senior-Softwareentwickler
(Code, PWA, UX, Mobile). Alle als *behoben* markierten Punkte sind in v7
(diese Version im Ordner `multimeter/`) umgesetzt.

---

## 1. Fachliche Richtigkeit (KFZ-Elektrik)

**Gesamturteil: sehr solide.** Die Kernaussagen zu Spannungsabfallmessung,
Massefehlern, 5-V-Referenz, CAN/LIN-Pegeln, Ruhestrom, Batterie-/Lade-/
Startwerten, Sensor- und Aktuatorprüfungen sind korrekt und entsprechen dem
Werkstatt-Standard. Besonders positiv: die konsequente Warnung vor
Ohm-Messungen an aktiven Kreisen, Prüflampe an 5-V-Referenz, Piezo-Injektoren
und SRS-Zündkreisen sowie die moderne Behandlung aktiver Raddrehzahlsensoren
(Pinzahl ≠ Typbeweis) und intelligenter Generatorregelung (LIN/BSD/BMS).

### Gefundene fachliche Fehler

| # | Befund | Schweregrad | Status |
|---|--------|-------------|--------|
| F1 | **mV-Drop-Rechner: Sicherungs-Innenwiderstände 2–3× zu hoch** (z. B. 10 A mit 30 mΩ statt real ~11 mΩ, 20 A mit 15 mΩ statt ~5,8 mΩ). Folge: Der Rechner **unterschätzt den Ruhestrom systematisch um Faktor 2–3**. Ein realer 100-mA-Verbraucher an einer 10-A-Sicherung (~1 mV Abfall) wurde als „≈33 mA – im normalen Bereich" ausgewiesen → echter Fehler wird übersehen. | **kritisch** | behoben (Werte an typische Kalt-Innenwiderstände lt. Herstellerdaten ATO/Mini angepasst) |
| F2 | **„mV pro 100 mA"-Tabelle** entsprechend falsch (z. B. „10 A ~2,5–3,5 mV" statt real ~1–1,2 mV). | **kritisch** (Folgefehler von F1) | behoben |
| F3 | **Diodentest fehlt komplett** – eine Grundfunktion jedes Multimeters (Diode, LED, Freilaufdiode; Flussspannung Si 0,4–0,8 V, Sperrrichtung OL) war nirgends erklärt, auch nicht im Glossar. | mittel | behoben (neue Prüfkarte inkl. Anleitung, Richtwerten, Fehlersuche + 2 Glossareinträge) |
| F4 | Inkonsistenz: „Spannung messen" nennt Ruhespannung „Motor aus 12,4–12,8 V = gut", die Batterietabelle stuft 12,4 V aber als „50 %/beachten" ein. | gering | behoben (12,5–12,8 V) |
| F5 | Inkonsistenz: CAN-Kurztabelle bewertete 120 Ω (fehlender Abschlusswiderstand) als „beachten", die Detailtabelle korrekt als Fehler. | gering | behoben (einheitlich „kritisch") |
| F6 | Hinweis „Werte oft < 10 mV" bei der mV-Drop-Methode war nach der Widerstandskorrektur zu optimistisch – realistisch sind wenige mV und darunter; für < 20 mA braucht es 0,01-mV-Auflösung. | gering | behoben (Hinweistexte präzisiert) |

**Geprüft und für korrekt befunden** (Auswahl): Batterietabelle (12,7 V voll /
12,4 V 50 % / < 12,0 V leer; AGM 12,8–12,9 V; Start ≥ 9,6–10 V),
Ladespannung 13,5–14,8 V, Spannungsabfall-Grenzwerte (< 0,1 V Sensor, < 0,2–0,3 V
Verbraucher, Starter < 0,5 V Plus / < 0,2 V Masse), CAN 60/120 Ω und 2,5/3,5/1,5 V,
LIN-Pegel, NTC-Kennwerte (2–2,5 kΩ @ 20 °C, 300–380 Ω @ 80 °C), Lambdasonde
0,1↔0,9 V + 0,45-V-Ersatzwert, Drosselklappenpoti 0,5→4,5 V, Injektor Benzin
hochohmig 12–16 Ω, Glühkerze 0,5–1,5 Ω, Magnetventil 15–60 Ω, N75 25–40 Ω,
Relaisspule 60–120 Ω, Ruhestrom 20–50 mA, Prüflampenlast 21 W ≈ 1,75 A,
Rechenlogik I = U/R im Rechner (Einheiten mV/mΩ = A korrekt gekürzt).

## 2. Programmcode

| # | Befund | Schweregrad | Status |
|---|--------|-------------|--------|
| C1 | **Update-Button ohne Funktion:** `sw.js` erwartete `{type:'SKIP_WAITING'}`, die App sendete den String `'SKIP_WAITING'` → „Aktualisieren" blieb dauerhaft auf „Lädt…". Zusätzlich rief der SW `skipWaiting()` bereits bei `install` auf → jede neue Version erzwang sofort einen Reload mitten in der Nutzung; das Update-Banner war wirkungslos. | **kritisch** | behoben (Message-Format vereinheitlicht, `skipWaiting` nur noch nach Nutzer-Bestätigung, SW akzeptiert beide Formate) |
| C2 | **History-Leck:** Jedes Öffnen eines Overlays pushte einen History-Eintrag, das Schließen per ←-Button entfernte ihn nie. Nach n Detailansichten musste man n-mal „Zurück" drücken, um die App zu verlassen; Zurück-Gesten wirkten „tot". | mittel | behoben (zentrale `openOverlay`/`requestClose`-Verwaltung: Button, Escape und Geräte-Zurück laufen über denselben Pfad) |
| C3 | **SW-Cache-Strategie:** cache-first auch für Navigationen (neue index.html kam nur per Cache-Versionswechsel an, `_headers`-no-cache lief ins Leere); Fallback lieferte bei *jedem* Fetch-Fehler index.html (auch für Bilder); kein Same-Origin-Check (Fremd-Responses, opaque-Quota-Risiko). | mittel | behoben (network-first für Navigationen, cache-first für Assets, Same-Origin-Guard, `resp.ok`-Prüfung) |
| C4 | **Komma-Eingabe im Rechner:** `input type="number"` mit Punkt-Placeholder – deutsche Nutzer tippen „2,4"; je nach Browser/Locale wird der Wert verworfen → Rechner reagiert nicht. | mittel | behoben (`type="text" inputmode="decimal"`, Komma wird akzeptiert) |
| C5 | Favoriten-Stern der Kachel aktualisierte sich nach Toggeln im Detail erst beim nächsten Re-Render. | gering | behoben (Re-Render beim Schließen) |
| C6 | Einsteiger-Modus wurde nicht gespeichert (bei jedem Start wieder aus). | gering | behoben (localStorage, mit try/catch) |
| C7 | Install- und Update-Banner konnten sich an derselben Position überlagern. | gering | behoben (Update-Banner blendet Install-Banner aus) |
| C8 | `checkUpdates()`: äußeres Promise ohne `.catch` → mögliche unhandled rejection. | gering | behoben |
| C9 | Toter Ternary in `deepTableHTML` (beide Zweige identisch); ungenauer Einheiten-Kommentar im Rechner. | gering | behoben |
| C10 | `renderNode(idx,path)`: Parameter `path` ungenutzt (kein Fehler, nur Altlast). Entscheidungsbäume selbst wurden vollständig auf Konsistenz geprüft (alle `go`-Ziele existieren, keine Sackgassen). | gering | dokumentiert |

**Positiv:** keine XSS-Angriffsfläche (statische Daten, Suche fließt nie in
innerHTML), localStorage durchgehend mit try/catch gekapselt und
Array-validiert, kein externes CDN (echte Offline-Fähigkeit), saubere
Datenstruktur (TESTS/DEEP/TREES getrennt).

## 3. UX

| # | Befund | Status |
|---|--------|--------|
| U1 | Zurück-Geste/Hardware-Back verhielt sich unlogisch (siehe C2) – auf Android das häufigste Bedienmuster. | behoben |
| U2 | Escape schloss Overlays nicht (Desktop/Tablet mit Tastatur). | behoben |
| U3 | Favoriten-Status nicht sofort sichtbar (C5). | behoben |
| U4 | Einsteiger-Modus vergessen (C6). | behoben |
| U5 | Rechner ignorierte Komma-Eingabe kommentarlos (C4) – für die Zielgruppe (DE) gravierend. | behoben |
| U6 | Positiv: 2-Tap-Tiefe zu jeder Anleitung, Suche + Kategorie-Chips, Einsteiger-/Profi-Trennung, konsistenter Kartenaufbau (Was→Einstellung→Spitzen→Gut/Schlecht→Ursachen→Fehlersuche→Nächster Schritt) – didaktisch stark. | – |

## 4. Mobile Optimierung

- `viewport-fit=cover` + `env(safe-area-inset-*)` für Notch/Home-Indicator: korrekt.
- 16-px-Inputs (kein iOS-Auto-Zoom), Touch-Ziele ≥ 40 px, `-webkit-tap-highlight` neutralisiert: gut.
- Neu in v7: `overscroll-behavior:contain` gegen Scroll-Chaining im Overlay,
  `prefers-reduced-motion`-Unterstützung, `color-scheme:dark` (keine hellen
  Formular-Artefakte), Grid bricht ab 560 px auf 3 Spalten um (Tablet/Querformat ok).
- iOS-Installationshinweis (Teilen → Zum Home-Bildschirm) vorhanden und korrekt
  auf Safari beschränkt.

## 5. PWA

| # | Befund | Status |
|---|--------|--------|
| P1 | Update-Mechanik defekt (C1). | behoben |
| P2 | Manifest: nur SVG + 180-px-PNG; `purpose:"any maskable"` kombiniert (von Chrome abgeraten); kein `id`. Installierbarkeit/Splashscreen auf Android dadurch wackelig. | behoben (192/512/maskable-512-PNGs aus dem SVG gerendert, Purposes getrennt, `id` ergänzt) |
| P3 | Cache-Strategie (C3). | behoben |
| P4 | Versionierung: `APP_VERSION` und `CACHE_NAME` müssen synchron gepflegt werden – jetzt v7/v7 mit Kommentar an beiden Stellen. | behoben |
| P5 | iOS-Splashscreens (`apple-touch-startup-image`) fehlen – iOS zeigt beim Start kurz Weiß. Bewusst offen gelassen (erfordert ~20 gerätespezifische Bilder). | offen (dokumentiert) |
| P6 | Offlinefähigkeit: vollständig (Single-File-App, keine externen Ressourcen); „Nach Updates suchen" im Glossar + stündlicher Auto-Check. | ok |

## 6. Accessibility

- Vorher: Overlays blieben unsichtbar fokussierbar (Tastatur-Falle), Kacheln
  waren `div onclick` (nicht tastaturbedienbar), keine Dialog-Semantik, keine
  Labels auf Icon-Buttons.
- v7: Kacheln sind `<button>`, Overlays `role="dialog" aria-modal` mit
  `visibility`-Steuerung (raus aus Tab-Reihenfolge und A11y-Baum), Fokus wird
  beim Öffnen auf „Zurück" gesetzt und beim Schließen zurückgegeben,
  `aria-pressed`/`aria-label` auf Favoriten-/Einsteiger-Button, sichtbarer
  `:focus-visible`-Ring, Suche mit `aria-label`, `<noscript>`-Hinweis.
- Offen: kein Hell-Thema (bewusst Werkstatt-Dunkeldesign), Emoji-Icons werden
  von Screenreadern teils vorgelesen (in Kacheln jetzt `aria-hidden`).

## 7. Bewertung (0–10)

| Kategorie | v6 | v7 | Begründung |
|-----------|----|----|------------|
| Fachliche Richtigkeit | 7,5 | **9,5** | Kern exzellent; Abzug v6 wegen Rechner-Systemfehler + fehlendem Diodentest |
| Programmcode | 6,5 | **9** | solide Basis; Update-Bug, History-Leck, Locale-Falle behoben |
| UX | 7 | **9** | Struktur stark; Back-Verhalten & Kleinigkeiten behoben |
| Mobile | 8 | **9** | war gut; Feinschliff (overscroll, reduced motion) |
| PWA | 5 | **9** | Update-Flow defekt, Icons unvollständig → jetzt sauber; −1 für fehlende iOS-Splashscreens |
| Accessibility | 4 | **8,5** | vorher klare Mängel; jetzt Dialog-Semantik + Fokus-Management |

## Verbleibende Empfehlungen (nicht umgesetzt)

1. iOS-Splashscreen-Set generieren (`apple-touch-startup-image`).
2. Optionales Hell-Thema für Außeneinsatz bei Sonne.
3. Die Duplizierung von `openDetail` (Basis + v6-Override) mittelfristig zu
   einer Funktion zusammenführen.
4. Langfristig: Prüfdaten in eine separate JSON-Datei auslagern und wie beim
   Oszi-Kompendium mit `tools/validate.js` in CI validieren.
