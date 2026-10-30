/* Quelltext des ausgelieferten Blocks oszi-decode (für Stilprüfungen der Tests) */
const fs = require('node:fs'), path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const m = html.match(/<script id="oszi-decode">([\s\S]*?)<\/script>/);
if(!m) throw new Error('Block oszi-decode fehlt');
/* ohne die Node-Exportzeile am Blockende */
module.exports = m[1].replace(/^if\(typeof module[^\n]*$/m, '');
