# Rückmeldeweg — Entscheidungsvorlage

> **Diese Entscheidung wurde bewusst nicht getroffen.** Drei Varianten, jeweils
> mit Vor- und Nachteilen. Keine erfordert einen eigenen Server.

## Warum das gebraucht wird

Ein Kfz-Meister, der in der Halle einen falschen Wert findet, hat heute keine
Möglichkeit, das zu melden. Ohne Rückkanal bleibt jeder Fehler im Feld
unentdeckt — und zwar dauerhaft, weil niemand sonst die Werte gegen die Realität
prüft. Das ist die größte inhaltliche Schwachstelle des Projekts, unabhängig von
der Codequalität.

**Gemeinsame Anforderung an alle Varianten:** Die Meldung muss die
**Karten-Kennung**, die **App-Version** und den **Inhaltsstand** mitführen. Ohne
diese drei Angaben ist eine Meldung wie „der Wert stimmt nicht" nicht
nachvollziehbar.

## Variante 1 · `mailto:`-Verweis mit vorbefülltem Betreff

Ein Verweis in jeder Detailansicht, der das E-Mail-Programm mit vorbefülltem
Betreff und Rumpftext öffnet: `Rückmeldung: <Kartenname> (<ID>) · v8.5-Profi ·
Stand 28.07.2026`.

- **Dafür:** Kein Dienst, kein Konto, keine Infrastruktur. Funktioniert auch bei
  einer rein lokal installierten App. Der Offlinebetrieb bleibt unberührt — der
  Verweis öffnet nur das Mailprogramm, die App ruft nichts ab. Niedrigste Hürde
  für den Meldenden.
- **Dagegen:** Der Herausgeber muss eine E-Mail-Adresse veröffentlichen, die
  eingesammelt und beantwortet werden will (Spam, Aufwand). Meldungen sind nicht
  öffentlich, Doppelmeldungen nicht erkennbar, kein Bearbeitungsstand.
- **Datenschutz:** Die App selbst überträgt nichts. Die E-Mail enthält jedoch die
  Absenderadresse — das gehört in den Datenschutzhinweis.

## Variante 2 · Vorbereiteter Verweis auf eine Issue-Vorlage (z. B. GitHub)

Ein Verweis, der ein vorausgefülltes Formular in einem öffentlichen Repository
öffnet.

- **Dafür:** Meldungen sind öffentlich, nachvollziehbar und haben einen Status.
  Doppelmeldungen sind erkennbar. Andere Fachleute können widersprechen oder
  bestätigen — bei Messwerten ist genau das wertvoll. Keine eigene
  Infrastruktur, keine E-Mail-Adresse im Impressum nötig.
- **Dagegen:** Setzt ein Konto beim Anbieter voraus. Ein Kfz-Meister in der Halle
  legt dafür in der Regel keines an — das ist die realistische Hürde, an der
  diese Variante scheitert. Außerdem müsste das Repository öffentlich sein, was
  bei Lizenzvariante A (proprietär) im Widerspruch steht.
- **Datenschutz:** Der Verweis führt zu einem Drittanbieter; ab dem Klick gilt
  dessen Datenschutzerklärung. Muss benannt werden.

## Variante 3 · Statisches Formular eines Drittanbieters

Ein gehosteter Formulardienst, in den die App per Verweis mit vorbefüllten
Feldern (Karte, Version, Stand) springt.

- **Dafür:** Kein Konto für den Meldenden, niedrigste Hürde nach Variante 1.
  Strukturierte Felder statt Freitext, dadurch besser auswertbar. Der Herausgeber
  bleibt anonym, keine E-Mail-Adresse nötig.
- **Dagegen:** Abhängigkeit von einem Dienst, der eingestellt oder
  kostenpflichtig werden kann. Meldungen sind nicht öffentlich. Bei den meisten
  Anbietern ist eine Auftragsverarbeitungsvereinbarung erforderlich.
- **Datenschutz:** Deutlichster Eingriff der drei. Der Dienst sieht IP-Adresse
  und Inhalt der Meldung. **Wichtig:** Solange die App selbst nur einen Verweis
  enthält und kein Formular einbettet, bleibt die Aussage „die App überträgt
  nichts" richtig. Wird das Formular hingegen **eingebettet**, ist die Aussage
  falsch und der Offlinebetrieb beschädigt. In diesem Fall bitte ausschließlich
  als Verweis umsetzen.

## Gegenüberstellung

| | 1 · mailto | 2 · Issue-Vorlage | 3 · Formulardienst |
|---|---|---|---|
| Eigener Server nötig | nein | nein | nein |
| Offlinebetrieb betroffen | nein | nein | nein (nur als Verweis!) |
| Konto für den Meldenden | nein | **ja** | nein |
| Hürde in der Werkstatt | niedrig | hoch | niedrig |
| Meldung öffentlich nachvollziehbar | nein | **ja** | nein |
| Identität des Herausgebers nötig | **E-Mail** | nein | nein |
| Zusatz im Datenschutzhinweis | klein | mittel | groß |
| Dauerhaft verfügbar | ja | abhängig vom Anbieter | abhängig vom Anbieter |

## Zu klären

- [ ] Welche Variante — oder eine Kombination (etwa 1 als Grundweg, 2 zusätzlich
      für fachlich versierte Melder)
- [ ] Wer bearbeitet eingehende Meldungen, und in welchem Rhythmus
- [ ] Ab wann führt eine bestätigte Meldung zu einer neuen Version und einem
      neuen Inhaltsstand
- [ ] Datenschutzhinweis entsprechend ergänzen (siehe `DATENSCHUTZ-ENTWURF.md`)
