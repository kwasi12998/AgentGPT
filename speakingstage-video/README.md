# SpeakingStage – Speaker-Recruiting-Video (9:16)

Motion Graphic für `speakingstage.com/speaker-werden`, gebaut mit [Remotion](https://github.com/remotion-dev/remotion) und three.js (`@remotion/three`).

| Komposition | Inhalt |
|---|---|
| `SpeakerV2` (aktuell, 40 s, 1080×1920) | Durchgehende 3D-Kamerafahrt: Logo, 3D-Handy mit echter Screenrecord der KI-Suche, Speaker-Slalom mit bekannten, gelisteten Namen, Formular-Screenrecord, Karte DACH, Bühne, Claim und Aufruf |
| `Speaker` (v1, 30 s) | Erste, rein 2D-basierte Version |

Fertige Videos: `speakingstage-speaker.mp4` (v1), `speakingstage-speaker-v2.mp4` (v2, 9:16), `speakingstage-speaker-v2-16x9.mp4` (v2, 16:9)

## Befehle

```bash
npm i
npm run record      # Screenrecords der Live-Seite aufnehmen (Playwright, Frame für Frame)
npm run frames      # Aufnahmen (public/rec-*.webm) in JPEG-Folgen für die Handy-Textur umwandeln
npm run audio       # Musik und SFX synthetisch erzeugen (scripts/make-audio2.mjs, getaktet auf src/timing2.json)
npm run studio      # Vorschau im Remotion Studio
npm run render:v2   # 9:16 rendern (Software-WebGL, ca. 30 Min.)
npm run render:wide # 16:9 rendern (Komposition SpeakerV2Wide)
npm run stills -- out/review 0.4 100 300 700   # einzelne Frames zur schnellen Kontrolle
```

## Wichtige Hinweise

- **Screenrecords:** Das Formular auf `/speaker-werden` wird nur mit Demo-Daten ausgefüllt und **nie abgeschickt**.
- **Speaker-Namen und Fotos:** Liste in `src/three/cards.tsx` (`SPEAKERS`), Fotos in `public/speakers/`. Die Verwendung von Namen und Fotos für Werbung muss mit den Personen geklärt sein.
- **3D ohne Grafikkarte:** `--gl=swangle` (Software-Renderer). Mit `angle` oder `swiftshader` scheitert der WebGL-Kontext in der Cloud-Umgebung.
- **Handy-Screen:** Die Aufnahmen werden als JPEG-Folge geladen (kein H.264 im Playwright-Chromium nötig). `public/frames/` ist per `.gitignore` ausgenommen und wird mit `npm run frames` erzeugt.

CI: Inter, Kupfer `#a7643c`, Navy `#162131`, Creme `#f7f3ee`, weißer Hintergrund.
