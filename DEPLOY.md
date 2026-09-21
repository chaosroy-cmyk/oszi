# Deployment – Cloudflare Pages

Das Kompendium ist eine statische PWA (kein Build-Schritt für die App selbst).
Die auszuliefernden Dateien sind `index.html`, `manifest.webmanifest`,
`service-worker.js`, der Ordner `icons/`, die Zweit-App `multimeter/` und die
Datei `_headers` (Cloudflare-spezifische HTTP-Header).

> **Wichtig – Deploy-Hygiene:** Das Repo enthält auch **nicht-öffentliche**
> Dateien: `bridge.py`, `tests/`, `start-live.cmd`/`stop-live.cmd`, die `*.txt`-
> Readmes, `PROMPT_V10.md`, `DEPLOY.md`/`README.md`, `tools/`. Diese dürfen
> **nicht** auf die Live-Seite. Deshalb wird **nicht** der Repo-Root deployt,
> sondern das per `build-dist.sh` erzeugte Verzeichnis **`dist/`** (Whitelist).

## Variante A – Git-Integration (empfohlen, ohne Secrets)

1. Cloudflare-Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Repository `chaosroy-cmyk/oszi` auswählen.
3. Build-Einstellungen:
   - **Framework preset:** `None`
   - **Build command:** `bash build-dist.sh`
   - **Build output directory:** `dist`
4. **Save and Deploy.**

Danach löst jeder Push auf den konfigurierten Branch automatisch ein Deploy
aus. Die Seite ist unter `https://<projekt>.pages.dev` erreichbar (eigene
Domain optional).

Die Datei `_headers` (wird von `build-dist.sh` nach `dist/` kopiert) sorgt
dafür, dass `service-worker.js` und `index.html` nicht zwischengespeichert
werden (immer aktueller Service Worker), das Manifest den korrekten MIME-Typ
`application/manifest+json` erhält und Icons lange gecacht werden.

## Variante B – CI-Deploy über GitHub Actions (optional)

Wer lieber aus der CI deployt, nutzt `.github/workflows/deploy.yml` (baut
`dist/` per `build-dist.sh` und lädt es per `wrangler pages deploy dist` hoch).
Dafür in den Repository-Secrets hinterlegen:

- `CLOUDFLARE_API_TOKEN` – Token mit der Berechtigung *Cloudflare Pages: Edit*
- `CLOUDFLARE_ACCOUNT_ID` – die Account-ID aus dem Cloudflare-Dashboard

Der Workflow triggert auf Push nach `main`. Ist Variante A aktiv, wird dieser
Workflow nicht benötigt.

## Live-Modus (nicht Teil des Deploys)

Der USB-Live-Modus (OWON VDS1022I) läuft lokal über `bridge.py`
(`ws://localhost:8765`) und wird **nicht** deployt – siehe `README-LIVE.txt`.
Die deployte PWA nutzt ohne Bridge automatisch den Mock/Demo-Modus.

## PWA prüfen

- Seite über die `https`-URL öffnen → in den DevTools unter **Application →
  Service Workers** sollte der SW `activated` sein.
- **Application → Manifest** zeigt Name, Icons und „Installability".
- Flugmodus/Offline → Seite neu laden: sie lädt weiterhin aus dem Cache.
- Auf Android/Desktop erscheint die Install-Leiste bzw. das Browser-eigene
  Installationsangebot; auf iOS über *Teilen → Zum Home-Bildschirm*.

## Cache-Version bei Updates erhöhen

Nach inhaltlichen Änderungen die Konstante `CACHE_NAME` in `service-worker.js`
(Schema `kfz-oszi-pwa-signed-803792f7bb4a6c59-vN`, aktuell **…-v10**)
hochzählen **und** den Footer „Stand vN" in `index.html` anpassen — sonst
erscheint bei installierten Clients kein „Update verfügbar"-Banner.
