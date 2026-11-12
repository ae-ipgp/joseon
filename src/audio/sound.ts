/**
 * Music and sound, synthesized in the browser with the Web Audio API: no audio files to load.
 *
 * The music follows Korean court and folk practice in a simple way. Melodies use the two
 * pentatonic modes, pyeongjo (calm, bright) and gyemyeonjo (plaintive), on a tonic near
 * Eb, the modern pitch of hwangjong. The voices are a plucked gayageum (Karplus-Strong),
 * a breathy daegeum flute with its buzzing membrane, a bowed haegeum for tense scenes,
 * and janggu and buk drums. Long notes carry the vibrato and bent pitches of the style.
 *
 * Browsers only allow sound after the player interacts, so nothing plays until the first tap.
 */

export type Mood = 'menu' | 'day' | 'night' | 'scene' | 'legacy' | 'none';
export type SfxName = 'tap' | 'pluck' | 'stamp' | 'paper' | 'page' | 'drum' | 'honour' | 'coin' | 'gift' | 'bell';

type Voice = 'gayageum' | 'daegeum' | 'haegeum';
type MoodDef = { mode: number[]; bpm: number; lead: Voice; drums: 'none' | 'semachi' | 'heart' | 'slow'; drone: boolean; density: number; register: number };

const PYEONGJO = [0, 2, 5, 7, 9];
const GYEMYEON = [0, 3, 5, 7, 10];
const TONIC = 311.13; // Eb4

const MOODS: Record<Exclude<Mood, 'none'>, MoodDef> = {
  menu: { mode: GYEMYEON, bpm: 54, lead: 'daegeum', drums: 'slow', drone: true, density: 0.8, register: 0 },
  day: { mode: PYEONGJO, bpm: 72, lead: 'gayageum', drums: 'semachi', drone: false, density: 1, register: 0 },
  night: { mode: GYEMYEON, bpm: 44, lead: 'gayageum', drums: 'none', drone: true, density: 0.55, register: -12 },
  scene: { mode: GYEMYEON, bpm: 60, lead: 'haegeum', drums: 'heart', drone: true, density: 0.75, register: -5 },
  legacy: { mode: PYEONGJO, bpm: 48, lead: 'daegeum', drums: 'slow', drone: true, density: 0.7, register: 0 },
};

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let moodBus: GainNode;
let sfxBus: GainNode;
let verb: ConvolverNode;
let verbSend: GainNode;
let noise: AudioBuffer;
const plucks = new Map<number, AudioBuffer>();

let vol = { music: 0.7, sfx: 0.8 };
let mood: Mood = 'none';
let wanted: Mood = 'none';
let timer: ReturnType<typeof setInterval> | null = null;

// Composer state.
let nextNote = 0;
let nextBeat = 0;
let beat = 0;
let step = 2;
let phraseLeft = 0;
let lastFreq = TONIC;
let seed = 1;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const AC: typeof AudioContext | undefined = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;

/** Creates the audio graph on the first user gesture. Safe to call often. */
export function unlock() {
  if (!AC) return;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return;
    }
    build(ctx);
    buildAmbience(ctx);
    seed = (Date.now() & 0xffff) || 1;
    applyVolumes();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend().catch(() => {});
        else ctx.resume().catch(() => {});
      });
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!timer) timer = setInterval(tick, 100);
  if (wanted !== mood) switchMood(wanted);
}

function build(c: AudioContext) {
  master = c.createGain();
  master.gain.value = 0.9;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  master.connect(comp).connect(c.destination);

  verb = c.createConvolver();
  verb.buffer = impulse(c, 2.6, 2.2);
  verbSend = c.createGain();
  verbSend.gain.value = 0.32;
  verbSend.connect(verb).connect(master);

  musicBus = c.createGain();
  moodBus = c.createGain();
  moodBus.gain.value = 0;
  moodBus.connect(musicBus);
  musicBus.connect(master);
  musicBus.connect(verbSend);

  sfxBus = c.createGain();
  sfxBus.connect(master);
  const sfxVerb = c.createGain();
  sfxVerb.gain.value = 0.35;
  sfxBus.connect(sfxVerb).connect(verbSend);

  noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

/** A soft room: decaying noise, a little darker at the end. */
function impulse(c: AudioContext, seconds: number, decay: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      lp += ((Math.random() * 2 - 1) - lp) * (0.6 - t * 0.45);
      d[i] = lp * Math.pow(1 - t, decay);
    }
  }
  return b;
}

/** Volumes from the settings, 0 to 100. */
export function setVolumes(music: number, sfx: number) {
  vol = { music: Math.max(0, Math.min(1, music / 100)), sfx: Math.max(0, Math.min(1, sfx / 100)) };
  applyVolumes();
}
function applyVolumes() {
  if (!ctx) return;
  const t = ctx.currentTime;
  musicBus.gain.setTargetAtTime(vol.music * vol.music * 0.6, t, 0.1);
  sfxBus.gain.setTargetAtTime(vol.sfx * vol.sfx * 0.9, t, 0.05);
}

export function setMood(m: Mood) {
  wanted = m;
  if (ctx && m !== mood) switchMood(m);
}

function switchMood(m: Mood) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const was = mood;
  mood = m;
  moodBus.gain.cancelScheduledValues(t);
  moodBus.gain.setValueAtTime(moodBus.gain.value, t);
  if (m === 'none') {
    moodBus.gain.linearRampToValueAtTime(0, t + 1.2);
    return;
  }
  // Fade out what was playing, start the new music a moment later and fade it in.
  const gap = was === 'none' ? 0.1 : 0.9;
  moodBus.gain.linearRampToValueAtTime(0, t + gap);
  moodBus.gain.linearRampToValueAtTime(1, t + gap + 2.2);
  nextNote = nextBeat = t + gap + 0.05;
  beat = 0;
  phraseLeft = 0;
  step = 2;
}

// ---------------------------------------------------------------- the composer

function tick() {
  ambTick();
  if (!ctx || mood === 'none' || ctx.state !== 'running') return;
  const def = MOODS[mood];
  const spb = 60 / def.bpm;
  const ahead = ctx.currentTime + 0.5;
  while (nextBeat < ahead) {
    drumBeat(def, nextBeat, beat);
    if (def.drone && beat % 12 === 0) drone(def, nextBeat, spb * 12);
    if (def.lead !== 'gayageum' && beat % 3 === 0 && rnd() < 0.55 * def.density) accompany(def, nextBeat);
    beat++;
    nextBeat += spb;
  }
  while (nextNote < ahead) nextNote += melody(def, nextNote, spb);
}

const freqOf = (def: MoodDef, degree: number) => {
  const oct = Math.floor(degree / 5);
  const idx = ((degree % 5) + 5) % 5;
  return TONIC * Math.pow(2, (def.mode[idx] + oct * 12 + def.register) / 12);
};

/** One melody note or rest. Returns its length in seconds. */
function melody(def: MoodDef, t: number, spb: number): number {
  if (phraseLeft <= 0) {
    phraseLeft = 5 + Math.floor(rnd() * 5);
    const rest = (2 + Math.floor(rnd() * 3)) * spb / def.density;
    step = 1 + Math.floor(rnd() * 4);
    return rest;
  }
  phraseLeft--;
  const ending = phraseLeft === 0;
  // Mostly steps, sometimes a leap; phrases settle on the tonic or the fifth.
  const r = rnd();
  step += r < 0.38 ? 1 : r < 0.76 ? -1 : r < 0.88 ? 2 : -2;
  step = Math.max(-1, Math.min(7, step));
  if (ending) step = rnd() < 0.6 ? 0 : 3;
  const beats = ending ? 3 : [1, 1, 1, 2, 2, 3][Math.floor(rnd() * 6)] * (def.lead === 'gayageum' ? 1 : 1.5);
  const dur = beats * spb;
  const f = freqOf(def, step);
  // Plaintive mode: the second degree is often reached by bending down from above.
  const bend = def.mode === GYEMYEON && ((step % 5) + 5) % 5 === 1 && rnd() < 0.6;
  if (def.lead === 'gayageum') {
    pluck(f, t, Math.min(dur * 1.6, 3.2), 0.5, dur > spb * 1.5, bend, moodBus);
    if (rnd() < 0.25) pluck(f / 2, t, 1.6, 0.22, false, false, moodBus);
  } else if (def.lead === 'daegeum') {
    flute(f, t, dur * 0.96, 0.24, bend);
  } else {
    fiddle(f, t, dur * 0.98, 0.16, bend);
  }
  lastFreq = f;
  return dur;
}

/** Gayageum underneath a flute or fiddle: a broken chord on tonic and fifth. */
function accompany(def: MoodDef, t: number) {
  const base = freqOf(def, rnd() < 0.7 ? 0 : 3) / 2;
  pluck(base, t, 2.4, 0.3, false, false, moodBus);
  if (rnd() < 0.5) pluck(base * 1.5, t + 60 / def.bpm / 2, 1.8, 0.18, false, false, moodBus);
}

function drumBeat(def: MoodDef, t: number, b: number) {
  if (def.drums === 'none') return;
  if (def.drums === 'semachi') {
    // Semachi, in three: deong . kung | deok . kung | kung deok .
    const i = b % 9;
    if (i === 0) { kung(t, 0.32); deok(t, 0.14); }
    else if (i === 2 || i === 5 || i === 6) kung(t, 0.2);
    else if (i === 3 || i === 7) deok(t, 0.12);
  } else if (def.drums === 'heart') {
    if (b % 2 === 0) kung(t, 0.26);
    if (b % 8 === 7) deok(t, 0.08);
  } else if (b % 12 === 0) {
    buk(t, 0.3);
  } else if (b % 12 === 6 && rnd() < 0.5) {
    kung(t, 0.14);
  }
}

function drone(def: MoodDef, t: number, len: number) {
  const c = ctx!;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06, t + len * 0.3);
  g.gain.linearRampToValueAtTime(0, t + len);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  g.connect(lp).connect(moodBus);
  for (const ratio of [0.25, 0.375]) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freqOf(def, 0) * ratio * (def.register < 0 ? 2 : 1);
    o.connect(g);
    o.start(t);
    o.stop(t + len + 0.1);
  }
}

// ---------------------------------------------------------------- instruments

/** A plucked string by the Karplus-Strong method, cached per pitch. */
function pluckBuffer(freq: number): AudioBuffer {
  const key = Math.round(freq * 10);
  const hit = plucks.get(key);
  if (hit) return hit;
  const c = ctx!;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 3.4);
  const b = c.createBuffer(1, len, sr);
  const d = b.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  for (let i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / N * 0.5);
  // Silk strings: a warm, fairly quick decay.
  const damp = 0.4985 - Math.min(0.004, freq / 400000);
  for (let i = N; i < len; i++) d[i] = damp * (d[i - N] + d[i - N + 1 < i ? i - N + 1 : i - N]);
  plucks.set(key, b);
  return b;
}

function pluck(freq: number, t: number, len: number, gain: number, vibrato: boolean, bend: boolean, out: AudioNode) {
  const c = ctx!;
  const s = c.createBufferSource();
  s.buffer = pluckBuffer(freq);
  if (bend) {
    // Nonghyeon: the left hand presses the string and lets it fall back.
    s.detune.setValueAtTime(0, t);
    s.detune.setValueAtTime(0, t + 0.12);
    s.detune.linearRampToValueAtTime(140, t + 0.3);
    s.detune.linearRampToValueAtTime(0, t + 0.55);
  }
  if (vibrato) {
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 5.2;
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(28, t + 0.6);
    lfo.connect(depth).connect(s.detune);
    lfo.start(t);
    lfo.stop(t + len);
  }
  const body = c.createBiquadFilter();
  body.type = 'peaking';
  body.frequency.value = 260;
  body.gain.value = 5;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3200;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.setTargetAtTime(0, t + len * 0.7, len * 0.15);
  s.connect(body).connect(lp).connect(g).connect(out);
  s.start(t);
  s.stop(t + len + 0.2);
}

/** Daegeum: a round flute tone with breath, a buzzing membrane and slow vibrato. */
function flute(freq: number, t: number, len: number, gain: number, bend: boolean) {
  const c = ctx!;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(gain, t + 0.16);
  out.gain.setValueAtTime(gain, t + Math.max(0.2, len - 0.25));
  out.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.1);
  out.connect(moodBus);

  const pitch = (o: OscillatorNode, mult: number) => {
    o.frequency.setValueAtTime(lastFreq * mult, t);
    o.frequency.exponentialRampToValueAtTime(freq * mult * (bend ? 1.06 : 1), t + 0.07);
    if (bend) o.frequency.exponentialRampToValueAtTime(freq * mult, t + 0.35);
  };
  const lfo = c.createOscillator();
  lfo.frequency.value = 4.6;
  const depth = c.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(22, t + Math.min(len, 1.4));
  lfo.connect(depth);

  const a = c.createOscillator();
  a.type = 'sine';
  pitch(a, 1);
  depth.connect(a.detune);
  a.connect(out);

  const buzz = c.createOscillator();
  buzz.type = 'sawtooth';
  pitch(buzz, 1);
  depth.connect(buzz.detune);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2600;
  bp.Q.value = 2.5;
  const bg = c.createGain();
  bg.gain.value = 0.07;
  buzz.connect(bp).connect(bg).connect(out);

  const air = c.createBufferSource();
  air.buffer = noise;
  const abp = c.createBiquadFilter();
  abp.type = 'bandpass';
  abp.frequency.value = freq * 3;
  abp.Q.value = 1.2;
  const ag = c.createGain();
  ag.gain.setValueAtTime(0.5, t);
  ag.gain.exponentialRampToValueAtTime(0.08, t + 0.25);
  air.connect(abp).connect(ag).connect(out);

  for (const n of [a, buzz, lfo]) { n.start(t); n.stop(t + len + 0.15); }
  air.start(t, rnd());
  air.stop(t + len + 0.15);
}

/** Haegeum: a two-string fiddle, nasal and close, with a wide vibrato. */
function fiddle(freq: number, t: number, len: number, gain: number, bend: boolean) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(lastFreq, t);
  o.frequency.exponentialRampToValueAtTime(freq * (bend ? 1.06 : 1), t + 0.1);
  if (bend) o.frequency.exponentialRampToValueAtTime(freq, t + 0.45);
  const lfo = c.createOscillator();
  lfo.frequency.value = 6;
  const depth = c.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(35, t + Math.min(len, 0.9));
  lfo.connect(depth).connect(o.detune);
  const f1 = c.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = 950;
  f1.Q.value = 1.4;
  const f2 = c.createBiquadFilter();
  f2.type = 'lowpass';
  f2.frequency.value = 2200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.2);
  g.gain.setValueAtTime(gain, t + Math.max(0.25, len - 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.1);
  o.connect(f1).connect(f2).connect(g).connect(moodBus);
  for (const n of [o, lfo]) { n.start(t); n.stop(t + len + 0.15); }
}

function thump(t: number, from: number, to: number, decay: number, gain: number, out: AudioNode) {
  const c = ctx!;
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + decay * 0.6);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + decay + 0.05);
}

function hiss(t: number, type: BiquadFilterType, freq: number, q: number, decay: number, gain: number, out: AudioNode, sweepTo?: number) {
  const c = ctx!;
  const s = c.createBufferSource();
  s.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + decay);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  s.connect(f).connect(g).connect(out);
  s.start(t, rnd() * 1.5);
  s.stop(t + decay + 0.05);
}

/** Janggu, left side (gungpyeon): the low, round stroke. */
const kung = (t: number, gain: number, out: AudioNode = moodBus) => { thump(t, 150, 72, 0.4, gain, out); hiss(t, 'lowpass', 400, 0.7, 0.08, gain * 0.25, out); };
/** Janggu, right side (yeolpyeon): the stick's dry crack. */
const deok = (t: number, gain: number, out: AudioNode = moodBus) => { hiss(t, 'bandpass', 2300, 1.6, 0.07, gain * 2.2, out); thump(t, 900, 600, 0.03, gain * 0.5, out); };
/** Buk, the barrel drum. */
const buk = (t: number, gain: number, out: AudioNode = moodBus) => { thump(t, 96, 46, 0.7, gain, out); hiss(t, 'lowpass', 260, 0.7, 0.14, gain * 0.35, out); };

/** Jing, the large gong: slow, shimmering partials. */
function jing(t: number, gain: number, base = 196) {
  const c = ctx!;
  for (const [ratio, amp] of [[1, 1], [2.02, 0.5], [2.98, 0.28], [4.13, 0.14]]) {
    const o = c.createOscillator();
    o.frequency.setValueAtTime(base * ratio * 0.985, t);
    o.frequency.linearRampToValueAtTime(base * ratio, t + 0.6);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * amp, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    o.connect(g).connect(sfxBus);
    o.start(t);
    o.stop(t + 3.3);
  }
}

// ---------------------------------------------------------------- sounds

export function sfx(name: SfxName) {
  if (!ctx || ctx.state !== 'running' || vol.sfx <= 0) return;
  const t = ctx.currentTime + 0.01;
  const scale = PYEONGJO.map((s) => TONIC * Math.pow(2, s / 12));
  switch (name) {
    case 'tap':
      hiss(t, 'bandpass', 3200, 2, 0.03, 0.18, sfxBus);
      thump(t, 700, 500, 0.025, 0.06, sfxBus);
      break;
    case 'pluck':
      pluck(scale[Math.floor(rnd() * 5)], t, 1.6, 0.42, false, false, sfxBus);
      break;
    case 'gift':
      pluck(scale[2], t, 1.4, 0.36, false, false, sfxBus);
      pluck(scale[4], t + 0.12, 1.6, 0.32, false, false, sfxBus);
      break;
    case 'stamp':
      // A seal pressed into paper: a soft thud and a little grain.
      thump(t, 140, 55, 0.2, 0.5, sfxBus);
      hiss(t, 'lowpass', 900, 0.8, 0.09, 0.4, sfxBus);
      hiss(t + 0.05, 'bandpass', 3000, 0.9, 0.12, 0.05, sfxBus);
      break;
    case 'paper':
      hiss(t, 'bandpass', 900, 0.8, 0.32, 0.22, sfxBus, 3400);
      hiss(t + 0.18, 'bandpass', 2400, 1, 0.2, 0.12, sfxBus, 1200);
      break;
    case 'page':
      hiss(t, 'highpass', 1800, 0.7, 0.16, 0.08, sfxBus, 5000);
      break;
    case 'drum':
      buk(t, 0.55, sfxBus);
      kung(t + 0.42, 0.3, sfxBus);
      buk(t + 0.84, 0.4, sfxBus);
      break;
    case 'honour':
      [scale[0], scale[1], scale[2], scale[0] * 2].forEach((f, i) => pluck(f, t + i * 0.11, 2, 0.34, i === 3, false, sfxBus));
      jing(t + 0.05, 0.12, 233);
      break;
    case 'coin':
      for (const [f, dt] of [[2630, 0], [3950, 0.05], [3120, 0.13]] as const) {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.09, t + dt);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.28);
        o.connect(g).connect(sfxBus);
        o.start(t + dt);
        o.stop(t + dt + 0.3);
      }
      break;
    case 'bell':
      jing(t, 0.16, 147);
      break;
  }
}

// ---------------------------------------------------------------- ambience (GSDD Part VI §10.3)

/** The world's own sound, under the music: wind always, birds by day, insects on warm nights, rain. */
export type Ambience = 'none' | 'day' | 'night';
let ambKind: Ambience = 'none';
let ambRain = false;
let ambSeason = 0;
let ambVol = 0.5;
let ambBus: GainNode | null = null;
let windGain: GainNode | null = null;
let rainGain: GainNode | null = null;
let nextCall = 0;

function buildAmbience(c: AudioContext) {
  ambBus = c.createGain();
  ambBus.gain.value = 0;
  ambBus.connect(master);
  // Wind: slow-moving filtered noise with gusts.
  const wind = c.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const wf = c.createBiquadFilter();
  wf.type = 'bandpass';
  wf.frequency.value = 380;
  wf.Q.value = 0.7;
  windGain = c.createGain();
  windGain.gain.value = 0.05;
  const gust = c.createOscillator();
  gust.frequency.value = 0.06;
  const depth = c.createGain();
  depth.gain.value = 0.035;
  gust.connect(depth).connect(windGain.gain);
  const sweep = c.createOscillator();
  sweep.frequency.value = 0.045;
  const sd = c.createGain();
  sd.gain.value = 160;
  sweep.connect(sd).connect(wf.frequency);
  wind.connect(wf).connect(windGain).connect(ambBus);
  // Rain: bright noise, off until the weather calls for it.
  const rain = c.createBufferSource();
  rain.buffer = noise;
  rain.loop = true;
  rain.playbackRate.value = 0.9;
  const rf = c.createBiquadFilter();
  rf.type = 'highpass';
  rf.frequency.value = 1400;
  rainGain = c.createGain();
  rainGain.gain.value = 0;
  rain.connect(rf).connect(rainGain).connect(ambBus);
  wind.start();
  rain.start();
  gust.start();
  sweep.start();
  applyAmbience();
}

/** Sets what the world sounds like now. Volume 0–100; season 0 spring … 3 winter. */
export function setAmbience(kind: Ambience, volume: number, season: number, rain: boolean) {
  ambKind = kind;
  ambVol = Math.max(0, Math.min(1, volume / 100));
  ambSeason = season;
  ambRain = rain;
  applyAmbience();
}
function applyAmbience() {
  if (!ctx || !ambBus || !windGain || !rainGain) return;
  const t = ctx.currentTime;
  const on = ambKind === 'none' ? 0 : ambVol * ambVol * 0.9;
  ambBus.gain.setTargetAtTime(on, t, 0.8);
  rainGain.gain.setTargetAtTime(ambRain && ambSeason !== 3 ? 0.07 : 0, t, 1.2);
}

/** Birds and insects, scheduled a little ahead like the music. */
function ambTick() {
  if (!ctx || !ambBus || ambKind === 'none' || ambVol <= 0 || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  if (nextCall < now) nextCall = now + 0.5;
  const ahead = now + 0.6;
  while (nextCall < ahead) {
    const t = nextCall;
    if (ambKind === 'day' && ambSeason !== 3 && !ambRain) {
      // A small bird: two or three quick falling chirps.
      const base = 2600 + Math.random() * 1400;
      const n = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) chirp(t + i * 0.11, base * (1 - i * 0.04), 0.07, 0.03);
      nextCall += 2.5 + Math.random() * 6;
    } else if (ambKind === 'night' && (ambSeason === 1 || ambSeason === 2) && !ambRain) {
      // Crickets: a steady pulsing trill.
      for (let i = 0; i < 6; i++) chirp(t + i * 0.055, 4300 + Math.random() * 60, 0.03, 0.012);
      nextCall += 0.7 + Math.random() * 0.5;
    } else {
      nextCall += 3;
    }
  }
}
function chirp(t: number, f: number, len: number, level: number) {
  if (!ctx || !ambBus) return;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(f * 0.78, t + len);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(ambBus);
  o.start(t);
  o.stop(t + len + 0.02);
}
