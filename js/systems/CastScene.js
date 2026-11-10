'use strict';

/* ============================================================================
   CAST SCENE: the child brings the ghost's heart back.
   No grids, no numbers. The child does the collecting:

     1  the camera zooms in on the ghost; a grey shadow of the spell symbol is its missing heart,
        little pieces of magic float around it
     2  the spell (a glowing orb carrying its symbol) floats in from the right
     3  THE CHILD TAPS the glowing piece, one after the other, from RIGHT to LEFT.
        Each piece flies into the heart and fills it with colour
     4  the orb dives into the heart, the spell symbol takes its place, happy hearts pop out
     5  the camera pulls back and the orb sweeps over the WHOLE ghost: the same magic fixes every spot
     6  the ghost shows its true form

   Wrong spell: the pieces do not fit, the orb bounces off, the magic fades. Lumi looks worried.
   Tutorial: the very first cast of a new game is a guided practice (startTutorial).
   Everything is drawn on #castCanvas (320x200). Scene coordinates are "ghost sprite pixels" (32x32).
   ============================================================================ */

Object.assign(L.en, {
  castC1: 'The ghost lost its magic heart. Only a grey shadow is left.',
  castC2: 'Bits of its magic are floating around the heart.',
  castC3: 'Your spell floats in, ready to help.',
  castC4: 'Tap the glowing piece to send it into the heart! Go from right to left.',
  castOrder: 'Careful! Start with the glowing piece. We go from right to left.',
  castC5: 'All the bits are inside the heart... and your spell symbol takes its place!',
  castC6: 'The heart is back!',
  castC7: 'Now the same magic fixes the whole ghost, spot by spot!',
  castC8: 'The ghost shows its true form!',
  castW1: 'The bits do not fit this heart... the magic fades away.',
  castW2: 'WRONG SPELL! The ghost stays hidden.',
  castT1: 'Hi! I am Lumi. This ghost lost its magic heart. Bits of its magic float around it.',
  castT2: 'Here comes a spell! Help it collect the magic.',
  castT4: 'Tap the glowing piece, from the right side, to send it into the heart!',
  castT8: 'You did it! Every spell works like this. Now go free the mansion!',
  castSkip: 'TAP the glowing piece (or SPACE) · ESC: skip', castCont: 'ENTER / CLICK: continue',
  selectHint: 'Pick the spell with the same symbol as the grey heart on the ghost.'
});
Object.assign(L.ar, {
  castC1: 'فقد الشبح قلبه السحري. لم يبقَ منه سوى ظلّ رمادي.',
  castC2: 'قطع من سحره تطفو حول القلب.',
  castC3: 'تطفو تعويذتك نحوك، جاهزة للمساعدة.',
  castC4: 'اضغط على القطعة المتوهجة لترسلها إلى القلب! ابدأ من اليمين إلى اليسار.',
  castOrder: 'انتبه! ابدأ بالقطعة المتوهجة. نمشي من اليمين إلى اليسار.',
  castC5: 'تجتمع كل القطع داخل القلب... ويأخذ رمز تعويذتك مكانه!',
  castC6: 'عاد القلب!',
  castC7: 'الآن يصلح السحر نفسه الشبح كله، نقطة بعد نقطة!',
  castC8: 'ظهر الشبح بهيئته الحقيقية!',
  castW1: 'القطع لا تناسب هذا القلب... فيتلاشى السحر.',
  castW2: 'تعويذة خاطئة! يبقى الشبح مختبئًا.',
  castT1: 'مرحبًا! أنا لومي. هذا الشبح فقد قلبه السحري. قطع من سحره تطفو حوله.',
  castT2: 'ها هي تعويذة! ساعدها على جمع السحر.',
  castT4: 'اضغط على القطعة المتوهجة، من اليمين، لترسلها إلى القلب!',
  castT8: 'أحسنت! كل التعاويذ تعمل هكذا. هيا حرّر القصر!',
  castSkip: 'اضغط على القطعة المتوهجة (أو SPACE) · ESC: تخطي', castCont: 'ENTER / نقرة: متابعة',
  selectHint: 'اختر التعويذة التي لها نفس رمز القلب الرمادي على الشبح.'
});

const CASTC = $('castCanvas'), CX = CASTC.getContext('2d');
CX.imageSmoothingEnabled = false;
let CAST = { on: false };
const CELL = 3;                                  // size of the heart in sprite pixels
const ORDER = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 0], [0, 1], [-1, -1], [-1, 0], [-1, 1]];   // right -> left, column by column
const CTMP = mkCanvas(SPR, SPR), CTMPX = CTMP.getContext('2d');
const PALE = [215, 215, 245];
const HEARTPX = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(3) + ')';
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* ---- tiny pixel-art drawing helpers ---- */
function disc(x, y, r, col) {
  r = Math.max(1, Math.round(r)); CX.fillStyle = col;
  for (let yy = -r; yy <= r; yy++) { const w = Math.floor(Math.sqrt(r * r - yy * yy)); CX.fillRect(Math.round(x - w), Math.round(y + yy), w * 2 + 1, 1); }
}
function ring(x, y, r, col) {
  CX.fillStyle = col; const n = Math.max(12, (r * 3) | 0);
  for (let i = 0; i < n; i++) { const a = i / n * TAU; CX.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2); }
}
const tintCache = {};
function heartTint(type, rgb) {                  // the heart's silhouette in one solid colour (shows the magic filling it)
  const key = type + ':' + rgb.join(','); if (tintCache[key]) return tintCache[key];
  const c = mkCanvas(16, 16), id = GREY_RUNE_CV[type].getContext('2d').getImageData(0, 0, 16, 16), d = id.data;
  for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
  c.getContext('2d').putImageData(id, 0, 0); return (tintCache[key] = c);
}
function scanCanvas(o, f) {                      // real reveal frames of RenderSystem.scanSpr
  const b = scanSpr(o, f, 0);
  CTMPX.putImageData(new ImageData(new Uint8ClampedArray(b.buffer.slice(0)), SPR, SPR), 0, 0);
  return CTMP;
}

/* ---- Lumi, the little lantern helper ---- */
function drawHelper(c, mood, alpha) {
  if (alpha <= 0.02) return;
  const bx = 14, by = 132 + Math.round(Math.sin(c.clock * 3) * 2);
  CX.globalAlpha = alpha;
  disc(bx + 12, by + 13, 16, 'rgba(255,220,120,0.14)'); disc(bx + 12, by + 13, 11, 'rgba(255,220,120,0.2)');
  CX.fillStyle = '#6a4a2a'; CX.fillRect(bx + 8, by - 3, 8, 2); CX.fillRect(bx + 8, by - 3, 2, 5); CX.fillRect(bx + 14, by - 3, 2, 5);
  CX.fillStyle = '#8a6238'; CX.fillRect(bx + 5, by + 1, 14, 3);
  CX.fillStyle = '#ffd86b'; CX.fillRect(bx + 4, by + 4, 16, 16);
  CX.fillStyle = '#fff3b0'; CX.fillRect(bx + 6, by + 6, 12, 12);
  CX.fillStyle = '#c9972e'; CX.fillRect(bx + 4, by + 4, 2, 16); CX.fillRect(bx + 18, by + 4, 2, 16);
  CX.fillStyle = '#8a6238'; CX.fillRect(bx + 5, by + 20, 14, 3);
  CX.fillStyle = '#3a2210';
  if (mood === 'happy') {
    CX.fillRect(bx + 8, by + 10, 3, 1); CX.fillRect(bx + 9, by + 9, 1, 1); CX.fillRect(bx + 13, by + 10, 3, 1); CX.fillRect(bx + 14, by + 9, 1, 1);
    CX.fillRect(bx + 9, by + 14, 6, 1); CX.fillRect(bx + 10, by + 15, 4, 1);
  } else if (mood === 'worried') {
    CX.fillRect(bx + 9, by + 10, 2, 2); CX.fillRect(bx + 14, by + 10, 2, 2);
    CX.fillRect(bx + 8, by + 8, 3, 1); CX.fillRect(bx + 14, by + 8, 3, 1);
    CX.fillRect(bx + 10, by + 15, 4, 1); CX.fillRect(bx + 9, by + 16, 1, 1); CX.fillRect(bx + 14, by + 16, 1, 1);
  } else {
    CX.fillRect(bx + 9, by + 10, 2, 2); CX.fillRect(bx + 14, by + 10, 2, 2);
    CX.fillRect(bx + 10, by + 15, 4, 1); CX.fillRect(bx + 9, by + 14, 1, 1); CX.fillRect(bx + 14, by + 14, 1, 1);
  }
  CX.fillStyle = 'rgba(255,130,110,0.6)'; CX.fillRect(bx + 6, by + 13, 2, 2); CX.fillRect(bx + 16, by + 13, 2, 2);
  CX.globalAlpha = 1;
}

/* ---- start ---- */
function startCast() {
  const g = G.bookGhost; if (G.state !== 'book' || !g || !G.collected[G.sel]) return;
  launchCast(g, G.sel, false);
}
function startTutorial() {                       // guided practice: a Speedy Ghost and the motion spell (only 3 pieces)
  launchCast({ type: 4, x: 0, y: 0, sr: null, state: 'hidden', wrong: 0 }, 4, true);
}
function parkOf(c, s) { return s.center ? [c.hx, c.hy - 4.6] : [s.px, s.py - 3.6]; }
function launchCast(g, j, tut) {
  const type = g.type, ok = j === type, K = KERN[j].k, sp = SPELLS[j], hp = HEART[type];
  const c = {
    on: true, g, j, type, ok, tut, K, sp, hx: hp[0], hy: hp[1], t: 0, clock: 0,
    speed: (!tut && (G.castsDone | 0) >= 2) ? 1.5 : 1, done: false, skipped: false, cap: '', fired: {},
    P: [], Hh: [], amb: [], legs: [], stepIdx: 0, idle: 0, hintT: 0, progS: 0, esc: false
  };
  // camera keyframes: screen = S + (p - F) * Z   (p in sprite pixels)
  const sr = g.sr;
  c.camA = sr ? { Z: sr.size / SPR, Fx: 16, Fy: 16, Sx: sr.left + sr.size / 2, Sy: sr.top + sr.size / 2 } : { Z: 2.5, Fx: 16, Fy: 16, Sx: 160, Sy: 100 };
  c.camB = { Z: 4, Fx: 16, Fy: 16, Sx: 160, Sy: 84 };            // the whole ghost
  c.camC = { Z: 8, Fx: c.hx, Fy: c.hy, Sx: 160, Sy: 88 };          // close on the heart
  // fixed part of the timeline (seconds). The rest is scheduled when the child collects the last piece.
  c.tZoom = 0.8; c.tPush = 1.5; c.tCells = 1.3; c.tAmb = 1.0; c.tSp0 = 2.6; c.tSp1 = 3.5;
  c.tPl = c.tFly0 = c.tLand = c.tBounce = c.tPull = c.tScan = c.tWr = c.tEnd = Infinity;
  c.sumAbs = K.reduce((a, w) => a + Math.abs(w), 0); c.maxW = Math.max(...K.map(Math.abs));
  const jr = rng(type * 17 + j * 5 + 3);
  c.slots = ORDER.map(([dx, dy]) => {            // one floating piece of magic per spot around the heart (loose, not in a grid)
    const w = K[(dy + 1) * 3 + dx + 1], center = dx === 0 && dy === 0;
    return { dx, dy, w, center, t0: Infinity, arr: Infinity,
      px: c.hx + (center ? 0 : dx * 3.7 + (jr() - 0.5) * 0.9), py: c.hy + (center ? 0 : dy * 3.5 + (jr() - 0.5) * 0.9) };
  });
  c.steps = c.slots.filter((s) => s.w);          // what the child has to tap, in right -> left order
  c.legs.push({ t0: c.tSp0, t1: c.tSp1, from: [c.hx + 26, c.hy - 6], to: parkOf(c, c.steps[0]) });
  // scattered magic: little pieces floating on the ghost's body (fixed seed)
  const H0 = revFrames(type, 0, 0).d[0], rr = rng(type * 31 + 5);
  for (let n = 0; n < 400 && c.amb.length < 22; n++) {
    const x = 3 + rr() * 26, y = 2 + rr() * 28;
    if (H0[((y | 0) * SPR + (x | 0)) * 4 + 3] > 40) c.amb.push({ x, y, ph: rr() * TAU, r: 0.4 + rr() * 0.5, warm: rr() < 0.5 });
  }
  CAST = c;
  G.bookGhost = null; g.state = 'casting'; G.state = 'cast';
  hideScreens(); showScreen('castScene');
  $('castBox').style.setProperty('--cc', sp.color); $('castHint').textContent = tr('castSkip');
  castCaption(c); drawCast(c);
}

/* ---- camera ---- */
function camAt(c, t) {
  let a, b, u;
  if (t < c.tZoom) { a = c.camA; b = c.camB; u = ease(t / c.tZoom); }
  else if (t < c.tPush) { a = c.camB; b = c.camC; u = ease((t - c.tZoom) / (c.tPush - c.tZoom)); }
  else if (t < c.tPull) { a = b = c.camC; u = 0; }
  else { a = c.camC; b = c.camB; u = ease((t - c.tPull) / 0.55); }
  return { Z: lerp(a.Z, b.Z, u), Fx: lerp(a.Fx, b.Fx, u), Fy: lerp(a.Fy, b.Fy, u), Sx: lerp(a.Sx, b.Sx, u), Sy: lerp(a.Sy, b.Sy, u) };
}
function castView(c, t) {
  const cm = camAt(c, t), Z = cm.Z;
  return { cm, Z, X: (p) => cm.Sx + (p - cm.Fx) * Z, Y: (p) => cm.Sy + (p - cm.Fy) * Z };
}

/* ---- the spell orb: a list of "legs" (moves). The child's taps add legs, so the orb follows the child. ---- */
function orbPos(c, t) {
  const Ls = c.legs; let l = Ls[0];
  for (let i = Ls.length - 1; i >= 0; i--) if (t >= Ls[i].t0) { l = Ls[i]; break; }
  const u = ease((t - l.t0) / (l.t1 - l.t0));
  return [lerp(l.from[0], l.to[0], u), lerp(l.from[1], l.to[1], u)];
}
function orbAt(c, t) {
  const p = orbPos(c, t); let x = p[0], y = p[1], sz = 3.4;
  if (t < c.tFly0) y += Math.sin(c.clock * 6) * 0.25;
  else if (c.ok) sz = lerp(3.4, 3, ease((t - c.tFly0) / (c.tLand - c.tFly0)));
  else if (t >= c.tBounce && t < c.tBounce + 0.5) x += Math.sin(t * 60) * 0.5;
  return { x, y, sz };
}

/* ---- collecting: the child (or the idle helper / skip) triggers the next piece ---- */
function trigger(c, tt) {
  const s = c.steps[c.stepIdx];
  s.t0 = tt; s.arr = tt + (s.center ? 0.3 : 0.55);
  c.legs = c.legs.filter((l) => l.t0 <= tt);               // forget moves that have not started yet
  const cur = orbPos(c, tt);
  c.legs.push({ t0: tt, t1: tt + 0.2, from: cur, to: [s.px, s.py] });             // the orb zips to the piece
  c.stepIdx++;
  if (c.stepIdx < c.steps.length) c.legs.push({ t0: tt + 0.3, t1: tt + 0.7, from: [s.px, s.py], to: parkOf(c, c.steps[c.stepIdx]) });
  else finishSchedule(c, s.arr, s);
}
function finishSchedule(c, lastArr, s) {                    // the last piece is on its way: schedule everything after it
  c.tPl = lastArr + 0.15; c.tFly0 = c.tPl + 0.3; c.tLand = c.tFly0 + 0.55; c.tBounce = c.tFly0 + 0.4; c.tPull = c.tLand + 0.6;
  if (c.ok) { c.tScan = c.tPull + 0.55; c.tEnd = c.tScan + REVEAL_T + 0.6; }
  else { c.tWr = c.tPull + 0.2; c.tEnd = c.tWr + WRONG_T + 0.5; }
  const last = [s.px, s.py], h = [c.hx, c.hy];
  if (c.ok) c.legs.push({ t0: c.tFly0, t1: c.tLand, from: last, to: h });
  else {
    const near = [lerp(last[0], h[0], 0.8), lerp(last[1], h[1], 0.8)];
    c.legs.push({ t0: c.tFly0, t1: c.tBounce, from: last, to: near }, { t0: c.tBounce, t1: c.tBounce + 0.35, from: near, to: last });
  }
}
function castCollect(c) {
  if (!c.on || c.done || c.t < c.tSp1 || c.stepIdx >= c.steps.length) return;
  trigger(c, c.t); c.idle = 0;
}
function castSkip(c) {
  if (c.done) return;
  c.skipped = true;
  let tt = Math.max(c.t, c.tSp1);
  while (c.stepIdx < c.steps.length) { trigger(c, tt); tt += 0.27; }
  c.t = c.tEnd; c.done = true; castEvents(c); $('castHint').textContent = tr('castCont');
}

/* ---- events, particles, captions ---- */
function castSparks(c, x, y, rgb, n, spd, smoke) {
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = spd * (0.3 + rnd() * 0.7); c.P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (smoke ? 2 : 0), l: 0.5 + rnd() * 0.6, m: 1.1, c: rgb, s: 0.3 + rnd() * 0.4 }); }
}
function castEvents(c) {
  const t = c.t, rgb = c.sp.rgb;
  const fire = (k, cond, fn) => { if (cond && !c.fired[k]) { c.fired[k] = true; if (!c.skipped) fn(); } };
  fire('zoom', t > 0.02, () => sfx('zoom'));
  fire('spell', t >= c.tSp0, () => sfx('scan'));
  c.slots.forEach((s, i) => { if (s.w) fire('s' + i, t >= s.arr, () => { sfx('pick'); castSparks(c, c.hx, c.hy, rgb, 4, 5); }); });
  fire('land', t >= (c.ok ? c.tLand : c.tBounce), () => {
    if (c.ok) {
      sfx('correct'); castSparks(c, c.hx, c.hy, rgb, 46, 16); castSparks(c, c.hx, c.hy, [255, 255, 255], 16, 9);
      for (let i = 0; i < 9; i++) c.Hh.push({ x: c.hx + (rnd() - 0.5) * 5, y: c.hy + (rnd() - 0.5) * 2, vx: (rnd() - 0.5) * 3, vy: -(2 + rnd() * 3), l: 1.4 + rnd() * 0.8, m: 2 });
    } else { sfx('wrong'); sfx('fizzle'); castSparks(c, c.hx, c.hy, [130, 130, 140], 30, 7, true); }
  });
  fire('scan', c.ok && t >= c.tScan, () => sfx('scan'));
  fire('wr', !c.ok && t >= c.tWr, () => sfx('scan'));
}
function castCaption(c) {
  const t = c.t, T = c.tut; let k = '';
  if (t >= 0.6) {
    if (t < 1.9) k = T ? 'castT1' : 'castC1';
    else if (t < c.tSp0) k = T ? 'castT1' : 'castC2';
    else if (t < c.tSp1 + 0.1) k = T ? 'castT2' : 'castC3';
    else if (t < c.tPl) k = c.hintT > 0 ? 'castOrder' : (T ? 'castT4' : 'castC4');
    else if (t < c.tLand + 0.4) k = c.ok ? 'castC5' : 'castW1';
    else if (c.ok) k = t < c.tScan ? 'castC6' : t < c.tScan + REVEAL_T ? 'castC7' : (T ? 'castT8' : 'castC8');
    else k = 'castW2';
  }
  if (k !== c.cap) { c.cap = k; const e = $('castText'); e.textContent = k ? tr(k) : ''; e.classList.toggle('bad', k === 'castW1' || k === 'castW2' || k === 'castOrder'); }
}
function updateCast(dt) {
  const c = CAST; if (!c.on) return;
  c.clock += dt;
  if (!c.done) {
    c.t = Math.min(c.tEnd, c.t + dt * c.speed); castEvents(c);
    if (c.t >= c.tSp1 && c.stepIdx < c.steps.length) { c.idle += dt; if (c.idle > 10) castCollect(c); }   // gentle help if the child waits too long
    if (c.t >= c.tEnd) { c.done = true; $('castHint').textContent = tr('castCont'); }
  }
  c.hintT = Math.max(0, c.hintT - dt);
  c.progS += ((c.steps.length ? c.stepIdx / c.steps.length : 0) - c.progS) * Math.min(1, dt * 6);
  for (let i = c.P.length - 1; i >= 0; i--) { const p = c.P[i]; p.l -= dt; if (p.l <= 0) { c.P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; }
  for (let i = c.Hh.length - 1; i >= 0; i--) { const p = c.Hh[i]; p.l -= dt; if (p.l <= 0) { c.Hh.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; }
  castCaption(c); drawCast(c);
}
/* ENTER / SPACE: collect the next piece (keyboard players), or continue when the scene is finished. ESC: skip. */
function castAdvance() {
  const c = CAST; if (!c.on) return;
  if (c.done) { endCast(); return; }
  if (c.esc) { c.esc = false; castSkip(c); return; }
  castCollect(c);
}
window.addEventListener('keydown', (e) => { if (G.state === 'cast' && CAST.on) CAST.esc = (e.code === 'Escape'); });
function endCast() {
  const c = CAST; if (!c.on || G.state !== 'cast') return;
  const g = c.g; c.on = false; hideScreens();
  if (c.tut) { beginPlaying(); return; }             // the practice round is over: the real game starts
  G.castsDone = (G.castsDone | 0) + 1;
  if (c.ok) { g.state = 'revealed'; burst(g.x, g.y, 0.45, SPELLS[g.type].rgb, 30); toast(tr('identified'), SPELLS[g.type].color); }
  else {
    g.wrong++; g.state = 'hidden'; G.wrongTotal = (G.wrongTotal | 0) + 1;
    toast(tr('wrong') + (g.wrong < 2 ? ' ' + (2 - g.wrong) + ' ' + tr('attemptsLeft') : ''), '#ff4a4a');
    if (g.wrong >= 2) { loseGame('spells'); return; }
  }
  G.state = 'playing'; lockPointer();
}
/* tap / click on the scene: collect the glowing piece, or continue when finished */
$('castScene').addEventListener('pointerdown', (e) => {
  AU.init(); const c = CAST; if (!c.on) return;
  if (c.done) { endCast(); return; }
  if (c.t < c.tSp1 || c.stepIdx >= c.steps.length) return;
  const r = CASTC.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width * W, my = (e.clientY - r.top) / r.height * H;
  const v = castView(c, c.t), hit = (s) => Math.hypot(v.X(s.px) - mx, v.Y(s.py) - my) < 2.4 * v.Z;
  if (hit(c.steps[c.stepIdx])) castCollect(c);
  else if (c.steps.slice(c.stepIdx + 1).some(hit)) { c.hintT = 2.2; sfx('miss'); }      // tapped a piece that is not the next one
});

/* ---- drawing ---- */
function drawCast(c) {
  const t = c.t, V = castView(c, t), Z = V.Z, X = V.X, Y = V.Y, rgb = c.sp.rgb, hx = c.hx, hy = c.hy, ok = c.ok;
  const light = [Math.min(255, rgb[0] + 70), Math.min(255, rgb[1] + 70), Math.min(255, rgb[2] + 70)];
  CX.globalAlpha = 1; CX.clearRect(0, 0, W, H);
  CX.fillStyle = 'rgba(8,4,16,' + (ease(t / 0.8) * 0.94).toFixed(3) + ')'; CX.fillRect(0, 0, W, H);
  const au = ease((t - 0.3) / 0.6);
  if (au > 0) for (let k = 3; k >= 1; k--) disc(X(16), Y(16), 15 * Z * k / 3, rgba(rgb, 0.05 * au));

  // --- the ghost (hidden form -> real reveal frames -> true form) ---
  const f = ((c.clock * 6) | 0) & 3; let im;
  if (ok) im = t < c.tScan ? ghostCanvas(c.type, 1, f, 0) : t < c.tScan + REVEAL_T ? scanCanvas({ type: c.type, state: 'revealing', rt: t - c.tScan }, f) : ghostCanvas(c.type, 2, f, 0);
  else im = (t >= c.tWr && t < c.tWr + WRONG_T) ? scanCanvas({ type: c.type, state: 'wrongcast', wj: c.j, rt: t - c.tWr }, f) : ghostCanvas(c.type, 1, f, 0);
  CX.globalAlpha = 0.96; CX.drawImage(im, X(0), Y(0), SPR * Z, SPR * Z); CX.globalAlpha = 1;

  // --- the orb sweeps over the WHOLE ghost: the same magic fixes every spot ---
  const sweeping = ok ? (t >= c.tScan && t < c.tScan + REVEAL_T) : (t >= c.tWr && t < c.tWr + WRONG_SCAN);
  if (sweeping) {
    let k;
    if (ok) { const kk = clamp((t - c.tScan) / REVEAL_T, 0, 0.9999) * PASSES[c.type]; k = kk - (kk | 0); } else k = clamp((t - c.tWr) / WRONG_SCAN, 0, 1);
    const pos = clamp((k * SPR * SPR) | 0, 0, SPR * SPR - 1), sx = pos % SPR + 0.5, sy = ((pos / SPR) | 0) + 0.5;
    disc(X(sx), Y(sy), 1.6 * Z, rgba(rgb, 0.3)); disc(X(sx), Y(sy), 0.8 * Z, rgba([255, 255, 255], 0.85));
    CX.drawImage(drawRuneCached(c.j), X(sx - 1.3), Y(sy - 1.3), 2.6 * Z, 2.6 * Z);
  }

  // --- scattered magic floating on the body; it gathers into the heart at the end ---
  const ambA = ease((t - c.tAmb) / 0.5);
  if (ambA > 0) {
    const gat = ok ? ease((t - c.tPl) / 0.6) : 0, fade = ok ? 0 : ease((t - c.tBounce) / 0.8);
    c.amb.forEach((a) => {
      let px = a.x + Math.sin(c.clock * 1.7 + a.ph) * 0.7, py = a.y + Math.cos(c.clock * 1.3 + a.ph) * 0.7, al = ambA * (0.55 + 0.45 * Math.sin(c.clock * 5 + a.ph));
      px = lerp(px, hx, gat); py = lerp(py, hy, gat); al *= (1 - gat * 0.9) * (1 - fade);
      if (al <= 0.02) return;
      const s = Math.max(2, Math.round(a.r * Z * 0.6)); CX.fillStyle = rgba(a.warm ? light : PALE, al); CX.fillRect(Math.round(X(px) - s / 2), Math.round(Y(py) - s / 2), s, s);
    });
  }

  // --- the heart ---
  const hs = CELL * Z, hx0 = X(hx - CELL / 2), hy0 = Y(hy - CELL / 2), hcx = X(hx), hcy = Y(hy);
  const placed = ok && t >= c.tLand;
  let fill = 0; c.slots.forEach((s) => { if (s.w) fill += ease((t - (s.arr - 0.2)) / 0.25) * Math.abs(s.w) / c.sumAbs; });
  if (!ok) fill *= 0.6 * (1 - ease((t - c.tBounce) / 0.6));
  if (!placed) {
    CX.globalAlpha = ease((t - 0.9) / 0.5) * (0.8 + 0.2 * Math.sin(c.clock * 4)); CX.drawImage(GREY_RUNE_CV[c.type], hx0, hy0, hs, hs); CX.globalAlpha = 1;
    if (fill > 0.01) {
      const sh = Math.max(1, Math.round(16 * fill));                         // the collected magic fills the grey shape from the bottom
      CX.drawImage(heartTint(c.type, light), 0, 16 - sh, 16, sh, hx0, hy0 + hs * (16 - sh) / 16, hs, hs * sh / 16);
      disc(hcx, hcy, (0.5 + fill * 1.6 + 0.15 * Math.sin(c.clock * 9)) * Z, rgba(light, 0.28));
    }
    const cs = c.slots.find((s) => s.center && s.w);
    if (cs && t >= cs.t0 && t < cs.arr + 0.2) ring(hcx, hcy, (1.4 + 1.2 * ease((t - cs.t0) / 0.4)) * Z, rgba(light, 0.6));
  } else {
    const since = t - c.tLand, k = 1 + 0.4 * Math.exp(-since * 6);
    disc(hcx, hcy, (2.2 + 0.4 * Math.sin(c.clock * 5)) * Z, rgba(light, 0.2));
    const rc = drawRuneCached(c.type), s = hs * k; CX.drawImage(rc, hcx - s / 2, hcy - s / 2, s, s);
    if (since < 0.8) ring(hcx, hcy, since * 7 * Z, rgba([255, 255, 255], 0.8 * (1 - since / 0.8)));
  }

  // --- the pieces of magic floating around the heart, flying in when the child taps them ---
  c.slots.forEach((s, n) => {
    if (s.center) return;
    const ap = ease((t - c.tCells - n * 0.1) / 0.25); if (ap <= 0) return;
    const bob = Math.sin(c.clock * 2.2 + n * 1.7) * 0.25;
    const px0 = s.px + bob * 0.6, py0 = s.py + bob;
    if (!s.w) { disc(X(px0), Y(py0), 0.5 * Z, rgba(PALE, ap * (t > c.tSp1 ? 0.2 : 0.55))); return; }
    if (t >= s.arr) return;
    const aw = Math.abs(s.w) / c.maxW, grow = ease((t - s.t0) / 0.12);
    const r = lerp(0.7 + 0.08 * Math.sin(c.clock * 6 + n), 0.45 + 0.95 * aw, grow), col = mixc(PALE, light, grow);
    const dxh = hx - px0, dyh = hy - py0, len = Math.hypot(dxh, dyh) || 1, sg = s.dx >= 0 ? 1 : -1;
    const qx = (px0 + hx) / 2 - dyh / len * 2 * sg, qy = (py0 + hy) / 2 + dxh / len * 2 * sg;
    const pos = (u) => [(1 - u) * (1 - u) * px0 + 2 * (1 - u) * u * qx + u * u * hx, (1 - u) * (1 - u) * py0 + 2 * (1 - u) * u * qy + u * u * hy];
    const f0 = s.t0 + 0.12, fu = t > f0 ? ease((t - f0) / (s.arr - f0)) : 0;
    for (let k = 4; k >= 1; k--) { const uu = fu - k * 0.07; if (uu > 0) { const q = pos(uu); disc(X(q[0]), Y(q[1]), r * (1 - k * 0.15) * Z, rgba(col, 0.45 / k)); } }
    const q = pos(fu), x = X(q[0]), y = Y(q[1]);
    if (s.w > 0) disc(x, y, r * Z, rgba(col, Math.max(ap, grow)));
    else { disc(x, y, r * Z, rgba(light, 1)); disc(x, y, r * Z * 0.55, 'rgb(26,10,40)'); }
  });

  // --- "tap me!": the next piece glows and has a little arrow ---
  const cur = (t >= c.tSp1 - 0.3 && !c.skipped && c.stepIdx < c.steps.length) ? c.steps[c.stepIdx] : null;
  if (cur) {
    const gx = X(cur.px), gy = Y(cur.py), pul = 0.5 + 0.5 * Math.sin(c.clock * 6), rr0 = (cur.center ? 2.4 : 1.6) * Z * (c.idle > 4 ? 1.3 : 1);
    disc(gx, gy, rr0 * 0.9, rgba(light, 0.1 + 0.1 * pul));
    ring(gx, gy, rr0 + pul * Z * 0.3, rgba([255, 255, 255], 0.85));
    const yb = gy + rr0 + Z * 0.5 + Math.round(pul * 3);
    CX.fillStyle = rgba([255, 255, 255], 0.95);
    for (let r = 0; r < 6; r++) CX.fillRect(Math.round(gx - r), Math.round(yb + r), r * 2 + 1, 1);
    CX.fillRect(Math.round(gx - 1), Math.round(yb + 6), 3, 6);
  }

  // --- little arrow under the heart while collecting: right -> left ---
  if (t >= c.tSp1 - 0.2 && t < c.tPl) {
    const ya = Y(hy + 7.6), xa = X(hx + 5.5), xb = X(hx - 5.5);
    CX.fillStyle = rgba(light, 0.55); CX.fillRect(Math.round(xb), Math.round(ya - 1), Math.round(xa - xb), 2);
    for (let k = 0; k < 5; k++) CX.fillRect(Math.round(xb + k * 2), Math.round(ya - k), 2, 2 * k + 1);      // arrow head pointing left
    disc(xa - (xa - xb) * c.progS, ya, 0.45 * Z, rgba([255, 255, 255], 0.9));
  }

  // --- the spell: a glowing magic orb carrying its symbol ---
  if (t >= c.tSp0 && !placed) {
    const o = orbAt(c, t), rc = drawRuneCached(c.j);
    let a = ease((t - c.tSp0) / 0.3); if (!ok) a *= 1 - ease((t - c.tBounce - 0.3) / 0.4);
    for (let k = 3; k >= 1; k--) {                                              // glowing tail behind the orb
      const tt = t - k * 0.07; if (tt < c.tSp0) continue;
      const q = orbAt(c, tt); disc(X(q.x), Y(q.y), q.sz * 0.5 * Z * (1 - k * 0.15), rgba(rgb, 0.16 * a));
    }
    const ox = X(o.x), oy = Y(o.y), orad = o.sz * 0.62 * Z;
    disc(ox, oy, orad, rgba(rgb, 0.3 * a));
    ring(ox, oy, orad + Math.sin(c.clock * 8) * Z * 0.12, rgba(light, 0.7 * a));
    CX.globalAlpha = a; CX.drawImage(rc, X(o.x - o.sz / 2), Y(o.y - o.sz / 2), o.sz * Z, o.sz * Z); CX.globalAlpha = 1;
  }
  if (!ok && t >= c.tBounce && t < c.tPull) {                                   // red cross on the heart: it does not fit
    const a = 1 - ease((t - c.tBounce - 0.5) / 0.4), q = Math.max(2, (Z / 3) | 0); CX.fillStyle = rgba([255, 74, 74], a);
    for (let k = -4; k <= 4; k++) { CX.fillRect(Math.round(hcx + k * Z * 0.35), Math.round(hcy + k * Z * 0.35), q, q); CX.fillRect(Math.round(hcx + k * Z * 0.35), Math.round(hcy - k * Z * 0.35), q, q); }
  }

  // --- particles, happy hearts, the final flash ---
  c.P.forEach((p) => { const s = Math.max(1, Math.round(p.s * Z)); CX.fillStyle = rgba(p.c, Math.min(1, p.l / p.m * 1.6)); CX.fillRect(Math.round(X(p.x)), Math.round(Y(p.y)), s, s); });
  c.Hh.forEach((p) => {
    CX.fillStyle = rgba([255, 110, 150], Math.min(1, p.l / p.m * 1.6));
    const x0 = Math.round(X(p.x)) - 3, y0 = Math.round(Y(p.y)) - 3;
    HEARTPX.forEach((row, yy) => { for (let xx = 0; xx < 7; xx++) if (row[xx] === 'X') CX.fillRect(x0 + xx, y0 + yy, 1, 1); });
  });
  if (ok && t >= c.tLand && t < c.tLand + 0.35) { CX.fillStyle = rgba([255, 255, 255], 0.5 * (1 - (t - c.tLand) / 0.35)); CX.fillRect(0, 0, W, H); }

  // --- Lumi, the helper ---
  drawHelper(c, (c.hintT > 0 || (!ok && t >= c.tBounce)) ? 'worried' : (ok && t >= c.tLand) ? 'happy' : 'normal', ease((t - 0.5) / 0.4));
}