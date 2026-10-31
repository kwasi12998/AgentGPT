"""Voiceover mit ElevenLabs v4 über OpenRouter erzeugen und unter das Video mischen.

Aufruf: python3 voiceover.py voiceover.json music.wav workdir out.wav [stimme]
- erzeugt pro Zeile eine MP3 über /api/v1/audio/speech (Modell elevenlabs/eleven-v4)
- passt zu lange Zeilen mit leichtem Tempo-Ausgleich ins Zeitfenster
- senkt die Musik unter der Stimme ab (Ducking) und schreibt den fertigen Mix
"""
import json, os, subprocess, sys, wave
import numpy as np

SR = 44100
MODEL = 'elevenlabs/eleven-v4'


def tts(text, voice, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return
    body = json.dumps({'model': MODEL, 'input': text, 'voice': voice, 'response_format': 'mp3'})
    # Der Proxy der Umgebung ergänzt die Authentifizierung; der Header-Wert ist ein Platzhalter.
    r = subprocess.run(['curl', '-sS', '-m', '120', '-o', path, '-w', '%{http_code}', 'https://openrouter.ai/api/v1/audio/speech',
                        '-H', 'Authorization: Bearer placeholder', '-H', 'Content-Type: application/json', '-d', body],
                       capture_output=True, text=True)
    if r.stdout.strip() != '200':
        raise RuntimeError(f'TTS fehlgeschlagen ({r.stdout}): {open(path, errors="ignore").read()[:300]}')


def decode(path, tempo=1.0):
    af = ['-af', f'atempo={tempo:.4f}'] if abs(tempo - 1) > 1e-3 else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, *af, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def trim(x, thr=.01):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(0, idx[0] - 600):idx[-1] + 2000] if len(idx) else x


def main(script, music, work, out, voice='george'):
    os.makedirs(work, exist_ok=True)
    lines = json.load(open(script))
    w = wave.open(music); n = w.getnframes()
    mus = np.frombuffer(w.readframes(n), '<i2').reshape(-1, 2).astype(np.float64) / 32767; w.close()
    vo = np.zeros(len(mus))
    report = []
    for i, (t0, text) in enumerate(lines):
        p = os.path.join(work, f'line{i:02d}.mp3')
        tts(text, voice, p)
        x = trim(decode(p))
        window = (lines[i + 1][0] if i + 1 < len(lines) else len(mus) / SR - .6) - t0 - .2
        tempo = 1.0
        if len(x) / SR > window:
            tempo = min(1.15, len(x) / SR / window)
            x = trim(decode(p, tempo))
        a = int(t0 * SR); x = x[:len(vo) - a]
        vo[a:a + len(x)] += x
        report.append((t0, round(len(x) / SR, 2), round(window, 2), round(tempo, 3), text[:48]))
    # Lautheit der Stimme angleichen (RMS über gesprochene Teile)
    act = np.abs(vo) > .02
    vo *= .16 / np.sqrt((vo[act] ** 2).mean())
    # Ducking: Hüllkurve der Stimme, Attack 40 ms, Release 350 ms
    e = np.abs(vo); env = np.zeros_like(e); g = 0.0
    a_c, r_c = np.exp(-1 / (.04 * SR)), np.exp(-1 / (.35 * SR))
    for k in range(0, len(e), 64):
        v = e[k:k + 64].max()
        g = a_c * g + (1 - a_c) * v if v > g else r_c * g + (1 - r_c) * v
        env[k:k + 64] = g
    duck = 1 - .58 * np.clip(env / .05, 0, 1)
    mix = mus * duck[:, None] + np.stack([vo, vo], 1) * 1.0
    mix /= max(1.0, np.abs(mix).max() / .95)
    wo = wave.open(out, 'wb'); wo.setnchannels(2); wo.setsampwidth(2); wo.setframerate(SR)
    wo.writeframes((mix * 32767).astype('<i2').tobytes()); wo.close()
    for r in report: print(*r)


if __name__ == '__main__':
    main(*sys.argv[1:])
