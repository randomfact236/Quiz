/**
 * ============================================================================
 * Memory Quiz — audio.js (Game 08, plan/games/08-memory-quiz.md §6)
 * ============================================================================
 * WebAudio blips + mute. The context is created lazily on first use (a user
 * gesture — pointerdown always precedes the first blip) and the mute flag is
 * set by game.js from storage.js; audio.js never touches localStorage. Every
 * call is best-effort: audio is cosmetic and must never throw into gameplay.
 * ============================================================================
 */

let audioCtx = null;
let muted = false;

export function setMuted(value) {
  muted = !!value;
}

export function ensureAudio() {
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* no audio — fine */
  }
  return audioCtx;
}

export function blip(freq, ms = 60, type = 'triangle', when = 0) {
  if (muted) return;
  try {
    const ctx = ensureAudio();
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.setValueAtTime(0.0001, t);
    gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.02);
  } catch {
    /* audio must never break gameplay */
  }
}
