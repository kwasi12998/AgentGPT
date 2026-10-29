// Generates the voice-over segments from src/voscript.json and writes src/vo.json (file names + durations).
//
//   node scripts/make-vo.mjs                                      (default: ElevenLabs models via OpenRouter /audio/speech;
//                                                                  key from OPENROUTER_API_KEY or an injected network secret)
//   node scripts/make-vo.mjs --audition                           (same sentence in 8 voices -> public/vo/audition-<model>/)
//   add --script=showreel to use src/voscript-showreel.json (-> src/vo-showreel.json, public/vo-showreel/)
//   node scripts/make-vo.mjs --placeholder                        (silent stand-ins sized by word count; tests timing without a key)
//   ELEVENLABS_API_KEY=... + "provider": "elevenlabs" in voscript.json uses the ElevenLabs API directly (voice = voice id)
//
// Overrides: VO_MODEL, VO_VOICE. Unchanged segments (same text, model, voice, settings) are not regenerated, so re-runs cost nothing.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Node's fetch ignores HTTPS_PROXY by default. Behind an egress proxy (which may also inject the OpenRouter secret) re-run
// this script once with proxy support and the proxy's CA bundle.
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const ca = process.env.NODE_EXTRA_CA_CERTS || (fs.existsSync('/root/.ccr/ca-bundle.crt') ? '/root/.ccr/ca-bundle.crt' : undefined);
  const r = spawnSync(process.execPath, process.argv.slice(1), {stdio: 'inherit', env: {...process.env, NODE_USE_ENV_PROXY: '1', ...(ca ? {NODE_EXTRA_CA_CERTS: ca} : {}), NODE_NO_WARNINGS: '1'}});
  process.exit(r.status ?? 1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const which = (process.argv.find((a) => a.startsWith('--script=')) || '').slice('--script='.length); // e.g. --script=showreel
const sfx = which ? `-${which}` : '';
const script = JSON.parse(fs.readFileSync(path.join(root, `src/voscript${sfx}.json`), 'utf8'));
const voFile = path.join(root, `src/vo${sfx}.json`);
const outDir = path.join(root, `public/vo${sfx}`);
fs.mkdirSync(outDir, {recursive: true});

const args = new Set(process.argv.slice(2));
const provider = script.provider;
const model = process.env.VO_MODEL || script.model;
const voice = process.env.VO_VOICE || script.voice;

const probe = (file) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

// OPENROUTER_API_KEY if set; otherwise no Authorization header, because a network secret on the environment (header
// "Authorization: Bearer <key>" for openrouter.ai) is injected by the proxy.
const orHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Title': 'SpeakingStage video',
  ...(process.env.OPENROUTER_API_KEY ? {Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`} : {})
});

async function synth(text, ctx = {}) {
  for (let attempt = 0; ; attempt++) {
    let r;
    if (provider === 'openrouter') {
      r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
        method: 'POST',
        headers: orHeaders(),
        body: JSON.stringify({model, input: text, voice, response_format: 'mp3'})
      });
    } else {
      const key = process.env.ELEVENLABS_API_KEY;
      if (!key) throw new Error('ELEVENLABS_API_KEY is not set');
      r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: {'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg'},
        body: JSON.stringify({text, model_id: model, voice_settings: script.voiceSettings, previous_text: ctx.prev, next_text: ctx.next})
      });
    }
    if (r.status === 429 && attempt < 3) {
      await new Promise((res) => setTimeout(res, 2000 * 2 ** attempt));
      continue;
    }
    if (r.status === 401 && provider === 'openrouter') throw new Error('HTTP 401: neither OPENROUTER_API_KEY nor an injected Authorization header (network secret for openrouter.ai) is available');
    if (!r.ok) throw new Error(`HTTP ${r.status} ${await r.text()}`);
    return Buffer.from(await r.arrayBuffer());
  }
}

if (args.has('--audition')) {
  const dir = path.join(outDir, `audition-${model.split('/').pop()}`);
  fs.mkdirSync(dir, {recursive: true});
  const sample = 'Veranstalter suchen Keynote Speaker. Doch wo sind Sie? Reichen Sie jetzt Ihr Profil ein, kostenlos und in etwa einer Minute.';
  for (const v of ['george', 'brian', 'daniel', 'adam', 'sarah', 'alice', 'laura', 'matilda']) {
    process.env.VO_VOICE = v;
    const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: orHeaders(),
      body: JSON.stringify({model, input: sample, voice: v, response_format: 'mp3'})
    });
    if (!r.ok) throw new Error(`${v}: HTTP ${r.status} ${await r.text()}`);
    fs.writeFileSync(path.join(dir, `${v}.mp3`), Buffer.from(await r.arrayBuffer()));
    console.log('audition', v);
  }
  process.exit(0);
}

const placeholder = args.has('--placeholder');
const old = fs.existsSync(voFile) ? JSON.parse(fs.readFileSync(voFile, 'utf8')) : {segments: {}};
const result = {placeholder, provider: placeholder ? 'placeholder' : provider, model: placeholder ? null : model, voice: placeholder ? null : voice, segments: {}};
const scenes = script.scenes;
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  const file = `vo${sfx}/${s.id}.mp3`;
  const abs = path.join(root, 'public', file);
  const hash = crypto.createHash('sha1').update(JSON.stringify([placeholder, s.text, provider, model, voice, script.voiceSettings])).digest('hex');
  const prev = old.segments[s.id];
  if (prev && prev.hash === hash && fs.existsSync(abs)) {
    result.segments[s.id] = prev;
    console.log(s.id, 'unchanged', prev.dur.toFixed(2) + 's');
    continue;
  }
  if (placeholder) {
    const dur = s.text.split(/\s+/).length / 2.3;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', dur.toFixed(2), '-q:a', '9', abs]);
  } else {
    try {
      fs.writeFileSync(abs, await synth(s.text, {prev: scenes[i - 1]?.text, next: scenes[i + 1]?.text}));
    } catch (e) {
      throw new Error(`${s.id}: ${e.message}`);
    }
  }
  result.segments[s.id] = {file, dur: probe(abs), hash, text: s.text};
  console.log(s.id, placeholder ? 'placeholder' : 'generated', result.segments[s.id].dur.toFixed(2) + 's');
}
fs.writeFileSync(voFile, JSON.stringify(result, null, 2));
console.log(`wrote src/vo${sfx}.json`);
