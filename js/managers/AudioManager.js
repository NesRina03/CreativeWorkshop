'use strict';

/* ============================== 4. AUDIO ============================== */
const AU = (() => {
  let ctx = null, sfxG, musG, ambG, noiseBuf, musStep = 0, musTimer = null;
  const vol = { sfx: 0.7, mus: 0.5 };
  function setVol() { if (!ctx) return; sfxG.gain.value = vol.sfx * vol.sfx; musG.gain.value = vol.mus * vol.mus * 0.9; }
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
    sfxG = ctx.createGain(); musG = ctx.createGain(); ambG = ctx.createGain();
    ambG.connect(sfxG); sfxG.connect(ctx.destination); musG.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setVol();
    // wind: looped noise through a slowly moving low-pass filter
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = ctx.createGain(); g.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
    const lg = ctx.createGain(); lg.gain.value = 0.03; lfo.connect(lg); lg.connect(g.gain);
    const lg2 = ctx.createGain(); lg2.gain.value = 160; lfo.connect(lg2); lg2.connect(lp.frequency);
    src.connect(lp); lp.connect(g); g.connect(ambG); src.start(); lfo.start();
    musTimer = setInterval(musicTick, 620);
  }
  function tone(f, d, type, v, slide, delay, bus) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(bus || sfxG); o.start(t0); o.stop(t0 + d + 0.05);
  }
  function noise(d, v, ft, ff, delay, slide) {
    if (!ctx) return;
    const t0 = ctx.currentTime + (delay || 0);
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ft || 'lowpass'; f.frequency.setValueAtTime(ff || 800, t0);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, ff * slide), t0 + d);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(f); f.connect(g); g.connect(sfxG); s.start(t0, Math.random()); s.stop(t0 + d + 0.05);
  }
  function musicTick() {
    if (!ctx || ctx.state !== 'running') return;
    const sc = [110, 130.8, 164.8, 174.6, 196, 220, 261.6, 329.6];
    musStep++;
    if (musStep % 8 === 1) { tone(55, 5.4, 'sine', 0.22, 0, 0, musG); tone(82.4, 5.4, 'sine', 0.1, 0, 0, musG); tone(130.8, 5.4, 'triangle', 0.05, 0, 0.1, musG); }
    if (musStep % 16 === 9) { tone(58.3, 5.4, 'sine', 0.16, 0, 0, musG); }
    if (Math.random() < 0.55) tone(sc[(Math.random() * sc.length) | 0] * (Math.random() < 0.35 ? 2 : 1), 1.6, 'triangle', 0.055, 0.99, 0, musG);
    if (Math.random() < 0.12) tone(sc[(Math.random() * 3) | 0] * 4, 0.9, 'sine', 0.03, 1.01, 0.2, musG);
  }
  const SFX = {
    ui: () => tone(520, 0.06, 'square', 0.07),
    step: () => noise(0.07, 0.05 + Math.random() * 0.02, 'lowpass', 420 + Math.random() * 200),
    collect: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, 0, i * 0.07)),
    lensOn: () => { tone(300, 0.3, 'sine', 0.12, 2.6); noise(0.25, 0.04, 'highpass', 3000); },
    lensOff: () => tone(700, 0.22, 'sine', 0.1, 0.35),
    detect: () => { tone(180, 0.5, 'sawtooth', 0.09, 0.6); tone(186, 0.5, 'sawtooth', 0.07, 0.6); noise(0.4, 0.04, 'bandpass', 1500, 0, 2); },
    correct: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.26, 'square', 0.08, 0, i * 0.06)); noise(0.5, 0.06, 'highpass', 2500, 0, 3); },
    wrong: () => { tone(150, 0.4, 'sawtooth', 0.16, 0.5); tone(98, 0.45, 'square', 0.12, 0.6, 0.05); },
    shoot: () => { noise(0.14, 0.12, 'bandpass', 1800, 0, 0.4); tone(900, 0.12, 'square', 0.07, 0.3); },
    miss: () => tone(200, 0.09, 'square', 0.05),
    capture: () => { tone(220, 0.5, 'sawtooth', 0.12, 4); noise(0.45, 0.1, 'bandpass', 900, 0, 3); [800, 1200, 1600].forEach((f, i) => tone(f, 0.2, 'triangle', 0.08, 0.5, 0.1 + i * 0.08)); },
    win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, 'square', 0.09, 0, i * 0.13)),
    lose: () => [392, 349, 311, 262, 196].forEach((f, i) => tone(f, 0.5, 'sawtooth', 0.1, 0.97, i * 0.22)),
    book: () => noise(0.18, 0.08, 'bandpass', 2200, 0, 0.3),
    scan: () => { tone(260, 0.9, 'square', 0.05, 4); noise(0.9, 0.04, 'bandpass', 1200, 0, 3); },
    creak: () => { const f = 60 + Math.random() * 50; tone(f, 1.1, 'sawtooth', 0.04, 1.5); tone(f * 1.51, 1.0, 'sawtooth', 0.02, 1.4, 0.05); },
    whisper: () => { const f = 1800 + Math.random() * 1500; noise(1.3, 0.06, 'bandpass', f, 0, 0.5); noise(1.0, 0.04, 'bandpass', f * 1.4, 0.3, 0.6); },
    flicker: () => { noise(0.08, 0.06, 'highpass', 5000); noise(0.06, 0.05, 'highpass', 6000, 0.12); },
    far: () => { for (let i = 0; i < 3; i++) noise(0.06, 0.02, 'lowpass', 260, i * 0.5); }
  };
  return { init, setVol, vol, play(n) { if (ctx && SFX[n]) SFX[n](); }, resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); } };
})();
const sfx = (n) => AU.play(n);