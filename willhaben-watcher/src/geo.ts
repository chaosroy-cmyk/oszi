import { PLZ_PACKED, PLZ_RECORD_LENGTH } from "./plz-data";

export interface Coords {
  lat: number;
  lon: number;
}

/**
 * Binärsuche in der nach PLZ sortierten, gepackten Tabelle.
 * Kein Aufbau einer Map beim Start – spart CPU-Zeit pro Worker-Isolate.
 */
export function coordsForPostcode(postcode: string | null | undefined): Coords | null {
  if (!postcode) return null;
  const key = postcode.trim();
  if (!/^\d{4}$/.test(key)) return null;

  let lo = 0;
  let hi = PLZ_PACKED.length / PLZ_RECORD_LENGTH - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const offset = mid * PLZ_RECORD_LENGTH;
    const candidate = PLZ_PACKED.slice(offset, offset + 4);
    if (candidate === key) {
      return {
        lat: Number(PLZ_PACKED.slice(offset + 4, offset + 10)) / 10000,
        lon: Number(PLZ_PACKED.slice(offset + 10, offset + 16)) / 10000,
      };
    }
    if (candidate < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}

/** willhaben liefert Koordinaten als "47.812,13.045". */
export function parseCoordinates(raw: string | null | undefined): Coords | null {
  if (!raw) return null;
  const [latRaw, lonRaw] = raw.split(",");
  const lat = Number.parseFloat(latRaw);
  const lon = Number.parseFloat(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: Coords, b: Coords): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
