'use strict';

/*GAME DATA */
const SPELLS = [
  { color: '#3d8bff', rgb: [61, 139, 255], kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1], norm: '1/16',
    name: { en: 'THE FOG-CLEARING CHARM', ar: 'تعويذة تنحي الضباب' }, op: { en: 'Gaussian Blur', ar: 'تمويه غاوسي' },
    colorName: { en: 'BLUE', ar: 'أزرق' },
    fn: { en: 'Smooths away fuzzy speckles, like cleaning a snowy TV screen.', ar: 'يزيل البقع المشوّشة، كأنك تنظّف شاشة تلفاز مليئة بالثلج.' },
    desc: { en: 'This spell blends every dot with the dots next to it, so random speckles melt away and the picture becomes smooth and clean, like wiping a snowy TV screen. Choose it for a ghost buried in fuzzy TV static.',
            ar: 'تمزج هذه التعويذة كل نقطة مع النقاط المجاورة لها، فتذوب البقع العشوائية وتصبح الصورة ناعمة ونظيفة، كمسح شاشة تلفاز مليئة بالثلج. اخترها للشبح المدفون في ضجيج التلفاز.' } },
  { color: '#ff3b3b', rgb: [255, 59, 59], kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0], norm: null,
    name: { en: 'THE SHARP-EYE CHARM', ar: 'ختم الحدة' }, op: { en: 'Sharpening', ar: 'تحسين الحدة' },
    colorName: { en: 'RED', ar: 'أحمر' },
    fn: { en: 'Makes blurry things crisp and clear again, like putting on glasses.', ar: 'يعيد الأشياء الضبابية واضحة وحادة، كأنك ارتديت نظارة.' },
    desc: { en: 'Like putting on glasses when everything looks blurry, this spell makes soft, smudgy edges bold and clear again. Choose it for a ghost that looks like a soft, blurry smear.',
            ar: 'كأنك ارتديت نظارة بعد أن كان كل شيء ضبابيًا، تجعل هذه التعويذة الحواف الباهتة قوية وواضحة من جديد. اخترها للشبح الذي يبدو كبقعة ناعمة ومشوّشة.' } },
  { color: '#22e06a', rgb: [34, 224, 106], kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0], norm: null,
    name: { en: 'THE OUTLINE FINDER', ar: 'محدد الحواف' }, op: { en: 'Laplacian Edge Detection', ar: 'كشف الحواف اللابلاسي' },
    colorName: { en: 'GREEN', ar: 'أخضر' },
    fn: { en: 'Shows only the outlines of hidden shapes, like a coloring-book page.', ar: 'يُظهر الخطوط الخارجية للأشكال المختبئة فقط، مثل صفحة تلوين.' },
    desc: { en: 'This spell ignores the flat colors and lights up only the outlines, like a coloring-book page, so a shape hiding in the fog shows its borders. Choose it for a ghost that is a dim, smooth shape blending into the fog.',
            ar: 'تتجاهل هذه التعويذة الألوان الممتلئة وتُضيء الخطوط الخارجية فقط، مثل صفحة تلوين، فيظهر الشكل المختبئ في الضباب بحدوده. اخترها للشبح الذي يبدو كشكل خافت وناعم يذوب في الضباب.' } },
  { color: '#b45cff', rgb: [180, 92, 255], kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2], norm: null,
    name: { en: 'THE CARVING CHARM', ar: 'محدد البصمات' }, op: { en: 'Embossing', ar: 'النقش البارز' },
    colorName: { en: 'PURPLE', ar: 'بنفسجي' },
    fn: { en: 'Makes faint marks pop out like carvings in stone.', ar: 'يُبرز العلامات الباهتة كأنها نقوش في الحجر.' },
    desc: { en: 'Like pressing a coin into clay, this spell turns tiny, nearly invisible differences into bumps and shadows, so hidden carvings pop out of the stone. Choose it for a ghost that looks like a flat, blank slab of stone.',
            ar: 'كأنك تضغط عملة على الطين، تحوّل هذه التعويذة الفروق الصغيرة شبه الخفية إلى نتوءات وظلال، فتبرز النقوش المخفية من الحجر. اخترها للشبح الذي يبدو كلوح حجري مسطّح وفارغ.' } },
  { color: '#ffd92e', rgb: [255, 217, 46], kernel: [0, 0, 0, 1, 1, 1, 0, 0, 0], norm: '1/3',
    name: { en: 'THE STREAK-MAKER CHARM', ar: 'تعويذة الأثر السريع' }, op: { en: 'Motion Blur', ar: 'تمويه الحركة' },
    colorName: { en: 'YELLOW', ar: 'أصفر' },
    fn: { en: 'Fills in the gaps and smears things into one smooth streak.', ar: 'يملأ الفراغات ويمدّ الأشياء في أثر واحد متصل.' },
    desc: { en: 'Like a long-exposure photo of a speeding car, this spell smears each dot sideways and fills in the gaps, so broken pieces join into one smooth streak. Choose it for a ghost chopped into thin stripes with gaps.',
            ar: 'مثل صورة طويلة التعريض لسيارة مسرعة، تمدّ هذه التعويذة كل نقطة إلى الجانب وتملأ الفراغات، فتلتحم القطع المتفرقة في أثر واحد متصل. اخترها للشبح المقطّع إلى شرائح رفيعة بينها فراغات.' } }
];
// ghost type i is bound to spell i (consistent for the whole game)
const GHOSTS = [
  { name: { en: 'THE FOGGY GHOST', ar: 'شبح الضباب' }, color: '#3d8bff', rgb: [61, 139, 255] },
  { name: { en: 'THE RED-HOODED GHOST', ar: 'الشبح صاحب القبعة الحمرا' }, color: '#ff3b3b', rgb: [255, 59, 59] },
  { name: { en: 'THE FOG WATCHER', ar: 'حارس الضباب' }, color: '#22e06a', rgb: [34, 224, 106] },
  { name: { en: 'THE CARVED GHOST', ar: 'شبح النقوش' }, color: '#b45cff', rgb: [180, 92, 255] },
  { name: { en: 'THE SPEEDY GHOST', ar: 'الشبح السريع' }, color: '#ffd92e', rgb: [255, 217, 46] }
];
// scale/z: sprite size & float height (wall height = 1). speed: cells/s. hw: hit-box half width (fraction of sprite)
const GPAR = [
  { scale: 0.95, z: 0.06, bob: 0.05, speed: 0.35, rad: 1.6, w: [1.5, 3.5], hw: 0.24, cx: 0.5 },
  { scale: 0.78, z: 0.10, bob: 0.03, speed: 0.9, rad: 1.3, w: [0.6, 1.8], hw: 0.28, cx: 0.5, dart: true },
  { scale: 1.00, z: 0.04, bob: 0.02, speed: 0, rad: 0, w: [9, 9], hw: 0.2, cx: 0.5 },
  { scale: 0.88, z: 0.10, bob: 0.06, speed: 0.18, rad: 1.2, w: [2, 5], hw: 0.32, cx: 0.5 },
  { scale: 0.52, z: 0.32, bob: 0.08, speed: 3.2, rad: 3.0, w: [0.3, 1.1], hw: 0.28, cx: 0.65 }
];

/*SPRITES*/
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
// where each ghost's "magic heart" sits on its chest, in sprite pixels (the spell symbol is drawn there)
const HEART = [[16, 16], [16, 20], [16, 17], [16, 21], [21, 16]];

/* ---- REAL convolution pipeline ----
   Each ghost has a hidden image H (its true sprite + a "problem") and exactly one spell whose kernel genuinely solves it.
   Frames are computed with true 3x3 convolutions and cached:  [H, K*H, K*K*H, ...]  (PASSES[type] applications).
   form 0 = clean sprite, form 1 = hidden (H), form 2 = revealed (last frame).
   Wrong casts are real too: applySpell(j, H) for any spell j on any ghost. */
const KERN = SPELLS.map((sp) => ({ k: sp.kernel, div: sp.norm ? +sp.norm.split('/')[1] : 1 }));
const PASSES = [3, 2, 1, 1, 1];

// true 2-D convolution of one float plane (kernel flipped, edges replicated)
function conv(p, w, h, k, div) {
  const o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const xx = Math.min(w - 1, Math.max(0, x - i)), yy = Math.min(h - 1, Math.max(0, y - j));
      s += k[(j + 1) * 3 + i + 1] * p[yy * w + xx];
    }
    o[y * w + x] = s / div;
  }
  return o;
}
// RGBA sprite -> filtered RGBA sprite (premultiplied, so transparent pixels don't bleed)
function filterRGBA(d, w, h, k, div) {
  const n = w * h, Pl = [0, 1, 2, 3].map(() => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    const a = d[i * 4 + 3] / 255;
    Pl[0][i] = d[i * 4] * a; Pl[1][i] = d[i * 4 + 1] * a; Pl[2][i] = d[i * 4 + 2] * a; Pl[3][i] = d[i * 4 + 3];
  }
  const Q = Pl.map((p) => conv(p, w, h, k, div)), o = new Uint8ClampedArray(d.length);
  for (let i = 0; i < n; i++) {
    const A = Math.max(0, Math.min(255, Q[3][i])); o[i * 4 + 3] = A;
    if (A > 0) { const sc = 255 / A; o[i * 4] = Q[0][i] * sc; o[i * 4 + 1] = Q[1][i] * sc; o[i * 4 + 2] = Q[2][i] * sc; }
  }
  return o;
}
function lumA(d) { const L = new Float32Array(SPR * SPR); for (let i = 0; i < SPR * SPR; i++) { const a = d[i * 4 + 3]; L[i] = (0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]) * a / 255 + a * 0.08; } return L; }

// one application of spell j to a sprite (RGBA bytes). Laplacian / emboss work on luminance, then get a gain / bias.
function applySpell(j, d) {
  const K = KERN[j];
  if (j === 0 || j === 1) return filterRGBA(d, SPR, SPR, K.k, K.div);
  if (j === 4) { const o = filterRGBA(d, SPR, SPR, K.k, K.div); for (let i = 3; i < o.length; i += 4) o[i] = Math.min(255, o[i] * 3); return o; } // x3 exposure (box kernel is 1/3 as bright)
  const L = lumA(d), q = conv(L, SPR, SPR, K.k, K.div), o = new Uint8ClampedArray(d.length);
  for (let i = 0; i < SPR * SPR; i++) {
    if (j === 2) {                                   // Laplacian: kernel sums to 0, flat areas -> 0, edges glow
      const a = Math.abs(q[i]) * 4;
      if (a > 8) { o[i * 4] = 40; o[i * 4 + 1] = 255; o[i * 4 + 2] = 110; o[i * 4 + 3] = Math.min(255, a); }
    } else {                                         // emboss: directional difference around mid-grey
      const a = d[i * 4 + 3]; if (!a) continue;
      const t = clamp(105 + (q[i] - L[i]) * 2.6, 0, 255) / 255;
      o[i * 4] = 40 + t * 160; o[i * 4 + 1] = 20 + t * 130; o[i * 4 + 2] = 70 + t * 185; o[i * 4 + 3] = a;
    }
  }
  return o;
}

/* ---- the "problem" each ghost hides behind (fixed random seed, so every run looks the same) ---- */
function degWraith(d, r) {            // buried in TV static (zero-mean noise) -> Gaussian averaging cancels it
  const n = SPR * SPR, o = new Uint8ClampedArray(d.length), zone = new Uint8Array(n);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) if (d[(y * SPR + x) * 4 + 3] > 20)
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < SPR && yy < SPR && dx * dx + dy * dy <= 10) zone[yy * SPR + xx] = 1;
    }
  for (let i = 0; i < n; i++) {
    if (!zone[i]) continue;
    const a = d[i * 4 + 3];
    if (a > 20) { const nz = (r() - 0.5) * 170; o[i * 4] = d[i * 4] + nz; o[i * 4 + 1] = d[i * 4 + 1] + nz; o[i * 4 + 2] = d[i * 4 + 2] + nz; o[i * 4 + 3] = a + (r() - 0.5) * 150; }
    else if (r() < 0.5) { const v = 110 + r() * 145; o[i * 4] = v; o[i * 4 + 1] = v; o[i * 4 + 2] = v + 20; o[i * 4 + 3] = 70 + r() * 150; }
  }
  return o;
}
function degReaper(d) {                // out of focus (blurred twice) -> sharpening restores the edges
  let o = d; for (let p = 0; p < 2; p++) o = filterRGBA(o, SPR, SPR, KERN[0].k, KERN[0].div); return o;
}
function degWatcher(d) {               // camouflaged: dim, smooth silhouette in the colour of the fog -> Laplacian keeps only the edges
  const o = new Uint8ClampedArray(d.length), fog = [58, 78, 68];
  for (let i = 0; i < SPR * SPR; i++) {
    const a = d[i * 4 + 3]; if (!a) continue;
    for (let ch = 0; ch < 3; ch++) o[i * 4 + ch] = fog[ch] + (d[i * 4 + ch] - fog[ch]) * 0.2;
    o[i * 4 + 3] = a * 0.6;
  }
  return filterRGBA(o, SPR, SPR, KERN[0].k, KERN[0].div);
}
function degEngraved(d) {              // flat slab, the inscription painted in almost the same tone -> emboss turns tiny steps into relief
  const o = new Uint8ClampedArray(d.length), S = [104, 100, 128];
  for (let i = 0; i < SPR * SPR; i++) {
    const a = d[i * 4 + 3]; if (!a) continue;
    for (let ch = 0; ch < 3; ch++) o[i * 4 + ch] = S[ch] + (d[i * 4 + ch] - S[ch]) * 0.12;
    o[i * 4 + 3] = a;
  }
  return o;
}
function degDrifter(d) {               // strobe-lit: only every 3rd column is visible -> a 3-tap horizontal box blur fills the gaps
  const o = new Uint8ClampedArray(d);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) if (x % 3 !== 0) o[(y * SPR + x) * 4 + 3] = 0;
  return o;
}
const DEGRADE = [degWraith, degReaper, degWatcher, degEngraved, degDrifter];

const hidCache = {}, frmCache = {}, wrongCache = {};
function revFrames(type, f, eye) {      // { d: [RGBA bytes...], s: [Uint32 views...] }  frame 0 = hidden, last = revealed
  const key = (type * 4 + f) * 3 + (eye + 1);
  if (frmCache[key]) return frmCache[key];
  const c = mkCanvas(SPR, SPR), x = c.getContext('2d'); GDRAW[type](x, f, eye);
  const d = [DEGRADE[type](x.getImageData(0, 0, SPR, SPR).data, rng(type * 977 + f * 131 + eye * 17 + 7))];
  for (let p = 0; p < PASSES[type]; p++) d.push(applySpell(type, d[d.length - 1]));
  return (frmCache[key] = { d, s: d.map((a) => new Uint32Array(a.buffer)) });
}
function wrongSpr(type, j, f, eye) {    // the real output of spell j applied to ghost `type`'s hidden image
  const key = ((type * 5 + j) * 4 + f) * 3 + (eye + 1);
  if (wrongCache[key]) return wrongCache[key];
  return (wrongCache[key] = new Uint32Array(applySpell(j, revFrames(type, f, eye).d[0]).buffer));
}

const ghostCanvasCache = {}, ghostSprCache = {};
function ghostCanvas(type, form, f, eye) {
  const key = ((type * 3 + form) * 4 + f) * 3 + (eye + 1);
  if (ghostCanvasCache[key]) return ghostCanvasCache[key];
  const c = mkCanvas(SPR, SPR), x = c.getContext('2d');
  if (form === 0) GDRAW[type](x, f, eye);
  else { const F = revFrames(type, f, eye); x.putImageData(new ImageData(new Uint8ClampedArray(F.d[form === 1 ? 0 : F.d.length - 1]), SPR, SPR), 0, 0); }
  return (ghostCanvasCache[key] = c);
}
function ghostSpr(type, form, f, eye) {
  const key = ((type * 3 + form) * 4 + f) * 3 + (eye + 1);
  if (ghostSprCache[key]) return ghostSprCache[key];
  let sp;
  if (form === 0) sp = new Uint32Array(ghostCanvas(type, 0, f, eye).getContext('2d').getImageData(0, 0, SPR, SPR).data.buffer.slice(0));
  else { const F = revFrames(type, f, eye); sp = F.s[form === 1 ? 0 : F.s.length - 1]; }
  return (ghostSprCache[key] = sp);
}

/* ---- spell runes (16x16) ---- */
const RUNE = [], RUNE_URL = [], GREY_RUNE = [], GREY_RUNE_CV = [];
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
    // grey, solid-only version of the rune: the ghost's missing "magic heart"
    const id = c.getContext('2d').getImageData(0, 0, 16, 16), d = id.data;
    for (let p = 0; p < d.length; p += 4) {
      if (d[p + 3] > 140) { const gv = (60 + (0.3 * d[p] + 0.59 * d[p + 1] + 0.11 * d[p + 2]) * 0.3) | 0; d[p] = gv; d[p + 1] = gv; d[p + 2] = gv + 10; d[p + 3] = 235; } else d[p + 3] = 0;
    }
    const gc = mkCanvas(16, 16); gc.getContext('2d').putImageData(id, 0, 0);
    GREY_RUNE_CV[i] = gc; GREY_RUNE[i] = new Uint32Array(d.buffer.slice(0));
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
  if (g.state === 'captured' || g.state === 'casting') return;   // a ghost being cast on stays frozen
  if (g.state === 'capturing') {
    g.ct += dt;
    if (g.ct > 0.45 && !g.burst) { g.burst = true; burst(g.x, g.y, 0.4, GHOSTS[g.type].rgb, 36); }
    if (g.ct >= 0.9) { g.state = 'captured'; g.vis = false; onCaptured(g); }
    return;
  }
  const p = GPAR[g.type];
  if (g.state === 'wrongcast') {            // the wrong spell's REAL result is shown for a moment, then the ghost reverts
    g.rt += dt;
    if (g.rt >= WRONG_T) { g.rt = 0; g.state = 'hidden'; if (g.wrong >= 2) loseGame('spells'); }
    return;
  }
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