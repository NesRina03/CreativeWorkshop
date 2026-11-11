'use strict';

/* ============================================================================
   POLISH: loaded AFTER CastScene.js and BEFORE main.js.
   1. richer, darker ghost art (outline + light/shadow + texture on every sprite)
   2. corrected English and Modern Standard Arabic texts
   3. a new intro slide showing the spell passing through the ghost
   4. the ending: freed ghosts + star rating
   ============================================================================ */

/* ---------- 1. ART ---------- */
const ACCENT = [[110, 190, 255], [255, 110, 80], [80, 255, 150], [190, 130, 255], [255, 220, 80]];
const DETAIL = [
  (c, f) => {   // fog ghost: veil folds, glowing collar, glints
    c.fillStyle = 'rgba(120,160,255,0.4)';
    for (let y = 12; y < 28; y += 3) { c.fillRect(12 + ((y * 5 + f) % 3), y, 1, 2); c.fillRect(19 - ((y * 3 + f) % 3), y, 1, 2); }
    c.fillStyle = 'rgba(160,220,255,0.7)'; c.fillRect(13, 10, 6, 1); c.fillRect(14, 11, 4, 1);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    [[9, 8], [23, 10], [7, 20], [25, 22]].forEach((p, i) => { if ((i + f) & 1) { c.fillRect(p[0] - 1, p[1], 3, 1); c.fillRect(p[0], p[1] - 1, 1, 3); } });
  },
  (c, f) => {   // red-hooded ghost: dark folds, gold trim, teeth, embers
    c.fillStyle = '#2a050c'; for (let y = 17; y < 29; y++) { c.fillRect(12, y, 1, 1); c.fillRect(20, y, 1, 1); }
    c.fillStyle = '#e0b040'; c.fillRect(14, 14, 4, 1); c.fillRect(15, 15, 2, 2); c.fillRect(10, 29, 12, 1);
    c.fillStyle = '#e8dcd0'; c.fillRect(14, 12, 1, 1); c.fillRect(16, 12, 1, 1); c.fillRect(18, 12, 1, 1);
    c.fillStyle = '#ff9a3a'; [[5, 8], [27, 10], [4, 24], [28, 22]].forEach((p, i) => { if ((i + f) & 1) c.fillRect(p[0], p[1] - f, 1, 2); });
  },
  (c, f) => {   // fog watcher: glowing runes, vines, fog wisps
    c.fillStyle = '#2bff6a'; [[14, 15], [17, 15], [15, 18], [16, 21], [14, 24]].forEach((p, i) => { if (((i + f) & 3) !== 0) c.fillRect(p[0], p[1], 2, 1); });
    c.fillStyle = '#1d7a44'; for (let y = 13; y < 26; y++) c.fillRect(8 + ((y * 2) % 3), y, 1, 1);
    c.fillStyle = 'rgba(140,220,180,0.3)'; c.fillRect(8, 29, 16, 1); c.fillRect(10, 30, 12, 1);
  },
  (c, f) => {   // carved ghost: moss, cracks, glowing forehead rune
    c.fillStyle = '#4d8a3c'; c.fillRect(10, 13, 3, 1); c.fillRect(21, 25, 3, 1); c.fillRect(8, 20, 2, 2); c.fillRect(22, 18, 2, 1);
    c.fillStyle = '#22203a'; for (let y = 19; y < 26; y++) c.fillRect(21 - ((y * 3) % 3), y, 1, 1);
    c.fillStyle = (f & 1) ? '#f0c8ff' : '#b070ff'; c.fillRect(15, 5, 2, 1); c.fillRect(16, 6, 1, 1);
  },
  (c, f) => {   // speedy ghost: hot core, speed lines
    c.fillStyle = '#ff9a2a'; c.fillRect(20, 15, 3, 3);
    c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 3; i++) c.fillRect(3 + ((f + i) % 3) * 2, 10 + i * 4, 6, 1);
  }
];
function polishSprite(c, type) {
  const id = c.getImageData(0, 0, SPR, SPR), d = id.data, out = new Uint8ClampedArray(d), ac = ACCENT[type];
  const al = (x, y) => (x < 0 || y < 0 || x >= SPR || y >= SPR ? 0 : d[(y * SPR + x) * 4 + 3]);
  for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
    const i = (y * SPR + x) * 4, a = d[i + 3];
    if (a > 120) {
      let k = 0.88 + (14 - y) * 0.012 + (16 - x) * 0.008;
      const lit = al(x - 1, y) < 60 || al(x, y - 1) < 60, shade = al(x + 1, y) < 60 || al(x, y + 1) < 60;
      k *= 0.9 + hash(x, y, type + 3) * 0.18;
      const gr = (1 - y / SPR) * 0.1;
      let r = d[i] * k + ac[0] * gr, g = d[i + 1] * k + ac[1] * gr, b = d[i + 2] * k * 1.04 + ac[2] * gr;
      if (lit) { r = r * 0.7 + ac[0] * 0.4; g = g * 0.7 + ac[1] * 0.4; b = b * 0.7 + ac[2] * 0.4; }
      if (shade) { r *= 0.62; g *= 0.58; b *= 0.78; }
      out[i] = r; out[i + 1] = g; out[i + 2] = b;
    } else if (a < 60 && (al(x - 1, y) > 120 || al(x + 1, y) > 120 || al(x, y - 1) > 120 || al(x, y + 1) > 120)) {
      out[i] = 12; out[i + 1] = 6; out[i + 2] = 24; out[i + 3] = 235;
    }
  }
  c.putImageData(new ImageData(out, SPR, SPR), 0, 0);
}
GDRAW.forEach((fn, i) => { GDRAW[i] = (c, f, e) => { fn(c, f, e); DETAIL[i](c, f); polishSprite(c, i); }; });

/* the reveal sweep: a soft band of the spell's colour passes over the ghost (no grid, no window) */
scanSpr = function (g, fr, eye) {
  const N = SPR * SPR, F = revFrames(g.type, fr, eye), wrong = g.state === 'wrongcast';
  let A, B, k;
  if (wrong) { A = F.s[0]; B = wrongSpr(g.type, g.wj, fr, eye); k = g.rt / WRONG_SCAN; }
  else { const n = F.s.length - 1, kk = clamp(g.rt / REVEAL_T, 0, 0.9999) * n, p = kk | 0; A = F.s[p]; B = F.s[p + 1]; k = kk - p; }
  const done = k >= 1, pos = done ? N : clamp((k * N) | 0, 0, N - 1);
  for (let i = 0; i < N; i++) SCAN_BUF[i] = i < pos ? B[i] : A[i];
  if (!done) {
    const c = SPELLS[wrong ? g.wj : g.type].rgb, wy = (pos / SPR) | 0, tr_ = [(c[0] + 255) / 2, (c[1] + 255) / 2, (c[2] + 255) / 2];
    for (let y = Math.max(0, wy - 1); y <= Math.min(SPR - 1, wy + 1); y++) for (let x = 0; x < SPR; x++) {
      const i = y * SPR + x, v = SCAN_BUF[i]; if (!(v >>> 24)) continue;
      const m = y === wy ? 0.75 : 0.35;
      SCAN_BUF[i] = (v & 0xFF000000) | ((((v >>> 16) & 255) * (1 - m) + tr_[2] * m) << 16) | ((((v >>> 8) & 255) * (1 - m) + tr_[1] * m) << 8) | ((v & 255) * (1 - m) + tr_[0] * m);
    }
  }
  return SCAN_BUF;
};

/* atmosphere: dark purple vignette and drifting dust over the 3D view */
const _render = render, VIG = vctx.createRadialGradient(160, 100, 50, 160, 100, 190);
VIG.addColorStop(0, 'rgba(0,0,0,0)'); VIG.addColorStop(0.6, 'rgba(14,0,34,0.25)'); VIG.addColorStop(1, 'rgba(6,0,18,0.7)');
render = function () {
  _render(); vctx.fillStyle = VIG; vctx.fillRect(0, 0, W, H);
  vctx.fillStyle = 'rgba(190,190,255,0.28)';
  for (let i = 0; i < 18; i++) vctx.fillRect(((hash(i, 1, 3) * W + G.t * (4 + i % 4) + Math.sin(G.t * 0.7 + i) * 6) % W + W) % W | 0, ((hash(i, 2, 3) * H + G.t * (2 + i % 3)) % H) | 0, 1, 1);
};

/* ---------- 2. TEXTS ---------- */
Object.assign(L.en, {
  kidHow: 'It glides through the ghost, gathers the Freedom Sparks and lights up the Freedom Gem!',
  kidSymbol: 'This is your spell symbol. Find the same symbol on the ghost\'s grey gem!',
  enIntro1: 'Every ghost lost its Freedom Gem. Your spell glides through the ghost, gathers the Freedom Sparks hidden inside and carries them to the gem\'s place. Then the gem shines again!',
  enIntro2: 'Each spell works in its own special way, so each one frees a different ghost. Let us see what each one did!',
  winMsg: 'Every ghost is free. Peace has returned to the old mansion.',
  sGhosts: 'Ghosts freed', sTime: 'Time left', sSpells: 'Spells found', sWrong: 'Wrong spells',
  rate1: 'Good job! Can you do even better?', rate2: 'Great work, ghost hunter!', rate3: 'Perfect! You are a legendary ghost hunter!',
  cs: [
    'Long ago, this mansion on the hill was full of kind spirits. Then a dark spell trapped them, and now five kinds of ghosts drift through its halls, hidden from every eye.',
    'Luckily, you found a Magic Lens that reveals hidden ghosts. But seeing a ghost is not enough to free it.',
    'Every ghost lost its Freedom Gem, and only a grey shadow of it is left. To bring it back, you need the spell that carries the very same symbol.',
    'Five ancient spells are hidden in the mansion. Find them all. Your Spellbook keeps every spell you discover.',
    'Cast the right spell and it glides through the ghost\'s body, gathers the Freedom Sparks hidden inside and carries them to the gem\'s place... and the gem lights up!',
    'Then the ghost changes into its true shape. Catch it to set it free! Be careful: two wrong spells on the same ghost and the spirits win.',
    'But hurry! The old clock is ticking. Free every ghost before time runs out!'
  ]
});
Object.assign(L.ar, {
  title: 'القصر المسكون',
  kidHow: 'تعبر جسد الشبح، وتجمع شرارات الحرية، وتُضيء جوهرة الحرية!',
  kidSymbol: 'هذا رمز تعويذتك. ابحث عن الرمز نفسه على الجوهرة الرمادية للشبح!',
  enIntro1: 'فقد كل شبح جوهرة حريته. تعبر تعويذتك جسد الشبح، وتجمع شرارات الحرية المخبّأة فيه، وتحملها إلى مكان الجوهرة، فتعود الجوهرة تتألق!',
  enIntro2: 'لكل تعويذة طريقتها الخاصة، ولذلك تحرّر كل واحدة شبحًا مختلفًا. لنرَ ماذا فعلت كل واحدة!',
  winTitle: 'تحرّر القصر!', winMsg: 'تحرّرت كل الأشباح، وعاد الهدوء إلى القصر القديم.',
  sGhosts: 'الأشباح المحرَّرة', sTime: 'الوقت المتبقي', sSpells: 'التعاويذ المكتشفة', sWrong: 'التعاويذ الخاطئة',
  rate1: 'أحسنت! هل تستطيع أن تفعل أفضل؟', rate2: 'عمل رائع أيها صائد الأشباح!', rate3: 'مثالي! أنت صائد أشباح أسطوري!',
  touchCollect: 'ابحث', touchShoot: 'أمسِك', rotate: 'أدِر هاتفك إلى الوضع الأفقي لتلعب.',
  cs: [
    'في الماضي كان هذا القصر على التلّة مليئًا بالأرواح الطيبة. ثم حبسها سحر مظلم، وصارت خمسة أنواع من الأشباح تهيم في ممراته بعيدًا عن كل عين.',
    'لحسن الحظ، وجدتَ عدسة سحرية تكشف الأشباح المختبئة. لكنّ رؤية الشبح لا تكفي لتحريره.',
    'فقد كل شبح جوهرة حريته، ولم يبقَ منها سوى ظلّ رمادي. ولإعادتها تحتاج إلى التعويذة التي تحمل الرمز نفسه.',
    'خمس تعاويذ قديمة مخبّأة في أرجاء القصر. ابحث عنها جميعًا، وسيحفظ كتاب التعاويذ كل تعويذة تكتشفها.',
    'عند إطلاق التعويذة الصحيحة، تعبر جسد الشبح وتجمع شرارات الحرية المخبّأة فيه، ثم تحملها إلى مكان الجوهرة... فتُضيء الجوهرة!',
    'عندها يتحوّل الشبح إلى هيئته الحقيقية، فأمسِك به لتحرّره! وانتبه: تعويذتان خاطئتان على الشبح نفسه تعنيان فوز الأرواح.',
    'لكن أسرع! فالساعة القديمة تدقّ. حرّر كل الأشباح قبل أن ينتهي الوقت!'
  ]
});
['تعويذة تبديد الضباب', 'تعويذة العين الحادة', 'كاشف الخطوط', 'تعويذة النقش', 'تعويذة الأثر السريع'].forEach((n, i) => { SPELLS[i].name.ar = n; });
['شبح الضباب', 'صاحب القلنسوة الحمراء', 'حارس الضباب', 'شبح النقوش', 'الشبح السريع'].forEach((n, i) => { GHOSTS[i].name.ar = n; });
LESSON[1].effect.ar = 'كان صاحب القلنسوة الحمراء يبدو كبقعة حمراء مشوّشة. توضيح حوافه يعيد إليه قلنسوته وشكله.';
LESSON[3].effect.ar = 'كان شبح النقوش يشبه لوحًا حجريًا أملس. تضيف التعويذة الضوء والظل فتبرز نقوشه.';
LESSON[4].effect.ar = 'كان الشبح السريع مقطّعًا إلى شرائح رقيقة. تصل التعويذة بينها في أثر طويل واحد.';

/* ---------- 3. INTRO: new slide (spell passes through the ghost) ---------- */
function slideCast(t) {
  R(0, 0, 320, 200, '#0a0612'); for (let i = 0; i < 30; i++) R(hash(i, 5, 2) * 320, hash(i, 6, 2) * 200, 2, 2, '#241838');
  const u = t % 10, col = SPELLS[0].rgb, S = 3.5, ox = 104, oy = 36, done = u >= 7;
  const pts = [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]].map((q) => [16 + q[0] * 5.5, 16 + q[1] * 5.5]);
  const nd = [[300, 50, 1]].concat(pts.map((p, i) => [ox + p[0] * S, oy + p[1] * S, 2 + i * 0.6]), [[160, 92, 7]]);
  let i = 0; while (i < nd.length - 2 && u >= nd[i + 1][2]) i++;
  const a = nd[i], b = nd[i + 1], k = ease((u - a[2]) / (b[2] - a[2])), px = lerp(a[0], b[0], k), py = lerp(a[1], b[1], k);
  cx.globalAlpha = 0.95; cx.drawImage(ghostCanvas(0, done ? 2 : 1, ((t * 5) | 0) & 3, 0), ox, oy, 112, 112); cx.globalAlpha = 1;
  const gx = ox + 16 * S, gy = oy + 16 * S;
  if (done) { D(gx, gy, 20, 'rgba(' + col + ',0.25)'); cx.drawImage(drawRuneCached(0), gx - 14, gy - 14, 28, 28); }
  else {
    cx.drawImage(GREY_RUNE_CV[0], gx - 14, gy - 14, 28, 28);
    pts.forEach((p, j) => { if (u >= 2 + j * 0.6) { const a2 = t * 5 + j * 1.05; R(px + Math.cos(a2) * 13 - 1, py + Math.sin(a2) * 13 - 1, 3, 3, '#bfe0ff'); } else R(ox + p[0] * S - 1, oy + p[1] * S - 1, 3, 3, '#e6e6ff'); });
    if (u >= 1) { D(px, py, 9, 'rgba(' + col + ',0.35)'); cx.drawImage(drawRuneCached(0), px - 8, py - 8, 16, 16); }
  }
  if (u >= 7 && u < 7.4) R(0, 0, 320, 200, 'rgba(255,255,255,0.3)');
}
SLIDES.splice(4, 0, slideCast);
const _csAdvance = csAdvance;
csAdvance = function () { const i = CS.idx; _csAdvance(); if (CS.idx !== i) CS.t = 0; };

/* ---------- 4. ENDING: freed ghosts + stars ---------- */
(function () {
  const st = document.createElement('style');
  st.textContent = '#freeCv{width:480px;height:110px;image-rendering:pixelated;margin:0 0 6px}#stars{display:flex;gap:14px;margin-bottom:6px;direction:ltr}' +
    '.star{width:44px;height:44px;background:#3a3040;clip-path:polygon(50% 0,62% 36%,100% 38%,70% 60%,80% 100%,50% 76%,20% 100%,30% 60%,0 38%,38% 36%)}' +
    '.star.on{background:#ffd92e;animation:starPop .5s steps(5) both;animation-delay:var(--d)}@keyframes starPop{0%{transform:scale(0)}70%{transform:scale(1.35)}100%{transform:scale(1)}}' +
    '#rate{font-size:calc(var(--fz)*12);color:#7dffa0;margin-bottom:8px;text-shadow:2px 2px 0 #000;text-align:center}' +
    '#win .title{font-size:calc(var(--fz)*34)}#win .msg{margin:6px 60px}#win .stats{margin-bottom:12px;line-height:1.9;padding:8px 24px}';
  document.head.appendChild(st);
  const w = $('win'), cv = document.createElement('canvas'), stars = document.createElement('div'), rate = document.createElement('div');
  cv.id = 'freeCv'; cv.width = 480; cv.height = 110; stars.id = 'stars'; rate.id = 'rate';
  [cv, stars, rate].forEach((e) => w.insertBefore(e, $('winStats')));
})();
function calcStars() {
  const wr = G.ghosts.reduce((a, g) => a + g.wrong, 0), r = G.time / G.timeMax;
  return { wr, n: 1 + (r >= 0.3 ? 1 : 0) + (wr <= 1 ? 1 : 0) };
}
fillWin = function () {
  const s = calcStars(), tot = G.req.reduce((a, b) => a + b, 0);
  $('winStats').innerHTML = '<div><span>' + tr('sGhosts') + '</span><b>' + G.cap.reduce((a, b) => a + b, 0) + '/' + tot + '</b></div><div><span>' + tr('sTime') + '</span><b>' + fmtTime(G.time) + '</b></div>' +
    '<div><span>' + tr('sSpells') + '</span><b>' + G.collected.filter(Boolean).length + '/5</b></div><div><span>' + tr('sWrong') + '</span><b>' + s.wr + '</b></div>';
  $('stars').innerHTML = [0, 1, 2].map((i) => '<div class="star' + (i < s.n ? ' on' : '') + '" style="--d:' + (0.4 + i * 0.5) + 's"></div>').join('');
  $('rate').textContent = tr('rate' + s.n);
};
function freeLoop() {
  const x = $('freeCv').getContext('2d'); x.imageSmoothingEnabled = false; let t0 = 0;
  function f(now) {
    if (G.state !== 'win') return;
    if (!t0) t0 = now; const t = (now - t0) / 1000; x.clearRect(0, 0, 480, 110);
    for (let i = 0; i < 5; i++) {
      const cxp = 48 + i * 96, rise = (1 - ease(t / 1.5)) * 90, y = 62 + rise + Math.sin(t * 2 + i) * 7, c = GHOSTS[i].rgb;
      x.fillStyle = 'rgba(' + c + ',0.18)'; x.beginPath(); x.arc(cxp, y, 40, 0, TAU); x.fill();
      x.drawImage(ghostCanvas(i, 0, ((t * 5 + i) | 0) & 3, 0), cxp - 36, y - 40, 72, 72);
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.7 + k * 0.25 + i * 0.13) % 1, sx = cxp + Math.sin(k * 2.1 + i) * 34, sy = y + 30 - ph * 70;
        x.fillStyle = 'rgba(255,240,170,' + (1 - ph).toFixed(2) + ')'; x.fillRect(Math.round(sx), Math.round(sy), 3, 3);
      }
    }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}
showWin = function () {
  G.state = 'win'; releasePointer(); G.t = 0; el.hud.classList.add('hidden'); el.lensFx.classList.remove('on');
  fillWin(); showScreen('win'); sfx('win'); freeLoop();
};