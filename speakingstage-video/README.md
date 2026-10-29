# SpeakingStage – Speaker-Recruiting-Video (9:16)

Motion Graphic für `speakingstage.com/speaker-werden`, gebaut mit [Remotion](https://github.com/remotion-dev/remotion) und three.js (`@remotion/three`).

| Komposition | Inhalt |
|---|---|
| `SpeakerV2` (aktuell, 40 s, 1080×1920) | Durchgehende 3D-Kamerafahrt: Logo, 3D-Handy mit echter Screenrecord der KI-Suche, Speaker-Slalom mit bekannten, gelisteten Namen, Formular-Screenrecord, Karte DACH, Bühne, Claim und Aufruf |
| `ShowreelChris` (40 s, 1080×1080) | Showreel für ein Speaker-Profil (Chris-Aike Spring) im LinkedIn-Quadrat: Intro, Porträt, Karrierestationen, Foto-Ring, Handy mit echter Profil-Aufnahme, Keynotes, Zitat, Karte, Aufruf |
| `Speaker` (v1, 30 s) | Erste, rein 2D-basierte Version |

Fertige Videos: `speakingstage-speaker.mp4` (v1), `speakingstage-speaker-v2.mp4` (v2, 9:16), `speakingstage-speaker-v2-16x9.mp4` (v2, 16:9), mit Voice-over: `speakingstage-speaker-v2-vo.mp4` (9:16) und `speakingstage-speaker-v2-vo-16x9.mp4` (16:9)

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

## Showreel für ein Speaker-Profil

```bash
cd capture && node profile.cjs <slug> <ausgabeordner>          # Texte, Bilder, Videos des Profils auslesen (nur lesend)
npm run record:profile -- <slug> <name>                        # Screenrecord des Profils (public/rec-<name>.webm)
npm run frames                                                 # JPEG-Folgen für die Handy-Textur
npm run audio:showreel                                         # Musik und SFX (scripts/make-audio-showreel.mjs, getaktet auf src/timing3.json)
npm run render:showreel                                        # 1080x1080
npm run vo:showreel                                            # Voice-over (src/voscript-showreel.json -> src/vo-showreel.json)
npm run audio:showreel-vo                                      # Musik und SFX auf die gedehnte Zeitachse
npm run render:showreel-vo                                     # Komposition ShowreelChrisVO (mit Sprecher)
```

Inhalte (Texte, Keynotes, Stationen, Fotos) stammen ausschließlich aus dem öffentlichen Profil und stehen in `src/showreel/worlds.tsx` und `src/showreel/Showreel.tsx`. Sensible private Angaben aus der Biografie sind bewusst nicht enthalten.

## Voice-over (ElevenLabs über OpenRouter)

Zusätzliche Kompositionen `SpeakerV2VO` (9:16) und `SpeakerV2VOWide` (16:9). Sie laufen mit gedehnten Verweilzonen (`src/warp.ts`), damit die Sprache Platz hat: Handy, Karte und Bühne bleiben länger stehen, Kamerafahrten und Schnitte behalten ihr Tempo. Musik, SFX und Sprecher werden auf dieselbe Zeitachse gelegt, die Musik wird unter der Stimme abgesenkt.

```bash
# Key: entweder Umgebungsvariable OPENROUTER_API_KEY oder ein Netzwerk-Secret für openrouter.ai
# (Header "Authorization", Präfix "Bearer ", Wert = Key). Nie ins Repo oder in den Chat.
npm run frames                       # Handy-Texturen erzeugen (einmalig pro Umgebung)
npm run vo -- --audition             # derselbe Satz in 8 Stimmen -> public/vo/audition/*.mp3
VO_VOICE=george npm run vo           # Stimme wählen und alle Segmente erzeugen (src/vo.json)
npm run audio:vo                     # Musik + SFX auf die gedehnte Zeitachse legen
npm run render:vo                    # 9:16
npm run render:vo-wide               # 16:9
```

- Sprechtext, Modell und Stimme: `src/voscript.json`. Geänderte Segmente werden neu erzeugt, unveränderte nicht (keine unnötigen Kosten).
- Modell per `VO_MODEL` wählbar, z. B. `elevenlabs/eleven-v3` (ausdrucksstärker) oder `elevenlabs/eleven-multilingual-v2` (Standard, ruhig und stabil).
- Ohne Key kann die Zeitachse mit `npm run vo:placeholder` (stille Platzhalter nach Wortzahl) getestet werden. `src/vo.json` enthält dann `placeholder: true`.
- Alternativ direkt über ElevenLabs: `"provider": "elevenlabs"` in `src/voscript.json` und `ELEVENLABS_API_KEY`.

## Wichtige Hinweise

- **Screenrecords:** Das Formular auf `/speaker-werden` wird nur mit Demo-Daten ausgefüllt und **nie abgeschickt**.
- **Speaker-Namen und Fotos:** Liste in `src/three/cards.tsx` (`SPEAKERS`), Fotos in `public/speakers/`. Die Verwendung von Namen und Fotos für Werbung muss mit den Personen geklärt sein.
- **3D ohne Grafikkarte:** `--gl=swangle` (Software-Renderer). Mit `angle` oder `swiftshader` scheitert der WebGL-Kontext in der Cloud-Umgebung.
- **Handy-Screen:** Die Aufnahmen werden als JPEG-Folge geladen (kein H.264 im Playwright-Chromium nötig). `public/frames/` ist per `.gitignore` ausgenommen und wird mit `npm run frames` erzeugt.

CI: Inter, Kupfer `#a7643c`, Navy `#162131`, Creme `#f7f3ee`, weißer Hintergrund.
