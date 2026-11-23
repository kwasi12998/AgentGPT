#!/bin/bash
# Rendert Speaker-Spots (60 s) komplett: Vorschau-Server, Sounddesign, Bilder, Musik, Sprecherstimme, Mux.
# Aufruf (im Repo-Root oder beliebig): bash speakingstage-promo/tools/render_spot.sh <slug> [<slug> …]
# Benötigt: Playwright + Chromium, ffmpeg, Python mit numpy, Zugang zu openrouter.ai (Sprecherstimme).
set -u
P=$(cd "$(dirname "$0")/.." && pwd); ROOT=$(dirname "$P"); NP=$(npm root -g)
W=${WORK:-$(mktemp -d)}
(cd "$ROOT" && exec python3 -m http.server 8766 >/dev/null 2>&1) &
SRV=$!; sleep 2
for s in "$@"; do
  S=$W/$s; mkdir -p "$S"; cd "$S"
  NODE_PATH=$NP node "$P/tools/sfxdump.js" "$S/sfx.json" "$s.html"
  PIDS=""; for i in 0 1 2 3; do a=$((i*455)); b=$(((i+1)*455)); [ $b -gt 1818 ] && b=1818
    PAGE=$s.html NODE_PATH=$NP node "$P/tools/render_times.js" "$S/s$i.mp4" $a $b > "$S/log$i.txt" 2>&1 & PIDS="$PIDS $!"; done
  (cd "$P/tools" && python3 music_social.py "$S/sfx.json" "$P/tools/cuts_spot.json" "$S/music.wav") > "$S/music.log" 2>&1
  python3 -I "$P/tools/voiceover.py" "$P/tools/voiceover_$s.json" "$S/music.wav" "$S/vo" "$S/mix.wav" sarah > "$S/vo.log" 2>&1 || { echo "FEHLER Sprecherstimme $s:"; tail -3 "$S/vo.log"; }
  wait $PIDS
  [ -f "$S/mix.wav" ] || { echo "ABBRUCH $s: kein mix.wav"; continue; }
  printf "file 's0.mp4'\nfile 's1.mp4'\nfile 's2.mp4'\nfile 's3.mp4'\n" > "$S/l.txt"
  ffmpeg -v error -y -f concat -safe 0 -i "$S/l.txt" -i "$S/mix.wav" -map 0:v -map 1:a -c:v libx264 -preset medium -crf 21 -maxrate 8M -bufsize 16M -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$P/$s-spot-60s.mp4"
  echo "FERTIG $s $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$P/$s-spot-60s.mp4") $(grep -c OVER "$S/vo.log") OVER"
done
kill $SRV 2>/dev/null
echo ALLE_FERTIG
