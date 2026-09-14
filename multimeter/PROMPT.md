# Loop-Prompt: KFZ-Multimeter-Prüftool

Dieser Prompt steuert die iterative Weiterentwicklung der App `multimeter/index.html`.
Er wird in jeder Runde unverändert erneut ausgeführt (z. B. `/loop` in Claude Code
oder manuell: Prompt einfügen → Ergebnis prüfen → nächste Runde).

---

## Der Prompt (ab hier kopieren)

Du entwickelst das Werkstatt-Prüftool **„KFZ Multimeter Profi"** (`multimeter/index.html`,
eigenständige Offline-PWA ohne Build-Schritt und ohne externe Abhängigkeiten) iterativ weiter.
Arbeite eine komplette Runde nach dem Protokoll unten ab, committe das Ergebnis und beende die Runde
mit dem Rundenbericht.

### Ziel

Ein Prüftool, das hilft, **elektrische Fehler am Kfz mit dem Multimeter zu finden**. Es enthält
**alles, was sich mit einem Multimeter am Fahrzeug sinnvoll messen lässt**, und sagt klar,
**wann ein Oszilloskop (oder Diagnosetester) die bessere Wahl ist** – mit Verweis auf das
Schwester-Tool „KFZ-Oszilloskop-Kompendium" (`../index.html#pg-karten~c-<kartenid>`).

### Zielgruppe

Lehrling im 1. Lehrjahr **bis** Kfz-Meister. Ein und dieselbe Karte muss für beide funktionieren:

- **Einsteiger-Modus (Standard):** alles Schritt für Schritt, in einfacher Sprache, mit Begründung.
- **Profi-Modus (Button):** dieselbe Karte, aber kompakt – nur Einstellung, Messpunkte, Gut-/Schlecht-
  werte, Richtwerte, Fehlersuche, nächster Schritt. Ausführliche Erklärungen sind eingeklappt und
  per Tipp aufklappbar, nie gelöscht. Gefahrenhinweise bleiben in beiden Modi sichtbar.

### Pflichtinhalt jeder Prüfkarte (Reihenfolge einhalten)

1. **Einfach erklärt** (`beg`) – 1–3 Sätze in Alltagssprache, nur Einsteiger-Modus.
2. **Gefahrenhinweise** (`warn: danger`) – immer sichtbar, ganz oben.
3. **Messampel** – Multimeter geeignet / Oszi empfohlen / Gefahr; Risiko; Voraussetzungen; Grenzen;
   Nicht machen.
4. **Was prüfe ich?** (`was`)
5. **Warum messe ich das?** (`warum`) – welche Frage die Messung beantwortet, welches Fehlerbild
   dahintersteckt, was man sich damit erspart (z. B. Teiletausch auf Verdacht).
6. **Multimeter einstellen** (`set`) – Messart, Buchsen, ggf. Bereich.
7. **Messspitzen anhalten** (`probes`, `mess`) – rot/schwarz wohin, welcher Fahrzeugzustand
   (Zündung an/aus, Verbraucher an, Stecker ab, unter Last).
8. **Ausführliche Anleitung** (`DEEP.anl`) – nummerierte Schritte, wo sinnvoll.
9. **Guter Wert / Schlechter Wert** (`good`, `bad`) – mit Deutung: was der Wert über den Fehler sagt.
10. **Richtwerte** (`table` oder `DEEP.rt`) – typische Werte mit Bewertung (grün/gelb/rot).
11. **Häufige Fehlerursachen** (`DEEP.urs`) – nach Häufigkeit.
12. **Fehlersuche Schritt für Schritt** (`DEEP.fs`) – jeder Schritt mit „ok → " / „nicht ok → ".
13. **Wann Oszilloskop?** (`oszi`, `oszCard`) – was das Multimeter hier nicht sieht und warum
    (Mittelwert statt Signalform, Aussetzer, Flanken, Tastgrad, Busrahmen); Link ins Oszi-Kompendium.
14. **Nächster Schritt** (`next`).

### Abgrenzung: reines Multimeter-Tool

Die App bleibt ein **Multimeter-Werkzeug**. Das Oszilloskop kommt nur als Grenze vor („hier reicht
das Multimeter nicht, weil …") mit Link ins Oszi-Kompendium – keine Oszi-Anleitungen, keine
Signalbilder, keine Diagnosetester-Funktionen in dieser App.

### Kapitel „Schaltpläne verstehen" (Daten: `SCHALTPLAN`)

Hilfe zum Lesen von Kfz-Stromlaufplänen, weil jede Messung dort beginnt: Lesen (aufgelöste
Darstellung, Strompfade, Massepunkte), Klemmen (DIN 72552), Leitungsfarben und -beschriftung,
Schaltzeichen mit passender Multimeter-Messung, Relais (Pins 30/85/86/87/87a interaktiv, Bauarten,
Prüfung), Stecker-/Pinbezeichnungen und Herstellereigenheiten, **Vom Plan zur Messung** (fertige
Messpläne je Bauteiltyp), typische Fallen, Quiz für Lehrlinge. Pflicht bei Erweiterung: jedes neue
Schaltzeichen braucht ein SVG in `SYM_SVG`; Quiz-Fragen haben genau eine richtige Option; der
Validator prüft Mindestanzahl je Liste und rendert jedes Kapitel.

### Fachliche Regeln

- Werte sind **typische Richtwerte**; Schaltplan und Herstellerangabe haben Vorrang – auf jeder Karte
  steht das.
- Sicherheit zuerst: Ohm/Durchgang nur spannungsfrei, A-Buchse nach Strommessung zurückstecken,
  keine Prüflampe an Sensor-/Bus-/SRS-/Steuergeräteleitungen, Hochvolt nur mit Qualifikation,
  Airbag/SRS nie mit Ohm messen.
- Multimeter mittelt: alles Getaktete/Schnelle (PWM, Hall, Induktivgeber, Zündung, Injektoren,
  CAN/LIN/FlexRay, Aussetzer, Wackelkontakte im ms-Bereich) wird als „Oszi empfohlen" gekennzeichnet,
  mit Begründung und dem, was das Multimeter trotzdem sinnvoll vorab prüfen kann (Versorgung, Masse,
  Spulenwiderstand, Ruhepegel).
- Spannungsabfallmessung unter Last ist die zentrale Profi-Methode; Durchgang/Ohm beweisen keine
  Belastbarkeit – konsequent so darstellen.
- Keine Marken-Behauptungen ohne Einschränkung („oft", „z. B.", „je nach Fahrzeug").

### Technische Regeln (Stand der 8.x-Linie)

- Eine Datei (`index.html`), kein Framework, kein CDN, offline lauffähig, Deutsch, mobile-first,
  Tastaturbedienung, `aria-*`, Kontrast, `prefers-reduced-motion`, Hell- und Dunkelschema.
- Suche und Kategorien müssen neue Felder mit durchsuchen.
- **Redaktionelle Linie:** keine universellen Festgrenzen als Entscheidungskriterium. Neue Zahlen
  nur mit Quelle in `SOURCES.md`, sonst als Orientierungswert kennzeichnen und auf die
  Herstellervorgabe verweisen. Jede neue Karte braucht einen `sourceRefs`-Eintrag oder erbt den
  OEM-Pflichthinweis. Kein Teiletausch in einer Fehlersuchkette ohne Bestätigungsschritt.
- Deutsche Anführungszeichen paarweise „…“ (U+201E/U+201C); ein ASCII-`"` im String legt die App lahm.
  Nach jeder Änderung Skriptblock extrahieren und `node --check` laufen lassen.
- Querverweise als `→ Prüfung: <exakter Kartenname>.` (mit Punkt), sie werden zu Chips aufgelöst.
- Neue Overlays in `allOverlays()` eintragen; History-Steuerung nicht umbauen.
- **Vier Versionsstellen gemeinsam erhöhen:** `APP_VERSION` und `APP_CACHE_NAME` in `index.html`,
  `CACHE_NAME` in `sw.js`, `version` in `package.json`. Bei geänderten Inhalten zusätzlich `DATA_STAND`
  in `index.html` und die Datierung in `SOURCES.md` (müssen übereinstimmen).
- Validierung muss grün sein: `cd multimeter && npm ci && npm test` (`validate.js`, jsdom, prüft
  Daten, Renderer, Fachregeln, Modus, Schaltplan-Hilfe, Oszi-Links, Versionen und die
  Vollzähligkeit gegen `baseline.json`). `baseline.json` nur bewusst beim Release fortschreiben.
- Jeder Release bekommt ein `CHANGELOG-v8.x.md` (was, warum, Versionsstellen); neue
  `localStorage`-Schlüssel in `LEGAL/DATENSCHUTZ-ENTWURF.md` eintragen.

### Rundenprotokoll (jede Runde komplett)

1. **Bestand aufnehmen:** Alle Karten gegen die Pflichtinhalt-Liste und das Schaltplan-Kapitel gegen
   seine Gliederung prüfen. Fehlende Felder,
   leere oder zu knappe Texte, fehlende Oszi-Abgrenzung, fehlende Richtwerte oder Fehlersuche notieren.
2. **Lücken priorisieren:** (a) Sicherheitsrelevantes, (b) fachliche Fehler, (c) fehlende
   Messarten/Bauteile, die ein Kfz-Elektriker mit dem Multimeter tatsächlich prüft, (d) Didaktik
   (Einsteiger verstehen es nicht), (e) Profi-Modus zu lang, (f) Bedienung/PWA/A11y.
3. **Umsetzen:** Höchste Priorität zuerst, aber die Runde muss ein **fertiges, lauffähiges**
   Ergebnis liefern. Lieber 5 Karten vollständig als 20 halb.
4. **Beide Modi prüfen:** Einsteiger: versteht ein Lehrling, warum er misst und was der Wert
   bedeutet? Profi: passt die Karte ohne Aufklappen auf 1–2 Bildschirmhöhen?
5. **Validieren:** Validator laufen lassen, Seite headless öffnen, keine Laufzeitfehler.
6. **Versionieren, dokumentieren, committen:** vier Versionsstellen erhöhen, `CHANGELOG-v8.x.md`
   schreiben, Commit mit sprechender Nachricht, Push.
7. **Rundenbericht** (max. 15 Zeilen): Was wurde ergänzt/korrigiert, welche Lücken bleiben,
   Vorschlag für die nächste Runde. Wenn keine relevante Lücke mehr gefunden wird: das klar sagen
   und den Loop beenden.

### Ideenspeicher für spätere Runden (nur wenn Pflichtinhalt komplett ist)

- Weitere Messarten: Frequenz/Duty-Funktion des Multimeters, Kapazität (Kondensator/Zündkondensator
  alt), Temperatur (Typ-K-Fühler), MIN/MAX-Aufzeichnung für Wackelkontakte, Stromzange AC/DC.
- Weitere Bauteile: Sitzheizung, Scheibenheizung, Standheizung, Anhängersteckdose, elektrische
  Parkbremse, Radarsensor-Versorgung, Batteriesensor (IBS), Start-Stopp-Zusatzbatterie.
- Fahrzeugspezifische Hinweise (VAG/BMW/MB/Ford/PSA/Asia), immer mit „je nach Modell".
- Übungsmodus für Lehrlinge (Frage → Antwort aufdecken), Prüfprotokoll als Text exportieren.

---

## Nutzung mit Claude Code

```
/loop  <Inhalt des Abschnitts „Der Prompt" einfügen>
```

Ohne Intervall pacet der Loop sich selbst. Jede Runde endet mit dem Rundenbericht; erscheint
zweimal hintereinander „keine relevante Lücke", den Loop stoppen.
