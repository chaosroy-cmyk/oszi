# Testbericht v8.1-Profi

## Umgebung

| Position | Wert |
|---|---|
| Node | v22.22.2 |
| jsdom | 26.1.0 (fixiert in `package-lock.json`) |
| Browser (E2E) | Chromium 1194 (Playwright-Build), headless |
| Viewports | 360 × 640 (Mobil), 390 × 844 (Update-Test) |
| Startbefehl Strukturtests | `npm ci && npm run validate` |
| Startbefehl E2E | lokaler HTTP-Server + Playwright-Skript (siehe unten) |

## 1 · Strukturelle und semantische Prüfungen (`npm run validate`)

**Ergebnis: 48 von 48 bestanden, 0 Fehler.**

```
== 1 · Laden ohne Laufzeitfehler ==
  ✓ keine JS-Fehler beim Laden

== 2 · Datenintegrität ==
  ✓ keine doppelten IDs (70 Prüfungen)
  ✓ jede cat existiert in CATS
  ✓ jeder DEEP-Key hat eine Prüfung (70 Keys)

== 3 · Jede Detailansicht rendert sauber ==
  ✓ alle 70 Detailansichten fehlerfrei, ohne undefined/[object
  ✓ alle 2 Zweittabellen (rt2) werden tatsächlich gerendert
  ✓ alle 36 Anleitungen als einklappbarer Block gerendert
  ✓ Profi-Modus: Anleitung zugeklappt, Inhalt trotzdem im DOM
  ✓ Einsteiger-Modus: Anleitung automatisch offen

== 4 · Konventionen (gegen Renderer geprüft) ==
  ✓ Warn-Typen, urs-Gewichte, Tabellen-Spalten, fs-Pflichtfelder

== 5 · Diagnosebäume ==
  ✓ alle 14 Bäume: Ziele gültig, alle Knoten erreichbar
  ✓ Schritt-zurück über 3 Ebenen (Buttons vorhanden, Zustände stimmen)

== 6 · Querverweis-Chips ==
  ✓ Chips erzeugt (54 Chips aus 52 Textverweisen), alle Ziele existieren
  ✓ unauflösbare Verweise bleiben Text ('jeweiliger Sensor' ergibt keinen Chip)

== 7 · Rechner-Regression ==
  ✓ 0,77 mV an 10 A ergibt ≈ 100 mA
  ✓ ATOF 10 A entspricht dem Datenblatt (7,70 mΩ)
  ✓ Komma und Punkt liefern dasselbe Ergebnis
  ✓ unplausibler Wert über Nennstrom wird abgefangen
  ✓ leere/ungültige Eingabe sauber behandelt

== 8 · Zustands-Regression ==
  ✓ drei openDetail nacheinander = genau EIN History-Eintrag
  ✓ Merkliste aktualisiert sich nach Hinzufügen und Entfernen

== 9 · Suche ==
  ✓ Suche "sauerstoffsensor" liefert Treffer
  ✓ Suche "p0340" liefert Treffer
  ✓ Suche "öldruck" liefert Treffer
  ✓ Suche "kty81" liefert Treffer
  ✓ Suche "starter masse" liefert Treffer

== 10 · Versionierung ==
  ✓ APP_VERSION (8.1-Profi) ↔ CACHE_NAME (v8-1) synchron
  ✓ alle Splash-Bilder im SW-Precache

== 11 · Fokus-Trap ==
  ✓ Tab am Ende springt zum Anfang, Shift+Tab am Anfang zum Ende

== 12 · Semantik: keine universellen Festgrenzen ==
  ✓ keine festen 5-V-Grenzen in aktiven Diagnosepfaden
  ✓ 4,75–5,25 V nur als gekennzeichnetes Beispiel, nicht als Entscheidungsgrenze
  ✓ Generatorbaum beginnt mit der Ladesystemart, nicht mit einer Spannung
  ✓ 5-V-Baum beginnt mit der Frage nach dem OEM-Sollbereich
  ✓ batterie: sichtbarer Gefahrblock, tag=gef, Risiko hoch
  ✓ raildruck: sichtbarer Gefahrblock, tag=gef, Risiko hoch
  ✓ MAP enthält keinen universellen KOEO-Spannungswert
  ✓ kein Teiletausch ohne vorherigen Bestätigungsschritt
  ✓ alle danger-Warnungen stehen vor der Arbeitsanweisung (auch im Einsteiger-Modus)

== 13 · Service Worker & Cache-Isolation ==
  ✓ SW löscht nur Caches mit eigenem Präfix
  ✓ Nachbar-App auf demselben Origin löscht ebenfalls präfix-gefiltert
  ✓ alle 26 Splash-Assets (Hoch- und Querformat) im Precache

== 14 · Accessibility-Semantik ==
  ✓ Dialoghintergrund wird inert geschaltet
  ✓ Hintergrund nach Dialogschluss wieder bedienbar
  ✓ aktive Navigation trägt aria-current
  ✓ Kategorie-Chips tragen aria-pressed
  ✓ dekorative Emoji sind aria-hidden
  ✓ wesentliche Touchziele mindestens 44x44 CSS-Pixel (WCAG 2.2 SC 2.5.8)

== 15 · Licht-/Dunkelschema ==
  ✓ systemabhängiges helles Farbschema vorhanden

================================
ALLE PRÜFUNGEN BESTANDEN (48)
```

## 2 · Praktische Prüfungen im echten Browser

### 2.1 Offline-Neustart, Cache-Isolation, Bedienung (360 × 640)

| Prüfung | Ergebnis |
|---|---|
| Service Worker registriert | bestanden |
| kein horizontaler Überlauf bei 360 × 640 | bestanden |
| **Fremdcache eines Nachbar-Origins bleibt erhalten** (`kfzoszi-v2-fremd`) | bestanden |
| eigener Cache vorhanden | bestanden |
| Touchziele unter 44 × 44 px | keine gefunden |
| Dialoghintergrund inert während Dialog | bestanden |
| Hintergrund nach Dialogschluss wieder bedienbar | bestanden |
| Suche „öldruck" | 1 Treffer |
| Rechner ATOF 10 A / 0,77 mV | ≈ 100 mA |
| Diagnosebäume geladen | 14 |
| **Offline-Neustart nach Netztrennung** | bestanden, 70 Karten verfügbar |
| Konsolenfehler | keine |

### 2.2 Update von der Vorversion (v8.0 → v8.1)

| Prüfung | Ergebnis |
|---|---|
| Ausgangsversion geladen und vom SW kontrolliert | 8.0-Profi, kontrolliert |
| wartender Worker nach Bereitstellung der neuen Version | erkannt |
| Update-Banner sichtbar | bestanden |
| Aktualisieren-Button per Tastatur fokussierbar und mit Enter auslösbar | bestanden |
| aktive Version nach Update | 8.1-Profi |
| Caches nach Update | nur `kfz-multimeter-profi-v8-1` (alte eigene Version entfernt) |

### 2.3 Dabei gefundener und behobener Fehler

Der Update-Test schlug zunächst fehl: Der Service Worker registrierte sich
nicht. Ursache war nicht die Update-Logik, sondern `cache.addAll` – die Methode
ist **atomar**. Ein einziges fehlendes Splash-Bild verhinderte die gesamte
Installation und damit die komplette Offline-Fähigkeit. In einem realen
Teil-Deploy hätte derselbe Effekt auftreten können.

Behoben: Kernumfang wird zwingend gecacht, optionale Assets (Splashscreens)
nur best effort. Danach lief der Update-Pfad vollständig durch.

## 3 · Bekannte Restgrenzen

- **jsdom kennt keine Layoutmaße.** Touchziel-Größen werden im Strukturtest
  aus dem Stylesheet abgeleitet und zusätzlich im echten Browser real gemessen.
- **iOS/Safari wurde nicht real getestet.** Splashscreen-Einbindung und
  `apple-touch-startup-image` sind formal korrekt gesetzt, aber nur auf echter
  Hardware endgültig verifizierbar.
- **Das helle Farbschema** ist umgesetzt und kontrastbewusst gewählt, aber
  nicht mit einem automatisierten Kontrast-Checker über alle Kombinationen
  geprüft.
- **34 von 70 Karten haben weiterhin keine ausführliche Anleitung** – bewusst
  offen, siehe Abschlussbericht.
