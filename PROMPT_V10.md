# V10-Auftrag: KFZ-Oszilloskop-Kompendium → unverzichtbares Werkstatt-Tool

> **So benutzt du diesen Prompt:** Das ist der komplette Arbeitsauftrag für die
> nächste Ausbaustufe (V10) des KFZ-Oszilloskop-Kompendiums. Gib ihn einem
> Coding-Agenten (Claude Code) *zusammen mit dem aktuellsten Arbeitsstand*.
> Alle harten Fakten (VDS1022-Grenzen, API-Realität) sind eingebettet — nicht
> neu recherchieren, nur bei strittigen **Fachwerten** (siehe Regel F) belegen.

---

## 0) Rolle & nicht verhandelbare Invarianten

Du erweiterst eine **deutschsprachige Single-File-PWA** (`index.html`, CSS+JS
inline, **kein Build-Step**) für die KFZ-Oszilloskop-Diagnose. Zielgruppe:
Werkstattpraxis, Einsteiger- bis Profi-Modus, **offline zuerst**.

Diese Regeln sind absolut. Ein Verstoß macht das Release ungültig:

1. **Eigentümer-Signatur `KFZ-OSZI-RS-803792F7BB4A6C59`** bleibt an allen
   Stellen unverändert erhalten (HTML-Kommentar, `.owner-signature`-Element,
   `window.KFZ_OSZI_OWNER_SIGNATURE`, Manipulations-Check am Dateiende).
   **Verifikation: `grep -c "KFZ-OSZI-RS-803792F7BB4A6C59" index.html` muss die
   im Baseline vorhandene Zahl behalten (Soll: 4).**
2. **Single-File bleibt Single-File.** Kein Bundler, keine externen Runtime-
   Abhängigkeiten, kein CDN. Alles inline. Die App muss per
   `python -m http.server` und als installierte PWA offline voll funktionieren.
3. **`W().spec`-Kopplung nicht brechen.** `W(spec)` gibt ein String-Objekt mit
   `.spec` zurück; der Live-Modus liest darüber die Generator-Parameter der
   Karte (`karte.gut[0].spec`). Neue Views/Steuerungen mutieren **eine Kopie**
   des spec und rufen `W()` neu auf — niemals Signalbilder zu HTML-Strings
   einfrieren, niemals `W()` zu reinem String degradieren.
4. **Alle Script-Blöcke müssen syntaktisch sauber sein.** Nach jeder Änderung:
   Blöcke per Regex extrahieren und **einzeln** `node --check` (Datei schreiben
   und `node --check` als **getrennte** Schritte ausführen — nie per `&&`/`or`
   verketten). Ebenso die Live-Logik und `bridge.py`.
5. **Edits nur mit exakten Anchors + Trefferzählung (Treffer == 1).** Nie blind
   ersetzen. Kartentrenner im Quelltext exakt `}\n\n,\n{\n`.
6. **Bei jeder Inhalts-/Code-Änderung: SW-Cache-Version + Footer „Stand vN"
   bumpen** (sonst kommt kein Update-Banner). Sichtbaren Versionsstring auf
   **v10** setzen.
7. **Versionsdisziplin (aus Fehlern gelernt):** IMMER vom *letzten* echten
   Arbeitsstand weiterarbeiten, nie von einem alten ZIP. Stand vor Beginn per
   Regex/Grep verifizieren (siehe Abnahme, §6).
8. **Fachliche Sorgfalt:** Zahlenwerte mit „typ./~/herstellerabhängig"
   qualifizieren; Richtungslogiken (PTC/NTC, f steigend/fallend, Pierburg-LMM
   etc.) explizit als typabhängig kennzeichnen. Signalbilder sind idealisierte
   Prinzipdarstellungen (steht so im Glossar) — dabei bleibt es.
9. **Vor dem Ausliefern:** `rm -rf __pycache__`, dann als
   `kfz-oszi-pwa-live-v10.zip` packen.

**Regel F (Recherche):** Kein Web-Research für lokale Codearbeit. Recherche nur
für strittige **Fachwerte** — dann Quellen: Pico, Hella/TekniWiki, CiA,
LIN-Spec, SAE J2716 (SENT), Herstellerdaten. Die VDS1022-/API-Fakten in §3 sind
bereits recherchiert und belegt; übernimm sie.

---

## 0.1) SCHRITT 0 — Baseline klären und zusammenführen (zwingend zuerst)

Es existieren **zwei divergente Linien** desselben Projekts. Das muss vor jeder
V10-Arbeit aufgelöst werden, sonst baust du auf dem falschen Fundament:

| | Git-Repo (`chaosroy-cmyk/oszi`) | ZIP-Linie „v9" |
|---|---|---|
| Live-Modus (OsziLogic, oszi-live-app, bridge.py, tests/) | **fehlt** (nur 4 Script-Blöcke, `W()` ohne `.spec`) | **vorhanden** (5 Blöcke, `W().spec`, 23 Tests) |
| Karten | 37, kein `lmm-dig` | 38 inkl. `lmm-dig` |
| Auto-Deploy | **`.github/workflows/deploy.yml` (Cloudflare Pages)** | **fehlt** |
| Headless-Check | `tools/validate.js` (Playwright, `window.validateKompendium()`) | `tests/live-logic.test.js` (Node+assert) |
| Service Worker | `kfzoszi-v2-2026-07-16`, nutzt `skipWaiting` | `kfz-oszi-pwa-signed-…-v9`, **kein** `skipWaiting` |

**Aufgabe Schritt 0:**
1. Bestimme den **autoritativen jüngsten Stand** (frag im Zweifel den
   Eigentümer). Erwartung: die ZIP-Linie v9 ist inhaltlich/funktional weiter
   (Live-Modus v5–v9), das Git-Repo hat das für „unverzichtbar" nötige
   **Auto-Deploy**.
2. **Führe beide zusammen** — Ziel-Baseline für V10 = *voller v9-Live-Modus*
   **+** *Cloudflare-Auto-Deploy des Git-Repos*. Konkret: den kompletten
   v9-`index.html` (5 Blöcke, `W().spec`, `lmm-dig`), `bridge.py`,
   `tests/live-logic.test.js`, `start/stop-live.cmd` in die Repo-Struktur
   überführen; `deploy.yml` + `tools/validate.js` behalten und an den v9-Stand
   anpassen.
3. **Regel PWA-Update angleichen:** Die v9-Regel gilt (**kein** `skipWaiting`
   im install-Event; Banner „Neue Version verfügbar" → `SKIP_WAITING` →
   `controllerchange` → genau **ein** `location.reload()`; `reg.update()` bei
   Load und `visibilitychange`). Das Git-`sw.js` (mit `skipWaiting`) darf die
   v9-Regel nicht überschreiben — vereinheitliche auf die v9-Variante, aber
   behalte das Cache-first/Network-first-Verhalten und **bumpe die Cache-
   Version auf v10** (ein einziges, konsistentes Schema).
4. **Verifiziere die Vereinigung** mit den Greps aus §6, BEVOR du V10-Features
   baust. Erst wenn der zusammengeführte Stand grün ist, geht es weiter.

> Wenn der Eigentümer entscheidet, V10 rein auf einer der beiden Linien zu
> bauen, respektiere das — aber weise dann explizit darauf hin, was dadurch
> fehlt (kein Live-Modus **oder** keine Handy-Auto-Updates).

---

## Leitziel

> **V10 soll das Werkzeug sein, das ein KFZ-Techniker nicht mehr aus der Hand
> legt:** in Sekunden vom Fahrzeug-Bauteil zum richtigen Signalbild, und mit
> einer Oszilloskop-Steuerung, die den **vollen Funktionsumfang des OWON
> VDS1022** abbildet — ohne dem Nutzer Hardware-Unmögliches vorzugaukeln.

Zwei Kernfeatures (A = Herzstück, B), plus C (macht es „unverzichtbar").

---

## 3) ZIEL A (HERZSTÜCK) — Oszilloskop-Steuerung im vollen VDS1022-Umfang

Der Live-Modus (heute: 2 Kanäle, V/div+t/div, Flanken-Trigger+Level+TrigPos,
Position/Invert/Zangenfaktor, Nachleuchten, Messwertzeile Vpp/Min/Max/Ø/RMS,
Referenz-Overlay mit `normXCorr`+Toleranzband, Auto-Setup aus Karte, PNG/CSV,
Mock) wird zur **vollwertigen Scope-Bedienoberfläche im VDS1022-Umfang**
ausgebaut.

**Grundprinzip — ehrliche Dreiteilung.** Jede Funktion gehört genau in einen
Topf. Halte diese Trennung im Code UND im UI ein:

### 3a) Gerät real steuerbar (über `bridge.py` + florentbr-API) — MUSS
Diese Kommandos gehen echt ans Gerät. Erweitere Bridge-Protokoll + PWA-Panel:

- **Vertikal je Kanal:** Kanal EIN/AUS, Kopplung **DC/AC/GND**, **V/div** aus
  den **10 festen Stufen** (5 mV … 5 V/div bei 1×), vertikaler **Offset/Position**,
  **Tastkopf-Ratio 1×/10×/20×/50×/100×/…** (Anzeige rechnet mit).
- **Horizontal:** **Timebase/Samplerate** aus den **24 festen Stufen**
  (2,5 S/s … 100 MS/s), **Roll-Mode** (auto <2500 S/s, manuell erzwingbar).
- **Acquisition:** **Sample**, **Peak-Detect** (Glitch-Fang!), (Average/Hi-Res
  siehe 3b — auf Frames gerechnet, da HW nur 5000 Punkte liefert).
- **Trigger — vollständig:** Quelle **CH1/CH2/EXT**; Typ **Edge** (Rise/Fall),
  **Pulse-Width** (>,<,= Breite), **Slope** (Dual-Level, Zeitfenster);
  **Level** (Rohvolt), **Position** (Pre/Post 0…100 %), **Holdoff**
  (~100 ns…10 s), **Sweep Auto/Normal/Single** (Single = `sweep=ONCE`),
  **Force-Trigger**, **Alternate-Trigger** (CH1/CH2).
- **Run/Stop**, **Autoset** (Auto-Range+Timebase), **Auto-Kalibrierung**.
- **MULTI/EXT-Port:** TTL-Ausgang (Pass/Fail-Out) und externer Trigger-In.
- **Datenpfade:** getriggerte Einzelbild-Frames bis 100 MS/s **oder**
  lückenfreies kontinuierliches Roll-Logging **bis ~100 kS/s** (`read_iter`).

### 3b) Rein Anzeige/Rechnung im Browser (auf schon gestreamten Samples) — MUSS
Diese Features brauchen **kein** Gerätekommando; sie laufen auf den 8-Bit/
5000-Punkt-Frames und sind daher voll offline/im Mock reproduzierbar. In
`OsziLogic` (DOM-frei, Node-testbar) rechnen, im Live-App rendern:

- **Alle Auto-Messungen** wie VDS1022: Periode, Frequenz, Ø(Mean), **Vpp**,
  Vmax, Vmin, **Vtop/Vbase/Vamp**, **Vrms**, Overshoot, Preshoot,
  **Anstiegs-/Abfallzeit**, **+Breite/−Breite**, **+Duty/−Duty**, **Delay/Phase
  CH1↔CH2**. Als antippbare Chips unter der Kurve; Mehrfachauswahl.
- **Cursor:** Zeit-Cursor (Δt, 1/Δt) und Spannungs-Cursor (ΔV), per Ziehen;
  FFT-Cursor (Frequenz/Amplitude) im Spektrum.
- **Mathe:** **CH1−CH2** (CAN-Differenz!), CH1+CH2, CH1×CH2 (Leistung),
  CH1/CH2, Invert je Kanal.
- **FFT-Spektrum** mit Fensterfunktionen **Rechteck/Hanning/Hamming/Blackman**,
  Skala **Vrms** oder **dBVrms**, Quellkanal wählbar, Split-View Zeit|Spektrum.
  (Auflösung durch 5000-Punkte-Frame begrenzt — im UI so kommunizieren.)
- **X-Y-Modus** (CH1 vs. CH2, Lissajous) für Phasen/Verhältnis.
- **Referenzkurve speichern/laden** (bereits via IndexedDB `oszi-live`/
  `aufnahmen` vorhanden — Referenz-Overlay + `normXCorr` + Toleranzband
  wiederverwenden/ausbauen), **Average(N)/Hi-Res** als Frame-Mittelung,
  **Nachleuchten/Persistence** (PHIST vorhanden, VDS-artig Off…Infinite +
  manuelles Clear ausbauen).
- **Protokoll-Decode I²C/UART/1-Wire** (host-seitig in der API vorhanden → nach
  JS portierbar; als Profi-Extra, deckt Bus-Karten ab).
- **Export:** PNG (Bild), **CSV** (Rohvolt, ≤20000 Zeilen), optional BMP;
  Setup-Export/Import (Instrumenteneinstellung als JSON).

### 3c) EHRLICHE GRENZEN — im UI klar kommunizieren, NIE vortäuschen — MUSS
V10 darf keine Hardware-Fähigkeit simulieren, die es nicht gibt. Diese Punkte
gehören als dezente Hinweise/Deaktivierungen ins UI (nicht verstecken):

- **Video-Trigger:** von der florentbr-API **nicht** unterstützt
  (`NotImplementedError`). → Nicht als Geräte-Trigger anbieten (KFZ irrelevant).
- **Bandbreitenbegrenzung (20 MHz):** API-Bits hart 0, nicht exponiert. → Nur
  als **Software-Tiefpass** auf Samples anbieten und so benennen („digital").
- **Speichertiefe:** **fix 5000 Punkte/Frame** — keine „Deep Memory". Zoom/
  Scroll nur innerhalb dieser 5000. FFT-Auflösung entsprechend begrenzt.
- **Vertikale Auflösung:** **8 Bit** — Average verbessert Rauschen, **nicht**
  die echten Bits (nur bei repetitivem/stabilem Signal).
- **Kein Hardware-Signalgenerator/AWG** (das VDS1022 hat keinen).
- **Refresh-Rate:** USB-RTT-begrenzt (Default ~3 Hz, praktisch ~1–30 Hz für
  getriggerte Frames). Kein Echt-Scope-Refresh. Kontinuierlich nur ≤~100 kS/s.
- **USB exklusiv:** Bridge und OWON-Java-App schließen sich aus (Singleton +
  `claim_interface`). Bridge muss Lock/Singleton + 3-s-Keepalive-Stop
  respektieren.

### 3d) Bedienung — werkstatttauglich (Touch statt Drehknopf) — MUSS
- Große **+/− Stepper** für V/div und t/div (rasten auf 1-2-5 bzw. die festen
  Stufen), **segmentierte** Kopplung AC/DC/GND, Tastkopf 1×/10×/…, Kanal
  CH1/CH2/Math/FFT als Tabs.
- **Trigger** als vertikaler Level-Slider mit Flanke auf/ab; Modus
  Auto/Normal/Single und **Run/Stop**, **Auto-Set** als große Buttons.
- **Trigger-Pegel bleibt Rohvolt** (Linie wird für Anzeige mittransformiert —
  bestehende Regel beibehalten).
- **Querformat-Empfehlung/Lock** für den Scope-Modus, Pinch-Zoom auf die Kurve,
  Dark-Default, hoher Kontrast (helle Werkstatt), alle Tap-Ziele ≥ 48 px.
- Canvas-rAF weiterhin **gated** auf sichtbare Live-Section (Akku/Performance).

### 3e) `bridge.py` — Ausbau — MUSS
- Kommandos erweitern: `coupling`, `probe`, `acqmode` (sample/peak/roll),
  `trigger` (type/source/level/pos/holdoff/sweep/width/slope), `force`,
  `autoset`, `calibrate`, `multi`. `SET`-Dict bleibt Wahrheitsquelle,
  `RATE_LADDER` ≥ 2000 Punkte/Fenster, reconnect-sicher.
- **Windows-USB-Workaround auf Backend-Ebene** beibehalten (libusb1/libusb0:
  `is_kernel_driver_active`→False, detach/attach→no-op), da `vds1022.py` das
  Backend direkt ruft.
- JSON-Frames, bei RTT > 100 ms Binärformat (`[b'OSZ1'][u32 len][JSON pad4]
  [Float32 LE]`) beibehalten.
- **Auto-Setup aus Karte** (`applyKartenSetup`, `parseSetup`) auf die neuen
  Felder (Kopplung/Tastkopf/Trigger-Typ) erweitern.

---

## 4) ZIEL B — „Alle Signalbilder nach Sensor" (Signal-Atlas)

Der Techniker denkt in **Fahrzeug-Bauteilen**, nicht in Elektrik-Kategorien.
V10 bekommt eine **sensor-erste Achse** plus einen dedizierten **Signal-Atlas**
— **additiv**, ohne die bestehende Bauart-Filterung zu ersetzen.

> **Zeilennummern unten stammen aus der Git-Linie (Prä-Live) und sind nur
> Orientierung.** In der zusammengeführten v10-Baseline die Hooks per Grep neu
> lokalisieren (`cardGroup`, `grpBadge`, `buildIndex`, `applyPage`, `cardMatch`,
> `specToHtml`/Renderpfad).

### 4a) Datenmodell & Gruppierung (additiv, bricht nichts) — MUSS
- **Optionales Feld `c.sys`** pro Karte (z. B. `sys:'drehzahl-position'`).
  Karten müssen **nicht** alle sofort editiert werden — Fallback leitet aus
  `id`/`kat` ab. Schema-Feldreihenfolge sonst unverändert; `W()`/`.spec`
  unberührt.
- **Neue Funktion `sysGroup(c)`** analog `cardGroup(c)`: gibt `c.sys` zurück
  oder leitet per `id`/`kat`-Muster ab. **`cardGroup()` bleibt unverändert** →
  `grpBadge()`, kat-Filter und die Bauart-Chips laufen weiter.
- **`SYSLBL`** (analog `GRPLBL`): Klartext-Name + Badge-Klasse je sysGroup.
- **Zweite Filter-Achse** ohne Bruch: Umschalter **„Gruppieren nach: Bauart |
  System"**, der im System-Modus in `cardMatch` gegen `sysGroup(c)` prüft
  (`if(state.sys && sysGroup(c)!==state.sys) return false;`). Generische
  Filter-Init-Mechanik wiederverwenden (`['fSys','sys']`).
- **`buildIndex()`** um `SYSLBL[sysGroup(c)]` + Synonyme (Drehzahl, Ladedruck/
  Boost, Kühlmittel …) erweitern — Suchlogik selbst bleibt unverändert.

### 4b) Sensor-erste Taxonomie (11 Systemgruppen der 37 vorhandenen Karten)
```
drehzahl-position  Drehzahl & Lage:      kw-ind, kw-hall, kwnw-sync,
                                          raddreh-pass, raddreh-akt, pos-sensor, edk
luft-ladung        Luft & Ladedruck:     lmm-ana, map
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
Eigene Seite (`data-nav "Signal-Atlas"`), Einstieg **vor** den ausführlichen
Messkarten. Rendert **ausschließlich** über die vorhandenen `c.gut`/`c.schlecht`
(W()-Ergebnisse) bzw. im Live-Modus `W(clone(karte.gut[0].spec))` — nie über
vor-serialisierte HTML-Strings (keine Datendopplung, voll offline).

- **Ebene 1:** große System-Kacheln (11 Gruppen, handschuhtauglich).
- **Ebene 2:** Sensor-Kacheln der Gruppe, je mit Mini-Thumbnail des GUT-Signals.
- **Ebene 3 (Kern):** Sensor-Detail als Galerie — **GUT-Referenz groß oben**
  (`c.gut[0]`), darunter die typischen **FEHLER-Kurven** aus `c.schlecht[]`
  (horizontal wischbar / gestapelt), je mit rotem FEHLER-Badge, Kurz-Titel und
  vorhandenem Warum-Text (`spec.why`). Handy: Segmented-Toggle „Gut | Fehler";
  Querformat: Split-View nebeneinander.
- **Cross-Links** auf passende generische **FEHLERDB**-Muster (unterbrechung,
  ks-masse, rauschen, windungsschluss …) — über optionales Feld
  `c.fehler:[<FEHLERDB-id>,…]` je Karte, sonst sig-basierte Heuristik.
- **Setup-Kurzzeile** (Kanal/Kopplung/V-div/t-div/Trigger aus `c.setup`) +
  Sprung zur Vollkarte (`go('pg-karten',{card:c.id})`).
- **Deep-Link je Sensor** (`#pg-atlas~c-<id>`) → QR-Codes am Werkzeugwagen/
  Messgerät führen direkt aufs Bild. Bestehende Hash-Syntax wiederverwenden.
- **Integration mit Ziel A:** Aus jedem Atlas-Signalbild heraus **„live
  durchsteuern"** — die Scope-Steuerung (§3) übernimmt die Startparameter aus
  `karte.gut[0].spec`. Gemeinsame Helferfunktion `sigFigures(c, side)` kapselt
  den Renderpfad (genutzt von Kartenkörper UND Atlas), damit `W()`-Aufrufe nicht
  dupliziert werden.

### 4d) `spec`-Startwerte für VDS1022-Umfang additiv ergänzen — MUSS
`coupling` (`AC`/`DC`/`GND`), `probe` (`1:1`/`10:1`/…), `position`/`offset` je
Kanal, `holdoff`, Trigger-Typ. `vdiv`/`tdiv`/`trig`/`yr` sind vorhanden. **`W()`
ignoriert unbekannte spec-Felder → voll abwärtskompatibel, keine Karte bricht.**

### 4e) Vollständigkeit nach Sensor — Coverage-Lücken (priorisiert) — SOLL
„Alle Signalbilder nach Sensor" heißt auch **Abdeckung**. Nach Freigabe des
Eigentümers als neue Karten ergänzen (je mit GUT+FEHLER-Signalbild, Fachwerte
belegt nach Regel F). Priorität nach Werkstattrelevanz:

1. **Nockenwellensensor** eigenständig (aktuell nur `kwnw-sync`).
2. **Ladedrucksensor (Boost)** getrennt vom MAP; **Ladelufttemperatur (LLT)**;
   Ansauglufttemperatur getrennt von `ntc`.
3. **Fahrpedalgeber** (2-kanalig redundant) statt generischem `pos-sensor`.
4. **SENT/PSI5** (moderne digitale Sensorprotokolle, oszi-relevant; SAE J2716).
5. **Abgasnachbehandlung Diesel:** NOx-Sensor, Abgasgegendruck, Ruß-/
   Partikelsensor; AdBlue Füllstand/Temp/Qualität.
6. **Kraftstoff-Niederdrucksensor** (Vorförderdruck) neben `raildruck`.
7. **ESP/Fahrdynamik:** Lenkwinkel-, Gierraten-/Querbeschleunigungs-,
   Bremsdrucksensor.
8. **Getriebe (AT/DSG):** Drehzahlsensoren, Wählhebel/Position, Öldruck/-temp.
9. **Batteriesensor (IBS)** eigenständig; **Sensor-5-V-Referenz** als Prüfpunkt.
10. **Weitere Busse:** FlexRay, Automotive Ethernet (100BASE-T1/BroadR-Reach).
11. **HV/E-Antrieb** (eigener, klar gekennzeichneter Sicherheitsbereich):
    Resolver/Rotorlage, 3-Phasen-Motorstrom, HV-Strom/-Spannung,
    Isolationswächter, Zellspannungen/Balancing, DC-DC-Ripple.
12. Klima (Kältemitteldruck), Regen-/Licht-/Ultraschall-Parksensoren,
    Ionenstrom/Brennraumdruck.

> Coverage ist bewusst **SOLL/gestaffelt** — erst A+B (MUSS) sauber liefern,
> Karten dann in Wellen nachziehen, jede mit Test-/Validate-Durchlauf.

---

## 5) ZIEL C — Was V10 „unverzichtbar" macht — MUSS/SOLL

- **Handy-Auto-Update (MUSS):** Cloudflare-/GitHub-Auto-Deploy aus Schritt 0
  aktiv; Push auf den Branch → deploy → PWA zieht neue Version (Update-Banner-
  Flow nach v9-Regel). Damit hat der Techniker das Tool immer aktuell am Handy,
  ohne ZIP-Gefummel.
- **Offline zu 100 % (MUSS):** Atlas, alle Signalbilder, Glossar, Prüfpläne,
  FEHLERDB, Scope-Mock funktionieren ohne Netz. SW-Precache vollständig.
- **QR-Deep-Links (SOLL):** pro Sensor (`#pg-atlas~c-<id>`) — Aufkleber am
  Werkzeugwagen/Adapter führen in 0 Taps aufs richtige Signalbild.
- **Sporadik-Jagd (SOLL, passt zu Roys Fokus):** Single-Shot,
  Nachleuchten/Infinite-Persistence, Min/Max-Erfassung, Peak-Detect,
  Rüttel-/Record-Modus (Roll-Logging ≤100 kS/s) prominent und schnell
  erreichbar — genau für komplizierte/sporadische Fehler.
- **Auto-Setup aus Karte (MUSS):** aus jedem Atlas-/Karten-Signalbild heraus die
  Scope-Startparameter setzen (Kopplung/V-div/t-div/Trigger) → Techniker klemmt
  an, App steht richtig.

---

## 6) Umsetzungs-Pipeline & Abnahmekriterien (Definition of Done)

Arbeite iterativ (Schritt 0 → A → B → C), nach **jeder** Änderung validieren.

**Edit-Pipeline (Pflicht):**
1. Edits mit exakten Anchors + Trefferzählung (`c==1`), Kartentrenner `}\n\n,\n{\n`.
2. **`node --check`** auf **jeden** Script-Block (per Regex extrahiert;
   Schreiben und Prüfen **getrennt**), auf die Live-Logik und `bridge.py`
   (`python -m py_compile bridge.py`).
3. **Tests:** `node tests/live-logic.test.js` — bestehende Tests grün **und**
   neue Tests für die neuen `OsziLogic`-Funktionen ergänzen (FFT-Peak, Cursor-
   Δt/ΔV, +/−Breite, Duty, Rise/Fall, Phase CH1↔CH2, Slope/Pulse-Trigger-
   Logik, Average). Ziel: Testzahl steigt sichtbar über 23.
4. **Headless-Validierung:** `node tools/validate.js` (Playwright,
   `window.validateKompendium()`) grün — Karten/Fehlerbilder/Glossar ohne
   Struktur-/Laufzeitfehler; `renderAtlas()` und der Scope-Modus dürfen keine
   Console-Errors werfen.

**Regressions-Greps (müssen passen):**
```
grep -c "KFZ-OSZI-RS-803792F7BB4A6C59" index.html   # == 4 (Signatur)
grep -c "Lücke: 2 Zähne fehlen" index.html           # ind-Fix erhalten
grep -c "0,2–1 Ω je nach Hersteller" index.html      # CR-Fix erhalten
grep -c "nominal ±~2 V" index.html                   # FlexRay-Fix erhalten
grep -c "i0000000000000i" index.html                 # LIN 13-Bit-Break erhalten
grep -c 'id:"lmm-dig"' index.html                    # v9-Karte vorhanden (nach Merge)
grep -c 'id="oszi-live-logic"' index.html            # Live-Logik-Block vorhanden
grep -c 'id="oszi-live-app"' index.html              # Live-App-Block vorhanden
grep -c "function sysGroup" index.html               # NEU: Sensor-Gruppierung
grep -c "pg-atlas" index.html                        # NEU: Signal-Atlas-Seite
grep -oE "Stand v[0-9]+" index.html | head -1        # == "Stand v10"
grep -o "kfz[a-z-]*v10[a-z0-9-]*" sw.js              # SW-Cache auf v10 gebumpt
```

**Feature-Abnahme:**
- **A:** Scope-Panel bietet 3a vollständig (Kopplung/Tastkopf/Acq/voller
  Trigger/Autoset/Cal/MULTI); 3b vollständig (alle Auto-Messungen, Cursor,
  Mathe inkl. CH1−CH2, FFT mit 4 Fenstern, X-Y, Referenz, Persistence, Decode,
  Export); 3c-Grenzen im UI ehrlich abgebildet (Video-Trigger nicht als HW,
  BW-Limit als „digital", 8 Bit/5000-Punkte-Hinweise). Mock/Demo deckt alles
  ohne Hardware ab.
- **B:** Umschalter Bauart|System funktioniert; `pg-atlas` mit 2-Tap-Navigation
  (System→Sensor→Kurve), GUT+FEHLER-Galerie, FEHLERDB-Cross-Links, Deep-Links;
  keine Datendopplung (nur `W()`-Renderpfad); bestehende Messkartenseite +
  kat-Chips unverändert nutzbar.
- **C:** Auto-Deploy greift; App offline vollständig; Update-Banner-Flow nach
  v9-Regel; Auto-Setup aus Atlas/Karte setzt die Scope-Parameter.

**Auslieferung:** `rm -rf __pycache__`, dann `kfz-oszi-pwa-live-v10.zip`.
Versionshistorie-Tabelle in der Projektdoku um die v10-Zeile ergänzen.

---

## 7) Was NICHT tun (Fallen)

- Nicht `W()` zu reinem String machen / Signalbilder zu HTML einfrieren → bricht
  Live-Kopplung.
- `cardGroup()` **nicht** umschreiben → additiv `sysGroup()` daneben.
- Keine Hardware-Fähigkeit vortäuschen (Video-Trigger als HW, „Deep Memory",
  >8 Bit, Echt-Scope-Refresh, AWG). Grenzen aus §3c sind bindend.
- `skipWaiting` **nicht** im install-Event (v9-Update-Regel).
- Nicht von altem ZIP starten; nicht ohne SW-/Footer-Bump releasen; `__pycache__`
  nicht mit ausliefern.
- Fachwerte nie als absolut ausgeben — immer „typ./~/herstellerabhängig",
  Richtungslogiken als typabhängig kennzeichnen.
- `node --check` und Datei-Schreiben **nie** per `&&`/`or` verketten (bekannter
  Eigen-Bug).
```
```
