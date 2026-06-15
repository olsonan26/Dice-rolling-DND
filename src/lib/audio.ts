/**
 * Web Audio API sound design.
 *
 * Sounds are synthesized live — no audio files needed. Keeps bundle tiny
 * and lets us riff on each impact with subtle variation.
 */
import { secureRandomRange } from "./random";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

function ensureCtx(): AudioContext {
  if (!ctx) {
    const Ctor = (window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext) as typeof AudioContext;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.55;
}
export function isMuted() {
  return muted;
}

function envelope(
  node: AudioNode,
  attack: number,
  decay: number,
  sustain: number,
  release: number,
  peak = 1,
): GainNode {
  const a = ensureCtx();
  const g = a.createGain();
  const t = a.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sustain), t + attack + decay);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay + release);
  node.connect(g);
  if (masterGain) g.connect(masterGain);
  return g;
}

/** Soft, warm UI click — used when picking a die. */
export function playClick() {
  if (muted) return;
  const a = ensureCtx();
  const osc = a.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(620, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, a.currentTime + 0.07);
  envelope(osc, 0.002, 0.04, 0.0, 0.06, 0.25);
  osc.start();
  osc.stop(a.currentTime + 0.12);
}

/** Whoosh as dice fly out of the cup. */
export function playWhoosh() {
  if (muted) return;
  const a = ensureCtx();
  const dur = 0.55;
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * 0.7;
  }
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(900, a.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2400, a.currentTime + dur);
  filter.Q.value = 1.2;
  src.connect(filter);
  envelope(filter, 0.01, 0.05, 0.4, 0.45, 0.4);
  src.start();
  src.stop(a.currentTime + dur + 0.05);
}

/** Wooden/stone impact when a die hits the tray or another die. */
export function playImpact(force: number) {
  if (muted) return;
  const a = ensureCtx();
  const intensity = Math.max(0.05, Math.min(1, force));
  // Body: low resonant ‘knock’
  const osc = a.createOscillator();
  osc.type = "sine";
  const baseFreq = 90 + secureRandomRange(-12, 12);
  osc.frequency.setValueAtTime(baseFreq, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.55, a.currentTime + 0.12);
  envelope(osc, 0.002, 0.05, 0.0, 0.1, 0.3 * intensity);
  osc.start();
  osc.stop(a.currentTime + 0.2);

  // Click transient — short noise burst through hi shelf
  const buffer = a.createBuffer(1, Math.floor(a.sampleRate * 0.04), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buffer;
  const hp = a.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  src.connect(hp);
  envelope(hp, 0.001, 0.01, 0.0, 0.04, 0.4 * intensity);
  src.start();
}

/** Light sparkle when result is revealed. */
export function playReveal() {
  if (muted) return;
  const a = ensureCtx();
  const notes = [880, 1320, 1760];
  notes.forEach((freq, i) => {
    const osc = a.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, a.currentTime + i * 0.06);
    envelope(osc, 0.005, 0.05, 0.0, 0.2, 0.18);
    osc.start(a.currentTime + i * 0.06);
    osc.stop(a.currentTime + i * 0.06 + 0.3);
  });
}

/** Triumphant fanfare on natural max (crit). */
export function playCritSuccess() {
  if (muted) return;
  const a = ensureCtx();
  const t0 = a.currentTime;
  const notes = [
    { f: 523.25, t: 0.0, d: 0.18 }, // C5
    { f: 659.25, t: 0.1, d: 0.18 }, // E5
    { f: 783.99, t: 0.2, d: 0.22 }, // G5
    { f: 1046.5, t: 0.32, d: 0.45 }, // C6
  ];
  notes.forEach(n => {
    const osc = a.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(n.f, t0 + n.t);
    envelope(osc, 0.005, 0.08, 0.2, n.d, 0.4);
    osc.start(t0 + n.t);
    osc.stop(t0 + n.t + n.d + 0.1);

    // Octave shimmer
    const osc2 = a.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(n.f * 2, t0 + n.t);
    envelope(osc2, 0.005, 0.08, 0.1, n.d, 0.2);
    osc2.start(t0 + n.t);
    osc2.stop(t0 + n.t + n.d + 0.1);
  });
}

/** Doomy descend on natural 1. */
export function playCritFail() {
  if (muted) return;
  const a = ensureCtx();
  const osc = a.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(220, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(55, a.currentTime + 0.6);
  const lp = a.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, a.currentTime);
  lp.frequency.exponentialRampToValueAtTime(180, a.currentTime + 0.6);
  osc.connect(lp);
  envelope(lp, 0.01, 0.1, 0.4, 0.6, 0.35);
  osc.start();
  osc.stop(a.currentTime + 0.8);
}

/** Resume audio after first user interaction (mobile). */
export function primeAudio() {
  ensureCtx();
}
