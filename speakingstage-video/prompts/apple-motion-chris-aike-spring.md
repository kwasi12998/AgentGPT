# Prompt: Apple-Motion-Video "Chris-Aike Spring" (Entwurf 1, zur Freigabe)

## 1. Ziel
Ein 30-sekündiges, cinematisches Motion-Video im Stil **Apple Product Motion**: Cinematic Product Motion, Minimalist Product Animation, Kinetic Typography, Morphing Motion.
Dramaturgie: **erst Neugier erzeugen, dann die Speakerin zeigen, dann den USP hervorheben.**
Zielgruppe: Veranstalter und Entscheider. Ziel-Handlung: Anfrage über SpeakingStage.

## 2. Format und Technik
- 1080 × 1080 (1:1, LinkedIn-Feed), ca. 30 s, 30 fps, Render mit 1,5-fachem Supersampling (Kanten glatt, kein Flimmern).
- Remotion + three.js. Sprache: Deutsch.
- Zeitachse folgt der Sprache (audio-first): Typo und Sprecherin sind bildgenau synchron (±3 Frames).

## 3. Stil
- Minimalistisches, cinematisches 3D. Wenige, große, saubere Formen. Viel Leerraum.
- **Licht:** weiche Reflexionen, großflächige Softbox-Highlights, dezente Spitzlichter, ein schmales Kupfer-Rimlight. Keine harten Schatten. Glänzender Boden bzw. Glasfläche mit weicher Spiegelung.
- **Hintergrund:** dunkler Verlauf Navy `#162131` → Schwarz (Neugier, Morph). Beim Reveal weicher Lichtwisch zu Weiß/Creme `#f7f3ee` (Reveal, USP, Aufruf).
- **CI (nur Farben und Typo):** Kupfer `#a7643c`, Navy `#162131`, Creme `#f7f3ee`, Weiß, Schwarz. Schrift: **Inter** (ExtraBold für Headlines, Medium für Zusatzzeilen). Keine weiteren Farben.
- **Typografie:** groß, klar, höchstens 4 Wörter pro Bild. Kupfer nur für ein Schlüsselwort pro Bild. Mindestgröße 44 px.

## 4. Bewegung
- Smooth und kontrolliert, mit präzisem Easing.
- Eintritte: `cubic-bezier(0.22, 1, 0.36, 1)`. Übergänge: ease-in-out (cubic). Typische Dauer 0,6 bis 1,4 s.
- Kamera: langsame Dolly- und Orbit-Fahrten (höchstens 25°), gleichmäßige Geschwindigkeit, sanfte Tiefenunschärfe.
- **Verboten:** Wackeln, Schweben/Bobbing, Überschwinger, harte Schnitte (stattdessen Lichtwisch oder Morph).
- **Rahmen:** Alles liegt vollständig im Bild, mindestens 6 % Randabstand. Nichts wird abgeschnitten.

## 5. Dramaturgie und Shotliste (Richtwerte, final bestimmt die Sprache die Länge)

| Zeit | Phase | Bild | Typo / Stimme |
|---|---|---|---|
| 0–6 s | **Neugier** | Navy-Schwarz-Verlauf. Ein leerer, schlichter Stuhl (Holz/Metall) im weichen Spotlight auf spiegelndem Boden. Sehr langsame Dolly-Fahrt. Dein Publikumsfoto steht dunkel und unscharf dahinter (Bokeh). | Groß: **„Wer nimmt diesen Platz ein?"** (Kupfer: „Platz"). Alice spricht den Satz. |
| 6–11 s | **Morph** | Der Stuhl löst sich in Lichtpartikel auf und morpht zu einem klassischen Bühnenmikrofon, mit Kupfer-Reflexion. Sanfter Orbit. | Klein: **„Eine Stimme mit Haltung."** Alice spricht den Satz. |
| 11–19 s | **Reveal** | Das Highlight des Mikros weitet sich zum Lichtwisch, der Hintergrund wechselt weich zu Weiß/Creme. Ihr Porträt erscheint auf einer schwebenden Glasfläche mit Reflexion und leichtem Parallax. | Name riesig: **„Chris-Aike Spring"**. Darunter: **„Keynote-Speakerin für Female Leadership"**. Alice nennt beides. |
| 19–25 s | **USP** | Das Porträt rückt zur Seite. Drei Wörter füllen nacheinander das Bild und morphen ineinander, jeweils mit Kupfer-Akzent. | **„Klartext. Substanz. Haltung."** Alice spricht die drei Wörter einzeln. |
| 25–30 s | **Aufruf** | Alles beruhigt sich auf Weiß/Creme. | Name, **„Jetzt anfragen."**, `speakingstage.com/speaker/chris-aike-spring`, SpeakingStage-Wortmarke. Alice: „Jetzt anfragen." |

## 6. Sprecherin (Alice, ElevenLabs Eleven v4 über OpenRouter)
Ruhig, tief, ohne Pathos. Insgesamt ca. 20 Wörter:
1. „Wer nimmt diesen Platz ein?"
2. „Eine Stimme mit Haltung."
3. „Chris-Aike Spring. Keynote-Speakerin für Female Leadership."
4. „Klartext. Substanz. Haltung."
5. „Jetzt anfragen."

## 7. Sounddesign und Musik
- Sub-Bass-Schwellen und feine Luft zu Beginn. Ein Glas-/Metall-Resonanzton beim Morph.
- Warmes Pad öffnet sich beim Reveal. Leise, tiefe Treffer bei jedem der drei USP-Wörter.
- Musik minimal (Pad und leichter Puls, kein Beat-Drop). Musik und Effekte werden unter der Stimme abgesenkt.

## 8. Assets
- **Von mir in 3D gebaut:** Stuhl, Bühnenmikrofon, Boden, Glasfläche, Lichtpartikel, Typografie.
- **Von dir:** (1) Porträt in hoher Auflösung (mindestens 2000 px, mit Freigabe von Chris-Aike Spring), (2) Publikumsfoto (dunkel/unscharf, von der Bühne aus oder von hinten).
- Bis die Assets da sind, dienen die Profilfotos (ca. 1100 px) als Platzhalter.

## 9. Inhalt und Freigaben
- Nur Aussagen aus dem öffentlichen Profil. Keine erfundenen Zahlen. Keine privaten Details aus der Biografie. Kein Bezug zu Rostock.
- Fotos und Aussagen müssen von Chris-Aike Spring freigegeben sein.

## 10. Abnahme
- Standbilder je Phase prüfen (nichts abgeschnitten, Text lesbar).
- Bild-zu-Bild-Messung auf Ruhe (kein Zittern).
- Pegelmessung (kein Übersteuern).
- Lieferung: MP4 1080 × 1080, H.264/AAC. Auf Wunsch zusätzlich 9:16 und 16:9.
