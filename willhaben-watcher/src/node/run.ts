/**
 * Einstiegspunkt für den Betrieb außerhalb von Cloudflare – gedacht für die
 * GitHub Action in `.github/workflows/willhaben-watcher.yml`.
 *
 * Dieselbe Such-, Filter- und Telegram-Logik wie im Worker; statt Cloudflare KV
 * dient eine JSON-Datei als Gedächtnis, statt der Web-Oberfläche eine
 * bearbeitbare Datei `suchprofile.json`.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { ConfigError, normalizeConfig } from "../config";
import { runWatcher } from "../watcher";
import type { Env } from "../types";
import { FileKV } from "./file-kv";

// Läuft immer aus dem Projektverzeichnis heraus (npm-Skript bzw. GitHub Action
// mit working-directory), deshalb reicht das aktuelle Verzeichnis als Bezug.
const projectRoot = process.cwd();
const CONFIG_FILE = process.env.WATCHER_CONFIG ?? resolve(projectRoot, "suchprofile.json");
const STATE_FILE = process.env.WATCHER_STATE ?? resolve(projectRoot, "state/watcher-state.json");

function truthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "ja"].includes((value ?? "").trim().toLowerCase());
}

/** Fehler, die der Benutzer selbst verursacht hat – die sollen laut scheitern. */
class SetupError extends Error {}

async function loadProfiles() {
  let raw: string;
  try {
    raw = await readFile(CONFIG_FILE, "utf8");
  } catch {
    throw new SetupError(`Datei ${CONFIG_FILE} nicht gefunden.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new SetupError(
      `suchprofile.json ist kein gültiges JSON: ${(err as Error).message}\n` +
        "Typische Ursachen: ein Komma zu viel am Listenende, oder ein fehlendes Anführungszeichen.",
    );
  }

  try {
    return normalizeConfig(parsed);
  } catch (err) {
    if (err instanceof ConfigError) throw new SetupError(`suchprofile.json: ${err.message}`);
    throw err;
  }
}

async function main(): Promise<void> {
  const dryRun = truthy(process.env.DRY_RUN) || process.argv.includes("--dry");

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!dryRun && (!token || !chatId)) {
    throw new SetupError(
      "TELEGRAM_BOT_TOKEN und/oder TELEGRAM_CHAT_ID fehlen.\n" +
        "Im GitHub-Repository unter Settings → Secrets and variables → Actions anlegen.",
    );
  }

  const config = await loadProfiles();
  const kv = await FileKV.open(STATE_FILE);

  const env = {
    WATCHER: kv,
    TELEGRAM_BOT_TOKEN: token ?? "",
    TELEGRAM_CHAT_ID: chatId ?? "",
    CONFIG_PASSWORD: "",
    SEARCH_ROWS: process.env.SEARCH_ROWS,
    MAX_NOTIFY_PER_RUN: process.env.MAX_NOTIFY_PER_RUN,
    SEEN_TTL_DAYS: process.env.SEEN_TTL_DAYS,
    USER_AGENT: process.env.USER_AGENT,
  } as unknown as Env;

  const active = config.profiles.filter((p) => p.enabled).length;
  console.log(
    `${config.profiles.length} Suchprofil(e), davon ${active} aktiv${dryRun ? " · Testlauf" : ""}`,
  );

  const summary = await runWatcher(env, config, { trigger: "cron", dryRun });

  for (const profile of summary.profiles) {
    if (profile.error) {
      console.log(`  ✖ ${profile.profileName}: ${profile.error}`);
      continue;
    }
    if (profile.seeded) {
      console.log(
        `  • ${profile.profileName}: Erstlauf – ${profile.matched} Treffer als bekannt markiert`,
      );
      continue;
    }
    console.log(
      `  • ${profile.profileName}: ${profile.fetched} geladen, ${profile.matched} passend, ` +
        `${profile.fresh} neu, ${profile.notified} gesendet`,
    );
    for (const listing of profile.listings ?? []) {
      const facts = [
        listing.priceText,
        listing.year ? `BJ ${listing.year}` : null,
        typeof listing.distanceKm === "number" ? `${Math.round(listing.distanceKm)} km` : null,
      ].filter(Boolean);
      console.log(`      ${listing.title} (${facts.join(", ")})`);
    }
  }

  if (!dryRun) {
    await kv.save();
    console.log(`Stand gespeichert: ${kv.size} Einträge in ${STATE_FILE}`);
  }

  // Fehler von willhaben (403, Zeitüberschreitung) sind vorübergehend und
  // sollen den Lauf nicht rot färben – gemeldet werden sie ohnehin in Telegram,
  // höchstens einmal pro Tag.
  if (summary.errors.length > 0) {
    console.log(`::warning::${summary.errors.length} Profil(e) mit Fehler – siehe oben`);
  }
}

main().catch((err) => {
  if (err instanceof SetupError) {
    console.error(`\n✖ Einrichtungsfehler\n\n${err.message}\n`);
  } else {
    console.error("\n✖ Unerwarteter Fehler:", err);
  }
  process.exitCode = 1;
});
