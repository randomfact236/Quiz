/**
 * ============================================================================
 * audio.js — Tap or Don't Tap (WebAudio blips + haptics)
 * ============================================================================
 * Rev 2 pattern (plan/games/01-tap-or-dont-tap.md §13): output helpers moved
 * out of game.js. The context is created lazily on first use (a user gesture —
 * pointerdown/keydown always precedes the first blip) and the runtime mute
 * flag is set by game.js from storage.js; audio.js never touches localStorage.
 * Every call is best-effort: audio and haptics are cosmetic and must never
 * throw into gameplay.
 * ============================================================================
 */

let audioCtx = null;
let muted = false;

export function setMuted(value) {
  muted = !!value;
}

/** Short envelope blip. */
export function blip(freq, durationMs = 90, type = 'sine') {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    const start = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + durationMs / 1000);
  } catch {
    /* audio is cosmetic */
  }
}

/** Haptic tick on heart loss (no-op where vibration is unsupported). */
export function buzz(pattern = 80) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    /* iOS no-op */
  }
}
