# CHANGELOG v8.15-Profi — Bewegungsreduktion vollständig, Kontraste systematisch geprüft

## Befund · `prefers-reduced-motion` deckte 3 von 11 Bewegungen ab

Der Block lautete:

```css
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  .overlay{transition:none}
  .install-banner{animation:none}
}
```

Im Stylesheet stehen aber **zehn Transitions und eine Animation** — darunter
`transition:transform .2s`, `transition:opacity .2s,transform .2s` und mehrere
kurze Übergänge an Karten, Chips und Buttons. Wer Bewegungsreduktion einstellt,
bekam sie weiterhin.

Diese Systemeinstellung wird nicht aus Geschmack gesetzt: Vestibuläre Störungen,
Migräne und Anfallsleiden sind die üblichen Gründe. Eine Einstellung teilweise
zu respektieren, hilft dort niemandem.

**Änderung:** globale Fassung nach dem üblichen Muster —
`animation-duration`, `animation-iteration-count`, `transition-duration` und
`scroll-behavior` für alle Elemente samt Pseudoelementen.

**Restdauer statt 0:** `.01ms` statt `0s`, damit ein `transitionend` weiterhin
feuert, falls je Code darauf hört.

**Und die Verzögerungen mit:** Das Overlay schaltet `visibility` über eine
`transition-delay` von 0,26 s (`visibility 0s linear .26s`). Die
`transition-duration` allein hätte diese Verzögerung stehen lassen — der
Transform wäre durch, die Sichtbarkeit erst eine Viertelsekunde später
umgeschaltet. Die alte Einzelregel `.overlay{transition:none}` hatte das
mit abgedeckt; beim Ersetzen wäre es sonst verloren gegangen. Deshalb
`transition-delay` und `animation-delay` ebenfalls auf `0s`.

## Kontraste: von zwei Stichproben auf die ganze Palette

`validate.js` prüfte bislang **zwei fest verdrahtete Farbpaare** (weiße Schrift
auf Light-Accent und Light-Blue). Jetzt rechnet der Validator die
WCAG-Kontrastformel für **alle acht Textfarben** der Palette gegen **beide**
Hintergründe (`--bg`, `--card`) in **beiden** Schemata durch — 32 Paare.

Ergebnis der Bestandsprüfung: **alle bestehen**. Das Minimum liegt bei 4,74:1
(`--red` auf `--card` im Dunkelschema), das Maximum bei 17,48:1. Es gab hier
nichts zu reparieren — aber ab jetzt fällt eine Palettenänderung, die einen
Kontrast unter 4,5:1 drückt, sofort auf, statt bis zur nächsten Sichtprüfung
unentdeckt zu bleiben.

## Regression

`validate.js` Abschnitt 30, 5 Prüfungen (176 → 181).

## Geprüft und für korrekt befunden

- Service Worker, Cache-Isolation, Precache, Update-Banner und
  Versionssynchronität: bereits durch Abschnitt 13 abgedeckt, unverändert grün.
- Fokus-Trap, `inert`-Hintergrund, `aria-current`, `aria-pressed`, dekorative
  Emoji als `aria-hidden`, Touchziele ≥ 44 px: Abschnitt 14, unverändert grün.
- Hell-/Dunkelschema mit genau einem Light-Block an der richtigen Stelle:
  Abschnitt 15, unverändert grün.
- `role="dialog"`, `aria-modal`, `aria-live`, `@media print`, `:focus-visible`
  und `lang` sind vorhanden.
