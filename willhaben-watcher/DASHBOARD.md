# Einrichten ohne Terminal (Cloudflare-Dashboard)

Wenn du Wrangler und die Kommandozeile umgehen willst: der ganze Worker steckt
in **einer einzigen Datei**, die du im Cloudflare-Dashboard einfügst.
Alles Weitere sind Klicks.

**Die Datei:** [`dashboard/worker.js`](dashboard/worker.js) (rund 95 KB) –
enthält bereits alles: Suchlogik, Telegram-Anbindung, PLZ-Tabelle und die
komplette `/config`-Oberfläche. Keine weiteren Dateien, keine Abhängigkeiten.

> **Was nicht geht:** den Projektordner irgendwo hochladen. Cloudflare erwartet
> ein fertig gebautes JavaScript-Bündel, kein TypeScript-Projekt. Und
> Cloudflare **Pages** (das mit dem Ordner-Hochladen) kann keine Cron-Trigger –
> das hier muss ein **Worker** sein.

---

## Schritt 1 · Worker anlegen

1. [dash.cloudflare.com](https://dash.cloudflare.com) öffnen.
2. Links **Workers & Pages** (in neueren Oberflächen: **Compute → Workers**).
3. **Create** → Reiter **Workers** → **Start with Hello World!** (oder
   „Hello World"-Vorlage) → **Get started**.
4. Als Namen `willhaben-watcher` eintragen → **Deploy**.

Du hast jetzt einen leeren Worker unter
`https://willhaben-watcher.<deine-subdomain>.workers.dev`.
Beim allerersten Worker fragt Cloudflare nach dieser Subdomain – such dir eine aus.

## Schritt 2 · Code einfügen

1. Beim Worker auf **Edit code** (Symbol `</>`, teils unter *Deployments*).
2. Im Editor **alles markieren** (Strg + A bzw. Cmd + A) und **löschen**.
3. Den kompletten Inhalt von `dashboard/worker.js` einfügen.
4. Oben rechts **Deploy** → bestätigen.

Es darf danach keine rote Fehlermeldung im Editor stehen. Der Worker läuft
jetzt schon, kann aber noch nichts – ihm fehlen Datenbank und Zugangsdaten.

**Test:** `https://willhaben-watcher.<subdomain>.workers.dev/health` im Browser
öffnen → dort muss `ok` stehen.

## Schritt 3 · KV-Datenbank anlegen und verbinden

Hier landen deine Suchprofile und die Merkliste gesehener Inserate.

1. Links **Storage & Databases** → **KV** (ältere Oberfläche: *Workers & Pages
   → KV*).
2. **Create instance** / **Create a namespace** → Name z. B.
   `willhaben-watcher-WATCHER` → **Add**.
3. Zurück zum Worker → **Settings** → **Bindings** (ältere Oberfläche:
   *Variables → KV Namespace Bindings*).
4. **Add binding** → Typ **KV namespace** wählen:
   - **Variable name:** `WATCHER` ← **exakt so, groß geschrieben**
   - **KV namespace:** den eben angelegten auswählen
5. **Deploy** / **Save**.

Der Name `WATCHER` ist nicht frei wählbar – unter genau diesem Namen sucht der
Code die Datenbank. Ein Tippfehler hier führt später zu `undefined is not an
object`.

## Schritt 4 · Zugangsdaten hinterlegen

Beim Worker → **Settings** → **Variables and Secrets** → **Add**.
Dreimal, jeweils **Type: Secret** (nicht „Text"!):

| Name | Wert |
|---|---|
| `TELEGRAM_BOT_TOKEN` | der Token von @BotFather |
| `TELEGRAM_CHAT_ID` | deine Chat-ID (z. B. von @userinfobot) |
| `CONFIG_PASSWORD` | selbst ausgedachtes Passwort für die `/config`-Seite |

Nach jedem Eintrag **Save** / **Deploy**. „Secret" bedeutet: der Wert ist
danach nicht mehr sichtbar, nur überschreibbar – so soll es sein.

Die Namen müssen **exakt** so geschrieben sein, Großbuchstaben inklusive.

## Schritt 5 · Zeitplan einrichten

Beim Worker → **Settings** → **Trigger Events** (ältere Oberfläche: *Triggers*)
→ **Add** → **Cron Trigger**:

```
*/15 * * * *
```

→ **Add** / **Save**. Damit läuft die Suche alle 15 Minuten.

## Schritt 6 · Fertig, jetzt einstellen

Im Browser öffnen:

```
https://willhaben-watcher.<deine-subdomain>.workers.dev/config?key=DEIN_CONFIG_PASSWORD
```

1. **„Telegram testen"** → es muss eine Testnachricht in Telegram ankommen.
2. Suchkriterien am Profil einstellen → **Speichern**.
3. **„Testlauf"** → zeigt an, was gerade gefunden würde, ohne etwas zu senden.
4. **„Jetzt ausführen"** → der erste Lauf markiert alle aktuellen Treffer als
   bekannt und meldet das kurz. Ab dann kommt nur noch Neues.

---

## Optional · Betriebsparameter

Nur nötig, wenn du von den Vorgaben abweichen willst. Unter *Settings →
Variables and Secrets*, diesmal als **Type: Text**:

| Name | Vorgabe im Code | Bedeutung |
|---|---|---|
| `SEARCH_ROWS` | `30` | Inserate pro Profil und Lauf |
| `MAX_NOTIFY_PER_RUN` | `10` | Einzelnachrichten pro Profil und Lauf |
| `SEEN_TTL_DAYS` | `30` | Merkdauer für gesehene Inserate |

Ohne Eintrag gelten die Vorgaben – du musst hier nichts anlegen.

## Wenn etwas nicht klappt

Beim Worker auf **Logs** → **Begin log stream**, dann in einem zweiten Tab
`/config` aufrufen oder „Jetzt ausführen" drücken. Die Fehlermeldung steht
dort im Klartext.

| Symptom | Ursache |
|---|---|
| `/health` liefert nichts | Code nicht vollständig eingefügt oder nicht deployt |
| `CONFIG_PASSWORD ist nicht gesetzt` | Schritt 4 fehlt |
| `401 Nicht autorisiert` | falsches Passwort in der URL |
| Fehler mit `WATCHER` / `undefined` | Binding aus Schritt 3 fehlt oder heißt anders |
| Cron läuft nie | Schritt 5 fehlt |

---

## Nachteil dieses Wegs

Änderst du später etwas am Code, musst du `dashboard/worker.js` neu erzeugen
und erneut einfügen. Mit Wrangler wäre es ein `npx wrangler deploy`.
Für reine **Suchkriterien**-Änderungen gilt das nicht – die machst du auf
`/config`, dafür wird nie etwas neu hochgeladen.

Die Datei neu bauen (falls du den Code doch mal änderst):

```bash
npm run build:single
```

## Mittelweg: automatisch aus GitHub bauen

Wenn du das Terminal meiden, aber Änderungen trotzdem automatisch ausrollen
willst, kann Cloudflare direkt aus dem Repository bauen:

1. Vorher in GitHub die Datei `willhaben-watcher/wrangler.toml` bearbeiten
   (Stift-Symbol im Browser genügt) und bei `id =` die echte KV-Namespace-ID
   aus Schritt 3 eintragen.
2. Im Dashboard **Workers & Pages → Create → Workers → Import a repository**,
   Repository auswählen.
3. Als **Root directory** `willhaben-watcher` angeben, Build-Befehl
   `npm install`, Deploy-Befehl `npx wrangler deploy`.
4. Secrets wie in Schritt 4 im Dashboard setzen.

Danach löst jeder Push auf den Branch ein neues Deployment aus.
