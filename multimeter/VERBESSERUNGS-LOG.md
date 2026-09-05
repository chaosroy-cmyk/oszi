# Verbesserungs-Log · KFZ Multimeter Profi

Fortschrittsregister des Verbesserungs-Loops. Arbeitsanweisung:
[`PROMPT-VERBESSERUNG.md`](PROMPT-VERBESSERUNG.md).

**Nächstes Fokusthema: 2 · Basis-Messverfahren**

Format je Runde:

```
## Runde <Nr> · <Fokusthema> · <Datum>
Baseline: <n>/<n> grün → Abschluss: <n>/<n> grün · Version <alt> → <neu>

### Befunde
- **<Kurztitel>** (`<karte-id>`) — <was war falsch>
  Beleg: <URL oder Reproduktionsschritt>
  Fix: <was geändert wurde> · Regression: `validate.js` <Prüfname>

### Beobachtungen ohne Beleg
- <Vermutung, warum nicht geändert>

### Offen
- <was in eine spätere Runde gehört>
```

---

## Runde 0 · Einrichtung · 2026-09-05

Baseline: 78/78 grün → Abschluss: 78/78 grün · Version 7.3-Profi → 8.3-Profi

### Was passiert ist

- **v8.3 aus dem ZIP nach `multimeter/` übernommen** (vorher v7.3 im Repo).
  Neu gegenüber v7.3: Relais-Kartensatz (4 Karten + Diagnosebaum),
  `SOURCES.md` mit Evidenzstufenmatrix, `validate.js` mit 78 Prüfungen,
  26 Splashscreens, Changelogs v8.2/v8.2.1/v8.3.
- **Verbesserungs-Prompt und dieses Log angelegt.**

### Befunde

- **Nachbar-App löschte den Offline-Cache der Multimeter-App** (`/sw.js`)
  Der Service Worker des Oszilloskop-Kompendiums im Repo-Wurzelverzeichnis
  löschte beim `activate` **jeden** Cache außer dem eigenen:
  `keys.filter(k => k !== CACHE)`. Cache Storage ist origin-weit, nicht
  scope-weit – beide Apps liegen auf demselben Origin (`/` und
  `/multimeter/`). Jedes Update des Kompendiums nahm der Multimeter-App
  damit die Offline-Fähigkeit; beim nächsten Start ohne Netz stand der
  Monteur vor einer leeren App. Die Multimeter-Seite hatte diesen Fall
  bereits über `CACHE_PREFIX` abgesichert, die Gegenseite nicht.
  Beleg: `validate.js` Abschnitt 13, Prüfung „Nachbar-App auf demselben
  Origin löscht ebenfalls präfix-gefiltert" – im Repo-Kontext rot, weil
  `../sw.js` dort erstmals existiert. Standalone im ZIP konnte die Prüfung
  nie greifen (keine Nachbardatei), der Bug war deshalb unsichtbar.
  Fix: `CACHE_PREFIX = "kfzoszi-"` in `/sw.js`, Aufräumen filtert darauf.
  Regression: bestehende Prüfung deckt es ab, sobald beide Apps im selben
  Baum liegen.

### Offen

- Rotation startet mit Thema 1 (Sicherheit & Gefahrkarten).

---

## Runde 1 · Sicherheit & Gefahrkarten · 2026-09-05

Baseline: 78/78 grün → Abschluss: 86/86 grün · Version 8.3-Profi → 8.4-Profi

Geprüft: `sicherheitscheck`, `srs-airbag`, `hv-hybrid`, `batterie`,
`raildruck`, `relais-leistung` — dazu im Quervergleich alle 20 Karten mit
`danger`-Warnung und alle Karten mit Kraftstoff-Hochdruckbezug.

### Befunde

- **Benzin-Direkteinspritzung ohne jede Gefahrenkennzeichnung**
  (`injektor-benzin`)
  Die Karte behandelte Direkteinspritzer ausdrücklich (Einsteigertext,
  Tabellennotiz „VAG TFSI/TSI: hohe Schaltspannung", `dont`-Eintrag gegen
  Brücken und Fremdbestromen) — trug aber **keine einzige Warnung** bei
  `risk:"mittel"`. Die Schwesterkarte `injektor-diesel` hatte für dasselbe
  Bauteil einen roten Gefahrblock und `risk:"hoch"`. Die Gefahrenkennzeichnung
  hing damit am Kraftstoff statt am Hochdrucksystem.
  Beleg: Bosch führt Hochdruckpumpen für Benzin-DI mit bis zu 250 bar und bis
  zu 350 bar Systemdruck, Injektor HDEV 6 bis 350 bar
  (bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-direct-injection/
  und /solutions/pumps/high-pressure-pump/, Abruf 05.09.2026). Die HSE hält
  Injektionsverletzungen ab 7 bar für möglich, schwere Verletzungen
  typischerweise über 100 bar (HSE FOD 4-2014) — diese Quelle stand bereits in
  `SOURCES.md` und trug die Gefahrkennzeichnung der Diesel-Karten. Sie belegt
  die Gefahr druckabhängig, nicht kraftstoffabhängig.
  Fix: `danger`- und `caution`-Block ergänzt, `risk` auf `hoch`, `requires`
  um Systemklärung und OEM-Druckabbau erweitert, Anleitungsschritt
  vorangestellt, `sourceRef` und zwei `SOURCES.md`-Zeilen ergänzt.
  Regression: `validate.js` Abschnitt 19, verallgemeinert auf **jede** Karte
  mit Direkteinspritzung oder Common-Rail. Gegen den Zustand vor der Änderung
  meldet der Validator `injektor-benzin(keine warn/mittel)` und schlägt fehl —
  Wirksamkeit nachgestellt und bestätigt.
  Gegenprobe gegen Überwarnung: eine zusätzliche Prüfung stellt sicher, dass
  die Spulenmessung am getrennten Stecker weiterhin als zulässige Prüfung
  erkennbar bleibt.

### Beobachtungen ohne Beleg

- **Schaltspannung der DI-Ansteuerung.** Die Tabellennotiz spricht von „hoher
  Schaltspannung", ohne einen Wert zu nennen. Recherche nach einer belastbaren
  Herstellerangabe (Bosch, Infineon, TI, Delphi) brachte nur Patentschriften
  ohne konkrete Betriebsspannung. Deshalb bewusst **keine Zahl** ergänzt — die
  Warnung bleibt qualitativ. Offen für eine Runde mit Zugriff auf ein
  Bosch-Datenblatt der HDEV-Reihe.

### Offen

- **Grundsatzfrage `warn` gegen `dont`:** `kraftstoffpumpe` (nennt die
  Hochdruckpumpe) und `klimadruck` (nennt die Hochdruckseite des
  Kältemittelkreises, R1234yf ist zusätzlich entzündlich) führen ihre Gefahr
  ausschließlich im `dont`-Block, ohne sichtbaren Warnblock. Dasselbe Muster
  bei `tankgeber` („keine Funken/Zündquellen am offenen Tank —
  Explosionsgefahr"). Das ist erkennbar Hauskonvention, kein Einzelfehler, und
  wurde deshalb **nicht** im Vorbeigehen geändert. Die Frage gehört einmal
  bewusst entschieden und dann einheitlich über alle Karten gezogen — Vorschlag:
  Runde 8 (Aktoren).
- `injektor-benzin` hat kein `syn`-Feld; ob die Suche „Direkteinspritzer",
  „TFSI" oder „GDI" findet, ist offen. Gehört zu Runde 11 (Glossar/Suche).
- `map` nennt „1 bar" als Messbereich und wird von einer groben
  Hochdruck-Regex fälschlich getroffen. Kein Befund, aber ein Hinweis darauf,
  dass Textregeln über Druckangaben eng gefasst sein müssen — deutsche Wörter
  auf `-bar` (erkennbar, brauchbar) sind eine ständige Fehlerquelle.
