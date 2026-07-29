import type { Env, Listing, ProfileRunResult, RunSummary, SearchProfile, WatcherConfig } from "./types";
import { coordsForPostcode, distanceKm } from "./geo";
import { errText, searchListings, DEFAULT_USER_AGENT } from "./willhaben";
import { escapeHtml, reportErrorOncePerDay, sendListing, sendMessage } from "./telegram";

const LAST_RUN_KEY = "state:last-run";
const SEEDED_PREFIX = "state:seeded:";
const SEEN_PREFIX = "seen:";

const DEFAULT_ROWS = 60;
const DEFAULT_MAX_NOTIFY = 10;
const DEFAULT_SEEN_TTL_DAYS = 30;
/** Kleine Pause zwischen Profilen – willhaben soll keine Bursts sehen. */
const PROFILE_DELAY_MS = 750;

export interface RunOptions {
  trigger: "cron" | "manual";
  /** Nur suchen und filtern: kein Telegram-Versand, keine KV-Schreibvorgänge. */
  dryRun?: boolean;
  /** Auf ein einzelnes Profil einschränken. */
  profileId?: string;
  /** Auch deaktivierte Profile ausführen (für manuelle Tests). */
  includeDisabled?: boolean;
}

export async function runWatcher(
  env: Env,
  config: WatcherConfig,
  options: RunOptions,
): Promise<RunSummary> {
  const startedAt = Date.now();
  const dryRun = options.dryRun === true;
  const rows = intFromEnv(env.SEARCH_ROWS, DEFAULT_ROWS, 1, 200);
  const maxNotify = intFromEnv(env.MAX_NOTIFY_PER_RUN, DEFAULT_MAX_NOTIFY, 0, 50);
  const seenTtl = intFromEnv(env.SEEN_TTL_DAYS, DEFAULT_SEEN_TTL_DAYS, 1, 365) * 86_400;
  const userAgent = env.USER_AGENT?.trim() || DEFAULT_USER_AGENT;

  const selected = config.profiles.filter((p) => {
    if (options.profileId && p.id !== options.profileId) return false;
    return p.enabled || options.includeDisabled === true || Boolean(options.profileId);
  });

  const results: ProfileRunResult[] = [];
  const errors: string[] = [];

  for (const [index, profile] of selected.entries()) {
    if (index > 0) await sleep(PROFILE_DELAY_MS);
    try {
      results.push(
        await runProfile(env, profile, { dryRun, rows, maxNotify, seenTtl, userAgent }),
      );
    } catch (err) {
      const message = `Profil "${profile.name}": ${errText(err)}`;
      console.error(message);
      errors.push(message);
      results.push({
        profileId: profile.id,
        profileName: profile.name,
        fetched: 0,
        matched: 0,
        fresh: 0,
        notified: 0,
        seeded: false,
        error: errText(err),
      });
    }
  }

  const summary: RunSummary = {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    dryRun,
    trigger: options.trigger,
    profiles: results,
    errors,
  };

  if (!dryRun) {
    await env.WATCHER.put(LAST_RUN_KEY, JSON.stringify(stripListings(summary)));
    if (errors.length > 0) await reportErrorOncePerDay(env, errors);
  }

  return summary;
}

interface ProfileRunConfig {
  dryRun: boolean;
  rows: number;
  maxNotify: number;
  seenTtl: number;
  userAgent: string;
}

async function runProfile(
  env: Env,
  profile: SearchProfile,
  cfg: ProfileRunConfig,
): Promise<ProfileRunResult> {
  const listings = await searchListings(profile, { rows: cfg.rows, userAgent: cfg.userAgent });
  const matched = filterListings(profile, listings);

  const result: ProfileRunResult = {
    profileId: profile.id,
    profileName: profile.name,
    fetched: listings.length,
    matched: matched.length,
    fresh: 0,
    notified: 0,
    seeded: false,
    listings: matched,
  };

  if (cfg.dryRun) {
    result.fresh = matched.length;
    return result;
  }

  const fresh: Listing[] = [];
  for (const listing of matched) {
    const key = seenKey(profile.id, listing.id);
    if (await env.WATCHER.get(key)) continue;
    fresh.push(listing);
  }
  result.fresh = fresh.length;

  const seededBefore = await env.WATCHER.get(seededKey(profile.id));

  // Erster Lauf eines Profils: alles als bekannt markieren, statt auf einen
  // Schlag Dutzende Nachrichten zu schicken.
  if (!seededBefore) {
    await markSeen(env, profile.id, matched, cfg.seenTtl);
    await env.WATCHER.put(seededKey(profile.id), new Date().toISOString());
    result.seeded = true;
    await sendMessage(
      env,
      [
        `👀 <b>Profil aktiviert:</b> ${escapeHtml(profile.name)}`,
        `${matched.length} aktuelle Treffer wurden als bekannt markiert.`,
        "Ab jetzt kommt eine Nachricht, sobald ein neues Inserat auftaucht.",
      ].join("\n"),
    );
    return result;
  }

  const toNotify = fresh.slice(0, cfg.maxNotify);
  for (const listing of toNotify) {
    await sendListing(env, profile, listing);
    result.notified += 1;
  }

  if (fresh.length > toNotify.length) {
    await sendMessage(
      env,
      `ℹ️ <b>${escapeHtml(profile.name)}</b>: ${fresh.length - toNotify.length} weitere neue Treffer ` +
        `wurden nicht einzeln gemeldet (Limit ${cfg.maxNotify} pro Lauf).`,
    );
  }

  // Auch nicht gemeldete Treffer merken, damit sie nicht beim nächsten Lauf
  // erneut als "neu" gelten.
  await markSeen(env, profile.id, fresh, cfg.seenTtl);
  return result;
}

/** Filter, die willhaben nicht serverseitig anbietet (Stichwörter, Umkreis). */
export function filterListings(profile: SearchProfile, listings: Listing[]): Listing[] {
  const include = (profile.includeKeywords ?? []).map(normalizeText).filter(Boolean);
  const exclude = (profile.excludeKeywords ?? []).map(normalizeText).filter(Boolean);
  const center = profile.radiusKm ? coordsForPostcode(profile.postcode) : null;

  const out: Listing[] = [];
  for (const listing of listings) {
    const haystack = normalizeText(`${listing.title} ${listing.description}`);
    if (include.length > 0 && !include.some((word) => haystack.includes(word))) continue;
    if (exclude.length > 0 && exclude.some((word) => haystack.includes(word))) continue;

    // Sicherheitsnetz: die Bereichsfilter kommen zwar aus der API, werden aber
    // erneut geprüft, falls willhaben einen Parameter ignoriert.
    if (!withinRange(listing.price, profile.priceFrom, profile.priceTo, true)) continue;
    if (!withinRange(listing.year, profile.yearFrom, profile.yearTo, false)) continue;
    if (!withinRange(listing.mileage, profile.mileageFrom, profile.mileageTo, false)) continue;

    const enriched: Listing = { ...listing, distanceKm: null };
    if (center) {
      const point =
        listing.lat !== null && listing.lon !== null
          ? { lat: listing.lat, lon: listing.lon }
          : coordsForPostcode(listing.postcode);
      if (point) {
        const dist = distanceKm(center, point);
        // Ortsangaben sind Ortsmittelpunkte – kleine Toleranz einrechnen.
        if (dist > profile.radiusKm! + 5) continue;
        enriched.distanceKm = dist;
      }
      // Ohne Koordinaten wird das Inserat behalten, aber ohne Entfernung gezeigt.
    }
    out.push(enriched);
  }
  return out;
}

/**
 * `treatZeroAsUnknown` gilt für Preise: willhaben liefert 0 bei
 * "Preis auf Anfrage" – solche Inserate sollen nicht wegfallen.
 */
function withinRange(
  value: number | null,
  from: number | undefined,
  to: number | undefined,
  treatZeroAsUnknown: boolean,
): boolean {
  if (from === undefined && to === undefined) return true;
  if (value === null) return true;
  if (treatZeroAsUnknown && value <= 0) return true;
  if (from !== undefined && value < from) return false;
  if (to !== undefined && value > to) return false;
  return true;
}

/** Kleinschreibung ohne Diakritika, damit "Motorschaden" auch "MOTORSCHÄDEN" trifft. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
}

async function markSeen(
  env: Env,
  profileId: string,
  listings: Listing[],
  ttlSeconds: number,
): Promise<void> {
  const stamp = new Date().toISOString();
  for (const listing of listings) {
    await env.WATCHER.put(seenKey(profileId, listing.id), stamp, { expirationTtl: ttlSeconds });
  }
}

export function seenKey(profileId: string, adId: string): string {
  return `${SEEN_PREFIX}${profileId}:${adId}`;
}

export function seededKey(profileId: string): string {
  return `${SEEDED_PREFIX}${profileId}`;
}

/** Setzt die Duplikatserkennung eines Profils zurück (inkl. Erstlauf-Markierung). */
export async function resetSeen(env: Env, profileId: string): Promise<number> {
  let cursor: string | undefined;
  let deleted = 0;
  do {
    const page = await env.WATCHER.list({ prefix: `${SEEN_PREFIX}${profileId}:`, cursor });
    for (const key of page.keys) {
      await env.WATCHER.delete(key.name);
      deleted += 1;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  await env.WATCHER.delete(seededKey(profileId));
  return deleted;
}

export async function loadLastRun(env: Env): Promise<RunSummary | null> {
  return (await env.WATCHER.get(LAST_RUN_KEY, "json")) as RunSummary | null;
}

function stripListings(summary: RunSummary): RunSummary {
  return { ...summary, profiles: summary.profiles.map(({ listings, ...rest }) => rest) };
}

function intFromEnv(raw: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
