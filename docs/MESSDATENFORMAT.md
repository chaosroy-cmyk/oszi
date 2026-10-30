# Neutrales Messdatenformat, Version 1

`window.OsziData.measurement(input)` erzeugt eine JSON-serialisierbare Aufnahme. `window.OsziLive.exportMeasurement()` liefert das aktuelle Fenster; die Schaltfläche **Messdaten JSON** exportiert es. Keine Netzwerkübertragung findet statt. Das bestehende Bibliotheksformat `version:1, aufnahmen:[…]` mit Base64-Float32 bleibt separat les-/schreibbar.

| Feld | Bedeutung |
|---|---|
| `schema` / `schemaVersion` | `kfz-oszi.measurement` / `1`; Änderungen am Vertrag künftig versionieren |
| `appVersion`, `captureId`, `source` | Softwareversion, Aufnahme-ID, Herkunft (`mock`, `owon-vds1022` oder unbekannt) |
| `capturedAtUnixSeconds` | Unix-Zeit des Frame-Empfangs an der Bridge; `null`, wenn unbekannt; keine behauptete präzise Hardware-Uhr |
| `sampleIntervalSeconds` | Positives tatsächliches dt, nicht die angeforderte Zeitbasis |
| `channels[]` | 1–4 eindeutige Kanäle; `number`, `label`, `unit` (`V`/`A`) und endliche `values[]` |
| Kanal-Zeitachse | `sampleRateHz`, `timeOriginSeconds`; Sample i liegt bei t0+i/rate. Optional `timestampsSeconds[]` für explizite monotone Zeitpunkte |
| `accessory` | `kind`, `probeRatio`, `factor`, `inputUnit`, `outputUnit`, `applied`. Samples sind bereits in der angegebenen Ausgangseinheit; Faktoren niemals automatisch noch einmal anwenden |
| `range` | Tatsächlicher Messbereich in Ausgangseinheit, falls der Treiber ihn kennt; sonst min/max `null`. Bildschirm-V/div ist keine bestätigte Hardwaregrenze |
| `calibration` | `verified`, `reference`, `gain`, `offset`; unbekannte numerische Kalibrierung `null`, nicht erfunden |
| `trigger` | Kanal, Flanke, Pegel samt Einheit, relative Position, `confirmed`; konfigurierte Werte sind kein Nachweis eines realen Triggerereignisses |
| `vehicle` | Fahrzeug, Motor, Bauteil/System, Messpunkt, Bedingungen und Notizen, sofern zu der Aufnahme erfasst |
| `quality` | `discontinuous`, `droppedFrames`, `clipped` (`null`=unbekannt), `calibrationVerified`, textuelle `flags[]` |

Bei OWON liefert `Frame.y()` bereits Tastkopf-Volt. `probeRatio` dokumentiert den Tastkopf; bei einer Zange beschreibt `factor` anschließend die Volt→Ampere-Umrechnung. Display-Invertierung und Kanalposition verändern den neutralen Export nicht. Das CSV des realen Live-Signals bleibt in Volt, damit der Eingang nicht durch die Darstellung verfälscht wird; ein Ampere-Demomodell wird ausdrücklich mit `_A` beschriftet.

## Lokales Beispiel ohne KI-API

```js
const capture = OsziData.measurement({
  id: 'test-4ch', dt: 0.00001, source: 'synthetic',
  channels: [1, 2, 3, 4].map(number => ({
    number, label: `CH${number}`, unit: 'V', values: [0, 1, 0],
    accessory: {kind: 'probe', probeRatio: 1, factor: 1, applied: true},
    calibration: {verified: false}
  })),
  trigger: {channel: 1, edge: 'rise', level: 0.5, position: 0.2, confirmed: false},
  quality: {discontinuous: true, flags: ['synthetic']},
  vehicle: {fahrzeug: 'Testaufbau', system: 'Keine Fahrzeugmessung'}
});
const result = await OsziData.analyze(capture, measurement => ({
  // Nur ein lokales Rechenbeispiel, keine Diagnose oder Sicherheitsentscheidung.
  channelCount: measurement.channels.length
}));
```

Der Analyzer erhält eine unabhängige Kopie. Synchrone und asynchrone Ergebnisse/Fehler sind erlaubt. Eine spätere externe Analyse muss separat explizite Nutzereinwilligung, Datenschutz, Größenlimits, Authentifizierung und einen eigenen Ergebnisvertrag erhalten. Es gibt keine versteckte Provider-Auswahl, keinen API-Key und keinen Remote-Aufruf.

## CSV-Vertrag

`OsziData.parseCSV(text)` und `toCSV(channels, dt)` sind DOM-frei. Unterstützt: Semikolon, Komma oder Tab, BOM/CRLF, Dezimalkomma bei Semikolon/Tab, wissenschaftliche Notation; Header `t_s;ch1_V;ch2_V` bis `ch4_A`, alternativ `Zeit,Spannung`/`time,voltage`. Zeiten müssen endlich, streng monoton und innerhalb 0,01 % gleichmäßig sein. Völlig leere Kanalspalten werden ausgelassen; Lücken innerhalb aktiver Kanäle werden abgelehnt. Beliebige Herstellerheader, gequotete Sonderfelder und nichtuniforme CSV-Zeitachsen werden nicht geraten. Maximal 262.144 Samples/Kanal und 16 MiB Text.

Der Bibliotheksimport nimmt CSV mit CH1/CH2 in Volt an. Vierkanal-/Ampere-CSV ist über die neutrale API verarbeitbar; sie wird nicht fälschlich in die bisherige zweikanalige Volt-Bibliothek importiert. JSON-Aufnahmen der V13.4 werden ohne erneute Tastkopf-Multiplikation übernommen.
