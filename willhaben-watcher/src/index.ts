import type { Env, WatcherConfig } from "./types";
import configPage from "./ui/config.html";
import { ConfigError, loadConfig, normalizeConfig, saveConfig } from "./config";
import { REGIONS } from "./regions";
import { errText, fetchNavigatorOptions, DEFAULT_USER_AGENT } from "./willhaben";
import { loadLastRun, resetSeen, runWatcher } from "./watcher";
import { sendMessage } from "./telegram";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await handleRequest(request, env, ctx);
    } catch (err) {
      console.error("Unbehandelter Fehler:", err);
      return json({ error: errText(err) }, 500);
    }
  },

  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        try {
          const config = await loadConfig(env);
          const summary = await runWatcher(env, config, { trigger: "cron" });
          console.log(
            `Cron ${event.cron}: ${summary.profiles.length} Profil(e), ` +
              `${summary.profiles.reduce((n, p) => n + p.notified, 0)} Benachrichtigung(en), ` +
              `${summary.errors.length} Fehler`,
          );
        } catch (err) {
          // Niemals werfen: ein Fehler darf den Cron nicht in eine
          // Wiederholungsschleife schicken.
          console.error("Cron-Lauf fehlgeschlagen:", errText(err));
        }
      })(),
    );
  },
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/health") return new Response("ok", { headers: { "content-type": "text/plain" } });

  if (!env.CONFIG_PASSWORD) {
    return json(
      { error: "CONFIG_PASSWORD ist nicht gesetzt. Siehe README (wrangler secret put CONFIG_PASSWORD)." },
      500,
    );
  }
  if (!isAuthorized(request, url, env)) return unauthorized();

  switch (path) {
    case "/":
      return Response.redirect(new URL(`/config${url.search}`, url).toString(), 302);

    case "/config":
      return new Response(configPage, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow",
        },
      });

    case "/api/config":
      if (request.method === "GET") {
        return json({ config: await loadConfig(env), regions: REGIONS });
      }
      if (request.method === "POST" || request.method === "PUT") {
        return await handleSaveConfig(request, env);
      }
      return methodNotAllowed("GET, POST");

    case "/api/makes":
      if (request.method !== "GET") return methodNotAllowed("GET");
      return await handleNavigator(env, "make", null);

    case "/api/models": {
      if (request.method !== "GET") return methodNotAllowed("GET");
      const makeId = url.searchParams.get("make");
      if (!makeId || !/^\d{1,10}$/.test(makeId)) {
        return json({ error: "Parameter 'make' (willhaben-Marken-ID) fehlt." }, 400);
      }
      return await handleNavigator(env, "model", makeId);
    }

    case "/api/state":
      if (request.method !== "GET") return methodNotAllowed("GET");
      return json({ lastRun: await loadLastRun(env) });

    case "/api/run":
      return await handleRun(request, url, env);

    case "/api/reset-seen": {
      if (request.method !== "POST") return methodNotAllowed("POST");
      const profileId = url.searchParams.get("profile");
      if (!profileId) return json({ error: "Parameter 'profile' fehlt." }, 400);
      const deleted = await resetSeen(env, profileId);
      return json({ ok: true, profileId, deleted });
    }

    case "/api/test-telegram": {
      if (request.method !== "POST") return methodNotAllowed("POST");
      if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
        return json({ error: "TELEGRAM_BOT_TOKEN und/oder TELEGRAM_CHAT_ID fehlen." }, 500);
      }
      try {
        await sendMessage(
          env,
          "✅ <b>willhaben-Watcher</b>\nTestnachricht – Bot-Token und Chat-ID funktionieren.",
        );
        return json({ ok: true });
      } catch (err) {
        return json({ error: errText(err) }, 502);
      }
    }

    default:
      return json({ error: `Unbekannte Route: ${path}` }, 404);
  }
}

async function handleSaveConfig(request: Request, env: Env): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Body ist kein gültiges JSON." }, 400);
  }

  let normalized: WatcherConfig;
  try {
    normalized = normalizeConfig((payload as any)?.config ?? payload);
  } catch (err) {
    if (err instanceof ConfigError) return json({ error: err.message }, 400);
    throw err;
  }

  const saved = await saveConfig(env, normalized);
  return json({ ok: true, config: saved });
}

async function handleNavigator(
  env: Env,
  navigatorId: "make" | "model",
  makeId: string | null,
): Promise<Response> {
  try {
    const options = await fetchNavigatorOptions(
      navigatorId,
      makeId,
      env.USER_AGENT?.trim() || DEFAULT_USER_AGENT,
    );
    return json({ options });
  } catch (err) {
    console.warn(`Navigator '${navigatorId}' nicht abrufbar:`, errText(err));
    return json({ error: errText(err), options: [] }, 502);
  }
}

async function handleRun(request: Request, url: URL, env: Env): Promise<Response> {
  const dryRun = ["1", "true", "yes"].includes((url.searchParams.get("dry") ?? "").toLowerCase());
  if (request.method !== "POST" && !(request.method === "GET" && dryRun)) {
    return methodNotAllowed("POST (GET nur mit ?dry=1)");
  }
  if (!dryRun && (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)) {
    return json({ error: "TELEGRAM_BOT_TOKEN und/oder TELEGRAM_CHAT_ID fehlen." }, 500);
  }

  const config = await loadConfig(env);
  const summary = await runWatcher(env, config, {
    trigger: "manual",
    dryRun,
    profileId: url.searchParams.get("profile") ?? undefined,
    includeDisabled: url.searchParams.get("all") === "1",
  });
  return json(summary);
}

/**
 * Einfacher Passwortschutz für den Solo-Betrieb: Query-Parameter `key`,
 * `Authorization: Bearer …` oder Basic-Auth (Passwort im Passwortfeld).
 */
function isAuthorized(request: Request, url: URL, env: Env): boolean {
  const expected = env.CONFIG_PASSWORD;

  const fromQuery = url.searchParams.get("key");
  if (fromQuery && timingSafeEqual(fromQuery, expected)) return true;

  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    return timingSafeEqual(header.slice(7).trim(), expected);
  }
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6).trim());
      const password = decoded.slice(decoded.indexOf(":") + 1);
      return timingSafeEqual(password, expected);
    } catch {
      return false;
    }
  }
  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  // Länge fließt in das Ergebnis ein, wird aber nicht früh abgebrochen.
  let diff = bytesA.length ^ bytesB.length;
  for (let i = 0; i < Math.max(bytesA.length, bytesB.length); i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}

function unauthorized(): Response {
  return new Response(
    JSON.stringify({ error: "Nicht autorisiert. /config?key=DEIN_PASSWORT aufrufen." }),
    {
      status: 401,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "www-authenticate": 'Basic realm="willhaben-watcher", charset="UTF-8"',
      },
    },
  );
}

function methodNotAllowed(allow: string): Response {
  return new Response(JSON.stringify({ error: `Methode nicht erlaubt. Erlaubt: ${allow}` }), {
    status: 405,
    headers: { "content-type": "application/json; charset=utf-8", allow },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
