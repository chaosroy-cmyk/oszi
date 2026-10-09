/* BEISPIEL für die API (Format, Modell-Stil, expect). Die Zahlen sind NICHT quellengeprüft —
   wer die Karte kw-ind bearbeitet, muss jeden Wert selbst belegen oder per expect absichern. */

/* @models */
/* Induktiver KW-Geber am Zahnrad mit Lücke (Standard 60-2).
   Physik: Zahnfrequenz = Drehzahl/60 * Zähne -> bei 60 Zähnen: f[Hz] = n[1/min].
   Induzierte Spannung ~ Flussänderung pro Zeit ~ Drehzahl (1. Näherung linear).
   p: rpm, a800 (Scheitel bei 800/min, V), teeth, miss, ph0 (Startphase in Umdrehungen), gain (Luftspalt), seed, noise */
SIG.M.kwIndBsp = function (p) {
  var rpm = p.rpm != null ? p.rpm : 800, a800 = p.a800 != null ? p.a800 : 2.4, teeth = p.teeth || 60,
      miss = p.miss != null ? p.miss : 2, ph0 = p.ph0 || 0, gain = p.gain != null ? p.gain : 1,
      nz = SIG.lib.vnoise(p.seed || 11, p.noise != null ? p.noise : 0.03, 2e-5);
  return function (t) {
    var pos = ((rpm / 60) * t + ph0) * teeth, k = ((Math.floor(pos) % teeth) + teeth) % teeth, fr = pos - Math.floor(pos);
    var a = a800 * (rpm / 800) * gain;
    if (k >= teeth - miss) return 0.04 * a * Math.sin(fr * Math.PI) + nz(t);
    return a * (k === 0 ? 1.35 : 1) * Math.sin(fr * 2 * Math.PI) + nz(t);
  };
};
/* @end-models */

/* @quellen */
QUELLEN["kw-ind"] = [
  "BEISPIEL – keine echte Quelle. Hier stehen URL + was belegt wird."
];
/* @end-quellen */

CARDPATCH["kw-ind"] = {
gut:[
  W2({ badge:"GUT", title:"Leerlauf 800 /min", cond:"Motor warm, Leerlauf", vdiv:2, tdiv:0.010, trig:{t:0.010, v:1},
    ch:[{ m:"kwIndBsp", p:{ rpm:800, ph0:0.8067 }, lbl:"KW" }],
    meas:[ {t:"vpp", x:0.975}, {t:"span", t0:0.0145, t1:0.0895, v:-6.2, pre:"1 Umdrehung =", post:"→ 800 /min"} ],
    notes:[ {t:0.0133, v:0, txt:"Lücke (2 Zähne fehlen)", dy:-118, dx:46} ],
    expect:[ {what:"freq", v:800, tolRel:0.01} ],
    caption:"BEISPIEL: dichtes Sinusband, einmal pro Umdrehung die Lücke.",
    why:"BEISPIEL: 60 Zähne pro Umdrehung → Zahnfrequenz in Hz = Drehzahl in 1/min." }),
  W2({ badge:"GUT", title:"Zoom auf die Lücke", cond:"Leerlauf 800 /min", vdiv:1, tdiv:0.001,
    ch:[{ m:"kwIndBsp", p:{ rpm:800, ph0:0.9133 }, lbl:"KW" }],
    meas:[ {t:"span", t0:0.0015, t1:0.00275, v:-3.2, pre:"Zahn", post:"→ 800 Hz"} ],
    expect:[ {what:"freq", v:800, tolRel:0.02, t0:0, t1:0.004} ],
    caption:"BEISPIEL: einzelne Zähne, Lücke 2,5 ms.", why:"BEISPIEL." })
],
schlecht:[
  W2({ badge:"FEHLER", title:"Amplitude zu klein (Luftspalt)", cond:"Leerlauf 800 /min", vdiv:2, tdiv:0.010,
    ch:[{ m:"kwIndBsp", p:{ rpm:800, ph0:0.8067, gain:0.25 }, lbl:"KW" }],
    ghost:[{ m:"kwIndBsp", p:{ rpm:800, ph0:0.8067 } }],
    expect:[ {what:"vpp", max:2.0} ],
    caption:"BEISPIEL: Frequenz stimmt, Amplitude deutlich unter Sollbild.", why:"BEISPIEL." })
]};
