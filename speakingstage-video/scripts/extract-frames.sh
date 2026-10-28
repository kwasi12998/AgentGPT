#!/usr/bin/env bash
# Decodes the committed screen recordings (public/rec-*.webm) into JPEG frame sequences
# (public/frames/<name>/NNNN.jpg) that the 3D phone uses as its screen texture.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in public/rec-*.webm; do
  n=$(basename "$f" .webm); n=${n#rec-}
  mkdir -p "public/frames/$n"
  ffmpeg -v error -y -i "$f" -q:v 4 "public/frames/$n/%04d.jpg"
  echo "frames: $n $(ls public/frames/$n | wc -l)"
done
