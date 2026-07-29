// src/ui/config.html
var config_default = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="noindex, nofollow">\n<meta name="color-scheme" content="light dark">\n<title>willhaben-Watcher \xB7 Suchprofile</title>\n<style>\n  :root {\n    --bg: #f4f5f7;\n    --surface: #ffffff;\n    --surface-2: #eef0f4;\n    --border: #d6dae1;\n    --text: #16191d;\n    --muted: #5c646f;\n    --accent: #0b63c5;\n    --accent-text: #ffffff;\n    --ok: #10743f;\n    --warn: #8a5a00;\n    --err: #b3261e;\n    --radius: 12px;\n  }\n  @media (prefers-color-scheme: dark) {\n    :root {\n      --bg: #14171c;\n      --surface: #1c2027;\n      --surface-2: #232833;\n      --border: #333a46;\n      --text: #e9ecf1;\n      --muted: #9aa4b2;\n      --accent: #4c9bf5;\n      --accent-text: #08121f;\n      --ok: #5fd694;\n      --warn: #f0c266;\n      --err: #ff8d84;\n    }\n  }\n  * { box-sizing: border-box; }\n  body {\n    margin: 0;\n    padding: 0 0 5rem;\n    background: var(--bg);\n    color: var(--text);\n    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;\n  }\n  header {\n    position: sticky;\n    top: 0;\n    z-index: 10;\n    background: var(--surface);\n    border-bottom: 1px solid var(--border);\n    padding: .85rem 1rem;\n    display: flex;\n    flex-wrap: wrap;\n    gap: .6rem;\n    align-items: center;\n  }\n  header h1 { font-size: 1.05rem; margin: 0; flex: 1 1 auto; }\n  header h1 small { display: block; font-weight: 400; color: var(--muted); font-size: .78rem; }\n  main { max-width: 60rem; margin: 0 auto; padding: 1rem; }\n  section.card {\n    background: var(--surface);\n    border: 1px solid var(--border);\n    border-radius: var(--radius);\n    padding: 1rem;\n    margin-bottom: 1rem;\n  }\n  .profile-head {\n    display: flex;\n    flex-wrap: wrap;\n    gap: .5rem;\n    align-items: center;\n    margin-bottom: .9rem;\n  }\n  .profile-head input[type=text].name {\n    flex: 1 1 12rem;\n    font-weight: 600;\n    font-size: 1rem;\n  }\n  .grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));\n    gap: .75rem;\n  }\n  .grid .wide { grid-column: 1 / -1; }\n  label { display: block; font-size: .78rem; color: var(--muted); margin-bottom: .2rem; }\n  input, select, button, textarea {\n    font: inherit;\n    color: inherit;\n    border-radius: 8px;\n    border: 1px solid var(--border);\n    background: var(--surface-2);\n    padding: .45rem .55rem;\n    width: 100%;\n  }\n  input:focus-visible, select:focus-visible, button:focus-visible, textarea:focus-visible {\n    outline: 2px solid var(--accent);\n    outline-offset: 1px;\n  }\n  button {\n    width: auto;\n    cursor: pointer;\n    background: var(--surface-2);\n    white-space: nowrap;\n  }\n  button:hover:not(:disabled) { border-color: var(--accent); }\n  button:disabled { opacity: .55; cursor: progress; }\n  button.primary { background: var(--accent); color: var(--accent-text); border-color: var(--accent); font-weight: 600; }\n  button.danger { color: var(--err); }\n  .switch { display: flex; align-items: center; gap: .35rem; font-size: .85rem; white-space: nowrap; }\n  .switch input { width: auto; }\n  .row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }\n  .spacer { flex: 1 1 auto; }\n  .hint { color: var(--muted); font-size: .78rem; margin: .35rem 0 0; }\n  .badge {\n    font-size: .72rem;\n    padding: .1rem .45rem;\n    border-radius: 999px;\n    border: 1px solid var(--border);\n    color: var(--muted);\n  }\n  #toast {\n    position: fixed;\n    left: 50%;\n    bottom: 1.2rem;\n    transform: translate(-50%, 150%);\n    background: var(--surface);\n    border: 1px solid var(--border);\n    border-left: 4px solid var(--accent);\n    border-radius: 8px;\n    padding: .6rem .9rem;\n    max-width: min(38rem, 92vw);\n    box-shadow: 0 8px 24px rgb(0 0 0 / .22);\n    transition: transform .22s ease;\n    z-index: 50;\n  }\n  #toast.show { transform: translate(-50%, 0); }\n  #toast.err { border-left-color: var(--err); }\n  #toast.ok { border-left-color: var(--ok); }\n  .results { margin-top: .8rem; border-top: 1px dashed var(--border); padding-top: .7rem; }\n  .results ol { margin: .4rem 0 0; padding-left: 1.2rem; }\n  .results li { margin-bottom: .3rem; font-size: .88rem; }\n  .results a { color: var(--accent); }\n  pre {\n    background: var(--surface-2);\n    border: 1px solid var(--border);\n    border-radius: 8px;\n    padding: .6rem;\n    overflow-x: auto;\n    font-size: .78rem;\n    margin: 0;\n  }\n  .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .5rem; }\n  .status-grid div { background: var(--surface-2); border-radius: 8px; padding: .5rem .6rem; }\n  .status-grid strong { display: block; font-size: 1.15rem; }\n  .status-grid span { font-size: .75rem; color: var(--muted); }\n  .err-text { color: var(--err); }\n</style>\n</head>\n<body>\n<header>\n  <h1>willhaben-Watcher <small id="subtitle">Suchprofile werden geladen \u2026</small></h1>\n  <button id="btn-add">+ Profil</button>\n  <button id="btn-telegram">Telegram testen</button>\n  <button id="btn-run">Alle jetzt ausf\xFChren</button>\n  <button id="btn-save" class="primary">Speichern</button>\n</header>\n\n<main>\n  <section class="card" id="status-card">\n    <div class="row">\n      <strong>Letzter Lauf</strong>\n      <span class="spacer"></span>\n      <button id="btn-refresh">Aktualisieren</button>\n    </div>\n    <p class="hint" id="status-text">wird geladen \u2026</p>\n    <div class="status-grid" id="status-grid" hidden></div>\n  </section>\n\n  <div id="profiles"></div>\n\n  <section class="card">\n    <strong>Hinweise</strong>\n    <p class="hint">\n      Der Cron-Job l\xE4uft alle 15 Minuten und liest die Profile bei jedem Lauf frisch aus KV \u2013\n      \xC4nderungen hier wirken also ohne erneutes Deployment.\n      Beim allerersten Lauf eines Profils werden alle aktuellen Treffer stillschweigend als\n      \u201Ebekannt\u201C markiert; gemeldet wird erst, was danach neu dazukommt.\n      Mit \u201EDuplikate zur\xFCcksetzen\u201C wird dieser Zustand verworfen (n\xE4chster Lauf markiert erneut neu).\n      Das Tool ist f\xFCr den privaten Gebrauch gedacht \u2013 bitte keine k\xFCrzeren Intervalle einstellen.\n    </p>\n  </section>\n</main>\n\n<div id="toast" role="status" aria-live="polite" hidden></div>\n\n<template id="profile-template">\n  <section class="card profile">\n    <div class="profile-head">\n      <label class="switch"><input type="checkbox" data-field="enabled"> aktiv</label>\n      <input type="text" class="name" data-field="name" placeholder="Profilname" maxlength="80">\n      <span class="badge" data-role="id"></span>\n      <button data-action="test">Testlauf</button>\n      <button data-action="run">Jetzt ausf\xFChren</button>\n      <button data-action="reset">Duplikate zur\xFCcksetzen</button>\n      <button data-action="delete" class="danger">L\xF6schen</button>\n    </div>\n    <div class="grid">\n      <div>\n        <label>Marke</label>\n        <select data-field="makeId"><option value="">alle Marken</option></select>\n      </div>\n      <div>\n        <label>Modell</label>\n        <select data-field="modelId"><option value="">alle Modelle</option></select>\n      </div>\n      <div>\n        <label>Bundesland</label>\n        <select data-field="areaId"></select>\n      </div>\n      <div>\n        <label>PLZ (Umkreis-Mittelpunkt)</label>\n        <input type="text" inputmode="numeric" pattern="\\d{4}" maxlength="4" data-field="postcode" placeholder="z. B. 5020">\n      </div>\n      <div>\n        <label>Umkreis (km)</label>\n        <input type="number" min="1" max="1000" step="1" data-field="radiusKm" placeholder="z. B. 50">\n      </div>\n      <div>\n        <label>Preis von (\u20AC)</label>\n        <input type="number" min="0" step="100" data-field="priceFrom">\n      </div>\n      <div>\n        <label>Preis bis (\u20AC)</label>\n        <input type="number" min="0" step="100" data-field="priceTo" placeholder="z. B. 8000">\n      </div>\n      <div>\n        <label>Baujahr von</label>\n        <input type="number" min="1900" max="2100" step="1" data-field="yearFrom" placeholder="z. B. 2010">\n      </div>\n      <div>\n        <label>Baujahr bis</label>\n        <input type="number" min="1900" max="2100" step="1" data-field="yearTo">\n      </div>\n      <div>\n        <label>Kilometerstand max.</label>\n        <input type="number" min="0" step="1000" data-field="mileageTo" placeholder="z. B. 300000">\n      </div>\n      <div class="wide">\n        <label>Suchbegriff (wird von willhaben selbst gesucht, optional)</label>\n        <input type="text" data-field="keyword" maxlength="120" placeholder="z. B. S-Line">\n      </div>\n      <div class="wide">\n        <label>Stichw\xF6rter \u2013 mindestens eines muss in Titel/Beschreibung vorkommen (kommagetrennt)</label>\n        <input type="text" data-field="includeKeywords" placeholder="Getriebeschaden, Bastler, Defekt">\n      </div>\n      <div class="wide">\n        <label>Ausschluss-Stichw\xF6rter \u2013 keines darf vorkommen (kommagetrennt)</label>\n        <input type="text" data-field="excludeKeywords" placeholder="Export, Unfall">\n      </div>\n    </div>\n    <p class="hint" data-role="hint"></p>\n    <div class="results" data-role="results" hidden></div>\n  </section>\n</template>\n\n<script>\n(() => {\n  "use strict";\n\n  // Bundesland-IDs von willhaben. Der Server schickt dieselbe Liste mit,\n  // diese Kopie h\xE4lt die Seite auch ohne API-Antwort bedienbar.\n  const FALLBACK_REGIONS = [\n    { id: "", name: "ganz \xD6sterreich" },\n    { id: "1", name: "Burgenland" },\n    { id: "2", name: "K\xE4rnten" },\n    { id: "3", name: "Nieder\xF6sterreich" },\n    { id: "4", name: "Ober\xF6sterreich" },\n    { id: "5", name: "Salzburg" },\n    { id: "6", name: "Steiermark" },\n    { id: "7", name: "Tirol" },\n    { id: "8", name: "Vorarlberg" },\n    { id: "900", name: "Wien" },\n    { id: "22000", name: "andere L\xE4nder" },\n  ];\n\n  const NUMBER_FIELDS = ["priceFrom", "priceTo", "yearFrom", "yearTo", "mileageFrom", "mileageTo", "radiusKm"];\n  const LIST_FIELDS = ["includeKeywords", "excludeKeywords"];\n\n  const state = {\n    profiles: [],\n    regions: FALLBACK_REGIONS,\n    makes: [],\n    modelsByMake: new Map(),\n    key: resolveKey(),\n    dirty: false,\n  };\n\n  const els = {\n    profiles: document.getElementById("profiles"),\n    template: document.getElementById("profile-template"),\n    subtitle: document.getElementById("subtitle"),\n    statusText: document.getElementById("status-text"),\n    statusGrid: document.getElementById("status-grid"),\n    toast: document.getElementById("toast"),\n  };\n\n  function resolveKey() {\n    const fromUrl = new URLSearchParams(location.search).get("key");\n    if (fromUrl) {\n      try { sessionStorage.setItem("wh-key", fromUrl); } catch { /* privater Modus */ }\n      return fromUrl;\n    }\n    try { return sessionStorage.getItem("wh-key") || ""; } catch { return ""; }\n  }\n\n  function api(path, options = {}) {\n    const url = new URL(path, location.origin);\n    if (state.key) url.searchParams.set("key", state.key);\n    return fetch(url, { credentials: "same-origin", ...options }).then(async (res) => {\n      const body = await res.json().catch(() => ({}));\n      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);\n      return body;\n    });\n  }\n\n  let toastTimer = 0;\n  function toast(message, kind = "") {\n    els.toast.textContent = message;\n    els.toast.className = kind;\n    els.toast.hidden = false;\n    requestAnimationFrame(() => els.toast.classList.add("show"));\n    clearTimeout(toastTimer);\n    toastTimer = setTimeout(() => els.toast.classList.remove("show"), kind === "err" ? 9000 : 4000);\n  }\n\n  async function busy(button, fn) {\n    const buttons = [...document.querySelectorAll("button")];\n    buttons.forEach((b) => (b.disabled = true));\n    try {\n      return await fn();\n    } catch (err) {\n      toast(err.message || String(err), "err");\n      return null;\n    } finally {\n      buttons.forEach((b) => (b.disabled = false));\n    }\n  }\n\n  function makeId() {\n    return `profil-${Math.random().toString(36).slice(2, 8)}`;\n  }\n\n  function emptyProfile() {\n    return {\n      id: makeId(),\n      name: "Neue Suche",\n      enabled: true,\n      areaId: "",\n      includeKeywords: [],\n      excludeKeywords: [],\n    };\n  }\n\n  function fillSelect(select, options, selected, placeholder) {\n    select.textContent = "";\n    if (placeholder !== undefined) select.append(new Option(placeholder, ""));\n    for (const option of options) {\n      select.append(new Option(option.label ?? option.name, option.id));\n    }\n    select.value = selected ?? "";\n    // Wert (noch) nicht in der Liste: als Platzhalter erg\xE4nzen, damit er nicht verloren geht.\n    if (selected && select.value !== selected) {\n      select.append(new Option(`ID ${selected}`, selected));\n      select.value = selected;\n    }\n  }\n\n  async function loadModels(makeIdValue) {\n    if (!makeIdValue) return [];\n    if (state.modelsByMake.has(makeIdValue)) return state.modelsByMake.get(makeIdValue);\n    const body = await api(`/api/models?make=${encodeURIComponent(makeIdValue)}`).catch((err) => {\n      toast(`Modelle nicht abrufbar: ${err.message}`, "err");\n      return { options: [] };\n    });\n    state.modelsByMake.set(makeIdValue, body.options || []);\n    return body.options || [];\n  }\n\n  function renderProfiles() {\n    els.profiles.textContent = "";\n    for (const profile of state.profiles) els.profiles.append(renderProfile(profile));\n    els.subtitle.textContent =\n      `${state.profiles.length} Profil(e), ${state.profiles.filter((p) => p.enabled).length} aktiv` +\n      (state.dirty ? " \xB7 ungespeicherte \xC4nderungen" : "");\n  }\n\n  function renderProfile(profile) {\n    const node = els.template.content.firstElementChild.cloneNode(true);\n    node.dataset.id = profile.id;\n    node.querySelector(\'[data-role="id"]\').textContent = profile.id;\n\n    const fields = node.querySelectorAll("[data-field]");\n    for (const field of fields) {\n      const name = field.dataset.field;\n      const value = profile[name];\n      if (field.type === "checkbox") field.checked = value !== false;\n      else if (LIST_FIELDS.includes(name)) field.value = (value || []).join(", ");\n      else field.value = value === undefined || value === null ? "" : value;\n\n      field.addEventListener("change", () => {\n        applyField(profile, name, field);\n        state.dirty = true;\n        els.subtitle.textContent = `${state.profiles.length} Profil(e) \xB7 ungespeicherte \xC4nderungen`;\n      });\n    }\n\n    const makeSelect = node.querySelector(\'[data-field="makeId"]\');\n    const modelSelect = node.querySelector(\'[data-field="modelId"]\');\n    const areaSelect = node.querySelector(\'[data-field="areaId"]\');\n\n    fillSelect(areaSelect, state.regions, profile.areaId || "");\n    fillSelect(makeSelect, state.makes, profile.makeId || "", "alle Marken");\n    loadModels(profile.makeId).then((models) =>\n      fillSelect(modelSelect, models, profile.modelId || "", "alle Modelle"),\n    );\n\n    makeSelect.addEventListener("change", async () => {\n      profile.makeLabel = makeSelect.selectedOptions[0]?.text || undefined;\n      profile.modelId = undefined;\n      profile.modelLabel = undefined;\n      fillSelect(modelSelect, await loadModels(profile.makeId), "", "alle Modelle");\n    });\n    modelSelect.addEventListener("change", () => {\n      profile.modelLabel = modelSelect.selectedOptions[0]?.text || undefined;\n    });\n\n    node.querySelector(\'[data-action="delete"]\').addEventListener("click", () => {\n      if (!confirm(`Profil "${profile.name}" l\xF6schen?`)) return;\n      state.profiles = state.profiles.filter((p) => p !== profile);\n      state.dirty = true;\n      renderProfiles();\n    });\n\n    node.querySelector(\'[data-action="test"]\').addEventListener("click", (event) =>\n      busy(event.target, () => runProfile(profile, node, true)),\n    );\n    node.querySelector(\'[data-action="run"]\').addEventListener("click", (event) =>\n      busy(event.target, () => runProfile(profile, node, false)),\n    );\n    node.querySelector(\'[data-action="reset"]\').addEventListener("click", (event) =>\n      busy(event.target, async () => {\n        if (!confirm(`Duplikatserkennung f\xFCr "${profile.name}" zur\xFCcksetzen?`)) return;\n        const body = await api(`/api/reset-seen?profile=${encodeURIComponent(profile.id)}`, { method: "POST" });\n        toast(`${body.deleted} gemerkte Inserate gel\xF6scht.`, "ok");\n      }),\n    );\n\n    updateHint(profile, node);\n    return node;\n  }\n\n  function applyField(profile, name, field) {\n    if (field.type === "checkbox") {\n      profile[name] = field.checked;\n    } else if (NUMBER_FIELDS.includes(name)) {\n      const n = Number.parseInt(field.value, 10);\n      profile[name] = Number.isFinite(n) ? n : undefined;\n    } else if (LIST_FIELDS.includes(name)) {\n      profile[name] = field.value.split(",").map((s) => s.trim()).filter(Boolean);\n    } else {\n      profile[name] = field.value.trim() || undefined;\n    }\n    updateHint(profile, field.closest(".profile"));\n  }\n\n  function updateHint(profile, node) {\n    const parts = [];\n    parts.push(profile.makeLabel || (profile.makeId ? `Marke ${profile.makeId}` : "alle Marken"));\n    if (profile.modelLabel || profile.modelId) parts.push(profile.modelLabel || profile.modelId);\n    if (profile.priceTo) parts.push(`bis \u20AC ${profile.priceTo.toLocaleString("de-AT")}`);\n    if (profile.yearFrom) parts.push(`ab BJ ${profile.yearFrom}`);\n    if (profile.mileageTo) parts.push(`max. ${profile.mileageTo.toLocaleString("de-AT")} km`);\n    if (profile.postcode && profile.radiusKm) parts.push(`${profile.radiusKm} km um ${profile.postcode}`);\n    const region = state.regions.find((r) => r.id === (profile.areaId || ""));\n    if (region && region.id) parts.push(region.name);\n    if (profile.includeKeywords?.length) parts.push(`Stichw\xF6rter: ${profile.includeKeywords.join(", ")}`);\n    node.querySelector(\'[data-role="hint"]\').textContent = parts.join(" \xB7 ");\n  }\n\n  async function runProfile(profile, node, dryRun) {\n    if (state.dirty) {\n      toast("Erst speichern \u2013 ausgef\xFChrt wird immer der gespeicherte Stand.", "err");\n      return;\n    }\n    const query = new URLSearchParams({ profile: profile.id, all: "1" });\n    if (dryRun) query.set("dry", "1");\n    const summary = await api(`/api/run?${query}`, { method: "POST" });\n    showResults(node, summary.profiles?.[0], dryRun);\n  }\n\n  function showResults(node, result, dryRun) {\n    const box = node.querySelector(\'[data-role="results"]\');\n    box.textContent = "";\n    box.hidden = false;\n\n    if (!result) {\n      box.append(el("p", "Kein Ergebnis \u2013 Profil nicht gefunden."));\n      return;\n    }\n    if (result.error) {\n      box.append(el("p", `Fehler: ${result.error}`, "err-text"));\n      return;\n    }\n\n    const head = dryRun\n      ? `Testlauf: ${result.fetched} Inserate geladen, ${result.matched} nach Filtern \xFCbrig (nichts gesendet, nichts gemerkt).`\n      : result.seeded\n        ? `Erstlauf: ${result.matched} Treffer als bekannt markiert \u2013 ab jetzt wird nur Neues gemeldet.`\n        : `${result.fetched} geladen \xB7 ${result.matched} passend \xB7 ${result.fresh} neu \xB7 ${result.notified} gesendet.`;\n    box.append(el("p", head));\n\n    const listings = result.listings || [];\n    if (listings.length === 0) return;\n\n    const list = document.createElement("ol");\n    for (const listing of listings.slice(0, 25)) {\n      const li = document.createElement("li");\n      const link = document.createElement("a");\n      link.href = listing.url;\n      link.target = "_blank";\n      link.rel = "noopener noreferrer";\n      link.textContent = listing.title;\n      li.append(link);\n      const facts = [\n        listing.priceText,\n        listing.year ? `BJ ${listing.year}` : null,\n        listing.mileage !== null ? `${listing.mileage.toLocaleString("de-AT")} km` : null,\n        [listing.postcode, listing.location].filter(Boolean).join(" ") || null,\n        typeof listing.distanceKm === "number" ? `${Math.round(listing.distanceKm)} km entfernt` : null,\n      ].filter(Boolean);\n      if (facts.length) li.append(` \u2014 ${facts.join(" \xB7 ")}`);\n      list.append(li);\n    }\n    box.append(list);\n    if (listings.length > 25) box.append(el("p", `\u2026 und ${listings.length - 25} weitere.`, "hint"));\n  }\n\n  function el(tag, text, className) {\n    const node = document.createElement(tag);\n    node.textContent = text;\n    if (className) node.className = className;\n    return node;\n  }\n\n  function renderStatus(lastRun) {\n    if (!lastRun) {\n      els.statusText.textContent = "Noch kein Lauf aufgezeichnet.";\n      els.statusGrid.hidden = true;\n      return;\n    }\n    const when = new Date(lastRun.finishedAt);\n    els.statusText.textContent =\n      `${when.toLocaleString("de-AT")} \xB7 ${lastRun.trigger === "cron" ? "Cron" : "manuell"} \xB7 ` +\n      `${Math.round(lastRun.durationMs / 100) / 10} s` +\n      (lastRun.errors?.length ? ` \xB7 ${lastRun.errors.length} Fehler` : "");\n\n    els.statusGrid.textContent = "";\n    els.statusGrid.hidden = false;\n    for (const profile of lastRun.profiles || []) {\n      const box = document.createElement("div");\n      box.append(el("strong", profile.error ? "Fehler" : `${profile.notified}`));\n      box.append(\n        el(\n          "span",\n          profile.error\n            ? `${profile.profileName}: ${profile.error}`\n            : `${profile.profileName} \xB7 ${profile.matched} passend, ${profile.fresh} neu`,\n        ),\n      );\n      if (profile.error) box.classList.add("err-text");\n      els.statusGrid.append(box);\n    }\n  }\n\n  async function loadAll() {\n    const [configBody, makesBody, stateBody] = await Promise.all([\n      api("/api/config"),\n      api("/api/makes").catch(() => ({ options: [] })),\n      api("/api/state").catch(() => ({ lastRun: null })),\n    ]);\n    state.regions = configBody.regions?.length ? configBody.regions : FALLBACK_REGIONS;\n    state.profiles = configBody.config?.profiles ?? [];\n    state.makes = makesBody.options ?? [];\n    if (state.makes.length === 0) toast("Markenliste nicht abrufbar \u2013 IDs bleiben erhalten.", "err");\n    state.dirty = false;\n    renderProfiles();\n    renderStatus(stateBody.lastRun);\n  }\n\n  document.getElementById("btn-add").addEventListener("click", () => {\n    state.profiles.push(emptyProfile());\n    state.dirty = true;\n    renderProfiles();\n    els.profiles.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });\n  });\n\n  document.getElementById("btn-save").addEventListener("click", (event) =>\n    busy(event.target, async () => {\n      const body = await api("/api/config", {\n        method: "POST",\n        headers: { "content-type": "application/json" },\n        body: JSON.stringify({ config: { version: 1, profiles: state.profiles } }),\n      });\n      state.profiles = body.config.profiles;\n      state.dirty = false;\n      renderProfiles();\n      toast("Gespeichert. Der n\xE4chste Cron-Lauf verwendet die neuen Kriterien.", "ok");\n    }),\n  );\n\n  document.getElementById("btn-run").addEventListener("click", (event) =>\n    busy(event.target, async () => {\n      if (state.dirty && !confirm("Es gibt ungespeicherte \xC4nderungen. Trotzdem gespeicherten Stand ausf\xFChren?")) return;\n      const summary = await api("/api/run", { method: "POST" });\n      renderStatus(summary);\n      const sent = (summary.profiles || []).reduce((n, p) => n + p.notified, 0);\n      toast(`Lauf fertig: ${sent} Benachrichtigung(en), ${summary.errors.length} Fehler.`, summary.errors.length ? "err" : "ok");\n    }),\n  );\n\n  document.getElementById("btn-telegram").addEventListener("click", (event) =>\n    busy(event.target, async () => {\n      await api("/api/test-telegram", { method: "POST" });\n      toast("Testnachricht verschickt \u2013 schau in Telegram.", "ok");\n    }),\n  );\n\n  document.getElementById("btn-refresh").addEventListener("click", (event) =>\n    busy(event.target, async () => renderStatus((await api("/api/state")).lastRun)),\n  );\n\n  window.addEventListener("beforeunload", (event) => {\n    if (!state.dirty) return;\n    event.preventDefault();\n    event.returnValue = "";\n  });\n\n  busy(null, loadAll);\n})();\n<\/script>\n</body>\n</html>\n';

// src/regions.ts
var REGIONS = [
  { id: "", name: "ganz \xD6sterreich" },
  { id: "1", name: "Burgenland" },
  { id: "2", name: "K\xE4rnten" },
  { id: "3", name: "Nieder\xF6sterreich" },
  { id: "4", name: "Ober\xF6sterreich" },
  { id: "5", name: "Salzburg" },
  { id: "6", name: "Steiermark" },
  { id: "7", name: "Tirol" },
  { id: "8", name: "Vorarlberg" },
  { id: "900", name: "Wien" },
  { id: "22000", name: "andere L\xE4nder" }
];
var BY_ID = new Map(REGIONS.map((r) => [r.id, r]));
function regionName(areaId) {
  if (!areaId) return "ganz \xD6sterreich";
  return BY_ID.get(areaId)?.name ?? `Region ${areaId}`;
}
function isKnownRegion(areaId) {
  return BY_ID.has(areaId);
}

// src/config.ts
var CONFIG_KEY = "config:v1";
function defaultConfig() {
  return {
    version: 1,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    profiles: [
      {
        id: "q7-guenstig",
        name: "Q7 g\xFCnstig",
        enabled: true,
        makeId: "1003",
        makeLabel: "Audi",
        modelId: "1031",
        modelLabel: "Q7",
        priceTo: 8e3,
        yearFrom: 2010,
        postcode: "5020",
        radiusKm: 50,
        includeKeywords: [],
        excludeKeywords: []
      },
      {
        id: "q7-getriebeschaden",
        name: "Q7 Getriebeschaden",
        enabled: false,
        makeId: "1003",
        makeLabel: "Audi",
        modelId: "1031",
        modelLabel: "Q7",
        priceTo: 8e3,
        yearFrom: 2010,
        postcode: "5020",
        radiusKm: 50,
        includeKeywords: ["Getriebeschaden", "Bastler", "Reparatur", "Defekt", "Schaden"],
        excludeKeywords: []
      }
    ]
  };
}
async function loadConfig(env) {
  const raw = await env.WATCHER.get(CONFIG_KEY, "json");
  if (!raw) {
    const fresh = defaultConfig();
    await saveConfig(env, fresh);
    return fresh;
  }
  return normalizeConfig(raw);
}
async function saveConfig(env, config) {
  const normalized = { ...normalizeConfig(config), updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  await env.WATCHER.put(CONFIG_KEY, JSON.stringify(normalized));
  return normalized;
}
var ConfigError = class extends Error {
};
function normalizeConfig(input) {
  const source = input;
  const rawProfiles = Array.isArray(source?.profiles) ? source.profiles : [];
  if (rawProfiles.length > 25) {
    throw new ConfigError("Maximal 25 Suchprofile m\xF6glich.");
  }
  const seenIds = /* @__PURE__ */ new Set();
  const profiles = rawProfiles.map((entry, index) => {
    const profile = normalizeProfile(entry, index);
    if (seenIds.has(profile.id)) {
      throw new ConfigError(`Doppelte Profil-ID: ${profile.id}`);
    }
    seenIds.add(profile.id);
    return profile;
  });
  return { version: 1, updatedAt: (/* @__PURE__ */ new Date()).toISOString(), profiles };
}
function normalizeProfile(entry, index) {
  if (!entry || typeof entry !== "object") {
    throw new ConfigError(`Profil ${index + 1} ist kein Objekt.`);
  }
  const p = entry;
  const name = str(p.name)?.slice(0, 80) || `Suche ${index + 1}`;
  const id = (str(p.id) || slugify(name) || `profil-${index + 1}`).slice(0, 60);
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) {
    throw new ConfigError(`Ung\xFCltige Profil-ID "${id}" (nur Buchstaben, Ziffern, - und _).`);
  }
  const areaId = str(p.areaId) ?? "";
  if (areaId && !isKnownRegion(areaId)) {
    throw new ConfigError(`Unbekanntes Bundesland (areaId=${areaId}) in Profil "${name}".`);
  }
  const postcode = str(p.postcode) ?? "";
  if (postcode && !/^\d{4}$/.test(postcode)) {
    throw new ConfigError(`PLZ "${postcode}" in Profil "${name}" muss vierstellig sein.`);
  }
  const priceFrom = num(p.priceFrom, 0, 1e7);
  const priceTo = num(p.priceTo, 0, 1e7);
  if (priceFrom !== void 0 && priceTo !== void 0 && priceFrom > priceTo) {
    throw new ConfigError(`Preis von/bis vertauscht in Profil "${name}".`);
  }
  const yearFrom = num(p.yearFrom, 1900, 2100);
  const yearTo = num(p.yearTo, 1900, 2100);
  if (yearFrom !== void 0 && yearTo !== void 0 && yearFrom > yearTo) {
    throw new ConfigError(`Baujahr von/bis vertauscht in Profil "${name}".`);
  }
  const mileageFrom = num(p.mileageFrom, 0, 2e6);
  const mileageTo = num(p.mileageTo, 0, 2e6);
  if (mileageFrom !== void 0 && mileageTo !== void 0 && mileageFrom > mileageTo) {
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
    areaId: areaId || void 0,
    postcode: postcode || void 0,
    radiusKm: num(p.radiusKm, 1, 1e3),
    includeKeywords: keywordList(p.includeKeywords),
    excludeKeywords: keywordList(p.excludeKeywords)
  };
}
function str(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed === "" ? void 0 : trimmed;
}
function digits(value) {
  const s = str(value);
  if (!s) return void 0;
  if (!/^\d{1,10}$/.test(s)) throw new ConfigError(`Ung\xFCltige willhaben-ID: ${s}`);
  return s;
}
function num(value, min, max) {
  if (value === null || value === void 0 || value === "") return void 0;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return void 0;
  const rounded = Math.round(n);
  if (rounded < min || rounded > max) {
    throw new ConfigError(`Wert ${rounded} liegt au\xDFerhalb von ${min}\u2013${max}.`);
  }
  return rounded;
}
function keywordList(value) {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const cleaned = source.map((v) => String(v).trim()).filter((v) => v.length > 0).slice(0, 40).map((v) => v.slice(0, 60));
  return [...new Set(cleaned)];
}
function slugify(value) {
  return value.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

// src/plz-data.ts
var PLZ_RECORD_LENGTH = 16;
var PLZ_PACKED = "10004820851637211004482085163721100648208516372110104820851637211011482085163721101548208516372110204820851637211021482085163721102448203716423210254820371642321029482037164232103048208516372110314820851637211032481938163961103548193816396110374819381639611038481938163961104048192616370410414820851637211042481926163704104348192616370410454819261637041050482085163721105148208516372110534818681635591060482085163721106148208516372110634820851637211065481948163498107048208516372110714820851637211072482025163470108048212416345510814821051635881082482110163478109048223216355110914821221636781092482228163565109548222816356510974822281635651100482085163721110148208516372111034815211638761104481521163876110548152116387611064815211638761107481521163876110848152116387611094815211638761110482085163721111148208516372111144816401644631115481640164463112048208516372111214820851637211122481705163223112448170516322311254817051632231127481705163223112848170516322311304820851637211131482085163721113248177316245611344817731624561136481773162456114048226416171711414821451630531142482210162415114348221016241511474822101624151148482210162415115048196016318311514820541635861152481955163261115348195516326111564819551632611160482167163000116148210516354111634821541629961165482154162996116648215416299611704820851637211171482085163721117248233716290211804820851637211181482085163721118248235516319011834823551631901190482085163721119148208516372111924825901633371193482590163337119548259016333711964825901633371200482428163755120148215316372812034824021637731205482402163773120648240216377312084824021637731210483043163614121148224516370312134828111641131215482811164113121748281116411312184828111641131219482811164113122048208516372112214820851637211222482190164950122348219016495012244821901649501225482190164950122848219016495012294821901649501230482085163721123148208516372112354814331629311236481433162931123848143316293112394814331629311254482085163721130048145516513713104820851637211400482085163721142348208516372116004820851637211610482085163721200048385416168520024850751623172003484105162524200448450016291720114844171616272013484929161260201448513516055220204857511605912022486376161373202348619416186620244867381618132031485722161833203248579316256520334862481622842034486653162312204148616716119620424863561604112051486893159450205248700016022220534871291604502054487268160617206148706316139220624871501618042063487000162333206448716716300020704876311596552073487283158996207448753416007720814878211588742082488333158584208348812515835220844877111579952091488181157329209248852215790620934879091568282094488331156000209548866115616721004835311635092102483304163777210348304316361421044838331625002105483919163140210648333116383121114840071637932112484332164154211348480416363621144847921641612115485244163593211648558416383321204837501651672122483984164785212348431116499121244848021646402125484820165048212648536116447221274843331648332130485726165659213248625016516721334865541642712134486634164933213548711116510621364872441638152141486750165500214348638416728221444864441679662145486260168284215148583316463421524861051637532153486388162999215448662816374021614871671661672162487167165833216348753716565221644876321649552165487469166337217048655616627821714869611668282172487236167220218148600016816721824858331681672183485996167733218448613216758721854860121671252191484927165743219248550016650021934859161664582201483204164503220248348216411022034837051646072211483500165333221248358716566122134836001660392214483737166360221548394116658222214841471663192222484510165908222348466116637622244849011667432225485353167483223048339216720222314833841663532232482888165667224148354816691222424838681673892243484000167000224448463916736522454846681678202251484333167833225248400016800022534835051677692261483846168334226248408416833322634846911683722264485044168790226548533216895322724856671685842273486042169047227448650016900022754869161686952276487008167960228048246116640622814824261657462282482570166311228348265416710822844825671674532285482084166984228648191816758922914824521681362292481661168668229348262216910522944822611691672295483189168453230148178916611623044815361670672305481565168063232048124616481723224810991646272325480662164425232648104916432423274808331652792331481211163404233248111716363123334811561639132334481211163404233548115616391323404809301628632344481000162833234548107016284723464809531630652349480860162892235148070516332323524804541627712353480462162955235548082816313823564808281631382361480683163561236248083916345423714808541622692372480978162348238048119416266123814815681614732384481333161500239148116516199623924809961612312393480750161754240148116716606324024810841670002403480980167885240448113016865824054812581692102410481463169450241248133317000024134810071701342421480925170639242248047317033224234801121710622424479831170031242547940617069424314808941660742432480694165796243348033316600024344800211659622435480303165547244048009616483324414801481647102442479584164250244347924716503124444795861651842445479755164805245147936516570624524798251655942453479833166500245448022216655224604802201677682462480049167131246348047616654624644805841671662465480667167833247148054316863224724807401695232473480477169432247448016716983324754801671693332481480803163861248248033316383324834795291640362484479503163955248547916716425024864790001637782490478826163548249147855816405324924785401632762493478428163102250048011916211925044798461621742505480064162130251148020016249425124799581628142513480258163051251448016316296725214799351634272522479757163219252347950016300025244795001628332525479392162572253148053616200025324804531613072533481026160369253448040616076225404796131619182542479395162218254447930816213825514793101617912552479310161791256047916316098325614789471610562563479582160948256447975616008225654800701607942571480192159967257248029915903426014788171630002602479164162636260347886916266126044785401627752620477078160705262447747716140926254772421616042630477011159839263147742815966726324767781601252640476661159459264147648015854826504768361586832651476910158180265447683315752126614777311570272662477950157497266347911415659626714767761589832673476658158263268047621215793627004781011622232703478049162320270547804916232027064780491623202707478049162320272147837016142227224781001611002723478286160921272447831116059927314778531609772732477838160488273347774415988127344776161595362751478656162043275247833816190127534787001610032754478662160531275547878516024627614785861597672763478829159663277047879115888228014776521627662802476658162868280347631316325328114763341626662812475861162591281347603616201028204771671623332821477337162453282247712116212228234771011618812824476997161557283147658116111628324765001618332833476808161977284047623316108328424758511614782851475414161649285247468216180528534749061623832860475190162738287047552416076528714751071613342872475180160260287347593016082928804761931598682881476444159050300148233916049430024820771617543003482286161544300448250516088730114820081613343012481832161266301348186216087230214817901607533031481814160538303248173915953530334815531593783034481942159482304048205015889330414822791592653042482532158594305148167815883030524813201589613053481075158599306148193615851730624819331582123071481866157502307248153015802730734812301580533074481079157607310048195915622331014820151563223104481678156404310548247415673131064817041561843107482226156272310848362315712331094820001563333110482378155544312148261315553231224829821548113123482772156014312448310415581531254830491563343130482898157061313148318315675731334834941575463134483207156997314048235315724231414825241577413142482524158126314348162515693631444813211571333150480833156072315148143715610531534798961557613160480500156197316148046515662731624804741571083163480504157422317048031215792131714798091572493172479950158101318048005815587631824798281556903183479498155544318447931015493031924792381563153193478686155968319547806915490632004814821555003202480896155095320348068215492932044803341541093205481166155329321147983715406132124795191539043213479775153182321447934715241132214788681529113222478659153740322347881415232732244782181529593231481617155911323248126015466032334809871539983240481168153359324148085315298332424803241529733243481457152935324448132215240332504811671512693251480627151422325248128815173032534819031520743254481559151855326148080815047532624804951500563263480129149440326447981315028832704800101516333281480714152234328248024515230432834796721520213291479456151271329247943115142932934789511505913294478085151958329547869615151033004811391484093304481236149440330548122914872133114812661483983312481157147748331348149414738233144813001466113321481527148249332248150214908733234819871491243324480676149320332548082215003833314801611474583332480140147437333348001614737833344790001471013335478648146761334047967314791133414794181490093342479180147901334347818114774833444783181488633345478357149823335048111214574033514805001458333352480254146018335348031714679033544805661470913355479770146313335648030114708033614806831474303362481089148027336348079414823333644805151486143365480318148062336648023614847333704816691507413371481209150533337248142315049833734816141511703374481898151224337548205715168233764815631503183380481994152131338148198915179233824820961539793383481552154054338448178015538333854818081559433386482214155042338748193015458433884819161544043390482127153263339248252615404233934817571524363394482090153300340048294516268134024830521632523404483052163252341348292916207134204832931630013421483497162747342248340616244434234832821619773424483210161772342548330116099634264832761614923430483392160495343348302016144934344828551611083435483360159202344148275815999934424831991600123443482273160032345148278815940534524829011587863454483120158055346248391615949434634840361602573464483881160846346548425015933334704843511589233471484856158752347248507215827434734851851577933474483970158625348148433315833434824847501581673483484344157808348448402315782034854842191573633491484985157493349248450015744934934846261571863494484146156882349548419415657735004842591558913502484123156318350448401615581035054840921561413506483860156563350848352415635935114837411561223512483653155407352148470215458635224850191537643524484939152689352548490815204335314854711528763532485694153485353348577515255335414844841553683542485206154745354348574715432835444858331547503550484735156668355248467315576935534852231559493561484750156750356248526415671435644855951570323571486065156656357248553515536235734862051561913580486629156366359148646215578635924866151551323593486339154668359448604815395235954869071549433601483973155172360248393215496236104840461544463611484110153929361348455615364236204836461539823621483620154427362248391715348936234842831528373631484183152150363248449115122436334845461503433641483123154038364248266815395036434832831537133644482435153072365048308815183436524823911526443653482907152565365448327615265936604821671521673661482517152092366248262415135936634829991513023664484356151552366548371115094836714821851514363672482303151624368048193815103036814820861507793683482953150534368448259915013536914822511499323701484626159821370248455616050037044850331593673710485349159424371148523715873037124855701580703713485911157654371448614915947837204855241585243721485861158644372248613415857337304864131582873741487037158570374248736115789737434866571588663744486523157286375148690615744837524872951573013753487536156403375448743615538837614871761552103762487650154828376348798815570838004873701536813804487036152955381148753115396838124880361541303813487938153780381448810815466438204885021548313822488808153966382348919915461138244889001553333830488166152903383448840215177438414877181528723842488670152653384348911415307338444895331534383851489357152407385248896315213738604885811511693861489083151607386248916715098638634896671513893871488294149926387248834215061438734887501502503874489580150568390048736715262639024876861518573903487113152071391048618315167239114852531507013912484917151562391348525015208339144852261525193920485689149710392148577114881839224864851494673923486409150262392448596415055539254847541495473931486599150596393248717615109439424874661512103943487871150587394448766815105439454876841503443950487673149637396148721715010139624875561485283970486939148685397148671714831039724862541482303973485696149522400048152514170240104833691400954016483369140095401848336914009540204830411426204021483047142680402448304714268040254830471426804027483064142861403048306414286140314830641428614032483064142861403648306414286140404835661427664041483438142661404648343814266140484834411423984050482217142328405248208814285940534818791424944055481824142099405648230914267840594827971425334060482748142495406148258414211640624826001414254063482194141834406448231114130640664825931420374070483096140102407248280614092840734829901417974074483433139461407548266813991340764827271393094077482835141452408148371713984040824837151401994083484169139028408448384313861440854845681382544090484911136938409148519113645740924853011358664100483417141909410148360614074741024832521411734111483469141451411248382914127241134842651403374114484259139837411548466213989741164849081404764120484927140096412148495513962341224852741399674131484432139429413248500213907241334847171387104134485215138742414148509713836241424849821381294143485145137556414448549713792841504857511399234151485908139449415248556113896441534862031389114154485891138430415548634813845241604864331396614161486812139149416248661313861041634870541387654164487197138248417048580614050341714853121405964172484865141234417348476514140141744844801409214175484283141336418048465314274341814846961422284182484776141897418348509014205341844854861414014190485168142895419148538614222241924849621439214193485386143811420148395514209942024841891429774203483763143409420448445314357842054841151427664209483330144167421048376114440042114840551440524212484376145075421348367414467842214829631438384222482703144660422348306114488142244834601450784225482750145037423048362014561342324838131451644240485088144829424248489014426042514854911465174252485211147926426148562814462942624861651448724263485801145760426448535014546842714850161460864272484860147147427348450914787542744840061471614280484070148273428148362614818242824834591475124283483757146616428448354314613642914847001454714292484419145443429348419414619442944844911467404300481500145000430348204814569543104824741452674311482925145861431248283714533643204826031465114322482811146865432348266114731843244830531471044331482148146414433248230814596943414823421472254342482249147477434348189414696543514820761479594352482442147781436048236914851443624827271481724363483276148227436448309014765843714831131489464372483775149171438148240514872843824823161495174391482716149444439248315914973744004802151440974401480560144125440348042714421344054806671445004407480254144433441048042714421344214800171432714431480697145338443248150014500044414804491448164442479764145140444347946114569844514800041440474452479452143587445347945214358744604793721444344461479608144357446247888814466644634788731452714464478167146333447048204414432744814823341441534482481230146254448348155714415544844812821446174490482024143781449148156614334344924815501435734493480589143931450148138714227645024814701428254511481535141876452148071614307845224806761430004523480321143396453148099814246645324804641426324533481252142269454048036414182145414799831421824542479718141547455048052914296645514800811408374552479969141096455347944214112045544792681416524560479056141223456247892614030445634789231412984564478314141572456547927214080045714780681415164572477541141864457347699614171945744771171420824575477214142775458047718914350145814771581437184582476936143433459147833214299245924792711423984593479544142457459447954114330645954800051428634596479638142751460048164814016246014816671403334602481615140192460348166714033346054816671403334606481667140333460948150014033346104816671403334611482236140252461248257514009146134821131404224614481941141029461548225314100146164816651414714618481823140164461948166714033346214809791410324622481480141816462348147713930946244813091385424625481487138672463148200113953146324819331389664633481900138401464148113114009346424807191406384643479624140255464447897613944146454787591395314650481090139012465148082113865846524807421396744653480291139867465448051713894546554798951391954656479512138917465948116713883346614802401384094662479819138217466347981913821746644794741383454671481122138338467248136113829646734814741374114674481434136894467548180513693246764818311374134680481892136406468148211613671546824815311364304690480467137407469148080213793046924810131375324693480136137539469447947113783447014822921391114702482318139320470748222213863347104824211382384712482836138164471348207713812047144817731379374715482518137452471648225113731647204828211371024721483326136746472248336713762347234840881372974724483932137882472548464513731347304833441386134731483136139214473248284913875447334836061382104741482447136662474248229113609847434822801351154751482780136257475248309513629347534827831357284754482615135186475548317113611147604835151364494761483916136468476248370513686847704836031357084771483915136097477248313613521447734835801347954774483819134667477548414813527947764842091358824777483370135101478048459313442247824842651347274783485059134686478448522213494747854855701350764786484746134773479148458013524947924847371358144793484850136244479448442313663948004800871367914801478463137667480247795413758148104790061379264812479175137546481347896313747448144789131371624816479521138366481747919813890348204771321362304821476925136146482247633513630848234759071365344824475842135345482547584213534548294771111361894830475597136451483147553713684948404801501366374841480419136237484248072413599548434808211355704844479836136813484547965913719748464803581375074847480028136565484948044813572048504800721361004851479948135519485247897913581348534783901356564854478013135313486047972913608448614794471363934863479542135652486447921313524848654785851351054866478161134274487048000113487848714803401350684872480460135420487348074113485648754808261346754880479454134929488147913713460048824786271344114890479746134212489147996913362648924802351342674893479104133392489447942313322649014809961363584902481118136869490348070113665949044807781370084906481542135565491048178113487049114823181349974912481840134713492048145213459449214820391354194922482013135968492348156213400149244812311341914925481346134888492648186313578949314816591335374932481992133594493348180813274149414820601342914942482392133663494348255413319349504822871322454951482199132720495248240013179149614825211331224962482544131501496348254113103949704823781342584971482457134650497248276813482749734827911342414974483176134428497548412613439549804834671340994981483144133890498248276213366649834829131333314984482758133748498548294213301050004771911293885010477994130440501347816713016750144779941304405016477994130440501747799413044050184780291303855020477994130440502147802413057150234781951311025025478000130667502647799413044050274779941304405033477994130440506147766713088150714779631299885072478153129904508147753613056450824776011302925083477301130516508447724212908550894772871306225090475957127051509147644612702050924755451270315093475227127629510147850213034451024789301302385110479568129356511147983412917951124799771296845113479941129111511447953712959151204802391288195121480700128277512248146212861851234819291287435124480450128818513148055312909051324808761293915133481388129621513448181612973351414804641298775142480811129910514348071813044051444813581300535145481791130362515147948112993451524801501301925161478667130667516247926713060251634801631311465164479588130719516547974313034451664801591307825201479003131114520247937213254152034794851318515204479757133026520547950013150052114800961324155212480247132987522148006313168652224805761318495223480770131391522448074213095152254804771314275230481073131508523148111413160852324804331309745233481214130795524148142213214152424811671327725251481562132692525248171913309852614816141313275270481931131268527148198613163252724818341319055273481996132420527448205813092052804822571305285282482289130280530047846113086353014785911314435302478904131774530347840713244853104784721332735311478349133848532147816213160153224781931321495323477754131714532447753113254653254783331318335330478000133000534047773813365553424772811341755350477146134703536047746613559654004768861309925411477162131192541247717113107754214769891314625422476651130900542347647613206254244766701315005425477139131907543147629913146354404759891318265441475801133491544247589813445654504747731318505451474944131667545247455913221554534745961325195500474206132226550547380413123055114740991331165521474084133167552247481113372255234753391335785524475529133605553147418513396855324744161350005541473505134322554247361013389555504739051349465552473784135556556147300013500055624721641357885563471833136000557047132813686655714715561375005572471500137833557347210513660055744717541376405575471779138122558047130113837455814707931369615582470959136318558347093913511655844715881349265585471127137426559147074913840755924705841373345600473557132184560247341113295456034727721331955611472437132018561247164313266456204732051315175621473333131166562247319013081556234732051315175630471724131061563247248613097656404711551313475645471155131347565147298813028356524736671300005660472920129222566147214412955656624728541286335671472821128277567247219012831457004733111279915710472724127598572147289912716957224728471264135723472828125813572447287512528857304728111246255731472825124258573247283312377857334726141233285741472381122771574247245112192157434722891215895751473692128000575247366712733357534739141263645754473768125958576047420612840357614740461292785771474427127421600047283311516760104726271139456013472627113945601947262711394560204724761139786021472527113967602247262711394560234726271139456024472627113945602647262711394560284726271139456029472627113945603347283311433360604728801149516063472891114626606547294811475360674729571150596068472833115333606947316711566760704726251146236071472500114500607247238311431460734724161145006074472500115000607547266011533460804723231140516082472053114151608347166711450060914723511134246092472354112992609447225711283560954722931125326100473284111639610347300011200061054736891114406108473890112645611147277811561161124729421159076113472833116000611447300011633361154728151165296116473038116450612147300011566761224730531158956123473255116334613047351711710161334729841166596134473416116792613547364611713661364732351168026138473333116833614147183311416761424716671138336143471338114501614547133311505661504708241143906151470447113509615247083311416761544707061154986156470385114813615747016711416761614723411137346162472167113833616547166511359461664714731134606167471296113298617047283011199661734724451124766175472500112834617647250011316661784726671125006179472573112112618147216711216761824723581106976183472135110231618447225411094862004739281177646210474053117975621247421211753162134744061169236215475035116059622047374511754062224736811177166230474270118878623247421611833662334744631187776234475036118890623547411111889062364740061191686240474394118941624147448111914262504746321198366252474906119772626047392411864862614738801182936262473805118389626347352211847762644733441182926265473504118661627147319511859162724728331187506273473000118667627447265611906862754729051188756276472874119344627747233311866662784721791190036280472289119116628147224612030162834721271186496284472038118754629047170911862062924717521184066293471542117754629447155611728762954711141180866300474891120617630547470112143963064750381219226311474200120218631347421712041163144745001209536320475076120356632147507612065163224751741209636323475107121191632447527712054863304757711217556332475833121667633447546012140563354758721206036336475424121032634147631112230863424765001221676343476778121944634447644712303063454766991240556346476643122368634747657212268763514751661222186352475138122994635347494612350063614742561214076362473833121333636347432112214163644745001225006365474561123330637047456612371063714741221242736372475000123833637347379212418163804752331242326382475698124559638347569812455963844758331256676385476318123927639147476312543563924749961255466393475255125979639547466712616764014726781119596402472736111610640347291411123264044727841114506405473000110833640647298211086164084729201115966410473184110921641247314911051264134731671101676414473021109718641647300010933364214728591103076422472760109832642347283310950064244726671093336425472441108792642647216710816764304724161086666432472077108645643347216710905664414714641092706444470740109695645046923011009564524696671100006456469222110172645846916710966664604724501073976462472167107833646347225410765664644727421077896465473167108333647147190910750464734714491069906474471512107469648147051710834064914719671065746492472052106960649347206210674865004713611056256511471650106079652147116710616765224708331066676524470307107459652547078810671565264707821069226527470834107040652847053910677865314705001065006532470746106495653347057110617565344704021060346541470292106051654246965210551665434688861050136544469817104399655147134110506265524712511051406553470833104556655547077810438965614701261029186562469833102500656346966710183365714712591046206572471500104000657447147910359965804713441027796591471368105070660047508110702566044746671068336610474881106878661147450010750066214741121080256622473996107378662347358410675066314741231086026632474000109167663347383310900066424738331056676644473412105366664547370110539566464735931046096647472963105956665047266710533366514730671048206652472814104272665347266510395866544726351034716655472691103501667047416710583366714744181065266672474776106090667347508410550066754749931051646677475184104631668247550010633366914757411044726700471428098429670147137509807267064714970980006707471464097774670847100809737267104716370967476712472000097667671347200309794767144716670980006719472000097331672147214409785067224722110981646723472233098341673147235809902467334725380990756741472122098534675147149409908767524712891001226754471333100833676247133310166767634720801014186764471662100664676747261710173267714711800987236773470957098652677447073909902767804708030991926781470919099138678247093709983167874696740991836791470160099860679346985810027067944696671005006800472331096000680147241709598968034723310960006805472589095966680847241709598968114723360963466812472989095786682047205709638268224722110971316824472084097000683047268909671668324729020965336833473120096604683447234809668868354728440967366836473009096748683747299709650068404733310963316841473500096167684247333109600068444735440965216845473612096869685047414209796868514742910976906854474291097690685547414309742068574743310975006858474548097765686147450209831568634743260990646866474117098933686747414109851568704737800989816874473770099149688147350409899268824735130993106883473220099891688447280309891668864731201001656888472576100920689047426409658569004752580977016901475212097655690447503109747169114752320976016912475584097834691447584509779569214748310976676922474667097500692347475709729469324751650983386933474928098797693447527609898469414746920989746942474704099477694347501409958469514745030992176952474495099887695347426710038169604748570982126961474857098212697147483109683169724747930966286973474693096516697447466709600069914735781018766992473481101714699347351310172070004784571652587001478457165252700247845716523370114778101654237012477647165138701347756916550870204769661647927021477427164937702247709716509870234776151645037024477865164546702547753716438670314778551641497032477753163950703347809416390270344781441640937035478238164130704147797516504570424777381647987051478359164804705247839416462670534788051644457061478156165662706247803416608870634783331666677064478291166196707147801216671670724775001666677081478523166233708247894216646370834791291669567091479445167315709247950116755670934796171679607100479372168554710147949016841771114799961686057121479253168690712247896916911171234788021694137131478702169754713247790316878071414785411683717142477615168002714347743916830271514772851693717152477147169224716147764016886071624776421698657163477744170329720147796616297772024778611633407203477378163380721047733316400072124772241629767221477167164167722247705216430172234765131637997301476000166200730247530816652373044751731655557311475988165598731247588916564573214757571651117322475904164653732347613216495573314760281640957332476056163841734147564416383873424753741639207343475455164462734447528416477673504751081649947361474657166165737147472616362373724751281637327373474483164152737447513916363774004731531621777410473281160840741147300016091674124725001610007420473667160333742147485116045674224735001613337423473877161105742447363216066374254738461614557431473423162238743247383716197674334737321624307434474150162598743547376716320074414744071633057442474041164029744347410716496274444742891654087451474474165076745247468316566174534747881648547461473144163010746347313216346574644730491638627471473047164410747247256316423474734721521638867474471634164277750147257016247675024726401622907503472467163359751147203616300375124716991636577521471121164592752247045416421575314724861615217532472083161717753347183316166775344715831621667535471216162535753647157116292375374716891626057540470444163268754247068616264675434708551619017544470968163005754547024716260475464705841647737550472167161000755147136016175475524720271613317553471426161778755447116716166775614699301624297562470165162086756347002516168275644703681613207571470513161200757247106616111075744708821611408000470667154500800647066715450080104708151547188011470755154823801247066715450080144708331556678015470667154500801647066715450080174706671545008019470667154500802047075515440180214706671545008025470667154500802647066715450080354706671545008036470755154401804147072515440280424707321544028043470755154401804447117615494780454713941544868046471401154188804747072715486580494706671545008050470764153605805147076415360580524706081533608053470315153732805447005115382180554700001540008056470667154500805747031515373280614718041549728062471505155121806347114415596680714699561551408072469467155184807347006015438580744704431548908075470549155493807647016315558480774700311547588081469538156004808246939715673880834689561571338091468552157404809246805515710880934680351575838101471496153595810247213515408481034714811527828111471124153159811247119815293481134709081527798114471845153031812047200015350081214721301530728122472302152604812447221215206181304727171531988131473403153634813247360715337781414695841541168142469233154373814346928715374881444698941536408151470335152998815247048815233581534716241515898160472192156077816247266115497281634729131545568164472367155667817147312315575281724732371563448181471659156583818247223915725581834724611573138184472774156969819047365815697081914732531567848192474140157176819447394215683982004709981570048211471468157577821247189215800282134716381577658221471896158447822247217015837782234724281579658224472241158812822547302915852682304728801597398232473405159711823347371615998982344739151597148240474222160593824147420016005582424744141595508243474542160632824447475316105882504739091589728251474529159120825247447015886382534745221584448254474161157986825547475315770282614710851581518262470847159084826347070815985782644712301594218265471513158944827147175716008682724719411597088273471955159530827447228116009282804704331605988282469998161148828347117616040882914714521610998292471822160984829347215216090482944725541602098295472821160204830147075115572083024705641561878311470478158222831247044615892383134702931594848321470753157283832247040015754983234703591564668324469693157433833046954915885483324699021583118333470001159219833446972415944783414693501579098342468828158124834346871015872983444688551591308345468089158753835046931016016183524697041606708353468909159784835446830415963383554678531594308361469858160078836247025816018883804694791614808382469630162121838346914816114783844687301608178385468691160389840146963115448984024692421549088403468472155112840446965315480384104689601551308411468666154527841246914615560084134686871558628421468523156780842246812515661784234675541565328424467872155905843046797315524584314681401555518432467925155388843446812015516884354676681555508441467636154348844246774215456484434674571536018444467933153919845146761715490784524672631543298453467073153942845446679515389984554668231532098461467122155778846246710115516184634667101548808472467302156127847346705715707584804672601578548481467530157157848346759515839284844673961590878490466986159979849246727915948784934677191596898501469736153390850246944415317185034690691534278504468702153902850546818015446785104689271524318511469275152477852146822515386385224681941531578523468236152508852446858115204285304682061516528541467645151878854246760415253985434676021529728544467243153095855146722915235485524668371522598553466930151339855446665715080885554671591520728561470076152876856246971615270185634698011519018564470161152146857047043915148385714707141512798572470935151155857347143915089085804704981508708581470667150833858247062715125885834700671503348584470211149557859147059215041085924711601497088593471189150420860047418015251686054745781528878607474446152933861147467115143386124751081507178614473819154078861647385015579886214753521522708622475156151613862347545115247786244754991529128625475488153427863047777015336486324771271528598634476750153333863547651015304686364762041527128641474570153611864247486415352586434746901541488644474926153923865047491615433486524749391542498653474538155144865447443915624986614753021549888662475463155228866347582815493586644759201548948665475682156367867047565315541086714751841562838672474806156994867347460215704586744751211578508680476032156790868247571615650986844761351575108685476151157755869147662915649686924766061557648693476743154819869447754915497087004737161508528704473765150914870747376515091487094737281508678712474036151313871347318214980687144730421493338715472530149020872047224114845987234724361482778724472144147903873147268414687187324727461476918733472843148675873447174614814987404718151475348741471417147608874247070014688387434712831473758750471652146603875147173314677887534720951466208754472124145794875547172014585687564720921449958761472263145698876247251114488887634729561446848764473061143756876547362614468187704733751501868772473762149782877347391214924787744740411482238775474274147439878147445714660687824747071460388783474902145377878447496814463887854742501450838786475155143616879047533314883387924738791501798793474269149825879447453615005187954752501472508800472056144500881147145814415788124708891436678813470705142744882047059414442488224701191451138831471746143467883247206014272088334712981433388841471308143086884247157514249488434718081418438844471772141126885047090114197288524710011419728853471634140882885447182613990288614710481408008862470871139769886347075013925088644696081388788900475455142923890347534014254489044758591436018911475791144449891247558314550089134758971453458920475968147684892147646714756089224766671478338923477000148000892447789315036889314766421472958932477048146391893347686614613989344774501462858940475622142385894247548814144889434751571415458950475368141134895147527414070489524749191409538953474449141331895447480813970689604746841400458961473974139765896247438913912189654741421385648966474148138163896747408813759389704740041366768971473709136805897247412313694989734739601360938974473963135925898247549914025289834755821392528984475640138526899047604213786989924763391375048993476216138335900046610313855890104662471430539020466308143340902146633014329990224662471430539023466247143053902546624714305390264662471430539027466247143053902846624714305390334662471430539034466247143053906146658614237890624666761418759063466898143412906446679414426390654658881439879071465618142232907246547814139090734658701426579074465886141854908146614614203090824661831413979100466613146363910246707314557891034672791463849111466867146468911246715014724691134665751476549121466369145398912246605214579491234657611452159125466218146611913046659414465891314661401445849132465624145121913346550314603491354649111459859141465919146446914246558414696691434656691476129150465931147926915546633814893491614656021430069162465288142410916346492414262991704651151434169171465269143019917246472214388991734653111442279181465161141657918246532214090591834653811403409184465569140408920146636014218792104663211417179212466460140897922046612814029492314664811400829232465783140078924146616813959493004677091434849311468168143173931246840514391293134678081442719314467725144658932146823014477493224690591443879323470051144028933046873214451393344689781450859335469121145366934146907614331093424685161428019343468857142074934446835714190293454686811414709346468974141414936046963514418493614698451432889362469733142243936346978214174993714675991450169372467969145678937346823214541893744687151455269375469481145318937646951414577894004684811483299402468481148329941146834714772094124687081478089413468721148934942146769514901194224674071488169423467308149368943146808914834494334676631481039441469236148607945146952714944394614692631480539462469572147974946347013114720794704670381485269472466718149365947346654014935795004661811384529501466103138558950346610313855895044660301383269507466103138558950946616713900095204666501391489521466691138640952346632013875295244661481388749530466261136875953146615213628595354659121413589536465729140436954146689913816495424672931379039543467357138708954446757613758395454681461367619546468183137817955146687213966595524670191401149554467617141544955546719314209895564675941426619560467295141037956246747714026995634679301393829564468330138655956546863913891995664672371409589570466749139910957146834014045695724686841407179580465926139196958146562713969895824655131392819583465648138903958446586313833895854656781384169586465675138016958746550413778596014654781371629602465470136504961146590913614196124661561362379613465662136173961446598013530596154662341346399620466311133412962246679013263596234661791352689624466134134258963146626513260396324664181320149633466461131515963446649513121196354666071307069640466706129992965146684012926096524668551288429653466945128281965446707012766096554670511273749701467647135846970246744613638797104668151366869711467024136368971246721013699097134671231361079714467039135747972146674713722397224666061375859751468197133238975346769013346597544676361325289761467621131931976246720113280897714674621313149772467461130805977346773613057697814675211295999782467898129144980046792113514698024680001350009805468018134458981146841113443698124686061335909813468724133234981446847913356898154689051329249816468982132602982146937513205298224698661318069831469419131034983246899713032998334686761294949841468699129359984246919612942698434697531289079844469880129922985146841013467398524687381346219853469175135127985446965513457798614692651359639862469676136334986347022813604798714684131350299872468075135891987346778913646499004683411276599903468533127130990446854112761199054684601278809906467989128381990746816112789799084681641276369909468049127392991146789012638299124677031255889913467572125283991846753912484299194675281245749920467509124090993146787512431499324681191237479941467320124813994246713612605899434670351267769951468760126879995246910812622699544687941265429961469265125166996246923612422299634691721233539971470009125382997247000412451599744701721237309981469823126287999046842812812699914682621284179992468357128497";

// src/geo.ts
function coordsForPostcode(postcode) {
  if (!postcode) return null;
  const key = postcode.trim();
  if (!/^\d{4}$/.test(key)) return null;
  let lo = 0;
  let hi = PLZ_PACKED.length / PLZ_RECORD_LENGTH - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    const offset = mid * PLZ_RECORD_LENGTH;
    const candidate = PLZ_PACKED.slice(offset, offset + 4);
    if (candidate === key) {
      return {
        lat: Number(PLZ_PACKED.slice(offset + 4, offset + 10)) / 1e4,
        lon: Number(PLZ_PACKED.slice(offset + 10, offset + 16)) / 1e4
      };
    }
    if (candidate < key) lo = mid + 1;
    else hi = mid - 1;
  }
  return null;
}
function parseCoordinates(raw) {
  if (!raw) return null;
  const [latRaw, lonRaw] = raw.split(",");
  const lat = Number.parseFloat(latRaw);
  const lon = Number.parseFloat(lonRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}
var EARTH_RADIUS_KM = 6371;
function distanceKm(a, b) {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// src/willhaben.ts
var SEARCH_URL = "https://www.willhaben.at/webapi/iad/search/atz/seo/gebrauchtwagen/auto/gebrauchtwagenboerse";
var RESULT_PAGE = "https://www.willhaben.at/iad/gebrauchtwagen/auto/gebrauchtwagenboerse";
var AD_BASE = "https://www.willhaben.at/iad/";
var IMAGE_BASE = "https://cache.willhaben.at/mmo/";
var DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
var SORT_NEWEST = "1";
var WillhabenError = class extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.name = "WillhabenError";
    this.status = status;
  }
};
function requestHeaders(userAgent) {
  return {
    accept: "application/json",
    "accept-language": "de-AT,de;q=0.9,en;q=0.6",
    "user-agent": userAgent,
    // Ohne diesen Header antwortet die API teilweise mit 403.
    "x-wh-client": "api@willhaben.at;responsive_web;server;1.0.0;desktop",
    referer: RESULT_PAGE
  };
}
function buildSearchUrl(profile, rows) {
  const params = new URLSearchParams();
  params.set("rows", String(rows));
  params.set("page", "1");
  params.set("sort", SORT_NEWEST);
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
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
async function fetchJson(url, userAgent) {
  let response;
  try {
    response = await fetch(url, {
      headers: requestHeaders(userAgent),
      signal: AbortSignal.timeout(2e4),
      cf: { cacheTtl: 0 }
    });
  } catch (err) {
    throw new WillhabenError(`Netzwerkfehler bei willhaben: ${errText(err)}`);
  }
  if (!response.ok) {
    throw new WillhabenError(
      `willhaben antwortete mit HTTP ${response.status} ${response.statusText}`.trim(),
      response.status
    );
  }
  try {
    return await response.json();
  } catch (err) {
    throw new WillhabenError(`Antwort war kein g\xFCltiges JSON: ${errText(err)}`);
  }
}
async function searchListings(profile, options) {
  const data = await fetchJson(buildSearchUrl(profile, options.rows), options.userAgent);
  const raw = data?.advertSummaryList?.advertSummary;
  if (!Array.isArray(raw)) {
    throw new WillhabenError(
      "Unerwartete Antwortstruktur: advertSummaryList.advertSummary fehlt (API vermutlich ge\xE4ndert)"
    );
  }
  const listings = [];
  for (const entry of raw) {
    const listing = toListing(entry);
    if (listing) listings.push(listing);
  }
  return listings;
}
function attributeMap(entry) {
  const map = /* @__PURE__ */ new Map();
  const list = entry?.attributes?.attribute;
  if (!Array.isArray(list)) return map;
  for (const attr of list) {
    if (attr && typeof attr.name === "string" && Array.isArray(attr.values)) {
      map.set(attr.name, attr.values.map((v) => String(v)));
    }
  }
  return map;
}
function toListing(entry) {
  const attrs = attributeMap(entry);
  const first = (name) => attrs.get(name)?.[0] ?? null;
  const id = String(entry?.id ?? first("ADID") ?? "").trim();
  if (!id) return null;
  const seoUrl = first("SEO_URL");
  const url = seoUrl ? AD_BASE + seoUrl.replace(/^\/+/, "") : `https://www.willhaben.at/iad/object?adId=${encodeURIComponent(id)}`;
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
    lon: coords?.lon ?? null
  };
}
function imageUrlFor(entry, attrs) {
  const fromList = entry?.advertImageList?.advertImage?.[0];
  const direct = fromList?.mainImageUrl ?? fromList?.referenceImageUrl;
  if (typeof direct === "string" && direct.startsWith("http")) return direct;
  const reference = attrs.get("MMO")?.[0] ?? attrs.get("ALL_IMAGE_URLS")?.[0]?.split(";")[0] ?? null;
  if (!reference) return null;
  return IMAGE_BASE + reference.replace(/^\/+/, "");
}
function toNumber(value) {
  if (value === null) return null;
  const n = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
async function fetchNavigatorOptions(navigatorId, makeId, userAgent) {
  const params = new URLSearchParams({ rows: "1", page: "1" });
  if (makeId) params.set("CAR_MODEL/MAKE", makeId);
  const data = await fetchJson(`${SEARCH_URL}?${params.toString()}`, userAgent);
  const groups = data?.navigatorGroups;
  if (!Array.isArray(groups)) {
    throw new WillhabenError("Unerwartete Antwortstruktur: navigatorGroups fehlt");
  }
  const options = /* @__PURE__ */ new Map();
  for (const group of groups) {
    for (const nav of group?.navigatorList ?? []) {
      if (nav?.id !== navigatorId) continue;
      const buckets = [
        ...(nav.groupedPossibleValues ?? []).flatMap((g) => g?.possibleValues ?? []),
        ...nav.possibleValues ?? []
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
function errText(err) {
  if (err instanceof Error) return err.message;
  return String(err);
}

// src/telegram.ts
var API_BASE = "https://api.telegram.org";
var TEXT_LIMIT = 4096;
var CAPTION_LIMIT = 1024;
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function callTelegram(env, method, payload) {
  const response = await fetch(`${API_BASE}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, ...payload }),
    signal: AbortSignal.timeout(2e4)
  });
  let body = null;
  try {
    body = await response.json();
  } catch {
  }
  if (!response.ok || body?.ok !== true) {
    return {
      ok: false,
      description: body?.description ?? `HTTP ${response.status} ${response.statusText}`.trim()
    };
  }
  return { ok: true };
}
async function sendMessage(env, html) {
  const result = await callTelegram(env, "sendMessage", {
    text: truncate(html, TEXT_LIMIT),
    parse_mode: "HTML",
    disable_web_page_preview: false
  });
  if (!result.ok) throw new Error(`Telegram sendMessage: ${result.description}`);
}
async function sendListing(env, profile, listing) {
  const caption = formatListing(profile, listing);
  if (listing.imageUrl) {
    const photo = await callTelegram(env, "sendPhoto", {
      photo: listing.imageUrl,
      caption: truncate(caption, CAPTION_LIMIT),
      parse_mode: "HTML"
    });
    if (photo.ok) return;
    console.warn(`sendPhoto fehlgeschlagen (${photo.description}) \u2013 Fallback auf sendMessage`);
  }
  await sendMessage(env, caption);
}
function formatListing(profile, listing) {
  const lines = [];
  lines.push(`\u{1F697} <b>${escapeHtml(listing.title)}</b>`);
  const price = listing.priceText ?? (listing.price ? formatEuro(listing.price) : null);
  if (price) lines.push(`\u{1F4B0} ${escapeHtml(price)}`);
  const specs = [];
  if (listing.year) specs.push(`BJ ${listing.year}`);
  if (listing.mileage !== null) specs.push(`${formatNumber(listing.mileage)} km`);
  if (specs.length) lines.push(`\u{1F4CB} ${escapeHtml(specs.join(" \xB7 "))}`);
  const place = [listing.postcode, listing.location].filter(Boolean).join(" ");
  const placeParts = [place || regionName(profile.areaId)];
  if (typeof listing.distanceKm === "number") {
    placeParts.push(`${Math.round(listing.distanceKm)} km entfernt`);
  }
  lines.push(`\u{1F4CD} ${escapeHtml(placeParts.filter(Boolean).join(" \xB7 "))}`);
  lines.push("");
  lines.push(`\u{1F517} <a href="${escapeHtml(listing.url)}">Inserat \xF6ffnen</a>`);
  lines.push(`<i>Profil: ${escapeHtml(profile.name)}</i>`);
  return lines.join("\n");
}
function formatEuro(value) {
  return `\u20AC ${formatNumber(value)}`;
}
function formatNumber(value) {
  return Math.round(value).toLocaleString("de-AT");
}
function truncate(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1)}\u2026`;
}
var ERROR_ALERT_KEY = "state:error-alert";
async function reportErrorOncePerDay(env, messages) {
  if (messages.length === 0) return false;
  if (await env.WATCHER.get(ERROR_ALERT_KEY)) return false;
  await env.WATCHER.put(ERROR_ALERT_KEY, (/* @__PURE__ */ new Date()).toISOString(), { expirationTtl: 86400 });
  const body = [
    "\u26A0\uFE0F <b>willhaben-Watcher: Fehler</b>",
    "",
    ...messages.slice(0, 5).map((m) => `\u2022 ${escapeHtml(m)}`),
    "",
    "<i>Weitere Fehler werden f\xFCr 24 h nicht gemeldet.</i>"
  ].join("\n");
  try {
    await sendMessage(env, body);
    return true;
  } catch (err) {
    console.error("Fehlermeldung konnte nicht gesendet werden:", err);
    return false;
  }
}

// src/watcher.ts
var LAST_RUN_KEY = "state:last-run";
var SEEDED_PREFIX = "state:seeded:";
var SEEN_PREFIX = "seen:";
var DEFAULT_ROWS = 30;
var DEFAULT_MAX_NOTIFY = 10;
var DEFAULT_SEEN_TTL_DAYS = 30;
var PROFILE_DELAY_MS = 750;
async function runWatcher(env, config, options) {
  const startedAt = Date.now();
  const dryRun = options.dryRun === true;
  const rows = intFromEnv(env.SEARCH_ROWS, DEFAULT_ROWS, 1, 200);
  const maxNotify = intFromEnv(env.MAX_NOTIFY_PER_RUN, DEFAULT_MAX_NOTIFY, 0, 50);
  const seenTtl = intFromEnv(env.SEEN_TTL_DAYS, DEFAULT_SEEN_TTL_DAYS, 1, 365) * 86400;
  const userAgent = env.USER_AGENT?.trim() || DEFAULT_USER_AGENT;
  const selected = config.profiles.filter((p) => {
    if (options.profileId && p.id !== options.profileId) return false;
    return p.enabled || options.includeDisabled === true || Boolean(options.profileId);
  });
  const results = [];
  const errors = [];
  for (const [index, profile] of selected.entries()) {
    if (index > 0) await sleep(PROFILE_DELAY_MS);
    try {
      results.push(
        await runProfile(env, profile, { dryRun, rows, maxNotify, seenTtl, userAgent })
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
        error: errText(err)
      });
    }
  }
  const summary = {
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    durationMs: Date.now() - startedAt,
    dryRun,
    trigger: options.trigger,
    profiles: results,
    errors
  };
  if (!dryRun) {
    await env.WATCHER.put(LAST_RUN_KEY, JSON.stringify(stripListings(summary)));
    if (errors.length > 0) await reportErrorOncePerDay(env, errors);
  }
  return summary;
}
async function runProfile(env, profile, cfg) {
  const listings = await searchListings(profile, { rows: cfg.rows, userAgent: cfg.userAgent });
  const matched = filterListings(profile, listings);
  const result = {
    profileId: profile.id,
    profileName: profile.name,
    fetched: listings.length,
    matched: matched.length,
    fresh: 0,
    notified: 0,
    seeded: false,
    listings: matched
  };
  if (cfg.dryRun) {
    result.fresh = matched.length;
    return result;
  }
  const fresh = [];
  for (const listing of matched) {
    const key = seenKey(profile.id, listing.id);
    if (await env.WATCHER.get(key)) continue;
    fresh.push(listing);
  }
  result.fresh = fresh.length;
  const seededBefore = await env.WATCHER.get(seededKey(profile.id));
  if (!seededBefore) {
    await markSeen(env, profile.id, matched, cfg.seenTtl);
    await env.WATCHER.put(seededKey(profile.id), (/* @__PURE__ */ new Date()).toISOString());
    result.seeded = true;
    await sendMessage(
      env,
      [
        `\u{1F440} <b>Profil aktiviert:</b> ${escapeHtml(profile.name)}`,
        `${matched.length} aktuelle Treffer wurden als bekannt markiert.`,
        "Ab jetzt kommt eine Nachricht, sobald ein neues Inserat auftaucht."
      ].join("\n")
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
      `\u2139\uFE0F <b>${escapeHtml(profile.name)}</b>: ${fresh.length - toNotify.length} weitere neue Treffer wurden nicht einzeln gemeldet (Limit ${cfg.maxNotify} pro Lauf).`
    );
  }
  await markSeen(env, profile.id, fresh, cfg.seenTtl);
  return result;
}
function filterListings(profile, listings) {
  const include = (profile.includeKeywords ?? []).map(normalizeText).filter(Boolean);
  const exclude = (profile.excludeKeywords ?? []).map(normalizeText).filter(Boolean);
  const center = profile.radiusKm ? coordsForPostcode(profile.postcode) : null;
  const out = [];
  for (const listing of listings) {
    const haystack = normalizeText(`${listing.title} ${listing.description}`);
    if (include.length > 0 && !include.some((word) => haystack.includes(word))) continue;
    if (exclude.length > 0 && exclude.some((word) => haystack.includes(word))) continue;
    if (!withinRange(listing.price, profile.priceFrom, profile.priceTo, true)) continue;
    if (!withinRange(listing.year, profile.yearFrom, profile.yearTo, false)) continue;
    if (!withinRange(listing.mileage, profile.mileageFrom, profile.mileageTo, false)) continue;
    const enriched = { ...listing, distanceKm: null };
    if (center) {
      const point = listing.lat !== null && listing.lon !== null ? { lat: listing.lat, lon: listing.lon } : coordsForPostcode(listing.postcode);
      if (point) {
        const dist = distanceKm(center, point);
        if (dist > profile.radiusKm + 5) continue;
        enriched.distanceKm = dist;
      }
    }
    out.push(enriched);
  }
  return out;
}
function withinRange(value, from, to, treatZeroAsUnknown) {
  if (from === void 0 && to === void 0) return true;
  if (value === null) return true;
  if (treatZeroAsUnknown && value <= 0) return true;
  if (from !== void 0 && value < from) return false;
  if (to !== void 0 && value > to) return false;
  return true;
}
function normalizeText(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
}
async function markSeen(env, profileId, listings, ttlSeconds) {
  const stamp = (/* @__PURE__ */ new Date()).toISOString();
  for (const listing of listings) {
    await env.WATCHER.put(seenKey(profileId, listing.id), stamp, { expirationTtl: ttlSeconds });
  }
}
function seenKey(profileId, adId) {
  return `${SEEN_PREFIX}${profileId}:${adId}`;
}
function seededKey(profileId) {
  return `${SEEDED_PREFIX}${profileId}`;
}
async function resetSeen(env, profileId) {
  let cursor;
  let deleted = 0;
  do {
    const page = await env.WATCHER.list({ prefix: `${SEEN_PREFIX}${profileId}:`, cursor });
    for (const key of page.keys) {
      await env.WATCHER.delete(key.name);
      deleted += 1;
    }
    cursor = page.list_complete ? void 0 : page.cursor;
  } while (cursor);
  await env.WATCHER.delete(seededKey(profileId));
  return deleted;
}
async function loadLastRun(env) {
  return await env.WATCHER.get(LAST_RUN_KEY, "json");
}
function stripListings(summary) {
  return { ...summary, profiles: summary.profiles.map(({ listings, ...rest }) => rest) };
}
function intFromEnv(raw, fallback, min, max) {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/index.ts
var index_default = {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (err) {
      console.error("Unbehandelter Fehler:", err);
      return json({ error: errText(err) }, 500);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          const config = await loadConfig(env);
          const summary = await runWatcher(env, config, { trigger: "cron" });
          console.log(
            `Cron ${event.cron}: ${summary.profiles.length} Profil(e), ${summary.profiles.reduce((n, p) => n + p.notified, 0)} Benachrichtigung(en), ${summary.errors.length} Fehler`
          );
        } catch (err) {
          console.error("Cron-Lauf fehlgeschlagen:", errText(err));
        }
      })()
    );
  }
};
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (path === "/health") return new Response("ok", { headers: { "content-type": "text/plain" } });
  if (!env.CONFIG_PASSWORD) {
    return json(
      { error: "CONFIG_PASSWORD ist nicht gesetzt. Siehe README (wrangler secret put CONFIG_PASSWORD)." },
      500
    );
  }
  if (!isAuthorized(request, url, env)) return unauthorized();
  switch (path) {
    case "/":
      return Response.redirect(new URL(`/config${url.search}`, url).toString(), 302);
    case "/config":
      return new Response(config_default, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex, nofollow"
        }
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
          "\u2705 <b>willhaben-Watcher</b>\nTestnachricht \u2013 Bot-Token und Chat-ID funktionieren."
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
async function handleSaveConfig(request, env) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Body ist kein g\xFCltiges JSON." }, 400);
  }
  let normalized;
  try {
    normalized = normalizeConfig(payload?.config ?? payload);
  } catch (err) {
    if (err instanceof ConfigError) return json({ error: err.message }, 400);
    throw err;
  }
  const saved = await saveConfig(env, normalized);
  return json({ ok: true, config: saved });
}
async function handleNavigator(env, navigatorId, makeId) {
  try {
    const options = await fetchNavigatorOptions(
      navigatorId,
      makeId,
      env.USER_AGENT?.trim() || DEFAULT_USER_AGENT
    );
    return json({ options });
  } catch (err) {
    console.warn(`Navigator '${navigatorId}' nicht abrufbar:`, errText(err));
    return json({ error: errText(err), options: [] }, 502);
  }
}
async function handleRun(request, url, env) {
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
    profileId: url.searchParams.get("profile") ?? void 0,
    includeDisabled: url.searchParams.get("all") === "1"
  });
  return json(summary);
}
function isAuthorized(request, url, env) {
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
function timingSafeEqual(a, b) {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  let diff = bytesA.length ^ bytesB.length;
  for (let i = 0; i < Math.max(bytesA.length, bytesB.length); i++) {
    diff |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diff === 0;
}
function unauthorized() {
  return new Response(
    JSON.stringify({ error: "Nicht autorisiert. /config?key=DEIN_PASSWORT aufrufen." }),
    {
      status: 401,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "www-authenticate": 'Basic realm="willhaben-watcher", charset="UTF-8"'
      }
    }
  );
}
function methodNotAllowed(allow) {
  return new Response(JSON.stringify({ error: `Methode nicht erlaubt. Erlaubt: ${allow}` }), {
    status: 405,
    headers: { "content-type": "application/json; charset=utf-8", allow }
  });
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
export {
  index_default as default
};
