# KFZ-Oszi V13.5.1 – Zeitzoom bei Stop

[ZIP herunterladen](releases/kfz-oszi-v13.5.1.zip?raw=true)

Stop drücken, Zeitbasis ändern und mit dem Regler **Ausschnitt** die vorhandene
Aufnahme verschieben. Währenddessen bleiben beide Kanäle und das Abtastintervall
erhalten; es werden keine Zeitbasisbefehle gesendet. Erst bei Run/Single wird die
neue Zeitbasis für weitere Aufnahmen übernommen. Herauszoomen ist auf die
vorhandene Aufnahmelänge begrenzt. Auch Bibliotheks-Wiedergaben sind zoombar.

108 automatisierte Tests bestanden; zusätzlich alle Kartenbilder validiert.
Die neue Funktion wurde mit simulierter Bridge getestet, nicht mit echter Hardware.

**Sicherheitsstatus:** Die zuvor gemeldete Defender-Erkennung der V13.5 ist weiter
ungeklärt. Dieser Funktionspatch ist keine unabhängige Virenfreigabe. Schutzmaßnahmen
nicht umgehen. Das Originalarchiv V13.5 wurde nicht verändert.

Zum Aktualisieren alte lokale Bridge-/Serverfenster schließen, das neue ZIP in einen
eigenen Ordner entpacken und daraus starten. Bei installierter PWA den Update-Hinweis
beachten. Die ausführliche Änderung und Tests stehen in docs/ZEITZOOM-V13.5.1.md
innerhalb des Archivs und hier im Branch.

Nur Download-Branch: keine Website, keine Actions-Workflows, keine beabsichtigte
Cloudflare-Veröffentlichung. Hauptbranch und lokale Entwicklungsdateien unverändert.
