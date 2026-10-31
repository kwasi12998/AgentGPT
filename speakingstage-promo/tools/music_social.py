"""Treibende Musik für den 60-Sekunden-LinkedIn-Schnitt.

Nutzt die Instrumente aus music.py, Tempo 124 BPM, Akzente auf jedem Schnitt.
Aufruf: python3 music_social.py sfx_social.json cuts.json out.wav
"""
import json, sys, wave
import numpy as np
import music as M

SR = M.SR
BPM = 124
B = 60 / BPM


def main(sfx_path, cuts_path, out):
    info = json.load(open(cuts_path)); dur = info['dur'] + .8; cuts = info['cuts']
    n = int(dur * SR)
    mus = np.zeros((n, 2)); fx = np.zeros((n, 2)); rev = np.zeros(n)

    def put(sig, t0, pan=0.0, gain=1.0, bus=None, r=0.0):
        bus = mus if bus is None else bus
        i = int(t0 * SR)
        if i >= n: return
        s = sig[:n - i] * gain
        bus[i:i + len(s), 0] += s * (1 - max(0, pan)); bus[i:i + len(s), 1] += s * (1 + min(0, pan))
        if r: rev[i:i + len(s)] += s * r

    NOTE = M.NOTE
    prog = [(45, [57, 60, 64, 69]), (41, [57, 60, 65, 69]), (48, [60, 64, 67, 72]), (43, [55, 59, 62, 67])]
    bar = 4 * B
    for bt in range(int(dur / B)):
        t = bt * B; root, ch = prog[int(t // (2 * bar)) % 4]
        intro = t < 2.9
        drop = 12.2 <= t
        if not intro:
            put(M.kick(.85 if drop else .6), t)
            if bt % 2 == 1 and drop: put(M.clap(.9), t, r=.25)
            for q in (0, .5):
                put(M.shaker(.9 if q else .5), t + q * B, pan=.3 if q else -.3)
            put(M.bass(NOTE(root), .4, .9), t); put(M.bass(NOTE(root + 12), .2, .45), t + B * .5)
        arp = [ch[i % 4] + 12 for i in (0, 1, 2, 3, 2, 1, 2, 3)]
        for q in range(2):
            put(M.pluck(NOTE(arp[(bt * 2 + q) % 8]), .4, .55 if intro else .8), t + q * B / 2, pan=-.35 if q else .35, r=.2)
        if bt % 8 == 0:
            put(M.pad([NOTE(x) for x in ch], 8 * B + .4, .55 if not drop else .7, 1800), t, r=.3)
        if drop and bt % 4 == 0:
            put(M.piano(NOTE(ch[(bt // 4) % 4] + 24), 1.3, .45), t, pan=.4, r=.4)
    # Steigerungen und Akzente
    put(M.noise_sweep(2.6, 300, 8000, .8, 'rise'), 9.6, r=.2)
    put(M.noise_sweep(2.0, 300, 8000, .7, 'rise'), 50.3, r=.2)
    for c in cuts[1:]:
        put(M.noise_sweep(.35, 1500, 9000, .35, 'bell'), c - .18, bus=fx)
    for c in (12.2, 52.1):
        put(M.sfx_impact(.7), c, bus=fx); put(M.sfx_bloom(.6), c, bus=fx, r=.3)
    for e in json.load(open(sfx_path)):
        f = M.SFX.get(e['type'])
        if f and e['type'] not in ('bloom', 'impact', 'swirl'):
            put(f(e['v']), e['t'], gain=.8, bus=fx, r=.12 if e['type'] in ('chime', 'node', 'hit') else 0)
    put(M.piano(NOTE(45), 4, 1.0), info['dur'] - 2.6, r=.6)
    for x in (57, 60, 64, 69): put(M.piano(NOTE(x), 4, .55), info['dur'] - 2.58, r=.6)
    t = np.arange(int(2.0 * SR)) / SR; ir = M.lp(np.random.default_rng(3).standard_normal(len(t)), 5000) * np.exp(-t / .6); ir /= np.sqrt((ir ** 2).sum())
    k = len(rev) + len(ir); wet = np.fft.irfft(np.fft.rfft(rev, k) * np.fft.rfft(ir, k), k)[:n] * .4
    mix = np.tanh((mus + fx + wet[:, None]) * 1.1)
    mix /= np.abs(mix).max()
    fade = np.ones(n); i = int((dur - 1.2) * SR); fade[i:] = np.linspace(1, 0, n - i)
    mix = mix * fade[:, None] * .89
    w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes()); w.close()
    print('ok', round(dur, 2))


if __name__ == '__main__':
    main(*sys.argv[1:])
