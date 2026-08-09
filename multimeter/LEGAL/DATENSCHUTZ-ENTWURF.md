# Datenschutzhinweis — ENTWURF

> **Nicht veröffentlichen.** Offen ist die Angabe des Verantwortlichen (siehe
> `IMPRESSUM-ENTWURF.md`). Der inhaltliche Teil ist vollständig und im Code belegt.

## Kurzfassung

Die App sendet keine Nutzungsdaten. Sie hat keine Analyse, keine Werbung, keine
Fremdinhalte, kein Konto und keine Anmeldung. Alles, was gespeichert wird, bleibt
im Browser des Geräts.

**Eine Einschränkung, die dazugehört:** Das Herunterladen der App ist selbst ein
Aufruf im Netz. Der Hostinganbieter sieht diesen Aufruf und verarbeitet dabei
üblicherweise IP-Adresse, Zeitpunkt und technische Angaben des Browsers.
Das ist keine Datenübermittlung durch die App, aber es ist Datenverarbeitung, und
sie gehört benannt. Nach dem einmaligen vollständigen Laden funktioniert die App
offline; dann entstehen keine weiteren Aufrufe mehr.

## Codebeleg (Stand v8.4-Profi, geprüft am Auslieferungsstand)

Nachgeprüft wurde der gesamte Produktionscode — `index.html`, `sw.js`,
`offline.html`, `manifest.webmanifest`:

| Prüfung | Ergebnis |
|---|---|
| Absolute `http(s)`-URLs im Produktionscode | Genau eine: `http://www.w3.org/2000/svg`. Das ist eine XML-Namensraum-Kennung innerhalb eines Inline-SVG, **kein Netzwerkaufruf** — der Browser ruft sie nicht ab. |
| `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` | Nur zwei `fetch`-Aufrufe, beide im Service Worker, beide hinter der Prüfung `if (url.origin !== self.location.origin) return;` — also ausschließlich zur eigenen Herkunft. |
| Externe `src`/`href` (Skripte, Stylesheets, Schriften, Bilder) | Keine. Alle Verweise sind relativ auf eigene Dateien; CSS und JavaScript stehen inline in `index.html`. Als Schriften werden ausschließlich Systemschriften verwendet. |
| Cookies | Keine. |
| Standort, Kamera, Mikrofon, Kontakte, Zwischenablage | Werden nicht angefordert. |

Diese Prüfung ist als Validator-Regression hinterlegt (`validate.js`, Abschnitt
„Keine externen Netzwerkanfragen"), damit die Aussage bei künftigen Änderungen
nicht stillschweigend unrichtig wird.

## Was lokal gespeichert wird

Ablage im `localStorage` des Browsers, gebunden an die Herkunft der App. Diese
Daten verlassen das Gerät nicht und werden von der App nirgendwohin übertragen.

| Schlüssel | Inhalt | Zweck |
|---|---|---|
| `mm_favs` | Liste von Karten-Kennungen der Merkliste | Merkliste bleibt nach dem Schließen erhalten |
| `mm_beginner` | `1` oder nicht gesetzt | Einsteiger-Modus ein- oder ausgeschaltet |
| `mm_hinweis_ok` | `1` oder nicht gesetzt | Nutzungshinweis wurde bestätigt und erscheint nicht erneut von selbst |
| `ib_dismissed` | `1` oder nicht gesetzt | Installationsbanner wurde weggetippt |

Zusätzlich legt der Browser die App-Dateien im **Cache Storage** unter dem Namen
`kfz-multimeter-profi-v8-4` ab. Das sind ausschließlich Programmdateien und
Bilder der App, keine Nutzungsdaten. Ohne diesen Cache wäre kein Offlinebetrieb
möglich.

Während eines Updatevorgangs wird kurzzeitig ein Eintrag im `sessionStorage`
gesetzt (`kfz-update-applying`), damit nach dem Neuladen die passende Meldung
erscheint. Er wird beim Schließen des Browsertabs automatisch verworfen.

## Löschen

- **Alles auf einmal:** In den Browsereinstellungen die Websitedaten für die
  Adresse der App löschen. Danach ist die App im Auslieferungszustand; Merkliste
  und Bestätigung sind weg, und beim nächsten Öffnen wird sie neu geladen.
- **Nur die Merkliste:** Einträge in der App einzeln über den Stern entfernen.
- **Als installierte App:** Deinstallieren entfernt die gespeicherten Daten
  ebenfalls; der genaue Ablauf hängt vom Betriebssystem ab.

## Offene Punkte vor der Veröffentlichung

- [ ] Verantwortlicher im Sinne der DSGVO — hängt an der Impressumsentscheidung
- [ ] Angaben des tatsächlich gewählten Hostinganbieters (Serverstandort,
      Speicherdauer der Zugriffsprotokolle, Auftragsverarbeitung)
- [ ] Falls der Rückmeldeweg über `mailto:` oder ein fremdes Formular umgesetzt
      wird: Dieser Abschnitt ist dann zu ergänzen — siehe `RUECKMELDEWEG.md`
- [ ] Betroffenenrechte und Kontaktadresse für Auskunftsersuchen
