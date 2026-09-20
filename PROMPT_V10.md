# V10-Auftrag: KFZ-Oszilloskop-Kompendium → unverzichtbares Werkstatt-Tool

> **So benutzt du diesen Prompt:** Das ist der komplette Arbeitsauftrag für die
> nächste Ausbaustufe (V10). Gib ihn einem Coding-Agenten (Claude Code)
> *zusammen mit dem aktuellsten Arbeitsstand*. Alle harten Fakten
> (VDS1022-Grenzen, API-Realität) sind eingebettet — nicht neu recherchieren,
> nur bei strittigen **Fachwerten** (Regel F) belegen.
>
> *Rev. 2 — nach adversarialer Prüfung gehärtet (Kartentrenner, PSI5-Sicherheit,
> Decode-Ehrlichkeit, Atlas-Vollständigkeit, Deploy-Hygiene, Installation).*

---

## 0) Rolle & nicht verhandelbare Invarianten

Du erweiterst eine **deutschsprachige Single-File-PWA** (`index.html`, CSS+JS
inline, **kein Build-Step**) für die KFZ-Oszilloskop-Diagnose. Zielgruppe:
Werkstattpraxis, Einsteiger- bis Profi-Modus, **offline zuerst**.

Diese Regeln sind absolut. Ein Verstoß macht das Release ungültig:

1. **Eigentümer-Signatur `KFZ-OSZI-RS-803792F7BB4A6C59`** bleibt vollständig
   erhalten — alle Fundstellen unverändert (HTML-Kommentar(e), `.owner-signature`
   -Element, die `window.KFZ_OSZI_OWNER_SIGNATURE`-Belegung und der
   Manipulations-Check/`expected`-Vergleich am Dateiende).
   **Verifikation maßgeblich:
   `grep -c "KFZ-OSZI-RS-803792F7BB4A6C59" index.html` muss die Baseline-Zahl
   behalten (Soll: 4).** Die genaue Zeilenlage vor dem Editieren per Grep
   feststellen — nicht auf feste Zeilennummern verlassen.
2. **Single-File bleibt Single-File.** Kein Bundler, keine externen Runtime-
   Abhängigkeiten, kein CDN. Alles inline. Die App muss per
   `python -m http.server` und als installierte PWA offline voll funktionieren.
3. **`W().spec`-Kopplung nicht brechen.** `W(spec)` gibt (in der v9-Linie) ein
   String-Objekt mit `.spec` zurück; der Live-Modus liest darüber die
   Generator-Parameter der Karte (`karte.gut[0].spec`). Neue Views/Steuerungen
   mutieren **eine Kopie** des spec und rufen `W()` neu auf — niemals
   Signalbilder zu HTML-Strings einfrieren, niemals `W()` zu reinem String
   degradieren. (Achtung: In der Git-Prä-Live-Linie gibt `W()` noch reinen
   String zurück — nach dem Merge, §0.1, muss die v9-`W()`-mit-`.spec` gelten.)
4. **Alle Script-Blöcke müssen syntaktisch sauber sein.** Nach jeder Änderung:
   Blöcke per Regex extrahieren und **einzeln** `node --check` — **Datei
   schreiben und `node --check` als getrennte Schritte** (nie per `&&`/`or`
   verketten; bekannter Eigen-Bug). Ebenso Live-Logik und `bridge.py`
   (`python -m py_compile bridge.py`).
5. **Edits nur mit karten-/stellenspezifischem, eindeutigem Anker (Treffer ==
   1).** Nie blind ersetzen.
   ⚠️ **Karten NICHT über den Array-Trenner einfügen:** der Trenner ist im
   Quelltext **nicht einheitlich** (`}\n\n,\n{` ~29×, `}\n,\n{` ~21×, dazu
   Sektions-Kommentar-Varianten wie `… /* LAMBDA */ {`) und daher **nie ein
   Unique-Anchor**. Stattdessen an einer eindeutigen Ankerzeile arbeiten (z. B.
   der `id:"<nachbarkarte>"` der Vorgänger-/Nachfolgerkarte) und den umgebenden
   Trenner-Stil **lokal** an die dortige Schreibweise anpassen.
6. **Bei jeder Inhalts-/Code-Änderung: SW-Cache-Version + sichtbaren
   Versionsstring auf v10 bumpen** (sonst kein Update-Banner). Vor dem Bump
   verifizieren, **welches** Versions-/Footer-Token real existiert (die
   Git-Linie hat kein „Stand vN", nur „© 2026 … gesichert <Datum>"; die v9-Linie
   hat „Stand vN") und genau dieses konsistent auf v10 setzen.
7. **Versionsdisziplin:** IMMER vom *letzten* echten Arbeitsstand
   weiterarbeiten, nie von einem alten ZIP. Stand vor Beginn per Grep
   verifizieren (§6).
8. **Fachliche Sorgfalt:** Zahlenwerte mit „typ./~/herstellerabhängig"
   qualifizieren; Richtungslogiken (PTC/NTC, f steigend/fallend, Pierburg-LMM)
   explizit als typabhängig kennzeichnen. Signalbilder sind idealisierte
   Prinzipdarstellungen (so im Glossar) — dabei bleibt es.
9. **Sicherheits-Doktrin der App gilt absolut:** An **Airbag-/Rückhalte-/
   pyrotechnischen Kreisen (inkl. PSI5-Sensorik) NICHT messen, kein
   Backprobing** — steht mehrfach in der App und darf durch kein neues Feature
   unterlaufen werden (siehe §4e).
10. **Vor dem Ausliefern:** `rm -rf __pycache__`, dann als
    `kfz-oszi-pwa-live-v10.zip` packen. `.gitignore` um `__pycache__/` und
    `*.zip` ergänzen.

**Regel F (Recherche):** Kein Web-Research für lokale Codearbeit. Recherche nur
für strittige **Fachwerte** — Quellen: Pico, Hella/TekniWiki, CiA, LIN-Spec,
SAE J2716 (= **SENT**), Herstellerdaten. Die VDS1022-/API-Fakten in §3 sind
bereits recherchiert und belegt; übernimm sie.

---

## 0.1) SCHRITT 0 — Baseline klären und zusammenführen (zwingend zuerst)

Es existieren **zwei divergente Linien**. Das muss vor jeder V10-Arbeit
aufgelöst werden.

| | Git-Repo (`chaosroy-cmyk/oszi`) | ZIP-Linie „v9" |
|---|---|---|
| Live-Modus (OsziLogic, oszi-live-app, bridge.py, tests/) | **fehlt** (4 Script-Blöcke, `W()` ohne `.spec`) | **vorhanden** (5 Blöcke, `W().spec`, 23 Tests) |
| Karten | 37, kein `lmm-dig` | 38 inkl. `lmm-dig` |
| Auto-Deploy | **`.github/workflows/deploy.yml` (Cloudflare Pages)** | **fehlt** |
| Headless-Check | `tools/validate.js` (Playwright, `window.validateKompendium()`) | `tests/live-logic.test.js` (Node+assert) |
| Service Worker | `kfzoszi-v2-2026-07-16`, nutzt `skipWaiting` | `kfz-oszi-pwa-signed-…-v9`, **kein** `skipWaiting` |

**Entscheidung des Eigentümers: beide zusammenführen.** Ziel-Baseline V10 =
*voller v9-Live-Modus* **+** *Cloudflare-Auto-Deploy des Git-Repos*.

**Aufgabe Schritt 0:**
1. **Autoritativen jüngsten Stand** je Datei feststellen (Grep-verifizieren, im
   Zweifel Eigentümer fragen). Erwartung: v9 ist funktional weiter, das Git-Repo
   liefert Auto-Deploy + `validate.js`.
2. **Zusammenführen:** kompletten v9-`index.html` (5 Blöcke, `W().spec`,
   `lmm-dig`), `bridge.py`, `tests/live-logic.test.js`, `start/stop-live.cmd` in
   die Repo-Struktur überführen; `deploy.yml` + `tools/validate.js` behalten und
   an v9 anpassen.
3. **PWA-Update-Regel vereinheitlichen auf die v9-Variante:** **kein**
   `skipWaiting` im install-Event; Banner „Neue Version verfügbar" →
   `SKIP_WAITING` → `controllerchange` → genau **ein** `location.reload()`;
   `reg.update()` bei Load und `visibilitychange`. Cache-first/Network-first des
   Git-`sw.js` beibehalten, aber **ein** konsistentes Cache-Namensschema
   festlegen (**Version vor Datum**, z. B. `kfz-oszi-pwa-…-v10-<datum>`) und auf
   v10 bumpen.
4. **Deploy-Hygiene (MUSS, sonst Datenleck):** `deploy.yml` deployt heute den
   **kompletten Repo-Root** (`pages deploy .`). Nach dem Merge würden sonst
   `bridge.py`, `tests/`, `*.cmd`, `PROMPT_V10.md` **öffentlich** auf Cloudflare
   landen. Deploy auf ein **Public-Whitelist** beschränken (nur `index.html`,
   `manifest.webmanifest`, `sw.js`, `icons/` — plus ggf. `multimeter/`) **oder**
   Backend/Doku/ZIP explizit ausschließen. `PROMPT_V10.md` nie deployen.
5. **Verifizieren** (Greps §6), BEVOR V10-Features gebaut werden. Erst wenn der
   zusammengeführte Stand grün ist, weiter.

---

## Leitziel

> **V10 ist das Werkzeug, das ein KFZ-Techniker nicht mehr aus der Hand legt:**
> in Sekunden vom Bauteil zum richtigen Signalbild, eine Oszilloskop-Steuerung
> im **vollen Funktionsumfang des OWON VDS1022** — **ohne** Hardware-Unmögliches
> vorzugaukeln — und **auf jedem Laptop einfach lauffähig**.

Kernfeatures: **A** = Herzstück (Oszi), **B** = Signalbilder nach Sensor,
**C** = macht es unverzichtbar (inkl. einfache Installation, §5/§5.1).

---

## 3) ZIEL A (HERZSTÜCK) — Oszilloskop-Steuerung im vollen VDS1022-Umfang

Ausbau des Live-Modus (heute: 2 Kanäle, V/div+t/div, Flanken-Trigger+Level+
TrigPos, Position/Invert/Zangenfaktor, Nachleuchten, Messwertzeile
Vpp/Min/Max/Ø/RMS, Referenz-Overlay mit `normXCorr`+Toleranzband, Auto-Setup aus
Karte, PNG/CSV, Mock) zur **vollwertigen Scope-Bedienoberfläche im
VDS1022-Umfang**.

**Grundprinzip — ehrliche Dreiteilung.** Jede Funktion gehört in genau einen
Topf, im Code UND im UI:

### 3a) Gerät real steuerbar (über `bridge.py` + florentbr-API) — MUSS
- **Vertikal je Kanal:** Kanal EIN/AUS, Kopplung **DC/AC/GND**, **V/div** aus
  den **10 festen Stufen** (5 mV … 5 V/div bei 1×), vertikaler
  **Offset/Position**, **Tastkopf-Ratio** wie in der VDS-Software
  (1×/10×/20×/50×/100×/… — *mitgelieferte* Tastköpfe sind 1×/10×, weitere
  Ratios für andere Tastköpfe/Zangen; Anzeige rechnet mit).
- **Horizontal/Samplerate:** aus den **24 festen Stufen** (~2,5 S/s … 100 MS/s
  laut API-Stufen — untere Grenze nach Regel F verifizieren, rechnerisch ergibt
  100 s/div × 10 div bei 5000 Punkten ~5 S/s). **Anzeige-Roll-Mode** greift
  automatisch bei sehr langsamer Zeitbasis (Rollbild statt Sweep) — das ist
  *nicht* dasselbe wie lückenfreies Streaming (siehe 3c).
- **Acquisition:** **Sample**, **Peak-Detect** (Glitch-Fang). (Average/Hi-Res →
  3b, da HW nur 5000-Punkte-Frames liefert und Mittelung host-seitig läuft.)
- **Trigger — vollständig:** Quelle **CH1/CH2/EXT**; Typ **Edge** (Rise/Fall),
  **Pulse-Width** (>,<,= Breite), **Slope** (Dual-Level, Zeitfenster); **Level**
  (Rohvolt), **Position** (Pre/Post 0…100 %), **Holdoff** (~100 ns…10 s),
  **Sweep Auto/Normal/Single** (Single = `sweep=ONCE`), **Force-Trigger**,
  **Alternate-Trigger** (CH1/CH2).
- **Run/Stop**, **Autoset** (Auto-Range+Timebase), **Auto-Kalibrierung**.
- **MULTI/EXT-Port (nur Port-Modus geräteseitig):** TTL-Ausgang schalten und
  externer Trigger-In. (Die Pass/Fail-**Auswertung** = Maskenvergleich läuft
  host-seitig → 3b.)
- **Datenpfade:** getriggerte Einzelbild-Frames bis 100 MS/s **oder**
  lückenfreies kontinuierliches Roll-Logging **bis ~100 kS/s** (`read_iter`).

### 3b) Rein Anzeige/Rechnung im Browser (auf gestreamten Samples) — MUSS
Kein Gerätekommando; läuft auf 8-Bit/5000-Punkt-Frames → voll offline/im Mock
reproduzierbar. In `OsziLogic` (DOM-frei, Node-testbar) rechnen:

- **Alle Auto-Messungen** wie VDS1022: Periode, Frequenz, Ø(Mean), **Vpp**,
  Vmax, Vmin, **Vtop/Vbase/Vamp**, **Vrms**, Overshoot, Preshoot,
  **Anstiegs-/Abfallzeit**, **+Breite/−Breite**, **+Duty/−Duty**, **Delay/Phase
  CH1↔CH2**. Antippbare Chips unter der Kurve, Mehrfachauswahl.
- **Cursor:** Zeit (Δt, 1/Δt), Spannung (ΔV), FFT-Cursor (Frequenz/Amplitude).
- **Mathe:** **CH1−CH2** (CAN-Differenz!), CH1+CH2, CH1×CH2 (Leistung),
  CH1/CH2, Invert je Kanal.
- **Average(N)/Hi-Res** (Frame-Mittelung; verbessert Rauschen, **nicht** die
  8 echten Bits — nur bei repetitivem/stabilem Signal), **Nachleuchten/
  Persistence** (PHIST vorhanden; VDS-artig Off…Infinite + manuelles Clear).
- **FFT-Spektrum** mit Fenstern **Rechteck/Hanning/Hamming/Blackman**, Skala
  **Vrms** oder **dBVrms**, Quellkanal wählbar, Split-View Zeit|Spektrum.
  (Auflösung durch 5000-Punkte-Frame begrenzt — im UI so kommunizieren.)
- **X-Y-Modus** (CH1 vs. CH2, Lissajous).
- **Referenzkurve speichern/laden** (IndexedDB `oszi-live`/`aufnahmen`
  vorhanden; Overlay + `normXCorr` + Toleranzband wiederverwenden).
- **Pass/Fail-Maskenvergleich** (host-seitig; nur das TTL-Signal am MULTI-Port
  ist geräteseitig, siehe 3a).
- **Software-Tiefpass** (die HW-20-MHz-Bandbreitenbegrenzung ist über die API
  **nicht** erreichbar, siehe 3c) — als *digitaler* Filter benennen.
- **Protokoll-Decode — ehrlich:** I²C/UART/1-Wire sind host-seitig in der API
  vorhanden und nach JS portierbar, **dekodieren aber NICHT die KFZ-Busse**
  (CAN-HS/LS/FD, LIN, SENT). Für echten **CAN-/LIN-/SENT-Decode** wäre ein
  eigener Decoder nötig — **eigenes, aufwändiges Feature (SOLL/optional)**, kein
  Abfallprodukt der I²C/UART-Decoder. „Erkennen ≠ Dekodieren" (so in der App)
  bleibt gültig.
- **Export:** PNG, **CSV** (Rohvolt, ≤20000 Zeilen), optional BMP;
  Setup-Export/Import (Instrumenteneinstellung als JSON).

### 3c) EHRLICHE GRENZEN — im UI klar zeigen, NIE vortäuschen — MUSS
- **Video-Trigger:** von der florentbr-API **nicht** unterstützt
  (`NotImplementedError`) → nicht als Geräte-Trigger anbieten (KFZ irrelevant).
- **HW-Bandbreitenbegrenzung (20 MHz):** API-Bits hart 0, nicht exponiert → nur
  als Software-Tiefpass (3b), klar als „digital" benannt.
- **Speichertiefe:** **fix 5000 Punkte/Frame** — keine „Deep Memory"; Zoom/
  Scroll nur innerhalb dieser 5000; FFT-Auflösung entsprechend begrenzt.
- **Vertikale Auflösung:** **8 Bit** — Average verbessert nur Rauschen.
- **Kein Hardware-Signalgenerator/AWG** (das VDS1022 hat keinen).
- **Refresh-Rate:** USB-RTT-begrenzt (Default ~3 Hz, praktisch ~1–30 Hz für
  getriggerte Frames). **Kontinuierlich/lückenfrei nur ≤~100 kS/s** (Roll-
  Logging via `read_iter`) — darüber wirft die Lib „Missed some samples".
  ⚠️ *Anzeige-Roll (3a)* ≠ *lückenfreies Streaming (hier)* — im UI/Code
  auseinanderhalten.
- **USB exklusiv:** Bridge und OWON-Java-App schließen sich aus (Singleton +
  `claim_interface`). Bridge muss Lock/Singleton + 3-s-Keepalive-Stop
  respektieren.

### 3d) Bedienung — werkstatttauglich (Touch statt Drehknopf) — MUSS
- Große **+/− Stepper** für V/div, t/div (rasten auf die festen Stufen),
  **segmentierte** Kopplung AC/DC/GND, Tastkopf-Ratio, Kanal CH1/CH2/Math/FFT
  als Tabs.
- **Trigger** als vertikaler Level-Slider mit Flanke auf/ab; Modus
  Auto/Normal/Single, **Run/Stop**, **Auto-Set** als große Buttons.
- **Trigger-Pegel bleibt Rohvolt** (Linie wird für Anzeige mittransformiert).
- **Querformat-Empfehlung/Lock** im Scope-Modus, Pinch-Zoom auf die Kurve,
  Dark-Default, hoher Kontrast, Tap-Ziele ≥ 48 px.
- Canvas-rAF weiterhin **gated** auf sichtbare Live-Section.

### 3e) Software-Trigger-Emulation für Mock/Demo — MUSS
Der Mock muss auf **Trigger-Typ/Flanke/Level/Position** reagieren (Edge, Pulse,
Slope), damit (a) die Demo ohne Hardware glaubwürdig ist und (b) die
Trigger-Logik **DOM-frei in `OsziLogic` testbar** wird (Voraussetzung für die
Trigger-Tests in §6). Die Emulation läuft auf den generierten/gepufferten
Samples, nicht am Gerät.

### 3f) `bridge.py` — Ausbau — MUSS
- Kommandos erweitern: `coupling`, `probe`, `acqmode` (sample/peak/roll),
  `trigger` (type/source/level/pos/holdoff/sweep/width/slope), `force`,
  `autoset`, `calibrate`, `multi`. `SET`-Dict bleibt Wahrheitsquelle,
  `RATE_LADDER` ≥ 2000 Punkte/Fenster, reconnect-sicher.
- **Windows-USB-Workaround auf Backend-Ebene** beibehalten (libusb1/libusb0:
  `is_kernel_driver_active`→False, detach/attach→no-op).
- JSON-Frames; bei RTT > 100 ms Binärformat (`[b'OSZ1'][u32 len][JSON pad4]
  [Float32 LE]`).
- **Auto-Setup aus Karte** (`applyKartenSetup`, `parseSetup`) auf neue Felder
  (Kopplung/Tastkopf/Trigger-Typ) erweitern.

---

## 4) ZIEL B — „Alle Signalbilder nach Sensor" (Signal-Atlas)

Sensor-erste Achse + dedizierter **Signal-Atlas**, **additiv**, ohne die
bestehende Bauart-Filterung zu ersetzen.

> **Zeilennummern/Hook-Namen unten sind Orientierung aus der Git-Prä-Live-Linie.**
> In der zusammengeführten v10-Baseline per Grep neu lokalisieren (`cardGroup`,
> `grpBadge`, `GRPLBL`, `buildIndex`, `applyPage`, `cardMatch`, der
> `specToHtml`/W()-Renderpfad, `fig(`).

### 4a) Datenmodell & Gruppierung (additiv, bricht nichts) — MUSS
- **Optionales Feld `c.sys`** pro Karte. Fallback leitet aus `id`/`kat` ab —
  Karten müssen nicht alle sofort editiert werden. Schema-Feldreihenfolge sonst
  unverändert; `W()`/`.spec` unberührt.
- **Neue Funktion `sysGroup(c)`** analog `cardGroup(c)`: gibt `c.sys` zurück oder
  leitet ab. **`cardGroup()` bleibt unverändert.**
- **`SYSLBL`** (analog `GRPLBL`): Klartext-Name + Badge-Klasse je sysGroup.
- **Zweite Filter-Achse ohne Bruch:** Umschalter **„Gruppieren nach: Bauart |
  System"**; im System-Modus prüft `cardMatch` gegen `sysGroup(c)`
  (`if(state.sys && sysGroup(c)!==state.sys) return false;`). Generische
  Filter-Init-Mechanik wiederverwenden (`['fSys','sys']`).
- **`buildIndex()`** um `SYSLBL[sysGroup(c)]` + Synonyme (Drehzahl, Ladedruck/
  Boost, Kühlmittel …) erweitern — Suchlogik selbst unverändert.

### 4b) Sensor-erste Taxonomie (11 Systemgruppen, alle 38 Karten inkl. `lmm-dig`)
```
drehzahl-position  Drehzahl & Lage:      kw-ind, kw-hall, kwnw-sync,
                                          raddreh-pass, raddreh-akt, pos-sensor, edk
luft-ladung        Luft & Ladedruck:     lmm-ana, lmm-dig, map
temperatur         Temperatur:           ntc, agt
druck-fluid        Druck (Fluid/Abgas):  oeldruck, raildruck, dpf
verbrennung        Verbrennung/Klopf:    klopf
lambda-abgas       Lambda & Gemisch:     lam-sprung, lam-nachkat, lam-lsu, lam-heiz
einspritzung       Einspritzung:         inj-saug, inj-di, inj-cr-mag, inj-piezo
zuendung           Zündung:              zuend-prim, zuend-sek
stellglieder       Ventile & Steller:    pwm-ventil, stellmotor, luefter-pwm, relais
bordnetz-hochstrom Bordnetz & Hochstrom: kraftstoffpumpe, gluehkerze, starter, generator-ripple
bus-daten          Bus & Datenleitungen: can-hs, can-fd, can-ls, lin
```

### 4c) Signal-Atlas-Seite `pg-atlas` — MUSS
Eigene Seite (`data-nav "Signal-Atlas"`), Einstieg **vor** den Messkarten.
Rendert **ausschließlich** über den bestehenden `W()`-Renderpfad (Karten-`c.gut`/
`c.schlecht` bzw. `W(clone(karte.gut[0].spec))`) — nie über vor-serialisierte
HTML-Strings (keine Datendopplung, voll offline).

- **Ebene 1:** große System-Kacheln (11 Gruppen).
- **Ebene 2:** Sensor-Kacheln der Gruppe, je mit GUT-Mini-Thumbnail.
- **Ebene 3 (Kern):** Sensor-Detail als Galerie — **GUT-Referenz groß oben**
  (`c.gut[0]`), darunter die typischen **FEHLER-Kurven** aus `c.schlecht[]`
  (wischbar/gestapelt), je mit rotem FEHLER-Badge, Kurz-Titel, Warum-Text
  (`spec.why`). Handy: Segmented-Toggle „Gut | Fehler"; Querformat: Split-View.
- **Cross-Links** auf passende **FEHLERDB**-Muster (unterbrechung, ks-masse,
  rauschen, windungsschluss …) — optionales Feld `c.fehler:[<FEHLERDB-id>,…]`,
  sonst sig-basierte Heuristik.
- **Setup-Kurzzeile** (Kanal/Kopplung/V-div/t-div/Trigger aus `c.setup`) +
  Sprung zur Vollkarte (`go('pg-karten',{card:c.id})`).
- **Deep-Link je Sensor** (`#pg-atlas~c-<id>`) → QR-Codes am Werkzeugwagen.
- **Integration mit Ziel A:** aus jedem Atlas-Signalbild **„live durchsteuern"**
  — die Scope-Steuerung (§3) übernimmt Startparameter aus `karte.gut[0].spec`.
- **Gemeinsame Helferfunktion `sigFigures(c, side)`** kapselt den Renderpfad
  (genutzt von Kartenkörper UND Atlas), damit `W()`-Aufrufe nicht dupliziert
  werden.

### 4c-2) Wirklich ALLE Signalbilder — die freistehenden `fig()`-Figuren — MUSS
Es gibt **~27 eigenständige `fig("svg-…")`-Signalbilder außerhalb des
KARTEN-Arrays** (u. a. `svg-flexray`, `svg-sent`, `svg-5v-gut/einbruch/ripple/
ks`, `svg-masse-gut/schlecht`, `svg-acdc`, `svg-alias`, `svg-trig`,
`svg-can-gut/diff/f1..f4`, `svg-canls`, `svg-canfd`, `svg-lin-gut/f1/f2`,
`svg-frame`, `svg-kwnw`, `svg-battstart`). Rendert der Atlas nur Karten, tauchen
diese **nie** auf → das Headline-Versprechen „**alle** Signalbilder nach Sensor"
wäre verfehlt. Deshalb:
- **Registry `FIGSYS`** (oder `sys`-Tag je `fig`): ordnet jede freistehende
  Figur einer Systemgruppe/einem Sensor zu (z. B. `svg-5v-*` →
  `bordnetz-hochstrom`/„5-V-Referenz", `svg-can-*`/`svg-lin-*` → `bus-daten`,
  `svg-flexray` → `bus-daten`, `svg-masse-*` → generischer Prüfpunkt).
- Der Atlas zeigt sie in der jeweiligen Gruppe als eigene „Referenz/Erklär-Bild"
  -Kacheln (klar von Mess-Karten unterscheidbar), über **denselben**
  `sigFigures`/`fig()`-Renderpfad — keine Duplizierung.
- **Vollständigkeits-Check:** jede `fig("svg-…")` ist genau einer Gruppe
  zugeordnet oder bewusst ausgenommen (Konzept-Skizzen wie `svg-acdc`,
  `svg-alias`, `svg-trig` dürfen unter „Grundlagen" laufen).

### 4d) `spec`-Startwerte für VDS1022-Umfang additiv ergänzen — MUSS
`coupling` (`AC`/`DC`/`GND`), `probe` (`1:1`/`10:1`/…), `position`/`offset` je
Kanal, `holdoff`, Trigger-Typ. `vdiv`/`tdiv`/`trig`/`yr` vorhanden. **`W()`
ignoriert unbekannte spec-Felder → voll abwärtskompatibel.**

### 4e) Vollständigkeit nach Sensor — Coverage — SOLL (gestaffelt, nach Freigabe)
Nach Freigabe des Eigentümers als neue **Karten** (je GUT+FEHLER-Signalbild,
Fachwerte nach Regel F). **Zwei Klassen sauber trennen:**

**(i) Existiert nur als Bus-/Erklärfigur → zu vollwertiger Karte ausbauen
(damit atlas-/systemfähig):**
- **SENT** (`svg-sent` + Glossar; SAE **J2716**) → eigene SENT-Karte.
- **Sensor-5-V-Referenz** (`svg-5v-*`) → eigene Prüfpunkt-Karte.
- **FlexRay** (`svg-flexray`; „nominal ±~2 V" — durch §6-Grep geschützt) → Karte.

**(ii) Fehlt komplett → neu (priorisiert nach Werkstattrelevanz):**
1. **Nockenwellensensor** eigenständig (bisher nur `kwnw-sync`).
2. **Ladedrucksensor (Boost)** getrennt vom MAP; **Ladelufttemperatur (LLT)**;
   Ansauglufttemperatur getrennt von `ntc`.
3. **Fahrpedalgeber** (2-kanalig redundant) statt generischem `pos-sensor`.
4. **Kraftstoff-Niederdrucksensor** (Vorförderdruck) neben `raildruck`.
5. **Abgasnachbehandlung Diesel:** NOx-Sensor, Abgasgegendruck, Ruß-/
   Partikelsensor; AdBlue Füllstand/Temp/Qualität.
6. **ESP/Fahrdynamik:** Lenkwinkel-, Gierraten-/Querbeschleunigungs-,
   Bremsdrucksensor.
7. **Getriebe (AT/DSG):** Drehzahlsensoren, Wählhebel/Position, Öldruck/-temp.
8. **Batteriesensor (IBS)** eigenständig.
9. **Weitere Busse:** Automotive Ethernet (100BASE-T1/BroadR-Reach).
10. **HV/E-Antrieb** (eigener, klar gekennzeichneter Sicherheitsbereich):
    Resolver/Rotorlage, 3-Phasen-Motorstrom, HV-Strom/-Spannung,
    Isolationswächter, Zellspannungen/Balancing, DC-DC-Ripple.
11. Klima (Kältemitteldruck), Regen-/Licht-/Ultraschall-Parksensoren,
    Ionenstrom/Brennraumdruck.

**⚠️ NICHT als Mess-Karte, nur als „Erkennen/Nicht-messen"-Erklärkarte:**
- **PSI5** (Airbag-/Rückhaltesensorik): **kein GUT/FEHLER-Oszi-Messbild** — die
  App verbietet Messen an pyrotechnischen Kreisen (§0 Regel 9). Nur erklären, wie
  man PSI5 erkennt und **warum** man dort nicht misst. (PSI5 ≠ SENT; SAE J2716
  gehört zu **SENT**, nicht PSI5.)

> Coverage ist **SOLL/gestaffelt** — erst A+B (MUSS) sauber liefern, Karten dann
> in Wellen, jede mit Test-/Validate-Durchlauf.

---

## 5) ZIEL C — Was V10 „unverzichtbar" macht — MUSS/SOLL

- **Handy-Auto-Update (MUSS):** Auto-Deploy (Schritt 0) aktiv; Push → Deploy →
  PWA zieht neue Version (Banner-Flow v9-Regel). Deploy-Whitelist beachten (§0.1
  Pkt. 4).
- **Offline zu 100 % (MUSS):** Atlas, alle Signalbilder, Glossar, Prüfpläne,
  FEHLERDB, Scope-Mock ohne Netz; SW-Precache vollständig.
- **QR-Deep-Links (SOLL):** pro Sensor (`#pg-atlas~c-<id>`) — Aufkleber am
  Werkzeugwagen/Adapter → 0 Taps aufs Signalbild.
- **Sporadik-Jagd (SOLL, Roys Fokus):** Single-Shot, Nachleuchten/Infinite,
  Min/Max, Peak-Detect, Roll-Logging (≤100 kS/s) prominent/schnell.
- **Auto-Setup aus Karte (MUSS):** aus Atlas/Karte die Scope-Startparameter
  setzen → anklemmen, App steht richtig.

## 5.1) Installation & Deployment auf beliebigem Laptop — MUSS/SOLL

Zwei Ebenen sauber trennen:

**Ebene 1 — Nachschlagewerk (ohne Live): quasi installationsfrei (MUSS).**
- Deploy-URL öffnen → „App installieren" → offline nutzbar. Kein Python, keine
  Dateikopie.
- ⚠️ Reine `file://`-Nutzung: Seite läuft, aber **Service-Worker/PWA-Install +
  Offline-Cache funktionieren nur über http(s)** (URL oder lokaler Server) —
  im README/Startproblem-Doku klar sagen.

**Ebene 2 — Live-Oszi-Bridge (der eigentliche Aufwand):**
- **Portable One-Klick-Bundle (MUSS):** `bridge.py` mit **PyInstaller** zu einer
  einzelnen **`bridge.exe`** einfrieren — inkl. `vds1022`-API, libusb und den
  **FPGA-Firmware-`.bin`-Dateien**. Alles in einen Ordner/ZIP mit `start.cmd`
  (startet Bridge + öffnet Browser auf die Deploy-URL bzw. lokalen Server).
  Ziel: „entpacken, `start.cmd` doppelklicken" — **kein Python-Install nötig**.
  Build-Rezept + Test auf einem frischen Windows dokumentieren.
- **Treiber-Binding (MUSS-Doku, nicht wegzaubern):** die VDS1022 muss auf
  **WinUSB** gebunden sein (Zadig bzw. florentbrs `install-win.cmd`, einmal als
  Admin). Als `treiber-einrichten.cmd` bereitstellen. ⚠️ **Konflikt**, wenn die
  OWON-Java-App einen anderen Treiber gebunden hat (USB exklusiv) — im Doku-Text
  behandeln. macOS/Linux: `install-mac.sh`/`install-linux.sh` (udev-Regeln);
  PyInstaller kann auch dafür bauen.
- **WebUSB-Direktanbindung (SOLL, strategischer Endzustand):** Chrome/Edge kann
  per **WebUSB** direkt mit der Scope reden → **Bridge fällt weg**, reine PWA
  („URL öffnen, Scope einstecken, Verbinden"). Ehrliche Haken, im Prompt/Doku
  festhalten: nur Chromium (kein Firefox/Safari), braucht **HTTPS** (Deploy-URL
  ok), auf Windows **weiterhin WinUSB-Binding**, und **FPGA-Upload +
  florentbr-Protokoll müssen nach JS portiert** werden (echter Aufwand). Als
  eigenes, späteres Ziel spezifizieren — nicht Voraussetzung für V10.

---

## 6) Umsetzungs-Pipeline & Abnahmekriterien (Definition of Done)

Iterativ (Schritt 0 → A → B → C), nach **jeder** Änderung validieren.

**Edit-Pipeline (Pflicht):**
1. Edits mit karten-/stellenspezifischem Unique-Anchor (`c==1`). Karten am
   Nachbar-`id:"…"` einfügen, Trenner-Stil lokal anpassen (§0 Regel 5).
2. **`node --check`** je Script-Block (per Regex extrahiert; Schreiben und Prüfen
   **getrennt**), Live-Logik und `bridge.py` (`python -m py_compile`).
3. **Tests:** `node tests/live-logic.test.js` grün **und** neue `OsziLogic`-Tests
   ergänzen: FFT-Peak, Cursor Δt/ΔV, +/−Breite, Duty, Rise/Fall, Phase CH1↔CH2,
   Average, **Software-Trigger-Emulation Edge/Pulse/Slope** (§3e — nur dadurch
   sind die Trigger-Tests DOM-frei möglich). Testzahl steigt sichtbar über 23.
4. **Headless:** `node tools/validate.js` grün; `renderAtlas()` und Scope-Modus
   ohne Console-Errors.

**Regressions-Greps (müssen passen):**
```
grep -c "KFZ-OSZI-RS-803792F7BB4A6C59" index.html   # == 4 (Signatur)
grep -c "Lücke: 2 Zähne fehlen" index.html           # ind-Fix erhalten
grep -c "0,2–1 Ω je nach Hersteller" index.html      # CR-Fix erhalten
grep -c "nominal ±~2 V" index.html                   # FlexRay-Text erhalten
grep -c "i0000000000000i" index.html                 # LIN 13-Bit-Break erhalten
grep -c 'id:"lmm-dig"' index.html                    # v9-Karte vorhanden (post-Merge)
grep -c 'id="oszi-live-logic"' index.html            # Live-Logik-Block vorhanden
grep -c 'id="oszi-live-app"' index.html              # Live-App-Block vorhanden
grep -c "function sysGroup" index.html               # NEU: Sensor-Gruppierung
grep -c "pg-atlas" index.html                        # NEU: Signal-Atlas-Seite
grep -c "FIGSYS" index.html                          # NEU: fig()-Figuren im Atlas erfasst
# Version/SW nach dem tatsächlich vorhandenen Token bumpen (erst per Grep prüfen,
# welches existiert), Schema Version-vor-Datum:
grep -oE "Stand v[0-9]+|gesichert [0-9-]+" index.html | head -3   # Footer-Token real?
grep -oE "v10" sw.js                                 # SW-Cache auf v10 gebumpt
```

**Feature-Abnahme:**
- **A:** Panel bietet 3a vollständig; 3b vollständig (alle Auto-Messungen,
  Cursor, Mathe inkl. CH1−CH2, FFT mit 4 Fenstern, X-Y, Referenz, Persistence,
  Pass/Fail host-seitig, Export); 3c-Grenzen im UI ehrlich (Video-Trigger nicht
  als HW, BW-Limit „digital", 8-Bit/5000-Punkte-Hinweise, Roll ≠ Streaming);
  3e Mock reagiert auf Trigger. Alles im Mock ohne Hardware bedienbar.
- **B:** Umschalter Bauart|System; `pg-atlas` 2-Tap (System→Sensor→Kurve),
  GUT+FEHLER-Galerie, FEHLERDB-Cross-Links, Deep-Links; **freistehende
  `fig()`-Figuren via `FIGSYS` im Atlas sichtbar** (kein „fehlendes Bild");
  keine Datendopplung; alte Messkartenseite + kat-Chips unverändert nutzbar.
- **C:** Auto-Deploy greift **mit Whitelist** (kein Backend/Doku/ZIP öffentlich);
  App offline vollständig; Banner-Flow v9-Regel; Auto-Setup aus Atlas/Karte;
  `bridge.exe`-Bundle auf frischem Windows getestet.

**Auslieferung:** `rm -rf __pycache__`; `.gitignore` enthält `__pycache__/`,
`*.zip`; dann `kfz-oszi-pwa-live-v10.zip`. Versionshistorie-Tabelle um die
v10-Zeile ergänzen.

---

## 7) Was NICHT tun (Fallen)

- `W()` nicht zu reinem String machen / Signalbilder nicht zu HTML einfrieren.
- `cardGroup()` nicht umschreiben → additiv `sysGroup()` daneben.
- **Karten nicht am generischen Array-Trenner einfügen** (nicht unique, nicht
  einheitlich) → Nachbar-`id:"…"` als Anker.
- Keine Hardware-Fähigkeit vortäuschen (Video-Trigger als HW, „Deep Memory",
  >8 Bit, Echt-Scope-Refresh, AWG, „I²C-Decoder dekodiert CAN"). §3c ist bindend.
- **Kein PSI5-/Airbag-Messbild** (Sicherheit, §0 Regel 9 / §4e).
- `skipWaiting` nicht im install-Event (v9-Update-Regel).
- Backend/Doku/ZIP/`PROMPT_V10.md` nicht mit auf Cloudflare deployen.
- Nicht von altem ZIP starten; nicht ohne SW-/Footer-Bump releasen;
  `__pycache__` nicht ausliefern.
- Fachwerte nie absolut — „typ./~/herstellerabhängig"; Richtungslogiken
  typabhängig kennzeichnen.
- `node --check` und Datei-Schreiben nie per `&&`/`or` verketten.
