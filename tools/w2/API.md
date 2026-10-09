# Autoren-Kit: Signalbilder W2 für das KFZ-Oszilloskop-Kompendium

Du erstellst für eine oder mehrere Messkarten neue, **physikalisch korrekte** Signalbilder:
mehrere **Zustände** (GUT) und mehrere **Fehlerbilder** (FEHLER). Die App ist eine deutschsprachige
Werkstatt-PWA für Kfz-Techniker. Das Zielgerät ist ein OWON VDS1022I.

## 0. Oberste Regel: nichts erfinden

- **Jede konkrete Zahl** in `title`, `caption`, `why`, `notes`, `meas` (Spannung, Frequenz, Zeit, Druck,
  Temperatur, Tastgrad, Drehzahlbezug) muss
  - entweder durch eine **Quelle** in `QUELLEN["<id>"]` belegt sein (URL + was sie belegt),
  - oder **aus dem Modell nachgemessen** werden: als `expect`-Eintrag am Bild **und** passend zum Text.
- Physikalische Zusammenhänge (z. B. „60-2-Rad: Zahnfrequenz in Hz = Drehzahl in 1/min") dürfen
  ohne Quelle stehen, wenn sie direkt aus der Geometrie oder Physik folgen. Dann gehört ein Satz dazu ins `why`.
- **Gute Quellen:** Pico Technology (picoauto.com: Guided Tests, Waveform Library), Bosch-Datenblätter und
  Bosch Kraftfahrtechnisches Taschenbuch, Hella TechWorld, Herstellerunterlagen, SAE/ISO-Normen
  (z. B. SAE J2716 für SENT), Fachschulungsunterlagen. Foren nur als Zusatz, nie als einzige Quelle.
- Findest du keinen belegten Wert, dann: **Bereich mit „typ." und „herstellerabhängig"** angeben, den Bereich
  konservativ halten und die Unsicherheit im Bericht nennen. Lieber weniger Zahlen als eine falsche.
- Zahlenwerte im Text immer mit **„typ.", „~" oder „herstellerabhängig"** qualifizieren.
  Richtungslogiken (NTC/PTC, steigend/fallend) ausdrücklich als typabhängig kennzeichnen.
- **Sicherheitsdoktrin der App:** Nie an Airbag-/Rückhalte-/Pyrotechnik-Kreisen (inkl. PSI5) messen.
  Hochvolt nur mit Qualifikation. Das nie unterlaufen.
- Bestehende Kartentexte (aufgabe, setup, ursachen …) **nicht ändern**. Findest du dort einen Fachfehler,
  melde ihn im Bericht (Feld `textFehler`).

## 1. Dateiformat (eine Datei je Gruppe, Pfad wird vorgegeben)

```js
/* @models */
SIG.M.kwInd = function (p) { /* … */ return function (t) { /* … */ }; };
/* @end-models */

/* @quellen */
QUELLEN["kw-ind"] = [
  "Pico Technology – Crankshaft sensor (inductive), Guided Test: https://www.picoauto.com/… – belegt: Leerlauf-Amplitude typ. …",
  "…"
];
/* @end-quellen */

CARDPATCH["kw-ind"] = {
gut:[
  W2({ … }),
  W2({ … })
],
schlecht:[
  W2({ … })
]};
```
- Die Marker `/* @models */ … /* @end-models */` und `/* @quellen */ … /* @end-quellen */` sind Pflicht
  (je einmal pro Datei). Sie werden maschinell in die App übernommen.
- **Modellnamen** beginnen mit der Karten-ID in camelCase (`kw-ind` → `kwInd…`, `lam-lsu` → `lamLsu…`).
  So gibt es keine Kollisionen zwischen Gruppen.
- Nur ES5-Syntax: `var`, `function`. Keine Pfeilfunktionen, kein `let`/`const`, keine Template-Strings.
  Die Dateien laufen im Browser **und** im Node-Test.

## 2. Signalmodelle (`SIG.M`)

`SIG.M.name = function (p) { … return function (t) { return Wert; }; }`
- `t` ist **echte Zeit in Sekunden** ab Bildbeginn. Der Rückgabewert ist in V (bzw. A bei Strom).
- **Rein und deterministisch:** gleiche Zeit ergibt immer den gleichen Wert. Rauschen nur über
  `SIG.lib.vnoise(seed, amp, dt)` (reine Funktion der Zeit). Kein `Math.random()`.
- **Standardparameter müssen gültig sein:** `SIG.M.name({})` muss ein sinnvolles GUT-Signal liefern
  (der Node-Test ruft jedes Modell mit `{}` auf).
- Zustände und Fehler über **Parameter** abbilden: z. B. `{rpm:800}`, `{rpm:250}`, `{gain:0.3}`, `{fault:'open'}`.
  So bleiben Gutbild und Fehlerbild physikalisch konsistent, und das Sollbild (ghost) ist dasselbe Modell
  mit GUT-Parametern.
- Bausteine in `SIG.lib`:
  - `vnoise(seed, amp, dt)`: bandbegrenztes Rauschen, Spitzenwert ~amp
  - `lagSeries([[t, ziel, tau], …], T)`: Verzögerung 1. Ordnung (Druckaufbau, Sensorträgheit), liefert Ereignis-Signal
  - `sqw(t, f, duty, hi, lo, rise, ph)`: Rechteck mit endlicher Flanke
  - `ring(dtSeitEreignis, amp, f0, tau)`: gedämpftes Nachschwingen
  - `smooth(x)`: weicher Übergang 0..1
- Für einmalige Vorgänge (Gasstoß, Startvorgang) `lagSeries` nutzen. Die Funktion bekommt `f.event = true`;
  das setzt `lagSeries` selbst.
- Pro Rechnung realistische Ursachen nachbilden: Drehzahl → Frequenz, Luftspalt → Amplitude,
  Pulsation je Ansaugtakt (4-Zyl.: 2 Takte pro Kurbelumdrehung), Sensorträgheit, Übergangswiderstand → Pegelversatz usw.

## 3. Bild-Spezifikation `W2({ … })`

| Feld | Bedeutung |
|---|---|
| `badge` | `"GUT"` oder `"FEHLER"` |
| `title` | Kurztitel im Bild, z. B. `"Leerlauf 800 /min"`, `"Luftspalt zu groß"` |
| `cond` | Betriebszustand in der Statuszeile, z. B. `"Motor warm, Leerlauf"` |
| `tdiv` | Zeit pro Kästchen in **Sekunden** (Fenster = 10 × tdiv). Gängige Oszi-Stufen 1-2-5 verwenden. |
| `vdiv` | V (bzw. A) pro Kästchen, Stufen 1-2-5 |
| `off` | vertikale Lage in Kästchen: Wert v liegt bei `v/vdiv + off` Kästchen über der Mitte. `off:-3` legt 0 V eine Teilung über den unteren Rand. |
| `unit` | `"V"` (Standard) oder `"A"` |
| `ch` | Kanäle: `[{m:"modellName", p:{…}, lbl:"KW"}, {m:…, p:…, vdiv:…, off:…}]` (max. 2). CH2 darf eigene `vdiv`/`off` haben. |
| `ghost` | Sollbild (grau gestrichelt): `[{m:"modellName", p:{GUT-Parameter}}]`. **Pflicht bei FEHLER.** Optional `ch:1` für CH2-Skala. |
| `trig` | Triggermarke: `{t: s, v: Pegel, ch:0}` |
| `meas` | Messwert-Hinweise (siehe unten) |
| `notes` | Markierungen: `[{t: s, v: Wert, txt:"…", dx, dy, anchor, ch}]`. Kreis am Punkt, Label versetzt; ab \|dy\| > 30 px mit Hinweislinie. |
| `expect` | **Prüfwerte**, werden nachgemessen (siehe unten). Nicht gezeichnet. |
| `caption` | Bildunterschrift (1–2 Sätze, Werkstattsprache) |
| `why` | Physikalische Begründung („Warum …") |
| `clip` | `true`, wenn Abschneiden gewollt ist (z. B. Zündspitze). Dann Begründung in `why`. |
| `noGhost` | Text mit Begründung, falls ein Fehlerbild ausnahmsweise kein Sollbild braucht |
| `os` | Überabtastung je Pixelspalte (Standard 4; bei sehr schnellen Anteilen erhöhen) |

**meas** (Werte werden aus dem Signal berechnet, nicht getippt):
- `{t:"vpp", ch:0, x:0.96, pre:"…"}`: Spitze-Spitze-Klammer an Position x (0…1). Der Wert wird gemessen.
- `{t:"span", t0, t1, v, ch, pre, post, txt}`: Zeitpfeil. Ohne `txt` wird **Δt automatisch** aus t1−t0 eingesetzt.
  Mit `pre`/`post` ergänzen, z. B. `pre:"1 Umdrehung ="`, `post:"→ 800 /min"`. Die Aussage im `post` mit `expect` absichern.
- `{t:"level", v, t0, t1, ch, pre, post, txt, dy}`: gestrichelte Pegellinie. Ohne `txt` wird „≈ Wert" aus v gesetzt.

**expect** (Pflicht für jede Zahl, die nicht durch eine Quelle gedeckt ist):
`[{what:"freq"|"period"|"mean"|"rms"|"max"|"min"|"vpp"|"duty"|"rise"|"fall", ch:0, v:Soll, tolRel:0.03 | tol:abs, t0, t1, src:"kurz woher"}]`
oder Bereich: `{what:"mean", min:1.0, max:1.5}`. Mit `t0`/`t1` wird nur ein Zeitausschnitt gemessen.

**Skala-Regeln**
- Das Signal muss ins Bild passen (Prüfung: höchstens 2 % abgeschnitten, außer `clip:true`).
  Gut nutzen: Signal über etwa 50–80 % der Höhe.
- `gut[0]` ist die **Live-Referenz** der Karte (Demo-Modus, Referenz-Overlay, Soll-Metriken). Sie zeigt den
  **typischen Normalzustand** der Messung, wie er im `setup.zustand` der Karte beschrieben ist (meist Leerlauf, warm).
  Die Live-Funktion rechnet mit dem Modell in echten Einheiten (V, s); die Bildskala ist deshalb frei.
  Wähle eine Skala, die am echten Oszi sinnvoll ist, möglichst **innerhalb der Bereiche aus `setup`**.
  Die t/div von `gut[0]` darf nicht mehr als Faktor 10 von der ersten t/div-Angabe im Setup abweichen.
- Bei Strommessung (Zange) ist die Einheit A; dann gilt die V/div-Regel nicht.

## 4. Was gute Karten enthalten

- **GUT: 3–6 Zustände**, je nach Sensor z. B. Zündung ein / Start / Leerlauf / erhöhte Drehzahl / Gasstoß /
  Schub / kalt / warm / Zoom auf ein Detail (Zahnlücke, Flanke, Pulsation).
- **FEHLER: 4–8 Fehlerbilder**, realistisch und unterscheidbar, z. B. Unterbrechung, Kurzschluss gegen Masse
  oder Plus, Übergangswiderstand, Masseversatz, Wackelkontakt (sporadischer Einbruch), Einstreuung/EMV,
  Schirm defekt, Sensor verschmutzt oder träge, Drift/Offset, mechanischer Schaden (Zahn, Geberrad),
  falsche Zuordnung (KW/NW), Versorgung fehlt. **Jedes mit Sollbild (ghost)** und einer `why`, die erklärt,
  woran man den Fehler im Bild erkennt und wie man ihn vom ähnlichsten anderen Fehler unterscheidet.
- Pro Bild höchstens 3 Markierungen (notes + meas), damit es lesbar bleibt. Labels nicht über die Kurve legen,
  wenn es sich vermeiden lässt (dx/dy nutzen).
- Werkstattsprache, kurze Sätze, Deutsch mit Umlauten.

## 5. Prüfen (Pflicht, bis 0 Fehler)

```bash
# im Repo-Wurzelordner (Playwright nötig: npm i -D playwright; eigenes Chromium per CHROME_PATH)
node tools/w2/render-card.js <deine-datei.js> <ausgabeordner>
```
- Ausgabe: `report.json`, `<id>.png` (Kontaktbogen) und `<id>-G0.png`, `<id>-F0.png` … (Einzelbilder).
- **Sieh dir die Einzelbilder mit dem Read-Werkzeug an.** Prüfe: Sieht es aus wie am echten Oszi?
  Stimmen Pegel, Frequenz und Zeitverhältnisse? Ist der Fehler eindeutig erkennbar? Überdecken Labels die Kurve?
- Erst fertig, wenn das Werkzeug **0 Fehler** meldet und du die Bilder angesehen hast.
  Warnungen begründen oder beheben.
- Node-Syntax-Check: `node --check <deine-datei.js>`

## 6. Bericht (deine Antwort)

Gib zurück: Dateipfad, je Karte die Liste der Bilder (Tag, Titel, Kernaussage), die Quellen mit dem, was sie
belegen, Unsicherheiten (Werte ohne harte Quelle), gefundene Fachfehler im bestehenden Kartentext
(`textFehler`) und das Prüfergebnis (Fehler/Warnungen).

## 7. Neue Karte (NEUKARTE) – komplette Messkarte statt nur Bilder

Für Signale, die noch keine Karte haben, schreibst du das **ganze Kartenobjekt**. Statt `CARDPATCH` steht in
der Datei:

```js
NEUKARTE["klima-druck"] = {
id:"klima-druck", kat:"sensor", sig:"analog", diff:2, sys:"druck-fluid",
name:"Kältemitteldrucksensor Klimaanlage",
aufgabe:"…", signalart:"…", equip:"…", anschluss:"…", messpunkte:"…",
setup:{kanal:"CH1",kopp:"DC",tk:"1:1",vdiv:"1 V/div",tdiv:"500 ms/div, Roll",trig:"Auto",zustand:"…"},
vorgang:["…","…"],
gut:[ W2({ … }), … ],
schlecht:[ W2({ … }), … ],
ursachen:["…"], loesungen:["…"], gegen:"…", plaus:"…", dtc:"…", irrtuemer:["…"], tipps:["…"],
warn:"…", simpel:"…", profi:"…", check10:"…", wannschlecht:"…", wannok:"…", next:"…"
};
```

- **Erste Zeile** im Objekt: genau `id:"<id>", kat:"…", sig:"…", diff:N, sys:"…",` (eine Zeile, beginnt mit `id:`).
- **Alle 28 Felder sind Pflicht**, mit diesen Typen (wie bei jeder bestehenden Karte):
  - Text: `name aufgabe signalart equip anschluss messpunkte gegen plaus dtc warn simpel profi check10 wannschlecht wannok next`
  - Liste von Texten: `vorgang ursachen loesungen irrtuemer tipps`
  - `setup` mit `kanal kopp tk vdiv tdiv trig zustand`, außerdem `gut` und `schlecht` mit den W2-Bildern.
  - `diff` ist eine Zahl: 1 leicht, 2 mittel, 3 schwer.
- `kat` ∈ `sensor lambda aktor zuend einspr elektrik bus` · `sig` ∈ `induktiv digital analog pwm strom bus`
- `sys` (Atlas-Gruppe) ∈ `drehzahl-position luft-ladung temperatur druck-fluid verbrennung fahrwerk-komfort
  fuellstand lambda-abgas einspritzung zuendung stellglieder bordnetz-hochstrom bus-daten grundlagen`
- **Stil:** Lies zuerst die Karten `map`, `kw-hall` und `oeldruck` in `index.html` und schreib genauso:
  - kurze Werkstattsätze, Deutsch mit Umlauten, Dezimalkomma;
  - `simpel` für Einsteiger (bildhaft), `profi` für Fortgeschrittene;
  - `check10` als 10-Sekunden-Check mit Fragezeichen, endet mit „→ gut.“;
  - `next` als „Signal gut, … → …; Signal schlecht → …“.
- **Gleiche Belegpflicht wie bei den Bildern:** Jede Zahl im Kartentext (Pegel, Widerstand, Druck, Frequenz,
  Fehlercode) ist in `QUELLEN` belegt oder als „typ./herstellerabhängig“ gekennzeichnet.
  - Fehlercodes nur mit Quelle, sonst „herstellerabhängig (Herstellerdaten)“.
  - Pin-Nummern nur mit Quelle, sonst neutral („Signal, 5-V-Versorgung, Masse – laut Stromlaufplan“).
- **`setup` wird maschinell gelesen** („Karten-Setup übernehmen“):
  - `vdiv`: erste Zahl, bei einer Spanne der OBERE Wert.
  - `tdiv`: erste Zahl, bei einer Spanne der UNTERE Wert.
  - `trig`: Flanke aus ↑/↓, Pegel aus der ersten Zahl mit V.
  - Die zuerst gelesenen Werte müssen zum Normalbild `gut[0]` passen; das Werkzeug warnt sonst.
- **`warn`** nennt die echte Gefahr der Messung, z. B.:
  - Klimaanlage: Kältemittel unter Druck, Erfrierung;
  - Ultraschall/Keyless: nur mit passendem Aufnehmer, nichts an Airbag-Leitungen.
  
  Ohne besondere Gefahr steht dort ein knapper Standardhinweis (Backprobing statt Isolierung durchstechen).
- Das Werkzeug prüft das Schema mit (Fehler „Schema …“). Es schreibt außerdem `<id>-text.json` mit allen
  Kartentexten zum Gegenlesen.

## 8. Hinweise für Aktoren, Bordnetz und Bus

- **kat für neue Karten:** Einspritzung/Kraftstoff-Stellglieder `einspr`, Bordnetz/Versorgung/Strom `elektrik`,
  sonstige Stellglieder `aktor`, Bussysteme `bus`. Danach richten sich der Kartenlisten-Filter und das Badge.
- **Abläufe** (Start, Pedal, Gasstoß, Einschaltvorgang): im Modell `f.event = true` setzen. Die App erkennt Abläufe
  zwar auch selbst (nach dem Bildfenster konstant), die Kennung ist aber eindeutiger.
- **Induktive Abschaltspitzen, Hochspannung:** Spitzenwerte nur mit Quelle oder klar als Beispiel; `clip:true` nur
  mit Begründung im `why` (z. B. Spitze über dem Messbereich). Grenze des VDS1022I mit 10:1 beachten (~400 Vss);
  Zündung sekundär nur kapazitiv/mit Zündzange – nie direkt.
- **Strom:** Strombilder zeigen die Spannung der Stromzange; Einheit `A` (unit:"A") nur, wenn die Zangenumrechnung
  im Text steht (z. B. 100 mV/A). Der VDS1022I misst Strom nur über eine Zange mit Spannungsausgang (BNC).
- **Busse:** Bitzeiten, Pegel und Rahmenaufbau nach Norm belegen (z. B. ISO 11898 CAN, ISO 17987 LIN,
  ISO 17458 FlexRay, ISO 9141/14230 K-Leitung, SAE J2411, IEC 61851). Der VDS1022I dekodiert keine Protokolle:
  Karten zeigen Physik (Pegel, Flanken, Abschluss, Störungen) und Bitlängen per Cursor.
- **Hochvolt:** nur die 12-V- bzw. Niedervolt-Seite darstellen; jede Messung am HV-Kreis ausdrücklich ausschließen.
