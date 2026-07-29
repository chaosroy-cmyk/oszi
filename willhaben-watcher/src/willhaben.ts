import type { Listing, SearchProfile } from "./types";
import { parseCoordinates } from "./geo";

/**
 * JSON-Endpoint, den die willhaben-Suche selbst per XHR aufruft
 * (sichtbar im DevTools-Netzwerktab auf
 * https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse).
 * Kein HTML-Scraping nötig.
 */
export const SEARCH_URL =
  "https://www.willhaben.at/webapi/iad/search/atz/seo/gebrauchtwagen/auto/gebrauchtwagenboerse";

const RESULT_PAGE = "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse";
const AD_BASE = "https://www.willhaben.at/iad/";
const IMAGE_BASE = "https://cache.willhaben.at/mmo/";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/** Sortierung "Aktualität, neueste zuerst" (published.descending). */
const SORT_NEWEST = "1";

export class WillhabenError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "WillhabenError";
    this.status = status;
  }
}

function requestHeaders(userAgent: string): HeadersInit {
  return {
    accept: "application/json",
    "accept-language": "de-AT,de;q=0.9,en;q=0.6",
    "user-agent": userAgent,
    // Ohne diesen Header antwortet die API teilweise mit 403.
    "x-wh-client": "api@willhaben.at;responsive_web;server;1.0.0;desktop",
    referer: RESULT_PAGE,
  };
}

export function buildSearchUrl(profile: SearchProfile, rows: number): string {
  const params = new URLSearchParams();
  params.set("rows", String(rows));
  params.set("page", "1");
  params.set("sort", SORT_NEWEST);

  // URLSearchParams kodiert den Slash zu %2F – genau wie willhaben selbst.
  if (profile.makeId) params.set("CAR_MODEL/MAKE", profile.makeId);
  if (profile.modelId) params.set("CAR_MODEL/MODEL", profile.modelId);
  if (profile.keyword?.trim()) params.set("keyword", profile.keyword.trim());
  if (isNum(profile.priceFrom)) params.set("PRICE_FROM", String(profile.priceFrom));
  if (isNum(profile.priceTo)) params.set("PRICE_TO", String(profile.priceTo));
  if (isNum(profile.yearFrom)) params.set("YEAR_MODEL_FROM", String(profile.yearFrom));
  if (isNum(profile.yearTo)) params.set("YEAR_MODEL_TO", String(profile.yearTo));
  if (isNum(profile.mileageFrom)) params.set("MILEAGE_FROM", String(profile.mileageFrom));
  if (isNum(profile.mileageTo)) params.set("MILEAGE_TO", String(profile.mileageTo));
  if (profile.areaId) params.set("areaId", profile.areaId);

  return `${SEARCH_URL}?${params.toString()}`;
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

async function fetchJson(url: string, userAgent: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: requestHeaders(userAgent),
      signal: AbortSignal.timeout(20_000),
      cf: { cacheTtl: 0 },
    } as RequestInit);
  } catch (err) {
    throw new WillhabenError(`Netzwerkfehler bei willhaben: ${errText(err)}`);
  }

  if (!response.ok) {
    throw new WillhabenError(
      `willhaben antwortete mit HTTP ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  try {
    return await response.json();
  } catch (err) {
    throw new WillhabenError(`Antwort war kein gültiges JSON: ${errText(err)}`);
  }
}

/** Sucht Inserate und normalisiert sie in ein stabiles Format. */
export async function searchListings(
  profile: SearchProfile,
  options: { rows: number; userAgent: string },
): Promise<Listing[]> {
  const data = await fetchJson(buildSearchUrl(profile, options.rows), options.userAgent);
  const raw = data?.advertSummaryList?.advertSummary;
  if (!Array.isArray(raw)) {
    throw new WillhabenError(
      "Unerwartete Antwortstruktur: advertSummaryList.advertSummary fehlt (API vermutlich geändert)",
    );
  }
  const listings: Listing[] = [];
  for (const entry of raw) {
    const listing = toListing(entry);
    if (listing) listings.push(listing);
  }
  return listings;
}

function attributeMap(entry: any): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const list = entry?.attributes?.attribute;
  if (!Array.isArray(list)) return map;
  for (const attr of list) {
    if (attr && typeof attr.name === "string" && Array.isArray(attr.values)) {
      map.set(attr.name, attr.values.map((v: unknown) => String(v)));
    }
  }
  return map;
}

function toListing(entry: any): Listing | null {
  const attrs = attributeMap(entry);
  const first = (name: string): string | null => attrs.get(name)?.[0] ?? null;

  const id = String(entry?.id ?? first("ADID") ?? "").trim();
  if (!id) return null;

  const seoUrl = first("SEO_URL");
  const url = seoUrl
    ? AD_BASE + seoUrl.replace(/^\/+/, "")
    : `https://www.willhaben.at/iad/object?adId=${encodeURIComponent(id)}`;

  const coords = parseCoordinates(first("COORDINATES"));

  return {
    id,
    title: first("HEADING") ?? String(entry?.description ?? "").trim() ?? "Inserat",
    description: first("BODY_DYN") ?? "",
    priceText: first("PRICE_FOR_DISPLAY"),
    price: toNumber(first("PRICE")),
    year: toNumber(first("YEAR_MODEL")),
    mileage: toNumber(first("MILEAGE")),
    postcode: first("POSTCODE"),
    location: first("LOCATION"),
    state: first("STATE"),
    url,
    imageUrl: imageUrlFor(entry, attrs),
    publishedAt: first("PUBLISHED_String"),
    lat: coords?.lat ?? null,
    lon: coords?.lon ?? null,
  };
}

function imageUrlFor(entry: any, attrs: Map<string, string[]>): string | null {
  const fromList = entry?.advertImageList?.advertImage?.[0];
  const direct = fromList?.mainImageUrl ?? fromList?.referenceImageUrl;
  if (typeof direct === "string" && direct.startsWith("http")) return direct;

  const reference =
    attrs.get("MMO")?.[0] ?? attrs.get("ALL_IMAGE_URLS")?.[0]?.split(";")[0] ?? null;
  if (!reference) return null;
  return IMAGE_BASE + reference.replace(/^\/+/, "");
}

function toNumber(value: string | null): number | null {
  if (value === null) return null;
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export interface NavigatorOption {
  id: string;
  label: string;
  hits: number | null;
}

/**
 * Liest die Auswahlwerte eines Navigators (z. B. `make`, `model`) live aus der
 * Such-API. So bleiben Marken- und Modell-Listen der UI automatisch aktuell.
 */
export async function fetchNavigatorOptions(
  navigatorId: "make" | "model",
  makeId: string | null,
  userAgent: string,
): Promise<NavigatorOption[]> {
  const params = new URLSearchParams({ rows: "1", page: "1" });
  if (makeId) params.set("CAR_MODEL/MAKE", makeId);
  const data = await fetchJson(`${SEARCH_URL}?${params.toString()}`, userAgent);

  const groups = data?.navigatorGroups;
  if (!Array.isArray(groups)) {
    throw new WillhabenError("Unerwartete Antwortstruktur: navigatorGroups fehlt");
  }

  const options = new Map<string, NavigatorOption>();
  for (const group of groups) {
    for (const nav of group?.navigatorList ?? []) {
      if (nav?.id !== navigatorId) continue;
      const buckets = [
        ...(nav.groupedPossibleValues ?? []).flatMap((g: any) => g?.possibleValues ?? []),
        ...(nav.possibleValues ?? []),
      ];
      for (const value of buckets) {
        const param = (value?.urlParamRepresentationForValue ?? [])[0];
        const id = param?.value;
        const label = value?.label;
        if (typeof id !== "string" || typeof label !== "string") continue;
        options.set(id, { id, label, hits: typeof value.hits === "number" ? value.hits : null });
      }
    }
  }

  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, "de"));
}

export function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
