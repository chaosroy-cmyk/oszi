LIVE-MODUS (OWON VDS1022I) – Kurzanleitung
==========================================

OHNE GERÄT (Demo):
  Seite öffnen -> Kapitel "Live" -> "Demo (Mock)".
  Der Mock speist den Generator der gewählten Messkarte (mit Rauschen)
  als Live-Signal ein. Overlay, Metriken und Bibliothek voll nutzbar.

MIT GERÄT:
  1) pip install websockets numpy
  2) Repo klonen: github.com/florentbr/OWON-VDS1022
     pip install <repo>/api/python        (Modul "vds1022")
  3) python bridge.py                     (ws://localhost:8765)
  4) PWA lokal ausliefern, z. B.:  python -m http.server 8080
     -> http://localhost:8080  öffnen (Service Worker + WebSocket ok)
  5) Kapitel "Live" -> Verbinden.

  Hinweis Cloudflare-Deployment: Eine über HTTPS geladene Seite darf je
  nach Browser kein ws://localhost öffnen (Mixed Content). Für den
  Live-Betrieb die Seite lokal über http://localhost öffnen; die
  Online-Version bleibt fürs Kompendium und den Demo-Modus.

  Masse: Beide Kanäle des VDS1022 teilen sich eine Masse -> beide
  Massekrokos immer auf dasselbe Potenzial (README des Treibers).

PROTOKOLL (bridge.py):
  JSON-Frames; automatisch Binärframes (OSZ1-Header + Float32) sobald
  RTT > 100 ms, erzwingbar mit --binary on. Kommandos: channel,
  timebase, trigger, run/stop/single. Reconnect-sicher: Gerät ab-/
  anstecken wird als Status gemeldet, Server läuft weiter.
  Das Gerät läuft immer im Sweep AUTO (ab V13.2): Der Standard der
  vds1022-Lib ist ONCE (Einzelschuss) - damit nahm das Gerät nach jedem
  Befehl nur ein Bild auf und die Kurve blieb stehen. Run/Stop/Single
  entscheidet die Bridge (Single = nächstes vollständiges Bild), die
  Anzeige triggert in der App per Software (Trigger-Pegel/Flanke).

  Anzeige = eine Aufnahme (ab V13.2): Die Bridge stellt die Samplerate so
  ein, dass eine Geräte-Aufnahme (5000 Punkte) genau die 10 Divisionen
  füllt, und legt den Geräte-Trigger auf die Trigger-Position der App
  (10/20/50/80 %). Die App zeigt die letzte Aufnahme direkt, ohne zwei
  Aufnahmen aneinanderzusetzen (vorher: Pulsbreiten sprangen an der Naht).
  Bildrate: --fps 20 (Standard); bei Rucklern am PC --fps 10 versuchen.

  Messbereich (ab V13.2): Die Lib erwartet als "range" die Spannung am
  Tastkopf für 10 Divisionen. Die Bridge rechnet V/div × 10 (Grenzen des
  Geräts 50 mV…50 V je 10 Div, mal Tastkopffaktor). Vorher wurde V/div
  als Gesamtbereich übergeben: 2 V/div ergab ±1 V, ein 5-V-Testsignal
  lief bei 1,00 V in die Begrenzung. Die Werte der Lib sind bereits Volt
  am Tastkopf, deshalb meldet der Header probe [1,1].

STÖRUNG "Kurve läuft kurz an und bleibt stehen":
  bridge.py aktualisieren (Sweep AUTO, s. o.). Bleibt es dabei: Log der
  Bridge prüfen (Warnung "set_trigger ohne sweep-Parameter" = alte Lib,
  dann vds1022 aus dem Repo neu installieren).

TESTS:
  node tests/live-logic.test.js
  (extrahiert die Rein-Logik direkt aus index.html, DOM-frei)

BIBLIOTHEK:
  Aufnahmen (Rohdaten + Metadaten) liegen in IndexedDB "oszi-live",
  offline verfügbar. Export/Import als JSON (Float32 base64-codiert).
  "Als Referenz der Karte" macht eine Aufnahme im Referenz-Dropdown
  der gewählten Karte als Overlay-Quelle verfügbar.

AUTO-SETUP (ab v6):
  Kartenwahl im Live-Tab uebernimmt die Oszi-Einstellungen der Messkarte
  automatisch (V/div, Zeitbasis, Kopplung, Tastkopf, Trigger-Flanke/-Pegel,
  CH2 an/aus) - in die Anzeige UND per Kommando an die Bridge/das Geraet.
  Abschaltbar ueber "automatisch bei Kartenwahl"; manuell jederzeit ueber
  "Karten-Setup uebernehmen". Bei Bereichsangaben (z. B. "1-2 V/div") wird
  das obere Ende gewaehlt (kein Clipping), bei der Zeitbasis die erste
  Angabe. Stromzangen-Karten setzen V/div bewusst NICHT automatisch -
  Hinweiszeile nennt den Grund (Zangenfaktor).

MEHR EINSTELLUNGEN (ab v8):
  Pro Kanal: Position (+-4 div), Invertieren, Zangenfaktor
  (1/10/100 mV/A -> Anzeige, Messwerte und Cursor in Ampere).
  Trigger-Position 10/20/50/80 % (Pre-Trigger-Anteil im Bild).
  Nachleuchten kurz/lang: vorherige Durchlaeufe bleiben als blasse
  Spur stehen - ideal fuer sporadische Aussetzer.
  Messwerte-Zeile unter dem Scope: Vpp/Min/Max/Mittel/RMS je Kanal.
  PNG-Screenshot und CSV-Export (Rohwerte in Volt) der aktuellen Kurve.
  Hinweis: Der Trigger-Pegel bezieht sich immer auf das Rohsignal in
  Volt (Geraeteseite), auch wenn die Anzeige per Zangenfaktor in A laeuft.
