# SOURCES.md — Quellen- und Grenzwertmatrix

Stand: **v8.14-Profi, geprüft am 05.09.2026**.

Die Vollversion unterscheidet drei Evidenzstufen:

1. **Norm/Kennlinie:** Der Zahlenwert gilt nur für die ausdrücklich genannte
   Norm, Baureihe oder Teilenummer.
2. **Herstellerbeispiel:** Der Wert zeigt, dass solche Bereiche existieren,
   ist aber keine Universalgrenze für andere Fahrzeuge.
3. **OEM erforderlich:** Die App gibt bewusst keine feste Freigabegrenze vor.
   Fahrzeugzustand, Teilenummer, Temperatur, Last und OEM-Prüfplan entscheiden.

Ampelfarben in Tabellen zeigen deshalb die **Prüfpriorität**, nicht automatisch
„Bauteil freigegeben“ oder „Bauteil ersetzen“.

## Primär-, Norm- und Herstellerquellen

| Thema in der App | Direkte Quelle | Stand/Revision | Verwendung und Grenze |
|---|---|---|---|
| Kaltwiderstände ATOF/Standard-Flachsicherungen | [Littelfuse ATOF Series 287 – Datenblatt](https://www.littelfuse.com/assetdocs/littelfuse-datasheet-287-atof?assetguid=43dcdce8-8ca2-426f-8998-7e566f048d40) | Herstellerdatenblatt, Abruf 27.07.2026 | `FUSE_TYPES.atof`; ausschließlich Kaltwerte der gelisteten Bauform/Nennströme |
| Kaltwiderstände MINI | [Littelfuse MINI Series 297](https://www.littelfuse.com/ja-jp/products/fuses-overcurrent-protection/fuses/automotive-fuses/blade-fuses-shunt/mini/297) | Herstellerseite/Datenblatt, Abruf 27.07.2026 | `FUSE_TYPES.mini`; Bauform nicht mit ATOF/MAXI vermischen |
| Kaltwiderstände MAXI | [Littelfuse MAXI Series 299, Beispiel 50 A](https://www.littelfuse.com/de/products/fuses-overcurrent-protection/fuses/automotive-fuses/blade-fuses-shunt/maxi/299/0299050-txn) | Herstellerseite/Datenblatt, Abruf 27.07.2026 | `FUSE_TYPES.maxi`; Tabellenwerte gelten nur für Series 299 |
| Bauformen und Anforderungen an Kfz-Flachsicherungen | gültig: [ISO 8820-3:2015](https://www.iso.org/standard/58088.html) · in Überarbeitung: [ISO/FDIS 8820-3](https://www.iso.org/standard/85282.html) | ISO 8820-3:2015 (gültige Ausgabe); FDIS im Genehmigungsverfahren, noch nicht veröffentlicht | Normhintergrund; der Rechner ersetzt keine Sicherungsauslegung. Der Entwurf darf nicht als publizierte Norm zitiert werden. |
| Pt100/Pt1000-Temperatur-Widerstandsbeziehung | [IEC 60751](https://webstore.iec.ch/en/publication/3400) | Beziehung in IEC 60751; aktuelle Ausgabe 2022 beachten | Karte `ptc-sensor`; nur Platinfühler nach dieser Norm |
| KTY81-Kennlinie | [NXP KTY81 Series, Rev. 05](https://www.nxp.com/docs/en/data-sheet/KTY81_SER.pdf) | 25.04.2008, Produkt inzwischen EOL | Nur konkrete KTY81-Type; nicht auf beliebige Kfz-PTC übertragen |
| 5-V-Referenz, Beispiel 4,75-V-Untergrenze | [Ford OBDSM1801-HEV](https://www.fordservicecontent.com/Ford_Content/catalog/motorcraft/OBDSM1801-HEV-2018.pdf) | Ford, Revision 12.05.2017 | Herstellerbeispiel, keine allgemeine 5-V-Grenze |
| 5-V-Referenz, Beispiel 4,7–5,3 V | [Ford OBDSM1700-HEV](https://www.fordservicecontent.com/Ford_Content/catalog/motorcraft/OBDSM1700-HEV-2017.pdf) | Ford, Revision 09.11.2015 | Belegt die Systemabhängigkeit; nur gekennzeichnetes Beispiel |
| Saugrohr-/Ladedrucksensor: unterschiedliche Messbereiche und 5-V-Versorgung | [Bosch Mobility – Boost pressure sensor](https://www.bosch-mobility.com/en/solutions/sensors/boost-pressure-and-temperature-sensor/) | Herstellerseite, Abruf 27.07.2026 | Karte `map`; keine universelle KOEO-Signalspannung |
| Hochdrucksensor: analoge/digitale Varianten und unterschiedliche Kennlinien | [Bosch Mobility – High-pressure sensor](https://www.bosch-mobility.com/en/solutions/sensors/high-pressure-sensor/) | Herstellerseite, Abruf 27.07.2026 | Karte `raildruck`; Teilenummer/Kennlinie bleibt zwingend |
| Intelligente Generatorregelung und mögliche variable/höhere Spannungen | [HELLA Techworld – Checking an alternator regulator](https://www.hella.com/techworld/uk/technical/car-electronics-and-electrics/starting-and-charging-system/checking-an-alternator-regulator/) | Hersteller-Fachinformation, Abruf 27.07.2026 | Systembeispiel für Smart Charge; kein universeller Ladebereich |
| Ladesystemprüfung und IBS/LIN-Regelung | [HELLA Techworld – Service work on the charging system](https://www.hella.com/techworld/en/technical/car-electronics-and-electrics/starting-and-charging-system/service-work-on-the-charging-system/) | Hersteller-Fachinformation, Abruf 27.07.2026 | Begründet Batterieprüfung, Soll-/Ist-Anforderung und Leitungsprüfung |
| Zulässige Spannungsabfälle je Stromkreis (12 V) | [HELLA Techworld – Earth (31) troubleshooting](https://www.hella.com/techworld/us/ti/earth-31-troubleshooting/) | Hersteller-Fachinformation, Abruf 05.09.2026 | Karte `spannungsabfall`. **Herstellerbeispiel**, keine allgemeingültige Freigabegrenze: Startergehäuse→Karosserie 0,1 V, Batterieminus→Startergehäuse 0,3 V, Batterieplus→Hauptanschluss Starter 0,5 V, Hauptanschluss Starter unter Last beim Startvorgang 3,5 V, Generatorgehäuse→Karosserie 0,1 V, Batterieplus→Generator 0,4 V, Lichtkreis unter 15 W 0,1 V (gesamt 0,6 V), über 15 W 0,5 V (gesamt 0,9 V), Zündschalter→Steuerstromanschluss Starter 1,5 V. Belegt ausdrücklich, dass der zulässige Abfall vom Strom des Kreises abhängt – derselbe Lichtkreis unterscheidet sich um den Faktor fünf. Der OEM-Prüfplan des Fahrzeugs geht vor |
| Batterie-Ruhespannung/SOC als Herstellerorientierung | [GS Yuasa Battery Management Guide](https://academy.gs-yuasa.eu/wp-content/uploads/2017/05/GS-Yuasa-Battery-Management-Guide.pdf) | Herstellerleitfaden, Abruf 27.07.2026 | Nur stabilisierte OCV und definierte Batteriebedingungen; kein SOH-/Austauschbeweis |
| Batteriesicherheit: Wasserstoff, Säure, Kurzschluss/Lichtbogen | [GS Yuasa – Battery health & safety](https://www.gs-yuasa.eu/en-it/info-hub/battery-health-and-safety) | 05.09.2024 | Sicherheitswarnung der Karte `batterie` |
| Hochdruck-Flüssigkeitsstrahl/Injektionsverletzung | [UK HSE Safety Alert FOD 4-2014](https://www.hse.gov.uk/safetybulletins/hydraulic-injection-injury.htm) | 23.09.2014 | Allgemeiner Gefahrennachweis für Flüssigkeitsinjektion; Karten `raildruck`, `injektor-diesel`, `injektor-benzin`. HSE nennt schwere Verletzungen typischerweise über 100 bar und hält eine Injektionsverletzung bereits ab 7 bar für möglich – die Gefahr besteht damit unabhängig von Diesel oder Benzin. Am Fahrzeug gilt zusätzlich die OEM-Druckabbauprozedur |
| Benzin-Direkteinspritzung: Systemdruck im Rail | [Bosch Mobility – Gasoline direct injection](https://www.bosch-mobility.com/en/solutions/powertrain/gasoline/gasoline-direct-injection/) · [Bosch Mobility – High-pressure pump HDP](https://www.bosch-mobility.com/en/solutions/pumps/high-pressure-pump/) | Herstellerseite, Abruf 05.09.2026 | Karte `injektor-benzin`; Bosch führt Hochdruckpumpen mit bis zu 250 bar und bis zu 350 bar Systemdruck. **Herstellerbeispiel**, kein universeller Wert: Der konkrete Raildruck folgt der Teilenummer und dem Motorsteuergerät. Belegt ausschließlich die Größenordnung der Gefährdung, keine Prüf- oder Freigabegrenze |
| Klassischer High-Speed-CAN, physikalische Schicht | [ISO 11898-2:2026](https://www.iso.org/standard/90697.html) | Edition 4, 2026-05 | Karte `can`; 60 Ω nur bei der klassischen Topologie mit zwei 120-Ω-Abschlüssen |
| LIN-Protokoll | [ISO 17987-3:2025](https://www.iso.org/fr/standard/85127.html) und [LIN 2.2A](https://www.lin-cia.org/fileadmin/microsites/lin-cia.org/resources/documents/LIN_2.2A.pdf) | ISO Edition 2 / LIN Rev. 2.2A | Karte `lin`; Multimeter kann Frames nicht freigeben |
| Klemmenbezeichnungen im Kfz (30, 85, 86, 87, 87a, 87b) | DIN 72552 – Klemmenbezeichnungen in Kraftfahrzeugen | Deutsche Norm, Klemmenverzeichnis | Karten `relais`, `relais-typen`, `klemmen`; die Norm regelt die Bezeichnung, nicht Sollwerte |
| Touchziele 24 × 24 CSS-Pixel oder Abstand | [W3C WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) | WCAG 2.2, Level AA | Normatives Minimum |
| Touchziele 44 × 44 CSS-Pixel | [W3C WCAG 2.2 SC 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced) | WCAG 2.2, Level AAA | Von der App bewusst erfülltes, strengeres Ziel |

## Bewusst OEM-/bauteilabhängig

Für diese Themen existiert keine seriöse Universalgrenze. In aktiven
Diagnosepfaden wird deshalb gegen OEM-Soll, konkrete Kennlinie oder einen
dokumentierten Fahrzeug-Basiswert verglichen:

- Ruhestrom und Einschlafzeit vernetzter Fahrzeuge
- Sensor-Masseversatz
- Generator-Plus-/Masseabfall und Ripplebefund
- Startspannungs- und Starter-Spannungsabfallgrenzen
- MAP-, Rail-, Klima- und DPF-Sensorsignal
- Spulenwiderstände von Relais, Magnetventilen und Injektoren
- Stromaufnahme von Pumpen, Lüftern, Heizern und Stellmotoren
- Klemme-50- und Steuergeräte-Massegrenzen
- Relais-Spulenwiderstand und Kontaktabfall (in den Karten als Beispiele gekennzeichnet)

Orientierungswerte können weiterhin erläutert werden, lösen aber ohne konkrete
Sollwertquelle keine automatische Austausch- oder Freigabeentscheidung aus.

## Rechenhinweis Sicherungs-mV-Methode

Die hinterlegten Sicherungswerte sind **Kaltwiderstände**. Temperatur,
Kontaktwiderstand, Fertigungstoleranz und Messauflösung verändern das Ergebnis.
Der Rechner gibt daher nur den berechneten Strom aus und fordert den Vergleich
mit gemessenem Gesamtstrom sowie dem fahrzeugspezifischen Ruhestrom-Soll. Er
klassifiziert den berechneten Wert nicht mehr pauschal als gut oder schlecht.
