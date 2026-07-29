# Betrieb über GitHub (ohne Cloudflare)

Der Watcher läuft direkt in diesem Repository als GitHub Action. Kein
Cloudflare-Konto, keine Datenbank, kein Terminal.

Was du einmalig tust: **zwei Werte eintragen.** Alles andere ist fertig.

```
GitHub Action (alle 15 Min)  →  suchprofile.json  →  willhaben  →  neu?  →  Telegram
                                                          ↓
                                          state/watcher-state.json (Merkzettel)
```

---

## Schritt 1 · Die zwei Zugangsdaten hinterlegen

Im Repository oben auf **Settings** → links **Secrets and variables** →
**Actions** → grüner Knopf **New repository secret**.

Zweimal ausfüllen:

| Name (exakt so) | Wert |
|---|---|
| `TELEGRAM_BOT_TOKEN` | der Token von @BotFather, z. B. `8123456789:AAH…` |
| `TELEGRAM_CHAT_ID` | deine Chat-ID, z. B. `123456789` |

Die Chat-ID bekommst du am einfachsten, indem du in Telegram
**@userinfobot** anschreibst – er antwortet mit `Id: 123456789`.

Und nicht vergessen: **deinem eigenen Bot einmal `/start` schicken**, sonst darf
er dir nichts senden. Er antwortet darauf nicht – das ist richtig so.

## Schritt 2 · Sofort ausprobieren

Oben auf **Actions** → links **willhaben-Watcher** → rechts
**Run workflow** → Häkchen bei *Testlauf* setzen → **Run workflow**.

Nach etwa einer Minute auf den Lauf klicken und unter *Suche ausführen*
nachsehen. Dort steht dann so etwas:

```
2 Suchprofil(e), davon 2 aktiv · Testlauf
  • Q7 im Umkreis: 30 geladen, 6 passend, 6 neu, 0 gesendet
      Audi Q7 3.0 tdi Quatro (€ 7.600, BJ 2008)
      …
```

Beim Testlauf wird **nichts** gesendet und **nichts** gemerkt – er zeigt nur,
was gefunden würde. Ideal zum Einstellen der Suchkriterien.

Sieht das gut aus, denselben Knopf noch einmal drücken, diesmal **ohne**
Häkchen. Dann kommt die erste Telegram-Nachricht:

> 👀 **Profil aktiviert:** Q7 im Umkreis
> 6 aktuelle Treffer wurden als bekannt markiert.

Ab jetzt meldet sich der Bot nur noch, wenn etwas **neu** dazukommt.

## Schritt 3 · Damit der Zeitplan greift

> **Wichtig:** GitHub startet zeitgesteuerte Läufe **nur vom Standard-Branch**
> des Repositories. Solange dieser Workflow auf einem anderen Branch liegt,
> funktioniert nur der Knopf „Run workflow".

Also: den Branch mit diesen Änderungen in den Standard-Branch übernehmen
(Pull Request anlegen und zusammenführen). Danach läuft die Suche automatisch
alle 15 Minuten.

---

## Suchkriterien ändern

Die Datei **`willhaben-watcher/suchprofile.json`** im Browser öffnen, auf das
**Stift-Symbol** klicken, ändern, unten **Commit changes**. Der nächste Lauf
verwendet die neuen Werte.

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `name` | Überschrift in der Telegram-Nachricht | `"Q7 im Umkreis"` |
| `enabled` | Profil an- oder abschalten | `true` / `false` |
| `makeId` | Marke (Nummer, siehe unten) | `"1003"` = Audi |
| `modelId` | Modell (Nummer, siehe unten) | `"1031"` = Q7 |
| `priceFrom`, `priceTo` | Preis in Euro | `12000` |
| `yearFrom`, `yearTo` | Baujahr | `2010` |
| `mileageTo` | Kilometerstand höchstens | `250000` |
| `postcode` + `radiusKm` | Umkreis um eine PLZ | `"5020"` + `100` |
| `areaId` | Bundesland statt/zusätzlich zum Umkreis | `"5"` = Salzburg |
| `keyword` | Volltextsuche bei willhaben | `"S-Line"` |
| `includeKeywords` | mindestens eines muss im Text vorkommen | `["Getriebeschaden"]` |
| `excludeKeywords` | keines davon darf vorkommen | `["Export"]` |

Nicht benötigte Felder einfach weglassen. Groß-/Kleinschreibung und Umlaute
spielen bei den Stichwörtern keine Rolle.

**Bundesland-Nummern:** 1 Burgenland · 2 Kärnten · 3 Niederösterreich ·
4 Oberösterreich · 5 Salzburg · 6 Steiermark · 7 Tirol · 8 Vorarlberg ·
900 Wien. Ohne `areaId` wird ganz Österreich durchsucht.

**Marken- und Modellnummern** stehen in der willhaben-Adresszeile: die Suche
im Browser mit der gewünschten Marke und dem Modell öffnen, dann in der URL
nach `CAR_MODEL%2FMAKE=…` und `CAR_MODEL%2FMODEL=…` schauen. Wer keine
Nummer angibt, sucht über alle Marken bzw. Modelle.

### Ein neues Profil anlegen

Einen kompletten Block in eckigen Klammern kopieren, Komma dazwischen nicht
vergessen, und `id` sowie `name` ändern – die `id` muss eindeutig sein und darf
nur Buchstaben, Ziffern, `-` und `_` enthalten.

Vertippt? Dann schlägt der nächste Lauf mit einer verständlichen Meldung fehl,
etwa `suchprofile.json ist kein gültiges JSON` oder
`Preis von/bis vertauscht in Profil "…"`. Es geht nichts kaputt – Fehler
korrigieren und erneut committen.

## Der Merkzettel

`state/watcher-state.json` merkt sich, welche Inserate schon gemeldet wurden,
damit du nichts doppelt bekommst. Die Datei schreibt der Workflow nach jedem
Lauf selbst zurück – daher die regelmäßigen Commits „Watcher: Merkzettel
aktualisiert". Einträge verfallen nach 30 Tagen von allein.

**Alles noch einmal melden lassen?** Die Datei löschen (im Browser öffnen →
Mülleimer-Symbol → Commit). Der nächste Lauf beginnt dann wieder von vorn und
markiert erst alles als bekannt.

## Was du wissen solltest

- **Pünktlichkeit:** GitHub startet die Läufe manchmal einige Minuten später
  als geplant, gelegentlich fällt einer aus. Für eine Autosuche unerheblich.
- **Ruhende Repositories:** Liegt das Repository 60 Tage lang völlig
  unberührt, schaltet GitHub zeitgesteuerte Läufe ab und schickt dir eine
  E-Mail. Da der Workflow selbst regelmäßig committet, passiert das hier
  praktisch nicht.
- **Kosten:** Für öffentliche Repositories sind Actions kostenlos. Bei
  privaten zählt die Laufzeit gegen das monatliche Freikontingent; ein Lauf
  dauert etwa eine Minute.
- **Fehler bei willhaben** (z. B. HTTP 403, wenn dort gerade gedrosselt wird)
  färben den Lauf nicht rot, sondern erscheinen als Warnung. Nach Telegram
  geht höchstens **eine** Fehlermeldung pro 24 Stunden.

## Wenn nichts kommt

1. **Actions** öffnen und nachsehen, ob Läufe stattfinden und wie sie ausgehen.
2. Einen **Testlauf** starten (Schritt 2) – steht dort `0 passend`, sind die
   Suchkriterien zu eng, nicht der Bot kaputt.
3. Kam nie eine Nachricht, auch keine „Profil aktiviert"? Dann stimmen Token
   oder Chat-ID nicht. Beides ist in den Secrets überschreibbar.

Und der häufigste Fall ganz ohne Fehler: es gibt schlicht nichts Neues.
Der Bot meldet sich nur bei Inseraten, die seit dem letzten Lauf dazugekommen
sind – bei einer engen Suche können dazwischen Tage liegen.
