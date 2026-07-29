#!/usr/bin/env node
// Erzeugt src/plz-data.ts aus dem GeoNames-Datensatz "AT.zip".
//
//   curl -sSLo AT.zip https://download.geonames.org/export/zip/AT.zip
//   unzip -o AT.zip AT.txt
//   node tools/gen-plz.mjs AT.txt
//
// GeoNames-Daten stehen unter CC BY 4.0.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = process.argv[2] ?? "AT.txt";
const target = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "plz-data.ts");

const grouped = new Map();
for (const line of readFileSync(source, "utf8").split("\n")) {
  const f = line.split("\t");
  const plz = (f[1] ?? "").trim();
  const lat = Number.parseFloat(f[9]);
  const lon = Number.parseFloat(f[10]);
  if (!/^\d{4}$/.test(plz) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const bucket = grouped.get(plz) ?? [];
  bucket.push([lat, lon]);
  grouped.set(plz, bucket);
}

const records = [...grouped.keys()].sort().map((plz) => {
  const pts = grouped.get(plz);
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const la = String(Math.round(lat * 10000)).padStart(6, "0");
  const lo = String(Math.round(lon * 10000)).padStart(6, "0");
  if (la.length !== 6 || lo.length !== 6) throw new Error(`Koordinate passt nicht ins Format: ${plz}`);
  return `${plz}${la}${lo}`;
});

const packed = records.join("");
const chunks = packed.match(/.{1,128}/g) ?? [];

writeFileSync(
  target,
  `// AUTO-GENERIERT – nicht von Hand bearbeiten.
// Quelle: GeoNames Postal Codes AT (CC BY 4.0, https://download.geonames.org/export/zip/)
// Neu erzeugen mit: node tools/gen-plz.mjs
//
// Packed-Format, 16 Zeichen je Datensatz, nach PLZ sortiert:
//   [0..4)  PLZ (4 Ziffern)
//   [4..10) Breitengrad * 10000, 6 Ziffern
//   [10..16) Längengrad * 10000, 6 Ziffern
// ${records.length} Datensätze (Mittelwert aller Orte je PLZ).

export const PLZ_RECORD_LENGTH = 16;

export const PLZ_PACKED =
${chunks.map((c) => `  "${c}" +`).join("\n").replace(/ \+$/, "")};
`,
  "utf8",
);

console.log(`${records.length} PLZ geschrieben nach ${target}`);
