# Verbesserungs-Log · KFZ Multimeter Profi

Fortschrittsregister des Verbesserungs-Loops. Arbeitsanweisung:
[`PROMPT-VERBESSERUNG.md`](PROMPT-VERBESSERUNG.md).

**Nächstes Fokusthema: 1 · Sicherheit & Gefahrkarten**

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
