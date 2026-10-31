# SpeakingStage – Erklärvideo „So einfach geht's“ (3:00)

- `speakingstage-erklaervideo.mp4` – fertiges Video, 1920×1080, 30 fps, mit Musik & Sounddesign
- `promo.html` – Motion-Engine (DOM + CSS-3D, virtuelle Kamera). Über lokalen Server öffnen (`python3 -m http.server`), Klick startet mit Ton.
- `tools/` – `render.js` (frame-genauer Export via Playwright + ffmpeg), `sfxdump.js` (exportiert Sound-Ereignisse), `music.py` (Musik + Sounddesign)

## Dramaturgie
| Zeit | Akt |
|---|---|
| 0:00 | Kaltstart: „Wir brauchen einen Keynote Speaker.“ |
| 0:13 | Problem: Profilflut, Honorar, Verfügbarkeit, interne Begründung |
| 0:34 | SpeakingStage: „Der passende Speaker soll nicht nur gut klingen …“ |
| 0:48 | 01 Beschreiben – KI-Suche in einem Satz |
| 1:07 | 02 Entdecken – begründete Auswahl, 150+ Profile, Filter |
| 1:28 | 03 Vergleichen – Profil, Vortragsvideos, Merkliste |
| 1:52 | 04 Anfragen – unverbindliches Briefing |
| 2:12 | 05 Entscheiden – Fit-Check bis Angebotsannahme |
| 2:30 | Vertrauen – Kevin Kwasniok, geprüft · begleitet · transparent |
| 2:44 | Finale – Bühnenmomente, „150+“, „Weniger suchen. Sicherer entscheiden.“ |

Medien: speakingstage.com (Screens, Speaker-Fotos, Vorschaubilder der Profil-Videos), lucylarbi.de (Bühnenvideo).
Aussagen orientieren sich an der Website und den Vorgaben in speakingstage.com/llms.txt (keine Fixpreise, keine Sofortbuchung, keine Verfügbarkeitsgarantie).

## LinkedIn-Schnitt (60 s)
- `speakingstage-linkedin-60s.mp4` – 60,6 s, 1920×1080, schnelle Neu-Montage aus der Engine (Tempo 1,15–3×, harte Schnitte), eigene 124-BPM-Musik, Voiceover (ElevenLabs v4, Stimme „sarah“).
- Werkzeuge: `tools/social.py` (Schnittliste → Frame-Zeiten), `tools/render_times.js`, `tools/music_social.py`, `tools/voiceover_social.json`.
