"""Musik + Sounddesign für das SpeakingStage-Erklärvideo (180 s, 120 BPM).

Aufruf: python3 music.py sfx.json out.wav
sfx.json wird aus promo.html exportiert (window.SFX) und enthält alle
Klick-, Tipp- und Übergangsgeräusche mit exakter Zeit.
"""
import json, sys, wave
import numpy as np

SR = 44100
DUR = 180.6
BPM = 120
B = 60 / BPM
N = int(DUR * SR)
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)
MUS_L = np.zeros(N); MUS_R = np.zeros(N)   # Musikbus (wird geduckt)
REV = np.zeros(N)                          # Hallbus


def tarr(d): return np.arange(int(d * SR)) / SR


def put(sig, t0, pan=0.0, gain=1.0, bus='mus', rev=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[:N - i] * gain
    l, r = (1 - max(0, pan)), (1 + min(0, pan))
    if bus == 'mus': MUS_L[i:i + len(s)] += s * l; MUS_R[i:i + len(s)] += s * r
    else: L[i:i + len(s)] += s * l; R[i:i + len(s)] += s * r
    if rev: REV[i:i + len(s)] += s * rev


def lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); n = min(6000, int(6 / (1 - a)) + 1)
    return np.convolve(x, (1 - a) * a ** np.arange(n))[:len(x)]


def hp(x, fc): return x - lp(x, fc)


def env(t, a, d): return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


# ---------- Instrumente ----------
def piano(f, d=2.4, v=1.0):
    t = tarr(d); s = 0
    for k, (amp, dec) in enumerate([(1, 1.4), (.45, .9), (.25, .6), (.12, .4), (.07, .3)], 1):
        s = s + amp * np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * t) * np.exp(-t / (dec * (1.6 - min(f, 1200) / 1600)))
    hammer = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / .004) * .05
    return (s * np.minimum(1, t / .003) + hammer) * .22 * v


def pad(freqs, d, v=1.0, bright=1600):
    t = tarr(d); s = 0
    for f in freqs:
        for det in (-.005, 0, .005):
            ph = rng.random() * 6
            s = s + np.sin(2 * np.pi * f * (1 + det) * t + ph) + .3 * np.sin(4 * np.pi * f * (1 + det) * t + ph)
    a = np.minimum(1, t / 1.2) * np.minimum(1, (d - t) / 1.2)
    return lp(s, bright) * a * .028 * v


def pluck(f, d=.5, v=1.0):
    t = tarr(d); s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.4 for k in (1, 2, 3, 4))
    return lp(s, f * 4) * env(t, .002, .16) * .17 * v


def bass(f, d=.48, v=1.0):
    t = tarr(d); s = np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.3 * s) * env(t, .006, .32) * .42 * v


def kick(v=1.0):
    t = tarr(.5); f = 48 + 90 * np.exp(-t / .03); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.4 * np.sin(ph) * np.exp(-t / .2)) * .75 * v


def clap(v=1.0):
    t = tarr(.35); n = rng.standard_normal(len(t))
    e = np.exp(-t / .08) + .7 * np.exp(-((t - .01) % .011) / .003) * (t < .035)
    return hp(lp(n, 5000), 1200) * e * .28 * v


def shaker(v=1.0):
    t = tarr(.08); return hp(rng.standard_normal(len(t)), 6000) * env(t, .008, .02) * .12 * v


def bell(f, d=2.5, v=1.0):
    t = tarr(d)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 1.2) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / .5) + .2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / .25)
    return s * np.minimum(1, t / .002) * .16 * v


def noise_sweep(d, f0, f1, v=1.0, shape='rise'):
    t = tarr(d); n = rng.standard_normal(len(t)); out = np.zeros(len(t)); seg = 2048
    for i in range(0, len(t), seg):
        q = i / len(t); fc = f0 * (f1 / f0) ** q
        out[i:i + seg] = lp(n[i:i + seg + 4000], fc)[:len(out[i:i + seg])]
    e = {'rise': (t / d) ** 2, 'bell': np.sin(np.pi * t / d) ** 2, 'fall': np.exp(-t / (d * .3))}[shape]
    return hp(out, 200) * e * .5 * v


# ---------- Sounddesign ----------
def add(*sigs):
    n = max(len(x) for x in sigs); out = np.zeros(n)
    for x in sigs: out[:len(x)] += x
    return out


def sfx_key(v): t = tarr(.05); return hp(rng.standard_normal(len(t)), 2500) * env(t, .001, .006) * .12 * v + np.sin(2 * np.pi * 1700 * t) * env(t, .001, .004) * .05 * v
def sfx_click(v): t = tarr(.12); return (np.sin(2 * np.pi * 2200 * t) * env(t, .001, .01) * .35 + hp(rng.standard_normal(len(t)), 3000) * env(t, .001, .006) * .3 + np.sin(2 * np.pi * 140 * t) * env(t, .002, .03) * .4) * v
def sfx_pop(v): t = tarr(.25); f = 380 + 600 * np.exp(-t / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, .002, .06) * .35 * v
def sfx_tick(v): t = tarr(.1); return np.sin(2 * np.pi * 3200 * t) * env(t, .001, .012) * .25 * v
def sfx_chime(v): return add(bell(1318.5, 2.2, .9 * v), bell(1975.5, 2.0, .45 * v))
def sfx_node(v, k=[0]): f = [523.25, 587.33, 659.25, 783.99, 1046.5][k[0] % 5]; k[0] += 1; return add(bell(f, 1.8, 1.1 * v), pluck(f, .5, .8 * v))
def sfx_stamp(v): t = tarr(.6); return (np.sin(2 * np.pi * np.cumsum(90 * np.exp(-t / .1) + 40) / SR) * env(t, .002, .12) * .9 + lp(rng.standard_normal(len(t)), 1500) * env(t, .001, .05) * .5) * v
def sfx_ring(v):
    t = tarr(1.4); tr = (np.sin(2 * np.pi * 22 * t) > 0).astype(float)
    s = (np.sin(2 * np.pi * 1300 * t) + np.sin(2 * np.pi * 1640 * t)) * tr * ((t < .5) | ((t > .7) & (t < 1.2)))
    return lp(s, 4000) * .07 * v
def sfx_hit(v): return add(kick(.55 * v), bell(659.25 * 2, 1.2, .35 * v))
def sfx_impact(v): t = tarr(2.5); return (np.sin(2 * np.pi * np.cumsum(60 * np.exp(-t / .5) + 30) / SR) * env(t, .005, .8) + lp(rng.standard_normal(len(t)), 900) * env(t, .002, .4) * .4) * .6 * v
def sfx_bloom(v): t = tarr(2.4); return add(pad([261.63, 329.63, 392, 523.25], 2.4, 3.2 * v, 2400) * np.exp(-t / 1.2), bell(1046.5, 2.2, .5 * v))


SFX = {'key': sfx_key, 'click': sfx_click, 'pop': sfx_pop, 'tick': sfx_tick, 'chime': sfx_chime, 'node': sfx_node,
       'stamp': sfx_stamp, 'ring': sfx_ring, 'hit': sfx_hit, 'impact': sfx_impact, 'bloom': sfx_bloom,
       'whoosh': lambda v: noise_sweep(.7, 400, 6000, v, 'bell'), 'swoosh': lambda v: noise_sweep(.5, 800, 9000, .8 * v, 'bell'),
       'plane': lambda v: noise_sweep(1.4, 500, 7000, v, 'bell'), 'swirl': lambda v: noise_sweep(1.8, 200, 5000, v, 'rise')}

# ---------- Harmonie ----------
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)
MAJ = [  # (Basston, Akkordtöne) je 2 Takte = 4 s
    (48, [60, 64, 67, 71]),   # Cmaj7
    (45, [57, 60, 64, 67]),   # Am7
    (41, [57, 60, 64, 65]),   # Fmaj7
    (43, [55, 59, 62, 67]),   # G
]
MIN = [(45, [57, 60, 64]), (41, [57, 60, 65]), (38, [57, 62, 65]), (40, [56, 59, 64])]  # Am F Dm E


def section(t):
    for a, b, n in [(0, 13, 'hook'), (13, 34, 'problem'), (34, 48, 'reveal'), (48, 88, 'groove1'), (88, 132, 'groove2'),
                    (132, 150, 'build'), (150, 164, 'trust'), (164, 175, 'finale'), (175, 999, 'outro')]:
        if a <= t < b: return n


def compose():
    nbeats = int(180 / B)
    for bt in range(nbeats):
        t = bt * B; sec = section(t)
        bar4 = int(t // 4)
        if sec in ('problem',):
            root, ch = MIN[bar4 % 4]
        else:
            root, ch = MAJ[bar4 % 4]
        first = abs(t - bar4 * 4) < 1e-6
        # Pads
        if first and sec not in ('hook',):
            vol = {'problem': .6, 'reveal': .6, 'groove1': .55, 'groove2': .6, 'build': .75, 'trust': .45, 'finale': .8, 'outro': .7}[sec]
            put(pad([NOTE(n) for n in ch], 4.6 if sec != 'outro' else 6.5, vol, 1400 if sec != 'build' else 2200), t, rev=.3)
        # Hook: einzelne Klaviertöne
        if sec == 'hook' and bt % 4 == 0 and t > .3:
            put(piano(NOTE(ch[(bt // 4) % len(ch)] + 12), 3, .8), t, pan=.2, rev=.5)
        # Problem: pochender Puls + tiefe Achtel
        if sec == 'problem':
            put(bass(NOTE(root), .4, .55 + .35 * (t - 13) / 21), t, bus='mus')
            put(bass(NOTE(root), .3, .35), t + B / 2)
            if bt % 2 == 0: put(piano(NOTE(ch[-1] + 12), 1.2, .5), t + B * .5, pan=-.3, rev=.5)
            if t >= 21: put(shaker(.7), t + B / 2)
        # Reveal: Klavier-Motiv
        if sec == 'reveal' and bt % 2 == 0:
            mel = [72, 76, 79, 76, 74, 72, 71, 67]
            put(piano(NOTE(mel[(bt // 2) % 8]), 2.6, .9), t, pan=.15, rev=.6)
        # Groove-Teile
        if sec in ('groove1', 'groove2', 'build', 'finale'):
            if bt % 2 == 0: put(kick(.8 if sec != 'groove1' else .6), t)
            if bt % 4 == 2 and sec != 'groove1': put(clap(.8), t, rev=.3)
            for q in (0, .5):
                put(shaker(.8 if q else .5), t + q * B, pan=.3 if q else -.3)
            put(bass(NOTE(root), .45, .8), t)
            if bt % 2 == 1: put(bass(NOTE(root + 12), .3, .4), t + B * .5)
            arp = [ch[i % len(ch)] + 12 for i in (0, 1, 2, 3, 2, 1)]
            for q in range(2):
                n = arp[(bt * 2 + q) % len(arp)]
                put(pluck(NOTE(n), .45, .7 if sec == 'groove1' else .85), t + q * B / 2, pan=(-.35 if q else .35), rev=.25)
            if sec in ('build', 'finale') and bt % 2 == 0:
                put(piano(NOTE(ch[(bt // 2) % len(ch)] + 24), 1.4, .45), t, pan=.4, rev=.5)
        # Vertrauen: Klavier + Pad, intim
        if sec == 'trust':
            if bt % 2 == 0: put(piano(NOTE(ch[(bt // 2) % len(ch)] + 12), 2.2, .75), t, pan=-.1, rev=.6)
            if bt % 4 == 0: put(bass(NOTE(root), 1.2, .5), t)
        # Outro: Schlussakkord
    put(piano(NOTE(48), 5, 1.0), 175, rev=.6); put(piano(NOTE(60), 5, .8), 175.02, rev=.6)
    for n in (64, 67, 71, 76): put(piano(NOTE(n), 5, .6), 175.05, rev=.7)
    # Steigerungen vor Wendepunkten
    for t0, d in [(31.5, 2.5), (45.8, 2.2), (129.6, 2.4), (161.8, 2.2), (172.4, 2.2)]:
        put(noise_sweep(d, 300, 8000, .7, 'rise'), t0, rev=.2)


def mix(sfx_path, out):
    compose()
    events = json.load(open(sfx_path))
    kicks = []
    for e in events:
        f = SFX.get(e['type'])
        if not f: continue
        sig = f(e['v'])
        pan = (rng.random() - .5) * .3 if e['type'] == 'key' else 0
        put(sig, e['t'], pan=pan, gain=.9, bus='fx', rev=.15 if e['type'] in ('chime', 'node', 'bloom', 'hit') else 0)
    # Duck: Musik leiser unter Sprache-artigen Momenten nicht nötig; sanfte Pumpe auf Kicks im Groove
    side = np.ones(N)
    for bt in range(int(180 / B)):
        t = bt * B
        if section(t) in ('groove1', 'groove2', 'build', 'finale') and bt % 2 == 0:
            i = int(t * SR); n = int(.25 * SR); tt = np.arange(min(n, N - i)) / SR
            side[i:i + len(tt)] *= 1 - .35 * np.exp(-tt / .1)
    ml = MUS_L * side; mr = MUS_R * side
    # Hall
    t = tarr(2.4); ir = lp(rng.standard_normal(len(t)), 5000) * np.exp(-t / .7); ir /= np.sqrt((ir ** 2).sum())
    n = len(REV) + len(ir); wet = np.fft.irfft(np.fft.rfft(REV, n) * np.fft.rfft(ir, n), n)[:N] * .45
    l = ml + L + wet; r = mr + R + np.roll(wet, int(.011 * SR))
    l = np.tanh(l * 1.1); r = np.tanh(r * 1.1)
    m = max(np.abs(l).max(), np.abs(r).max()); l /= m; r /= m
    fade = np.ones(N); i = int((DUR - 2.0) * SR); fade[i:] = np.linspace(1, 0, N - i) ** 1.5; fade[:300] = np.linspace(0, 1, 300)
    st = (np.stack([l * fade, r * fade], 1) * .89 * 32767).astype('<i2')
    w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()


if __name__ == '__main__':
    mix(sys.argv[1], sys.argv[2])
    print('ok')
