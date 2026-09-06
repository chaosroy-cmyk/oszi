# CHANGELOG v8.19-Profi — Das Glossar ist erreichbar und typgebunden

## Befund 1 · Das Glossar war von der Suche nicht erreichbar

Runde 11 (v8.14) hatte den Suchindex auf die gesamten Karteninhalte erweitert.
Das **Glossar** blieb dabei außen vor: Es lebt in einem eigenen Overlay
(`openGloss`) und wurde von `filterTests` nie berührt.

Folge: Begriffe, die die App **erklärt**, lieferten null Treffer.

| Suchbegriff | steht in | Treffer alt | neu |
|---|---|---|---|
| `True-RMS` | Glossar | 0 | 1 Glossartreffer |
| `CAT-Messkategorie` | Glossar | 0 | 1 Glossartreffer |

Genau derselbe Fehlertyp wie in Runde 11, eine Ebene tiefer: Der Inhalt ist da,
die Arbeit steckt drin, und der Anwender findet ihn nicht.

**Änderung:** Bei aktiver Suche werden Glossartreffer direkt im Suchergebnis
gezeigt — mit derselben aufklappbaren Auszeichnung wie in der Glossaransicht,
also ohne Umweg über ein zweites Overlay. Findet die Suche **keine** Karte, aber
einen Glossarbegriff, sagt die Leermeldung das ausdrücklich: „Keine Prüfung
gefunden – aber das Glossar kennt den Begriff."

Ohne Suchbegriff wird **kein** Glossarblock angehängt — die Startansicht bleibt
unverändert schlank. Der Validator prüft beide Richtungen.

## Befund 2 · `KTY`-Glossareintrag verallgemeinerte einen Reihenwert

Der Eintrag lautete: „Silizium-PTC-Temperatursensor (**~1000 Ω bei 25 °C**)".

Dieser Nennwert gehört zur **Reihe**, nicht zum Namen:

- **KTY81-1xx** → ~1000 Ω bei 25 °C
- **KTY81-2xx** → ~2000 Ω bei 25 °C

Das Glossar war damit für die halbe KTY81-Familie um den Faktor zwei daneben —
und widersprach zwei Stellen im eigenen Projekt: Die Karte `ptc-sensor` bindet
korrekt an „KTY81-1xx", und `SOURCES.md` schreibt ausdrücklich „Nur die konkrete
KTY81-Type, nicht auf beliebige Kfz-PTC übertragen".

**Änderung:** Der Eintrag nennt beide Reihen mit ihren Nennwerten und stellt
klar: „Ohne die konkrete Type ist kein Sollwert ableitbar."

## Regression

`validate.js` Abschnitt 36, 11 Prüfungen (207 → 218):

- Vier Begriffe, die **nur** im Glossar stehen, müssen es über die Suche
  erreichen.
- Ohne Suchbegriff kein Glossarblock; Unsinnsbegriff weder Karten noch Glossar.
- Bei null Kartentreffern muss die Leermeldung auf das Glossar hinweisen.
- Der KTY-Eintrag muss beide Reihen nennen und die Typbindung aussprechen.
- Glossar und Karte `ptc-sensor` müssen dieselbe Reihe nennen — Widerspruchsfreiheit.

## Fachlich geprüft, ohne Befund

Alle 53 Glossareinträge durchgesehen. Stichhaltig unter anderem:

- **PT200/PT1000** — „200 bzw. 1000 Ω bei 0 °C, ca. +0,39 %/°C" deckt sich mit
  IEC 60751 (A = 3,9083 × 10⁻³ /°C).
- **Flussspannung** — „Si 0,4–0,8 V, LED 1,5–3 V" identisch mit der Karte
  `diodentest`.
- **Watt** — `P = U × I`; **Sicherungs-Innenwiderstand** — `I = U / R`.
- **Open Collector** — „Ausgang schaltet nur nach Masse, braucht Pull-up":
  deckt sich mit der in Runde 6 korrigierten Karte `hall`.
- **V⎓ / V~**, **CAT-Messkategorie**, **True-RMS**, **Autorange**,
  **MIN/MAX**, **Polyfuse**: sachlich korrekt.
