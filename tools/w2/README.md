# Kit für Signalbilder (Engine W2)

Seit V11 rechnet `index.html` Signalbilder aus **Signalmodellen in echter Zeit** (`SIG.M.<name>`).
V/div, t/div und Offset bestimmen Beschriftung und Zeichnung gemeinsam, deshalb passen Achsen und
Kurve immer zusammen. Dieselben Modelle liefern im Live-Modus Demo, Referenz-Overlay und Sollwerte.

## Dateien

| Datei | Zweck |
|---|---|
| `API.md` | Verbindliche Regeln für Autoren: Dateiformat, Modell-Stil, `expect`, Quellenpflicht, Anzahl Zustände und Fehlerbilder |
| `beispiel-karte.js` | Formatbeispiel (Zahlen darin ungeprüft) |
| `render-card.js` | Lädt die echte App, spielt eine Kartendatei ein und prüft jedes Bild (`SIG.check`: Clipping, Sollbild, Nachmessen der `expect`-Werte). Schreibt Kontaktbogen und Einzelbilder als PNG. Exit 1 bei Fehlern |
| `integrate.js` | Baut Kartendateien in `index.html` ein: Modelle und Quellen als markierter Block `@gruppe:<datei>`, `gut`/`schlecht` der Karte ersetzt. Idempotent |
| `apply-patch.js` | Prüft bzw. wendet Textkorrekturen an Kartentexten an. Jeder Ausschnitt muss genau einmal und außerhalb der Bilder vorkommen; geschützte Texte bleiben erhalten |
| `workflow-sensorkarten.js` | Agenten-Pipeline, mit der die 20 Sensor- und Lambdakarten in V11 entstanden sind: Autor → unabhängiger Prüfer → Korrektur → Nachprüfung, dazu der Signal-Katalog |

## Ablauf für eine neue Karte

1. Werte recherchieren und belegen (Pico, Bosch, Hella, Hersteller). Nichts erfinden: Jede Zahl im
   Bildtext steht in `QUELLEN["<id>"]` oder wird per `expect` nachgemessen.
2. Kartendatei nach `API.md` schreiben, dann `node tools/w2/render-card.js karte.js out/` ausführen,
   bis 0 Fehler gemeldet werden. **Jedes Einzelbild ansehen.**
3. Unabhängig prüfen lassen (Zweitquellen, Physik, Lesbarkeit), Befunde einarbeiten.
4. `node tools/w2/integrate.js index.html karte.js` und danach die Prüfkette: `node --check` je
   Script-Block, `node tests/live-logic.test.js`, `node tests/signal-engine.test.js`,
   `node tools/validate.js`.

Die `setup`-Felder einer Karte liest der Live-Modus maschinell aus („Karten-Setup übernehmen“):
- V/div: erste Zahl, bei einer Spanne der obere Wert.
- t/div: erste Zahl, bei einer Spanne der untere Wert.

Der Normalzustand (`gut[0]`) gehört deshalb an den Anfang.
