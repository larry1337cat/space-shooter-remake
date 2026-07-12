import { audio } from "./assetLoader.js";

let current = null;
let musicVolume = 0.5;
let sfxVolume = 0.6;
let muted = false;
let audioCtx = null;

export function initVolumes({ musicVolume: m, sfxVolume: s, muted: mu }) {
  musicVolume = m;
  sfxVolume = s;
  muted = mu;
}

export function setMuted(v) {
  muted = v;
  if (current) current.muted = muted;
}

export function isMuted() {
  return muted;
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (current) current.volume = musicVolume;
}

export function getMusicVolume() {
  return musicVolume;
}

export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
}

export function getSfxVolume() {
  return sfxVolume;
}

export function playTrack(key, { loop = true } = {}) {
  const next = audio[key];
  if (!next) return;
  if (current === next) return;

  if (current) fadeOutAndStop(current);
  next.currentTime = 0;
  next.loop = loop;
  next.volume = 0;
  next.muted = muted;
  next.play().catch(() => {});
  fadeIn(next, musicVolume);
  current = next;
}

export function stopAll() {
  if (current) fadeOutAndStop(current);
  current = null;
}

function fadeIn(el, target, steps = 12) {
  clearInterval(el._fadeInterval);
  let i = 0;
  el._fadeInterval = setInterval(() => {
    i++;
    el.volume = Math.min(target, (target * i) / steps);
    if (i >= steps) clearInterval(el._fadeInterval);
  }, 40);
}

function fadeOutAndStop(el, steps = 10) {
  clearInterval(el._fadeInterval);
  const startVol = el.volume;
  let i = 0;
  el._fadeInterval = setInterval(() => {
    i++;
    el.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) {
      clearInterval(el._fadeInterval);
      el.pause();
    }
  }, 30);
}

export function unlockAudioOnce() {
  const unlock = () => {
    Object.values(audio).forEach((a) => {
      a.play()
        .then(() => a.pause())
        .catch(() => {});
    });
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
}

const SFX = {
  shoot: { freq: 720, type: "square", duration: 0.06, gain: 0.18 },
  hit: { freq: 340, type: "triangle", duration: 0.05, gain: 0.16 },
  explosion: { freq: 90, type: "sawtooth", duration: 0.28, gain: 0.28, sweep: 0.25 },
  pickup: { freq: 520, type: "sine", duration: 0.12, gain: 0.2, sweep: 1.6 },
  hurt: { freq: 180, type: "sawtooth", duration: 0.14, gain: 0.22 },
  click: { freq: 900, type: "square", duration: 0.03, gain: 0.12 },
};

export function playSfx(name) {
  if (muted || sfxVolume <= 0 || !audioCtx) return;
  const def = SFX[name];
  if (!def) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const now = audioCtx.currentTime;

  osc.type = def.type;
  osc.frequency.setValueAtTime(def.freq, now);
  if (def.sweep) osc.frequency.exponentialRampToValueAtTime(def.freq * def.sweep, now + def.duration);

  gainNode.gain.setValueAtTime(def.gain * sfxVolume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + def.duration);

  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + def.duration);
}
