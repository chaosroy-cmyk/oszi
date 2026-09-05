# CHANGELOG v8.18-Profi — Eine Zeile, die die Karte selbst verwirft; und zwölf Spaltenköpfe

## Befund 1 · `zuendspule`: grünes Kriterium für eine Messung, die die Karte ablehnt

Die Richtwerttabelle führte:

> Primär-Ohm (falls messbar) — **< 1 Ω typ.** — grün

Dieselbe Karte sagt an **drei** anderen Stellen das Gegenteil:

- Anleitung Schritt 1: „Primärwiderstand ist bei integrierter Elektronik oft
  **nicht direkt messbar**."
- Tabellennotiz: „Moderne Stabzündspulen: Primär **kaum sinnvoll mit MM**."
- `quality`: „MM nur Primär-Grundprüfung."

Eine harte Schwelle als **Freigabekriterium** für eine Messung, die die Karte
selbst als meist untauglich beschreibt. Bei Stab- und COP-Spulen mit integrierter
Endstufe misst man ohnehin die Elektronik, nicht die Wicklung — und der
Messleitungswiderstand liegt bei Werten um 1 Ω in derselben Größenordnung wie
das Messobjekt.

**Änderung:** Die Zeile nennt jetzt die Bauartbedingung („nur bei Spulen OHNE
integrierte Endstufe"), bindet den Wert an den OEM-Sollwert, weist auf den
Messleitungswiderstand hin und ist von **grün auf gelb** gesetzt — sie ist keine
Freigabe. `mess`, `good` und `bad` tragen den Vorbehalt mit. Versorgung und Masse
bleiben als brauchbare Prüfung erhalten; der Validator prüft das gegen.

## Befund 2 · Zwölf Tabellen mit falschem oder fehlendem Spaltenkopf

**Sieben Tabellen rendern ein komplett leeres `<th>`** — `ntc-ats`, `lmm-d`,
`lambda-breit`, `klopf`, `agt`, `nox`, `tankgeber`. Die Zellen darunter tragen
„plausibel" beziehungsweise „auffällig" mit Ampelfarbe, die Spalte selbst hat
keinen Namen. Für einen Screenreader ist die Zuordnung damit bedeutungslos, und
alle übrigen rund sechzig Tabellen beschriften dieselbe Spalte.

**Fünf weitere sind falsch beschriftet:** `widerstand` und `durchgang` nannten
die Ampelspalte „Bedeutung", `injektor-diesel` und `ruhestrom-fuse` „Hinweis".

Bei **`sensor-masseversatz`** waren die Beschriftungen sogar **verschoben**:
Kopf `["Beobachtung","Bewertung","Hinweis"]`, während Spalte 2 den
Bewertungstext („plausibel", „Massepfad prüfen") und Spalte 3 die Ampel trug.
Jetzt `["Beobachtung","Einordnung","Bewertung"]`.

## Regression

`validate.js` Abschnitte 34 und 35, 8 Prüfungen (199 → 207):

- Keine grüne Richtwertzeile mit ungebundener Schwelle — projektweit.
- Keine Richtwerttabelle mit unbeschrifteter Spalte.
- **Kein gerendertes `<th>` ohne Text**, geprüft an allen 74 Detailansichten im
  DOM statt nur an den Daten.
- Jede Ampelspalte trägt eine Überschrift („Bewertung" oder „Prüfpriorität") —
  diese Prüfung war es, die die fünf falsch beschrifteten Tabellen zutage
  förderte, nachdem die sieben leeren bereits behoben waren.

## Ergebnislos geprüft

- **Zustandslogik:** Suche mit Regex-Sonderzeichen `( ) [ * + ? \ | .`,
  Umlauten, `Ω` und `→`; Kategorie kombiniert mit Suche; Merkliste anlegen,
  listen, entfernen; Overlay-Verschachtelung Detail → Baum → Detail;
  Einsteiger-Umschaltung bei offenem Detail; Rechner mit negativen, leeren,
  riesigen und textuellen Eingaben. **Keine Auffälligkeit, kein Laufzeitfehler.**
- **Struktur:** Alle 74 Karten führen sämtliche Pflichtfelder, alle haben
  vollständige `DEEP`-Daten (Anleitung ≥ 4 Schritte, Richtwerttabelle,
  Ursachen, Fehlersuchkette), keine leere Tabellenzelle, keine ungültige
  Ampelwertung.
- **Querabgleich der Zahlenwerte** über Kartengrenzen: Unterschiedliche Werte
  für „Heizung (Ohm, kalt)", „Spulen-Ohm" und „Ruhespannung" wurden geprüft und
  sind sachlich begründet — verschiedene Bauteile, verschiedene Sollwerte.
