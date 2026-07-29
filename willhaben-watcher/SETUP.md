# Einrichtung Schritt für Schritt

Vom leeren Bildschirm bis zur ersten Telegram-Nachricht: rund **20 Minuten**.
Kosten: **0 €** (Cloudflare-Free-Plan, keine Kreditkarte, keine eigene Domain).

Am Ende brauchst du drei Werte. Leg dir dafür einen Notizzettel an:

```
TELEGRAM_BOT_TOKEN = 123456789:AAH…      ← Teil A
TELEGRAM_CHAT_ID   = 123456789           ← Teil A
CONFIG_PASSWORD    = <selbst ausdenken>  ← Teil F
```

Reihenfolge einhalten – Teil A liefert die Werte, die Teil F braucht.

---

## Teil A · Telegram-Bot (ca. 5 Minuten)

### A1 · Bot erstellen

1. Telegram öffnen (Handy oder Desktop, egal).
2. Oben nach **`@BotFather`** suchen und den Chat öffnen. Achte auf das blaue
   Verifiziert-Häkchen – es gibt Nachahmer.
3. **`/newbot`** senden.
4. BotFather fragt nach dem **Anzeigenamen**. Frei wählbar, z. B.
   `Willhaben Watcher`. Absenden.
5. BotFather fragt nach dem **Benutzernamen**. Der muss eindeutig sein und auf
   `bot` enden, z. B. `roy_willhaben_watcher_bot`. Ist er vergeben, sagt
   BotFather das und du versuchst einen anderen.
6. BotFather antwortet mit:

   ```
   Done! Congratulations on your new bot. …
   Use this token to access the HTTP API:
   8123456789:AAHrK7x…
   ```

   Diese Zeichenkette ist dein **`TELEGRAM_BOT_TOKEN`** → auf den Notizzettel.

> **Der Token ist ein Passwort.** Wer ihn hat, kann in deinem Namen Nachrichten
> senden und lesen. Nicht in Screenshots, nicht ins Repository. Falls doch
> passiert: bei BotFather `/revoke` → neuen Token holen.

### A2 · Den eigenen Bot einmal anschreiben (wird gern vergessen)

Telegram erlaubt einem Bot **nicht**, ungefragt zu schreiben. Deshalb:

1. In der BotFather-Nachricht auf den Link `t.me/dein_bot_name` tippen –
   oder oben nach dem Benutzernamen suchen.
2. Im Chat auf **Start** tippen (bzw. `/start` senden).

Ohne diesen Schritt bekommst du später `Forbidden: bot can't initiate
conversation with a user`.

### A3 · Chat-ID herausfinden

Die Chat-ID sagt dem Bot, **wohin** er schreiben soll.

**Variante A – am schnellsten:** nach **`@userinfobot`** suchen, Chat öffnen,
`/start` senden. Er antwortet mit deinen Daten, darunter:

```
Id: 123456789
```

Diese Zahl ist deine **`TELEGRAM_CHAT_ID`**.

**Variante B – ohne fremden Bot:** nach Schritt A2 diese Adresse im Browser
öffnen (`<TOKEN>` ersetzen):

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

In der JSON-Antwort steht:

```json
{"message":{"chat":{"id":123456789,"first_name":"Roy","type":"private"}, … }}
```

Die `id` aus dem `chat`-Objekt ist die Chat-ID.

Kommt `{"ok":true,"result":[]}` (leere Liste), hast du dem Bot noch nichts
geschrieben → zurück zu A2, dann Seite neu laden.

> **Gruppe statt Einzelchat?** Bot in die Gruppe einladen, dort eine Nachricht
> schreiben, dann `getUpdates` aufrufen. Gruppen-IDs sind **negativ**, z. B.
> `-1001234567890` – das Minus gehört dazu.

### A4 · Beides sofort testen

Bevor du Cloudflare anfasst, prüf die zwei Werte direkt (Token und Chat-ID
einsetzen):

```bash
curl "https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Test"
```

Erwartet: `{"ok":true, …}` **und** die Nachricht „Test" erscheint in Telegram.

| Antwort | Ursache | Lösung |
|---|---|---|
| `401 Unauthorized` | Token falsch oder unvollständig | Token neu aus BotFather kopieren (inkl. Ziffern **vor** dem Doppelpunkt) |
| `400 chat not found` | Chat-ID falsch | A3 wiederholen |
| `403 bot can't initiate conversation` | Bot nie angeschrieben | A2 nachholen |

Erst wenn hier `ok:true` steht, weitermachen.

---

## Teil B · Cloudflare-Konto (ca. 3 Minuten)

1. [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) öffnen,
   E-Mail und Passwort angeben, Konto anlegen.
2. Bestätigungsmail anklicken.
3. Falls nach einem Plan oder einer Domain gefragt wird: **überspringen**.
   Für Workers brauchst du weder eine Domain noch einen bezahlten Plan.
4. Links im Menü **Workers & Pages** öffnen. Beim ersten Mal wirst du nach
   einer **`workers.dev`-Subdomain** gefragt – etwa `roy`. Deine Worker sind
   danach unter `<worker-name>.roy.workers.dev` erreichbar. Die Subdomain ist
   später nur noch schwer änderbar, überleg dir also kurz einen Namen.

---

## Teil C · Projekt lokal vorbereiten (ca. 2 Minuten)

```bash
node -v          # muss v18 oder höher sein
```

Falls kein Node installiert ist: [nodejs.org](https://nodejs.org) → LTS-Version.

```bash
git clone https://github.com/chaosroy-cmyk/oszi.git
cd oszi/willhaben-watcher
npm install
```

`npm install` lädt nur Entwicklungswerkzeuge (Wrangler, TypeScript) – sie
landen später **nicht** im Worker.

Kontrolle:

```bash
npx wrangler --version    # z. B. 4.115.0
```

---

## Teil D · Wrangler mit Cloudflare verbinden (ca. 2 Minuten)

```bash
npx wrangler login
```

Es öffnet sich der Browser mit einer Cloudflare-Seite („Allow Wrangler to make
changes…"). Auf **Allow** klicken, dann zurück ins Terminal – dort steht
`Successfully logged in`.

Kontrolle:

```bash
npx wrangler whoami
```

Zeigt E-Mail-Adresse und Account-ID. Hast du mehrere Cloudflare-Accounts, merk
dir die richtige Account-ID; Wrangler fragt bei Bedarf nach.

> **Kein Browser auf der Maschine** (Server, WSL ohne GUI)? Stattdessen im
> Dashboard unter *My Profile → API Tokens* einen Token mit den Rechten
> **Account · Workers Scripts · Edit** und **Account · Workers KV Storage ·
> Edit** anlegen und als Umgebungsvariable setzen:
> ```bash
> export CLOUDFLARE_API_TOKEN=…
> ```

---

## Teil E · KV-Namespace anlegen (ca. 1 Minute)

Hier landen Suchprofile, gesehene Inserate und der Laufstatus.

```bash
npx wrangler kv namespace create WATCHER
```

Ausgabe (sinngemäß):

```
🌀 Creating namespace with title "willhaben-watcher-WATCHER"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "WATCHER"
id = "a1b2c3d4e5f67890a1b2c3d4e5f67890"
```

Diese `id` in **`wrangler.toml`** eintragen – sie ersetzt den Platzhalter:

```toml
[[kv_namespaces]]
binding = "WATCHER"
id = "a1b2c3d4e5f67890a1b2c3d4e5f67890"   # vorher: HIER_KV_NAMESPACE_ID_EINTRAGEN
```

Das `binding = "WATCHER"` **nicht** ändern – der Code spricht die Datenbank
unter diesem Namen an.

> Bequemer geht es mit `npx wrangler kv namespace create WATCHER --update-config`
> – dann trägt Wrangler die `id` selbst ein.

Kontrolle: `npx wrangler kv namespace list`

---

## Teil F · Zugangsdaten hinterlegen (ca. 2 Minuten)

Secrets werden verschlüsselt bei Cloudflare gespeichert und landen **nie** im
Repository. Drei Stück, nacheinander:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put CONFIG_PASSWORD
```

Jeder Befehl fragt `Enter a secret value:` – Wert einfügen, Enter. Die Eingabe
bleibt unsichtbar, das ist Absicht.

- `TELEGRAM_BOT_TOKEN` und `TELEGRAM_CHAT_ID`: die Werte vom Notizzettel.
- `CONFIG_PASSWORD`: denkst du dir jetzt aus. Es schützt die
  Konfigurationsseite. Nimm etwas Langes und Zufälliges, z. B.:
  ```bash
  openssl rand -base64 24
  ```

> Gibt es den Worker noch nicht, fragt Wrangler
> `There doesn't seem to be a Worker called "willhaben-watcher". Do you want to
> create a new Worker with that name and add secrets to it?` → mit **y**
> bestätigen.

Kontrolle: `npx wrangler secret list` – zeigt die drei Namen (nicht die Werte).

Später ändern: denselben `secret put`-Befehl erneut ausführen, der alte Wert
wird überschrieben. Ein erneutes Deployment ist dafür **nicht** nötig.

---

## Teil G · Deployen (ca. 1 Minute)

```bash
npx wrangler deploy
```

Ausgabe (sinngemäß):

```
Total Upload: 78.42 KiB / gzip: 21.03 KiB
Your Worker has access to the following bindings:
  env.WATCHER (a1b2c3…)          KV Namespace
  env.SEARCH_ROWS ("30")         Environment Variable
Uploaded willhaben-watcher (3.1 sec)
Deployed willhaben-watcher triggers (0.9 sec)
  https://willhaben-watcher.roy.workers.dev
  schedule: */15 * * * *
Current Version ID: …
```

Wichtig sind die letzten Zeilen:

- **Die URL** – die brauchst du gleich. Merk sie dir als `$HOST`.
- **`schedule: */15 * * * *`** – der Cron-Trigger wurde eingerichtet. Steht er
  nicht da, hat Wrangler die `[triggers]`-Sektion nicht gelesen: falsches
  Verzeichnis oder falsche Konfigurationsdatei.

Ab jetzt genügt für jede Codeänderung dieser eine Befehl.

---

## Teil H · Funktionsprüfung (ca. 5 Minuten)

Der Reihe nach – jeder Schritt prüft eine andere Sache.

### H1 · Läuft der Worker überhaupt?

```bash
curl https://willhaben-watcher.roy.workers.dev/health
```

Erwartet: `ok`. Kommt ein Cloudflare-Fehler (Error 1101 o. ä.), sieh in
`npx wrangler tail` nach der Ursache.

### H2 · Konfigurationsseite öffnen

Im Browser:

```
https://willhaben-watcher.roy.workers.dev/config?key=DEIN_CONFIG_PASSWORD
```

Erwartet: die Oberfläche mit zwei vorbereiteten Profilen („Q7 günstig" aktiv,
„Q7 Getriebeschaden" inaktiv).

Kommt `401 Nicht autorisiert`, stimmt das Passwort nicht – oder es enthält
Sonderzeichen, die die URL zerlegen (`&`, `#`, `+`). In dem Fall die Seite ohne
`?key=` aufrufen: der Browser fragt dann per Anmeldedialog. Benutzername
beliebig lassen, Passwort eintragen.

Leg dir die Adresse **mit** `?key=…` als Lesezeichen an, dann entfällt die
Eingabe künftig.

### H3 · Telegram prüfen

In der Oberfläche oben auf **„Telegram testen"**. Erwartet: eine Nachricht
„✅ willhaben-Watcher – Testnachricht" in Telegram.

Fehlermeldung statt Nachricht → siehe Tabelle in A4; Secrets mit
`wrangler secret put` korrigieren.

### H4 · Suchkriterien einstellen

Am aktiven Profil einstellen, was du suchst – Marke, Modell, Preis, Baujahr,
Bundesland oder PLZ + Umkreis, Stichwörter. Dann **„Speichern"**.

### H5 · Trockenlauf

Am Profil auf **„Testlauf"**. Der sucht bei willhaben und filtert, sendet aber
nichts und merkt sich nichts. Darunter erscheint, was gefunden wurde:

```
Testlauf: 30 Inserate geladen, 3 nach Filtern übrig (nichts gesendet, nichts gemerkt).
```

- **0 übrig?** Die Filter sind zu eng. Preisgrenze hoch, Umkreis größer,
  Stichwörter leeren – und erneut testen. Zum Vergleich dieselbe Suche auf
  willhaben.at im Browser durchführen.
- **Fehler 403?** willhaben blockt gerade. Später erneut versuchen.

### H6 · Scharf schalten

Auf **„Jetzt ausführen"**. Beim allerersten Mal kommt bewusst **keine**
Trefferflut, sondern eine Info:

```
👀 Profil aktiviert: Q7 günstig
12 aktuelle Treffer wurden als bekannt markiert.
Ab jetzt kommt eine Nachricht, sobald ein neues Inserat auftaucht.
```

Das ist der Normalzustand. Ab jetzt läuft der Cron alle 15 Minuten und meldet
nur noch Neues. Bis zur ersten echten Benachrichtigung können je nach Suche
Stunden oder Tage vergehen – bei einem so engen Filter wie „Q7 unter 8.000 €"
ist das erwartbar.

Willst du den Versand trotzdem einmal in Aktion sehen: **„Duplikate
zurücksetzen"**, dann zweimal „Jetzt ausführen" – der erste Lauf markiert neu,
der zweite meldet nichts. Alternativ ein weit gefasstes Testprofil anlegen
(z. B. Marke Audi, ganz Österreich, ohne Preisgrenze), Nachrichten abwarten und
danach wieder löschen.

### H7 · Cron kontrollieren

Im Dashboard: **Workers & Pages → willhaben-watcher → Settings → Triggers**.
Dort muss unter *Cron Triggers* `*/15 * * * *` stehen.

Live mitlesen (Terminal offen lassen, bis der nächste Viertelstundenwechsel
kommt):

```bash
npx wrangler tail
```

Erwartete Zeile:

```
Cron */15 * * * *: 1 Profil(e), 0 Benachrichtigung(en), 0 Fehler
```

---

## Teil I · Laufender Betrieb

| Aufgabe | Weg |
|---|---|
| Suchkriterien ändern | `/config` – wirkt sofort, **kein** Deployment |
| Passwort/Token wechseln | `npx wrangler secret put <NAME>` – **kein** Deployment |
| Betriebsparameter (`SEARCH_ROWS` …) | `wrangler.toml` ändern + `npx wrangler deploy` |
| Code ändern | `npx wrangler deploy` |
| Logs ansehen | `npx wrangler tail` oder Dashboard → Worker → *Logs* |
| Letzter Lauf auf einen Blick | `/config`, Kasten „Letzter Lauf" |
| Alles wieder löschen | `npx wrangler delete` + Namespace im Dashboard löschen |

### Grenzen des Free-Plans

Der Watcher ist für den Free-Plan ausgelegt, aber zwei Grenzen solltest du
kennen (Cloudflare ändert diese Werte gelegentlich – im Zweifel in der
[Workers-Dokumentation](https://developers.cloudflare.com/workers/platform/limits/)
nachsehen):

- **CPU-Zeit: 10 ms pro Aufruf.** Das ist der knappe Posten. Die willhaben-
  Antwort ist groß (bei 30 Inseraten rund 650 KB, davon ~400 KB Filter-
  Metadaten, die immer mitkommen), und das Auswerten dieses JSON zählt auf die
  CPU-Zeit. Netzwerk-Wartezeit zählt **nicht** mit. Da alle Profile in einem
  einzigen Cron-Aufruf nacheinander laufen, summiert sich das:
  **rund 1–3 aktive Profile sind auf dem Free-Plan realistisch.** Bei
  `Error: Worker exceeded CPU time limit` in den Logs entweder `SEARCH_ROWS`
  senken (z. B. auf `15`), Profile deaktivieren – oder den Workers-Paid-Plan
  (5 $/Monat) nehmen, der diese Grenze praktisch aufhebt.
- **KV: 100.000 Lesevorgänge und 1.000 Schreibvorgänge pro Tag.** Gelesen wird
  einmal je Treffer und Lauf (bei 30 Inseraten × 96 Läufen ≈ 2.900 pro Profil
  und Tag – unkritisch). Geschrieben wird nur bei neuen Inseraten plus einmal
  je Lauf für den Status (96/Tag) – ebenfalls unkritisch.

Die 100.000 Requests pro Tag erreichst du nicht: 96 Cron-Läufe plus deine
eigenen Seitenaufrufe.

---

## Teil J · Wenn etwas nicht klappt

| Symptom | Ursache | Lösung |
|---|---|---|
| `KV namespace 'HIER_KV_NAMESPACE_ID_EINTRAGEN' is not valid` | Teil E nicht abgeschlossen | echte `id` in `wrangler.toml` eintragen |
| `Missing entry-point to Worker script` | falsches Verzeichnis | `cd willhaben-watcher`, dort deployen |
| Seite zeigt `CONFIG_PASSWORD ist nicht gesetzt` | Secret fehlt | `npx wrangler secret put CONFIG_PASSWORD` |
| `401 Nicht autorisiert` | Passwort falsch oder Sonderzeichen in der URL | ohne `?key=` aufrufen und den Anmeldedialog nutzen |
| Telegram-Test: `chat not found` | Chat-ID falsch | A3 wiederholen, Secret neu setzen |
| Telegram-Test: `Unauthorized` | Token falsch | A1/A4 wiederholen, Secret neu setzen |
| Telegram-Test: `bot can't initiate conversation` | Bot nie angeschrieben | A2 nachholen |
| `willhaben antwortete mit HTTP 403` | willhaben blockt zeitweise | abwarten; kommt automatisch höchstens **eine** Meldung pro 24 h |
| `Unerwartete Antwortstruktur` | willhaben hat die API geändert | Parameter neu ermitteln (README, Abschnitt 6) |
| Testlauf findet 0 Treffer | Filter zu eng | dieselbe Suche auf willhaben.at gegenprüfen |
| Nie eine Nachricht, obwohl es Inserate gibt | Erstlauf hat alles als bekannt markiert (so gewollt) | „Duplikate zurücksetzen", oder einfach abwarten |
| Plötzlich viele Nachrichten auf einmal | Suchkriterien wurden aufgeweicht | Filter enger stellen; `MAX_NOTIFY_PER_RUN` begrenzt pro Lauf |
| Cron feuert nicht | Trigger nicht mitdeployt | `npx wrangler deploy` erneut; Dashboard → Settings → Triggers prüfen |
| `Exceeded CPU time limit` | zu viele aktive Profile | siehe „Grenzen des Free-Plans" |

Kommst du nicht weiter, liefert das hier fast immer die Antwort:

```bash
npx wrangler tail
```

Dann in einem zweiten Terminal einen Lauf auslösen:

```bash
curl -X POST "https://willhaben-watcher.roy.workers.dev/api/run?key=DEIN_PASSWORT"
```

---

## Anhang · Lokal ausprobieren, ohne zu deployen

```bash
cat > .dev.vars <<'EOF'
CONFIG_PASSWORD=lokaltest
TELEGRAM_BOT_TOKEN=8123456789:AAH…
TELEGRAM_CHAT_ID=123456789
EOF

npx wrangler dev
```

- Oberfläche: <http://127.0.0.1:8787/config?key=lokaltest>
- Cron von Hand auslösen: `curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"`

`.dev.vars` steht in `.gitignore` und wird nie eingecheckt. Der lokale Lauf
benutzt eine **eigene, lokale** KV-Kopie – deine echten Daten bleiben unberührt.
Telegram-Nachrichten gehen dabei allerdings wirklich raus.
