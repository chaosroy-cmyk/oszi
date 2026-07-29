export interface Env {
  /** KV-Namespace für Suchprofile, gesehene Inserate und Laufstatus. */
  WATCHER: KVNamespace;

  /** Secrets (via `wrangler secret put …`). */
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  CONFIG_PASSWORD: string;

  /** Vars aus wrangler.toml (alle optional, mit Defaults im Code). */
  MAX_NOTIFY_PER_RUN?: string;
  SEARCH_ROWS?: string;
  SEEN_TTL_DAYS?: string;
  USER_AGENT?: string;
}

/** Ein gespeichertes Suchprofil. Wird als JSON in KV abgelegt. */
export interface SearchProfile {
  id: string;
  name: string;
  enabled: boolean;

  /** willhaben-IDs aus dem Navigator (`CAR_MODEL/MAKE`, `CAR_MODEL/MODEL`). */
  makeId?: string;
  makeLabel?: string;
  modelId?: string;
  modelLabel?: string;

  /** Volltextsuche, die willhaben selbst ausführt (`keyword`). */
  keyword?: string;

  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  mileageFrom?: number;
  mileageTo?: number;

  /** Bundesland als willhaben-`areaId`; leer = ganz Österreich. */
  areaId?: string;

  /** Alternative/Ergänzung zum Bundesland: Umkreis um eine PLZ. */
  postcode?: string;
  radiusKm?: number;

  /** Eigener Filter über Titel + Beschreibung (mindestens eines muss passen). */
  includeKeywords?: string[];
  /** Eigener Filter über Titel + Beschreibung (keines darf passen). */
  excludeKeywords?: string[];
}

export interface WatcherConfig {
  version: 1;
  updatedAt: string;
  profiles: SearchProfile[];
}

/** Normalisiertes Inserat, unabhängig von der willhaben-Antwortstruktur. */
export interface Listing {
  id: string;
  title: string;
  description: string;
  priceText: string | null;
  price: number | null;
  year: number | null;
  mileage: number | null;
  postcode: string | null;
  location: string | null;
  state: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string | null;
  lat: number | null;
  lon: number | null;
  /** Entfernung zum Suchmittelpunkt in km, sofern berechenbar. */
  distanceKm?: number | null;
}

export interface ProfileRunResult {
  profileId: string;
  profileName: string;
  fetched: number;
  matched: number;
  fresh: number;
  notified: number;
  seeded: boolean;
  error?: string;
  listings?: Listing[];
}

export interface RunSummary {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  dryRun: boolean;
  trigger: "cron" | "manual";
  profiles: ProfileRunResult[];
  errors: string[];
}
