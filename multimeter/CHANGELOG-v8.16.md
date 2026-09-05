# CHANGELOG v8.16-Profi — Quellenpflege: jede Adresse geprüft

## Was geprüft wurde

Alle 24 in `SOURCES.md` verlinkten Adressen wurden maschinell abgerufen. Eine
Quelle, die niemand mehr aufrufen kann, verfehlt ihren Zweck — also gehört der
Linkstatus zur Quellenpflege wie der Normstand.

| Ergebnis | Anzahl | Bewertung |
|---|---|---|
| **200 – erreichbar** | 13 | GS Yuasa Guide, IEC 60751, alle vier Bosch-Seiten, alle drei HELLA-Seiten, UK HSE, LIN 2.2A, beide W3C-Seiten |
| **403 – Anbietersperre** | 8 | ISO (4), Littelfuse (3), GS Yuasa Info-Hub |
| **404 – entfallen** | 1 | NXP KTY81-Datenblatt |
| **Verbindung abgebrochen** | 2 | Beide Ford-`OBDSM`-PDFs |

## Der Unterschied, auf den es ankommt

**403 ist kein toter Link.** Die Seite besteht, der Anbieter weist nur
automatisierte Abrufe ab — im Browser ist sie normal erreichbar. Das betrifft
ISO, Littelfuse und GS Yuasa. Wer das mit einem 404 in einen Topf wirft, wirft
gute Quellen weg.

**404 ist einer.** Das NXP-Datenblatt `KTY81_SER.pdf` liefert seit dem
05.09.2026 einen echten 404 — zweifach geprüft, auch über Umleitungen. NXP hat
das Dokument nach der Abkündigung des Produkts entfernt.

**Die Ford-PDFs sind unklar.** Der Host antwortet mit 200, die beiden Dateien
brechen die Verbindung ab. Das ist nicht abschließend beurteilbar und wird
genau so vermerkt, statt es in die eine oder andere Richtung zu behaupten.

## Was geändert wurde — und was bewusst nicht

**Geändert:** Die KTY81-Zeile führt die Adresse nicht mehr als anklickbaren
Link, sondern nennt den Befund (HTTP 404 seit 05.09.2026, Dokument nach
Abkündigung entfernt). `SOURCES.md` bekommt einen Abschnitt **Linkprüfung** mit
Datum, Ergebnisverteilung und der Unterscheidung 403 gegen 404.

**Nicht geändert: der Zahlenwert.** Die Karte `ptc-sensor` führt für KTY81-1xx
weiterhin ~1000 Ω bei 25 °C und ~1700 Ω bei 100 °C. Dieser Wert stützt sich auf
die **Dokumentausgabe** — NXP KTY81 Series, Rev. 05 vom 25.04.2008 —, nicht auf
die Erreichbarkeit einer URL. Eine entfallene Datei entwertet keine korrekt
zitierte Revision; entfallen ist der Abrufweg, nicht der Beleg.

**Bewusst kein Ersatzlink.** Für das KTY81-Datenblatt existieren
Distributor-Spiegel. Sie weisen ihrerseits automatisierte Abrufe mit 403 ab und
konnten deshalb nicht gegengeprüft werden. Sie hier als Quelle zu führen, hätte
eine Prüfung vorgetäuscht, die nicht stattgefunden hat — und genau das ist die
Sorte Bequemlichkeit, gegen die die Evidenzstufen dieser Datei geschrieben sind.

## Regression

`validate.js` Abschnitt 31, 8 Prüfungen (181 → 189). Darunter:

- Die Linkprüfung muss datiert sein und 403 ausdrücklich von 404 unterscheiden.
- Die tote Adresse darf nicht wieder als Link auftauchen.
- Die **Linkbilanz** muss aufgehen: 24 geprüft − 1 entlinkt = 23 vorhanden,
  gezählt an der Datei selbst. Damit kann die Dokumentation nicht stillschweigend
  von der Realität abweichen.
- Die Normstände bleiben korrekt: ISO 8820-3:2015 gültig, FDIS ausdrücklich
  nicht als publiziert, IEC 60751, ISO 11898-2:2026, ISO 17987-3:2025.

## Damit ist die Fokusrotation einmal vollständig durchlaufen

Runde 1 bis 13, Version 8.3 → 8.16, Validator 78 → 189 Prüfungen.
