'use strict';

/** GAME STATE */
const G = {
  state: 'menu', lang: 'en', sfxVol: 0.7, musVol: 0.5, t: 0, wt: 0,
  time: 0, timeMax: 0, collected: [false, false, false, false, false], sel: 0, lens: false,
  ghosts: [], req: [0, 0, 0, 0, 0], cap: [0, 0, 0, 0, 0], target: null, spellsW: [],
  bookGhost: null, csMode: 'new', backTo: 'menu', started: false, ambT: 5, stepT: 0, shotT: 0, shotTx: 0, shotTy: 0, endT: 0
};
const parts = [];
let expectUnlock = false, lastTimerTxt = '';

function save() { try { localStorage.setItem('hh5c', JSON.stringify({ l: G.lang, s: G.sfxVol, m: G.musVol })); } catch (e) {} }
function load() { try { const o = JSON.parse(localStorage.getItem('hh5c') || '{}'); if (o.l === 'ar' || o.l === 'en') G.lang = o.l; if (typeof o.s === 'number') G.sfxVol = clamp(o.s, 0, 1); if (typeof o.m === 'number') G.musVol = clamp(o.m, 0, 1); } catch (e) {} }
const tr = (k) => (L[G.lang] && L[G.lang][k]) || L.en[k] || k;
const SPELL_SPOTS = [[3.5, 2.5], [22.5, 2.5], [12.5, 14.5], [28.5, 14.5], [27.5, 21.5], [8.5, 5.5], [18.5, 12.5], [6.5, 18.5], [29.5, 3.5], [10.5, 21.5]];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function buildWorld() {
  //random distribution: every type gets 1..3 ghosts, HUD counts == spawned instances
  G.req = [0, 0, 0, 0, 0].map(() => 1 + ((rnd() * 3) | 0));
  G.cap = [0, 0, 0, 0, 0];
  const total = G.req.reduce((a, b) => a + b, 0);
  G.timeMax = 120 + 50 * total; G.time = G.timeMax;
  G.collected = [false, false, false, false, false]; G.sel = 0; G.lens = false; G.target = null; G.bookGhost = null;
  // spells
  const spots = shuffle(SPELL_SPOTS.slice());
  G.spellsW = SPELLS.map((s, i) => ({ id: i, x: spots[i][0], y: spots[i][1], got: false, ph: rnd() * TAU }));
  //ghosts
  const cand = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (MAP[y * MW + x]) continue;
    const cx = x + 0.5, cy = y + 0.5;
    if (Math.hypot(cx - 2.5, cy - 8.5) < 5) continue;
    if (PROPS.some((p) => Math.hypot(p.x - cx, p.y - cy) < 0.9)) continue;
    if (G.spellsW.some((s) => Math.hypot(s.x - cx, s.y - cy) < 1.2)) continue;
    cand.push([cx, cy]);
  }
  shuffle(cand);
  G.ghosts = []; const placed = [];
  for (let type = 0; type < 5; type++) for (let n = 0; n < G.req[type]; n++) {
    let pos = null;
    for (let k = 0; k < cand.length; k++) { const c = cand[k]; if (placed.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) > 2.4)) { pos = c; cand.splice(k, 1); break; } }
    if (!pos) pos = cand.pop();
    placed.push(pos);
    G.ghosts.push({ type, x: pos[0], y: pos[1], hx: pos[0], hy: pos[1], tx: pos[0], ty: pos[1], spd: GPAR[type].speed, wait: rnd() * 2, state: 'hidden', wrong: 0, ph: rnd() * TAU, ct: 0, seen: false, vis: false, sr: null });
  }
  parts.length = 0;
  P.x = 2.5; P.y = 8.5; P.a = 0;
}

/*UPDATE */
function addP(x, y, z, vx, vy, vz, life, c, sz) { if (parts.length > 520) parts.shift(); parts.push({ x, y, z, vx, vy, vz, l: life, m: life, c, s: sz || 0.022 }); }
function burst(x, y, z, c, n) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = 0.5 + rnd() * 1.6; addP(x, y, z, Math.cos(a) * s, Math.sin(a) * s, (rnd() - 0.2) * 1.6, 0.5 + rnd() * 0.7, c, 0.02 + rnd() * 0.025); } }
function stepParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.l -= dt; if (p.l <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; } }
}
function onCaptured(g) {
  G.cap[g.type]++; hudGhosts(); toast(tr('captured'), GHOSTS[g.type].color); sfx('capture');
  if (G.cap.every((c, i) => c >= G.req[i])) { G.endT = 0.7; }
}
function nearSpell() {
  let best = null, bd = USE_RANGE;
  for (const s of G.spellsW) { if (s.got) continue; const d = Math.hypot(s.x - P.x, s.y - P.y); if (d < bd) { bd = d; best = s; } }
  return best;
}
function update(dt) {
  G.t += dt;
  if (G.state !== 'playing') { return; }
  G.wt += dt;
  updatePlayer(dt);
  G.ghosts.forEach((g) => updateGhost(g, dt));
  G.spellsW.forEach((s) => { if (!s.got && rnd() < 0.35) { const a = rnd() * TAU, r = 0.15 + rnd() * 0.2; addP(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, 0.25 + rnd() * 0.15, 0, 0, 0.2 + rnd() * 0.2, 0.9, SPELLS[s.id].rgb, 0.018); } });
  stepParts(dt);
  if (G.pendingDetect) { G.pendingDetect = false; toast(tr('detected'), '#ff8a4a'); sfx('detect'); }
  // timer
  if (G.endT > 0) { G.endT -= dt; if (G.endT <= 0) winGame(); }
  else {
    G.time -= dt; if (G.time <= 0) { G.time = 0; hudTimer(); loseGame('time'); return; }
    hudTimer();
  }
  // ambient sound events
  G.ambT -= dt;
  if (G.ambT <= 0) { G.ambT = 4 + rnd() * 7; const r = rnd(); sfx(r < 0.3 ? 'creak' : r < 0.55 ? 'whisper' : r < 0.8 ? 'far' : 'flicker'); }
  updatePrompt();
}
