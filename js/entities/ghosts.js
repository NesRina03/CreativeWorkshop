'use strict';

/* ============================ 2. GAME DATA ============================ */
const SPELLS = [
  { color: '#3d8bff', rgb: [61, 139, 255], kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1], norm: '1/16',
    name: { en: 'THE GAUSSIAN VEIL', ar: 'حجاب غاوس' }, op: { en: 'Gaussian Blur', ar: 'تمويه غاوسي' },
    colorName: { en: 'BLUE', ar: 'أزرق' },
    fn: { en: 'Makes things soft and fuzzy, like looking through foggy glass.', ar: 'يجعل الأشياء ناعمة وضبابية، كأنك تنظر من خلف زجاج مغبّش.' },
    desc: { en: 'Imagine breathing on a window and seeing everything go soft and misty. This spell blurs tiny details until the picture looks smooth and dreamy. Choose it for a ghost that looks fuzzy and foggy.',
            ar: 'تخيّل أنك تنفخ على النافذة فتبدو الأشياء ناعمة وضبابية. تُذيب هذه التعويذة التفاصيل الصغيرة حتى تبدو الصورة هادئة ومموّهة. اخترها للشبح الذي يبدو مشوّشًا وضبابيًا.' } },
  { color: '#ff3b3b', rgb: [255, 59, 59], kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0], norm: null,
    name: { en: 'THE SHARPENING RUNE', ar: 'رونية الشحذ' }, op: { en: 'Sharpening', ar: 'تحسين الحدة' },
    colorName: { en: 'RED', ar: 'أحمر' },
    fn: { en: 'Makes edges bold and crisp, like tracing a drawing with a marker.', ar: 'يجعل الحواف واضحة وحادة، كأنك ترسم فوق الرسم بقلم عريض.' },
    desc: { en: 'Like going over a pencil drawing with a thick marker, this spell makes every edge bold and clear. Little details pop out and look extra sharp. Choose it for a ghost that looks rough, jagged and sparkly.',
            ar: 'كأنك تمرّ بقلم عريض فوق رسم بالرصاص، تجعل هذه التعويذة كل حافة واضحة وقوية. تبرز التفاصيل الصغيرة وتبدو حادة. اخترها للشبح الذي يبدو خشنًا ومسنّنًا ولامعًا.' } },
  { color: '#22e06a', rgb: [34, 224, 106], kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0], norm: null,
    name: { en: 'THE EDGE SEEKER', ar: 'باحث الحواف' }, op: { en: 'Laplacian Edge Detection', ar: 'كشف الحواف اللابلاسي' },
    colorName: { en: 'GREEN', ar: 'أخضر' },
    fn: { en: 'Keeps only the outlines, like a coloring-book page.', ar: 'يُبقي الخطوط الخارجية فقط، مثل صفحة تلوين.' },
    desc: { en: 'This spell erases the colors and keeps only the outlines, like a coloring-book page waiting for crayons. Flat areas turn black and only the borders glow. Choose it for a ghost that looks like glowing lines and dots.',
            ar: 'تمحو هذه التعويذة الألوان وتُبقي الخطوط الخارجية فقط، مثل صفحة تلوين تنتظر الألوان. تصبح المساحات الممتلئة سوداء وتتوهج الحدود فقط. اخترها للشبح الذي يبدو كخطوط ونقاط متوهجة.' } },
  { color: '#b45cff', rgb: [180, 92, 255], kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2], norm: null,
    name: { en: 'THE EMBOSS CURSE', ar: 'لعنة النقش البارز' }, op: { en: 'Embossing', ar: 'النقش البارز' },
    colorName: { en: 'PURPLE', ar: 'بنفسجي' },
    fn: { en: 'Makes a picture look carved into stone, with bumps and shadows.', ar: 'يجعل الصورة تبدو محفورة في الحجر، بنتوءات وظلال.' },
    desc: { en: 'Like pressing a coin into clay, this spell makes the picture look carved into stone, with raised bumps and little shadows. Choose it for a ghost that looks gray and stony, as if it was engraved.',
            ar: 'كأنك تضغط عملة على الطين، تجعل هذه التعويذة الصورة تبدو منحوتة في الحجر بنتوءات وظلال صغيرة. اخترها للشبح الذي يبدو رماديًا وحجريًا كأنه محفور.' } },
  { color: '#ffd92e', rgb: [255, 217, 46], kernel: [1, 0, 0, 1, 0, 0, 1, 0, 0], norm: '1/3',
    name: { en: 'THE PHANTOM TRAIL', ar: 'أثر الشبح' }, op: { en: 'Motion Blur', ar: 'تمويه الحركة' },
    colorName: { en: 'YELLOW', ar: 'أصفر' },
    fn: { en: 'Smears things into a streak, as if they zoom past very fast.', ar: 'يمدّ الأشياء على شكل أثر كأنها تمرّ بسرعة كبيرة.' },
    desc: { en: 'Like a photo of a speeding race car, this spell stretches the picture into a streak so it looks like it is zooming by. Choose it for a ghost that leaves a long trail behind it.',
            ar: 'مثل صورة لسيارة سباق مسرعة، تمدّ هذه التعويذة الصورة على شكل أثر فتبدو وكأنها تندفع. اخترها للشبح الذي يترك خلفه أثرًا طويلًا.' } }
];
// ghost type i is bound to spell i (consistent for the whole game)
const GHOSTS = [
  { name: { en: 'THE WANDERING WRAITH', ar: 'الشبح الهائم' }, color: '#3d8bff', rgb: [61, 139, 255] },
  { name: { en: 'THE CRIMSON REAPER', ar: 'الحاصد القرمزي' }, color: '#ff3b3b', rgb: [255, 59, 59] },
  { name: { en: 'THE HOLLOW WATCHER', ar: 'المراقب الأجوف' }, color: '#22e06a', rgb: [34, 224, 106] },
  { name: { en: 'THE ENGRAVED PHANTOM', ar: 'الشبح المنقوش' }, color: '#b45cff', rgb: [180, 92, 255] },
  { name: { en: 'THE PHANTOM DRIFTER', ar: 'الشبح الجوّال' }, color: '#ffd92e', rgb: [255, 217, 46] }
];
// scale/z: sprite size & float height (wall height = 1). speed: cells/s. hw: hit-box half width (fraction of sprite)
const GPAR = [
  { scale: 0.95, z: 0.06, bob: 0.05, speed: 0.35, rad: 1.6, w: [1.5, 3.5], hw: 0.24, cx: 0.5 },
  { scale: 0.78, z: 0.10, bob: 0.03, speed: 0.9, rad: 1.3, w: [0.6, 1.8], hw: 0.28, cx: 0.5, dart: true },
  { scale: 1.00, z: 0.04, bob: 0.02, speed: 0, rad: 0, w: [9, 9], hw: 0.2, cx: 0.5 },
  { scale: 0.88, z: 0.10, bob: 0.06, speed: 0.18, rad: 1.2, w: [2, 5], hw: 0.32, cx: 0.5 },
  { scale: 0.52, z: 0.32, bob: 0.08, speed: 3.2, rad: 3.0, w: [0.3, 1.1], hw: 0.28, cx: 0.65 }
];

/* ============================ 7. SPRITES ============================== */
function dWraith(c, f) {
  const ph = f * Math.PI / 2;
  for (let y = 3; y < 31; y++) {
    const t = (y - 3) / 27;
    let hw = y < 9 ? 2 + (y - 3) * 0.45 : (y < 15 ? 4.6 : 4.6 * (1 - (y - 15) / 20) + 0.8);
    hw = Math.round(hw);
    const cx = 16 + Math.round(Math.sin(y * 0.45 + ph) * (0.4 + t * 2.6));
    c.fillStyle = 'rgba(' + ((215 - t * 70) | 0) + ',' + ((232 - t * 45) | 0) + ',255,' + (y > 24 ? 0.5 : 0.85) + ')';
    c.fillRect(cx - hw, y, hw * 2, 1);
    if (y >= 25 && ((y + f) & 1) === 0) c.clearRect(cx - hw + ((y * 3 + f) % 4), y, 1, 1);
  }
  c.fillStyle = 'rgba(205,228,255,0.75)';
  for (let i = 0; i < 11; i++) { const sw = Math.round(Math.sin((11 + i) * 0.45 + ph) * 1.2); c.fillRect(9 - (i >> 2) + sw, 11 + i, 1, 1); c.fillRect(22 + (i >> 2) + sw, 11 + i, 1, 1); }
  const ex = 16 + Math.round(Math.sin(6 * 0.45 + ph) * 0.66);
  c.fillStyle = '#1e50ff'; c.fillRect(ex - 2, 6, 1, 2); c.fillRect(ex + 1, 6, 1, 2);
  c.fillStyle = '#b8d8ff'; c.fillRect(ex - 2, 6, 1, 1); c.fillRect(ex + 1, 6, 1, 1);
}
function dReaper(c, f) {
  const ext = (f & 1) * 2;
  for (let y = 13; y < 30; y++) {
    const t = (y - 13) / 16, hw = Math.round(8.5 - t * 1.2);
    c.fillStyle = y < 22 ? '#5e0b16' : '#3e0710'; c.fillRect(16 - hw, y, hw * 2, 1);
    if (y >= 24) for (let x = 16 - hw; x < 16 + hw; x++) if (((x * 5 + y * 3 + f) % 4) === 0) c.clearRect(x, y, 1, 1);
  }
  for (let y = 2; y < 15; y++) {
    const hw = Math.min(9, Math.round(1.5 + (y - 2) * 0.65));
    c.fillStyle = '#8a1224'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = '#d2203a'; c.fillRect(16 - hw, y, 1, 1); c.fillRect(16 + hw - 1, y, 1, 1);
  }
  c.fillStyle = '#070205'; c.fillRect(12, 7, 8, 6); c.fillRect(13, 13, 6, 1);
  c.fillStyle = f === 2 ? '#ffd8d8' : '#ff2630'; c.fillRect(13, 9, 2, 2); c.fillRect(17, 9, 2, 2);
  c.fillStyle = '#ffb0b0'; c.fillRect(13, 9, 1, 1); c.fillRect(17, 9, 1, 1);
  c.fillStyle = '#3e0710'; c.fillRect(6, 15, 4, 3); c.fillRect(22, 15, 4, 3);
  c.fillStyle = '#d9cfcf';
  for (let i = 0; i < 3; i++) { c.fillRect(2 - ext, 14 + i * 2, 5 + ext, 1); c.fillRect(25, 14 + i * 2, 5 + ext, 1); }
}
function dWatcher(c, f, eye) {
  for (let y = 2; y < 31; y++) {
    const hw = Math.round(y < 13 ? 4.6 : (y < 22 ? 4 : 4 - (y - 22) * 0.4)), a = y > 22 ? 1 - (y - 22) / 10 : 1;
    c.fillStyle = 'rgba(9,14,12,' + a + ')'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = 'rgba(46,92,64,' + a * 0.85 + ')'; c.fillRect(16 - hw, y, 1, 1); c.fillRect(16 + hw - 1, y, 1, 1);
  }
  c.fillStyle = '#1a2e22';
  for (let y = 12; y < 26; y++) { c.fillRect(8 - ((y - 12) >> 3), y, 1, 1); c.fillRect(23 + ((y - 12) >> 3), y, 1, 1); }
  const rows = [[13, 18], [12, 19], [11, 20], [11, 20], [11, 20], [12, 19], [13, 18]];
  rows.forEach((r, i) => { c.fillStyle = '#a8ffc4'; c.fillRect(r[0], 5 + i, r[1] - r[0] + 1, 1); });
  c.fillStyle = '#1fd860'; c.fillRect(14 + eye, 6, 4, 4);
  c.fillStyle = '#06240f'; c.fillRect(15 + eye, 7, 2, 2);
  c.fillStyle = '#d8ffe4'; c.fillRect(14 + eye, 6, 1, 1);
  c.fillStyle = '#2bff6a'; c.fillRect(13, 4, 6, 1); c.fillRect(13, 12, 6, 1);
}
function dEngraved(c, f) {
  for (let y = 12; y < 29; y++) {
    const hw = y < 26 ? 9 : Math.round(9 - (y - 25) * 1.4);
    c.fillStyle = '#625f7a'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = '#807c9c'; c.fillRect(16 - hw, y, 2, 1);
    c.fillStyle = '#464360'; c.fillRect(16 + hw - 2, y, 2, 1);
  }
  c.fillStyle = '#55526e'; c.fillRect(2, 14, 5, 10); c.fillRect(25, 14, 5, 10);
  c.fillStyle = '#78749a'; c.fillRect(2, 14, 5, 1); c.fillRect(25, 14, 5, 1);
  c.fillStyle = '#8a86a8'; c.fillRect(10, 3, 12, 11);
  c.fillStyle = '#5a2a9a'; c.fillRect(11, 4, 10, 9);
  c.fillStyle = '#1a0c2e'; for (let i = 0; i < 9; i++) c.fillRect(15 + ((i * 3) % 4) - 1, 4 + i, 1, 1);
  c.fillStyle = '#c070ff'; c.fillRect(12, 7, 3, 3); c.fillRect(17, 7, 3, 3);
  if (f & 1) { c.fillStyle = '#f4d8ff'; c.fillRect(13, 8, 1, 1); c.fillRect(18, 8, 1, 1); }
  c.fillStyle = '#1a0c2e'; c.fillRect(13, 11, 6, 1);
  const glow = (f === 1 || f === 3) ? '#c27bff' : '#2a1a45';
  c.fillStyle = glow; c.fillRect(10, 17, 12, 1); c.fillRect(10, 21, 12, 1); c.fillRect(15, 17, 2, 8);
  c.fillRect(13, 19, 1, 1); c.fillRect(18, 19, 1, 1); c.fillRect(13, 23, 1, 1); c.fillRect(18, 23, 1, 1);
  c.fillStyle = '#8a86a8'; c.fillRect(8 + f * 4, 29 + (f & 1), 1, 1); c.fillRect(22 - f * 3, 29, 1, 1);
}
function dDrifter(c, f) {
  for (let x = 2; x < 17; x++) {
    const k = (x - 2) / 14, h = Math.max(1, Math.round(1 + k * 3.5)), yc = 17 + Math.round(Math.sin((x + f * 3) * 0.55) * 1.6);
    c.fillStyle = 'rgba(255,226,70,' + (0.15 + k * 0.65) + ')'; c.fillRect(x, yc - (h >> 1), 1, h);
  }
  for (let y = 7; y < 22; y++) {
    const e = (y - 14) / 7.4, hw = Math.round(5.5 * Math.sqrt(Math.max(0, 1 - e * e)));
    c.fillStyle = '#ffe94a'; c.fillRect(21 - hw, y, hw * 2, 1);
  }
  c.fillStyle = '#fff7b0'; c.fillRect(19, 9, 5, 2); c.fillRect(18, 11, 2, 2);
  c.fillStyle = '#1f1800'; c.fillRect(18, 12, 2, 4); c.fillRect(23, 12, 2, 4);
  c.fillStyle = '#d9b92a'; c.fillRect(19, 22, 5, 4); c.fillRect(20, 26, 3, 2);
}
const GDRAW = [dWraith, dReaper, dWatcher, dEngraved, dDrifter];

/* ---- distortions: the "lens view" of each ghost, built from the true sprite ---- */
function conv3(src, k, div) {
  const o = new Uint8ClampedArray(src.length);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    let A = 0, R = 0, G = 0, B = 0;
    for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
      const xx = x + kx, yy = y + ky; if (xx < 0 || yy < 0 || xx >= SPR || yy >= SPR) continue;
      const w = k[(ky + 1) * 3 + kx + 1], i = (yy * SPR + xx) * 4, a = src[i + 3] * w;
      A += a; R += a * src[i]; G += a * src[i + 1]; B += a * src[i + 2];
    }
    const oi = (y * SPR + x) * 4; o[oi + 3] = A / div;
    if (A > 0) { o[oi] = R / A; o[oi + 1] = G / A; o[oi + 2] = B / A; }
  }
  return o;
}
const K_GAUSS = [1, 2, 1, 2, 4, 2, 1, 2, 1];
function px(o, x, y, r, g, b, a) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= SPR || y >= SPR) return; const i = (y * SPR + x) * 4; o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = a; }
function dsWraith(d, r) {
  const o = conv3(conv3(d, K_GAUSS, 16), K_GAUSS, 16);
  for (let i = 3; i < o.length; i += 4) o[i] = o[i] * 0.72;
  for (let n = 0; n < 18; n++) { const x = 16 + (r() - 0.5) * 22, y = 15 + (r() - 0.5) * 27; const i = ((y | 0) * SPR + (x | 0)) * 4; if (o[i + 3] < 80) px(o, x, y, 90, 150, 255, 190); }
  return o;
}
function dsReaper(d, r) {
  const o = new Uint8ClampedArray(d.length);
  for (let band = 0; band < SPR; band += 3) {
    const sh = Math.round((r() - 0.5) * 7);
    for (let y = band; y < Math.min(SPR, band + 3); y++) for (let x = 0; x < SPR; x++) {
      const xs = x - sh; if (xs < 0 || xs >= SPR) continue;
      const si = (y * SPR + xs) * 4, di = (y * SPR + x) * 4;
      o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = d[si + 3];
    }
  }
  for (let n = 0; n < 28; n++) { const x = (r() * 30) | 0, y = (r() * 30) | 0; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) o[((y + dy) * SPR + x + dx) * 4 + 3] = 0; }
  for (let n = 0; n < 16; n++) px(o, 4 + r() * 24, 2 + r() * 27, 255, 50, 60, 220);
  const j1 = (r() * 3) | 0, j2 = (r() * 3) | 0;
  for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { px(o, 11 + j1 + dx, 8 + j2 + dy, 255, 60, 70, 255); px(o, 18 - j1 + dx, 10 + j2 + dy, 255, 60, 70, 255); }
  return o;
}
function lumA(d) { const L = new Float32Array(SPR * SPR); for (let i = 0; i < SPR * SPR; i++) { const a = d[i * 4 + 3]; L[i] = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) * a / 255 + a * 0.08; } return L; }
function dsWatcher(d, r) {
  const o = new Uint8ClampedArray(d.length), L = lumA(d);
  for (let y = 1; y < SPR - 1; y++) for (let x = 1; x < SPR - 1; x++) {
    const i = y * SPR + x, lap = Math.abs(4 * L[i] - L[i - 1] - L[i + 1] - L[i - SPR] - L[i + SPR]);
    if (lap > 14 && r() > 0.32) px(o, x, y, 40, 255, 110, 235);
  }
  return o;
}
function dsEngraved(d, r) {
  const o = new Uint8ClampedArray(d.length), L = lumA(d), K = [-2, -1, 0, -1, 1, 1, 0, 1, 2], M = [];
  for (let y = 1; y < SPR - 1; y++) for (let x = 1; x < SPR - 1; x++) {
    const i = y * SPR + x; if (d[i * 4 + 3] < 20) continue;
    let e = 0; for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) e += K[(ky + 1) * 3 + kx + 1] * L[(y + ky) * SPR + x + kx];
    const t = clamp(110 + e * 0.7, 0, 255) / 255;
    px(o, x, y, 40 + t * 160, 20 + t * 130, 70 + t * 185, 235); M.push([x, y]);
  }
  for (let n = 0; n < 10 && M.length; n++) { const m = M[(r() * M.length) | 0]; px(o, m[0], m[1], 215, 160, 255, 255); }
  return o;
}
function dsDrifter(d, r) {
  const sm = new Float32Array(SPR * SPR * 4);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    let A = 0, R = 0, G = 0, B = 0;
    for (let k = 0; k < 9; k++) { const xx = x + k; if (xx >= SPR) break; const i = (y * SPR + xx) * 4, a = d[i + 3]; A += a; R += d[i] * a; G += d[i + 1] * a; B += d[i + 2] * a; }
    const o = (y * SPR + x) * 4; sm[o + 3] = A / 9; if (A > 0) { sm[o] = R / A; sm[o + 1] = G / A; sm[o + 2] = B / A; }
  }
  const o = new Uint8ClampedArray(d.length);
  [[-14, 0.2], [-9, 0.3], [-4, 0.45], [0, 0.92]].forEach(([ox, al]) => {
    for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
      const xs = x - ox; if (xs < 0 || xs >= SPR) continue;
      const si = (y * SPR + xs) * 4, sa = sm[si + 3] * al / 255; if (sa <= 0) continue;
      const di = (y * SPR + x) * 4, da = o[di + 3] / 255, oa = sa + da * (1 - sa);
      const cr = ox < 0 ? 255 : sm[si], cg = ox < 0 ? 226 : sm[si + 1], cb = ox < 0 ? 70 : sm[si + 2];
      o[di] = (cr * sa + o[di] * da * (1 - sa)) / oa; o[di + 1] = (cg * sa + o[di + 1] * da * (1 - sa)) / oa; o[di + 2] = (cb * sa + o[di + 2] * da * (1 - sa)) / oa;
      o[di + 3] = oa * 255;
    }
  });
  return o;
}
const DISTORT = [dsWraith, dsReaper, dsWatcher, dsEngraved, dsDrifter];

const ghostCanvasCache = {}, ghostSprCache = {};
function ghostCanvas(type, form, f, eye) {
  const key = ((type * 2 + form) * 4 + f) * 3 + (eye + 1);
  if (ghostCanvasCache[key]) return ghostCanvasCache[key];
  const c = mkCanvas(SPR, SPR), x = c.getContext('2d');
  if (form === 0) GDRAW[type](x, f, eye);
  else {
    const t = mkCanvas(SPR, SPR), tx = t.getContext('2d'); GDRAW[type](tx, f, 0);
    const src = tx.getImageData(0, 0, SPR, SPR);
    const out = DISTORT[type](src.data, rng(type * 977 + f * 131 + 7));
    x.putImageData(new ImageData(out, SPR, SPR), 0, 0);
  }
  ghostCanvasCache[key] = c; return c;
}
function ghostSpr(type, form, f, eye) {
  const key = ((type * 2 + form) * 4 + f) * 3 + (eye + 1);
  if (ghostSprCache[key]) return ghostSprCache[key];
  const c = ghostCanvas(type, form, f, eye);
  const s = new Uint32Array(c.getContext('2d').getImageData(0, 0, SPR, SPR).data.buffer.slice(0));
  ghostSprCache[key] = s; return s;
}

/* ---- spell runes (16x16) ---- */
const RUNE = [], RUNE_URL = [];
function drawRune(i) {
  const c = mkCanvas(16, 16), x = c.getContext('2d'), col = SPELLS[i].rgb;
  for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
    const d = Math.hypot(xx - 7.5, yy - 7.5);
    if (d < 7.6) { x.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (0.24 * (1 - d / 7.6)).toFixed(3) + ')'; x.fillRect(xx, yy, 1, 1); }
  }
  if (i === 0) {
    for (let t = 0; t < 14; t += 0.2) { const r = 1 + t * 0.42, a = t * 0.95; P1(x, t < 7 ? '#cfe6ff' : '#5aa0ff', Math.round(7.5 + Math.cos(a) * r), Math.round(7.5 + Math.sin(a) * r)); }
    P1(x, '#ffffff', 7, 7, 2, 2);
  } else if (i === 1) {
    for (let y = 1; y < 15; y++) {
      const hw = y <= 8 ? Math.round(1 + (y - 1) * 0.6) : Math.round(5 - (y - 8) * 0.75);
      P1(x, '#ff3a3a', 8 - hw, y, hw * 2, 1); P1(x, '#ff9a9a', 8 - hw, y, Math.max(1, hw >> 1), 1); P1(x, '#8a0f1a', 8 + hw - 1, y, 1, 1);
    }
  } else if (i === 2) {
    [2, 4, 6, 6, 4, 2].forEach((hw, k) => { P1(x, '#14d060', 8 - hw, 5 + k, hw * 2, 1); P1(x, '#0a5a2a', 8 - hw, 5 + k, 1, 1); P1(x, '#0a5a2a', 8 + hw - 1, 5 + k, 1, 1); });
    P1(x, '#052a14', 6, 6, 4, 4); P1(x, '#7dffb0', 7, 7, 2, 2); P1(x, '#14d060', 7, 1, 2, 2); P1(x, '#14d060', 2, 3, 2, 1); P1(x, '#14d060', 12, 3, 2, 1); P1(x, '#14d060', 7, 13, 2, 2);
  } else if (i === 3) {
    P1(x, '#5a2c9a', 3, 3, 10, 10); P1(x, '#c795ff', 3, 3, 10, 1); P1(x, '#c795ff', 3, 3, 1, 10); P1(x, '#2e1458', 3, 12, 10, 1); P1(x, '#2e1458', 12, 3, 1, 10);
    P1(x, '#e4c8ff', 6, 6, 4, 1); P1(x, '#e4c8ff', 7, 6, 2, 5);
  } else {
    for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(255,' + (225 + k * 6) + ',' + (70 + k * 30) + ',' + (1 - k * 0.15) + ')'; x.fillRect(1 + k * 2, 4 + k * 2, 13 - k * 2, 1); }
    P1(x, '#fff8c0', 12, 4, 3, 3);
  }
  return c;
}
function buildRunes() {
  for (let i = 0; i < 5; i++) {
    const c = drawRune(i); RUNE_URL[i] = c.toDataURL();
    RUNE[i] = new Uint32Array(c.getContext('2d').getImageData(0, 0, 16, 16).data.buffer.slice(0));
  }
}

/* ---- props (32x32) ---- */
const PROPSPR = {};
function buildProps() {
  const mk = (fn) => { const c = mkCanvas(SPR, SPR), x = c.getContext('2d'); fn(x); return new Uint32Array(x.getImageData(0, 0, SPR, SPR).data.buffer.slice(0)); };
  PROPSPR.candle = mk((x) => { P1(x, '#5a4a2a', 10, 28, 12, 2); P1(x, '#7a6a3a', 14, 22, 4, 6); P1(x, '#e8dcc0', 14, 13, 4, 10); P1(x, '#c9bc9c', 17, 13, 1, 10); P1(x, '#ffcf4a', 15, 8, 2, 5); P1(x, '#fff2a0', 15, 9, 1, 3); P1(x, '#ffe070', 16, 7, 1, 2); P1(x, '#3a2a18', 16, 12, 1, 1); });
  PROPSPR.crate = mk((x) => { P1(x, '#2e1d0e', 3, 8, 26, 22); P1(x, '#6b4a28', 5, 10, 22, 18); for (let i = 0; i < 4; i++) P1(x, '#4a3118', 5, 14 + i * 4, 22, 1); P1(x, '#8a6238', 5, 10, 22, 1); P1(x, '#2e1d0e', 14, 10, 4, 18); for (let i = 0; i < 18; i++) { P1(x, '#4a3118', 5 + i, 10 + i, 1, 1); } P1(x, '#2e1d0e', 3, 8, 3, 3); P1(x, '#2e1d0e', 26, 8, 3, 3); P1(x, '#2e1d0e', 3, 27, 3, 3); P1(x, '#2e1d0e', 26, 27, 3, 3); });
  PROPSPR.table = mk((x) => { P1(x, '#7a5230', 2, 11, 28, 4); P1(x, '#3a2210', 2, 15, 28, 1); P1(x, '#4a2e18', 5, 16, 3, 14); P1(x, '#4a2e18', 24, 16, 3, 9); P1(x, '#4a2e18', 26, 24, 4, 2); P1(x, '#8a6238', 2, 11, 28, 1); P1(x, '#2a1a0c', 10, 12, 1, 3); P1(x, '#2a1a0c', 20, 11, 1, 4); P1(x, '#d8cfb0', 12, 8, 6, 3); P1(x, '#b8a888', 13, 8, 4, 1); });
  PROPSPR.chair = mk((x) => { P1(x, '#5a3a20', 9, 17, 14, 3); P1(x, '#4a2e18', 9, 4, 3, 14); P1(x, '#4a2e18', 20, 5, 3, 13); P1(x, '#5a3a20', 9, 5, 14, 2); P1(x, '#5a3a20', 12, 9, 8, 1); P1(x, '#3a2210', 10, 20, 2, 10); P1(x, '#3a2210', 20, 20, 2, 10); P1(x, '#2a1a0c', 12, 20, 1, 6); });
  PROPSPR.barrel = mk((x) => { for (let y = 5; y < 30; y++) { const e = (y - 17) / 12.5, hw = Math.round(9 * Math.sqrt(Math.max(0, 1 - e * e * 0.35)) + 1); P1(x, '#5a3a1e', 16 - hw, y, hw * 2, 1); P1(x, '#7a5230', 16 - hw, y, 2, 1); P1(x, '#3a2410', 16 + hw - 2, y, 2, 1); } [9, 14, 21, 26].forEach((y) => { const e = (y - 17) / 12.5, hw = Math.round(9 * Math.sqrt(Math.max(0, 1 - e * e * 0.35)) + 1); P1(x, '#2a2a32', 16 - hw, y, hw * 2, 2); P1(x, '#4a4a56', 16 - hw, y, hw * 2, 1); }); });
}

function pickTarget(g) {
  const p = GPAR[g.type];
  for (let n = 0; n < 8; n++) {
    const a = rnd() * TAU, r = p.dart && rnd() < 0.5 ? 1 + rnd() * 1.2 : 0.4 + rnd() * p.rad;
    const tx = g.hx + Math.cos(a) * r, ty = g.hy + Math.sin(a) * r;
    if (canMoveG(tx, ty, 0.2) && canMoveG((tx + g.x) / 2, (ty + g.y) / 2, 0.2)) { g.tx = tx; g.ty = ty; g.spd = p.dart && rnd() < 0.45 ? 4.6 : p.speed; return; }
  }
  g.tx = g.x; g.ty = g.y;
}
function updateGhost(g, dt) {
  if (g.state === 'captured') return;
  if (g.state === 'capturing') {
    g.ct += dt;
    if (g.ct > 0.45 && !g.burst) { g.burst = true; burst(g.x, g.y, 0.4, GHOSTS[g.type].rgb, 36); }
    if (g.ct >= 0.9) { g.state = 'captured'; g.vis = false; onCaptured(g); }
    return;
  }
  const p = GPAR[g.type];
  if (g.state === 'revealing') {            // sliding window is scanning the ghost (frozen in place)
    g.rt += dt;
    if (g.rt >= REVEAL_T) {
      g.state = 'revealed'; g.rt = 0;
      sfx('correct'); flashFx(GHOSTS[g.type].rgb); burst(g.x, g.y, 0.45, GHOSTS[g.type].rgb, 44);
      toast(tr('identified'), GHOSTS[g.type].color);
    }
    return;
  }
  if (g.vis) emitGhostParticles(g);
  if (p.speed <= 0) return;
  if (g.wait > 0) { g.wait -= dt; return; }
  const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
  if (d < 0.06) { pickTarget(g); g.wait = p.w[0] + rnd() * (p.w[1] - p.w[0]); return; }
  const s = Math.min(g.spd * dt, d), mx = dx / d * s, my = dy / d * s;
  if (canMoveG(g.x + mx, g.y + my, 0.2)) { g.x += mx; g.y += my; if (g.type === 4 && rnd() < 0.7) addP(g.x, g.y, 0.3 + rnd() * 0.15, -mx * 3, -my * 3, 0, 0.35, [255, 226, 70], 0.02); }
  else { g.tx = g.x; g.ty = g.y; }
}
function emitGhostParticles(g) {
  const rgb = GHOSTS[g.type].rgb, z0 = GPAR[g.type].z + GPAR[g.type].scale * 0.5;
  const ox = (rnd() - 0.5) * 0.4, oy = (rnd() - 0.5) * 0.4;
  switch (g.type) {
    case 0: if (rnd() < 0.3) addP(g.x + ox, g.y + oy, z0 + (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.2, 0.1, 1.2, rgb); break;
    case 1: if (rnd() < 0.35) addP(g.x + ox, g.y + oy, z0 + (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 1.4, (rnd() - 0.5) * 1.4, (rnd() - 0.3), 0.3, rgb, 0.02); break;
    case 2: if (rnd() < 0.15) addP(g.x + ox, g.y + oy, z0 + (rnd() - 0.5) * 0.7, 0, 0, 0, 0.25, rgb, 0.015); break;
    case 3: if (rnd() < 0.15) addP(g.x + ox, g.y + oy, z0, 0, 0, -0.8, 0.8, [150, 110, 200], 0.025); break;
    case 4: if (rnd() < 0.3) addP(g.x + ox, g.y + oy, z0 + (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6, 0, 0.45, rgb, 0.02); break;
  }
}