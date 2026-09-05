# CHANGELOG v8.4-Profi — Kraftstoff-Hochdruck als eigene Gefahrenklasse

## Ausgangslage

Die Karte `injektor-benzin` behandelte Benzin-Direkteinspritzer ausdrücklich:
Der Einsteigertext grenzte Saugrohr- von Direkteinspritzung ab, die
Richtwerttabelle vermerkte für VAG TFSI/TSI eine „hohe Schaltspannung",
und `dont` verbot, die Direkteinspritzer-Ansteuerung zu brücken oder
fremdzubestromen.

Trotzdem trug die Karte **keine einzige Warnung** — weder `danger` noch
`caution` noch `info` — bei `risk:"mittel"`. Die Schwesterkarte
`injektor-diesel` hatte für dasselbe Bauteil in Dieselausführung einen roten
Gefahrblock („Hohe Drücke im System"), `risk:"hoch"`.

Damit hing die Gefahrenkennzeichnung am **Kraftstoff** statt am
**Hochdrucksystem**. Ein Monteur, der an einem TSI arbeitet und die
Benzin-Karte öffnet, bekam keinen Hinweis darauf, dass das Rail neben seiner
Hand unter mehreren hundert bar steht.

## Belege

| Aussage | Quelle |
|---|---|
| Benzin-Direkteinspritzung läuft mit bis zu 350 bar Systemdruck (Hochdruckpumpen in 250-bar- und 350-bar-Ausführung, Injektor HDEV 6 bis 350 bar) | [Bosch Mobility – Gasoline direct injection](https://www.bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-direct-injection/), [High-pressure pump HDP](https://www.bosch-mobility.com/en/solutions/pumps/high-pressure-pump/) |
| Injektionsverletzungen sind bereits ab 7 bar möglich, schwere Verletzungen typischerweise über 100 bar; ohne rasche chirurgische Behandlung droht Amputation | [UK HSE Safety Alert FOD 4-2014](https://www.hse.gov.uk/safetybulletins/hydraulic-injection-injury.htm) |

Die HSE-Quelle stand bereits in `SOURCES.md` und trug die Gefahrkennzeichnung
der Karten `raildruck` und `injektor-diesel`. Sie belegt die Gefahr
druckabhängig, nicht kraftstoffabhängig — sie galt also die ganze Zeit auch
für die Benzin-Direkteinspritzung.

## Änderungen

**`injektor-benzin`**

- Neuer `danger`-Block: Rail unter mehreren hundert bar (Bosch: bis 350 bar),
  auch nach dem Abstellen; Hochdruckpumpe, Rail, Hochdruckleitungen und
  Injektorschäfte nicht bei laufendem Motor oder unter Restdruck lösen;
  Injektionsverletzung als chirurgischer Notfall; Druckabbau nur nach
  OEM-Prozedur.
- Neuer `caution`-Block: Schaltspannung der Direkteinspritzer-Ansteuerung
  liegt deutlich über Bordspannung — nicht brücken, nicht fremdbestromen,
  nicht mit der Prüflampe belasten.
- Neuer `info`-Block: Entzündlichkeit von Kraftstoff und Dämpfen.
- `risk` von `mittel` auf `hoch`.
- `requires` um die Systemklärung (Saugrohr oder Direkt) und den Druckabbau
  nach OEM-Prozedur erweitert, `dont` und `limits` entsprechend.
- Anleitung um einen vorgelagerten Schritt zum Druckabbau ergänzt.
- Einsteigertext ordnet die Größenordnungen ein: wenige bar gegenüber
  mehreren hundert bar.
- `sourceRef` ergänzt.

**Bewusst nicht geändert:** Die Spulenmessung am getrennten Stecker bleibt als
zulässige, harmlose Multimeterprüfung stehen. Die Karte warnt vor dem
Hochdrucksystem daneben, nicht vor der eigenen Messung — eine Karte, die nur
noch warnt, wäre in der Werkstatt wertlos. Der Validator prüft das
ausdrücklich gegen.

**`SOURCES.md`**

- Neue Zeile für den Bosch-Systemdruck, ausdrücklich als **Herstellerbeispiel**
  und als Gefährdungsgrößenordnung — keine Prüf- oder Freigabegrenze.
- HSE-Zeile um die Druckschwellen (7 bar / 100 bar) und die Zuordnung zu
  `injektor-benzin` erweitert.

**`validate.js`** — neuer Abschnitt 19, acht Prüfungen (78 → 86)

Die Leitprüfung ist bewusst verallgemeinert: **jede** Karte, die
Direkteinspritzung oder Common-Rail als Prüfgegenstand führt, muss einen
Gefahrblock und `risk:"hoch"` tragen. Damit fällt derselbe Fehler künftig
auch bei neuen Karten auf, statt nur bei dieser einen.

Nachweis der Wirksamkeit: Gegen den Zustand vor dieser Änderung meldet der
Validator `injektor-benzin(keine warn/mittel)` und schlägt fehl.
