# Architektur V13.5

Die Einzeldatei-Anwendung bleibt erhalten: `index.html` benötigt für Kompendium und Demo keine externen JS-Dateien, Bundler oder Laufzeitpakete. Vorhandene Dateipfade, Datenbestände, Signaturen und Referenzen bleiben bestehen.

| Verantwortlichkeit | Grenze / Bestand |
|---|---|
| UI, Navigation, Karten, Atlas, Zeichnen | Bestehender Haupt-Script und `oszi-live-app` in `index.html`; DOM und Canvas bleiben dort |
| Diagnosebibliothek und Signalgenerator | Bestehende `KARTEN`, `FEHLERDB`, `GLOSSAR`, `QUELLEN`, `SIG`/W2; keine Fachinhalte entfernt |
| Messdatenverarbeitung | DOM-freier Block `oszi-live-logic` / `OsziLogic`; direkt aus der ausgelieferten Datei unter Node getestet |
| Transport-/Dateigrenze | Neuer DOM-freier Block `oszi-data` / `OsziData`: Frame-/Binärprüfung, CSV, Legacy-Aufnahmen, neutrales Messformat, Analyse-Aufruf |
| Browser-Hardwaretransport | Socket-Generation, Authentifizierung, Größenprüfung und Frameannahme in `oszi-live-app`; keine USB-Zugriffe im Browser |
| Bridge-Befehlsgrenze | `bridge_protocol.py`: ausschließlich Datenprüfung/Protokolllimits, ohne Netzwerk/USB-Nebenwirkungen |
| OWON-Adapter | `bridge.py`: dokumentierte VDS1022-API, ein Besitzer und ein Geräte-Thread, serielles Anwenden, Pufferkopien, Ressourcenfreigabe/Reconnect |
| Künftige Analyse | `OsziData.measurement()` + `OsziData.analyze(capture, analyzer)`; unabhängige Kopie an eine explizit übergebene lokale Funktion |

Dies ist eine schrittweise Entkopplung, keine neue Anwendung. Ein nächster Hardwaretreiber kann dieselben neutralen Aufnahmen liefern, ohne Fachkarten oder UI umzuschreiben. Der V13.5-Transport behält `OSZ1` und CH1/CH2; das neutrale Austauschformat unterstützt bereits Kanalnummern 1–4. Ein eigener Vierkanaltreiber muss Fähigkeiten, Takt-/Kanalsynchronität, Übertragungsformat, Fehlerfälle, Zubehör und Kalibrierung selbst implementieren und prüfen.

Für Stromzangen sind Volt/Ampere-Umrechnung und Einheiten explizit. Eine künftige Differenzialsonde kann im Zubehör beschrieben werden; aus dem Text entsteht keine elektrische Isolation oder automatische Sicherheitsfreigabe.

Aufnahmen werden bewusst nicht aneinandergehängt: ein OWON-Frame ist eine eigenständige Aufnahme mit möglichen Lücken davor/danach. `sequence`, verworfene Frames und unbestätigte Qualität dürfen nicht als lückenloses Streaming interpretiert werden. Für ein zukünftiges Dauerstreaming braucht es einen Treiber mit belastbaren Sample-Zählern, synchronen Kanalzeitstempeln und einer ausdrücklichen Gap-Repräsentation.

Die historische Agenten-Autorenpipeline unter `tools/w2/workflow-*.js` bleibt erhalten, gehört aber nicht zum Start oder zur Analyse der App. Sie wurde nicht ausgeführt. Keine API-Zugangsdaten und keine kostenpflichtige KI-Integration wurden hinzugefügt.
