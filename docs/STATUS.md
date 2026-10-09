# Projektstatus und Übergabe

Stand: Oktober 2026, Feature-Branch `claude/kfz-oszi-kompendium-vwhkd3` (main noch auf V10).
Eine neue Sitzung beginnt mit: „Lies docs/STATUS.md und mach weiter.“

## Erledigt

| Version | Inhalt |
|---|---|
| V11 | Signalbild-Engine W2 (Modelle in echter Zeit, Achsen = Zeichnung, Bildprüfung `SIG.check`). 20 Sensor- und Lambdakarten umgebaut, 293 Bilder. 96 Korrekturen an Kartentexten. Signal-Katalog (146 Signale) in `docs/`. |
| V12 | 16 neue Sensorkarten, komplett mit Text, 210 Bilder. Kartenschema-Prüfung (28 Felder) in `validateKompendium`. Atlas-Gruppen „Fahrwerk, Komfort & Assistenz“ und „Füllstand & Medien“. Live-Demo erkennt Abläufe. |
| Vorbereitung Schritt 2 | Kartenliste kennt `kat:"einspr"`/`"elektrik"`; `tools/w2/API.md` Abschnitt 8 (Aktoren, Bordnetz, Bus). |

Stand der App: 54 Karten, davon 36 mit W2-Bildern (503 Bilder). Die 18 Karten für Aktoren, Zündung und Bus haben
noch die alten Bilder (47).

## In Arbeit: Schritt 2

- **2a Umbau** (CARDPATCH, nur Bilder; Textfehler melden): inj-saug, inj-di, inj-cr-mag, inj-piezo, zuend-prim,
  zuend-sek, pwm-ventil, stellmotor, kraftstoffpumpe, gluehkerze, starter, generator-ripple, luefter-pwm, relais,
  can-hs, can-fd, lin, can-ls.
- **2b neue Karten** (NEUKARTE): ruhestrom, spannungsfall, sensor-ref, bordnetz-48v, cr-drv, cr-zme, hdp-msv, vvt,
  klima-ventil, dcdc-12v, flexray, k-leitung, cp-laden, sw-can, lpg-ventil, adblue, lampen-pwm, transienten.
  - kat: einspr (cr-drv, cr-zme, hdp-msv, lpg-ventil), elektrik (ruhestrom, spannungsfall, sensor-ref, bordnetz-48v,
    dcdc-12v, lampen-pwm, transienten), aktor (vvt, klima-ventil, adblue), bus (flexray, k-leitung, cp-laden, sw-can).
- Die Entwürfe der Agenten liegen nur im Arbeitsordner der laufenden Sitzung (nicht im Repo). Geht die Sitzung
  verloren, Schritt 2 mit demselben Verfahren neu starten.

## Verfahren (bewährt)

1. Je Gruppe (2 Karten): Autor (Recherche mit WebFetch, Modelle, Bilder, bei neuen Karten der ganze Text) →
   unabhängiger Prüfer (Zweitquellen, jedes Bild ansehen) → Korrektur → Nachprüfung. Vorlagen:
   `tools/w2/workflow-sensorkarten.js` (CARDPATCH) bzw. das gleiche Schema mit NEUKARTE.
2. Prüfwerkzeug: `node tools/w2/render-card.js <datei.js> <ausgabe>` (Playwright; `CHROME_PATH` setzen) bis 0 Fehler.
3. Einbau: `node tools/w2/integrate.js index.html <dateien.js>` (idempotent).
4. Bestätigte Textfehler: Patch-JSON prüfen/anwenden mit `node tools/w2/apply-patch.js <patch.json> [--check]`.
5. Prüfkette vor jedem Commit:
   - `node --check` auf alle 5 Script-Blöcke;
   - `node tests/live-logic.test.js` und `node tests/signal-engine.test.js`;
   - `node tools/validate.js` (0 Fehler);
   - Signatur `KFZ-OSZI-RS-803792F7BB4A6C59` genau 4×;
   - Regressionstexte je 1× („Lücke: 2 Zähne fehlen“, „0,2–1 Ω je nach Hersteller“, „nominal ±~2 V“,
     `id:"lmm-dig"`, `id="oszi-live-logic"`, `id="oszi-live-app"`);
   - Kontaktbögen selbst ansehen.
6. Release: `CACHE_NAME` in `service-worker.js` und Footer „Stand vN“ in `index.html` erhöhen, README und
   `docs/signal-katalog.json` (abgedecktDurch) pflegen, dann `node tools/w2/katalog-md.js`.

## Regeln

- Nichts erfinden: jede Zahl belegt (QUELLEN je Karte) oder per `expect` nachgemessen; sonst „typ./herstellerabhängig“.
- Nie an Airbag-, PSI5- oder Pyrotechnik-Kreisen messen. Hochvolt nur Niedervolt-Seite, mit Qualifikationshinweis.
- Signatur nicht verändern. Keine Tokens/Secrets. Nicht nach main pushen ohne ausdrückliche Erlaubnis.
- Commits: Autor Roy Sperlich, deutschsprachige Meldungen.

## Danach (laut Katalog offen)

- Restliche Signale niedriger Priorität, z. B. Leerlaufsteller, Automatik-Magnetventile, Pumpe-Düse,
  10BASE-T1S, J1850. Hochvolt-Messungen bleiben ausgeschlossen.
- Fehlerbild-Datenbank (18 Einträge) und freistehende Erklärbilder (5-V-Referenz, Masse, FlexRay, SENT) auf W2.
- Live-Zeitbasis über 2 s/div hinaus (nur nach Hardwaretest mit dem VDS1022I).
