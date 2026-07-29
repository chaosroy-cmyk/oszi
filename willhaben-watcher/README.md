# willhaben-Watcher

Cloudflare Worker, der die [willhaben](https://www.willhaben.at)-Gebrauchtwagenbörse
alle 15 Minuten nach gespeicherten Suchprofilen durchsucht und **jeden neuen
Treffer per Telegram** meldet – mit Titel, Preis, Baujahr, Kilometerstand, Ort
und dem ersten Inseratsfoto.

Die Suchkriterien liegen **nicht** im Code, sondern in Cloudflare KV und sind
über eine kleine Weboberfläche unter `/config` änderbar – wie eine ganz normale
Websuche, ohne erneutes Deployment.

```
Cron (*/15)  →  Suchprofile aus KV  →  willhaben-JSON-API  →  Filter  →  neu?  →  Telegram
                        ↑                                                  ↓
                   /config (Web-UI)                                  KV (30 Tage TTL)
```

## Inhalt

| Datei | Zweck |
|---|---|
| `src/index.ts` | Routing, Passwortschutz, Cron-Einstieg |
| `src/watcher.ts` | Suchlauf, Filter, Duplikatserkennung, Flutschutz |
| `src/willhaben.ts` | JSON-Client für die willhaben-Such-API |
| `src/telegram.ts` | `sendPhoto` / `sendMessage`, Fehlermeldung max. 1×/Tag |
| `src/config.ts` | Suchprofile in KV lesen/schreiben und validieren |
| `src/regions.ts` | Bundesland → willhaben-`areaId` |
| `src/geo.ts`, `src/plz-data.ts` | PLZ-Koordinaten + Umkreisberechnung |
| `src/ui/config.html` | Konfigurationsoberfläche (einzelne Datei, ohne externe Abhängigkeiten) |
| `SETUP.md` | Einrichtung Schritt für Schritt (Telegram + Cloudflare) |
| `DASHBOARD.md`, `dashboard/worker.js` | Einrichtung ohne Terminal: eine Datei ins Cloudflare-Dashboard einfügen |
| `GITHUB.md`, `suchprofile.json` | Betrieb ohne Cloudflare: als GitHub Action, Suchkriterien in einer Datei |
| `src/node/` | Node-Variante des Watchers (Dateien statt KV) für die GitHub Action |

---

## 1. Telegram-Bot anlegen

1. In Telegram **[@BotFather](https://t.me/BotFather)** öffnen und `/newbot` schicken.
2. Einen Anzeigenamen wählen (frei, z. B. `Willhaben Watcher`).
3. Einen Benutzernamen wählen – muss auf `bot` enden, z. B. `roy_willhaben_bot`.
4. BotFather antwortet mit dem **Token** in der Form
   `123456789:AAH4k…`. Das ist `TELEGRAM_BOT_TOKEN` – geheim halten.
5. **Wichtig:** den eigenen Bot einmal anschreiben (Chat öffnen, `/start` senden).
   Vorher darf der Bot dir keine Nachrichten schicken.

### Chat-ID herausfinden

Variante A – am schnellsten:
**[@userinfobot](https://t.me/userinfobot)** anschreiben, er antwortet mit `Id: 123456789`.
Diese Zahl ist `TELEGRAM_CHAT_ID`.

Variante B – ohne fremden Bot: nach dem `/start` an den eigenen Bot im Browser
öffnen (Token einsetzen):

```
https://api.telegram.org/bot<DEIN_TOKEN>/getUpdates
```

In der Antwort steht `"chat":{"id":123456789,…}` – das ist die Chat-ID.

> Für eine Gruppe: Bot in die Gruppe einladen, dort schreiben, dann `getUpdates`
> aufrufen. Gruppen-IDs sind negativ (z. B. `-1001234567890`).

---

## 2. Einrichten und deployen

> **Ausführliche Anleitung mit jedem Schritt, Kontrollpunkten und einer
> Fehlertabelle: [SETUP.md](SETUP.md).** Hier die Kurzfassung.
>
> **Kein Terminal, nur Klicks?** [DASHBOARD.md](DASHBOARD.md) – dort fügst du
> `dashboard/worker.js` als einzelne Datei im Cloudflare-Dashboard ein.
>
> **Ganz ohne Cloudflare?** [GITHUB.md](GITHUB.md) – der Watcher läuft dann als
> GitHub Action in diesem Repository. Einzurichten sind nur zwei Secrets.

Voraussetzung: Node.js ≥ 18 und ein Cloudflare-Account
(`npx wrangler login` einmalig ausführen).

```bash
cd willhaben-watcher
npm install

# KV-Namespace anlegen …
npx wrangler kv namespace create WATCHER
```

Die ausgegebene `id` in `wrangler.toml` bei `[[kv_namespaces]]` statt
`HIER_KV_NAMESPACE_ID_EINTRAGEN` eintragen.

Danach die drei Zugangsdaten setzen (werden verschlüsselt bei Cloudflare
gespeichert, nie im Repository):

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN   # Token von @BotFather
npx wrangler secret put TELEGRAM_CHAT_ID     # eigene Chat-ID
npx wrangler secret put CONFIG_PASSWORD      # frei wählbares Passwort für /config
```

Deployen:

```bash
npx wrangler deploy
```

Ab jetzt genügt für jede weitere Änderung am Code der eine Befehl
`npx wrangler deploy`. Der Cron-Trigger (alle 15 Minuten) wird dabei automatisch
mit eingerichtet.

---

## 3. Suchkriterien anpassen

Im Browser öffnen:

```
https://willhaben-watcher.<dein-subdomain>.workers.dev/config?key=DEIN_CONFIG_PASSWORD
```

(Ohne `?key=…` fragt der Browser per Basic-Auth nach – Benutzername beliebig,
Passwort = `CONFIG_PASSWORD`.)

Pro Suchprofil einstellbar:

| Feld | Wirkung |
|---|---|
| Marke / Modell | Dropdowns, live aus willhaben geladen (`CAR_MODEL/MAKE`, `CAR_MODEL/MODEL`) |
| Bundesland | alle 9 Bundesländer, „ganz Österreich" oder „andere Länder" (`areaId`) |
| PLZ + Umkreis (km) | Umkreissuche um eine österreichische PLZ (siehe unten) |
| Preis von / bis | `PRICE_FROM` / `PRICE_TO` |
| Baujahr von / bis | `YEAR_MODEL_FROM` / `YEAR_MODEL_TO` |
| Kilometerstand max. | `MILEAGE_TO` |
| Suchbegriff | Volltextsuche, die willhaben selbst ausführt (`keyword`) |
| Stichwörter | eigener Filter über Titel **und** Beschreibung: mindestens eines muss vorkommen, z. B. `Getriebeschaden, Bastler, Reparatur, Defekt, Schaden` |
| Ausschluss-Stichwörter | keines davon darf vorkommen, z. B. `Export, Bastlerfahrzeug` |

Stichwörter werden ohne Rücksicht auf Groß-/Kleinschreibung und Umlaute
verglichen (`Motorschäden` findet auch `MOTORSCHADEN`).

**Mehrere Profile** sind möglich (z. B. „Q7 günstig" und „Q7 Getriebeschaden").
Jedes wird einzeln durchsucht und einzeln benachrichtigt; der Profilname steht
unter jeder Telegram-Nachricht. Profile lassen sich einzeln deaktivieren.

„Speichern" schreibt alles nach KV – der nächste Cron-Lauf verwendet die neuen
Kriterien sofort, **ohne Redeploy**.

### Umkreissuche

Die willhaben-API kennt für Gebrauchtwagen nur Bundesländer, keinen Radius.
Der Worker rechnet den Umkreis deshalb selbst: jedes Inserat liefert
Koordinaten mit, der Mittelpunkt kommt aus einer eingebauten Tabelle aller
österreichischen Postleitzahlen (2501 Einträge, GeoNames). Auf die eingestellte
Distanz werden 5 km Toleranz aufgeschlagen, weil willhaben Ortsmittelpunkte
verwendet. Bundesland und Umkreis lassen sich kombinieren; für „50 km um
Salzburg" reicht PLZ `5020` + Umkreis `50` bei Bundesland „ganz Österreich".

### Erster Lauf eines Profils

Damit ein neues Profil nicht sofort dutzende Nachrichten auslöst, werden beim ersten
Lauf **alle** aktuellen Treffer stillschweigend als bekannt markiert; es kommt
nur eine kurze Info-Nachricht. Gemeldet wird ab dann, was neu dazukommt.
Über „Duplikate zurücksetzen" lässt sich dieser Zustand pro Profil verwerfen.

---

## 4. Manuell testen (ohne auf den Cron zu warten)

In der Oberfläche: **„Testlauf"** (sucht und filtert, sendet nichts und merkt
sich nichts), **„Jetzt ausführen"** (echter Lauf für dieses Profil),
**„Alle jetzt ausführen"** und **„Telegram testen"**.

Per Kommandozeile – `$HOST` ist die Worker-URL, `$KEY` das `CONFIG_PASSWORD`:

```bash
# Trockenlauf über alle Profile: zeigt Treffer als JSON, sendet nichts
curl "$HOST/api/run?dry=1&key=$KEY"

# Echter Lauf über alle aktiven Profile
curl -X POST "$HOST/api/run?key=$KEY"

# Nur ein Profil (auch wenn es deaktiviert ist)
curl -X POST "$HOST/api/run?profile=q7-guenstig&all=1&key=$KEY"

# Telegram-Zugangsdaten prüfen
curl -X POST "$HOST/api/test-telegram?key=$KEY"

# Ergebnis des letzten Laufs
curl "$HOST/api/state?key=$KEY"

# Duplikatserkennung eines Profils zurücksetzen
curl -X POST "$HOST/api/reset-seen?profile=q7-guenstig&key=$KEY"
```

Den echten Cron-Trigger auslösen (Cloudflare-Dashboard oder):

```bash
npx wrangler tail          # Live-Logs mitlesen
```

Lokal entwickeln:

```bash
echo "CONFIG_PASSWORD=lokaltest"        >  .dev.vars
echo "TELEGRAM_BOT_TOKEN=<token>"       >> .dev.vars
echo "TELEGRAM_CHAT_ID=<id>"            >> .dev.vars
npx wrangler dev
# UI:   http://127.0.0.1:8787/config?key=lokaltest
# Cron: curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"
```

### Alle Routen

| Route | Methode | Zweck |
|---|---|---|
| `/config` | GET | Weboberfläche |
| `/api/config` | GET / POST | Suchprofile lesen / speichern |
| `/api/makes` | GET | Markenliste live von willhaben |
| `/api/models?make=<id>` | GET | Modellliste zu einer Marke |
| `/api/run` | POST (GET nur mit `dry=1`) | Suchlauf auslösen |
| `/api/state` | GET | Zusammenfassung des letzten Laufs |
| `/api/reset-seen?profile=<id>` | POST | gemerkte Inserate löschen |
| `/api/test-telegram` | POST | Testnachricht senden |
| `/health` | GET | Statusprüfung (ohne Passwort) |

---

## 5. Betriebsparameter

Nur Technik, keine Suchkriterien – in `wrangler.toml` unter `[vars]`:

| Variable | Standard | Bedeutung |
|---|---|---|
| `SEARCH_ROWS` | `30` | Inserate pro Profil und Lauf; höhere Werte kosten CPU-Zeit (siehe [SETUP.md](SETUP.md)) |
| `MAX_NOTIFY_PER_RUN` | `10` | Einzelnachrichten pro Profil und Lauf; darüber kommt eine Sammelmeldung |
| `SEEN_TTL_DAYS` | `30` | wie lange eine Inserat-ID im KV bleibt |
| `USER_AGENT` | Chrome-Desktop | überschreibbarer User-Agent |

Robustheit, die eingebaut ist:

- **Keine Telegram-Flut bei Störungen:** Fehler (403, geänderte Antwortstruktur,
  Timeout) landen im Log; nach Telegram geht höchstens **eine** Fehlermeldung
  pro 24 Stunden.
- **Keine Endlosschleife:** der Cron-Handler wirft nie, ein fehlgeschlagener
  Lauf wird nicht wiederholt – der nächste Lauf kommt ohnehin in 15 Minuten.
- **Ein defektes Profil blockiert die anderen nicht.**
- **Moderate Last:** ein Request pro Profil und Lauf, 750 ms Pause zwischen den
  Profilen, realistischer User-Agent, Timeout 20 s.
- **Bereichsfilter werden nachgeprüft**, falls willhaben einen Parameter
  ignoriert; „Preis auf Anfrage" (Preis 0) fliegt dabei nicht heraus.

## 6. Woher die API-Parameter stammen

Der Worker benutzt denselben JSON-Endpoint wie die willhaben-Website selbst –
kein HTML-Scraping:

```
https://www.willhaben.at/webapi/iad/search/atz/seo/gebrauchtwagen/auto/gebrauchtwagenboerse
    ?rows=30&page=1&sort=1
    &CAR_MODEL%2FMAKE=1003&CAR_MODEL%2FMODEL=1031
    &PRICE_TO=8000&YEAR_MODEL_FROM=2010&MILEAGE_TO=300000&areaId=5&keyword=…
```

Sollte willhaben die Parameter ändern, findet man die aktuellen so:
die Suche mit den gewünschten Filtern auf willhaben.at öffnen, in den
Browser-DevTools den Tab **Netzwerk** öffnen, nach `search` filtern und den
XHR-Request kopieren. Die Antwort enthält unter `navigatorGroups` auch alle
gültigen Filterwerte samt IDs – genau daraus stammen die Marken- und
Bundesland-Zuordnungen in diesem Projekt. `/api/makes` und `/api/models` lesen
diese Listen zur Laufzeit, Marken und Modelle bleiben also von selbst aktuell.

Die PLZ-Tabelle kann so neu erzeugt werden:

```bash
curl -sSLo AT.zip https://download.geonames.org/export/zip/AT.zip
unzip -o AT.zip AT.txt
node tools/gen-plz.mjs AT.txt
```

## 7. Rechtlicher Hinweis

Die willhaben-Nutzungsbedingungen untersagen das automatisierte Auslesen der
Plattform **zu kommerziellen Zwecken**. Dieses Werkzeug ist ausschließlich für
den **privaten Gebrauch** gedacht – die persönliche Suche nach einem Fahrzeug –
und ersetzt lediglich das manuelle Nachschauen im Browser.

Bitte entsprechend fair betreiben: Abfrageintervall bei 15 Minuten belassen (nicht
kürzer), keine Datenbestände aufbauen oder weiterverbreiten, keine
Inseratsinhalte veröffentlichen. Die abgerufenen Daten bleiben Eigentum von
willhaben bzw. der jeweiligen Inserenten. Die Nutzung erfolgt auf eigenes Risiko;
willhaben kann den Zugriff jederzeit unterbinden.

Die enthaltenen Postleitzahl-Koordinaten stammen von
[GeoNames](https://www.geonames.org/) und stehen unter CC BY 4.0.
