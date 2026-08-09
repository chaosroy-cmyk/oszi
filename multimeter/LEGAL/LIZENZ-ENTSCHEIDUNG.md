# Lizenzmodell — Entscheidungsvorlage

> **Diese Entscheidung wurde bewusst nicht getroffen.** Sie steht dem
> Herausgeber zu und wirkt sich unmittelbar auf `LICENSE`, README und die Frage
> aus, was Werkstätten mit den Inhalten tun dürfen.

## Die Besonderheit dieses Projekts

Es sind zwei verschiedene Dinge in einer Datei:

1. **Der Code** — Aufbau der App, Renderer, Service Worker, Validator. Technisch
   ersetzbar, für sich genommen wenig wert.
2. **Die Inhalte** — 77 Prüfkarten, 15 Diagnosebäume, Anleitungen,
   Fehlerursachen, Quellenmatrix. Das ist die eigentliche Arbeit und der Grund,
   warum jemand die App benutzt.

Beide brauchen nicht dieselbe Lizenz. Genau daraus ergibt sich Variante C.

## Die Varianten

### A · Proprietär, alle Rechte vorbehalten

Der heutige Zustand (`© 2026 RS – Alle Rechte vorbehalten`).

- **Dafür:** Volle Kontrolle. Keine fremden Ableitungen, keine verfälschten
  Kopien mit falschen Messwerten, die unter demselben Namen kursieren. Bei einem
  Werkzeug, mit dem an sicherheitsrelevanten Systemen gearbeitet wird, ist das
  ein ernst zu nehmendes Argument.
- **Dagegen:** Keine Beiträge von außen. Keine Verbreitung über
  Werkstattnetzwerke oder Berufsschulen ohne Einzelabsprache. Ohne
  Weiterentwicklung veralten die Inhalte.
- **Wenn später anders entschieden wird:** jederzeit möglich — von
  restriktiv nach offen kann man gehen, umgekehrt praktisch nicht.

### B · Quelloffen (z. B. MIT oder Apache-2.0) für alles

- **Dafür:** Maximale Verbreitung. Berufsschulen und Betriebe können die App
  anpassen. Fehler in Werten werden eher gemeldet und korrigiert.
- **Dagegen:** Auch die Inhalte sind frei kopier- und veränderbar. Eine Kopie mit
  geänderten Sollwerten darf existieren, weiterverbreitet werden und trägt
  denselben Ursprung. Apache-2.0 enthält im Unterschied zu MIT eine ausdrückliche
  Patent- und Markenklausel und eine dokumentierte Haftungsbeschränkung — für
  dieses Projekt der geeignetere der beiden.

### C · Getrennt: Code quelloffen, Inhalte Creative Commons

Zum Beispiel Apache-2.0 für den Code und CC BY-NC-SA 4.0 für die Prüfkarten,
Anleitungen und Diagnosebäume.

- **Dafür:** Passt zur tatsächlichen Struktur des Projekts. Der Code ist frei
  nachnutzbar; die fachlichen Inhalte bleiben an Namensnennung und die
  Bedingung gebunden, dass Bearbeitungen unter derselben Lizenz weitergegeben
  werden. Eine kommerzielle Verwertung durch Dritte lässt sich ausschließen.
- **Dagegen:** Erklärungsbedarf. Die Grenze zwischen „Code" und „Inhalt" muss in
  `LICENSE` und README klar gezogen werden — in einer Single-File-App stehen
  beide in derselben Datei. **Zu klären:** ob eine Trennung nach Dateien
  überhaupt praktikabel ist oder ob die Daten dafür ausgelagert werden müssten.
- CC-Lizenzen mit `NC` gelten außerdem als schwer abzugrenzen: Ob die Nutzung in
  einem gewerblichen Kfz-Betrieb „nicht-kommerziell" ist, ist eine ernsthafte
  Streitfrage — und die Werkstattnutzung ist der erklärte Zweck.

## Was in jedem Fall gilt

- Der Urheberrechtsvermerk lautet **© 2026 RS** — entschieden.
- Die Quellenmatrix (`SOURCES.md`) verweist auf fremde Datenblätter und Normen.
  Verlinkt und zitiert wird, nichts davon wird mitgeliefert. Normtexte (ISO, IEC,
  DIN) sind selbst urheberrechtlich geschützt und dürfen unabhängig von der hier
  gewählten Lizenz **nicht** in die App übernommen werden. Diese Grenze bleibt
  bei jeder Variante bestehen.
- `LICENSE` liegt derzeit nur als Gerüst vor und ist als Entwurf gekennzeichnet.
  Solange keine Entscheidung getroffen ist, gilt gesetzlich ohnehin der volle
  Rechtsvorbehalt — Variante A ist damit der Zustand, der ohne Handlung eintritt.

## Empfehlung des Autors dieses Dokuments

Keine. Die Abwägung zwischen Verbreitung und Kontrolle über sicherheitsrelevante
Messwerte ist eine unternehmerische Entscheidung, keine technische.
