#!/usr/bin/env bash
# build-dist.sh — erzeugt das oeffentliche Deploy-Verzeichnis dist/ aus einer
# Public-Whitelist. Backend (bridge.py), Tests, *.cmd, Doku (*.txt/*.md) und
# PROMPT_V10.md landen bewusst NICHT im Deploy (kein Datenleck auf Cloudflare).
#
# Nutzung:
#   bash build-dist.sh          # lokal / in der CI
#   -> dist/ enthaelt nur die auszuliefernden Dateien
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DIST="$ROOT/dist"

rm -rf "$DIST"
mkdir -p "$DIST"

# --- Public-Whitelist: KFZ-Oszi-App ---
cp "$ROOT/index.html"           "$DIST/"
cp "$ROOT/manifest.webmanifest" "$DIST/"
cp "$ROOT/service-worker.js"    "$DIST/"
cp "$ROOT/_headers"             "$DIST/"
cp -r "$ROOT/icons"             "$DIST/"

# --- Zweit-App: Multimeter (eigene PWA mit eigenem sw.js/manifest/icons) ---
if [ -d "$ROOT/multimeter" ]; then
  cp -r "$ROOT/multimeter"      "$DIST/"
fi

echo "dist/ gebaut. Enthaltene Dateien:"
find "$DIST" -type f | sed "s#$DIST/#  #" | sort
