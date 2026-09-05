# CHANGELOG v8.12-Profi — CAN: 120 Ω ist nicht eindeutig

## Ausgangslage

Die Karte `can` sagte in `bad`, im Einsteigertext und in der Richtwerttabelle
übereinstimmend: **„120 Ω = ein Abschluss fehlt."**

## Warum das zu kurz greift

Zwei 120-Ω-Abschlüsse liegen parallel und ergeben ~60 Ω. Misst man ~120 Ω,
sieht das Messgerät nur noch **einen** davon. Dafür gibt es zwei Gründe:

1. Ein Abschluss fehlt tatsächlich — Steuergerät abgesteckt, Widerstand defekt.
2. **CAN-High oder CAN-Low ist zwischen den beiden Abschlüssen unterbrochen.**
   Der Bruch trennt den entfernten Abschluss ab; gemessen wird nur noch der
   nähere. Derselbe Messwert.

Das sind zwei grundverschiedene Reparaturen: einmal ein fehlendes oder defektes
Steuergerät, einmal ein Kabelbruch im Strang. Wer nur den ersten Fall kennt,
sucht am falschen Ende — und findet nichts, weil alle Steuergeräte da sind.

**Unterscheiden lässt sich das einfach:** spannungsfrei beide Adern über die
gesamte Strecke auf Durchgang prüfen, notfalls von beiden Busenden aus messen.
Diesen Schritt gab es in der Karte nicht.

## Änderungen an `can`

- `bad`, Einsteigertext und Anleitung benennen jetzt beide Ursachen und den
  Schritt, der sie trennt.
- Die Richtwerttabelle löst die eine Zeile in drei auf: „~120 Ω gemessen"
  (Warnung — erst unterscheiden), „~120 Ω, beide Adern durchgängig" (Abschluss
  fehlt), „~120 Ω, eine Ader unterbrochen" (Leitungsbruch).
- **Zwei weitere Klarstellungen in der Notiz:**
  - ~60 Ω belegt nur, dass zwei Abschlüsse parallel liegen. Es beweist weder
    intakte Adern über die ganze Strecke noch fehlerfreie Kommunikation. Ein
    Multimeterwert ersetzt keine Signalbewertung.
  - „Zündung aus" ist nicht dasselbe wie spannungsfrei: Steuergeräte an
    Klemme 30 bleiben versorgt und können den Bus wecken. Diese Unterscheidung
    trifft der Referenzsatz seit v8.10 ausdrücklich — sie fehlte hier.

## Letzte ungebundene Abfallgrenze beseitigt

`leitung` fs 9 („< 0,2 V → belastbar") war die letzte feste Abfallgrenze in
einem Arbeitsschritt. Sie ist jetzt an die Vorgabe des jeweiligen Kreises
gebunden.

Damit ist die in Runde 2 begonnene Umstellung **projektweit abgeschlossen** —
von rund 27 Fundstellen über `spannungsabfall` (v8.5), `batterie`/`generator`/
`starter` (v8.7), `luefter`/`hupe` (v8.11) bis hierher.

## Regression

`validate.js` Abschnitt 27, 8 Prüfungen (147 → 155). Darunter eine, die die
CAN-Pegel gegen die klassische High-Speed-Physik hält (rezessiv beide ~2,5 V,
dominant 3,5 V und 1,5 V), und eine projektweite: **keine ungebundene
Abfallgrenze mehr in Anleitung oder Fehlersuchkette** — irgendwo im Projekt.

## Geprüft und für korrekt befunden

`lin` (rezessiv nahe Bordspannung, dominant nahe 0 V, Master/Slave-Rollen,
und ausdrücklich: ein fester High-Pegel beweist keinen Leitungsfehler — er kann
Idle, Sleep oder fehlender Master sein), `pullup-pulldown` (Pegel gegen Sensor-
Masse UND Batterieminus vergleichen), `generator-lin-bsd`, `masse`, `backprobe`,
`kurzschluss-plus-masse`, `leitung` im Übrigen.
