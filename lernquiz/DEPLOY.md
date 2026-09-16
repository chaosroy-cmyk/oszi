# KFZ Lernquiz – Deployment auf Cloudflare Pages

Die App ist statisch (kein Build). Alles Nötige liegt in **diesem Ordner**:
`index.html`, `manifest.webmanifest`, `sw.js`, `icon*.png/svg`, `_headers`,
`_redirects`.

Wichtig: Die PWA-Funktionen (Installieren, Offline) gibt es nur über
**https** – Cloudflare Pages liefert das automatisch.

## Variante A – Direkt-Upload (am schnellsten, kein Git nötig)

1. Cloudflare-Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Upload assets**.
2. Projektname vergeben (z. B. `kfz-lernquiz`).
3. Den **Inhalt dieses Ordners** hochladen (Drag & Drop, oder das ZIP
   `kfz-lernquiz-pwa.zip` entpacken und den Ordner ziehen). `index.html`
   muss auf oberster Ebene liegen, nicht in einem Unterordner.
4. **Deploy site.** Die App ist unter `https://kfz-lernquiz.pages.dev`
   erreichbar und installierbar.

Update: gleiches Projekt → **Create new deployment** → Ordner erneut hochladen.

## Variante B – Git-Integration (Repository `chaosroy-cmyk/oszi`)

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** →
   Repository `oszi`.
2. **Production branch:** der Branch, auf dem der Ordner liegt
   (aktuell `claude/lernquiz-pwa-n0iu1q`; nach einem Merge `main`).
   Achtung: `main` enthält derzeit nur die leere Initialisierung –
   dort ist nichts zum Ausliefern.
3. Build-Einstellungen:
   - **Framework preset:** `None`
   - **Build command:** *(leer)*
   - **Build output directory:** `lernquiz`
4. **Save and Deploy.** Jeder Push auf den Branch löst ein Deploy aus.

Wird stattdessen das ganze Repository mit Output-Verzeichnis `/` deployt,
liegt das Quiz unter `https://<projekt>.pages.dev/lernquiz/` (die
`_headers` im Repo-Root enthalten dafür bereits die passenden Regeln).

## Prüfen, ob die PWA läuft

In der App unter **Fortschritt → PWA-Status** stehen die Prüfpunkte
(HTTPS, Manifest, Service Worker, Icons, Cache). Alle müssen grün sein.
Zusätzlich im Browser: DevTools → **Application → Manifest** (Installability)
und **Service Workers** (`activated`). Flugmodus → neu laden → App lädt
aus dem Cache. Auf iOS: **Teilen → Zum Home-Bildschirm**.

## Updates

Nach Änderungen `APP_VERSION` in `index.html` **und** `CACHE_NAME` in
`sw.js` gemeinsam erhöhen. Installierte Geräte bekommen dann das
Update-Banner.
