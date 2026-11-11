'use strict';

/* ============================================================================
   CAST SCENE: what happens when a spell is cast on a ghost. Pictures only.
     1  the camera zooms in on the ghost
     2  a grey shadow of the spell symbol marks where its FREEDOM GEM should be;
        tiny FREEDOM SPARKS (a different number for each ghost) hide on its body
     3  the spell, a glowing orb carrying its symbol, glides in from the right
     4  it passes THROUGH the ghost's body and gathers every spark
     5  it carries them to the gem's place: the gem lights up
     6  the ghost shows its true form
   Wrong spell: the sparks ignore the orb, the gem stays dark.
   ============================================================================ */

Object.assign(L.en, {
  castC1: 'This ghost is trapped. Its Freedom Gem is missing and only a grey shadow is left.',
  castC2: 'Tiny Freedom Sparks float in a square around the gem.',
  castC3: 'Your spell glides in, carrying its own symbol.',
  castC4: 'It passes through the ghost and gathers every Freedom Spark.',
  castC5: 'It carries them to the gem\'s place... and the gem lights up!',
  castC6: 'The Freedom Gem is awake! The ghost shows its true form.',
  castW1: 'These sparks do not answer to this spell. The gem stays dark.',
  castW2: 'WRONG SPELL! The ghost stays hidden.',
  castSkip: 'ENTER / CLICK: skip', castCont: 'ENTER / CLICK: continue',
  selectHint: 'Choose the spell whose symbol matches the grey gem on the ghost.'
});
Object.assign(L.ar, {
  castC1: 'هذا الشبح أسير. فقد جوهرة حريته ولم يبقَ منها سوى ظلّ رمادي.',
  castC2: 'شرارات الحرية الصغيرة تطفو على شكل مربّع حول الجوهرة.',
  castC3: 'تنساب تعويذتك نحوه حاملةً رمزها.',
  castC4: 'تعبر جسد الشبح وتجمع كل شرارات الحرية.',
  castC5: 'تحملها إلى مكان الجوهرة... فتُضيء الجوهرة!',
  castC6: 'استيقظت جوهرة الحرية! ويظهر الشبح بهيئته الحقيقية.',
  castW1: 'هذه الشرارات لا تستجيب لهذه التعويذة، فتبقى الجوهرة مظلمة.',
  castW2: 'تعويذة خاطئة! يبقى الشبح مختبئًا.',
  castSkip: 'ENTER / نقرة: تخطّي', castCont: 'ENTER / نقرة: متابعة',
  selectHint: 'اختر التعويذة التي يطابق رمزها الجوهرة الرمادية على الشبح.'
});

const CASTC = $('castCanvas'), CX = CASTC.getContext('2d');
CX.imageSmoothingEnabled = false;
let CAST = { on: false };
const CELL = 4;                                   // gem size in sprite pixels
const SPARK_N = [6, 5, 7, 6, 4];                  // number of Freedom Sparks per ghost type
const CTMP = mkCanvas(SPR, SPR), CTMPX = CTMP.getContext('2d');
const PALE = [215, 215, 245];

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + clamp(a, 0, 1).toFixed(3) + ')';

function disc(x, y, r, col) {
  r = Math.max(1, Math.round(r)); CX.fillStyle = col;
  for (let yy = -r; yy <= r; yy++) { const w = Math.floor(Math.sqrt(r * r - yy * yy)); CX.fillRect(Math.round(x - w), Math.round(y + yy), w * 2 + 1, 1); }
}
function ring(x, y, r, col) {
  CX.fillStyle = col; const n = Math.max(12, (r * 3) | 0);
  for (let i = 0; i < n; i++) { const a = i / n * TAU; CX.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 2, 2); }
}
function scanCanvas(o, f) {
  const b = scanSpr(o, f, 0);
  CTMPX.putImageData(new ImageData(new Uint8ClampedArray(b.buffer.slice(0)), SPR, SPR), 0, 0);
  return CTMP;
}

/* parts of different sizes and shapes: round, diamond, cross */
function drawPart(x, y, r, col, al, sh) {
  r = Math.max(2, Math.round(r)); disc(x, y, r * 1.9, rgba(col, al * 0.18)); CX.fillStyle = rgba(col, al);
  if (sh === 1) { for (let k = -r; k <= r; k++) { const w = r - Math.abs(k); CX.fillRect(Math.round(x - w), Math.round(y + k), w * 2 + 1, 1); } disc(x, y, r * 0.3, rgba([255, 255, 255], al * 0.9)); }
  else if (sh === 2) { const q = Math.max(1, Math.round(r * 0.5)); CX.fillRect(Math.round(x - r), Math.round(y - q / 2), r * 2, q); CX.fillRect(Math.round(x - q / 2), Math.round(y - r), q, r * 2); disc(x, y, r * 0.45, rgba([255, 255, 255], al)); }
  else { disc(x, y, r, rgba(col, al)); disc(x, y, r * 0.4, rgba([255, 255, 255], al * 0.85)); }
}

function startCast() {
  const g = G.bookGhost; if (G.state !== 'book' || !g || !G.collected[G.sel]) return;
  const j = G.sel, type = g.type, ok = j === type, sp = SPELLS[j], hp = HEART[type];
  const c = { on: true, g, j, type, ok, sp, hx: hp[0], hy: hp[1], t: 0, clock: 0, speed: (G.castsDone | 0) >= 2 ? 1.5 : 1, done: false, skipped: false, cap: '', fired: {}, P: [] };
  const sr = g.sr;
  c.camA = sr ? { Z: sr.size / SPR, Fx: 16, Fy: 16, Sx: sr.left + sr.size / 2, Sy: sr.top + sr.size / 2 } : { Z: 2.5, Fx: 16, Fy: 16, Sx: 160, Sy: 100 };
  c.camB = { Z: 4.4, Fx: 16, Fy: 16, Sx: 160, Sy: 84 };
  c.tZoom = 0.8; c.tAmb = 1.0; c.tSp0 = 2.4;
  // Freedom Sparks: a SQUARE of 8 places around the gem; this ghost's real parts sit on N of them (the rest are empty places)
  const rr = rng(type * 31 + 5), D = 5.5, RING = [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
  const ord = [0, 1, 2, 3, 4, 5, 6, 7]; for (let i = 7; i > 0; i--) { const q = (rr() * (i + 1)) | 0; [ord[i], ord[q]] = [ord[q], ord[i]]; }
  const real = new Set(ord.slice(0, SPARK_N[type]));
  const pts = RING.map((p, i) => ({ x: c.hx + p[0] * D, y: c.hy + p[1] * D, ph: rr() * TAU, k: 0.6 + rr() * 0.9, sh: (rr() * 3) | 0, real: real.has(i) }));
  pts.forEach((s, i) => { s.arr = 3.9 + i * 0.42; });
  c.sparks = pts; c.tFirst = pts.length ? pts[0].arr : 4.5;
  c.tLand = (pts.length ? pts[pts.length - 1].arr : 4.5) + 0.9;
  c.nodes = [{ x: c.hx + 26, y: c.hy - 8, t: c.tSp0 }].concat(pts.map((s) => ({ x: s.x, y: s.y, t: s.arr })), [{ x: c.hx, y: c.hy, t: c.tLand }]);
  if (ok) { c.tScan = c.tLand + 0.9; c.tEnd = c.tScan + REVEAL_T + 0.6; }
  else { c.tWr = c.tLand + 0.9; c.tEnd = c.tWr + WRONG_T + 0.5; }
  CAST = c;
  G.bookGhost = null; g.state = 'casting'; G.state = 'cast';
  hideScreens(); showScreen('castScene');
  $('castBox').style.setProperty('--cc', sp.color); $('castHint').textContent = tr('castSkip');
  castCaption(c); drawCast(c);
}

function camAt(c, t) {
  const a = c.camA, b = c.camB, u = ease(t / c.tZoom);
  return { Z: lerp(a.Z, b.Z, u), Fx: lerp(a.Fx, b.Fx, u), Fy: lerp(a.Fy, b.Fy, u), Sx: lerp(a.Sx, b.Sx, u), Sy: lerp(a.Sy, b.Sy, u) };
}
/* the orb enters from the right, visits every spark (passing through the body), then flies to the gem */
function orbAt(c, t) {
  const N = c.nodes; let i = 0;
  while (i < N.length - 2 && t >= N[i + 1].t) i++;
  const a = N[i], b = N[i + 1], u = ease((t - a.t) / (b.t - a.t));
  let x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) + Math.sin(c.clock * 7) * 0.2;
  if (t >= c.tLand && !c.ok) { const v = ease((t - c.tLand) / 0.5); x = lerp(c.hx, c.hx + 10, v); y = lerp(c.hy, c.hy - 6, v); }
  return { x, y, sz: 3.4 };
}

function castSparks(c, x, y, rgb, n, spd, smoke) {
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = spd * (0.3 + rnd() * 0.7); c.P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (smoke ? 2 : 0), l: 0.5 + rnd() * 0.6, m: 1.1, c: rgb, s: 0.3 + rnd() * 0.4 }); }
}
function castEvents(c) {
  const t = c.t, rgb = c.sp.rgb;
  const fire = (k, cond, fn) => { if (cond && !c.fired[k]) { c.fired[k] = true; if (!c.skipped) fn(); } };
  fire('zoom', t > 0.02, () => sfx('zoom'));
  fire('spell', t >= c.tSp0, () => sfx('scan'));
  c.sparks.forEach((s, i) => fire('s' + i, s.real && t >= s.arr, () => { sfx(c.ok ? 'pick' : 'fizzle'); castSparks(c, s.x, s.y, c.ok ? rgb : [130, 130, 140], 4, 5); }));
  fire('land', t >= c.tLand, () => {
    if (c.ok) { sfx('correct'); castSparks(c, c.hx, c.hy, rgb, 46, 16); castSparks(c, c.hx, c.hy, [255, 255, 255], 16, 9); }
    else { sfx('wrong'); sfx('fizzle'); castSparks(c, c.hx, c.hy, [130, 130, 140], 30, 7, true); }
  });
  fire('scan', c.ok && t >= c.tScan, () => sfx('scan'));
  fire('wr', !c.ok && t >= c.tWr, () => sfx('scan'));
}
function castCaption(c) {
  const t = c.t; let k = '';
  if (t >= 0.6) k = t < 1.9 ? 'castC1' : t < c.tSp0 ? 'castC2' : t < c.tFirst ? 'castC3' : t < c.tLand ? 'castC4' : t < c.tLand + 0.9 ? (c.ok ? 'castC5' : 'castW1') : (c.ok ? 'castC6' : 'castW2');
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
function castAdvance() {
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

function drawCast(c) {
  const t = c.t, cm = camAt(c, t), Z = cm.Z, rgb = c.sp.rgb, hx = c.hx, hy = c.hy, ok = c.ok, N = Math.max(1, c.sparks.length);
  const X = (p) => cm.Sx + (p - cm.Fx) * Z, Y = (p) => cm.Sy + (p - cm.Fy) * Z;
  const light = rgb.map((v) => Math.min(255, v + 70));
  CX.globalAlpha = 1; CX.clearRect(0, 0, W, H);
  CX.fillStyle = 'rgba(8,4,16,' + (ease(t / 0.8) * 0.94).toFixed(3) + ')'; CX.fillRect(0, 0, W, H);
  const au = ease((t - 0.3) / 0.6);
  if (au > 0) for (let k = 3; k >= 1; k--) disc(X(16), Y(16), 15 * Z * k / 3, rgba(rgb, 0.05 * au));

  // ghost: hidden form -> real reveal frames -> true form
  const f = ((c.clock * 6) | 0) & 3; let im;
  if (ok) im = t < c.tScan ? ghostCanvas(c.type, 1, f, 0) : t < c.tScan + REVEAL_T ? scanCanvas({ type: c.type, state: 'revealing', rt: t - c.tScan }, f) : ghostCanvas(c.type, 2, f, 0);
  else im = (t >= c.tWr && t < c.tWr + WRONG_T) ? scanCanvas({ type: c.type, state: 'wrongcast', wj: c.j, rt: t - c.tWr }, f) : ghostCanvas(c.type, 1, f, 0);
  CX.globalAlpha = 0.96; CX.drawImage(im, X(0), Y(0), SPR * Z, SPR * Z); CX.globalAlpha = 1;

  // the Freedom Gem: a grey shadow until the right spell lights it up
  const placed = ok && t >= c.tLand, hs = CELL * Z, gx = X(hx), gy = Y(hy);
  const tot = c.sparks.filter((s) => s.real).reduce((a, s) => a + s.k, 0) || 1, fill = ok ? c.sparks.filter((s) => s.real && t >= s.arr).reduce((a, s) => a + s.k, 0) / tot : 0;
  if (!placed) {
    CX.globalAlpha = ease((t - 0.9) / 0.5) * (0.8 + 0.2 * Math.sin(c.clock * 4)); CX.drawImage(GREY_RUNE_CV[c.type], gx - hs / 2, gy - hs / 2, hs, hs); CX.globalAlpha = 1;
    if (fill > 0) disc(gx, gy, (0.8 + fill * 2) * Z, rgba(light, 0.12 + 0.2 * fill));
  } else {
    const since = t - c.tLand, k = 1 + 0.4 * Math.exp(-since * 6), s = hs * k;
    disc(gx, gy, (2.6 + 0.4 * Math.sin(c.clock * 5)) * Z, rgba(light, 0.22));
    CX.drawImage(drawRuneCached(c.type), gx - s / 2, gy - s / 2, s, s);
    if (since < 0.9) ring(gx, gy, since * 8 * Z, rgba([255, 255, 255], 0.8 * (1 - since / 0.9)));
  }

  // Freedom Sparks: float on the body; the right spell makes them follow the orb into the gem
  const orb = t >= c.tSp0 ? orbAt(c, t) : null;
  c.sparks.forEach((s, i) => {
    const ap = ease((t - c.tAmb - i * 0.12) / 0.3); if (ap <= 0) return;
    let px = s.x + Math.sin(c.clock * 1.7 + s.ph) * 0.5, py = s.y + Math.cos(c.clock * 1.3 + s.ph) * 0.5, al = ap, col = PALE;
    const r = 0.75 + 0.15 * Math.sin(c.clock * 6 + s.ph);
    if (!s.real) { const fa = ap * 0.5 * (1 - ease((t - c.tLand) / 0.5)); if (fa > 0.02) { disc(X(px), Y(py), 0.55 * Z, rgba(PALE, fa * 0.5)); disc(X(px), Y(py), 0.3 * Z, rgba([20, 10, 40], fa)); } return; }
    if (t >= s.arr) {
      if (!ok) { al = ap * 0.35 * (1 - ease((t - c.tLand) / 0.6)); col = [140, 140, 150]; }
      else {
        const q = 1 - ease((t - (c.tLand - 0.5)) / 0.5), a = c.clock * 5 + i * TAU / N;
        px = orb.x + Math.cos(a) * 2.1 * q; py = orb.y + Math.sin(a) * 2.1 * q; col = light;
        al = t >= c.tLand ? 1 - ease((t - c.tLand) / 0.25) : 1;
      }
    }
    if (al <= 0.02) return;
    drawPart(X(px), Y(py), r * s.k * Z, col, al, s.sh);
    if (ok && t >= s.arr && t < s.arr + 0.4) ring(X(s.x), Y(s.y), (t - s.arr) * 6 * Z, rgba(light, 0.8 * (1 - (t - s.arr) / 0.4)));
  });

  // the spell: a glowing orb with its symbol
  if (orb && !placed) {
    const rc = drawRuneCached(c.j); let a = ease((t - c.tSp0) / 0.3); if (!ok) a *= 1 - ease((t - c.tLand - 0.3) / 0.4);
    for (let k = 3; k >= 1; k--) { const tt = t - k * 0.07; if (tt < c.tSp0) continue; const q = orbAt(c, tt); disc(X(q.x), Y(q.y), q.sz * 0.5 * Z * (1 - k * 0.15), rgba(rgb, 0.16 * a)); }
    const ox = X(orb.x), oy = Y(orb.y), orad = orb.sz * 0.62 * Z;
    disc(ox, oy, orad, rgba(rgb, 0.3 * a)); ring(ox, oy, orad + Math.sin(c.clock * 8) * Z * 0.12, rgba(light, 0.7 * a));
    CX.globalAlpha = a; CX.drawImage(rc, X(orb.x - orb.sz / 2), Y(orb.y - orb.sz / 2), orb.sz * Z, orb.sz * Z); CX.globalAlpha = 1;
  }
  if (!ok && t >= c.tLand && t < c.tLand + 0.9) {
    const a = 1 - ease((t - c.tLand - 0.5) / 0.4), q = Math.max(2, (Z / 3) | 0); CX.fillStyle = rgba([255, 74, 74], a);
    for (let k = -4; k <= 4; k++) { CX.fillRect(Math.round(gx + k * Z * 0.35), Math.round(gy + k * Z * 0.35), q, q); CX.fillRect(Math.round(gx + k * Z * 0.35), Math.round(gy - k * Z * 0.35), q, q); }
  }
  c.P.forEach((p) => { const s = Math.max(1, Math.round(p.s * Z)); CX.fillStyle = rgba(p.c, Math.min(1, p.l / p.m * 1.6)); CX.fillRect(Math.round(X(p.x)), Math.round(Y(p.y)), s, s); });
  if (ok && t >= c.tLand && t < c.tLand + 0.35) { CX.fillStyle = rgba([255, 255, 255], 0.5 * (1 - (t - c.tLand) / 0.35)); CX.fillRect(0, 0, W, H); }
}