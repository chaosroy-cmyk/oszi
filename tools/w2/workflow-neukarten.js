export const meta = {
  name: 'schritt3a-neukarten',
  description: 'Schritt 3a: 6 neue Messkarten (Pumpe-Düse, Automatik-Magnetventile, Leerlaufsteller, Schrittmotor, Ionenstrom, CDI) mit W2-Bildern: Autor, unabhängige Prüfung, Korrektur, Nachprüfung',
  phases: [
    { title: 'Erstellen', detail: 'je Gruppe: Recherche mit Quellen, Kartentext, Modelle, Bilder, Selbstprüfung' },
    { title: 'Prüfen', detail: 'unabhängige Gegenprüfung: Zweitquellen, Nachmessen, jedes Bild ansehen' },
    { title: 'Korrigieren', detail: 'Befunde einarbeiten und erneut prüfen' },
  ],
}

const A = typeof args === "string" ? JSON.parse(args) : args
const SCR = A.scr
const GROUPS = A.groups

const IMG = { type: 'object', properties: { tag: { type: 'string' }, title: { type: 'string' }, aussage: { type: 'string' } }, required: ['tag', 'title'] }
const AUTHOR_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    cards: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, kat: { type: 'string' }, gut: { type: 'array', items: IMG }, fehler: { type: 'array', items: IMG } }, required: ['id', 'gut', 'fehler'] } },
    quellen: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, belegt: { type: 'string' } }, required: ['url', 'belegt'] } },
    unsicher: { type: 'array', items: { type: 'string' } },
    pruefung: { type: 'object', properties: { errors: { type: 'number' }, warnings: { type: 'array', items: { type: 'string' } } }, required: ['errors'] },
    bilderAngesehen: { type: 'boolean' },
    behoben: { type: 'array', items: { type: 'string' } },
    nichtBehoben: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, grund: { type: 'string' } }, required: ['problem', 'grund'] } },
  },
  required: ['file', 'cards', 'quellen', 'pruefung', 'bilderAngesehen'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ok', 'fix'] },
    werkzeugFehler: { type: 'number' },
    bilderGeprueft: { type: 'number' },
    blocking: { type: 'array', items: { type: 'object', properties: { karte: { type: 'string' }, tag: { type: 'string' }, problem: { type: 'string' }, beleg: { type: 'string' }, fix: { type: 'string' } }, required: ['karte', 'problem', 'fix'] } },
    minor: { type: 'array', items: { type: 'object', properties: { karte: { type: 'string' }, tag: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['karte', 'problem'] } },
    quellenGeprueft: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, ergebnis: { type: 'string' } }, required: ['url', 'ergebnis'] } },
    fehlendeZustaende: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'blocking', 'quellenGeprueft', 'bilderGeprueft'],
}

const kitCmd = 'OSZI_HTML=/home/user/oszi/index.html CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome NODE_PATH=/opt/node22/lib/node_modules node ' + SCR + '/kit/render-card.js'

function authorPrompt(g) {
  return `Du bist Kfz-Diagnose-Fachautor (Elektrik/Elektronik, Oszilloskop-Praxis) und JavaScript-Entwickler.
Aufgabe: Für das KFZ-Oszilloskop-Kompendium (deutschsprachige Werkstatt-PWA für Kfz-Techniker, Zielgerät OWON VDS1022I) die NEUEN, kompletten Messkarten ${g.ids.map(i => '"' + i + '"').join(' und ')} schreiben (NEUKARTE: ganzer Kartentext mit allen 28 Feldern + tk11 + W2-Signalbilder aus Signalmodellen in echter Zeit).

Lies ZUERST vollständig: ${SCR}/kit/API.md (verbindliche Regeln; Abschnitt 7 NEUKARTE und 8 Aktoren/Bordnetz/Bus besonders). Formatbeispiel Bilder: ${SCR}/kit/example-kw-ind.js (Zahlen darin ungeprüft).
Stil-Vorlagen in /home/user/oszi/index.html (suche id:"map", id:"kw-hall", id:"oeldruck"); verwandte bestehende Karten zum Abgrenzen und für Stil von Aktorkarten: ${g.related}. Keine Inhalte doppeln, die eine bestehende Karte schon abdeckt; im Text darauf verweisen ist erlaubt.

Vorgaben je Karte:
${g.focus}

Gerät VDS1022I: 2 Kanäle mit gemeinsamer Masse, 25 MHz, 100 MS/s, 5000 Punkte; 1:1 max. 40 Vss (≈ ±20 V), 10:1 max. 400 Vss, 5 mV–5 V/div. tk11-Feld Pflicht. setup.trig braucht Pfeil (↑/↓) und Pegel in V (bzw. A bei Stromkarten); setup.vdiv/tdiv (erstgelesene Werte) müssen zum Normalbild gut[0] passen.

Vorgehen:
1. Recherche: Tools laden mit ToolSearch "select:WebSearch,WebFetch". Für jede Karte die Signalwerte belegen (Pegel, Frequenz, Zeiten, Ströme, Widerstände, typische Fehlerbilder). Bevorzugt: Pico Technology (picoauto.com Guided Tests, Waveform Library), Bosch, Hella TechWorld/TIBI, Hersteller-Werkstattunterlagen, Normen. Öffne jede Quelle wirklich (WebFetch). Zitiere nichts Ungelesenes. Notiere je Quelle, was sie belegt.
2. Modelle schreiben (Präfix = Karten-ID in camelCase). Zustände und Fehler über Parameter.
3. Je Karte 3–6 GUT-Zustände und 4–8 FEHLER-Bilder (jedes mit Sollbild/ghost). gut[0] = typischer Normalzustand laut setup.zustand.
4. Genau eine Datei schreiben: ${SCR}/cards/${g.key}.js (beide Karten als NEUKARTE, ein @models- und ein @quellen-Block, QUELLEN je Karte).
5. Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}
   Wiederholen bis 0 Fehler (auch Schema-Fehler). JEDES Einzelbild (${SCR}/out/${g.key}/<id>-G0.png usw.) mit Read ansehen und kritisch beurteilen: Sieht es aus wie am echten Oszi? Pegel und Zeiten plausibel? Fehler eindeutig? Labels lesbar und nicht über der Kurve? Nachbessern. Die <id>-text.json gegenlesen.
6. node --check ${SCR}/cards/${g.key}.js

Regeln: Nichts erfinden. Jede Zahl in Kartentext und Bildtext ist belegt (QUELLEN) oder per expect nachgemessen, sonst „typ./herstellerabhängig" mit konservativem Bereich und im Bericht unter "unsicher". Fehlercodes und Pin-Nummern nur mit Quelle. Nie an Airbag-/PSI5-/Pyrotechnik-Kreisen messen, Hochvolt ausgeschlossen. Schreibe nur in ${SCR}/cards und ${SCR}/out. /home/user/oszi NICHT verändern.
Antwort: der strukturierte Bericht.`
}

function verifyPrompt(g, a) {
  return `Du bist unabhängiger, strenger Fachprüfer (Kfz-Elektrik und -Diagnose, Oszilloskop-Praxis). Ein Autor hat die neuen Messkarten ${g.ids.join(', ')} (kompletter Kartentext + Signalbilder) erstellt. Datei: ${SCR}/cards/${g.key}.js
Bericht des Autors (JSON): ${JSON.stringify(a)}

Prüfe adversarial: Geh davon aus, dass Fehler drin sind, und finde sie. Du änderst die Datei NICHT.
Lies ${SCR}/kit/API.md (Regeln, v. a. Abschnitt 7 und 8). Dann:
1. Werkzeug selbst ausführen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef  (Anzahl Werkzeugfehler melden).
2. JEDES Einzelbild in ${SCR}/out/${g.key}-pruef mit Read ansehen: Physik (Pegel, Zeiten, Kurvenform wie am echten Oszi?), Zahlen in Bildtexten belegt oder per expect gemessen, Text passt zum Bild, Fehlerbilder realistisch und unterscheidbar mit Sollbild, Lesbarkeit.
3. Den kompletten Kartentext (<id>-text.json) prüfen: jede Zahl, jeder Fehlercode, jede Pin-Angabe belegt? setup passend zu gut[0] (vdiv/tdiv), trig mit Pfeil und Pegel? tk11 korrekt eingestuft (1:1 max. ±20 V)? warn nennt die echte Gefahr (z. B. Hochspannung bei CDI/Zündung, Kraftstoffdruck)? Abgrenzung zu bestehenden Karten (${g.related}) sauber, keine Dopplung?
4. Quellen unabhängig prüfen: Tools laden mit ToolSearch "select:WebSearch,WebFetch". Zitierte Quellen öffnen und prüfen, ob sie die Aussagen belegen. Je Karte mindestens die 3 wichtigsten Kennwerte gegen eine ZWEITE, unabhängige Quelle prüfen.
5. Fehlen Zustände oder Fehlerbilder, die eine Werkstatt typischerweise braucht?

verdict "ok" nur ohne blockierende Mängel. Blockierend = fachlich falsch, Physik falsch, Zahl ohne Beleg, irreführendes Bild, unlesbar, Werkzeugfehler, Sicherheitsproblem (Messhinweis gefährdet Gerät oder Person). Jede Beanstandung mit konkretem Fix-Vorschlag und Beleg. Schreibe nur in ${SCR}/out.
Antwort: der strukturierte Prüfbericht.`
}

function fixPrompt(g, a, v) {
  return `Du bist der Autor der neuen Messkarten ${g.ids.join(', ')} (Fortsetzung). Datei: ${SCR}/cards/${g.key}.js
Dein bisheriger Bericht (JSON): ${JSON.stringify(a)}
Befunde des unabhängigen Prüfers (JSON): ${JSON.stringify(v)}

Lies ${SCR}/kit/API.md. Arbeite ALLE blockierenden Befunde ein, dazu die sinnvollen minor-Befunde. Widersprichst du einem Befund fachlich, begründe das mit Quelle. Ergänze fehlende Zustände/Fehlerbilder, wenn belegbar. Recherche: ToolSearch "select:WebSearch,WebFetch".
Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}  bis 0 Fehler. Geänderte Einzelbilder mit Read ansehen. node --check auf die Datei.
Regeln wie in API.md: nichts erfinden, nur in ${SCR}/cards und ${SCR}/out schreiben.
Antwort: der strukturierte Bericht, inklusive "behoben" und "nichtBehoben" (mit Begründung).`
}

function reverifyPrompt(g, fx, v) {
  return `Du bist unabhängiger, strenger Fachprüfer (zweite Runde) für die neuen Messkarten ${g.ids.join(', ')}. Datei: ${SCR}/cards/${g.key}.js
Deine erste Prüfung (JSON): ${JSON.stringify(v)}
Korrekturbericht des Autors (JSON): ${JSON.stringify(fx)}

Prüfe gezielt, ob alle blockierenden Befunde wirklich behoben sind: Werkzeug ausführen (${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef2), betroffene und neue Einzelbilder mit Read ansehen, Kartentext (<id>-text.json) gegenlesen, Quellen der Korrekturen öffnen (ToolSearch "select:WebSearch,WebFetch"). Neue Probleme durch die Korrektur? Begründete Widersprüche des Autors fair bewerten. verdict "ok" nur ohne blockierende Mängel. Datei NICHT ändern; nur in ${SCR}/out schreiben.
Antwort: der strukturierte Prüfbericht.`
}

const work = await pipeline(GROUPS,
  g => agent(authorPrompt(g), { label: 'erstellen:' + g.key, phase: 'Erstellen', schema: AUTHOR_SCHEMA }),
  (a, g) => a ? agent(verifyPrompt(g, a), { label: 'prüfen:' + g.key, phase: 'Prüfen', schema: VERIFY_SCHEMA }).then(v => ({ a, v })) : { a: null, v: null },
  async (av, g) => {
    const a = av.a, v = av.v
    if (!a || !v) return { key: g.key, ids: g.ids, a, v, fix: null, v2: null }
    if (v.verdict === 'ok' && !(v.blocking || []).length) return { key: g.key, ids: g.ids, a, v, fix: null, v2: null }
    const fx = await agent(fixPrompt(g, a, v), { label: 'korrigieren:' + g.key, phase: 'Korrigieren', schema: AUTHOR_SCHEMA })
    if (!fx) return { key: g.key, ids: g.ids, a, v, fix: null, v2: null }
    const v2 = await agent(reverifyPrompt(g, fx, v), { label: 'nachprüfen:' + g.key, phase: 'Korrigieren', schema: VERIFY_SCHEMA })
    return { key: g.key, ids: g.ids, a, v, fix: fx, v2 }
  }
)
return { work }
