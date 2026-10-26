# V13.5.1 – Zeitzoom bei gestoppter Aufnahme

## Bedienung

1. Signal aufnehmen und **Stop** drücken oder eine **Single**-Aufnahme abwarten.
2. Die bisherige Zeitbasis-Auswahl oben am Schirm oder unter **Bedienung → Zeit** ändern. Kleine Werte vergrößern den zeitlichen Ausschnitt.
3. Mit **Ausschnitt** das Fenster nach links/rechts innerhalb der Aufnahme verschieben.
4. Herauszoomen endet an der vorhandenen Aufnahmelänge. Die Auswahl wird auf die tatsächlich darstellbare Zeitbasis angepasst. Die Hinweiszeile nennt gesamte Aufnahme, sichtbare Dauer und Samplezahl.
5. Mit **Run** fortsetzen oder **Single** neu aufnehmen. Erst jetzt wird eine geänderte Zeitbasis für die nächste Aufnahme an die Bridge geschickt.

Die Probe-/Zangenfaktoren und das ursprüngliche Abtastintervall bleiben beim Zeitzoom unverändert. Beide Kanäle werden synchron ausgeschnitten. Der Zoom erzeugt weder weitere Samples noch zusätzliche Bandbreite. Frequenz-/Tastgrad-Messungen können bei einem zu kurzen Ausschnitt weiterhin „–“ anzeigen; die Messungen beziehen sich auf die sichtbaren Daten.

CSV und „Messdaten JSON“ exportieren den sichtbaren Ausschnitt. Die ursprüngliche eingefrorene Aufnahme bleibt bis zum Fortsetzen/Wechsel erhalten, sodass Herauszoomen die Samples wieder zugänglich macht. Bibliotheks-Aufnahmen lassen sich ebenfalls zoomen; beim Verlassen der Wiedergabe werden die bisherigen Live-Einstellungen wiederhergestellt.

Bei Hardware wird die gesamte letzte unabhängige Geräteaufnahme eingefroren. Beim kontinuierlichen Demo-Signal wird das aktuelle sichtbare Fenster eingefroren. Separate Hardwareaufnahmen werden weiterhin nicht zusammengeklebt.

## Fehlerursache und Änderung

Der bisherige Change-Handler für `lv-tdiv` rief grundsätzlich `resetAcquisition()` auf und schickte `timebase` an die Bridge. Im Stop-Zustand wurden die Puffer dadurch gelöscht, während neue Frames absichtlich verworfen wurden. Das Zeitfenster war anschließend leer.

Jetzt sind Aufnahmekonfiguration und Anzeigezeitbasis getrennt. Ein eingefrorener Snapshot hält Rohdaten, dt und Zoom-Anker. Die Fensterauswahl verwendet dieselben unveränderten Samples. Der ursprüngliche Bereich ist die Begrenzung für Zoom/Pan. Beim Fortsetzen wird eine geänderte Aufnahmezeitbasis vor Run/Single angewendet. FFT-Cache, Messwerte und Referenzausrichtung werden bei Ausschnittänderungen invalidiert, das Nachleuchten des alten Maßstabs wird gelöscht.

## Verifikation, 26. Oktober 2026

- Ein neuer echter Browser-Regressionsfall scheiterte vor der Änderung an einer leeren Aufnahme nach dem Zeitbasiswechsel. Nach der Korrektur besteht er.
- Zwei simulierte Hardwarekanäle mit jeweils 5.000 Samples und dt=2 µs: Stop, Zoom auf 500 Samples, Pan, Zoom zurück und byte-/wertgleiche Wiederherstellung der ursprünglichen Kanalwerte.
- Während Zoom/Pan keine gesendeten Gerätebefehle; beim anschließenden Run genau ein neuer Zeitbasisbefehl, danach weitere Frames mit dem neuen dt.
- Single, kontinuierliche Demo, Bibliotheks-Wiedergabe und Zeitbasisänderung vor dem ersten Frame getestet.
- Oberer und unterer Zeitbasisregler bleiben synchron. Zoom/Pan begrenzen sich auf die verfügbaren Samples; einzelne Spitzen am Aufnahmerand bleiben erhalten.
- Gesamtprüfung: 39 ursprüngliche Logiktests + 11 ursprüngliche Engine-Tests + 32 weitere Node-Tests + 18 Python-Tests + 8 Browsertests = **108 bestanden**, keine fehlgeschlagenen/übersprungenen/deaktivierten Tests.
- Zusätzlich: Bibliotheksvalidierung aller 82 Karten, 1.087 Kartenbilder und 45 Erklär-/Fehlermusterbilder, Public-Build und ZIP-Prüfsummen.

Befehle: `npm test`, `npm run test:python`, `CHROME_PATH=/usr/bin/chromium npm run test:browser`, `CHROME_PATH=/usr/bin/chromium npm run validate`, `bash build-dist.sh`, `python3 tools/package-release.py`.

Neue Funktion unter Linux/Chromium mit simulierter Bridge geprüft. Ein Test dieses Patches mit dem realen OWON unter Windows steht noch aus. Die bisherigen Anwenderfotos zeigen den Hardwarebetrieb der V13.5, nicht die Validierung des neuen Zeitzooms.

## Status der Defender-Meldung

Die zuvor gemeldete Erkennung der V13.5 (`Trojan:Script/Ulthar.A!ml`) ist weiterhin ungeklärt. V13.5.1 ist ein dokumentierter Funktionspatch, keine unabhängige Virenfreigabe. Keine Schutzmaßnahmen oder Codeprüfungen wurden zum Umgehen einer Erkennung entfernt. Das beanstandete Originalarchiv V13.5 bleibt unverändert; der Patch erhält eine eigene Version und einen eigenen Dateinamen.
