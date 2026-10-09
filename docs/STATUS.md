# Projektstatus und Übergabe

Stand: Oktober 2026, Feature-Branch `claude/kfz-oszi-kompendium-vwhkd3` (main = V13, Stand 09.10.2026; nach main nur mit ausdrücklicher Erlaubnis).
Eine neue Sitzung beginnt mit: „Lies docs/STATUS.md und mach weiter.“

## Erledigt

| Version | Inhalt |
|---|---|
| V11 | Signalbild-Engine W2 (Modelle in echter Zeit, Achsen = Zeichnung, Bildprüfung `SIG.check`). 20 Sensor- und Lambdakarten umgebaut, 293 Bilder. 96 Korrekturen an Kartentexten. Signal-Katalog (146 Signale) in `docs/`. |
| V12 | 16 neue Sensorkarten, komplett mit Text, 210 Bilder. Kartenschema-Prüfung (28 Felder) in `validateKompendium`. Atlas-Gruppen „Fahrwerk, Komfort & Assistenz“ und „Füllstand & Medien“. Live-Demo erkennt Abläufe. |
| V13 (Schritt 2) | 2a: 18 Aktor-, Zündungs- und Buskarten auf W2 umgebaut (238 Bilder), 132 geprüfte Textkorrekturen. 2b: 18 neue Karten (213 Bilder) für Bordnetz (Ruhestrom, Spannungsfall, 5-V-Referenz, 48 V, DC/DC, Transienten, Lampen-PWM), Ventile (CR-DRV, ZME, Benzin-MSV, VVT, Klima, LPG, AdBlue) und Bus (FlexRay, K-Leitung, SW-CAN, Control Pilot). Kartenkategorien `einspr` und `elektrik`. Live-Demo: Abläufe über zwei Fenster, Tabellenmodelle in Schleife, Triggerpegel in A bei Stromkarten. |

Stand der App: 72 Karten, alle mit W2-Bildern (954 Bilder), keine alten Bilder mehr. 131 Signalmodelle.
Katalog: 18 oszirelevante Signale noch offen.

## Bekannte Grenzen und offene Kleinigkeiten

- Live-Demo (Mock): Signale mit sehr kurzen Pulsen bei langer Zeitbasis (Keyless, PDC, Ruhestrom-Pulse,
  K-Leitung bei 50 ms/div) werden zu grob abgetastet, die Übereinstimmung ist dort niedrig. Ruhestrom
  (20 s/div) liegt außerhalb der Live-Zeitbasis. Kein Kartenfehler.
- Erledigt (nach V13, Branch): setup.trig mit Richtung und Pegel bei lam-heiz, zuend-prim, zuend-sek,
  pwm-ventil, luefter-pwm, relais (aus den Modellen am Triggerpunkt bestimmt); gluehkerze setup nennt CH2;
  starter CH2-Belegung einheitlich beschrieben; zuend-prim profi nur noch BIAT-belegt.
- Noch ohne Beleg: „fett“ als Ursache tiefer/langer Brennlinie im Theorie-Kapitel (Zündung) und im Glossar
  „Brennlinie/Brennspannung“ – Quelle suchen oder streichen.
- Kleinbefunde der Nachprüfung 2b, bewusst offen (optional): adblue G4/F5 Dosierimpulse verschmelzen bei
  10 s/div; adblue F1/F3 Sollbild-Abgrenzung optisch schwach; sensor-ref F6 ohne Startvorgang; flexray F5
  Statuszeile „CH2 Math“ (Werkzeug); sw-can G1 Notizposition.

## Verfahren (bewährt)

1. Je Gruppe (2 Karten): Autor (Recherche mit WebFetch, Modelle, Bilder, bei neuen Karten der ganze Text) →
   unabhängiger Prüfer (Zweitquellen, jedes Bild ansehen) → Korrektur → Nachprüfung. Vorlagen:
   `tools/w2/workflow-sensorkarten.js` (CARDPATCH) bzw. das gleiche Schema mit NEUKARTE.
2. Prüfwerkzeug: `node tools/w2/render-card.js <datei.js> <ausgabe>` (Playwright; `CHROME_PATH` setzen) bis 0 Fehler.
3. Einbau: `node tools/w2/integrate.js index.html <dateien.js>` (idempotent; erste Karte einer neuen kat
   kommt hinter die verwandte kat, z. B. einspr/elektrik hinter aktor).
4. Bestätigte Textfehler: Patch-JSON prüfen/anwenden mit `node tools/w2/apply-patch.js <patch.json> [--check]`.
5. Prüfkette vor jedem Commit:
   - `node --check` auf alle 5 Script-Blöcke;
   - `node tests/live-logic.test.js` (39) und `node tests/signal-engine.test.js` (11);
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

- Restliche Signale, z. B. Strombild Saugrohr-Einspritzventil, Pumpe-Düse, Leerlaufsteller, Schrittmotor,
  Automatik-Magnetventile, Ionenstrom, CDI, CAN XL, Automotive Ethernet, J1850, MOST, Proximity Pilot.
  Hochvolt-Messungen und PSI5 (Airbag) bleiben ausgeschlossen.
- Fehlerbild-Datenbank (18 Einträge) und freistehende Erklärbilder (5-V-Referenz, Masse, FlexRay, SENT) auf W2.
- Live-Zeitbasis über 2 s/div hinaus (nur nach Hardwaretest mit dem VDS1022I).
