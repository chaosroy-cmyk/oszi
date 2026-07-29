import type { Env, SearchProfile, WatcherConfig } from "./types";
import { isKnownRegion } from "./regions";

export const CONFIG_KEY = "config:v1";

/**
 * Startkonfiguration beim allerersten Lauf. Änderbar über /config,
 * danach wird ausschließlich der KV-Inhalt verwendet.
 */
export function defaultConfig(): WatcherConfig {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    profiles: [
      {
        id: "q7-guenstig",
        name: "Q7 günstig",
        enabled: true,
        makeId: "1003",
        makeLabel: "Audi",
        modelId: "1031",
        modelLabel: "Q7",
        priceTo: 8000,
        yearFrom: 2010,
        postcode: "5020",
        radiusKm: 50,
        includeKeywords: [],
        excludeKeywords: [],
      },
      {
        id: "q7-getriebeschaden",
        name: "Q7 Getriebeschaden",
        enabled: false,
        makeId: "1003",
        makeLabel: "Audi",
        modelId: "1031",
        modelLabel: "Q7",
        priceTo: 8000,
        yearFrom: 2010,
        postcode: "5020",
        radiusKm: 50,
        includeKeywords: ["Getriebeschaden", "Bastler", "Reparatur", "Defekt", "Schaden"],
        excludeKeywords: [],
      },
    ],
  };
}

export async function loadConfig(env: Env): Promise<WatcherConfig> {
  const raw = await env.WATCHER.get(CONFIG_KEY, "json");
  if (!raw) {
    const fresh = defaultConfig();
    await saveConfig(env, fresh);
    return fresh;
  }
  return normalizeConfig(raw);
}

export async function saveConfig(env: Env, config: WatcherConfig): Promise<WatcherConfig> {
  const normalized = { ...normalizeConfig(config), updatedAt: new Date().toISOString() };
  await env.WATCHER.put(CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}

export class ConfigError extends Error {}

/** Nimmt beliebiges JSON entgegen und erzwingt eine gültige Struktur. */
export function normalizeConfig(input: unknown): WatcherConfig {
  const source = input as { profiles?: unknown } | null;
  const rawProfiles = Array.isArray(source?.profiles) ? source!.profiles : [];
  if (rawProfiles.length > 25) {
    throw new ConfigError("Maximal 25 Suchprofile möglich.");
  }

  const seenIds = new Set<string>();
  const profiles = rawProfiles.map((entry, index) => {
    const profile = normalizeProfile(entry, index);
    if (seenIds.has(profile.id)) {
      throw new ConfigError(`Doppelte Profil-ID: ${profile.id}`);
    }
    seenIds.add(profile.id);
    return profile;
  });

  return { version: 1, updatedAt: new Date().toISOString(), profiles };
}

function normalizeProfile(entry: unknown, index: number): SearchProfile {
  if (!entry || typeof entry !== "object") {
    throw new ConfigError(`Profil ${index + 1} ist kein Objekt.`);
  }
  const p = entry as Record<string, unknown>;

  const name = str(p.name)?.slice(0, 80) || `Suche ${index + 1}`;
  const id = (str(p.id) || slugify(name) || `profil-${index + 1}`).slice(0, 60);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
    throw new ConfigError(`Ungültige Profil-ID "${id}" (nur Buchstaben, Ziffern, - und _).`);
  }

  const areaId = str(p.areaId) ?? "";
  if (areaId && !isKnownRegion(areaId)) {
    throw new ConfigError(`Unbekanntes Bundesland (areaId=${areaId}) in Profil "${name}".`);
  }

  const postcode = str(p.postcode) ?? "";
  if (postcode && !/^\d{4}$/.test(postcode)) {
    throw new ConfigError(`PLZ "${postcode}" in Profil "${name}" muss vierstellig sein.`);
  }

  const priceFrom = num(p.priceFrom, 0, 10_000_000);
  const priceTo = num(p.priceTo, 0, 10_000_000);
  if (priceFrom !== undefined && priceTo !== undefined && priceFrom > priceTo) {
    throw new ConfigError(`Preis von/bis vertauscht in Profil "${name}".`);
  }

  const yearFrom = num(p.yearFrom, 1900, 2100);
  const yearTo = num(p.yearTo, 1900, 2100);
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    throw new ConfigError(`Baujahr von/bis vertauscht in Profil "${name}".`);
  }

  const mileageFrom = num(p.mileageFrom, 0, 2_000_000);
  const mileageTo = num(p.mileageTo, 0, 2_000_000);
  if (mileageFrom !== undefined && mileageTo !== undefined && mileageFrom > mileageTo) {
    throw new ConfigError(`Kilometerstand von/bis vertauscht in Profil "${name}".`);
  }

  return {
    id,
    name,
    enabled: p.enabled !== false,
    makeId: digits(p.makeId),
    makeLabel: str(p.makeLabel)?.slice(0, 60),
    modelId: digits(p.modelId),
    modelLabel: str(p.modelLabel)?.slice(0, 60),
    keyword: str(p.keyword)?.slice(0, 120),
    priceFrom,
    priceTo,
    yearFrom,
    yearTo,
    mileageFrom,
    mileageTo,
    areaId: areaId || undefined,
    postcode: postcode || undefined,
    radiusKm: num(p.radiusKm, 1, 1000),
    includeKeywords: keywordList(p.includeKeywords),
    excludeKeywords: keywordList(p.excludeKeywords),
  };
}

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function digits(value: unknown): string | undefined {
  const s = str(value);
  if (!s) return undefined;
  if (!/^\d{1,10}$/.test(s)) throw new ConfigError(`Ungültige willhaben-ID: ${s}`);
  return s;
}

function num(value: unknown, min: number, max: number): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return undefined;
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) {
    throw new ConfigError(`Wert ${rounded} liegt außerhalb von ${min}–${max}.`);
  }
  return rounded;
}

function keywordList(value: unknown): string[] {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const cleaned = source
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
    .slice(0, 40)
    .map((v) => v.slice(0, 60));
  return [...new Set(cleaned)];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
