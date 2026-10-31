#!/bin/sh
# Turns the generated originals in design/images/incoming into web-sized files the app serves.
# Run from the repository root:  sh design/images/build.sh
# Needs cwebp (brew install webp) and macOS sips. Originals stay untouched in incoming/.
set -eu
SRC="design/images/incoming/ResumeLoop_All_Images_PNG"
OUT="apps/web/public/images/art"
PUB="apps/web/public"
mkdir -p "$OUT"

# Illustrations: 640 and 1280 wide WebP for srcset.
for name in hero-dusk-road github-social no-webgl-road pilot-how-it-works privacy-local sdg4-lifelong-learning \
            stop-cover stop-empathise stop-define stop-ideate stop-prototype stop-test stop-impact stop-closing \
            empty-plan initial-hero-dusk-road-concept initial-paper-cut-light-style initial-paper-cut-dark-style; do
  for w in 640 1280; do
    cwebp -quiet -q 78 -m 6 -resize "$w" 0 "$SRC/$name.png" -o "$OUT/$name-$w.webp"
  done
done

# Link preview background. The card (apps/web/app/opengraph-image.jpg) was rendered once from it with the title set in
# code by next/og, then saved as an 84% JPEG (about 220 KB; WhatsApp skips previews over roughly 300 KB). See the commit adding it.
sips -s format jpeg -s formatOptions 80 --resampleHeightWidth 630 1120 "$SRC/og-share.png" --out "design/images/og-share-background.jpg" >/dev/null

# App icons from the 1:1 icon.
sips -s format png -z 180 180 "$SRC/app-icon.png" --out "$PUB/apple-touch-icon.png" >/dev/null
sips -s format png -z 192 192 "$SRC/app-icon.png" --out "$PUB/icon-192.png" >/dev/null
sips -s format png -z 512 512 "$SRC/app-icon.png" --out "$PUB/icon-512.png" >/dev/null
du -ch "$OUT"/*.webp | tail -1
