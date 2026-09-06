# CHANGELOG v8.21-Profi — Ein toter Querverweis, eine falsche Schema-Deklaration, eine unbrauchbare Druckansicht

## Befund 1 · `ref5v-vergleich`: der häufigere Fehlerfall war nicht antippbar

Die Karte hat genau eine Aufgabe: Sie ordnet ein Fehlerbild einem der beiden
Kurzschlusspfade zu und leitet weiter. Von ihren **drei** Textverweisen wurden
nur **zwei** zu Chips.

Und es war nicht der letzte, der scheiterte, sondern der **erste**:

> „Zuordnung getroffen → Prüfung: Kurzschluss nach Masse **bzw.** → Prüfung:
> Kurzschluss nach Plus."

Das angehängte „bzw." brach die Auflösung ab. Damit war ausgerechnet der
Masseschluss nicht anklickbar — den die Karte in ihrer eigenen Vergleichstabelle
mit „Häufigkeit: **häufig**" führt, gegenüber „selten" beim Plusschluss.

**Änderung:** Die beiden Wege stehen jetzt als eigenständige Sätze da, jeweils
mit ihrem Zuordnungskriterium („unterhalb des OEM-Solls" / „oberhalb des
OEM-Solls"). Alle drei Verweise erzeugen einen Chip.

## Befund 2 · `color-scheme` deklarierte nur „dark"

```html
<meta name="color-scheme" content="dark">
```

Die App bringt ein **vollständiges Hellschema** mit — in v8.15 wurden alle acht
Textfarben in beiden Schemata auf Kontrast geprüft. Die Deklaration sagte dem
Browser trotzdem, die Seite unterstütze nur Dunkel.

Folge auf einem hell eingestellten Gerät: Der Browser rendert seine **eigenen**
Bedienelemente — Scrollbalken, Auswahlfelder, Eingabefelder — dunkel, während
das Stylesheet die helle Palette liefert. Jetzt `content="light dark"`.

## Befund 3 · Die Druckansicht setzte nur `body`-Farben

```css
@media print{
  header,.botnav,.cats,.search-wrap{display:none}
  body{background:#fff;color:#000;padding:0}
}
```

`body{color:#000}` erreicht die Karteninhalte nicht: `.meta-card` behält
`background:var(--card)` (#1c2230), und `.val-g`, `.val-w`, `.val-b` behalten
ihre Signalfarben aus dem Dunkelschema. Auf Papier also helle Schrift auf Weiß —
für Ampelwerte und Meta-Karten praktisch unlesbar.

**Änderung:** Der Druckblock stellt die **Farbtokens** um, dasselbe Mittel, mit
dem die App ihr Hellschema baut. Die Werte sind die des Hellschemas, deren
Kontrast bereits geprüft ist — auf Papierweiß erreichen sie 6,25:1 bis 17,48:1.
Dazu `break-inside:avoid` für Meta-Karten, Checklisten, Fehlersuchschritte,
Ursachenzeilen, Tabellen und Anleitungsblöcke, damit Zusammengehöriges nicht
über die Seitengrenze reißt.

## Regression

`validate.js` Abschnitt 38, 9 Prüfungen (226 → 235). Die wichtigste ist
verallgemeinert: **Jeder Textverweis muss zu einem Chip werden** — geprüft über
`next`, `mess`, `good`, `bad`, alle Anleitungsschritte, Tabellennotizen,
Fehlersuchketten und sämtliche Baumergebnisse.

Die bisherige Prüfung (Abschnitt 6, seit v8.2) stellte nur sicher, dass
**erzeugte** Chips auf gültige Ziele zeigen — nicht, dass jeder Verweis
überhaupt einen erzeugt. Genau in dieser Lücke saß der Befund.

Ausgenommen bleibt der bewusst generische Platzhalter „jeweiliger Sensor": Ein
Diagnosebaum kann nicht wissen, welcher Sensor gemeint ist. Dass er **kein**
Chip wird, prüft der Validator weiterhin ausdrücklich mit.

## Geprüft und für korrekt befunden

- **Keine toten Sprungziele** im gesamten Bestand — Karten, Tiefeninhalte und
  Baumergebnisse zusammen.
- **PWA-Metadaten** vollständig: Manifest mit `id`, `scope`, `start_url`,
  `display`, `lang`, fünf Icons inklusive maskable; `apple-mobile-web-app-*`,
  `apple-touch-icon`, 26 `apple-touch-startup-image`-Einträge.
- **`kurzschluss-plus-masse`** hat als einzige Karte keinen Weiterverweis im
  Feld `next` — dort steht stattdessen konkrete Handlungsanweisung
  („Stecker abschnittsweise trennen, Kabelbaum bewegen, Fehlerstelle
  eingrenzen"). Kein Befund.
