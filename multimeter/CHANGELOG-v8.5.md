# CHANGELOG v8.5-Profi

**v8.5 = v8.4 plus die Befunde des externen Audits vom 09.08.2026.**

Warum eine eigene Version und kein stiller Nachschub in v8.4: Der erste
v8.4-Stand wurde bereits als Zip ausgeliefert. Wären die Korrekturen unter
demselben `CACHE_NAME` nachgeschoben worden, hätte **keine bestehende
Installation sie je bekommen** — der Service Worker erkennt ein Update am
geänderten Cachenamen, nicht am Dateiinhalt. Genau davor warnt die
Versionierungsregel im README. Deshalb `kfz-multimeter-profi-v8-5`.

Fachliche Inhalte, Kartenzahl und Quellenmatrix sind gegenüber v8.4
**unverändert**: 77 Prüfkarten, 15 Diagnosebäume, Inhaltsstand 09.08.2026.
Geändert wurde ausschließlich Verhalten und Darstellung.

---

Ein externes Audit meldete eine Update-Schleife. Der gemeldete Ablauf
(v8.2 → v8.4, Banner bleibt nach dem Reload stehen) ließ sich mit den in
diesem Repository vorhandenen Vorgängern **nicht** reproduzieren: v8.1, v8.2.1
und v8.3 aktualisieren jeweils mit einem Klick, einem Reload, verschwindendem
Banner und getauschtem Cache. Die zugrunde liegende Analyse war trotzdem
richtig — die Schwachstelle liegt im Umgang mit einem nicht identifizierbaren
wartenden Worker. Zwei Fehler wurden dabei gefunden, einer davon belegt.

### 1 · `considerUpdate()` bot nicht identifizierbare Worker an

Antwortete ein wartender Worker nicht auf `GET_VERSION` (Alt-Build oder
verwaiste Registrierung) **und** war auch der Controller nicht auslesbar, fiel
die Logik bis `showUpdate()` durch. Ein Klick hätte dann möglicherweise eine
ältere Fassung aktiviert, woraufhin die neuere erneut installiert und erneut
angeboten worden wäre — genau die beschriebene Schleife.

Die Kette lautet jetzt: passender Controller **und** nichts Identifizierbares
daneben → Endzustand; gleiche Version auf beiden Seiten → kein Update;
Kandidat antwortet nicht → **nicht anbieten**; erst danach `showUpdate()`.

Bewusst **nicht** übernommen wurde der Vorschlag, jeden passenden Controller
unbedingt als Endzustand zu behandeln. Das hätte auch ein echtes, neueres
Update unterdrückt, sobald Seite und Controller zueinander passen — also jedes
künftige Release. Die erste Bedingung prüft deshalb zusätzlich, dass daneben
nichts Identifizierbares wartet.

### 2 · Die Sicherungsmarke verglich die falsche Version — belegt

`sessionStorage.setItem('kfz-update-applying', APP_VERSION)` wurde von der
**alten** Fassung geschrieben, der Vergleich nach dem Reload aber gegen die
Version der **neuen** Fassung geführt. Bei einem echten Upgrade können beide
nie gleich sein: Der Aufräumschritt, der ein stehengebliebenes Banner schließen
sollte, lief also nie, und der Schlüssel blieb die ganze Sitzung liegen.

Im Test v8.4 → v8.5 nachgewiesen: nach dem Update stand
`kfz-update-applying = "8.4-Profi"` unverändert im `sessionStorage`. Jetzt wird
eine versionsunabhängige Marke geschrieben, nach dem Reload entfernt und das
Altbanner geschlossen. Nachgemessen: Schlüssel danach `null`.

### 3 · iPhone: Notausstieg, wenn `controllerchange` ausbleibt

WebKit meldet `controllerchange` nicht in jedem Fall zuverlässig. Ohne
Absicherung bliebe der Knopf dauerhaft auf „Lädt…", das Banner wäre
ausgeblendet und das Update käme nie an — ein Sackgassenzustand ausgerechnet
auf der Plattform, die keinen automatischen Installationsweg hat. Nach sechs
Sekunden ohne Rückmeldung lädt die Seite jetzt selbst neu und holt den bereits
aktivierten Worker.

### 4 · Zwei iPhone-Anzeigefehler

- **Der Bestätigungs-Toast verdeckte den Installationshinweis.** Beide liegen
  über der Navigation. Auf dem iPhone fällt das beim Erststart zusammen — genau
  dann, wenn der Installationshinweis zählt. Der Toast misst jetzt die
  tatsächliche Bannerhöhe und rückt darüber.
- **`<b>` im Hinweistext wurde als Blockelement gerendert** (die Regel galt dem
  Titel darüber) und zerriss den Satz in Einzelzeilen. Dieser Fehler bestand
  bereits vorher und war nur auf iOS sichtbar, weil nur dort dieser Text
  erscheint.

### 5 · Installationshinweis für alle iOS-Browser

Bisher nur für Safari. Chrome, Firefox und Edge auf dem iPhone laufen ebenfalls
auf WebKit, kennen also kein `beforeinstallprompt` — ihre Nutzer sahen gar
keinen Installationsweg. Jetzt erhalten sie einen an den Browser angepassten
Hinweis. Der Text nennt zusätzlich den Grund: Ohne Installation gilt in Safari
die 7-Tage-Löschfrist für Websitedaten, nach der Offline-Cache und Merkliste
verschwinden.

### 6 · Aufgeräumt

14 `PRÜFEN`-Marker aus dem Produktionscode entfernt und durch Aussagen ersetzt,
die den Sachverhalt benennen statt offene Arbeit zu suggerieren. Zwei davon
verwiesen auf eine `REVIEW.md`, die in dieser Linie nie existiert hat — die
Verweise zeigen jetzt auf `SOURCES.md`.

Validator: 147 → **153 Prüfungen**, sechs davon sichern den Updatepfad ab.

## Version

`APP_VERSION = 8.5-Profi` ↔ `APP_CACHE_NAME` ↔ `CACHE_NAME =
kfz-multimeter-profi-v8-5` ↔ Paket `8.5.0`.

Der Inhaltsstand bleibt bewusst auf **09.08.2026**: An Sollwerten, Karten und
Quellen wurde nichts geändert. Version und Inhaltsstand sind zwei verschiedene
Angaben, und dieser Release ist genau der Fall, für den die Trennung existiert.

## Reproduzierbar getestet

| Pfad | Ergebnis |
|---|---|
| v8.1 → v8.5 | ein Klick, ein Reload, Banner weg, Cache getauscht |
| v8.2.1 → v8.5 | ebenso |
| v8.3 → v8.5 | ebenso |
| v8.4 → v8.5 | ebenso, `sessionStorage` danach leer |

Dazu Offline-Neustart mit 77 Karten, `offline.html` aus dem Cache,
Nutzungshinweis-Zyklus, iPhone-Darstellung bei 390 × 844, keine Touchziele
unter 44 px bei 360 × 640, kein horizontaler Überlauf, 0 Konsolenfehler.
Validator: **153 Prüfungen**.

## Restrisiko

Unverändert gegenüber v8.4, mit einer Ergänzung: Getestet wurde mit
iPhone-Viewport, Touch-Emulation und iOS-Kennung **in Chromium**. Das prüft die
Code-Pfade, nicht die WebKit-Eigenheiten. Ein Test auf einem realen iPhone
bleibt vor dem Livegang erforderlich — insbesondere für den Notausstieg bei
ausbleibendem `controllerchange`, der genau eine WebKit-Schwäche abfängt, die
sich in Chromium nicht nachstellen lässt.
