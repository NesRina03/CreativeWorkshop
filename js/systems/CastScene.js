'use strict';

/* ============================================================================
   CAST SCENE: what happens when a spell is cast on a ghost.
   No grids, no numbers: the story is told only with pictures.

     1  the camera zooms in on the ghost
     2  a grey shadow of the spell symbol sits in its chest: the missing heart.
        Little pieces of magic float around it
     3  the spell (a glowing magic orb carrying its symbol) floats in from the right
     4  the orb flies around the heart, from RIGHT to LEFT, collecting the pieces.
        Each piece it touches flies into the heart and fills it up
     5  the orb dives into the heart and the spell symbol takes its place
     6  the camera pulls back and the ghost shows its true form

   Wrong spell: the pieces do not fit, the orb bounces off, the magic fades.
   Everything is drawn on #castCanvas (320x200). Coordinates are "ghost sprite pixels" (32x32).
   ============================================================================ */

Object.assign(L.en, {
  castC1: 'The ghost lost its magic heart. Only a grey shadow is left.',
  castC2: 'Bits of its magic are floating around the heart.',
  castC3: 'Your spell floats over, right next to the heart.',
  castC4: 'It collects the bits around the heart, from right to left, and brings them to the heart.',
  castC5: 'All the bits gather inside the heart... and your spell symbol takes its place!',
  castC6: 'The heart is back, and the ghost shows its true form!',
  castW1: 'The bits do not fit this heart... the magic fades away.',
  castW2: 'WRONG SPELL! The ghost stays hidden.',
  castSkip: 'ENTER / CLICK: skip', castCont: 'ENTER / CLICK: continue',
  selectHint: 'Pick the spell with the same symbol as the grey heart on the ghost.'
});
Object.assign(L.ar, {
  castC1: 'فقد الشبح قلبه السحري. لم يبقَ منه سوى ظلّ رمادي.',
  castC2: 'قطع من سحره تطفو حول القلب.',
  castC3: 'تطفو تعويذتك وتصل بجانب القلب.',
  castC4: 'تجمع القطع حول القلب، من اليمين إلى اليسار، وتحملها إلى القلب.',
  castC5: 'تجتمع كل القطع داخل القلب... ويأخذ رمز تعويذتك مكانه!',
  castC6: 'عاد القلب، وظهر الشبح بهيئته الحقيقية!',
  castW1: 'القطع لا تناسب هذا القلب... فيتلاشى السحر.',
  castW2: 'تعويذة خاطئة! يبقى الشبح مختبئًا.',
  castSkip: 'ENTER / نقرة: تخطي', castCont: 'ENTER / نقرة: متابعة',
  selectHint: 'اختر التعويذة التي لها نفس رمز القلب الرمادي على الشبح.'
});

const CASTC = $('castCanvas'), CX = CASTC.getContext('2d');
CX.imageSmoothingEnabled = false;
let CAST = { on: false };
const CELL = 3;                                  // size of the heart in sprite pixels
const ORDER = [[1, -1], [1, 0], [1, 1], [0, -1], [0, 0], [0, 1], [-1, -1], [-1, 0], [-1, 1]];   // right -> left, column by column
const CTMP = mkCanvas(SPR, SPR), CTMPX = CTMP.getContext('2d');
const PALE = [215, 215, 245];

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

/* ---- start ---- */
function startCast() {
  const g = G.bookGhost; if (G.state !== 'book' || !g || !G.collected[G.sel]) return;
  const j = G.sel, type = g.type, ok = j === type, K = KERN[j].k, sp = SPELLS[j], hp = HEART[type];
  const c = { on: true, g, j, type, ok, K, sp, hx: hp[0], hy: hp[1], t: 0, clock: 0, speed: (G.castsDone | 0) >= 2 ? 1.5 : 1, done: false, skipped: false, cap: '', fired: {}, P: [], amb: [] };
  // camera keyframes: screen = S + (p - F) * Z   (p in sprite pixels)
  const sr = g.sr;
  c.camA = sr ? { Z: sr.size / SPR, Fx: 16, Fy: 16, Sx: sr.left + sr.size / 2, Sy: sr.top + sr.size / 2 } : { Z: 2.5, Fx: 16, Fy: 16, Sx: 160, Sy: 100 };
  c.camB = { Z: 4, Fx: 16, Fy: 16, Sx: 160, Sy: 84 };            // the whole ghost
  c.camC = { Z: 8, Fx: c.hx, Fy: c.hy, Sx: 160, Sy: 88 };          // close on the heart
  // timeline (seconds)
  c.tZoom = 0.8; c.tPush = 1.5; c.tCells = 1.3; c.tAmb = 1.0; c.tSp0 = 3.0; c.tSp1 = 4.0; c.tColl = 4.1;
  c.sumAbs = K.reduce((a, w) => a + Math.abs(w), 0); c.maxW = Math.max(...K.map(Math.abs));
  const jr = rng(type * 17 + j * 5 + 3);
  let t = c.tColl;
  c.slots = ORDER.map(([dx, dy]) => {            // one slot per piece, in right-to-left order
    const w = K[(dy + 1) * 3 + dx + 1], center = dx === 0 && dy === 0;
    const s = { dx, dy, w, t0: t, center,
      px: c.hx + (center ? 0 : dx * 3.7 + (jr() - 0.5) * 0.9), py: c.hy + (center ? 0 : dy * 3.5 + (jr() - 0.5) * 0.9) };
    if (w) { s.arr = t + (s.center ? 0.25 : 0.55); t += 0.27; } else t += 0.09;
    s.t1 = t; return s;
  });
  c.tPl = Math.max(...c.slots.filter((s) => s.w).map((s) => s.arr)) + 0.15;    // all pieces are in the heart
  c.tFly0 = c.tPl + 0.3; c.tLand = c.tFly0 + 0.55; c.tBounce = c.tFly0 + 0.4;
  c.tPull = c.tLand + 0.6;                                                    // camera pulls back
  if (ok) { c.tScan = c.tPull + 0.55; c.tEnd = c.tScan + REVEAL_T + 0.6; }
  else { c.tWr = c.tPull + 0.2; c.tEnd = c.tWr + WRONG_T + 0.5; }
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

/* ---- the spell orb: floats in from the right, visits the pieces right -> left, then dives into the heart ---- */
function orbAt(c, t) {
  const S = c.slots, hx = c.hx, hy = c.hy, first = S[0], last = S[S.length - 1];
  let x, y, sz = 3.4;
  if (t < c.tSp1) {
    const u = ease((t - c.tSp0) / (c.tSp1 - c.tSp0));
    x = lerp(hx + 26, first.px, u); y = lerp(hy - 6, first.py, u);
  } else {
    let i = 0; while (i < S.length - 1 && t >= S[i + 1].t0) i++;
    const a = S[i], b = S[Math.min(i + 1, S.length - 1)];
    const u = i < S.length - 1 ? ease((t - a.t0) / (b.t0 - a.t0)) : 0;
    x = lerp(a.px, b.px, u); y = lerp(a.py, b.py, u);
  }
  if (t < c.tFly0) y += Math.sin(c.clock * 6) * 0.25;
  else if (c.ok) {
    const u = ease((t - c.tFly0) / (c.tLand - c.tFly0));
    x = lerp(last.px, hx, u); y = lerp(last.py, hy, u); sz = lerp(3.4, 3, u);
  } else {
    const u = t < c.tBounce ? ease((t - c.tFly0) / (c.tBounce - c.tFly0)) * 0.8 : 0.8 * (1 - ease((t - c.tBounce) / 0.35));
    x = lerp(last.px, hx, u); y = lerp(last.py, hy, u);
    if (t >= c.tBounce && t < c.tBounce + 0.5) x += Math.sin(t * 60) * 0.5;
  }
  return { x, y, sz };
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
    if (c.ok) { sfx('correct'); castSparks(c, c.hx, c.hy, rgb, 46, 16); castSparks(c, c.hx, c.hy, [255, 255, 255], 16, 9); }
    else { sfx('wrong'); sfx('fizzle'); castSparks(c, c.hx, c.hy, [130, 130, 140], 30, 7, true); }
  });
  fire('scan', c.ok && t >= c.tScan, () => sfx('scan'));
  fire('wr', !c.ok && t >= c.tWr, () => sfx('scan'));
}
function castCaption(c) {
  const t = c.t; let k = '';
  if (t >= 0.6) k = t < 1.9 ? 'castC1' : t < c.tSp0 ? 'castC2' : t < c.tSp1 + 0.1 ? 'castC3' : t < c.tPl ? 'castC4' : t < c.tLand + 0.4 ? (c.ok ? 'castC5' : 'castW1') : (c.ok ? 'castC6' : 'castW2');
  if (k !== c.cap) { c.cap = k; const e = $('castText'); e.textContent = k ? tr(k) : ''; e.classList.toggle('bad', k === 'castW1' || k === 'castW2'); }
}
function updateCast(dt) {
  const c = CAST; if (!c.on) return;
  c.clock += dt;
  if (!c.done) {
    c.t = Math.min(c.tEnd, c.t + dt * c.speed); castEvents(c);
    if (c.t >= c.tEnd) { c.done = true; $('castHint').textContent = tr('castCont'); }
  }
  for (let i = c.P.length - 1; i >= 0; i--) { const p = c.P[i]; p.l -= dt; if (p.l <= 0) { c.P.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; }
  castCaption(c); drawCast(c);
}
function castAdvance() {                         // ENTER / SPACE / click: skip the animation, then continue the game
  const c = CAST; if (!c.on) return;
  if (!c.done) { c.skipped = true; c.t = c.tEnd; c.done = true; castEvents(c); $('castHint').textContent = tr('castCont'); return; }
  endCast();
}
function endCast() {
  const c = CAST; if (!c.on || G.state !== 'cast') return;
  const g = c.g; c.on = false; G.castsDone = (G.castsDone | 0) + 1; hideScreens();
  if (c.ok) { g.state = 'revealed'; burst(g.x, g.y, 0.45, SPELLS[g.type].rgb, 30); toast(tr('identified'), SPELLS[g.type].color); }
  else {
    g.wrong++; g.state = 'hidden';
    toast(tr('wrong') + (g.wrong < 2 ? ' ' + (2 - g.wrong) + ' ' + tr('attemptsLeft') : ''), '#ff4a4a');
    if (g.wrong >= 2) { loseGame('spells'); return; }
  }
  G.state = 'playing'; lockPointer();
}
$('castScene').addEventListener('click', () => { AU.init(); castAdvance(); });

/* ---- drawing ---- */
function drawCast(c) {
  const t = c.t, cm = camAt(c, t), Z = cm.Z, rgb = c.sp.rgb, hx = c.hx, hy = c.hy, ok = c.ok;
  const X = (p) => cm.Sx + (p - cm.Fx) * Z, Y = (p) => cm.Sy + (p - cm.Fy) * Z;
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
  } else {
    const since = t - c.tLand, k = 1 + 0.4 * Math.exp(-since * 6);
    disc(hcx, hcy, (2.2 + 0.4 * Math.sin(c.clock * 5)) * Z, rgba(light, 0.2));
    const rc = drawRuneCached(c.type), s = hs * k; CX.drawImage(rc, hcx - s / 2, hcy - s / 2, s, s);
    if (since < 0.8) ring(hcx, hcy, since * 7 * Z, rgba([255, 255, 255], 0.8 * (1 - since / 0.8)));
  }

  // --- the pieces of magic floating around the heart, flying in when the orb touches them ---
  c.slots.forEach((s, n) => {
    if (s.center) return;
    const ap = ease((t - c.tCells - n * 0.1) / 0.25); if (ap <= 0) return;
    const bob = Math.sin(c.clock * 2.2 + n * 1.7) * 0.25;
    const px0 = s.px + bob * 0.6, py0 = s.py + bob;
    if (!s.w) { disc(X(px0), Y(py0), 0.5 * Z, rgba(PALE, ap * (t > s.t0 ? 0.2 : 0.55))); return; }
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

  // --- little arrow under the heart while the orb collects: right -> left ---
  if (t >= c.tColl - 0.2 && t < c.tPl) {
    const ya = Y(hy + 7.6), xa = X(hx + 5.5), xb = X(hx - 5.5), prog = clamp((t - c.tColl) / (c.tPl - c.tColl), 0, 1);
    CX.fillStyle = rgba(light, 0.55); CX.fillRect(Math.round(xb), Math.round(ya - 1), Math.round(xa - xb), 2);
    for (let k = 0; k < 5; k++) CX.fillRect(Math.round(xb + k * 2), Math.round(ya - k), 2, 2 * k + 1);      // arrow head pointing left
    disc(xa - (xa - xb) * prog, ya, 0.45 * Z, rgba([255, 255, 255], 0.9));
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

  // --- particles and the final flash ---
  c.P.forEach((p) => { const s = Math.max(1, Math.round(p.s * Z)); CX.fillStyle = rgba(p.c, Math.min(1, p.l / p.m * 1.6)); CX.fillRect(Math.round(X(p.x)), Math.round(Y(p.y)), s, s); });
  if (ok && t >= c.tLand && t < c.tLand + 0.35) { CX.fillStyle = rgba([255, 255, 255], 0.5 * (1 - (t - c.tLand) / 0.35)); CX.fillRect(0, 0, W, H); }
}