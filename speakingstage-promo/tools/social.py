"""60-Sekunden-Schnitt (LinkedIn) aus der 3-Minuten-Engine ableiten.

Jedes Segment ist (Quelle von, Quelle bis, Tempo). Daraus entstehen:
- times.json: Quellzeit pro Ausgabe-Frame (30 fps) für den Neu-Render
- sfx_social.json: Sound-Ereignisse der Engine auf die neue Zeitachse gelegt
- cuts.json: Schnittpunkte (für Akzente in der Musik)
Aufruf: python3 social.py sfx.json outdir
"""
import json, sys

FPS = 30
CH = [48, 67, 88, 112, 132]
card = lambda T: (T + 1.0, T + 1.9, 1.3)   # Kapitelkarte als kurzer Titel-Flash

EDIT = [
    (0.6, 5.9, 1.8),        # Notiz tippt
    (13.4, 20.6, 1.8),      # Wand aus Profilen
    (21.0, 28.4, 2.4),      # Honorar · Termin · Mail
    (31.0, 34.3, 1.5),      # „Sondern, wer passt.“
    (34.5, 40.6, 1.6),      # Logo + Claim
    card(CH[0]), (52.0, 64.5, 2.5),                       # 01 Beschreiben
    card(CH[1]), (69.5, 78.6, 2.6), (82.6, 87.5, 2.2),    # 02 Entdecken
    card(CH[2]), (91.0, 95.6, 2.0), (95.6, 104.3, 2.0), (108.3, 111.3, 2.0),  # 03 Vergleichen
    card(CH[3]), (115.0, 126.0, 2.8), (125.2, 129.0, 1.9),                    # 04 Anfragen
    card(CH[4]), (134.6, 149.6, 3.0),                     # 05 Entscheiden
    (150.6, 155.6, 1.8),    # Kevin
    (164.0, 168.4, 2.0),    # Bühnenmomente
    (169.2, 174.6, 1.8),    # 150+ / Claim
    (175.0, 178.8, 1.15),   # Endcard
]


def build(sfx_path, outdir):
    sfx = json.load(open(sfx_path))
    times, cuts, ev, o = [], [], [], 0.0
    for a, b, s in EDIT:
        cuts.append(round(o, 3))
        n = round((b - a) / s * FPS)
        times += [round(a + k / FPS * s, 4) for k in range(n)]
        last_key = -1
        for e in sfx:
            if a <= e['t'] < b:
                t = o + (e['t'] - a) / s
                if e['type'] == 'key':
                    if t - last_key < .07: continue
                    last_key = t
                ev.append({'t': round(t, 3), 'type': e['type'], 'v': e['v'] * (.7 if e['type'] == 'key' else 1)})
        o += n / FPS
    json.dump(times, open(f'{outdir}/times.json', 'w'))
    json.dump(sorted(ev, key=lambda e: e['t']), open(f'{outdir}/sfx_social.json', 'w'))
    json.dump({'cuts': cuts, 'dur': round(o, 3)}, open(f'{outdir}/cuts.json', 'w'))
    print('Dauer', round(o, 2), 's,', len(times), 'Frames')
    for (a, b, s), c in zip(EDIT, cuts): print(f'{c:6.2f}  Quelle {a:6.1f}–{b:6.1f}  x{s}')


if __name__ == '__main__':
    build(*sys.argv[1:])
