# Signal-Katalog: am Fahrzeug messbare Signale

Stand: V11 (Oktober 2026). Planungsgrundlage für die nächsten Messkarten des Kompendiums.

**So ist der Katalog entstanden:** Zwei Recherche-Agenten haben den Katalog erstellt, getrennt nach Sensoren sowie Aktoren, Zündung, Versorgung, Bussen und Hochvolt. Als Quellen dienten Pico Technology (Guided Tests, Forum), Bosch, Hella, Normen und Herstellerunterlagen. Unter „Quellen“ steht nur, was tatsächlich geöffnet und gelesen wurde. Werte ohne Quelle sind als „nicht quellengeprüft“ bzw. „Fachwissen“ gekennzeichnet. Die Websuche war gegen Ende der Recherche ausgeschöpft, deshalb sind einige Randbereiche dünner belegt.

**Wichtig:** Dieser Katalog ist eine Arbeitsliste, kein geprüfter Kartentext. In die App kommen Werte erst, wenn eine Karte nach dem Verfahren Autor → unabhängige Prüfung → Korrektur gebaut ist. So wurden auch die 20 Sensor- und Lambdakarten in V11 erstellt.

> **Sicherheit:** Airbag, Gurtstraffer, PSI5 und alle pyrotechnischen Kreise werden **niemals** angemessen, nur mit dem Diagnosetester nach Herstellervorgabe. Hochvolt nur mit HV-Qualifikation, Herstellervorgaben, PSA und CAT-bewertetem Zubehör. Der VDS1022I hat keine bekannte CAT-Einstufung, und seine Kanäle haben eine gemeinsame Masse.

## Überblick

| | Anzahl |
|---|---|
| Signale gesamt | 146 |
| davon mit dem Oszi sinnvoll diagnostizierbar | 117 |
| durch eine Karte (ganz oder teilweise) abgedeckt | 67 |
| noch ohne eigene Karte | 72 |
| nicht anwendbar (kein Oszi-Thema oder Messverbot) | 7 |

## Fehlende Karten nach Priorität

Signale, die mit dem Oszi sinnvoll messbar sind und noch keine eigene Karte haben. Priorität „hoch“ heißt: häufige Werkstattmessung.

| Priorität | Signal | System | Messbar mit VDS1022I |
|---|---|---|---|
| hoch | Ultraschall-Parksensor (PDC/Einparkhilfe) | Assistenz/Karosserie | Burst nur mit Ultraschall-Empfänger bzw. Detektor (Zubehör, z. B. 40-kHz-Wandler) am Kanal; die Bandbreite reicht. Signalleitung zum Steuergerät: ja (Spannung gegen Masse). |
| hoch | Ruhestrom / parasitäre Batterieentladung | Bordnetz 12 V | nur mit Niederstromzange (mA-Auflösung) oder Shunt. Zeitbasis bis 100 s/div, aber nur 5 k Punkte je Erfassung; Langzeitüberwachung eingeschränkt. |
| hoch | Spannungsfall Plus- und Masseleitungen (Hauptstrom, Steuergeräte- und Sensormasse) | Bordnetz/Versorgung | ja (DC, mV-Bereich). Beachten: Masseklemmen beider Kanäle liegen auf gemeinsamem Potential. |
| hoch | Kältemitteldrucksensor Klimaanlage (analog oder PWM) | Klima | ja (gleichzeitig Manometer an Hochdruckseite anschließen und vergleichen) |
| mittel | Kupplungspedal-/Kupplungspositionssensor (Hall) | Antriebsstrang / Start-Stopp / Tempomat | ja (Pegelwechsel beim Treten, 2 Kanäle zusammen mit Bremslichtschalter für Plausibilität) |
| mittel | FlexRay | Bussystem (Fahrwerk/Antrieb, Premiumfahrzeuge) | eingeschränkt: Pegel, Idle und Abschluss ja (BP/BM gegen Masse, Math A−B). Nur 10 Abtastwerte/bit bei 100 MS/s und 25 MHz Bandbreite; Flanken verrundet, Reflexionen und Augendiagramm nicht verlässlich. |
| mittel | CR-Druckregelventil (DRV) | Einspritzung Diesel, Common Rail | ja (10:1 empfohlen); Strom mit Zange |
| mittel | CR-Mengensteuerventil / Zumesseinheit (ZME, QCV) | Einspritzung Diesel, Hochdruckpumpe | ja (10:1 wegen Abschaltspitze empfohlen); Strom mit Zange; Kanal 2 für den Raildrucksensor |
| mittel | Benzin-Hochdruckpumpe – Mengensteuerventil | Einspritzung Otto, Direkteinspritzung | voraussichtlich ja (10:1, Stromzange); nicht verifiziert |
| mittel | Einspritzventil Saugrohr (MPI) – Strombild | Einspritzung Otto, Saugrohr | nur mit Stromzange (Spannungsausgang, BNC); Kanal 2 parallel für das Spannungsbild |
| mittel | Bremslichtschalter / Bremspedalsensor | Fahrwerk – Bremse (Motor-, ESP-, Start-Stopp-Plausibilität) | ja (CH1/CH2 beide Kontakte, zeitliche Reihenfolge beim Treten) |
| mittel | Niveausensor / Höhenstandsensor (LWR, Luftfederung, Dämpferregelung) | Fahrwerk – Niveau / Licht | ja bei analog, PWM und SENT (Hebel langsam bewegen). PSI5-Varianten nur als Stromsignal (Shunt), Decodierung nicht geprüft. |
| mittel | Getriebedrehzahlsensor aktiv (Hall/MR, Eingang/Ausgang/Zwischenwelle) | Getriebe/Antriebsstrang | ja, wenn außen zugänglich. Bei Stromsignal: Spannung an der Sensor-Masse- bzw. Versorgungsleitung gegen Fahrzeugmasse oder Messadapter mit Shunt (z. B. 100 Ω ergibt 0,7/1,4 V bei 7/14 mA; Spannungsverlust beachten). Eine Stromzange müsste mA auflösen. Sensoren in der Mechatronik sind nicht zugänglich. |
| mittel | EV: 12-V-Bordnetz / DC/DC-Wandler (Laden der 12-V-Batterie) | Hochvolt/E-Antrieb, 12-V-Seite | 12-V-Seite: Spannung ja; Strom nur mit Hochstromzange |
| mittel | Control Pilot (CP) – Ladekommunikation AC (IEC 61851, Typ 2) | Hochvolt/Laden | technisch ja (±12 V, 1 kHz, 1:1 reicht), aber nur über einen CAT-bewerteten Prüfadapter. Pico nutzt einen aktiven Differenztastkopf 1:20. Gemeinsame Kanalmasse beachten. |
| mittel | Klimakompressor-Regelventil (extern geregelter Kompressor) | Klimaanlage | voraussichtlich ja (Stromzange für den Regelstrom); nicht verifiziert |
| mittel | Keyless-Entry/-Go LF-Antennen (Fahrzeug → Schlüssel) | Komfort/Zugang | ja über Aufnehmerspule bzw. Detektor (Pico nutzt einen Carrier-Signal-Detektor, ca. 300 mm vor dem Griff); 125 kHz liegt weit unter der Bandbreite. Direktmessung an der Antennenleitung: Resonanzspannung unbekannt (nicht quellengeprüft), nur mit 10:1 und nach Herstellerdaten. |
| mittel | Kurbelwellensensor mit Drehrichtungserkennung (Start-Stopp, pulsbreitencodiert) | Motor – Drehzahl/Position | ja. Für die µs-Pulsbreiten mindestens ~1 MS/s wählen; dann umfasst ein 5000-Punkte-Fenster nur ca. 5 ms. Für Auslaufen/Rückpendeln beim Motorstopp eine längere Zeitbasis mit geringerer Auflösung oder Einzelaufnahme mit Trigger. |
| mittel | Ölniveau-/Öltemperatursensor (Ultraschall, PWM-Rahmen, z. B. Hella PULS) | Motor – Füllstand/Temperatur | ja. Zeitbasis so wählen, dass ≥ 1 Rahmen (≥ 1,2 s) erfasst wird; 5000 Punkte reichen für die ms-Pulse. |
| mittel | Sensoren mit SENT-Ausgang (LMM, Drossel-/Pedalposition, Druck, Temperatur) | Motor – Luft/Druck/Position | ja (Pegel und Timing). Für den 3-µs-Tick ≥ 1–2 MS/s nötig; ein 5000-Punkte-Fenster deckt dann nur 2,5–5 ms (≈ 1 Paket) ab. Eine SENT-Decodierung in der OWON-Software ist nicht geprüft, also gegebenenfalls Ticks manuell auszählen. |
| mittel | Tankgeber / Kraftstoffstandgeber (Hebelgeber mit Potentiometer) | Motor/Karosserie – Füllstand | ja (Oszi zeigt Aussetzer beim Durchfahren der Bahn, z. B. am ausgebauten Geber) |
| mittel | Nockenwellenverstellung – VVT-Magnetventil (einfach oder doppelt) | Motorsteuerung, Ventiltrieb | ja; Kanal 2 auf den NW-Sensor zur Plausibilisierung |
| mittel | SENT (SAE J2716) | Sensor-Schnittstelle (Druck, Temperatur, LMM, Drosselklappe) | ja (1:1, Zeitauflösung ausreicht). Tick per Cursor aus dem Kalibrierpuls bestimmen. Keine Dekodierung dokumentiert. |
| mittel | 5-V-Sensorreferenz und Sensormasse | Sensorversorgung durch das Steuergerät | ja (1:1) |
| mittel | Zündverstärker- und Zündspulenmasse (Spannungsfall) | Zündung/Versorgung | ja (1:1, DC-Kopplung, kleiner Messbereich) |
| niedrig | Lambdasonde Titandioxid (Widerstandssonde) | Abgas – Lambda | ja |
| niedrig | AdBlue/SCR-Dosierventil | Abgasnachbehandlung Diesel | voraussichtlich ja (10:1, Stromzange); nicht verifiziert |
| niedrig | Lampen-/LED-Ansteuerung (PWM, Kaltlampenprüfimpulse) | Beleuchtung/Karosserieelektronik | ja |
| niedrig | Bordnetz-Transienten (Load Dump, Schaltspitzen) | Bordnetz 12 V/24 V | ja mit 10:1 (bis 400 Vss), Single-Trigger |
| niedrig | 48-V-Bordnetz (Mild-Hybrid) | Bordnetz 48 V | Spannung ja mit 10:1; Strom nur mit Zange |
| niedrig | Single-Wire-CAN (SAE J2411) | Bussystem (GM GMLAN; Tesla auf dem CP-Leiter) | ja (Eindraht gegen Masse). Am CP-Leiter nur mit Ladeadapter und Qualifikation. |
| niedrig | Automotive Ethernet 10BASE-T1S | Bussystem (Multidrop-Ethernet, neu) | eingeschränkt: Pegel und Aktivität ja (2 Kanäle gegen Masse, Math A−B). Flanken und Timing bei 25 MHz grenzwertig; Pico nutzt x10-High-Speed-Tastköpfe. |
| niedrig | SAE J1850 PWM/VPW | Diagnose- und Fahrzeugbus (ältere US-Fahrzeuge) | ja |
| niedrig | K-Leitung (ISO 9141-2 / ISO 14230 KWP2000) | Diagnoseschnittstelle (ältere Fahrzeuge) | ja (12-V-Pegel; 1:1 bis 40 Vss möglich, 10:1 empfohlen) |
| niedrig | Pumpe-Düse-Einheit (VAG PD) – Magnetventil bzw. Piezo | Einspritzung Diesel, Pumpe-Düse | Magnetventil-Variante: Strom ja mit Zange, Spannung ja mit 10:1. Piezo-Variante wie Piezo-Injektor (grenzwertig). |
| niedrig | Gas-Einblasventile (LPG/CNG) | Einspritzung Gas (Nachrüst- oder Werksanlage) | ja (10:1, Stromzange) |
| niedrig | Automatikgetriebe-Magnetventile (Druckregler, Schaltventile) | Getriebe | ja, sofern die Leitungen zugänglich sind (oft in der Mechatronik integriert) |
| niedrig | Resolver (Rotorlage E-Maschine) | Hochvolt/E-Antrieb | nur sehr eingeschränkt: Pico hält Oszis mit gemeinsamer Kanalmasse für ungeeignet (mehrere Differenzmessungen, Differenztastkopf 1400 V auf der Erregung). Der VDS1022I hat gemeinsame Masse und nur 2 Kanäle; höchstens 2 Signale, jeweils mit Differenztastkopf. |
| niedrig | Phasenströme E-Maschine (Inverter-Ausgang) | Hochvolt/E-Antrieb | eingeschränkt: max. 2 von 3 Phasen, nur mit HV-tauglicher (CAT-bewerteter) Stromzange mit Spannungsausgang; keine galvanische Verbindung zum HV |
| niedrig | HV-Batterie- und Zwischenkreisstrom (Antrieb/Rekuperation) | Hochvolt/E-Antrieb | nur mit HV-tauglicher DC-Hochstromzange (BNC-Ausgang) |
| niedrig | HV-Schütze (SMR) – Ansteuerung und Vorladung | Hochvolt/E-Antrieb | Steuerkreise ja, 2 von 3 gleichzeitig |
| niedrig | Berührungslose Messung an HV-Leitungen (z. B. AC-Ladestrom EVSE → OBC) | Hochvolt/Laden | eingeschränkt, nur qualitativ (mit Signalsonde mit BNC-Ausgang) |
| niedrig | HV-Interlock (HVIL) | Hochvolt/Sicherheitskreis | voraussichtlich ja auf der Niedervoltseite; nicht verifiziert |
| niedrig | Elektrischer Klimakompressor (HV) – Strom und Drehzahlansteuerung | Hochvolt/Thermomanagement | LIN-Seite ja; HV-Strom nur mit HV-tauglicher Zange |
| niedrig | Resolver der E-Maschine (Rotorlage) | HV-Antrieb (EV/Hybrid) | nur eingeschränkt: Die Kanäle haben gemeinsame Masse, floatende Wicklungen erfordern Differenztastköpfe; eine Messung wie bei Pico (3 Kanäle) ist mit 2 Kanälen nicht vollständig möglich |
| niedrig | Ethanol-/Flex-Fuel-Sensor (Kraftstoffzusammensetzung) | Motor – Kraftstoff | ja |
| niedrig | Luftmengenmesser Stauklappe (Potentiometer, Altfahrzeuge) | Motor – Luft | ja (gut geeignet, um Aussetzer auf der Kohlebahn zu finden) |
| niedrig | Turbolader-Drehzahlsensor | Motor – Luft/Aufladung | vermutlich ja (Frequenzbereich unbekannt, nicht geprüft) |
| niedrig | Drosselklappenschalter (Leerlauf-/Volllastkontakt) | Motor – Luft/Position | ja (CH1 Leerlauf, CH2 Volllast) |
| niedrig | Schrittmotor (Leerlauf, Drosselklappenanschlag) | Motorsteuerung (älter) | ja, aber nur 2 von 4 Phasen gleichzeitig |
| niedrig | Leerlaufsteller (Drehsteller oder Linearmagnet) | Motorsteuerung Otto (älter) | ja (2 Kanäle reichen auch für die Doppelwicklung) |
| niedrig | Kondensatorzündung (CDI) | Zündung (vor allem Zweirad und Kleinmotoren) | Triggerseite ja. Den Kondensatorkreis nein: er überschreitet 400 Vss mit 10:1, nur mit 100:1-Tastkopf. |
| niedrig | Ionenstrommessung (Saab Trionic) | Zündung/Verbrennungserkennung | nur indirekt (Ausgangssignale der Kassette, 12-V-Pegel). Den Ionenstrom selbst nicht abgreifen; Machbarkeit unsicher. |

## Sensoren

> Motor, Abgas/Lambda/AGN, Getriebe/Antriebsstrang, Fahrwerk/Bremse/ESP/Lenkung, Klima/Komfort/Karosserie/Assistenz, HV-Randbereich). Hinweise: (1) Die Websuche-Kontingente der Sitzung waren am Ende erschöpft. Die letzten Lücken (AQS, Partikelsensor, PSG, AdBlue, Kühlmittelstand, Turbodrehzahl) sind deshalb mit 'nicht quellengeprüft' markiert. (2) In 'quellen' stehen nur Seiten, die tatsächlich geöffnet und gelesen wurden. (3) Die Pico-Guided-Test-Seiten enthalten im Text oft keine Zahlen, weil die Beispielkurven nur als Bild vorliegen. Werte, die nicht aus Quellen stammen, sind als 'Fachwissen, nicht quellengeprüft' gekennzeichnet. (4) Zum VDS1022I gilt allgemein: Die Bandbreite (25 MHz) reicht für alle Sensorsignale, die schnellsten liegen im Bereich 10–150 kHz. Begrenzend sind die gemeinsame Masse beider Kanäle (bei floatenden Signalen beachten) und der Speicher von 5000 Punkten (Zeitfenster und Abtastrate abwägen).

### Motor – Drehzahl/Position

**Kurbelwellensensor induktiv (2-polig, passiv)** · induktiv (generatorische Wechselspannung) · Priorität hoch · Karte: kw-ind

- Typische Werte: Die Wechselspannung ist sinusähnlich. Amplitude und Frequenz steigen mit der Drehzahl. Die Bezugsmarke (Zahnlücke) zeigt sich als Abschnitt mit geringer Spannung, die Zähne beiderseits der Lücke erzeugen größere Ausschläge (Pico AGT-017). Pico nennt keine Spannungswerte. Die Pegel sind hersteller- und drehzahlabhängig; beim Starten liegen sie typ. im niedrigen Voltbereich, bei hoher Drehzahl deutlich höher (Fachwissen, nicht quellengeprüft). Pico unterscheidet zwei Ausführungen: 'floating' (beide Leitungen zum Steuergerät, AGT-428/429) und 'non-floating' (AGT-017/430).
- VDS1022I: ja, mit 10:1-Tastkopf. Achtung bei 'floating'-Ausführung: Beide Kanäle haben eine gemeinsame Masse. Das Massekrokodil darf nur dann an die zweite Sensorleitung, wenn der andere Kanal nicht an Fahrzeugmasse hängt, sonst wird diese Leitung auf Masse gelegt. Alternativ jede Leitung gegen Masse messen (CH1/CH2) und die Differenz bilden (ob die OWON-Software Math A−B bietet: nicht geprüft).
- Sicherheit: Keine elektrische Gefahr. Mechanisch: Abstand zu Riemen und Lüfter halten.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/crankshaft-position/AGT-017-crankshaft-position-non-floating-cranking/> · <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**Kurbelwellensensor Hall/MR (aktiv, 3-polig)** · digital (Rechteck, Hall/magnetoresistiv) · Priorität hoch · Karte: kw-hall

- Typische Werte: Das Rechteck schaltet zwischen ca. 0 V und der Versorgungs- bzw. Pull-up-Spannung, typ. 5 V oder 12 V (herstellerabhängig; Pico-Leitfaden zeigt einen 12-V-Sensor, AGT-061 einen 0/5-V-Sensor). Die Frequenz ist proportional zur Drehzahl, die Bezugsmarke erscheint als längere Periode.
- VDS1022I: ja (1:1 oder 10:1, DC-Kopplung)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/camshaft-position/AGT-061-camshaft-position-hall-effect/> · <https://www.picoauto.com/download/documents/manuals/picoscope-guide-to-oscilloscope-diagnostics.pdf>

**Kurbelwellensensor mit Drehrichtungserkennung (Start-Stopp, pulsbreitencodiert)** · digital, pulsbreitencodiert (Open Collector) · Priorität mittel · Karte: fehlt (Ergänzung zu kw-hall)

- Typische Werte: Bosch-Datenblatt HA-Di (Motorsport, Prinzip übertragbar, Serienwerte herstellerabhängig): Pulsbreite vorwärts 37–53 µs (typ. 45 µs), rückwärts 75–105 µs (typ. 90 µs). Max. Frequenz ≤ 10 kHz vorwärts und ≤ 6 kHz rückwärts. Versorgung 5–16 V, Ausgang Open Collector für 1 kΩ, Luftspalt 0,4–1,0 mm. Die Drehrichtung erkennt man am Oszi an der Pulsbreite, nicht am Pegel.
- VDS1022I: ja. Für die µs-Pulsbreiten mindestens ~1 MS/s wählen; dann umfasst ein 5000-Punkte-Fenster nur ca. 5 ms. Für Auslaufen/Rückpendeln beim Motorstopp eine längere Zeitbasis mit geringerer Auflösung oder Einzelaufnahme mit Trigger.
- Sicherheit: keine besondere
- Quellen: <https://www.bosch-motorsport.com/media/catalog_content/downloads_catalog/pdf_catalog/data_sheet_69979403_speed_sensor_hall-effect_ha-di.pdf>

**Nockenwellensensor Hall** · digital (Rechteck) · Priorität hoch · Karte: kw-hall

- Typische Werte: Pico AGT-061: digitaler Ausgang, der zwischen 0 V und 5 V schaltet. Es gibt auch 12-V-Varianten (Pico-Leitfaden). Die Frequenz hängt von der Nockenwellendrehzahl ab. Beispiel Phasenerkennung (Pico): Ein 4-Zylinder kann innerhalb von 180° KW (= 90° NW) starten.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/camshaft-position/AGT-061-camshaft-position-hall-effect/>

**Nockenwellensensor induktiv** · induktiv · Priorität niedrig · Karte: kw-ind (Prinzip identisch)

- Typische Werte: Gleiches Prinzip wie der induktive KW-Sensor (Pico AGT-011). Pico nennt im Text keine Zahlenwerte, die Pegel sind herstellerabhängig.
- VDS1022I: ja (10:1)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**KW/NW-Synchronisation (Phasenlage, inkl. Nockenwellenverstellung)** · 2-Kanal-Vergleich digital/induktiv · Priorität hoch · Karte: kwnw-sync

- Typische Werte: Die relative Lage von KW- und NW-Bezugsmarke wird in Grad oder Zähnen ausgewertet (Pico AGT-151, Kanal A = KW, Kanal B = NW, Leerlauf). Die Sollwerte sind motorspezifisch.
- VDS1022I: ja (2 Kanäle reichen; beide Signale massebezogen). Bei 720° KW im Leerlauf reicht die Auflösung trotz 5000 Punkten (Fachwissen).
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/system-tests/camshaft-position/crankshaft-position/AGT-151-crankshaft-position-vs-camshaft-position/>

**Zündverteiler-Geber (Hall bzw. induktiv, Altfahrzeuge)** · digital (Hall) bzw. induktiv · Priorität niedrig · Karte: kw-hall / kw-ind (teilweise)

- Typische Werte: Pico führt eigene Tests (AGT-020 Hall, AGT-019 induktiv). Die Werte entsprechen den Hall- bzw. Induktivgebern, sind herstellerabhängig und im Pico-Text nicht beziffert.
- VDS1022I: ja
- Sicherheit: Zündanlage in der Nähe: Sekundärspannung nicht berühren.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

### Motor – Luft/Aufladung

**Turbolader-Drehzahlsensor** · unsicher (vermutlich digital/Frequenz) · Priorität niedrig · Karte: fehlt

- Typische Werte: Nicht quellengeprüft: Bei einigen Motoren verbaut, Signalart und Pegel herstellerabhängig. Wegen des erschöpften Suchkontingents nicht recherchiert.
- VDS1022I: vermutlich ja (Frequenzbereich unbekannt, nicht geprüft)
- Sicherheit: heißer Bereich (Turbolader)

**Positionssensoren AGR/VTG/Drallklappe/Wastegate** · analog / PWM / SENT (herstellerabhängig) · Priorität hoch · Karte: pos-sensor

- Typische Werte: Siehe Karte pos-sensor. Für SENT-Varianten gelten die SENT-Werte (Pico AGT-404).
- VDS1022I: ja
- Sicherheit: heiße Bauteile (Turbo/AGR)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/communication/sent/AGT-404-sent-fast-extended-testing/>

### Motor – Luft

**Luftmassenmesser analog (Heißfilm/Hitzdraht)** · analog (Spannung) · Priorität hoch · Karte: lmm-ana

- Typische Werte: Die Analogspannung steigt mit der Luftmasse und liegt im 0–5-V-Bereich (Fachwissen, nicht quellengeprüft; Pico AGT-007/009 ohne Zahlen im Text). Pico prüft bei Leerlauf, Vollgas und Schub; typische Fehler sind Unterbrechung, Kurzschluss und Übergangswiderstand.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/air-flow-mass/AGT-007-air-flow-meter-hot-wire-gasoline/>

**Luftmassenmesser digital (Frequenzsignal, z. B. Bosch HFM6)** · digital (Frequenz) · Priorität hoch · Karte: lmm-dig

- Typische Werte: Bosch HFM6 bei Zündung an, Motor aus und ruhender Luft: 1,76–1,93 kHz. Liegt der Wert außerhalb, ist der Sensor laut Pico defekt. Die Frequenz steigt mit der Luftmasse.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/air-flow-mass/AGT-095-air-mass-meter-digital/>

**Luftmengenmesser Stauklappe (Potentiometer, Altfahrzeuge)** · analog (Schleiferpotentiometer) · Priorität niedrig · Karte: fehlt

- Typische Werte: Die federbelastete Klappe bewegt einen Schleifer über eine Kohlebahn, die Spannung hängt von der Klappenstellung ab. Varianten mit 4, 5 (CO-Poti) und 7 Pins (zusätzlich Pumpenkontakt, schließt nach ca. 5° Klappenweg). Systeme: Bosch L/LE/LE3, Motronic, Ford EEC IV. Spannungswerte nennt Pico nicht.
- VDS1022I: ja (gut geeignet, um Aussetzer auf der Kohlebahn zu finden)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/air-flow-mass/AGT-008-air-flow-meter-air-vane-gasoline/>

**T-MAP (Druck + Temperatur kombiniert)** · analog (2 Signale) · Priorität mittel · Karte: map + ntc

- Typische Werte: Pico führt einen eigenen 2-Kanal-Test (AGT-136, Turbodiesel). Druckspur wie MAP, Temperaturspur wie NTC; Werte herstellerabhängig.
- VDS1022I: ja (CH1 Druck, CH2 Temperatur)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**Umgebungsdrucksensor (Höhenkorrektur)** · analog/digital, meist im Steuergerät · Priorität niedrig · Karte: map (falls separat) · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft: häufig im Motorsteuergerät integriert und dann nicht zugänglich. Separate Ausführungen verhalten sich wie MAP.
- VDS1022I: nein, wenn im Steuergerät integriert; sonst wie MAP
- Sicherheit: keine besondere

### Motor – Luft/Temperatur

**Ansauglufttemperatur als PWM (im digitalen LMM integriert)** · PWM · Priorität mittel · Karte: lmm-dig (teilweise) / ntc

- Typische Werte: Fester Takt um 20 kHz, das Tastverhältnis codiert die Temperatur. Am festen Takt lässt sich die Leitung vom Luftmassen-Frequenzsignal unterscheiden (Pico AGT-095).
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/air-flow-mass/AGT-095-air-mass-meter-digital/>

### Motor – Luft/Druck/Position

**Sensoren mit SENT-Ausgang (LMM, Drossel-/Pedalposition, Druck, Temperatur)** · digital seriell (SENT, SAE J2716, Ein-Draht, Punkt-zu-Punkt) · Priorität mittel · Karte: teilweise: SENT-Erklärbild, edk, pos-sensor; eigene Karte fehlt

- Typische Werte: Pico AGT-403/404: Tick typ. 3 µs, bis 90 µs möglich. Der Kalibrier-/Sync-Puls wird durch 56 geteilt (Beispiel 168 µs/56 = 3 µs). Ein Nibble hat 4 Bit, gemessen zwischen fallenden Flanken; Beispiel 51 µs = 17 Ticks → Wert 5. Ein Paket enthält Status-, bis zu 6 Daten- und ein CRC-Nibble; Sensordaten 12 Bit. Serielle Botschaft: kurz über 16, erweitert über 18 Pakete (CRC 4 bzw. 6 Bit). Pegel nennt Pico nicht. Sensoren mit SENT laut Pico: Luftmasse, Drosselposition, Druck, Temperatur.
- VDS1022I: ja (Pegel und Timing). Für den 3-µs-Tick ≥ 1–2 MS/s nötig; ein 5000-Punkte-Fenster deckt dann nur 2,5–5 ms (≈ 1 Paket) ab. Eine SENT-Decodierung in der OWON-Software ist nicht geprüft, also gegebenenfalls Ticks manuell auszählen.
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/communication/sent/AGT-403-sent-slow-standard-testing/> · <https://www.picoauto.com/library/automotive-guided-tests/communication/sent/AGT-404-sent-fast-extended-testing/>

### Motor – Luft/Druck

**Saugrohrdrucksensor analog (MAP), auch Ladedrucksensor** · analog (ratiometrisch 5 V) · Priorität hoch · Karte: map

- Typische Werte: 5-V-Referenz; die Spannung folgt dem Absolutdruck (Fachwissen, nicht quellengeprüft; Pico AGT-024/010 ohne Zahlen im Text). Prüfbedingungen: Leerlauf, Gasstoß und Schub.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**MAP digital (Frequenzausgang, z. B. Ford)** · digital (Frequenz) · Priorität niedrig · Karte: map (teilweise, nur wenn die Karte die Frequenzvariante nennt)

- Typische Werte: Pico AGT-025 (Saugbenziner): ca. 160 Hz bei Atmosphärendruck (höchster Wert), ca. 80–100 Hz bei starkem Unterdruck (Leerlauf, Schub). Drei Leitungen: Referenz typ. 5 V, Masse, Signal.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/manifold-air-pressure/AGT-025-manifold-absolute-pressure-digital/>

### Motor – Luft/Position

**Drosselklappenpotentiometer (einfach, ältere Systeme)** · analog (Potentiometer) · Priorität mittel · Karte: edk (teilweise)

- Typische Werte: Pico AGT-029: Die Spannung folgt der Drosselklappenstellung. Für Aussetzer langsam durchfahren; Werte herstellerabhängig.
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**Drosselklappenschalter (Leerlauf-/Volllastkontakt)** · Schaltsignal (2 Kontakte) · Priorität niedrig · Karte: fehlt

- Typische Werte: Pico AGT-028: meist 3-polig mit 5-V-Versorgung, bei sehr frühen Systemen 12 V. Klappe zu: Leerlaufkontakt geschlossen, Volllast offen. Teillast: beide offen. Vollgas: Leerlauf offen, Volllast geschlossen. Messung mit 2 Kanälen.
- VDS1022I: ja (CH1 Leerlauf, CH2 Volllast)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/throttle-position/AGT-028-throttle-position-switch/>

**E-Drosselklappe Positionssensor (Doppelsignal)** · analog (2 Spuren) oder digital/SENT · Priorität hoch · Karte: edk

- Typische Werte: Zwei redundante Spuren, Verlauf herstellerabhängig (gegenläufig oder gleichlaufend). Siehe Karte edk; Werte dort.
- VDS1022I: ja (2 Kanäle)
- Sicherheit: Nicht in die Klappe greifen, der Stellmotor kann bei Zündung an verfahren.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

### Motor – Position

**Fahrpedalgeber analog (2 Spuren)** · analog (2 Spuren) · Priorität hoch · Karte: edk

- Typische Werte: Pico AGT-063: CH A und CH B je an einer Spur, Zündung an, Pedal betätigen. Pico nennt keine Zahlen. Das Spurverhältnis ist herstellerabhängig, z. B. Spur 2 halb so groß wie Spur 1 oder gegenläufig (Fachwissen, nicht quellengeprüft).
- VDS1022I: ja (2 Kanäle)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/accelerator-pedal-position/AGT-063-accelerator-pedal-position-analog/>

**Fahrpedalgeber digital** · digital (Protokoll herstellerabhängig, z. B. SENT/PWM) · Priorität mittel · Karte: edk + SENT-Erklärbild (teilweise)

- Typische Werte: Pico führt einen eigenen Test (AGT-850), nennt aber weder Protokoll noch Pegel. Bei SENT-Ausführung gelten die SENT-Werte (Tick typ. 3 µs).
- VDS1022I: ja (Pegel/Timing); Decodierung siehe SENT
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/accelerator-pedal-position/AGT-850-accelerator-pedal-position-digital/>

### Motor/Bremse – Druck

**Bremskraftverstärker-Unterdrucksensor** · analog (vermutlich ratiometrisch wie MAP) · Priorität niedrig · Karte: map (Prinzip, teilweise)

- Typische Werte: Nicht quellengeprüft: Ausführung und Kennlinie herstellerabhängig.
- VDS1022I: vermutlich ja (nicht geprüft)
- Sicherheit: keine besondere

### Motor – Druck

**Öldrucksensor / Öldruckschalter** · Schalter / analog / PWM (herstellerabhängig) · Priorität mittel · Karte: oeldruck

- Typische Werte: Siehe Karte oeldruck. Es gibt auch kombinierte Druck-/Temperatursensoren mit PWM-Ausgang (Hella; Werte hier nicht recherchiert).
- VDS1022I: ja
- Sicherheit: keine besondere

### Motor – Kraftstoff/Druck

**Raildrucksensor (Common-Rail / Benzin-DI)** · analog (0,5–4,5 V), teils SENT · Priorität hoch · Karte: raildruck

- Typische Werte: Pico AGT-138 (Bosch CRD): Signal 0,5–4,5 V je nach Druck; 0 V oder 5 V gelten als unplausibel. Bei länger anhaltender Volllast über 2,5 V, im Extremfall bis 4,5 V. Fällt die Spannung nach Motorstopp schnell auf 0,5 V, deutet das auf ein Leck im Hochdruck hin. Messbereich 0–1600 bar, systemabhängig höher. Ablauf: 5–10 s Leerlauf, 2–3 s Volllast, 5–10 s zurück in Leerlauf. Drucksensoren gibt es auch mit SENT (Pico AGT-404: Beispiel 12+12-Bit-Drucksensor).
- VDS1022I: ja (lange Zeitbasis, Roll-Modus)
- Sicherheit: Hochdruck: nie bei laufendem Motor an Leitungen arbeiten; Kraftstoffstrahl verletzt Haut.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/fuel-pressure/AGT-138-crd-bosch-fuel-rail-pressure/> · <https://www.picoauto.com/library/automotive-guided-tests/communication/sent/AGT-404-sent-fast-extended-testing/>

**Kraftstoff-Niederdrucksensor (DI-Vordruck / Diesel-Vorförderung)** · analog (vermutlich ratiometrisch) oder SENT · Priorität niedrig · Karte: raildruck (Prinzip, teilweise)

- Typische Werte: Nicht quellengeprüft: Prinzip wie Raildrucksensor, Messbereich niedriger, Kennlinie herstellerabhängig.
- VDS1022I: ja
- Sicherheit: Kraftstoff: Brandgefahr, keine Funken

### Motor – Druck (Diesel)

**Brennraumdruck-Glühkerze (Drucksensor-Glühkerze)** · unsicher (vermutlich digital/aufbereitet) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft (Suchkontingent erschöpft). Nur bei wenigen Diesel-Motoren verbaut.
- VDS1022I: unbekannt
- Sicherheit: Glühstromkreis: hohe Ströme

### Abgas/AGN – Druck

**Abgasdruck-/Abgasgegendrucksensor** · analog (vermutlich wie Differenzdrucksensor) · Priorität niedrig · Karte: dpf (Prinzip, teilweise)

- Typische Werte: Nicht quellengeprüft; Prinzip wie DPF-Differenzdrucksensor (Karte dpf).
- VDS1022I: ja
- Sicherheit: heiße Abgasanlage

**DPF-Differenzdrucksensor** · analog (ratiometrisch) bzw. herstellerabhängig · Priorität mittel · Karte: dpf

- Typische Werte: Siehe Karte dpf.
- VDS1022I: ja
- Sicherheit: heiße Abgasanlage

### Motor/Getriebe/Klima – Temperatur

**Temperatursensoren NTC (Kühlmittel, Ansaugluft, Öl, Kraftstoff, Getriebeöl, Klima)** · analog (Spannungsteiler mit 5-V-Referenz) · Priorität hoch · Karte: ntc

- Typische Werte: Pico AGT-015: 5-V-Referenz, bei abgezogenem Sensor müssen 5 V am Signal anliegen. Bei NTC fallen Widerstand und Spannung mit steigender Temperatur, PTC verhält sich umgekehrt. Der Kreis reagiert empfindlich auf Übergangswiderstände. Pico: Das Scantool kann einen Sensorfehler verdecken, die Kurve bestätigt ihn.
- VDS1022I: ja (sehr lange Zeitbasis bzw. Roll-Modus für den Warmlauf)
- Sicherheit: heißes Kühlsystem nicht öffnen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/coolant-temperature/AGT-015-engine-coolant-temperature-5-v/>

### Abgas/AGN – Temperatur

**Abgastemperatursensor** · analog (PTC/Thermoelement-abhängig) · Priorität mittel · Karte: agt

- Typische Werte: Siehe Karte agt.
- VDS1022I: ja
- Sicherheit: heiße Abgasanlage

### Motor – Füllstand/Temperatur

**Ölniveau-/Öltemperatursensor (Ultraschall, PWM-Rahmen, z. B. Hella PULS)** · PWM (Open Collector, 3 codierte Pulse pro Rahmen) · Priorität mittel · Karte: fehlt

- Typische Werte: Hella-Datenblatt: Rahmen alle 1000 ms ±10 % aus drei Pulsen in je 110-ms-Perioden: T1 Temperatur, T2 Füllstand, T3 Diagnose. T1 23 ms = −40 °C bis 87 ms = 160 °C (3,125 K/ms); 22 ms = Temperaturelement kurzgeschlossen, 88 ms = unterbrochen. T2 23 ms = 0 mm, 28,622 ms = 13 mm, 87,86 ms = 150 mm (2,3125 mm/ms); 22 ms = Signal unzuverlässig. T3 22 ms = Status OK; 33/44/55/66 ms = Fehlerklassen (Spannung, Piezo, Temperatur, Füllstand außerhalb des Bereichs). Pull-up 1,6–10 kΩ im Steuergerät, Pull-up-Spannung max. 16 V. Low-Pegel ≤ 0,0375·Vpullup + 1 V. Versorgung 9–16 V. Füllstand wird erst über −10 °C ausgegeben.
- VDS1022I: ja. Zeitbasis so wählen, dass ≥ 1 Rahmen (≥ 1,2 s) erfasst wird; 5000 Punkte reichen für die ms-Pulse.
- Sicherheit: keine besondere
- Quellen: <https://www.hella.com/resources-soe/assets/documents/2106-KI-Oelniveausensoren-FORVIA-HELLA-EN.pdf>

### Motor – Klopfen

**Klopfsensor (Piezo)** · Piezo-Wechselspannung (generatorisch) · Priorität mittel · Karte: klopf

- Typische Werte: Pico AGT-021: 10:1-Tastkopf; Klopfen durch leichtes Klopfen mit Metallgegenstand auf den Block simulieren. Zahlenwerte nennt Pico nicht (siehe Karte klopf).
- VDS1022I: ja (10:1, AC- oder DC-Kopplung)
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/knock/AGT-021-knock-sensor/>

### Motor/Karosserie – Füllstand

**Tankgeber / Kraftstoffstandgeber (Hebelgeber mit Potentiometer)** · analog (Widerstand bzw. Spannungsteiler) · Priorität mittel · Karte: fehlt

- Typische Werte: Der Schwimmer am Hebel bewegt einen Schleifer, der Widerstand ändert sich mit dem Füllstand. Das Steuergerät legt eine Referenzspannung an (Spannungsteiler). Typischer Fehler: Verschleiß der Bahn im meistgenutzten Bereich (Reserve bis ¾), außerdem vollgesogener oder klemmender Schwimmer, Stecker- und Masseprobleme. Satteltanks haben oft 2 Geber. Widerstands- und Spannungswerte sind herstellerabhängig, die Quelle nennt keine.
- VDS1022I: ja (Oszi zeigt Aussetzer beim Durchfahren der Bahn, z. B. am ausgebauten Geber)
- Sicherheit: Kraftstoffdämpfe: Ex-Gefahr beim Öffnen des Tanks, keine Funken
- Quellen: <https://kfz-dietrich.com/blog/fehlercode-p0461-tankgeber-werkstatt-diagnose/>

**Kühlmittelstandsensor** · Schaltsignal (Schwimmer, vermutlich Reedkontakt) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: ja, Multimeter genügt
- Sicherheit: Kühlsystem nicht heiß öffnen

### Motor – Kraftstoff

**Ethanol-/Flex-Fuel-Sensor (Kraftstoffzusammensetzung)** · digital (Frequenz = Ethanolanteil, Pulsbreite = Kraftstofftemperatur) · Priorität niedrig · Karte: fehlt

- Typische Werte: Continental-Sensor laut HP Academy: 50 Hz = E0, 150 Hz = E100; Pulsbreite 1 ms = −40 °C, 5 ms = 125 °C. Versorgung und Pull-up nennt die Quelle nicht. In DE selten verbaut.
- VDS1022I: ja
- Sicherheit: Kraftstoff: Brandgefahr
- Quellen: <https://www.hpacademy.com/technical-articles/how-to-find-out-what-percentage-of-ethanol-is-in-your-fuel/>

**Wasser-im-Diesel-Sensor (Kraftstofffilter)** · unsicher (Schalt- oder Analogsignal) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: vermutlich ja (DC-Pegel; Multimeter meist ausreichend)
- Sicherheit: keine besondere

### Abgas – Lambda

**Lambdasonde Sprungsonde (Zirkonia) vor Kat** · analog (generatorisch, 0–1 V) · Priorität hoch · Karte: lam-sprung

- Typische Werte: Pico AGT-022: fett ca. 0,8 V, mager ca. 0,2 V, Regelfrequenz ca. 1 Zyklus/s. Erst ab ca. 300 °C aktiv, nur im geschlossenen Regelkreis (Leerlauf, Teillast). Eine verschmutzte Sonde reagiert langsamer oder schwächer.
- VDS1022I: ja
- Sicherheit: heißes Abgas
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/oxygen/AGT-022-oxygen-zirconia-output/>

**Lambdasonde Titandioxid (Widerstandssonde)** · analog (Widerstandsänderung an 5-V-Referenz) · Priorität niedrig · Karte: fehlt

- Typische Werte: Pico AGT-023: Die Sonde erzeugt selbst keine Spannung, das Steuergerät legt 5 V an. Fett ca. 4,5 V, mager ca. 0,2 V, Regelung ca. 1 Hz. Meist 4 Leitungen inkl. Heizung. Dauerhaft hoch heißt dauerhaft fett, dauerhaft niedrig heißt mager.
- VDS1022I: ja
- Sicherheit: heißes Abgas
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/oxygen/AGT-023-oxygen-titania-output/>

**Nachkatsonde / Kat-Wirkungsprüfung** · analog (Sprungsonde) · Priorität hoch · Karte: lam-nachkat

- Typische Werte: Siehe Karte lam-nachkat. Pico prüft vor und nach Kat zweikanalig (AGT-128) und Nachkatsonde mit Heizung (AGT-937).
- VDS1022I: ja (2 Kanäle: vor/nach Kat)
- Sicherheit: heißes Abgas
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

**Breitbandsonde (Bosch LSU 4.2/4.9, Pumpstrom)** · analog/Strom (Pumpzelle), Nernstzelle geregelt · Priorität hoch · Karte: lam-lsu

- Typische Werte: Pico AGT-870: Kanal A an Klemme 1 (Pumpzellenkreis, typ. rotes Kabel), Masse an Batterie-Minus, Bandbreitenbegrenzung 20 kHz empfohlen. Messbereich ca. 10:1 bis 20:1 AFR, 20:1 = Umgebungsluft. Bezug: Sprungsonde hat ca. 450 mV bei λ = 1. Pumpstromwerte nennt Pico nicht (siehe Karte lam-lsu).
- VDS1022I: ja (Spannungen gegen Masse). Der VDS1022I hat keinen 20-kHz-BW-Filter wie Pico, ggf. Mittelwertbildung (nicht geprüft).
- Sicherheit: heißes Abgas
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/oxygen/AGT-870-bosch-lsu-49-oxygen-sensor-switching/>

**Lambdasondenheizung (PWM)** · PWM (Aktor, Sondenheizung) · Priorität mittel · Karte: lam-heiz

- Typische Werte: Siehe Karte lam-heiz. Pico prüft Ausgang und Heizung zweikanalig (AGT-142/937).
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors>

### Abgas/AGN – SCR/NSK

**NOx-Sensor (Smart-Sensor mit eigener Elektronik)** · Bus (CAN 2.0 bzw. SAE J1939) · Priorität niedrig · Karte: can-hs (nur Bus-Ebene)

- Typische Werte: Continental UniNOx: Ausgänge NOx sowie binäre und lineare Lambda bzw. O2-Konzentration; Versorgung 12 V oder 24 V; Abgastemperatur 100–800 °C; ZrO2-Mehrschichtsensor mit Heizung; Datenverbindung CAN 2.0 oder SAE J1939. Der Messwert liegt nur auf dem Bus vor, nicht als Analogspannung.
- VDS1022I: nur Bus-Physik (Pegel, Abschluss, Störungen) wie Karte can-hs; Messwert nicht direkt ablesbar, Decodierung mit OWON-Software nicht geprüft
- Sicherheit: heißes Abgas
- Quellen: <https://www.continental-aftermarket.com/media/3749/continental_uninox_salessheet_final.pdf>

### Abgas/AGN

**Partikelsensor (PM-Sensor nach DPF)** · unsicher (vermutlich Smart-Sensor mit Busanbindung) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft (Suchkontingent erschöpft).
- VDS1022I: unbekannt; vermutlich nur Bus-Ebene
- Sicherheit: heißes Abgas

### Abgas/AGN – SCR

**AdBlue-/Harnstoff-Sensorik (Füllstand, Temperatur, Qualität)** · unsicher (analog, PWM oder Bus, herstellerabhängig) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft (Suchkontingent erschöpft).
- VDS1022I: unbekannt
- Sicherheit: Harnstoff ist korrosiv für Kontakte; Heizungen mit hohem Strom

### Getriebe/Antriebsstrang

**Getriebedrehzahlsensor aktiv (Hall/MR, Eingang/Ausgang/Zwischenwelle)** · Strom- bzw. Rechtecksignal (2-polig, ähnlich aktivem Raddrehzahlsensor), optional CAN · Priorität mittel · Karte: fehlt (Prinzip wie raddreh-akt)

- Typische Werte: Hella: Hall- oder magnetoresistiv; 1–3 Sensoren je nach Getriebe, teils in Mechatronik oder Schieberkasten. Betriebsspannung 4,5–24 V (Nenn 12 V), Stromaufnahme 6–10 mA, Ausgang Rechteck/Puls, Schnittstelle PWM oder optional CAN, Frequenz 0–10 kHz je nach Drehzahl, 2- oder 3-polig. Das Diagramm zeigt Strompegel 7 mA / 14 mA. Eingangssensor (Turbinenwelle) und Ausgangssensor liefern unterschiedliche Frequenzbereiche.
- VDS1022I: ja, wenn außen zugänglich. Bei Stromsignal: Spannung an der Sensor-Masse- bzw. Versorgungsleitung gegen Fahrzeugmasse oder Messadapter mit Shunt (z. B. 100 Ω ergibt 0,7/1,4 V bei 7/14 mA; Spannungsverlust beachten). Eine Stromzange müsste mA auflösen. Sensoren in der Mechatronik sind nicht zugänglich.
- Sicherheit: Fahrzeug auf Hebebühne mit drehenden Rädern: zweite Person, Gefahrenbereich sichern
- Quellen: <https://www.hella.com/resources-soe/assets/documents/260202-Kurz-Info-Gear-Box-Speed-Sensor-EN.pdf>

**Getriebedrehzahlsensor induktiv (ältere Automatikgetriebe)** · induktiv · Priorität niedrig · Karte: kw-ind / raddreh-pass (Prinzip, teilweise)

- Typische Werte: Nicht quellengeprüft; Prinzip wie induktiver KW- bzw. Raddrehzahlsensor.
- VDS1022I: ja (10:1)
- Sicherheit: drehende Teile

**Fahrgeschwindigkeitssensor / Tachogeber (Hall, Getriebeabtrieb)** · digital (Rechteck) · Priorität niedrig · Karte: kw-hall (Prinzip, teilweise)

- Typische Werte: Pico AGT-026: Bewertung über Spannung und Frequenz bei Fahrbedingungen. Prüfung auf Hebebühne mit freien Rädern, 1. Gang oder Rückwärtsgang, zweite Person am Steuer. Zahlenwerte nennt Pico nicht. Die Frequenz ist proportional zur Geschwindigkeit, die Amplitude bleibt konstant (Hall-Prinzip).
- VDS1022I: ja
- Sicherheit: drehende Räder auf der Hebebühne: Gefahrenbereich freihalten
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/road-speed/AGT-026-road-speed-hall-effect/>

**Wählhebel-/Getriebepositionssensor (Multifunktionsschalter)** · unsicher (Schaltkontakte, Hall, PWM oder Bus) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: bei Kontaktausführung ja (DC-Pegel), sonst unbekannt
- Sicherheit: Wählhebel nie bei laufendem Motor ohne Sicherung prüfen

**Druck-/Drehzahl-/Temperatursensoren in der Getriebemechatronik** · intern (im Steuergerät-Verbund) · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: Hella: Drehzahlsensoren sitzen teils direkt in der Mechatronik. Die Signale sind dann nur über Diagnosetester bzw. Bus verfügbar.
- VDS1022I: nein (nicht zugänglich)
- Sicherheit: —
- Quellen: <https://www.hella.com/resources-soe/assets/documents/260202-Kurz-Info-Gear-Box-Speed-Sensor-EN.pdf>

### Antriebsstrang / Start-Stopp / Tempomat

**Kupplungspedal-/Kupplungspositionssensor (Hall)** · digital/analog (Hall, herstellerabhängig) · Priorität mittel · Karte: fehlt

- Typische Werte: Hella (VW Touran 2003–2006): Hall-Sensor am Kupplungsgeberzylinder. Eindringendes Wasser kann ihn zerstören oder die Sicherung auslösen. Symptom: Bremslicht leuchtet bei Zündung an, ABS/EPC/ESP-Leuchten an, ABS-Fehler 00526 'Signal Bremslichtschalter unplausibel'. Pegel nennt die Quelle nicht.
- VDS1022I: ja (Pegelwechsel beim Treten, 2 Kanäle zusammen mit Bremslichtschalter für Plausibilität)
- Sicherheit: keine besondere
- Quellen: <https://www.hella.com/techworld/br/bi/pdf/Volkswagen-Touran-Brake-lights-light-up-when-ignition-is-switched-on/Volkswagen-Touran-Brake-lights-light-up-when-ignition-is-switched-on.pdf>

### Fahrwerk – ABS/ESP

**Raddrehzahlsensor aktiv (Hall/MR, 2-polig, Stromsignal)** · Strom (Rechteck, PWM-codiert) · Priorität hoch · Karte: raddreh-akt

- Typische Werte: Hella: Sensor mit integrierter Elektronik (MR oder Hall) an Multipolring oder Stahlrad mit Magnet. Das Signal wird als PWM-Stromsignal über die Versorgungsleitung übertragen, zweipolig. Erkennung ab 0,1 km/h; Innenwiderstand nicht messbar. Pico AGT-847: Rechteck, Versorgung oft Batteriespannung; keine Widerstandsmessung (Beschädigungsgefahr). Strompegel 7/14 mA (Hella-Diagramm Getriebesensor, gleiches Prinzip).
- VDS1022I: ja: Spannung an der Signalleitung gegen Masse (DC zeigt Versorgungsoffset, AC nur den Wechselanteil) oder Shunt-Adapter. Rad von Hand drehen, Zündung an.
- Sicherheit: Fahrzeug sicher anheben
- Quellen: <https://www.hella.com/techworld/uk/Technical/Sensors-and-actuators/Check-change-ABS-sensor-4074/> · <https://www.picoauto.com/library/automotive-guided-tests/sensors/wheel-speed/AGT-847-wheel-speed-sensor-magnetoresistive/>

**Raddrehzahlsensor aktiv Hall (3-polig, Spannungsausgang, ältere)** · digital (Rechteck) · Priorität mittel · Karte: raddreh-akt (teilweise)

- Typische Werte: Pico (ABS-Speed-Sensor digital): Hall-Raddrehzahlsensor mit positiver Versorgung, meist 5 V; Ausgang Rechteck. Weitere Pegel nennt Pico nicht.
- VDS1022I: ja
- Sicherheit: Fahrzeug sicher anheben
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/abs-speed-sensor-digital/>

**Raddrehzahlsensor passiv (induktiv)** · induktiv (Wechselspannung) · Priorität hoch · Karte: raddreh-pass

- Typische Werte: Hella: Dauermagnet mit Polstift und Wicklung über Impulsrad; Frequenz und Amplitude hängen von der Raddrehzahl ab, die Amplitude muss im vom Steuergerät definierten Bereich liegen. Keine Versorgung, Widerstand mit Ohmmeter prüfbar (Sollwert herstellerabhängig). Pico AGT-003: Rad von Hand drehen; Fehler sind Korrosion, Spänebelag, Luftspalt und beschädigte Zähne. Zahlenwerte nennen beide Quellen nicht.
- VDS1022I: ja
- Sicherheit: Fahrzeug sicher anheben
- Quellen: <https://www.hella.com/techworld/uk/Technical/Sensors-and-actuators/Check-change-ABS-sensor-4074/> · <https://www.picoauto.com/library/automotive-guided-tests/sensors/wheel-speed/AGT-003-wheel-speed-sensor-inductive/>

### Fahrwerk – Lenkung/ESP

**Lenkwinkelsensor** · Bus (CAN) · Priorität niedrig · Karte: can-hs (Bus-Ebene)

- Typische Werte: Bosch LWS (Motorsport-Datenblatt; Serienvarianten herstellerabhängig): GMR-Prinzip mit zwei Messzahnrädern, ±780°, Auflösung 0,1°, Winkelgeschwindigkeit 0–1016 °/s. Ausgabe nur über CAN mit 500 kbit/s und 100 Hz (10 ms), Versorgung 7–16 V. Nach Montage Nullabgleich nötig (Kalibrierstatus-Bit).
- VDS1022I: nur Bus-Physik (CAN-Pegel, Botschaftstakt 10 ms); Winkelwert nicht ohne Decoder
- Sicherheit: Lenkrad mit Airbag: Airbagstecker und -leitungen nicht anmessen (Pyrotechnik)
- Quellen: <https://www.bosch-motorsport.com/content/downloads/raceparts/Resources/pdf/Data Sheet_191153675_Steering_Wheel_Angle_Sensor_LWS.pdf>

### Fahrwerk – Lenkung

**Lenkmomentsensor (elektromechanische Servolenkung)** · unsicher (analog, SENT oder intern, herstellerabhängig) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft; oft im Lenkgetriebe bzw. Servo-Steuergerät integriert.
- VDS1022I: unbekannt; meist nicht zugänglich
- Sicherheit: Lenkung: Sicherheitsbauteil, nach Arbeiten Grundeinstellung beachten

### Fahrwerk – ESP

**Drehraten-/Quer-/Längsbeschleunigungssensor (ESP-Sensorcluster)** · Bus bzw. im ESP-Steuergerät integriert · Priorität niedrig · Karte: can-hs / FlexRay-Erklärbild (nur Bus) · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft (Datenblatt-Zugriff fehlgeschlagen); bei aktuellen Fahrzeugen meist im ESP- oder Airbag-Steuergerät integriert oder über CAN/FlexRay angebunden.
- VDS1022I: nein (nur Bus-Ebene)
- Sicherheit: Sitzt dieser Sensor im Airbag-Steuergerät: nicht anmessen

### Fahrwerk – Bremse/ESP

**Bremsdrucksensor (ESP-Hydroaggregat)** · intern · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft; in der Regel im Hydroaggregat und Steuergerät integriert.
- VDS1022I: nein (nicht zugänglich)
- Sicherheit: Bremsanlage: Sicherheitsbauteil

### Fahrwerk – Bremse (Motor-, ESP-, Start-Stopp-Plausibilität)

**Bremslichtschalter / Bremspedalsensor** · Schaltsignale (meist 2 Kontakte) bzw. Hall · Priorität mittel · Karte: fehlt

- Typische Werte: Hella (VW Touran): ABS-Fehler 00526 'Signal vom Bremslichtschalter unplausibel'; zuerst Schalter, dann Sicherung prüfen. Fachwissen, nicht quellengeprüft: zwei Kontakte, die sich beim Treten gegensinnig oder zeitversetzt ändern und vom Steuergerät plausibilisiert werden; Pegel herstellerabhängig.
- VDS1022I: ja (CH1/CH2 beide Kontakte, zeitliche Reihenfolge beim Treten)
- Sicherheit: keine besondere
- Quellen: <https://www.hella.com/techworld/br/bi/pdf/Volkswagen-Touran-Brake-lights-light-up-when-ignition-is-switched-on/Volkswagen-Touran-Brake-lights-light-up-when-ignition-is-switched-on.pdf>

### Fahrwerk – Bremse

**Bremsbelagverschleiß-Warnkontakt** · Schaltsignal (Kontakt/Leiterschleife) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Hella: Warngrenze in der Regel 2 mm Restbelag. In der einfachen Version wird der eingebettete Warnkontakt durchgeschliffen, der Stromkreis schließt sich und die Warnleuchte geht an. Je nach Anlage 2 oder 4 Kontakte; nach Belagwechsel zwingend erneuern. Andere Systeme werten die Unterbrechung der Schleife aus (herstellerabhängig).
- VDS1022I: ja, aber Multimeter genügt (statisches Signal); Oszi allenfalls für Wackelkontakte
- Sicherheit: Fahrzeug sicher anheben
- Quellen: <https://www.hella.com/techworld/de/ti/pdf/bremsverschleissanzeige-erklaert/bremsverschleissanzeige_erklaert.pdf>

### Fahrwerk – Bremse/Füllstand

**Bremsflüssigkeitsstand-Schalter** · Schaltsignal (Schwimmer, vermutlich Reedkontakt) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: ja, Multimeter genügt
- Sicherheit: Bremsflüssigkeit ist ätzend und hygroskopisch

### Fahrwerk – Niveau / Licht

**Niveausensor / Höhenstandsensor (LWR, Luftfederung, Dämpferregelung)** · analog / PWM / SENT / PSI5 (versionsabhängig, auch CAN/LIN) · Priorität mittel · Karte: fehlt

- Typische Werte: Hella: Hebelarm mit Kugelgelenk am Fahrwerk, Sensorelement Potentiometer, Hall oder induktiv (CIPOS, berührungslos). Ausgang je nach Version analog, PWM, SENT, CAN oder LIN; die gelisteten Typen: analog, PWM, SENT, PSI5. Betriebsspannung 4–11 V, 12 Bit, −40 bis +125 °C. Typische Fehler: fehlende Versorgung oder Leitungsunterbrechung, interner Kurzschluss, mechanische Beschädigung.
- VDS1022I: ja bei analog, PWM und SENT (Hebel langsam bewegen). PSI5-Varianten nur als Stromsignal (Shunt), Decodierung nicht geprüft.
- Sicherheit: Luftfederung: Fahrzeug vor Arbeiten abstützen
- Quellen: <https://www.hella.com/partnerworld/assets/documents/2424-KI-Vehicle-Level-Sensor-HELLA-EN.pdf> · <https://www.hella.com/techworld/en/car-parts/auto-electronics/vehicle-level-sensor/>

### Fahrwerk – Reifen

**Reifendrucksensor (direktes RDKS/TPMS)** · Funk (UHF, FSK) · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: Sigidwiki: 434 MHz in Europa, 315 MHz anderswo; FSK, ca. 100 kHz Bandbreite; einzelne Aussendung ca. 7,55 ms; Symbolrate ca. 20 kbit/s (gemessenes Beispiel).
- VDS1022I: nein (Trägerfrequenz weit über 25 MHz Bandbreite und 100 MS/s); nur mit RDKS-Prüfgerät bzw. Diagnosetester
- Sicherheit: Reifendruck: Ventil- und Sensormontage nach Herstellervorgabe
- Quellen: <https://sigidwiki.com/wiki/Tire_Pressure_Monitoring_System_(TPMS)>

### Klima

**Kältemitteldrucksensor Klimaanlage (analog oder PWM)** · analog (ratiometrisch 5 V) oder PWM (3-polig), teils LIN · Priorität hoch · Karte: fehlt

- Typische Werte: Analog, Saab 9-5 (Beispiel): 5-V-Versorgung, Signal 0,25–4,75 V; Klimasteuergerät schaltet Kompressor unter 1,75 bar und über 28 bar ab, Lüfterstufen bei 9 und 18 bar. PWM laut Valeo: drei Leitungen zum Steuergerät; Beispielschwellen für R1234yf/R134a: Kompressorfreigabe über 2 bar, Lüfterstufe 2 über 16 bar (zurück unter 14 bar), Kompressor aus über 27 bar. Frequenz und Tastverhältnis der PWM-Variante: herstellerabhängig, in den Quellen nicht beziffert.
- VDS1022I: ja (gleichzeitig Manometer an Hochdruckseite anschließen und vergleichen)
- Sicherheit: Kältemittelkreis unter Druck: nicht öffnen; Kältemittel verursacht Erfrierungen
- Quellen: <https://saabwisonline.com/9-5-9600/2004/8-body/heating-and-ventilation-a-c/technical-description/pressure-sensor> · <https://thegrouptrainingacademy.com/wp-content/uploads/sites/2/2024/08/June-2021-TSB-VSA-VCC-062021-03-pressure-sensor-Tips-and-Tricks.pdf>

**Luftgütesensor (AQS, Umluftautomatik)** · unsicher (PWM oder LIN, herstellerabhängig) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft (Suchkontingent erschöpft).
- VDS1022I: unbekannt
- Sicherheit: keine besondere

### Klima/Komfort

**Klima-Temperaturfühler (Verdampfer, Innenraum, Außentemperatur)** · analog (NTC) · Priorität niedrig · Karte: ntc

- Typische Werte: Prinzip wie NTC-Motorsensoren (Pico AGT-015). Werte herstellerabhängig. Pico prüft die Klimaeffizienz über die Temperaturdifferenz Außenluft/Mittendüse (AGT-898).
- VDS1022I: ja
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/system-tests>

### Karosserie/Komfort/Klima

**Regen-/Licht-/Solar-/Feuchtesensor (kombiniert)** · Bus (LIN 2.0) · Priorität niedrig · Karte: lin

- Typische Werte: Hella RLS (4. Generation): Regen, Licht, Solar, Feuchte und HUD-Helligkeit in einem Sensor. Schnittstelle LIN 2.0, Betrieb 9–16 V, Stromaufnahme < 50 mA. Das übergeordnete Steuergerät schaltet den Sensor ein und versorgt ihn. Bei Ausfall des Lichtsensors bleibt das Licht sicher an; bei Ausfall des Regensensors übernimmt das Wischermodul die Intervallsteuerung.
- VDS1022I: ja (LIN-Bus-Physik wie Karte lin; Messwerte nicht ohne Decoder)
- Sicherheit: keine besondere
- Quellen: <https://hella.com/resources-soe/assets/documents/2004_ki_regen-licht_sensor_forvia_hella_en.pdf> · <https://www.hella.com/techworld/cz/technical/car-electronics-and-electrics/check-change-rain-sensor/>

### Assistenz/Karosserie

**Ultraschall-Parksensor (PDC/Einparkhilfe)** · Ultraschall-Burst (akustisch) + digitale Signalleitung zum PDC-Steuergerät · Priorität hoch · Karte: fehlt

- Typische Werte: Pico AGT-814: Piezoelement sendet und empfängt, Ultraschall ca. 40 kHz. Nach dem Senden schwingt das Element aus, das Steuergerät wartet das Ausschwingen ab. Die Entfernung ergibt sich aus der Echo-Laufzeit. Diagnose durch Vergleich der Burst-Amplituden aller Sensoren bei gleichem Detektorabstand (ca. 25 mm). Bosch USS Gen. 6: variable Frequenz 43–60 kHz, Messbereich 15 cm bis 2,5/4,5/5,5 m (6.0/6.1/6.5). Elektrische Pegel der Signalleitung: herstellerabhängig, nicht quellengeprüft.
- VDS1022I: Burst nur mit Ultraschall-Empfänger bzw. Detektor (Zubehör, z. B. 40-kHz-Wandler) am Kanal; die Bandbreite reicht. Signalleitung zum Steuergerät: ja (Spannung gegen Masse).
- Sicherheit: Fahrzeug muss teils mit eingelegtem Gang laufen: zweite Person, Fahrer behält Kontrolle (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/parking/AGT-814-parking-sensors/> · <https://www.boschaftermarket.com/xrm/media/images/services/news_3/23_1_ultrasonic_sensors_generation_6/factsheet_bosch_uss6_en.pdf>

### Komfort/Zugang

**Keyless-Entry/-Go LF-Antennen (Fahrzeug → Schlüssel)** · LF-Funk (magnetisch, ca. 125 kHz), gepulst · Priorität mittel · Karte: fehlt

- Typische Werte: Pico AGT-849: periodische LF-Pulse von Antennen am Fahrzeug, ohne erkannten Schlüssel Intervalle von 250–750 ms; Erfassungsbereich ca. 0,7–1,0 m um Türgriff und Heckstoßfänger; nach 14 Tagen Inaktivität kann das System abschalten. NXP: Schlüssel-IC mit 125-kHz-Weckempfänger und UHF-Sender.
- VDS1022I: ja über Aufnehmerspule bzw. Detektor (Pico nutzt einen Carrier-Signal-Detektor, ca. 300 mm vor dem Griff); 125 kHz liegt weit unter der Bandbreite. Direktmessung an der Antennenleitung: Resonanzspannung unbekannt (nicht quellengeprüft), nur mit 10:1 und nach Herstellerdaten.
- Sicherheit: keine besondere
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/sensors/keyless-entry/AGT-849-keyless-entry/> · <https://www.nxp.com/products/security-and-authentication/secure-car-access/passive-keyless-entry-chip:NCF29AG-H>

**Funkschlüssel UHF (Schlüssel → Fahrzeug)** · Funk UHF · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: NXP-Schlüssel-IC: UHF-Sender (NCF29A1: 310–447 MHz).
- VDS1022I: nein (Frequenz weit über Bandbreite)
- Sicherheit: keine besondere
- Quellen: <https://www.nxp.com/products/security-and-authentication/secure-car-access/tiny-single-chip-passive-keyless-entry-go-solution%3ANCF29A1MHN>

### Assistenz

**Radarsensor (ACC/Notbremsassistent)** · Radar 76–77 GHz (FMCW); Ausgabe über Bus · Priorität niedrig · Karte: can-hs / can-fd (nur Bus-Ebene) · *kein Oszi-Thema*

- Typische Werte: Bosch CAS-M light (Motorsport-Radar auf MRR-Basis): FMCW 76,0–77,0 GHz, Reichweite 150 m, CAN 500 kbit/s oder 1 Mbit/s, 50 Hz Update, Versorgung 6,5–18 V. Seriensensoren: Bus herstellerabhängig.
- VDS1022I: nein (Hochfrequenz); allenfalls Versorgung und Bus-Physik
- Sicherheit: Nach Arbeiten im Frontbereich Kalibrierung nach Herstellervorgabe
- Quellen: <https://www.bosch-motorsport.com/content/downloads/Raceparts/Resources/pdf/Data Sheet_75138059_Collision_Avoidance_System_CAS-M_light.pdf>

**Kamera (Front-/Rückfahr-/Surround-View)** · unsicher (schnelle Video-Datenverbindung) · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: nein (Datenrate weit über 25 MHz Bandbreite, nicht geprüft)
- Sicherheit: Kalibrierung nach Scheibentausch

### Bordnetz/Energiemanagement

**Intelligenter Batteriesensor (IBS)** · Bus (LIN) · Priorität niedrig · Karte: lin (+ generator-ripple)

- Typische Werte: Hella: am Minuspol, Strommessung indirekt über Shunt, Messung von Spannung, Strom und Temperatur; errechnet SOC, SOH und SOF; Anbindung über LIN.
- VDS1022I: ja (LIN-Bus-Physik wie Karte lin); Messwerte nicht ohne Decoder
- Sicherheit: Batterie: Kurzschluss vermeiden
- Quellen: <https://www.techtips.ie/Hella-Ireland/the-intelligent-battery-sensor.pdf>

### Karosserie – Füllstand

**Waschwasserstandsensor** · Schaltsignal · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft.
- VDS1022I: ja, Multimeter genügt
- Sicherheit: keine besondere

### Karosserie

**Einfache Schaltkontakte (Tür, Haube, Heckklappe, Handbremse, Rückfahrlicht)** · Schaltsignal gegen Masse oder Plus · Priorität niedrig · Karte: teilweise: Erklärbild Masse/Spannungsabfall

- Typische Werte: Pegel herstellerabhängig (nicht quellengeprüft). Das Oszi hilft vor allem bei Wackelkontakten (Einzelaufnahme mit Trigger beim Bewegen von Kabel oder Stecker).
- VDS1022I: ja
- Sicherheit: keine besondere

### Passive Sicherheit

**Airbag-Crashsensoren / Satelliten (PSI5)** · Stromschnittstelle PSI5 (Manchester, 125 kbit/s) · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: psi5.org: ursprünglich für Airbag entwickelt; Daten per Strommodulation auf der Versorgungsleitung, High = zusätzlich 20 mA, Ruhestrom max. ca. 50 mA, 125 kbit/s, Manchester (0 = steigende, 1 = fallende Flanke in der Bitmitte).
- VDS1022I: nein: niemals messen
- Sicherheit: Airbag/Pyrotechnik: niemals messen oder adaptieren; nur Diagnosetester nach Herstellervorgabe
- Quellen: <https://psi5.org/overview>

**Gurtschloss-, Sitzbelegungs- und Fußgängerschutzsensoren** · herstellerabhängig (Teil des Airbagsystems) · Priorität niedrig · Karte: nicht anwendbar · *kein Oszi-Thema*

- Typische Werte: Nicht quellengeprüft; Teil des Rückhaltesystems.
- VDS1022I: nein: niemals messen
- Sicherheit: Airbag/Pyrotechnik: niemals messen

### HV-Antrieb (EV/Hybrid)

**Resolver der E-Maschine (Rotorlage)** · analog (sinusförmige Erregung, Sinus-/Kosinus-Ausgänge amplitudenmoduliert) · Priorität niedrig · Karte: fehlt

- Typische Werte: Pico AGT-885: Erregerwicklung mit sinusförmigem Wechselstrom, zwei Ausgangswicklungen um 90° versetzt; die Ausgänge schwingen mit der Erregerfrequenz, die Hüllkurve folgt Sinus bzw. Kosinus des Rotorwinkels. Pico misst die Erregung mit 1400-V-Differenztastkopf, die Ausgänge floatend (nur PicoScope 4x25). Frequenz und Amplitude nennt Pico nicht.
- VDS1022I: nur eingeschränkt: Die Kanäle haben gemeinsame Masse, floatende Wicklungen erfordern Differenztastköpfe; eine Messung wie bei Pico (3 Kanäle) ist mit 2 Kanälen nicht vollständig möglich
- Sicherheit: Hochvolt: nur mit HV-Qualifikation, Herstellervorgaben und PSA; Gefahr für Träger elektronischer Implantate (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-885-motor-resolver/>

## Aktoren, Zündung, Versorgung, Bussysteme, Hochvolt

> VDS1022I-Rahmen: 1:1 max. 40 Vss, 10:1 max. 400 Vss (Toolboom), 25 MHz, 100 MS/s, 5 k Punkte, Zeitbasis 5 ns–100 s/div, Math A±B/FFT (Elektor). Isolation nur zum USB/PC, Kanalmassen gemeinsam. Keine Protokolldekodierung dokumentiert. Strom nur mit Zange mit Spannungsausgang (BNC). Hinweis: Das Websuche-Kontingent war während der Recherche aufgebraucht. Werte ohne Quelle sind als „nicht quellenverifiziert“ markiert.

### Einspritzung Otto, Saugrohr

**Einspritzventil Saugrohr (MPI) – Spannungsbild** · Schaltsignal Low-Side (Masse geschaltet) mit induktiver Abschaltspitze · Priorität hoch · Karte: inj-saug

- Typische Werte: Aus ≈ Bordnetzspannung, ein ≈ 0 V. Einspritzzeit typ. 4–5 ms im Leerlauf bei sequentieller Einspritzung, ca. 2,5 ms bei simultaner Einspritzung (2× je 720° KW) (Pico). Impulsdauer steigt beim Beschleunigen und fällt bei konstant ca. 3000/min auf etwa Leerlaufwert (Hella). Spulenwiderstand ca. 15 Ω (Audi-Beispiel, Hella). Abschaltspitze ggf. durch Zenerdiode/RC begrenzt (Pico); Höhe herstellerabhängig, typ. einige 10 V (nicht quellenverifiziert). Nadelschließ-Buckel im Abklingen sichtbar.
- VDS1022I: ja – nur mit 10:1-Tastkopf (Spitze überschreitet 40 Vss bei 1:1); 1 Kanal genügt, Kanal 2 frei für Strom oder Zylindervergleich
- Sicherheit: Induktive Spitze: Tastkopf und Zubehör spannungsfest wählen (Pico-Warnhinweis)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/injector-(gasoline)/AGT-388-mpi-injector-voltage-and-current/> · <https://www.hella.com/tibi/ti/de/electronics/ti_d_electronics_einspritzventile1.pdf>

**Einspritzventil Saugrohr (MPI) – Strombild** · Strom (Stromzange); induktiver Anstieg mit Knick bei Nadelbewegung · Priorität mittel · Karte: fehlt (inj-saug zeigt nur das Spannungsbild)

- Typische Werte: Pico misst im 20-A-Bereich der Niederstromzange (Spitzen also deutlich darunter). Absolutwerte herstellerabhängig, keine Zahlen in den geöffneten Quellen. Pico hat einen eigenen Test dafür (AGT-036).
- VDS1022I: nur mit Stromzange (Spannungsausgang, BNC); Kanal 2 parallel für das Spannungsbild
- Sicherheit: wie Spannungsbild (induktive Spitze)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators> · <https://www.picoauto.com/library/automotive-guided-tests/actuators/injector-(gasoline)/AGT-388-mpi-injector-voltage-and-current/>

### Einspritzung Otto, Direkteinspritzung

**Benzin-Direkteinspritzventil (GDI) – Spannung und Strom** · Boost-Hochspannung und Peak-&-Hold-Strom; High- und Low-Side geschaltet · Priorität hoch · Karte: inj-di

- Typische Werte: Öffnungsphase mit erhöhter Spannung, danach getaktete niedrigere Haltespannung (Pico). Beispiel VW 1.4 TSI (2012): Spitzen ca. 70–80 V, Spitzenstrom 12,5 A (Pico-Forum, Einzelmessung, herstellerabhängig). Systemdruck bis ca. 200 bar. Mehrfacheinspritzung pro Arbeitsspiel möglich.
- VDS1022I: ja mit Einschränkung: beide Ventilanschlüsse mit 10:1 gegen Masse messen, dann Math A−B. Für den Strom wird eine Zange gebraucht, dann ist nur noch 1 Spannungskanal frei.
- Sicherheit: Gefährliche Spannung (Pico). Spannungsfestes Zubehör und Dämpfung nötig.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/injector-gasoline/AGT-869-gdi-injector-voltage-and-current/> · <https://www.picoauto.com/library/automotive-guided-tests/actuators/injector-(gasoline)/AGT-868-gdi-injector-current/> · <https://www.picoauto.com/support/viewtopic.php?p=31613>

**Benzin-Hochdruckpumpe – Mengensteuerventil** · Magnetventil, nockensynchron angesteuert · Priorität mittel · Karte: fehlt

- Typische Werte: Keine Quelle mit Messwerten geöffnet; herstellerabhängig (nicht quellenverifiziert)
- VDS1022I: voraussichtlich ja (10:1, Stromzange); nicht verifiziert
- Sicherheit: Hochdruck-Kraftstoffsystem

### Einspritzung Diesel, Common Rail

**Common-Rail-Magnetventilinjektor (Bosch/Delphi) – Strombild** · Strom (Anzugs- und Haltephase) mit Hochspannungs-Ansteuerung · Priorität hoch · Karte: inj-cr-mag

- Typische Werte: Spannungen im Ansteuerkreis typ. 50–90 V (Pico). Vor-, Haupt- und Nacheinspritzung sind sichtbar. Pico misst im 20-A-Bereich. Bis zu 8 Einspritzungen pro Arbeitstakt möglich (Wikipedia, Stand 2012). Raildruck bis ca. 3000 bar.
- VDS1022I: Strom ja mit Stromzange; Spannung ja mit 10:1 (bis 90 V, unter der Grenze von 400 Vss)
- Sicherheit: Gefährliche Spannung (Pico). Leitungen unter Hochdruck nicht öffnen.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/bosch-current-at-idle> · <https://www.picoauto.com/library/automotive-guided-tests/delphi-current/> · <https://de.wikipedia.org/wiki/Common-Rail-Einspritzung>

**Piezo-Injektor (Common Rail)** · Lade- und Entladestrompulse, hohe Ansteuerspannung · Priorität mittel · Karte: inj-piezo

- Typische Werte: Ansteuerspannung kann über 200 V liegen (Pico-Forum). Die Nadel bewegt sich im µs-Bereich (Pico). Absolutwerte herstellerabhängig.
- VDS1022I: Strom ja mit Stromzange (bevorzugt). Spannung nur mit 10:1 und nur, wenn Spitze-Spitze sicher unter 400 V bleibt (grenzwertig); besser ein 100:1-Tastkopf mit ausreichender Spannungsfestigkeit.
- Sicherheit: Piezo-Injektor nie bei laufendem Motor abstecken: Ventil kann offen bleiben, Folge ist Motorschaden (Pico). Gefährliche Spannung.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/injector-(diesel)/AGT-098-crd-bosch-piezo-injector/> · <https://www.picoauto.com/support/viewtopic.php?t=22336>

**CR-Druckregelventil (DRV)** · PWM, Low-Side, stromgeregelt · Priorität mittel · Karte: teilweise pwm-ventil; eigene Karte fehlt

- Typische Werte: Funktion wie ZME (Pico): Tastgrad bestimmt den Mittelstrom. Fehlercodes P0087–P0094. Frequenz und Tastgrad herstellerabhängig.
- VDS1022I: ja (10:1 empfohlen); Strom mit Zange
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/pressure-regulator/AGT-055-crd-bosch-pressure-regulating-valve/>

### Einspritzung Diesel, Pumpe-Düse

**Pumpe-Düse-Einheit (VAG PD) – Magnetventil bzw. Piezo** · Strom, Spannung und Masse des Magnetventils; Piezo-Variante · Priorität niedrig · Karte: fehlt (Prinzip teilweise in inj-cr-mag)

- Typische Werte: Pico prüft Strom, Spannung und Masse (AGT-385) sowie eine Piezo-PD-Variante (AGT-146). Zahlenwerte stehen nur in den Bildern und sind herstellerabhängig (nicht quellenverifiziert).
- VDS1022I: Magnetventil-Variante: Strom ja mit Zange, Spannung ja mit 10:1. Piezo-Variante wie Piezo-Injektor (grenzwertig).
- Sicherheit: Gefährliche Spannung
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/vag-pd-current-voltage-and-earth> · <https://www.picoauto.com/library/automotive-guided-tests/actuators>

### Einspritzung Diesel, Hochdruckpumpe

**CR-Mengensteuerventil / Zumesseinheit (ZME, QCV)** · PWM, Low-Side, stromgeregelt · Priorität mittel · Karte: teilweise pwm-ventil (Prinzip); eigene Karte fehlt

- Typische Werte: Beide Spulenanschlüsse liegen an +UBatt, das Steuergerät schaltet Masse; aktiv = Low. Höherer Tastgrad bedeutet höheren Mittelstrom und größeren Ventilhub. Grundstellung je nach System offen oder geschlossen (Pico). Frequenz und Tastgrade herstellerabhängig (bei Pico nicht genannt).
- VDS1022I: ja (10:1 wegen Abschaltspitze empfohlen); Strom mit Zange; Kanal 2 für den Raildrucksensor
- Sicherheit: keine besonderen; Hochdrucksystem nicht öffnen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/quantity-control-valve/AGT-056-crd-bosch-quantity-control-valve/>

### Einspritzung Otto (älter)

**Single-Point-/Monopoint-Einspritzventil (Peak & Hold)** · Peak-&-Hold-Strom, Low-Side · Priorität niedrig · Karte: teilweise inj-saug

- Typische Werte: Nicht quellenverifiziert; herstellerabhängig
- VDS1022I: ja (10:1, Stromzange)
- Sicherheit: induktive Spitze

### Einspritzung Gas (Nachrüst- oder Werksanlage)

**Gas-Einblasventile (LPG/CNG)** · Schaltsignal, häufig Peak & Hold · Priorität niedrig · Karte: fehlt

- Typische Werte: Nicht quellenverifiziert; herstellerabhängig
- VDS1022I: ja (10:1, Stromzange)
- Sicherheit: Gasanlage: Dichtheit und Herstellervorgaben beachten

### Abgasnachbehandlung Diesel

**AdBlue/SCR-Dosierventil** · getaktetes Magnetventil · Priorität niedrig · Karte: fehlt

- Typische Werte: Nicht quellenverifiziert; herstellerabhängig
- VDS1022I: voraussichtlich ja (10:1, Stromzange); nicht verifiziert
- Sicherheit: heiße Abgasanlage

### Zündung (Einzelfunken, Doppelfunken, Verteiler)

**Zündspule primär – Spannung (extern geschaltete Endstufe)** · Schaltsignal Klemme 1 mit induktiver Abschaltspitze · Priorität hoch · Karte: zuend-prim

- Typische Werte: Aus ≈ Batteriespannung, ein ≈ 0 V (ein höherer Wert deutet auf Widerstand im Massekreis). Abschaltspitze (Ping Line) gleichmäßig und nicht unter ca. 250 V. Weniger als 3 Ausschwingungen am Ende der Brennlinie weisen auf einen Isolationsschaden sekundär hin. Schließzeit: Herstellerangabe (Pico).
- VDS1022I: grenzwertig: mit 10:1 max. 400 Vss, Primärspitzen können diese Grenze erreichen. Empfohlen: 100:1-Tastkopf oder Teiler (Pico nutzt 10:1 bzw. 20:1).
- Sicherheit: Gefährliche Spannung; Zubehör mit passender Spannungsfestigkeit
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition/coil-on-plug/AGT-044-primary-voltage/>

### Zündung

**Zündspule primär – Strom (Schließstrom, Strombegrenzung)** · Strom (Stromzange), Rampe während der Schließzeit · Priorität mittel · Karte: zuend-prim (teilweise, falls Strombild enthalten)

- Typische Werte: Linearer Anstieg bis zur Strombegrenzung oder zum Abschalten. Absolutwerte herstellerabhängig, typ. einige A (nicht quellenverifiziert). Pico hat Tests für COP, Doppelfunken und Verteiler.
- VDS1022I: nur mit Stromzange; Kanal 2 für Trigger oder Primärspannung (mit Teiler)
- Sicherheit: wie Primärspannung
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition>

**Zündspule mit integrierter Endstufe – Triggersignal (COP 3/4-polig)** · Logikpegel-Ansteuerimpuls vom Motorsteuergerät; teils mit Rückmeldesignal · Priorität hoch · Karte: zuend-prim (nur falls die Trigger-Variante enthalten ist, sonst fehlt)

- Typische Werte: Der Primärkreis wird intern geschaltet (Pico AGT-162); Impulslänge ≈ Schließzeit. Pegel typ. 5 V (nicht quellenverifiziert, herstellerabhängig). Pico hat Varianten für Trigger, Versorgung, Masse, Strom und Rückmeldung.
- VDS1022I: ja, 1:1 möglich; Kanal 2 mit Stromzange auf der Versorgung
- Sicherheit: gering (Niedervolt); Hochspannung an der Kerze nicht berühren
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition/coil-on-plug/AGT-162-trigger-vs-primary-current/> · <https://www.picoauto.com/library/automotive-guided-tests/ignition/multi-coil-on-plug-unit/AGT-192-trigger-dual-feed-and-current-4-cyl/>

**Zündung sekundär (kapazitiv: COP, Doppelfunken, Verteiler)** · Hochspannung, kapazitiv abgegriffen · Priorität hoch · Karte: zuend-sek

- Typische Werte: Zündspannung (Plug kV), Brennspannung (Sparkline kV), Brenndauer und Ausschwingen; Sollwerte laut Hersteller (Pico). Spulen liefern je nach Motor ca. 15–40 kV (Wikipedia). Bei Doppelfunkenspulen gibt es plus- und minusgefeuerte Kerzen (Pico-Tests).
- VDS1022I: nur mit kapazitivem Zündabnehmer (Zubehör mit BNC-Ausgang). Skalierung nur relativ oder über den Teilerfaktor des Abnehmers. Nie galvanisch an die Hochspannung.
- Sicherheit: Zündung aus und gegen Wiedereinschalten sichern, bis der Abnehmer montiert ist (Pico). Hochspannung im zweistelligen kV-Bereich.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition/distributor-/AGT-047-secondary-plug-lead/> · <https://en.wikipedia.org/wiki/Ignition_coil>

### Zündung/Verbrennungserkennung

**Ionenstrommessung (Saab Trionic)** · Ionenstrom über den Kerzenspalt; Ausgangsimpulse der Kassette zum Steuergerät · Priorität niedrig · Karte: fehlt

- Typische Werte: Ein Pol der Sekundärwicklung liegt an 80 V statt an Masse. Der Ionenstrom nach der Verbrennung dient der Zylindererkennung sowie der Klopf- und Aussetzererkennung. Die Kassette meldet über Batteriespannungsimpulse an das Steuergerät (Wikipedia Trionic T5.5).
- VDS1022I: nur indirekt (Ausgangssignale der Kassette, 12-V-Pegel). Den Ionenstrom selbst nicht abgreifen; Machbarkeit unsicher.
- Sicherheit: Hochspannung an der Kassette
- Quellen: <https://en.wikipedia.org/wiki/Trionic_T5.5>

### Zündung/Versorgung

**Zündverstärker- und Zündspulenmasse (Spannungsfall)** · DC-Spannungsfall unter Last (mV-Bereich) · Priorität mittel · Karte: fehlt (nur Erklärbild Masse/Spannungsabfall)

- Typische Werte: Dynamischer Spannungsfall bei Drehzahländerung (Pico AGT-041). Einen Grenzwert nennt die Quelle nicht: Herstellerangabe.
- VDS1022I: ja (1:1, DC-Kopplung, kleiner Messbereich)
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition/distributorless-wasted-spark/AGT-041-ignition-amplifier-earth-volt-drop/>

### Zündung (vor allem Zweirad und Kleinmotoren)

**Kondensatorzündung (CDI)** · Kondensatorentladung über Zündtransformator · Priorität niedrig · Karte: fehlt

- Typische Werte: Kondensator ca. 500 V (Wikipedia Zündung)
- VDS1022I: Triggerseite ja. Den Kondensatorkreis nein: er überschreitet 400 Vss mit 10:1, nur mit 100:1-Tastkopf.
- Sicherheit: Hochspannung, gespeicherte Energie
- Quellen: <https://de.wikipedia.org/wiki/Zündung_(Verbrennungsmotor)>

### Motorsteuerung, Aktoren

**PWM-Magnetventile (Ladedruck N75, AGR, Tankentlüftung)** · PWM, Low-Side mit induktiver Spitze · Priorität hoch · Karte: pwm-ventil

- Typische Werte: Das Steuergerät schaltet Masse per PWM; der Tastgrad bestimmt Mittelstrom und Öffnung (Pico, Tankentlüftung). Frequenzen herstellerabhängig.
- VDS1022I: ja (10:1 wegen Abschaltspitze)
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/carbon-canister-purge-valve/AGT-030-carbon-canister-purge-valve-solenoid/> · <https://www.picoauto.com/library/automotive-guided-tests/actuators>

**DC-Stellmotoren (E-Drosselklappe, AGR, VTG, Drallklappe, Wastegate)** · PWM über H-Brücke (bidirektional) · Priorität hoch · Karte: stellmotor (+ edk für den Sensor)

- Typische Werte: Pico misst den TPS-Ausgang (Kanal A) gegen den Motorschaltkreis (Kanal B) bei Pedalvariation. PWM-Frequenz und Tastgrad herstellerabhängig.
- VDS1022I: ja. Motorspannung über die H-Brücke: beide Anschlüsse gegen Masse und Math A−B (dann kein Kanal für den TPS frei), alternativ 1 Motoranschluss plus TPS.
- Sicherheit: Klemmgefahr an der Drosselklappe
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/throttle-servomotor/AGT-076-throttle-servomotors/>

### Motorsteuerung, Ventiltrieb

**Nockenwellenverstellung – VVT-Magnetventil (einfach oder doppelt)** · PWM über geschaltete Masse · Priorität mittel · Karte: teilweise pwm-ventil; eigene Karte fehlt

- Typische Werte: Der Tastgrad ändert sich mit der Drehzahl (Pico AGT-058). Doppelventil-Variante: AGT-156. Frequenz herstellerabhängig.
- VDS1022I: ja; Kanal 2 auf den NW-Sensor zur Plausibilisierung
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/variable-valve-timing/AGT-058-vvt-control-solenoid/> · <https://www.picoauto.com/library/automotive-guided-tests/actuators>

### Motorsteuerung Otto (älter)

**Leerlaufsteller (Drehsteller oder Linearmagnet)** · PWM über 1–2 geschaltete Massen · Priorität niedrig · Karte: fehlt (Prinzip wie pwm-ventil)

- Typische Werte: Versorgung bei Zündung ein 11–14 V; Spulenwiderstand 9,6 Ω ±15 % (Opel) (Hella). Drehsteller mit 2–3 Anschlüssen: Plus und 1–2 geschaltete Massen; der Tastgrad bestimmt die Öffnung. Kaltstart-Leerlauf ca. 1200/min (Pico).
- VDS1022I: ja (2 Kanäle reichen auch für die Doppelwicklung)
- Sicherheit: keine besonderen
- Quellen: <https://www.hella.com/tibi/ti/de/electronics/ti_d_electronics_leerlaufsteller1.pdf> · <https://www.picoauto.com/library/automotive-guided-tests/rotary/>

### Motorsteuerung (älter)

**Schrittmotor (Leerlauf, Drosselklappenanschlag)** · Schrittimpulse auf mehreren geschalteten Massen · Priorität niedrig · Karte: fehlt

- Typische Werte: 4-Draht: Pin 3 Stepper-Plus 5 V, Wicklung 4–6 Ω. 5-Draht: 12-V-Versorgung, 4 geschaltete Massen (Pico). Frequenz nicht angegeben.
- VDS1022I: ja, aber nur 2 von 4 Phasen gleichzeitig
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/idle-speed-control-valve-(iac)/AGT-040-stepper-motor/>

### Kraftstoffversorgung

**Kraftstoffpumpe – Strombild (Kommutator)** · Strom mit Kommutatorwelligkeit; teils PWM über ein Pumpensteuergerät · Priorität hoch · Karte: kraftstoffpumpe

- Typische Werte: Kommutatorsegmente typ. 6 oder 8; daraus lässt sich die Pumpendrehzahl berechnen. Gleichmäßige Spitzen sind gut, unregelmäßige Einbrüche ein Defekt. Pico nutzt den 20-A-Bereich. Absolutstrom herstellerabhängig.
- VDS1022I: nur mit Stromzange (z. B. über Sicherungsadapter); Spannung ja
- Sicherheit: Kraftstoffdämpfe: keine Funkenbildung
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/fuel-pump/AGT-032-fuel-pump-motor-brushed/>

### Thermomanagement

**Elektrolüfter, Zusatzwasser- und Ölpumpen (PWM-Ansteuerung, Strom)** · PWM-Steuersignal (Low-Side oder Signalleitung zum Modul) und Laststrom · Priorität mittel · Karte: luefter-pwm

- Typische Werte: Der Tastgrad steigt mit der Motortemperatur und bei Klimabetrieb (Pico). Frequenz und Logik herstellerabhängig.
- VDS1022I: Ansteuerung ja; Strom nur mit Hochstromzange
- Sicherheit: Lüfter kann jederzeit anlaufen: Hände weg
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/variable-speed-cooling-fan/AGT-071-variable-speed-cooling-fan/>

### Startanlage Diesel

**Glühkerzen / Glühzeitsteuergerät** · PWM-getaktete Versorgung und Strom · Priorität mittel · Karte: gluehkerze

- Typische Werte: Schnellglühsysteme mit Niedervoltkerzen ca. 4–5 V bzw. 7 V, geregelt per PWM der Versorgung. Keramikkerzen 1000–1100 °C. Im Beispielsystem kein Glühen über 9 °C Außentemperatur oder über 2500/min. Pico-Zangenbereich 60 A.
- VDS1022I: Spannung ja; Strom nur mit Zange (Bereich ≥ 60 A)
- Sicherheit: Niedervolt-Glühkerzen nie direkt an Batteriespannung prüfen: irreversibler Schaden (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/actuators/glow-plugs/AGT-145-glow-plug-voltage-and-current/>

### Aktoren allgemein

**Relais, Magnetkupplung Klimakompressor, Sekundärluftpumpe (Schaltsignale)** · Ein/Aus an Bordnetzspannung, induktive Abschaltspitze · Priorität mittel · Karte: relais

- Typische Werte: Abschaltspitze ggf. durch Freilaufdiode begrenzt; nicht quellenverifiziert
- VDS1022I: ja (10:1 bei ungedämpften Spulen)
- Sicherheit: keine besonderen

### Klimaanlage

**Klimakompressor-Regelventil (extern geregelter Kompressor)** · PWM-Magnetventil · Priorität mittel · Karte: fehlt

- Typische Werte: Frequenz und Strom herstellerabhängig; keine Quelle geöffnet
- VDS1022I: voraussichtlich ja (Stromzange für den Regelstrom); nicht verifiziert
- Sicherheit: Kältemittelkreis nicht öffnen

### Getriebe

**Automatikgetriebe-Magnetventile (Druckregler, Schaltventile)** · PWM bzw. stromgeregelt · Priorität niedrig · Karte: fehlt

- Typische Werte: Herstellerabhängig; keine Quelle geöffnet
- VDS1022I: ja, sofern die Leitungen zugänglich sind (oft in der Mechatronik integriert)
- Sicherheit: keine besonderen

### Beleuchtung/Karosserieelektronik

**Lampen-/LED-Ansteuerung (PWM, Kaltlampenprüfimpulse)** · PWM bzw. kurze Prüfimpulse · Priorität niedrig · Karte: fehlt

- Typische Werte: Herstellerabhängig; nicht quellenverifiziert
- VDS1022I: ja
- Sicherheit: Xenon-Vorschaltgerät: Hochspannung, nicht messen

### Abgas/Sensorik

**Lambdasonden-Heizung** · PWM Low-Side · Priorität mittel · Karte: lam-heiz

- Typische Werte: Siehe Karte lam-heiz; hier nicht neu recherchiert
- VDS1022I: ja
- Sicherheit: keine besonderen

### Startanlage (auch Hybrid-Verbrenner)

**Starterstrom / relative Kompression / Startspannungseinbruch** · Hochstrom und Batteriespannung beim Startvorgang · Priorität hoch · Karte: starter

- Typische Werte: Der Starterstrom steigt mit der Zylinderlast; eine wiederkehrend niedrige Spitze zeigt einen Zylinder mit geringer Kompression. Bei deaktivierter Einspritzung ca. 5 s starten. Hochstromzange auf die Batterieleitung, höchster Messbereich (Pico). Absolutwerte herstellerabhängig. Für Hybride gibt es einen eigenen Pico-Test (AGT-930).
- VDS1022I: Strom nur mit Hochstromzange (BNC); Batteriespannung parallel auf Kanal 2: ja
- Sicherheit: Einspritzung deaktivieren; drehende Teile
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/charging-starting/starting/AGT-004-relative-compression-gasoline/> · <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles>

### Ladesystem 12 V/24 V

**Generator – Welligkeit (Ripple)** · AC-Anteil auf B+ · Priorität hoch · Karte: generator-ripple

- Typische Werte: Über 500 mV Spitze-Spitze kann andere Systeme stören. Scharfe, meist nach unten gerichtete Spitzen zwischen den Pulsen deuten auf eine defekte Diode, periodisch fehlende Pulse auf Wicklung oder Diode (Pico).
- VDS1022I: ja (AC-Kopplung, kleiner Messbereich)
- Sicherheit: Riementrieb
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/charging-starting/charging/AGT-846-alternator-ripple-with-ecm-control/>

### Ladesystem (Smart Charging)

**Generator – Ansteuerung und Rückmeldung (PWM-Kommando/Feedback, LIN/BSD)** · PWM-Kommando, Rückmeldesignal bzw. serieller Bus · Priorität mittel · Karte: generator-ripple (LIN/BSD); PWM-Variante teilweise

- Typische Werte: Ford Smart Charge: PWM-Kommando vom Motorsteuergerät, Rückmeldesignal vom Generator. Ausgangsspannung bis 18 V nach Kaltstart, im Fallback 14,75 V (Pico AGT-141). Bei anderen Herstellern LIN bzw. BSD (keine Werte recherchiert).
- VDS1022I: ja (Kommando und Feedback auf 2 Kanälen); für den Strom wäre ein 3. Kanal nötig
- Sicherheit: Riementrieb
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/charging-starting/charging/AGT-141-ford-smart-alternator/>

### Bordnetz 12 V

**Ruhestrom / parasitäre Batterieentladung** · DC-Strom im mA-Bereich mit periodischen Weckspitzen · Priorität hoch · Karte: fehlt

- Typische Werte: Im Schlafzustand typ. unter 150 mA (herstellerabhängig). Einschlafzeit 30 min–2 h. Module wecken periodisch auf, auch im Abstand von Stunden. Beispiel: 45 mA an 75 Ah reichen ca. 14 Tage (Pico).
- VDS1022I: nur mit Niederstromzange (mA-Auflösung) oder Shunt. Zeitbasis bis 100 s/div, aber nur 5 k Punkte je Erfassung; Langzeitüberwachung eingeschränkt.
- Sicherheit: Überbrückungsleitung nur abgesichert (10 A). Bei dieser Methode nicht starten (Pico).
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/charging-starting/charging/AGT-783-parasitic-battery-drain-clamp-method/> · <https://www.elektormagazine.com/review/precise-robust-and-affordable-the-owon-vds1022i-isolated-25-mhz-usb-oscilloscope-review>

### Bordnetz/Versorgung

**Spannungsfall Plus- und Masseleitungen (Hauptstrom, Steuergeräte- und Sensormasse)** · DC-Spannungsfall unter Last · Priorität hoch · Karte: fehlt (nur Erklärbild Masse/Spannungsabfall)

- Typische Werte: Unter Last und dynamisch messen. Grenzwerte herstellerabhängig; die geöffneten Quellen nennen keine Zahl.
- VDS1022I: ja (DC, mV-Bereich). Beachten: Masseklemmen beider Kanäle liegen auf gemeinsamem Potential.
- Sicherheit: Hochstromkreise: keine Kurzschlüsse mit Messleitungen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/ignition/distributorless-wasted-spark/AGT-041-ignition-amplifier-earth-volt-drop/>

### Sensorversorgung durch das Steuergerät

**5-V-Sensorreferenz und Sensormasse** · DC-Versorgung · Priorität mittel · Karte: fehlt (nur Erklärbild 5-V-Referenz)

- Typische Werte: 5-V-Versorgung (z. B. bei SENT-Sensoren, Wikipedia). Toleranz und Störbilder herstellerabhängig (nicht quellenverifiziert).
- VDS1022I: ja (1:1)
- Sicherheit: Referenz nicht kurzschließen: sie versorgt oft mehrere Sensoren
- Quellen: <https://en.wikipedia.org/wiki/SENT_(protocol)>

### Bordnetz 12 V/24 V

**Bordnetz-Transienten (Load Dump, Schaltspitzen)** · Einzelereignis, Spannungsspitze · Priorität niedrig · Karte: fehlt

- Typische Werte: Load Dump 12 V: bis ca. 120 V ungeklemmt, typ. auf 40 V begrenzt (24 V: ca. 60 V), Dauer bis 400 ms. Normpulse nach ISO 7637-2 (Wikipedia).
- VDS1022I: ja mit 10:1 (bis 400 Vss), Single-Trigger
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/Load_dump>

### Bordnetz 48 V

**48-V-Bordnetz (Mild-Hybrid)** · DC-Versorgung, hohe Ströme · Priorität niedrig · Karte: fehlt

- Typische Werte: Nennspannung 48 V DC, unter der allgemein akzeptierten 50-V-Schwelle. Norm ISO 21780 (Wikipedia). Betriebsgrenzen nicht quellenverifiziert.
- VDS1022I: Spannung ja mit 10:1; Strom nur mit Zange
- Sicherheit: Kein HV, aber hohe Ströme und Lichtbogengefahr; Herstellervorgaben beachten
- Quellen: <https://en.wikipedia.org/wiki/48-volt_electrical_system>

### Hochvolt/E-Antrieb, 12-V-Seite

**EV: 12-V-Bordnetz / DC/DC-Wandler (Laden der 12-V-Batterie)** · DC-Spannung und Ladestrom · Priorität mittel · Karte: fehlt

- Typische Werte: Ausgangsspannung ca. 14 V. Ladestrom im Beispiel anfangs ca. 74 A, dann fallend. Vor READY über 30 A Bordnetzlast (Pico AGT-916). Restwelligkeit: keine Quelle.
- VDS1022I: 12-V-Seite: Spannung ja; Strom nur mit Hochstromzange
- Sicherheit: Fahrzeug von der Ladestation trennen, HV-Komponenten nicht öffnen. Pico schreibt HV-Qualifikation vor.
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-916-auxiliary-battery-charging/>

### Bussystem

**CAN High-Speed (ISO 11898-2)** · Differenzieller Bus · Priorität hoch · Karte: can-hs

- Typische Werte: Rezessiv: Differenz 0 V (unter 0,5 V gilt als rezessiv). Dominant: CAN-H ≈ 3,5 V, CAN-L ≈ 1,5 V, Differenz ≈ 2 V. Abschluss 2×120 Ω. OBD Pin 6/14, 250 oder 500 kbit/s. Gleichtaktbereich −2 bis 7 V (TI).
- VDS1022I: ja: CAN-H auf K1, CAN-L auf K2 gegen Masse, Math A−B. Bei 100 MS/s nur 50 µs Fenster (5 k Punkte); für einen ganzen Frame die Abtastrate senken. Keine Protokolldekodierung dokumentiert.
- Sicherheit: keine besonderen; Abschlusswiderstand stromlos messen
- Quellen: <https://en.wikipedia.org/wiki/CAN_bus> · <https://www.ti.com/lit/an/slla270/slla270.pdf> · <https://en.wikipedia.org/wiki/On-board_diagnostics>

**CAN-FD** · Differenzieller Bus mit schnellerer Datenphase · Priorität mittel · Karte: can-fd

- Typische Werte: Arbitrierung wie CAN-HS. Datenphase bis 5 Mbit/s (ISO-11898-2-Abschnitt) bzw. bis 8 Mbit/s (Infobox); Wikipedia ist hier widersprüchlich.
- VDS1022I: Pegel ja. Bei 5 Mbit/s (200 ns/bit) 20 Abtastwerte/bit, aber nur 50 µs Fenster. Flankenqualität eingeschränkt.
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/CAN_bus>

### Bussystem (Komfort, älter)

**CAN Low-Speed, fehlertolerant (ISO 11898-3)** · Differenzieller Bus mit Eindrahtnotlauf · Priorität mittel · Karte: can-ls

- Typische Werte: Bis 125 kbit/s. Dominant: CAN-H → 5 V (bzw. 3,3 V), CAN-L → 0 V. Rezessiv: CAN-H ≈ 0 V, CAN-L ≈ 5 V. Die Leitungen tolerieren −27 bis +40 V (Wikipedia).
- VDS1022I: ja
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/CAN_bus>

### Bussystem (GM GMLAN; Tesla auf dem CP-Leiter)

**Single-Wire-CAN (SAE J2411)** · Eindraht-CAN · Priorität niedrig · Karte: fehlt

- Typische Werte: 33,3 kbit/s (Dekodierung im Pico-Forum bestätigt, Tesla Model 3 auf dem CP-Leiter). SAE J2411 (Wikipedia GMLAN).
- VDS1022I: ja (Eindraht gegen Masse). Am CP-Leiter nur mit Ladeadapter und Qualifikation.
- Sicherheit: Am Ladekabel: netzverbundene Ladeeinrichtung
- Quellen: <https://www.picoauto.com/support/viewtopic.php?t=22544> · <https://en.wikipedia.org/wiki/GMLAN>

### Bussystem (neu)

**CAN XL** · Differenzieller Bus · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Bis 20 Mbit/s; bei Wikipedia als künftige Spezifikation geführt. Verbreitung in Serie nicht verifiziert.
- VDS1022I: nein bzw. stark eingeschränkt (50 ns/bit = 5 Abtastwerte bei 100 MS/s)
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/CAN_bus>

### Bussystem (Komfort, Generator, Sensoren)

**LIN-Bus** · Eindraht-Bus gegen Masse · Priorität hoch · Karte: lin

- Typische Werte: 12 V/24 V; 1–20 kbit/s, typ. 9,6/10,4/19,2 kbit/s. Rezessiv ≈ UBatt (logisch 1), dominant ≈ Masse. Empfängerschwellen: über 60 % UBatt = 1, unter 40 % = 0. Frame: Break ≥ 13 bit, Sync 0x55, PID, 2/4/8 Datenbytes, Checksumme. 1 Master, bis 15 Slaves, max. 40 m (CSS Electronics).
- VDS1022I: ja (1:1 reicht bei 12 V; im 24-V-Netz 10:1)
- Sicherheit: keine besonderen
- Quellen: <https://www.csselectronics.com/pages/lin-bus-protocol-intro-basics>

### Bussystem (Fahrwerk/Antrieb, Premiumfahrzeuge)

**FlexRay** · Differenzieller Bus BP/BM · Priorität mittel · Karte: fehlt (nur Erklärbild FlexRay)

- Typische Werte: 10 Mbit/s, 100 ns Bitzeit. Idle: BP = BM ≈ 2,5 V (Differenz 0 V); Idle Low Power ≈ 0 V. Data_1: BP 3,5 V / BM 1,5 V (+2 V). Data_0: BP 1,5 V / BM 3,5 V (−2 V). Abschluss 80–110 Ω je Ende, gemessen ca. 40–55 Ω. Pico empfiehlt mindestens 20 MHz Bandbreite.
- VDS1022I: eingeschränkt: Pegel, Idle und Abschluss ja (BP/BM gegen Masse, Math A−B). Nur 10 Abtastwerte/bit bei 100 MS/s und 25 MHz Bandbreite; Flanken verrundet, Reflexionen und Augendiagramm nicht verlässlich.
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/product-news/a-deep-dive-into-flexray-architecture-voltage-levels-and-packet-structure> · <https://www.picoauto.com/library/automotive-guided-tests/communication>

### Sensor-Schnittstelle (Druck, Temperatur, LMM, Drosselklappe)

**SENT (SAE J2716)** · Digital, Pulsbreite pro Nibble (Single Edge Nibble Transmission) · Priorität mittel · Karte: fehlt (nur Erklärbild SENT)

- Typische Werte: Tick 3–90 µs, typ. 3 µs. Sync-/Kalibrierpuls 56 Ticks (Beispiel 177 µs / 56 ≈ 3 µs). Nibble 12–27 Ticks (Wert 0–15), Low-Phase ≥ 5 Ticks. Low unter 0,5 V, High über 4,1 V; 3 Leitungen: 5 V, Signal, Masse (Wikipedia, Pico).
- VDS1022I: ja (1:1, Zeitauflösung ausreicht). Tick per Cursor aus dem Kalibrierpuls bestimmen. Keine Dekodierung dokumentiert.
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/SENT_(protocol)> · <https://www.picoauto.com/library/automotive-guided-tests/communication/sent/AGT-403-sent-slow-standard-testing/>

### Sensor-Schnittstelle (vor allem Airbag-Satelliten)

**PSI5 (Peripheral Sensor Interface 5)** · Strommodulierter Manchester-Code auf der Versorgungsleitung · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: 125 kbit/s (optional 189 kbit/s). Rahmen: 2 Startbits, 10–28 Datenbits, Parität oder 3-bit-CRC. Sync durch kurzes Anheben der Versorgungsspannung. Spannungsschwankungen nur im mV-Bereich (Pico).
- VDS1022I: nein (praktisch): Strom- bzw. mV-Messung nötig; an Airbag-Kreisen grundsätzlich tabu
- Sicherheit: AIRBAG/PYROTECHNIK: niemals messen oder adaptieren, Auslösegefahr. Nur Diagnosetester.
- Quellen: <https://www.picotech.com/library/oscilloscopes/psi5-serial-protocol-decoding>

### Bussystem (Kameras, Fahrerassistenz, Gateway)

**Automotive Ethernet 100BASE-T1 / 1000BASE-T1** · PAM3, Vollduplex auf einem verdrillten Paar · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: 100BASE-T1: 100 Mbit/s bei 66,67 MBd (IEEE 802.3bw). 1000BASE-T1: 750 MBd (802.3bp). Das Oszi zeigt die Summe beider Sender; ohne Spezialtechnik nicht trennbar (PEAK).
- VDS1022I: nein: Symbolrate über Bandbreite und Abtastrate; höchstens grob „Aktivität vorhanden“
- Sicherheit: keine besonderen; Steckverbinder nicht beschädigen (Impedanz)
- Quellen: <https://www.peak-system.com/know-how/blog/100base-t1-and-1000base-t1-what-engineers-need-to-know/>

### Bussystem (Multidrop-Ethernet, neu)

**Automotive Ethernet 10BASE-T1S** · Differential-Manchester (DME), differenziell · Priorität niedrig · Karte: fehlt

- Typische Werte: 10 Mbit/s (IEEE 802.3cg). Multidrop ähnlich CAN, Coordinator/Client. Differenzsignal ca. 1 Vss (Pico, Math A−B).
- VDS1022I: eingeschränkt: Pegel und Aktivität ja (2 Kanäle gegen Masse, Math A−B). Flanken und Timing bei 25 MHz grenzwertig; Pico nutzt x10-High-Speed-Tastköpfe.
- Sicherheit: keine besonderen
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/communication/10base-t1s/AGT-400-10base-t1s-physical-layer/> · <https://www.peak-system.com/know-how/blog/100base-t1-and-1000base-t1-what-engineers-need-to-know/>

### Diagnoseschnittstelle (ältere Fahrzeuge)

**K-Leitung (ISO 9141-2 / ISO 14230 KWP2000)** · Eindraht-UART gegen Masse · Priorität niedrig · Karte: fehlt

- Typische Werte: OBD Pin 7 (L-Leitung Pin 15 optional). 10,4 kbit/s (KWP2000: 1,2–10,4 kBaud). Ruhe high über 510 Ω an UBatt, aktiv low per Open-Collector (Wikipedia). Pico prüft den Datenaustausch Tester–Steuergerät.
- VDS1022I: ja (12-V-Pegel; 1:1 bis 40 Vss möglich, 10:1 empfohlen)
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/On-board_diagnostics> · <https://www.picoauto.com/library/automotive-guided-tests/communication/k-line-bus/AGT-166-k-line-bus-physical-layer/>

### Diagnose- und Fahrzeugbus (ältere US-Fahrzeuge)

**SAE J1850 PWM/VPW** · PWM: differenziell; VPW: Eindraht · Priorität niedrig · Karte: fehlt

- Typische Werte: PWM (Ford): 41,6 kbit/s, Pins 2/10, High +5 V. VPW (GM): 10,4/41,6 kbit/s, Pin 2, High +7 V, Entscheidungsschwelle 3,5 V (Wikipedia).
- VDS1022I: ja
- Sicherheit: keine besonderen
- Quellen: <https://en.wikipedia.org/wiki/On-board_diagnostics>

### Infotainment (älter)

**MOST-Bus** · optisch (Kunststofflichtwellenleiter) bzw. elektrisch (MOST50) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: MOST25/MOST150 über Kunststofflichtwellenleiter, MOST50 (und MOST150) auch elektrisch. Ring bzw. Daisy-Chain mit bis zu 64 Geräten; MOST25 ca. 23 MBd (Wikipedia).
- VDS1022I: nein bei optischer Ausführung; elektrische Variante unsicher, nicht empfohlen
- Sicherheit: Lichtwellenleiter nicht knicken; nicht in den Lichtaustritt blicken (nicht quellenverifiziert)
- Quellen: <https://en.wikipedia.org/wiki/MOST_Bus>

### Hochvolt/Laden

**Control Pilot (CP) – Ladekommunikation AC (IEC 61851, Typ 2)** · PWM ±12 V, 1 kHz, Zustandskodierung über Spannung und Tastgrad · Priorität mittel · Karte: fehlt

- Typische Werte: Zustände: A 12 V (ohne Fahrzeug, EVSE-Seite), B 9 V, C 6 V (Laden), D 3 V (Lüftung), E 0 V, F −12 V (Fehler). Der Tastgrad gibt den maximal verfügbaren Ladestrom an: 10 % = 6 A, 50 % = 30 A, 80 % = 48 A, 96 % = 80 A. 3–7 % (typ. 5 %) bedeutet digitale Kommunikation, ggf. mit überlagertem LIN/SWCAN (Pico, e-mobileo).
- VDS1022I: technisch ja (±12 V, 1 kHz, 1:1 reicht), aber nur über einen CAT-bewerteten Prüfadapter. Pico nutzt einen aktiven Differenztastkopf 1:20. Gemeinsame Kanalmasse beachten.
- Sicherheit: Die Ladeeinrichtung ist netzverbunden: nur mit HV- bzw. Elektrofachqualifikation und CAT-bewertetem Zubehör (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/charger-vehicle-tests/AGT-896-charger-vehicle-communications-type-2/> · <https://www.e-mobileo.de/control-pilot-cp>

**Proximity Pilot (PP) – Kabelkodierung Typ 2** · Widerstandskodierung PP–PE · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: 1,5 kΩ = 13 A, 680 Ω = 20 A, 200 Ω = 32 A, 100 Ω = 63 A (dreiphasig) bzw. 70 A (einphasig) (Pico)
- VDS1022I: nicht sinnvoll: Widerstandsmessung mit dem Multimeter
- Sicherheit: Nie bei intaktem PP-Kreis messen. Ladekabel von der EVSE trennen; Spannungsfreiheit sicherstellen (Pico).
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/charger-vehicle-tests/AGT-897-charger-vehicle-proximity-line-type-2/>

**PLC-Kommunikation DC-Laden (ISO 15118 / DIN 70121) auf CP** · Hochfrequente Trägersignale auf dem CP-Leiter · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: 5 % CP-Tastgrad zeigt digitale Kommunikation an (Pico). Trägerfrequenzen nicht in geöffneten Quellen, nicht verifiziert.
- VDS1022I: nein (keine Dekodierung; Frequenzbereich nicht verifiziert)
- Sicherheit: DC-Ladesäule: Hochvolt, nur mit Qualifikation
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/charger-vehicle-tests/AGT-896-charger-vehicle-communications-type-2/>

**Berührungslose Messung an HV-Leitungen (z. B. AC-Ladestrom EVSE → OBC)** · Induktiv bzw. kapazitiv aufgenommenes Wechselfeld · Priorität niedrig · Karte: fehlt

- Typische Werte: Nur Wechsel- und Schaltvorgänge nachweisbar; Gleichgrößen nicht. Ein fehlendes Signal beweist keine Spannungsfreiheit, da Schirmung möglich ist (Pico AGT-929).
- VDS1022I: eingeschränkt, nur qualitativ (mit Signalsonde mit BNC-Ausgang)
- Sicherheit: HOCHVOLT: Sonde fern von blanken HV-Teilen und drehenden Teilen halten (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-929-non-intrusive-measurements/>

### Hochvolt/E-Antrieb

**Resolver (Rotorlage E-Maschine)** · Sinus-Erregung und 2 amplitudenmodulierte Ausgänge (sin/cos), potentialfrei · Priorität niedrig · Karte: fehlt

- Typische Werte: Erregung ca. 10 kHz (Pico), allgemein 10 oder 20 kHz. Erregeramplitude bei HEV/EV ca. 20–30 Vss (Patent US9880027). Die Ausgänge sind 90° versetzt; insgesamt 3 Signale. Fehlerbilder: Kurzschluss, Unterbrechung, Schluss zwischen den Ausgängen, verdrehter Stator (Pico).
- VDS1022I: nur sehr eingeschränkt: Pico hält Oszis mit gemeinsamer Kanalmasse für ungeeignet (mehrere Differenzmessungen, Differenztastkopf 1400 V auf der Erregung). Der VDS1022I hat gemeinsame Masse und nur 2 Kanäle; höchstens 2 Signale, jeweils mit Differenztastkopf.
- Sicherheit: HOCHVOLT: nur qualifiziertes, typgeschultes Personal; nicht mit Herzschrittmacher (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-885-motor-resolver/> · <https://patents.google.com/patent/US9880027>

**Phasenströme E-Maschine (Inverter-Ausgang)** · 3-phasiger Wechselstrom (PWM-Inverter, IGBT) · Priorität niedrig · Karte: fehlt

- Typische Werte: Gleiche Amplitude, typ. 120° versetzt (manche Hybride 60°). 6 IGBTs für 3 Phasen. Messung mit 3 Hochstromzangen (Pico).
- VDS1022I: eingeschränkt: max. 2 von 3 Phasen, nur mit HV-tauglicher (CAT-bewerteter) Stromzange mit Spannungsausgang; keine galvanische Verbindung zum HV
- Sicherheit: HOCHVOLT: Phasen nur über freigegebene, geprüfte Break-out-Box, wenn nicht sicher zugänglich. Bei Probefahrt bedient ein Beifahrer das Oszi (Pico).
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-917-motor-winding-current-phasing/> · <https://www.picoauto.com/library/company-news/new-motor-winding-current-phasing-guided-test>

**HV-Batterie- und Zwischenkreisstrom (Antrieb/Rekuperation)** · DC-Strom, bidirektional · Priorität niedrig · Karte: fehlt

- Typische Werte: Stromrichtung beim Beschleunigen und Bremsen entgegengesetzt (Pico AGT-918). Absolutwerte nicht genannt.
- VDS1022I: nur mit HV-tauglicher DC-Hochstromzange (BNC-Ausgang)
- Sicherheit: HOCHVOLT: nur bei sicher zugänglicher HV-DC-Leitung, mit Qualifikation
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-918-regeneration-current/>

**HV-Spannung (Batterie/Zwischenkreis) und Spannungsfreiheit** · DC-Hochspannung · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Nennspannung herstellerabhängig, häufig mehrere 100 V (nicht quellenverifiziert). Spannungsfreiheit wird mit einem zweipoligen Spannungsprüfer festgestellt (Pico AGT-889).
- VDS1022I: nein: max. 400 Vss mit 10:1, keine CAT-Einstufung bekannt, gemeinsame Kanalmasse. Nur mit HV-Differenztastkopf passender CAT-Kategorie und Qualifikation.
- Sicherheit: HOCHVOLT: Lebensgefahr; Freischalten nach Herstellervorgabe, Spannungsfreiheit vor jeder Arbeit prüfen (Pico)
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/safety-tests/AGT-889-0-v-potential/> · <https://toolboom.com/en/digital-oscilloscope-owon-vds1022i/>

**HV-Schütze (SMR) – Ansteuerung und Vorladung** · Schaltsignale der Schützspulen (Niedervoltseite) · Priorität niedrig · Karte: fehlt

- Typische Werte: Zuschaltung: SMRB → SMRP (Vorladung über Widerstand) → SMRG; Abschaltung in umgekehrter Folge. Steuerkreise gegen Fahrzeugmasse gemessen (Pico AGT-884, Toyota Prius III). Keine Zahlenwerte.
- VDS1022I: Steuerkreise ja, 2 von 3 gleichzeitig
- Sicherheit: HOCHVOLT-Umfeld: nur mit Qualifikation
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-884-toyota-prius-iii-system-main-relay/>

### Hochvolt/Thermomanagement

**Elektrischer Klimakompressor (HV) – Strom und Drehzahlansteuerung** · HV-Strom und LIN-Ansteuerung · Priorität niedrig · Karte: fehlt

- Typische Werte: HV-Strom per Hochstromzange. Die Drehzahlanforderung kommt im Beispiel per LIN vom Klimasteuergerät, Rückmeldung auf derselben Leitung (Pico AGT-922).
- VDS1022I: LIN-Seite ja; HV-Strom nur mit HV-tauglicher Zange
- Sicherheit: HOCHVOLT. Nur das vorgeschriebene nichtleitende Öl verwenden, sonst Isolationsschaden (Pico).
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles/system-component-tests/AGT-922-hvac-compressor-current-and-speed/>

### Hochvolt/Sicherheitskreis

**HV-Interlock (HVIL)** · Niedervolt-Prüfschleife durch die HV-Steckverbinder · Priorität niedrig · Karte: fehlt

- Typische Werte: Signalform (DC oder getaktet) herstellerabhängig; keine Quelle geöffnet
- VDS1022I: voraussichtlich ja auf der Niedervoltseite; nicht verifiziert
- Sicherheit: HOCHVOLT-Umfeld: nur mit Qualifikation; HV-Stecker nicht unter Spannung trennen

### Hochvolt/Sicherheit

**Isolationswiderstand HV** · Isolationsmessung (kein Oszi-Signal) · Priorität niedrig · Karte: fehlt · *kein Oszi-Thema*

- Typische Werte: Messung mit Isolationsmessgerät (Pico-Test AGT-888); Grenzwerte herstellerabhängig
- VDS1022I: nein
- Sicherheit: HOCHVOLT: nur mit Qualifikation
- Quellen: <https://www.picoauto.com/library/automotive-guided-tests/electric-vehicles>
