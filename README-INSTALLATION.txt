KFZ-Oszi PWA installieren

Inhalt:
- index.html
- manifest.webmanifest
- service-worker.js
- icons/

Wichtig:
Eine PWA funktioniert vollständig erst über HTTPS oder localhost.
Zum Testen lokal:
1. Ordner entpacken
2. Im Ordner starten: python3 -m http.server 8000
3. Browser öffnen: http://localhost:8000

Online:
Den kompletten Ordnerinhalt auf Cloudflare Pages, Netlify, GitHub Pages oder einen HTTPS-Webserver hochladen.
Dann im Handy-Browser öffnen und „Zum Startbildschirm hinzufügen“ / „App installieren“ wählen.

UPDATE-VERHALTEN (ab v4):
Die App prüft beim Öffnen und bei jeder Rückkehr automatisch auf eine neue
Version. Liegt eine vor, erscheint unten ein grünes Banner
"Neue Version des Kompendiums verfügbar" mit dem Knopf "Aktualisieren".
Ein Tipp darauf übernimmt die neue Version und lädt die App einmal neu.
Für Herausgeber: Bei jeder neuen Version nur die Versionsnummer in
service-worker.js erhöhen (v4 -> v5 ...), Dateien auf den Server legen, fertig.
