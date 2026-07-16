# Deployment – Cloudflare Pages

Das Kompendium ist eine statische PWA (kein Build-Schritt). Es besteht aus
`index.html`, `manifest.webmanifest`, `sw.js`, dem Ordner `icons/` und der
Datei `_headers` (Cloudflare-spezifische HTTP-Header).

## Variante A – Git-Integration (empfohlen, ohne Secrets)

1. Cloudflare-Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Repository `chaosroy-cmyk/oszi` auswählen.
3. Build-Einstellungen:
   - **Framework preset:** `None`
   - **Build command:** *(leer lassen)*
   - **Build output directory:** `/`
4. **Save and Deploy.**

Danach löst jeder Push auf den konfigurierten Branch automatisch ein Deploy
aus. Die Seite ist unter `https://<projekt>.pages.dev` erreichbar (eigene
Domain optional).

Die Datei `_headers` sorgt dafür, dass `sw.js` und `index.html` nicht
zwischengespeichert werden (immer aktueller Service Worker), das Manifest den
korrekten MIME-Typ `application/manifest+json` erhält und Icons lange gecacht
werden.

## Variante B – CI-Deploy über GitHub Actions (optional)

Wer lieber aus der CI deployt, nutzt `.github/workflows/deploy.yml`. Dafür in
den Repository-Secrets hinterlegen:

- `CLOUDFLARE_API_TOKEN` – Token mit der Berechtigung *Cloudflare Pages: Edit*
- `CLOUDFLARE_ACCOUNT_ID` – die Account-ID aus dem Cloudflare-Dashboard

Der Workflow lädt die statischen Dateien per `wrangler pages deploy` hoch.
Ist Variante A aktiv, wird dieser Workflow nicht benötigt.

## PWA prüfen

- Seite über die `https`-URL öffnen → in den DevTools unter **Application →
  Service Workers** sollte der SW `activated` sein.
- **Application → Manifest** zeigt Name, Icons und „Installability".
- Flugmodus/Offline → Seite neu laden: sie lädt weiterhin aus dem Cache.
- Auf Android/Desktop erscheint die Install-Leiste bzw. das Browser-eigene
  Installationsangebot; auf iOS über *Teilen → Zum Home-Bildschirm*.

## Cache-Version bei Updates erhöhen

Nach inhaltlichen Änderungen in `sw.js` die Konstante `CACHE`
(z. B. `kfzoszi-v2-2026-07-16`) hochzählen, damit installierte Clients die
neue Version ziehen.
