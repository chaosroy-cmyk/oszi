# SOURCES.md — verwendete Primär- und Herstellerquellen

Stand: v8.1-Profi. Diese Liste enthält **nur Quellen, die tatsächlich für
Zahlenwerte oder normative Aussagen in der App herangezogen wurden.**
Werte ohne belastbare Quelle sind in der App nicht als Gut-/Schlecht-Grenze
hinterlegt, sondern als „nach OEM-/Bauteilvorgabe prüfen" formuliert.

## Belegte Zahlenwerte

| Wert in der App | Quelle | Revision | Verwendung |
|---|---|---|---|
| Kalt-Innenwiderstände Flachsicherungen ATOF/Standard (3–40 A) | Littelfuse ATOF® Series 287, Blade Fuses Rated 32 V, Spalte „Typ. Cold Resistance (mΩ)" | Rev. 02/04/2025 | `FUSE_TYPES.atof` im mV-Drop-Rechner |
| Kalt-Innenwiderstände MINI (2–30 A) | Littelfuse MINI® Series 297, Rated 32 V | Datenblatt 2023 | `FUSE_TYPES.mini` |
| Kalt-Innenwiderstände MAXI (20–80 A) | Littelfuse MAXI® Series 299, Rated 32 V | Rev. 01/06/2025 | `FUSE_TYPES.maxi` |
| Platin-Kennlinie PT200/PT1000 | IEC 60751 (Platin-Widerstandsthermometer), ca. +0,39 %/°C bezogen auf den 0-°C-Wert | IEC 60751 | Karte `ptc-sensor` |
| KTY81-Richtwerte (~1000 Ω bei 25 °C) | NXP KTY81-Serie Datenblatt | Rev. 05 | Karte `ptc-sensor` |
| Toleranzbeispiele Sensorreferenz (4,75–5,25 V bzw. 4,7–5,3 V) | Ford Diagnostic Strategy DOBDSM1701 (als **Beispiel** für herstellerspezifische Bandbreiten) | — | ausschließlich als gekennzeichnetes Beispiel, **nicht** als Entscheidungsgrenze |
| Sensorbereichsabhängigkeit MAP (1 bar vs. 2,5/3 bar) | Bosch Pressure Sensor PS-AA Datenblatt | — | Karte `map` – begründet den Verzicht auf einen universellen Spannungswert |
| Intelligentes Lademanagement, variable Ladespannung | HELLA Techworld, „Checking an alternator regulator" | — | Karten `generator`, `generator-lin-bsd`, Diagnosebaum |
| Batteriesicherheit (Knallgas, Säure, Kurzschluss) | GS Yuasa, Battery Health and Safety | — | `danger`-Warnung Karte `batterie` |
| Common-Rail-Hochdruck, Injektionsverletzung | DENSO Aftermarket, Common-Rail-Diagnose | — | `danger`-Warnung Karte `raildruck` |
| Mindestgröße Bedienelemente 44 × 44 CSS-Pixel | W3C WCAG 2.2, SC 2.5.8 Target Size (Minimum) | WCAG 2.2 | Touchziele, Validator-Prüfung |
| Sicherungsbauformen/Maße | ISO 8820-3 (in den Littelfuse-Datenblättern referenziert) | — | Bauformtrennung im Rechner |

## Bewusst ohne Zahlenwert

Für die folgenden Punkte liegt **keine** allgemeingültige Quelle vor. Sie sind
in der App als OEM-abhängig formuliert und lösen keine Gut-/Schlecht-Bewertung
aus:

- Sollbereich der Sensorreferenz (nur Herstellerbeispiele, gekennzeichnet)
- KOEO-Spannungswert des MAP-Sensors (bereichs- und teilenummernabhängig)
- Ladespannungsbereich bei intelligentem Lademanagement
- Startspannungs-Bestehensgrenze (temperatur-, CCA- und startstromabhängig)
- Spannungsabfall-Grenzwerte im Starterkreis (strom- und fahrzeugabhängig)
- Raildruck-Ruhesignal (sensorkennlinien-/teilenummernabhängig)
- Klemme-50-Mindestspannung (Orientierungswert gekennzeichnet)

## Hinweis zur Verwendung

Die Zahlen aus den Sicherungsdatenblättern sind **Kaltwerte**. Der
tatsächliche Innenwiderstand schwankt mit Temperatur, Kontaktwiderstand und
Fertigungstoleranz; das Rechenergebnis ist eine Näherung zum Eingrenzen und
keine Präzisionsmessung. Nennströme überlappen zwischen den Bauformen –
die Bauform muss deshalb im Rechner explizit gewählt werden.
