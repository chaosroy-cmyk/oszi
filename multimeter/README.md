# KFZ Multimeter Profi

Lern- und Diagnosehilfe für Messungen mit dem Multimeter am Fahrzeug, als
installierbare Progressive Web App. Sie richtet sich an beide Enden: Einsteiger
bekommen zu jeder Prüfung eine ausklappbare Schritt-für-Schritt-Anleitung und
einen Klartextblock „Einfach erklärt", Profis eine kompakte Karte mit
Richtwerten, Fehlerursachen nach Häufigkeit und einer Fehlersuchkette.

**Redaktionelle Grundlinie:** Die App gibt **keine universellen Grenzwerte als
Entscheidungskriterium** vor. Wo es keine seriöse Universalgrenze gibt, verweist
sie auf die Herstellervorgabe. Eine einzelne Messung ist nie ein Urteil, und ein
Bauteiltausch steht erst nach einer Gegenprobe an. Diese Linie ist in
`validate.js` als Prüfung hinterlegt, nicht nur als Vorsatz.

## Stand

| | |
|---|---|
| App-Version | `8.5-Profi` |
| Inhaltsstand | 09.08.2026 |
| Umfang | 77 Prüfkarten, 15 Diagnosebäume |
| Validator | 153 Prüfungen |
| Abhängigkeiten der App | keine |

## Projektaufbau

```
multimeter/
├── index.html              die gesamte App: Daten, CSS und JavaScript inline
├── sw.js                   Service Worker (Precache, network-first für Navigationen)
├── offline.html            Fallback, wenn ohne Netz und ohne gefüllten Cache aufgerufen
├── manifest.webmanifest    PWA-Manifest
├── _headers                Cache- und Sicherheitsheader (Cloudflare Pages)
├── icon-*.png, icon.svg    App-Symbole
├── splash-*.png            Startbilder (iOS)
├── validate.js             Prüfsuite, läuft gegen den echten Renderer via jsdom
├── baseline.json           Vollzähligkeitsbasis (siehe unten)
├── SOURCES.md              Quellen- und Grenzwertmatrix
├── LICENSE                 Entwurf — Lizenzmodell noch offen
├── LEGAL/                  Rechtsentwürfe, nicht veröffentlicht
└── CHANGELOG-v8.*.md       Änderungen je Release
```

Die App ist **abhängigkeitsfrei und ohne Buildschritt**: `index.html` ist
gleichzeitig Quelltext und Auslieferungsstand. `jsdom` wird ausschließlich vom
Validator gebraucht und nie ausgeliefert.

## Validator ausführen

```bash
cd multimeter
npm ci
npm run validate
```

Der Validator lädt `index.html` in jsdom, ruft den echten Renderer auf und prüft
das erzeugte DOM — nicht den Quelltext. Deshalb fallen auch Fehler auf, die
syntaktisch unauffällig sind: eine Warnung mit unbekanntem Typ, eine Karte ohne
Anleitung, ein Querverweis auf einen Kartennamen, den es nicht gibt.

Der Lauf endet mit `ALLE PRÜFUNGEN BESTANDEN (n)` oder mit einer Liste der
fehlgeschlagenen Punkte und Exit-Code 1.

### Vollzähligkeitsprüfung

`baseline.json` hält Kartenzahl, DEEP-Schlüssel, Warnungen, Tabellenzeilen,
Bäume und **alle Karten-Kennungen namentlich** fest. Der Validator schlägt fehl,
sobald etwas davon verschwindet.

Das ist kein Selbstzweck: Bei einem früheren Zusammenführen sind drei
Prüfkarten ersatzlos entfallen, während alle Tests grün blieben. Eine Prüfsuite,
die einen solchen Verlust nicht bemerkt, prüft die falsche Sache.

`baseline.json` wird **nur bewusst beim Release** fortgeschrieben, nie
automatisch. Wer sie anpasst, um einen roten Lauf grün zu bekommen, hebelt genau
die Prüfung aus, für die sie existiert.

## Deployment

Statisches Hosting, kein Buildschritt. Für Cloudflare Pages: den Inhalt von
`multimeter/` flach als Wurzelverzeichnis hochladen — `_headers` wirkt nur, wenn
die Datei in der Wurzel liegt.

`_headers` setzt `no-cache` für `sw.js`, `manifest.webmanifest`, `index.html` und
`offline.html`, lange unveränderliche Cachezeiten für Bilder sowie
`X-Content-Type-Options`, `Referrer-Policy` und `X-Frame-Options`. Auf anderen
Hostern muss dieselbe Konfiguration dort hinterlegt werden — die Datei allein
bewirkt nichts.

### Updateweg

Der neue Service Worker installiert sich, **wartet** aber und übernimmt erst,
wenn der Nutzer das Updatebanner bestätigt (`SKIP_WAITING` als Nachricht mit
`{type:...}`). Kein erzwungener Neustart mitten in der Arbeit.

Zwei Fallen, die hier bereits zugeschlagen haben und deshalb festgehalten
gehören:

- **`cache.addAll` ist atomar.** Ein einziges fehlendes Bild verhindert die
  komplette Installation und damit die Offlinefähigkeit. Deshalb der Schnitt in
  `CORE_ASSETS` (Pflicht) und `OPTIONAL_ASSETS` (Startbilder, best effort).
- **Cache Storage ist herkunftsweit, nicht scope-weit.** Auf einer gemeinsamen
  Herkunft löschen sich zwei Apps beim Aufräumen gegenseitig den Cache. Beide
  Service Worker auf dieser Herkunft filtern deshalb nach einem eigenen
  `CACHE_PREFIX`.

## Versionierung

Vier Stellen müssen zusammenpassen; der Validator prüft das:

| Stelle | Beispiel |
|---|---|
| `index.html` → `APP_VERSION` | `8.5-Profi` |
| `index.html` → `APP_CACHE_NAME` | `kfz-multimeter-profi-v8-5` |
| `sw.js` → `CACHE_NAME` | `kfz-multimeter-profi-v8-5` |
| `package.json` → `version` | `8.5.0` |

Getrennt davon steht `DATA_STAND` in `index.html` — der **fachliche
Inhaltsstand**, sichtbar in der Fußzeile und im Nutzungshinweis. Er muss mit der
Datierung in `SOURCES.md` übereinstimmen (ebenfalls geprüft). Sollwerte veralten
unabhängig davon, ob am Code etwas geändert wurde; deshalb sind es zwei Angaben
und nicht eine.

Wird `CACHE_NAME` bei einem Release **nicht** erhöht, bekommen bestehende
Installationen die neue Fassung nicht.

## Konventionen beim Bearbeiten der Daten

Verstöße erzeugen **keine Fehlermeldung**, sondern stilles Fehlverhalten. Genau
deshalb prüft der Validator sie gegen das gerenderte DOM.

- Warntypen ausschließlich `danger`, `caution`, `info`. `danger` wird vom
  Renderer automatisch **vor** die erste Arbeitsanweisung gezogen.
- Ursachengewichte in `urs` ausschließlich `h`, `m`, `s` (häufig, mittel, selten).
- Bewertungscodes in Tabellenzeilen ausschließlich `g`, `w`, `b` — jeweils als
  **letztes** Element der Zeile. Ohne einen dieser Codes wird die Zeile als
  reine Textzeile gerendert.
- Neue Einträge im `TESTS`-Array sind **eigenständige Objekte**. Fehlt die
  schließende und öffnende Klammer, landen die Felder im Nachbarobjekt und
  werden von dessen Feldern überschrieben — ohne jede Fehlermeldung.
- `DEEP.rt` hat Vorrang vor `TESTS.table`. Existieren beide, wird die Kurztabelle
  nie angezeigt.
- Jede Karte braucht einen Eintrag in der `sourceRefs`-Zuordnung oder erbt den
  OEM-Pflichthinweis. Eine Karte ohne beides gibt es nicht.
- Querverweise werden als `→ Prüfung: <Kartenname>.` geschrieben und über
  `linkifyRefs()` gegen `TESTS[].nm` aufgelöst. **Der Name muss exakt passen**,
  und der Verweis muss mit einem Punkt enden — sonst frisst er den Folgesatz.
  Unauflösbare Verweise bleiben Text und erzeugen keinen toten Verweis.
- Die Overlay-Steuerung läuft über die History API. Neue Overlays werden in
  `allOverlays()` eingetragen; nicht umbauen.
- Umlaute als echte UTF-8-Zeichen.
- **Deutsche Anführungszeichen paarweise:** `„…"` mit `"` (U+201C) schließen.
  Ein ASCII-`"` beendet den JavaScript-String und legt die gesamte App lahm.
  Dieser Fehler ist bereits zweimal aufgetreten. Nach dem Bearbeiten prüfen:
  Skriptblock extrahieren und `node --check` laufen lassen.
- **Keine pauschalen Universalgrenzen als Entscheidungskriterium.** Neue
  Zahlenwerte nur mit belegbarer Quelle in `SOURCES.md` (Quelle, Revision oder
  Abrufdatum, Anwendungsbereich, Grenze). Ohne Quelle: als Orientierungswert
  kennzeichnen und auf die Herstellervorgabe verweisen. Nicht interpolieren,
  nicht schätzen, nicht aus Plausibilität ableiten.

## Rechtliches

`LICENSE` und die Dokumente in `LEGAL/` sind **Entwürfe**. Lizenzmodell,
Impressumsangaben und Rückmeldeweg sind noch nicht entschieden; die offenen
Punkte sind in `LEGAL/00-UEBERSICHT.md` einzeln aufgeführt.

© 2026 RS
