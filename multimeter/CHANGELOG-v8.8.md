# CHANGELOG v8.8-Profi — NTC: die Signalspannung gehört dem Steuergerät, nicht dem Sensor

## Ausgangslage

`ntc-kts` führte eine Spalte „Signal (typ.)" mit absoluten Spannungen:
~4 V bei −10 °C, ~3–3,5 V bei 20 °C, ~2,5 V bei 40 °C, ~1,3 V bei 80 °C,
~1 V bei 100 °C.

## Warum das nicht stimmen kann

Ein NTC ist ein passiver Widerstand. Er gibt keine Spannung ab. Das
Steuergerät legt ihn über einen Pull-up-Widerstand an seine Referenzspannung;
gemessen wird die Spannung am Spannungsteiler:

```
U = Uref × R / (R + Rpullup)
```

Die Spannung ist damit eine Eigenschaft der **Steuergeräte-Beschaltung**, nicht
des Sensors. Ein anderer Pull-up liefert bei identischem Sensor und identischer
Temperatur andere Spannungen.

**Die alte Spalte war zudem nicht einmal in sich schlüssig.** Rechnet man aus
Widerstand und angegebener Spannung den unterstellten Pull-up zurück:

| Temperatur | R | U laut Karte | daraus folgender Pull-up |
|---|---|---|---|
| −10 °C | 9,5 kΩ | 4,0 V | 2375 Ω |
| 20 °C | 2,25 kΩ | 3,25 V | 1212 Ω |
| 40 °C | 1,15 kΩ | 2,5 V | 1150 Ω |
| 80 °C | 340 Ω | 1,3 V | 968 Ω |
| 100 °C | 190 Ω | 1,0 V | 760 Ω |

Der unterstellte Pull-up schwankt um mehr als den Faktor drei. **Keine reale
Steuergerätekonfiguration erzeugt diese Spalte** — die Werte waren an keinem
Fahrzeug nachprüfbar.

Die Karte widerlegte sich sogar selbst: Ihre eigene Notiz vermerkt, dass VAG
häufig eine 2-Stufen-Kennlinie fährt, bei der das Steuergerät den Pull-up im
Messbereich **umschaltet**. Genau das macht jede feste Spannungstabelle
unbrauchbar.

Und die App wusste es an anderer Stelle längst: `map` verweigert ausdrücklich
einen universellen Spannungswert und begründet das mit dem Messbereich des
Sensors.

## Änderung

Die dritte Spalte heißt jetzt **„Rechenbeispiel 5 V über 1 kΩ"** und enthält
Werte, die aus den angegebenen Widerständen tatsächlich folgen (4,52 / 3,46 /
2,67 / 1,27 / 0,80 V). Jede Widerstandszeile nennt den zugrunde gelegten Wert
mit („hier 9,5 kΩ"), sodass die Rechnung nachvollziehbar ist.

Die Notiz erklärt Formel und Abhängigkeit, benennt den Verlauf als das
belastbare Kriterium und stellt klar: **Der Widerstand ist die Messgröße, nicht
die Spannung.**

## Regression

`validate.js` Abschnitt 23, 8 Prüfungen (115 → 123). Zwei davon rechnen die
Tabellen aktiv nach, sodass Zahl und Physik nicht mehr auseinanderdriften
können:

- Alle fünf NTC-Beispielspannungen werden aus der angegebenen
  Widerstandsangabe mit `U = 5 V × R/(R+1 kΩ)` neu berechnet und verglichen.
- Die PT1000- und PT200-Werte werden gegen die Callendar-Van-Dusen-Gleichung
  aus IEC 60751 nachgerechnet (A = 3,9083 × 10⁻³, B = −5,775 × 10⁻⁷).

## Eine Regel, die zuerst zu weit gefasst war

Der erste Entwurf der verallgemeinerten Prüfung verlangte von **jeder**
Sensorkarte, absolute Signalspannungen zu begründen. Sie schlug bei `poti-dk`
und `lambda-sprung` an — zu Unrecht:

- **`poti-dk`** ist ein Potentiometer an der 5-V-Referenz. Sein Ausgang ist ein
  ratiometrischer Teiler **im Sensor selbst**; 0,5–0,9 V geschlossen und
  4,0–4,5 V offen sind sehr wohl Sensoreigenschaften.
- **`lambda-sprung`** ist eine Zirkonia-Zelle. Sie **erzeugt** ihre Spannung
  galvanisch; 0,1–0,9 V gehören ihr selbst.

Nicht die Karten waren falsch, sondern die Regel. Sie greift jetzt nur noch bei
**passiv-resistiven** Sensoren, erkennbar an einer Widerstandsspalte in der
Tabelle — dem einzigen Fall, in dem die Spannung erst durch die Beschaltung
entsteht.

## Geprüft und für korrekt befunden

`ptc-sensor` (PT1000/PT200 gegen IEC 60751 nachgerechnet, KTY81-1xx mit
1000 Ω bei 25 °C und ~1700 Ω bei 100 °C zutreffend, Hinweis auf den
Messleitungswiderstand bei kleinen PT200-Werten), `map` (vorbildlich: verweigert
universelle Spannungswerte, erklärt die Messbereichsabhängigkeit),
`oeldruck` (Ölstand zuerst, Elektrik ersetzt nie die Manometermessung, klares
STOPP bei laufendem Motor), `dpf-diff`, `agt` (NTC/PTC/aktiv unterschieden,
Kaltvergleich mehrerer Sensoren), `klimadruck`, `ntc-ats`, `raildruck`.
