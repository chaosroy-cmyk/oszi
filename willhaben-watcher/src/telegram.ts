import type { Env, Listing, SearchProfile } from "./types";
import { regionName } from "./regions";

const API_BASE = "https://api.telegram.org";

/** Telegram-Limits: 4096 Zeichen für Text, 1024 für Bild-Captions. */
const TEXT_LIMIT = 4096;
const CAPTION_LIMIT = 1024;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function callTelegram(
  env: Env,
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; description?: string }> {
  const response = await fetch(`${API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, ...payload }),
    signal: AbortSignal.timeout(20_000),
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    /* Antwort ohne JSON – wird unten als Fehler behandelt. */
  }

  if (!response.ok || body?.ok !== true) {
    return {
      ok: false,
      description: body?.description ?? `HTTP ${response.status} ${response.statusText}`.trim(),
    };
  }
  return { ok: true };
}

export async function sendMessage(env: Env, html: string): Promise<void> {
  const result = await callTelegram(env, "sendMessage", {
    text: truncate(html, TEXT_LIMIT),
    parse_mode: "HTML",
    disable_web_page_preview: false,
  });
  if (!result.ok) throw new Error(`Telegram sendMessage: ${result.description}`);
}

/**
 * Schickt das Inserat als Foto mit Bildunterschrift. Wenn Telegram das Bild
 * nicht laden kann (kommt bei willhaben-CDN gelegentlich vor), wird
 * automatisch auf eine reine Textnachricht zurückgefallen.
 */
export async function sendListing(
  env: Env,
  profile: SearchProfile,
  listing: Listing,
): Promise<void> {
  const caption = formatListing(profile, listing);

  if (listing.imageUrl) {
    const photo = await callTelegram(env, "sendPhoto", {
      photo: listing.imageUrl,
      caption: truncate(caption, CAPTION_LIMIT),
      parse_mode: "HTML",
    });
    if (photo.ok) return;
    console.warn(`sendPhoto fehlgeschlagen (${photo.description}) – Fallback auf sendMessage`);
  }

  await sendMessage(env, caption);
}

export function formatListing(profile: SearchProfile, listing: Listing): string {
  const lines: string[] = [];
  lines.push(`🚗 <b>${escapeHtml(listing.title)}</b>`);

  const price = listing.priceText ?? (listing.price ? formatEuro(listing.price) : null);
  if (price) lines.push(`💰 ${escapeHtml(price)}`);

  const specs: string[] = [];
  if (listing.year) specs.push(`BJ ${listing.year}`);
  if (listing.mileage !== null) specs.push(`${formatNumber(listing.mileage)} km`);
  if (specs.length) lines.push(`📋 ${escapeHtml(specs.join(" · "))}`);

  const place = [listing.postcode, listing.location].filter(Boolean).join(" ");
  const placeParts = [place || regionName(profile.areaId)];
  if (typeof listing.distanceKm === "number") {
    placeParts.push(`${Math.round(listing.distanceKm)} km entfernt`);
  }
  lines.push(`📍 ${escapeHtml(placeParts.filter(Boolean).join(" · "))}`);

  lines.push("");
  lines.push(`🔗 <a href="${escapeHtml(listing.url)}">Inserat öffnen</a>`);
  lines.push(`<i>Profil: ${escapeHtml(profile.name)}</i>`);

  return lines.join("\n");
}

function formatEuro(value: number): string {
  return `€ ${formatNumber(value)}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("de-AT");
}

function truncate(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}…`;
}

const ERROR_ALERT_KEY = "state:error-alert";

/**
 * Fehler werden geloggt, aber höchstens einmal pro 24 h nach Telegram
 * gemeldet – kein Spam, wenn willhaben länger blockt.
 */
export async function reportErrorOncePerDay(env: Env, messages: string[]): Promise<boolean> {
  if (messages.length === 0) return false;
  if (await env.WATCHER.get(ERROR_ALERT_KEY)) return false;

  // Sperre zuerst setzen: schlägt der Versand fehl, wird trotzdem nicht geflutet.
  await env.WATCHER.put(ERROR_ALERT_KEY, new Date().toISOString(), { expirationTtl: 86_400 });

  const body = [
    "⚠️ <b>willhaben-Watcher: Fehler</b>",
    "",
    ...messages.slice(0, 5).map((m) => `• ${escapeHtml(m)}`),
    "",
    "<i>Weitere Fehler werden für 24 h nicht gemeldet.</i>",
  ].join("\n");

  try {
    await sendMessage(env, body);
    return true;
  } catch (err) {
    console.error("Fehlermeldung konnte nicht gesendet werden:", err);
    return false;
  }
}
