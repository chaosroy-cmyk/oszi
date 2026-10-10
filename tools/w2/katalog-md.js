/* Erzeugt docs/SIGNAL-KATALOG.md aus docs/signal-katalog.json.  node tools/w2/katalog-md.js */
const fs=require('fs'), path=require('path'); const D=path.resolve(__dirname,'..','..','docs');
const C=JSON.parse(fs.readFileSync(process.argv[2]||path.join(D,'signal-katalog.json'),'utf8')); const out=process.argv[3]||path.join(D,'SIGNAL-KATALOG.md');
const esc=s=>String(s==null?'':s).replace(/\|/g,'\\|').replace(/\n/g,' ');
const all=C.flatMap(c=>c.signale);
const isMissing=s=>/^fehlt|eigene Karte fehlt/i.test(s.abgedecktDurch||'');
const prio={hoch:0,mittel:1,niedrig:2};
const L=[];
L.push('# Signal-Katalog: am Fahrzeug messbare Signale','');
L.push('Stand: V13.2 (Oktober 2026). Planungsgrundlage für die nächsten Messkarten des Kompendiums.','');
L.push('**So ist der Katalog entstanden:** Zwei Recherche-Agenten haben den Katalog erstellt, getrennt nach Sensoren sowie Aktoren, Zündung, Versorgung, Bussen und Hochvolt. Als Quellen dienten Pico Technology (Guided Tests, Forum), Bosch, Hella, Normen und Herstellerunterlagen. Unter „Quellen“ steht nur, was tatsächlich geöffnet und gelesen wurde. Werte ohne Quelle sind als „nicht quellengeprüft“ bzw. „Fachwissen“ gekennzeichnet. Die Websuche war gegen Ende der Recherche ausgeschöpft, deshalb sind einige Randbereiche dünner belegt.','');
L.push('**Wichtig:** Dieser Katalog ist eine Arbeitsliste, kein geprüfter Kartentext. In die App kommen Werte erst, wenn eine Karte nach dem Verfahren Autor → unabhängige Prüfung → Korrektur gebaut ist. So wurden auch die 20 Sensor- und Lambdakarten in V11 die 16 neuen Sensorkarten in V12 die 18 Aktor-, Bordnetz- und Buskarten in V13 sowie 6 weitere Aktor- und Zündungskarten in V13.2 erstellt.','');
L.push('> **Sicherheit:** Airbag, Gurtstraffer, PSI5 und alle pyrotechnischen Kreise werden **niemals** angemessen, nur mit dem Diagnosetester nach Herstellervorgabe. Hochvolt nur mit HV-Qualifikation, Herstellervorgaben, PSA und CAT-bewertetem Zubehör. Der VDS1022I hat keine bekannte CAT-Einstufung, und seine Kanäle haben eine gemeinsame Masse.','');
const nRel=all.filter(s=>s.oszirelevant).length, nMiss=all.filter(isMissing).length;
L.push('## Überblick','');
L.push('| | Anzahl |','|---|---|');
L.push('| Signale gesamt | '+all.length+' |');
L.push('| davon mit dem Oszi sinnvoll diagnostizierbar | '+nRel+' |');
L.push('| durch eine Karte (ganz oder teilweise) abgedeckt | '+all.filter(s=>!isMissing(s)&&!/nicht anwendbar/i.test(s.abgedecktDurch)).length+' |');
L.push('| noch ohne eigene Karte | '+nMiss+' |');
L.push('| nicht anwendbar (kein Oszi-Thema oder Messverbot) | '+all.filter(s=>/nicht anwendbar/i.test(s.abgedecktDurch)).length+' |','');
L.push('## Fehlende Karten nach Priorität','');
L.push('Signale, die mit dem Oszi sinnvoll messbar sind und noch keine eigene Karte haben. Priorität „hoch“ heißt: häufige Werkstattmessung.','');
L.push('| Priorität | Signal | System | Messbar mit VDS1022I |','|---|---|---|---|');
all.filter(s=>isMissing(s)&&s.oszirelevant).sort((a,b)=>(prio[a.prioritaet]-prio[b.prioritaet])||a.system.localeCompare(b.system,'de'))
  .forEach(s=>L.push('| '+esc(s.prioritaet)+' | '+esc(s.name)+' | '+esc(s.system)+' | '+esc(s.messbarMitVDS1022)+' |'));
L.push('');
C.forEach(c=>{
  const i=c.bereich.search(/[(|]/), title=(i>0?c.bereich.slice(0,i):c.bereich).trim(), note=i>0?c.bereich.slice(i).replace(/^[(|]\s*/,'').replace(/\)\s*$/,''):'';
  L.push('## '+title,''); if(note) L.push('> '+esc(note),'');
  const bySys={}; c.signale.forEach(s=>(bySys[s.system]=bySys[s.system]||[]).push(s));
  Object.keys(bySys).forEach(sys=>{
    L.push('### '+sys,'');
    bySys[sys].forEach(s=>{
      L.push('**'+s.name+'** · '+s.signalart+' · Priorität '+s.prioritaet+' · Karte: '+(s.abgedecktDurch||'–')+(s.oszirelevant?'':' · *kein Oszi-Thema*'),'');
      if(s.typischeWerte) L.push('- Typische Werte: '+s.typischeWerte);
      if(s.messbarMitVDS1022) L.push('- VDS1022I: '+s.messbarMitVDS1022);
      if(s.sicherheit) L.push('- Sicherheit: '+s.sicherheit);
      if(s.quellen&&s.quellen.length) L.push('- Quellen: '+s.quellen.map(q=>/^https?:/.test(q)?'<'+q+'>':q).join(' · '));
      L.push('');
    });
  });
});
fs.writeFileSync(out, L.join('\n')); console.log('Zeilen', L.length, 'fehlend+relevant', all.filter(s=>isMissing(s)&&s.oszirelevant).length);
