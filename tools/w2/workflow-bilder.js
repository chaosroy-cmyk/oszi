export const meta = {
  name: 'schritt4-erklaerbilder',
  description: 'Schritt 4: Erklärbilder der Theoriekapitel und Fehlermuster-Datenbank auf W2 umbauen: Autor, unabhängige Prüfung, Korrektur, Nachprüfung',
  phases: [
    { title: 'Erstellen', detail: 'je Gruppe: Modelle wiederverwenden, Bilder, Quellen, Selbstprüfung' },
    { title: 'Prüfen', detail: 'unabhängige Gegenprüfung: Physik, Quellen, jedes Bild ansehen' },
    { title: 'Korrigieren', detail: 'Befunde einarbeiten und erneut prüfen' },
  ],
}

const A = typeof args === 'string' ? JSON.parse(args) : args
const SCR = A.scr
const GROUPS = A.groups

const IMG = { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, aussage: { type: 'string' } }, required: ['id', 'title'] }
const AUTHOR_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    bilder: { type: 'array', items: IMG },
    quellen: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, belegt: { type: 'string' } }, required: ['url', 'belegt'] } },
    unsicher: { type: 'array', items: { type: 'string' } },
    pruefung: { type: 'object', properties: { errors: { type: 'number' }, warnings: { type: 'array', items: { type: 'string' } } }, required: ['errors'] },
    bilderAngesehen: { type: 'boolean' },
    behoben: { type: 'array', items: { type: 'string' } },
    nichtBehoben: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, grund: { type: 'string' } }, required: ['problem', 'grund'] } },
  },
  required: ['file', 'bilder', 'quellen', 'pruefung', 'bilderAngesehen'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ok', 'fix'] },
    werkzeugFehler: { type: 'number' },
    bilderGeprueft: { type: 'number' },
    blocking: { type: 'array', items: { type: 'object', properties: { bild: { type: 'string' }, problem: { type: 'string' }, beleg: { type: 'string' }, fix: { type: 'string' } }, required: ['bild', 'problem', 'fix'] } },
    minor: { type: 'array', items: { type: 'object', properties: { bild: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['bild', 'problem'] } },
    quellenGeprueft: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, ergebnis: { type: 'string' } }, required: ['url', 'ergebnis'] } },
  },
  required: ['verdict', 'blocking', 'quellenGeprueft', 'bilderGeprueft'],
}

const kitCmd = 'OSZI_HTML=/home/user/oszi/index.html CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome NODE_PATH=/opt/node22/lib/node_modules node ' + SCR + '/kit/render-card.js'

function authorPrompt(g) {
  return `Du bist Kfz-Diagnose-Fachautor (Elektrik/Elektronik, Oszilloskop-Praxis) und JavaScript-Entwickler.
Aufgabe: Im KFZ-Oszilloskop-Kompendium (deutschsprachige Werkstatt-PWA, Zielgerät OWON VDS1022I) werden ${g.what} noch mit der alten Bild-Engine gezeichnet (grobe Formen, Achsen stimmen nicht mit der Kurve überein). Baue diese Bilder auf die Engine W2 um (Signalmodelle in echter Zeit, Achsen in echten Einheiten, nachgemessene Werte).

Lies ZUERST vollständig: ${SCR}/kit/API.md – vor allem Abschnitt 9 (FIGPATCH/FDBPATCH), dazu Abschnitt 0–3 und 5.
Lies dann in /home/user/oszi/index.html die alten Bilder: ${g.where}. Übernimm die Aussage und Didaktik jedes Bildes (caption/why sind Vorlage, dürfen besser werden), aber keine Zahl ungeprüft.
Bilder dieser Gruppe (ID → Aussage):
${g.list}

Wichtig:
- Vorhandene Signalmodelle wiederverwenden (SIG.M.* in index.html, Bereich „SIGNALMODELLE (Karten)“ – z. B. CAN: canHs…, LIN: lin…, FlexRay: flexray…, SENT: sent…, KW/NW: kwInd/kwHallGeber/…, Starter: starterCrank, 5-V-Referenz: sensorRef…, Spannungsfall: spannungsfall…, Bordnetz: …). Die Karten mit diesen Modellen (QUELLEN je Karte) sind dein Quellenfundus; zusätzlich wie gewohnt Pico/Bosch/Hella/Normen per WebFetch (ToolSearch "select:WebSearch,WebFetch"). Neue Modelle nur, wenn nötig (Präfix fig… bzw. fdb…), ES5.
- Erklärbilder dürfen didaktisch vereinfachen, müssen aber physikalisch stimmen; Gerätegrenzen des VDS1022I (25 MHz, 100 MS/s, 1:1 max. ±20 V) beachten. Fehlerbilder brauchen ein Sollbild (ghost). Bilder, die am Oszi nicht so messbar sind (z. B. Aliasing-Erklärung), ehrlich als Erklärung kennzeichnen (title/caption).
- Je Bild QUELLEN["<id>"] (URL + was sie belegt, oder „Physik (ohne Quelle): …“ bei reinen Grundlagenbildern mit Beispielwerten, die dann als Beispiel gekennzeichnet sind).
- Genau eine Datei schreiben: ${SCR}/cards/${g.key}.js (ein @models-Block – darf leer sein –, ein @quellen-Block, je Bild FIGPATCH["svg-…"] bzw. FDBPATCH["<id>"] = W2({ … })).
- Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}  bis 0 Fehler. JEDES Einzelbild (${SCR}/out/${g.key}/bilder-<id>.png) mit Read ansehen und kritisch beurteilen (wie am echten Oszi? Aussage auf den ersten Blick erkennbar? Labels lesbar?). node --check auf die Datei.
Regeln: Nichts erfinden. Nur in ${SCR}/cards und ${SCR}/out schreiben, /home/user/oszi NICHT verändern.
Antwort: der strukturierte Bericht (bilder = Liste der IDs mit Titel und Kernaussage).`
}

function verifyPrompt(g, a) {
  return `Du bist unabhängiger, strenger Fachprüfer (Kfz-Elektrik und -Diagnose, Oszilloskop-Praxis). Ein Autor hat ${g.what} auf die Bild-Engine W2 umgebaut. Datei: ${SCR}/cards/${g.key}.js
Bericht des Autors (JSON): ${JSON.stringify(a)}

Prüfe adversarial: Geh davon aus, dass Fehler drin sind. Du änderst die Datei NICHT.
Lies ${SCR}/kit/API.md (Abschnitt 9 und 0–3). Dann:
1. Werkzeug selbst ausführen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef (Werkzeugfehler melden).
2. JEDES Einzelbild in ${SCR}/out/${g.key}-pruef (bilder-<id>.png) mit Read ansehen: Physik (Pegel, Zeiten, Form wie am echten Oszi?), Aussage des alten Bildes erhalten oder besser (alte Bilder in /home/user/oszi/index.html: ${g.where}), Zahlen in Bildtexten belegt oder per expect gemessen, Fehlerbilder mit Sollbild und eindeutig, Lesbarkeit (Labels nicht auf der Kurve, Statuszeile nicht überlaufend).
3. Quellen: Tools laden mit ToolSearch "select:WebSearch,WebFetch"; zitierte Quellen öffnen; je Gruppe mindestens die 5 wichtigsten Kennwerte gegen eine zweite Quelle prüfen (die Karten-QUELLEN in index.html zählen als erste Quelle).
4. Passt jedes Bild zu seinem Text im Kapitel bzw. zum FEHLERDB-Eintrag (kennzeichen/strategie)?
verdict "ok" nur ohne blockierende Mängel (fachlich/physikalisch falsch, Zahl ohne Beleg, irreführend, unlesbar, Werkzeugfehler). Jede Beanstandung mit konkretem Fix und Beleg. Nur in ${SCR}/out schreiben.
Antwort: der strukturierte Prüfbericht.`
}

function fixPrompt(g, a, v) {
  return `Du bist der Autor der Bilder (${g.what}), Fortsetzung. Datei: ${SCR}/cards/${g.key}.js
Dein bisheriger Bericht (JSON): ${JSON.stringify(a)}
Befunde des unabhängigen Prüfers (JSON): ${JSON.stringify(v)}
Lies ${SCR}/kit/API.md. Arbeite ALLE blockierenden Befunde ein, dazu die sinnvollen minor-Befunde; fachlichen Widerspruch mit Quelle begründen. Recherche: ToolSearch "select:WebSearch,WebFetch".
Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key} bis 0 Fehler, geänderte Bilder mit Read ansehen, node --check. Nur in ${SCR}/cards und ${SCR}/out schreiben.
Antwort: der strukturierte Bericht mit "behoben" und "nichtBehoben" (mit Begründung).`
}

function reverifyPrompt(g, fx, v) {
  return `Du bist unabhängiger, strenger Fachprüfer (zweite Runde) für die Bilder (${g.what}). Datei: ${SCR}/cards/${g.key}.js
Deine erste Prüfung (JSON): ${JSON.stringify(v)}
Korrekturbericht des Autors (JSON): ${JSON.stringify(fx)}
Prüfe gezielt, ob alle blockierenden Befunde behoben sind: Werkzeug ausführen (${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef2), betroffene und neue Bilder mit Read ansehen, Quellen der Korrekturen öffnen. Neue Probleme? Widersprüche des Autors fair bewerten. verdict "ok" nur ohne blockierende Mängel. Datei NICHT ändern; nur in ${SCR}/out schreiben.
Antwort: der strukturierte Prüfbericht.`
}

const work = await pipeline(GROUPS,
  g => agent(authorPrompt(g), { label: 'erstellen:' + g.key, phase: 'Erstellen', schema: AUTHOR_SCHEMA }),
  (a, g) => a ? agent(verifyPrompt(g, a), { label: 'prüfen:' + g.key, phase: 'Prüfen', schema: VERIFY_SCHEMA }).then(v => ({ a, v })) : { a: null, v: null },
  async (av, g) => {
    const a = av.a, v = av.v
    if (!a || !v) return { key: g.key, a, v, fix: null, v2: null }
    if (v.verdict === 'ok' && !(v.blocking || []).length) return { key: g.key, a, v, fix: null, v2: null }
    const fx = await agent(fixPrompt(g, a, v), { label: 'korrigieren:' + g.key, phase: 'Korrigieren', schema: AUTHOR_SCHEMA })
    if (!fx) return { key: g.key, a, v, fix: null, v2: null }
    const v2 = await agent(reverifyPrompt(g, fx, v), { label: 'nachprüfen:' + g.key, phase: 'Korrigieren', schema: VERIFY_SCHEMA })
    return { key: g.key, a, v, fix: fx, v2 }
  }
)
return { work }
