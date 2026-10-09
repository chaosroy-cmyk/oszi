export const meta = {
  name: 'v11-sensor-signalbilder',
  description: 'Sensor- und Lambdakarten auf belegte, physikalisch korrekte W2-Signalbilder umbauen (Autor, unabhängige Prüfung, Korrektur) plus Katalog aller messbaren Kfz-Signale',
  phases: [
    { title: 'Erstellen', detail: 'je Gruppe: Recherche mit Quellen, Modelle, Zustände, Fehlerbilder, Selbstprüfung' },
    { title: 'Prüfen', detail: 'unabhängige Gegenprüfung: eigene Quellen, Nachmessen, jedes Bild ansehen' },
    { title: 'Korrigieren', detail: 'Befunde einarbeiten und erneut prüfen' },
    { title: 'Katalog', detail: 'alle am Auto messbaren Signale mit Quellen' },
  ],
}

const SCR = args.scr
const GROUPS = args.groups
const CARDLIST = args.cardlist

const AUTHOR_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    cards: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      gut: { type: 'array', items: { type: 'object', properties: { tag: { type: 'string' }, title: { type: 'string' }, aussage: { type: 'string' } }, required: ['tag', 'title'] } },
      fehler: { type: 'array', items: { type: 'object', properties: { tag: { type: 'string' }, title: { type: 'string' }, aussage: { type: 'string' } }, required: ['tag', 'title'] } },
    }, required: ['id', 'gut', 'fehler'] } },
    quellen: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, belegt: { type: 'string' } }, required: ['url', 'belegt'] } },
    unsicher: { type: 'array', items: { type: 'string' } },
    textFehler: { type: 'array', items: { type: 'object', properties: { karte: { type: 'string' }, feld: { type: 'string' }, problem: { type: 'string' }, vorschlag: { type: 'string' }, quelle: { type: 'string' } }, required: ['karte', 'problem'] } },
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
    textFehlerBestaetigt: { type: 'array', items: { type: 'object', properties: { karte: { type: 'string' }, feld: { type: 'string' }, problem: { type: 'string' }, vorschlag: { type: 'string' }, quelle: { type: 'string' } }, required: ['karte', 'problem'] } },
    fehlendeZustaende: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict', 'blocking', 'quellenGeprueft', 'bilderGeprueft'],
}

const CATALOG_SCHEMA = {
  type: 'object',
  properties: {
    bereich: { type: 'string' },
    signale: { type: 'array', items: { type: 'object', properties: {
      name: { type: 'string' }, system: { type: 'string' }, signalart: { type: 'string' }, typischeWerte: { type: 'string' },
      oszirelevant: { type: 'boolean' }, messbarMitVDS1022: { type: 'string' }, sicherheit: { type: 'string' },
      abgedecktDurch: { type: 'string' }, prioritaet: { type: 'string', enum: ['hoch', 'mittel', 'niedrig'] },
      quellen: { type: 'array', items: { type: 'string' } },
    }, required: ['name', 'system', 'signalart', 'oszirelevant', 'abgedecktDurch', 'prioritaet'] } },
  },
  required: ['bereich', 'signale'],
}

const kitCmd = 'CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome NODE_PATH=' + SCR + '/pw/node_modules node ' + SCR + '/kit/render-card.js'

function authorPrompt(g) {
  return `Du bist Kfz-Diagnose-Fachautor (Elektrik/Elektronik, Oszilloskop-Praxis) und JavaScript-Entwickler.
Aufgabe: Für die Messkarten ${g.ids.map(i => '"' + i + '"').join(', ')} des KFZ-Oszilloskop-Kompendiums (deutschsprachige Werkstatt-PWA für Kfz-Techniker, Zielgerät OWON VDS1022I) neue, physikalisch korrekte Signalbilder bauen: mehrere Zustände (GUT) und mehrere Fehlerbilder (FEHLER), aus Signalmodellen in echter Zeit.

Lies ZUERST vollständig: ${SCR}/kit/API.md (verbindliche Regeln, Dateiformat, Prüfwerkzeug). Format-Beispiel: ${SCR}/kit/example-kw-ind.js (nur Beispiel, Zahlen darin sind NICHT geprüft).
Lies die bestehenden Karten in /home/user/oszi/index.html (suche id:"<id>"): alle Texte, setup, und die alten Bilder (gut/schlecht). Die alten Bilder haben falsche Skalen und grobe Formen: Übernimm keine Zahl ungeprüft. Die Kartentexte bleiben unverändert (Fachfehler darin nur melden).

Ansätze für diese Gruppe (Ideen, die du mit Quellen PRÜFEN musst, nicht ungeprüft übernehmen):
${g.focus}

Vorgehen:
1. Recherche: Tools laden mit ToolSearch "select:WebSearch,WebFetch". Für jede Karte die typischen Signalwerte belegen (Pegel, Frequenz/Drehzahlbezug, Zeitverläufe, typische Fehlerbilder). Bevorzugt: Pico Technology (picoauto.com Guided Tests, Waveform Library), Bosch-Datenblätter, Hella TechWorld, Normen, Hersteller. Öffne jede Quelle wirklich (WebFetch). Zitiere nichts, was du nicht gelesen hast. Notiere je Quelle, was sie belegt.
2. Modelle schreiben (Präfix = Karten-ID in camelCase). Zustände und Fehler über Parameter.
3. Je Karte 3–6 GUT-Zustände und 4–8 FEHLER-Bilder (jedes mit Sollbild/ghost). gut[0] = typischer Normalzustand laut setup.zustand.
4. Genau eine Datei schreiben: ${SCR}/cards/${g.key}.js (alle Karten dieser Gruppe, ein @models- und ein @quellen-Block, QUELLEN je Karte).
5. Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}
   Wiederholen bis 0 Fehler. JEDES Einzelbild (${SCR}/out/${g.key}/<id>-G0.png usw.) mit Read ansehen und kritisch beurteilen: Sieht es aus wie am echten Oszi? Pegel und Zeiten plausibel? Fehler eindeutig erkennbar? Labels lesbar und nicht über der Kurve? Nachbessern.
6. node --check ${SCR}/cards/${g.key}.js

Regeln: Nichts erfinden. Jede Zahl im Bildtext ist belegt (QUELLEN) oder per expect nachgemessen. Unsicheres als „typ./herstellerabhängig" mit konservativem Bereich, und im Bericht unter "unsicher" nennen. Schreibe nur in ${SCR}/cards und ${SCR}/out. /home/user/oszi NICHT verändern.
Antwort: der strukturierte Bericht.`
}

function verifyPrompt(g, a) {
  return `Du bist unabhängiger, strenger Fachprüfer (Kfz-Elektrik und -Diagnose, Oszilloskop-Praxis). Ein Autor hat für die Messkarten ${g.ids.join(', ')} neue Signalbilder erstellt. Datei: ${SCR}/cards/${g.key}.js
Bericht des Autors (JSON): ${JSON.stringify(a)}

Prüfe adversarial: Geh davon aus, dass Fehler drin sind, und finde sie. Du änderst die Datei NICHT.
Lies ${SCR}/kit/API.md (Regeln). Dann:
1. Werkzeug selbst ausführen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef  (Anzahl Werkzeugfehler melden).
2. JEDES Einzelbild in ${SCR}/out/${g.key}-pruef mit Read ansehen. Je Bild prüfen:
   - Physik: Stimmen Pegel, Frequenz/Drehzahlbezug, Zeitverhältnisse und Kurvenform mit der Realität am echten Oszi?
   - Zahlen in title/caption/why/notes: durch Quelle belegt oder per expect gemessen? Passt der Text zum Bild?
   - Fehlerbilder: realistisch, eindeutig erkennbar, vom ähnlichsten Fehler unterscheidbar, Sollbild vorhanden?
   - Lesbarkeit: Labels über der Kurve? Signal sinnvoll skaliert?
3. Quellen unabhängig prüfen: Tools laden mit ToolSearch "select:WebSearch,WebFetch". Öffne die zitierten Quellen und prüfe, ob sie die Aussagen wirklich belegen. Recherchiere zusätzlich selbst je Karte mindestens die 3 wichtigsten Kennwerte gegen eine ZWEITE, unabhängige Quelle.
4. Fehlen Zustände oder Fehlerbilder, die eine Werkstatt bei diesem Sensor typischerweise braucht?
5. Vom Autor gemeldete textFehler (in den bestehenden Kartentexten) bestätigen oder verwerfen, mit Quelle.

verdict "ok" nur, wenn keine blockierenden Mängel bleiben. Blockierend = fachlich falsch, Physik falsch, Zahl ohne Beleg, irreführendes Bild, unlesbar, Werkzeug meldet Fehler. Jede Beanstandung mit konkretem Fix-Vorschlag und Beleg (URL oder physikalische Begründung). Schreibe nur in ${SCR}/out.
Antwort: der strukturierte Prüfbericht.`
}

function fixPrompt(g, a, v) {
  return `Du bist der Autor der Signalbilder für die Messkarten ${g.ids.join(', ')} (Fortsetzung). Datei: ${SCR}/cards/${g.key}.js
Dein bisheriger Bericht (JSON): ${JSON.stringify(a)}
Befunde des unabhängigen Prüfers (JSON): ${JSON.stringify(v)}

Lies ${SCR}/kit/API.md. Arbeite ALLE blockierenden Befunde ein, dazu die sinnvollen minor-Befunde. Widersprichst du einem Befund fachlich, begründe das mit Quelle (nicht stillschweigend ignorieren). Ergänze fehlende Zustände und Fehlerbilder, die der Prüfer nennt, wenn sie belegbar sind. Tools für Recherche: ToolSearch "select:WebSearch,WebFetch".
Prüfen: ${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}  bis 0 Fehler. Geänderte Einzelbilder mit Read ansehen. node --check auf die Datei.
Regeln wie in API.md: nichts erfinden, nur in ${SCR}/cards und ${SCR}/out schreiben.
Antwort: der strukturierte Bericht, inklusive "behoben" und "nichtBehoben" (mit Begründung).`
}

function reverifyPrompt(g, fx, v) {
  return `Du bist unabhängiger, strenger Fachprüfer (zweite Runde) für die Signalbilder der Messkarten ${g.ids.join(', ')}. Datei: ${SCR}/cards/${g.key}.js
Deine erste Prüfung (JSON): ${JSON.stringify(v)}
Korrekturbericht des Autors (JSON): ${JSON.stringify(fx)}

Prüfe gezielt, ob alle blockierenden Befunde wirklich behoben sind: Werkzeug ausführen (${kitCmd} ${SCR}/cards/${g.key}.js ${SCR}/out/${g.key}-pruef2), betroffene und neue Einzelbilder mit Read ansehen, die Quellen der Korrekturen öffnen (ToolSearch "select:WebSearch,WebFetch"). Sind durch die Korrektur neue Probleme entstanden? Begründete Widersprüche des Autors fair bewerten. Gleiche Bewertungsregeln wie in Runde 1. verdict "ok" nur ohne blockierende Mängel. Datei NICHT ändern; nur in ${SCR}/out schreiben.
Antwort: der strukturierte Prüfbericht.`
}

function catalogPrompt(bereich, inhalt) {
  return `Du bist Kfz-Diagnose-Experte (Elektrik/Elektronik). Erstelle einen vollständigen, quellenbelegten Katalog ALLER am Kraftfahrzeug mit einem Oszilloskop messbaren Signale für den Bereich: ${bereich}.
Umfang: ${inhalt}
Zielgerät: OWON VDS1022I (2 Kanäle, 25 MHz, 100 MS/s, 8 Bit, 5000 Punkte; isoliert gegen USB, Kanäle untereinander mit gemeinsamer Masse; mit 10:1-Tastkopf bis ~400 V Spitze-Spitze).
Bereits vorhandene Messkarten im Kompendium (id – Name): ${CARDLIST}

Für jedes Signal: Name, System, Signalart (analog/digital/PWM/Strom/induktiv/Bus/…), typische Werte (Pegel, Frequenz, Zeiten; immer mit „typ." und Hinweis, wenn herstellerabhängig), ob es oszi-relevant ist (sinnvolle Diagnose mit dem Oszi möglich), ob und wie es mit dem VDS1022I messbar ist (z. B. „ja", „nur mit Stromzange", „nur mit Differenztastkopf", „nein: zu schnell/zu hohe Spannung"), Sicherheitshinweis (Airbag/Pyrotechnik: niemals messen; Hochvolt: nur mit Qualifikation), ob es durch eine vorhandene Karte abgedeckt ist (Karten-ID oder „fehlt"), Priorität für eine neue Karte (hoch = häufige Werkstattmessung).
Recherche: Tools laden mit ToolSearch "select:WebSearch,WebFetch". Quellen: Pico Technology (picoauto.com), Bosch, Hella TechWorld, Normen, Herstellerunterlagen. Öffne die Quellen, zitiere nichts Ungelesenes. Lieber vollständig und ehrlich unsicher als erfunden. Schreibe nichts ins Repository.
Antwort: der strukturierte Katalog.`
}

const workP = pipeline(GROUPS,
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
const catP = parallel([
  () => agent(catalogPrompt('Sensoren', 'Motor (Drehzahl/Position, Luft, Druck, Temperatur, Klopfen, Kraftstoff), Abgas/Lambda/Abgasnachbehandlung, Getriebe/Antriebsstrang, Fahrwerk/Bremse/ESP/Lenkung, Klima/Komfort/Karosserie/Assistenz (Ultraschall, Regen/Licht, Füllstände)'), { label: 'katalog:sensoren', phase: 'Katalog', schema: CATALOG_SCHEMA }),
  () => agent(catalogPrompt('Aktoren, Zündung, Versorgung, Bussysteme, Hochvolt', 'Einspritzung (alle Arten), Zündung primär/sekundär, Ventile/Stellmotoren/Pumpen/Lüfter/Glühanlage/Starter/Generator, Bordnetz und Sensorversorgung (5-V-Referenz, Masse, Ruhestrom), Bussysteme (CAN, CAN-FD, LIN, FlexRay, SENT, PSI5-Hinweis, Automotive Ethernet), Hochvolt/E-Antrieb (Resolver, Phasenströme, DC/DC)'), { label: 'katalog:aktoren-bus-hv', phase: 'Katalog', schema: CATALOG_SCHEMA }),
])
const [work, catalog] = await Promise.all([workP, catP])
return { work, catalog }
