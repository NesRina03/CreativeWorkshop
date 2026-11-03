'use strict';
/* =========================================================================
   THE HAUNTED HOUSE — The Five Convolutions
   Vanilla JS · canvas raycaster · procedural pixel art · WebAudio
   Sections:
     1. Constants, utils, i18n          7. Sprites (ghosts, runes, props)
     2. Game data (spells, ghosts)      8. Game state & world setup
     3. Pixel icons                     9. Update (player, ghosts, particles)
     4. Audio                          10. Rendering (raycaster, sprites, FX)
     5. Map, textures, lightmap        11. UI (HUD, book, panels, cutscene)
     6. Collision                      12. Input & main loop
   (+ ENDING lesson block, just before the stage/fit code in section 12)
   ========================================================================= */
(function () {

/* ============================ 1. CONSTANTS ============================ */
const W = 320, H = 200, HALF = H / 2, SPR = 32;
const FOV = 0.66, LENS_RANGE = 9, USE_RANGE = 1.3, SENS = 0.0023;
const MW = 32, MH = 24, LMR = 4, LMW = MW * LMR, LMH = MH * LMR;
const TAU = Math.PI * 2;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
function hash(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function rng(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = Math.random;
const fmtTime = (s) => {
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* ============================== i18n ================================== */
const L = {
  en: {
    title: 'THE HAUNTED HOUSE', subtitle: 'The Five Convolutions',
    play: 'PLAY', options: 'OPTIONS', language: 'LANGUAGE', exit: 'EXIT', back: 'BACK',
    sound: 'SOUND', music: 'MUSIC', resume: 'RESUME', restart: 'RESTART', mainMenu: 'MAIN MENU', paused: 'PAUSED',
    skip: 'Press ENTER to skip', next: 'SPACE / CLICK: next', cont: 'CONTINUE',
    spellFound: 'SPELL DISCOVERED', bookTitle: 'SPELLBOOK', cast: 'CAST ON GHOST',
    left: 'left', tipLens: 'Magical lens [L]', tipBook: 'Spellbook [B]', tipHelp: 'Help / intro', tipPause: 'Pause [ESC]',
    keys: 'WASD move · MOUSE look · F collect · L lens · B book · CLICK shoot · TAB free cursor',
    collect: '[F] Collect Spell', identify: '[B] Open spellbook to identify', shootIt: 'CLICK to capture!',
    lensOn: 'LENS ON', lensOff: 'LENS OFF', wrong: 'WRONG SPELL!', attemptsLeft: 'attempt left',
    attemptsLbl: 'ATTEMPTS', captured: 'GHOST CAPTURED!', spellGot: 'SPELL COLLECTED!', identified: 'GHOST REVEALED!',
    needReveal: 'Reveal it with the right spell first!', detected: 'GHOST DETECTED!', noGhostLooked: 'Nothing to capture here',
    locked: 'LOCKED', lockedHint: 'Find this spell somewhere in the mansion to unlock it.',
    selectHint: 'Select a spell, then cast it on the ghost.', browseHint: 'Look at a ghost through the lens [L], then open the book to cast.',
    clickHint: 'CLICK to capture the mouse', colorLbl: 'COLOR', normLbl: 'Normalization',
    winTitle: 'THE MANSION IS FREE!', winMsg: 'You have captured every spirit and restored peace to the haunted mansion.',
    playAgain: 'PLAY AGAIN', loseTitle: 'THE SPIRITS HAVE WON...', loseMsg: 'The mansion remains haunted. Your time is over.',
    rTime: 'The clock reached zero.', rSpell: 'Two wrong spells on the same ghost.',
    sGhosts: 'Ghosts captured', sTime: 'Time remaining', sSpells: 'Spells collected',
    thanks: 'THANKS FOR PLAYING!', byeMsg: 'You can now close this tab.',
    cs: [
      'You have entered a mansion haunted by five kinds of spirits. They hide from ordinary vision, wandering through its corridors unseen.',
      'Fortunately, you possess an enchanted lens capable of revealing supernatural entities. But seeing them is not enough.',
      'Each ghost is bound to a particular convolution spell. To reveal its true form, you must discover the correct spell and apply it.',
      'Five ancient spells are hidden throughout the mansion. Find them, collect them, and study their properties. Your spellbook will preserve every spell you discover.',
      'Use your lens, identify the ghosts, apply the correct spells, and capture every spirit.',
      'But be careful... time is running out. Catch them all before the clock reaches zero.'
    ]
  },
  ar: {
    title: 'البيت المسكون', subtitle: 'الالتفافات الخمس',
    play: 'ابدأ اللعب', options: 'الخيارات', language: 'اللغة', exit: 'خروج', back: 'رجوع',
    sound: 'الصوت', music: 'الموسيقى', resume: 'متابعة', restart: 'إعادة', mainMenu: 'القائمة الرئيسية', paused: 'إيقاف مؤقت',
    skip: 'اضغط ENTER للتخطي', next: 'SPACE / نقرة: التالي', cont: 'متابعة',
    spellFound: 'تم اكتشاف تعويذة', bookTitle: 'كتاب التعاويذ', cast: 'أطلق التعويذة',
    left: 'متبقي', tipLens: 'العدسة السحرية [L]', tipBook: 'كتاب التعاويذ [B]', tipHelp: 'مساعدة / المقدمة', tipPause: 'إيقاف مؤقت [ESC]',
    keys: 'WASD حركة · الفأرة نظر · F جمع · L عدسة · B كتاب · نقرة إطلاق · TAB تحرير المؤشر',
    collect: '[F] اجمع التعويذة', identify: '[B] افتح الكتاب لتحديد الشبح', shootIt: 'انقر لأسر الشبح!',
    lensOn: 'العدسة: تعمل', lensOff: 'العدسة: متوقفة', wrong: 'تعويذة خاطئة!', attemptsLeft: 'محاولة متبقية',
    attemptsLbl: 'المحاولات', captured: 'تم أسر الشبح!', spellGot: 'تم جمع التعويذة!', identified: 'تم كشف الشبح!',
    needReveal: 'اكشفه بالتعويذة الصحيحة أولاً!', detected: 'تم رصد شبح!', noGhostLooked: 'لا يوجد ما يمكن أسره هنا',
    locked: 'مقفلة', lockedHint: 'اعثر على هذه التعويذة في القصر لفتحها.',
    selectHint: 'اختر تعويذة ثم أطلقها على الشبح.', browseHint: 'انظر إلى شبح عبر العدسة [L] ثم افتح الكتاب لإطلاق التعويذة.',
    clickHint: 'انقر للتحكم بالفأرة', colorLbl: 'اللون', normLbl: 'عامل التطبيع',
    winTitle: 'القصر تحرر!', winMsg: 'لقد أسرت كل الأرواح وأعدت السلام إلى القصر المسكون.',
    playAgain: 'العب مجددًا', loseTitle: 'الأرواح انتصرت...', loseMsg: 'ما زال القصر مسكونًا. انتهى وقتك.',
    rTime: 'انتهى الوقت.', rSpell: 'تعويذتان خاطئتان على الشبح نفسه.',
    sGhosts: 'الأشباح المأسورة', sTime: 'الوقت المتبقي', sSpells: 'التعاويذ المجموعة',
    thanks: 'شكرًا للعب!', byeMsg: 'يمكنك الآن إغلاق هذه الصفحة.',
    cs: [
      'لقد دخلتَ قصرًا تسكنه خمسة أنواع من الأرواح. تختبئ عن الأنظار العادية، وتجول في ممراته دون أن تُرى.',
      'لحسن الحظ، تملك عدسة مسحورة قادرة على كشف الكائنات الخارقة. لكن رؤيتها لا تكفي.',
      'كل شبح مرتبط بتعويذة التفاف معيّنة. ولكشف هيئته الحقيقية عليك أن تجد التعويذة الصحيحة وتطبّقها.',
      'خمس تعاويذ قديمة مخبأة في أرجاء القصر. اعثر عليها واجمعها وادرس خصائصها. وسيحفظ كتاب التعاويذ كل تعويذة تكتشفها.',
      'استخدم عدستك، وحدّد الأشباح، وطبّق التعاويذ الصحيحة، وأسِر كل روح.',
      'لكن احذر... الوقت ينفد. أسِرهم جميعًا قبل أن تصل الساعة إلى الصفر.'
    ]
  }
};

/* ============================ 2. GAME DATA ============================ */
const SPELLS = [
  { color: '#3d8bff', rgb: [61, 139, 255], kernel: [1, 2, 1, 2, 4, 2, 1, 2, 1], norm: '1/16',
    name: { en: 'THE GAUSSIAN VEIL', ar: 'حجاب غاوس' }, op: { en: 'Gaussian Blur', ar: 'تمويه غاوسي' },
    colorName: { en: 'BLUE', ar: 'أزرق' },
    fn: { en: 'Smooths an image by reducing high-frequency details and noise.', ar: 'يصقل الصورة بتقليل التفاصيل عالية التردد والضجيج.' },
    desc: { en: 'The Gaussian Veil softens sharp details and smooths the image by averaging neighboring pixels. It reduces noise and creates a blurred appearance.',
            ar: 'يلطّف حجاب غاوس التفاصيل الحادة ويصقل الصورة بحساب متوسط البكسلات المجاورة. يقلّل الضجيج ويمنح مظهرًا ضبابيًا.' } },
  { color: '#ff3b3b', rgb: [255, 59, 59], kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0], norm: null,
    name: { en: 'THE SHARPENING RUNE', ar: 'رونية الشحذ' }, op: { en: 'Sharpening', ar: 'تحسين الحدة' },
    colorName: { en: 'RED', ar: 'أحمر' },
    fn: { en: 'Enhances edges and fine details by increasing contrast between neighboring pixels.', ar: 'يعزّز الحواف والتفاصيل الدقيقة بزيادة التباين بين البكسلات المجاورة.' },
    desc: { en: 'The Sharpening Rune enhances fine details and makes edges more pronounced by increasing the contrast between neighboring pixels.',
            ar: 'تعزّز رونية الشحذ التفاصيل الدقيقة وتجعل الحواف أوضح بزيادة التباين بين البكسلات المجاورة.' } },
  { color: '#22e06a', rgb: [34, 224, 106], kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0], norm: null,
    name: { en: 'THE EDGE SEEKER', ar: 'باحث الحواف' }, op: { en: 'Laplacian Edge Detection', ar: 'كشف الحواف اللابلاسي' },
    colorName: { en: 'GREEN', ar: 'أخضر' },
    fn: { en: 'Detects edges and highlights sudden changes in image intensity.', ar: 'يكشف الحواف ويبرز التغيّرات المفاجئة في شدة الصورة.' },
    desc: { en: 'The Edge Seeker detects boundaries and sudden changes in brightness, revealing the outlines and contours of objects.',
            ar: 'يكشف باحث الحواف الحدود والتغيّرات المفاجئة في السطوع، فيُظهر محيط الأشياء وخطوطها.' } },
  { color: '#b45cff', rgb: [180, 92, 255], kernel: [-2, -1, 0, -1, 1, 1, 0, 1, 2], norm: null,
    name: { en: 'THE EMBOSS CURSE', ar: 'لعنة النقش البارز' }, op: { en: 'Embossing', ar: 'النقش البارز' },
    colorName: { en: 'PURPLE', ar: 'بنفسجي' },
    fn: { en: 'Creates a raised, relief-like appearance by emphasizing directional intensity differences.', ar: 'يصنع مظهرًا بارزًا كالنقش بإبراز فروق الشدة الاتجاهية.' },
    desc: { en: 'The Emboss Curse emphasizes directional differences in an image, creating a relief effect that makes details appear raised or engraved.',
            ar: 'تُبرز لعنة النقش الفروق الاتجاهية في الصورة وتصنع تأثير بروز يجعل التفاصيل تبدو ناتئة أو منقوشة.' } },
  { color: '#ffd92e', rgb: [255, 217, 46], kernel: [1, 0, 0, 1, 0, 0, 1, 0, 0], norm: '1/3',
    name: { en: 'THE PHANTOM TRAIL', ar: 'أثر الشبح' }, op: { en: 'Motion Blur', ar: 'تمويه الحركة' },
    colorName: { en: 'YELLOW', ar: 'أصفر' },
    fn: { en: 'Creates a directional blur that makes objects appear to move.', ar: 'يصنع تمويهًا اتجاهيًا يجعل الأجسام تبدو متحركة.' },
    desc: { en: 'The Phantom Trail creates directional motion blur by averaging pixels along a particular direction, making moving objects appear stretched.',
            ar: 'يصنع أثر الشبح تمويهًا اتجاهيًا بحساب متوسط البكسلات على طول اتجاه معيّن، فتبدو الأجسام المتحركة ممتدة.' } }
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

/* ============================ 3. PIXEL ICONS ========================== */
function mkIcon(size, fn) { const c = mkCanvas(size, size); const x = c.getContext('2d'); fn(x); return c.toDataURL(); }
const P1 = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w || 1, h || 1); };
const ICON = {};
function buildIcons() {
  const lens = (on) => mkIcon(16, (x) => {
    for (let y = 0; y < 16; y++) for (let xx = 0; xx < 16; xx++) {
      const d = Math.hypot(xx - 6.5, y - 6.5);
      if (d <= 6.5 && d > 4.6) P1(x, on ? '#ffd86b' : '#6a5a3a', xx, y);
      else if (d <= 4.6) P1(x, on ? '#7fe8ff' : '#1c2230', xx, y);
    }
    for (let i = 0; i < 5; i++) { P1(x, '#8a5a2a', 11 + i, 11 + i, 2, 2); }
    P1(x, on ? '#ffffff' : '#3a4256', 4, 4, 2, 1); P1(x, on ? '#ffffff' : '#3a4256', 4, 5, 1, 2);
  });
  ICON.lensOn = lens(true); ICON.lensOff = lens(false);
  ICON.book = mkIcon(16, (x) => {
    P1(x, '#2a1408', 1, 2, 14, 12); P1(x, '#6b3a1a', 2, 3, 12, 10); P1(x, '#a8622a', 2, 3, 12, 1);
    P1(x, '#e8d6a0', 4, 4, 8, 8); P1(x, '#c9b078', 8, 4, 1, 8); P1(x, '#ffd24a', 6, 6, 1, 1); P1(x, '#ffd24a', 10, 6, 1, 1);
    P1(x, '#6a3a1a', 5, 8, 2, 1); P1(x, '#6a3a1a', 9, 8, 2, 1); P1(x, '#6a3a1a', 5, 10, 2, 1); P1(x, '#6a3a1a', 9, 10, 2, 1);
  });
  ICON.pause = mkIcon(16, (x) => { P1(x, '#ecdcb8', 4, 3, 3, 10); P1(x, '#ecdcb8', 9, 3, 3, 10); });
  ICON.help = mkIcon(16, (x) => {
    const c = '#ecdcb8'; P1(x, c, 5, 2, 6, 2); P1(x, c, 4, 4, 2, 2); P1(x, c, 10, 4, 2, 3); P1(x, c, 8, 7, 3, 2); P1(x, c, 7, 9, 2, 2); P1(x, c, 7, 12, 2, 2);
  });
  ICON.lock = mkIcon(16, (x) => {
    P1(x, '#8a8a96', 3, 7, 10, 8); P1(x, '#5a5a66', 3, 14, 10, 1); P1(x, '#a8a8b4', 5, 2, 6, 1); P1(x, '#a8a8b4', 5, 3, 2, 4); P1(x, '#a8a8b4', 9, 3, 2, 4);
    P1(x, '#1a1a22', 7, 9, 2, 3);
  });
  const skull = (col, eye) => mkIcon(16, (x) => {
    P1(x, col, 4, 2, 8, 8); P1(x, col, 3, 4, 10, 4); P1(x, col, 5, 10, 6, 3); P1(x, eye, 5, 5, 2, 3); P1(x, eye, 9, 5, 2, 3); P1(x, eye, 8, 9, 1, 1);
    P1(x, eye, 6, 11, 1, 2); P1(x, eye, 9, 11, 1, 2);
  });
  ICON.skull = skull('#e8e8e8', '#20181c'); ICON.skullOff = skull('#4a4048', '#1a1418');
}

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
    creak: () => { const f = 60 + Math.random() * 50; tone(f, 1.1, 'sawtooth', 0.04, 1.5); tone(f * 1.51, 1.0, 'sawtooth', 0.02, 1.4, 0.05); },
    whisper: () => { const f = 1800 + Math.random() * 1500; noise(1.3, 0.06, 'bandpass', f, 0, 0.5); noise(1.0, 0.04, 'bandpass', f * 1.4, 0.3, 0.6); },
    flicker: () => { noise(0.08, 0.06, 'highpass', 5000); noise(0.06, 0.05, 'highpass', 6000, 0.12); },
    far: () => { for (let i = 0; i < 3; i++) noise(0.06, 0.02, 'lowpass', 260, i * 0.5); }
  };
  return { init, setVol, vol, play(n) { if (ctx && SFX[n]) SFX[n](); }, resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); } };
})();
const sfx = (n) => AU.play(n);

/* ========================= 5. MAP, TEXTURES, LIGHT ==================== */
const MAPSTR = [
  '################################',
  '#.....#........#........#......#',
  '#.....#........#........#......#',
  '#.....#...##...#...#....#......#',
  '#.....#........#........#......#',
  '#.....#........#........#......#',
  '#.....#........#........#......#',
  '###.######..#######..######.####',
  '#..............................#',
  '#..............................#',
  '###.######..#######..######.####',
  '#.....#........#........#......#',
  '#.....#...#....#........#..##..#',
  '#.....#........#........#......#',
  '#.....#........#........#......#',
  '#.##..#........#...##...#......#',
  '#.....#........#........#......#',
  '##.#########..###.##########.###',
  '#..............................#',
  '#..............................#',
  '####.#######..#########.########',
  '#..............................#',
  '#...#....#....#....#....#......#',
  '################################'
];
const MAP = new Uint8Array(MW * MH);      // 0 = open, 1..9 = wall texture id
const RUG = new Uint8Array(MW * MH);
const LAMPCELL = new Uint8Array(MW * MH);
function pickWall(x, y) {
  const n = hash(x, y, 7);
  if (n < 0.34) return 1;
  if (n < 0.55) return 2;
  if (n < 0.64) return 3;
  if (n < 0.71) return 4;
  if (n < 0.77) return 5;
  if (n < 0.82) return 6;
  if (n < 0.87) return 7;
  if (n < 0.93) return 8;
  return 9;
}
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (MAPSTR[y][x] === '#') MAP[y * MW + x] = pickWall(x, y);
[[12, 8, 19, 9], [9, 13, 12, 14], [18, 3, 21, 4], [1, 18, 8, 19], [20, 21, 29, 21], [26, 1, 29, 3], [2, 12, 4, 14], [17, 12, 22, 14]]
  .forEach(([a, b, c, d]) => { for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) if (!MAP[y * MW + x]) RUG[y * MW + x] = 1; });

const LAMPS = [ // x, y, intensity, radius, flicker
  [3.5, 3.5, 0.85, 6.5, 0], [8.5, 2.5, 0.7, 6, 1], [21.5, 4.5, 0.9, 6.5, 0], [27.5, 3.5, 0.6, 6, 1],
  [6.5, 8.5, 0.9, 7, 0], [15.5, 9.5, 0.95, 7, 1], [24.5, 8.5, 0.9, 7, 0], [29.5, 9, 0.6, 6, 1],
  [3.5, 13.5, 0.7, 6, 0], [12.5, 14.5, 0.85, 6.5, 1], [17.5, 12.5, 0.8, 6.5, 0], [28.5, 14.5, 0.6, 6, 1],
  [8.5, 18.5, 0.9, 7, 0], [20.5, 19.5, 0.9, 7, 1], [28.5, 18.5, 0.6, 6, 0],
  [6.5, 21.5, 0.8, 6.5, 0], [16.5, 21.5, 0.85, 7, 1], [26.5, 21.5, 0.8, 6.5, 0]
];
const PROPS_SRC = {
  candle: [[1.5, 1.5], [5.5, 6.5], [7.5, 1.5], [14.5, 6.5], [16.5, 1.5], [30.5, 6.5], [1.5, 8.5], [30.5, 9.5], [1.5, 11.5], [14.5, 16.5], [25.5, 11.5], [22.5, 18.5], [1.5, 22.5], [30.5, 18.5], [15.5, 21.5], [8.5, 15.5]],
  crate: [[1.5, 5.5], [29.5, 1.5], [8.5, 6.5], [30.5, 16.5], [7.5, 16.5], [2.5, 22.5]],
  table: [[17.5, 5.5], [27.5, 13.5], [12.5, 5.5], [4.5, 13.5], [21.5, 22.5]],
  chair: [[4.5, 4.5], [13.5, 1.5], [21.5, 1.5], [27.5, 16.5], [8.5, 12.5], [18.5, 14.5], [5.5, 21.5], [28.5, 21.5]],
  barrel: [[30.5, 22.5], [10.5, 19.5], [2.5, 19.5]]
};
const PROP_PAR = { candle: { scale: 0.42, z: 0, block: 0 }, crate: { scale: 0.5, z: 0, block: 0.3 }, table: { scale: 0.56, z: 0, block: 0.34 }, chair: { scale: 0.5, z: 0, block: 0 }, barrel: { scale: 0.56, z: 0, block: 0.28 } };
const PROPS = [];
Object.keys(PROPS_SRC).forEach((k) => PROPS_SRC[k].forEach(([x, y]) => PROPS.push({ kind: k, x, y, scale: PROP_PAR[k].scale, z: PROP_PAR[k].z, block: PROP_PAR[k].block })));
LAMPS.forEach(([x, y]) => { LAMPCELL[(y | 0) * MW + (x | 0)] = 1; });

/* ---- procedural textures (64x64) ---- */
function makeTex(fn) {
  const t = new Uint32Array(4096);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const c = fn(x, y), a = c[3] || 255;
    t[y * 64 + x] = (a << 24) | (clamp(c[2] | 0, 0, 255) << 16) | (clamp(c[1] | 0, 0, 255) << 8) | clamp(c[0] | 0, 0, 255);
  }
  return t;
}
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
const WP = [[92, 36, 46, 76, 28, 38, 120, 62, 72], [38, 62, 52, 30, 50, 42, 62, 96, 80], [52, 56, 86, 42, 46, 72, 86, 92, 126]];
function wallBase(x, y, sch) {
  const w = WP[sch]; let c;
  if (y >= 30) {
    const pl = x >> 4, gx = x & 15, gr = hash(x, y >> 1, pl) * 16, k = 1 + (hash(pl, 1, 5) - 0.5) * 0.3;
    c = [68 * k + gr, 42 * k + gr * 0.7, 25 * k + gr * 0.5];
    if (gx === 0 || gx === 15) c = [24, 14, 9];
    if (y === 30 || y === 31) c = [118, 78, 46]; else if (y === 32) c = [40, 24, 14];
    else if (y >= 37 && y <= 59 && gx >= 3 && gx <= 12) { if (y === 37 || gx === 3) c = [34, 20, 12]; else if (y === 59 || gx === 12) c = [96, 64, 38]; }
    if (y >= 60) c = [22, 13, 8];
  } else {
    const s = x & 15, yy = y & 15;
    c = [w[0], w[1], w[2]];
    if (s >= 6 && s <= 9) c = [w[3], w[4], w[5]];
    if (Math.abs(s - 7.5) + Math.abs(yy - 7.5) < 3.2) c = [w[6], w[7], w[8]];
    c = mul(c, 0.78 + hash(x >> 1, y >> 1, 11) * 0.3);
    if (hash(x >> 3, 0, 21) > 0.8) c = mul(c, 0.75 - (y / 30) * 0.1);
    if (hash(x >> 2, y >> 2, 31) > 0.94) c = [150, 138, 118];
    if (y === 29) c = [20, 12, 8];
  }
  return c;
}
function texWall(id) {
  return makeTex((x, y) => {
    switch (id) {
      case 1: return wallBase(x, y, 0);
      case 2: { let c = wallBase(x, y, 1);
        if (segDist(x, y, 12, 0, 20, 14) < 0.8 || segDist(x, y, 20, 14, 15, 26) < 0.8 || segDist(x, y, 15, 26, 24, 38) < 0.8) c = [14, 10, 8];
        if (hash(x >> 2, y >> 3, 52) > 0.9 && y < 30) c = mul(c, 0.55);
        return c; }
      case 3: { let c = wallBase(x, y, 0);
        if (x >= 12 && x <= 51 && y >= 6 && y <= 46) {
          if (x < 15 || x > 48 || y < 9 || y > 43) c = hash(x, y, 3) > 0.5 ? [160, 118, 44] : [120, 86, 30];
          else if (x < 17 || x > 46 || y < 11 || y > 41) c = [44, 28, 12];
          else {
            c = [26, 32, 38];
            const hd = Math.hypot((x - 32) / 6.5, (y - 23) / 8);
            if (hd < 1) c = [168, 138, 108];
            if (hd < 1 && ((y === 21 && (x === 29 || x === 35)) || (y === 21 && (x === 30 || x === 36)))) c = [20, 14, 12];
            if (y >= 32 && Math.abs(x - 32) < 8 + (y - 32) * 0.6) c = [34, 26, 34];
            if (y >= 29 && y < 32 && Math.abs(x - 32) < 3) c = [150, 120, 96];
            c = mul(c, 0.8 + hash(x, y, 8) * 0.3);
          }
        }
        return c; }
      case 4: { let c = [48, 30, 18];
        const sh = y % 16;
        if (y < 3 || y >= 61 || x < 3 || x >= 61) return [34, 20, 12];
        if (sh >= 13) return [86, 56, 32];
        const bk = x >> 2, hh = hash(bk, y >> 4, 4);
        if (hh > 0.18) { const top = (y % 16) < 3 + hh * 5; if (!top) { c = [(60 + hh * 130) | 0, (30 + hash(bk, 2, 4) * 70) | 0, (28 + hash(bk, 3, 4) * 60) | 0]; if ((x & 3) === 3) c = mul(c, 0.5); if (((y % 16) === 7)) c = [200, 170, 90]; } }
        return c; }
      case 5: { let c = [34, 20, 12];
        if (x >= 6 && x <= 57 && y >= 2) { c = [88, 56, 30]; c = mul(c, 0.85 + hash(x >> 3, y, 5) * 0.25);
          if ((x >= 12 && x <= 29 || x >= 34 && x <= 51) && ((y >= 8 && y <= 28) || (y >= 34 && y <= 58))) {
            const edge = (x === 12 || x === 34 || y === 8 || y === 34 || x === 29 || x === 51 || y === 28 || y === 58);
            c = edge ? [50, 30, 16] : [108, 70, 38]; }
          if (x >= 46 && x <= 49 && y >= 31 && y <= 34) c = [210, 170, 70]; if (x === 47 && y === 36) c = [10, 6, 4]; }
        return c; }
      case 6: { let c = wallBase(x, y, 2);
        if (x >= 18 && x <= 45) { c = [58, 34, 18]; c = mul(c, 0.85 + hash(x, y >> 2, 6) * 0.3); if (x === 18 || x === 45) c = [30, 18, 10];
          const fd = Math.hypot(x - 32, y - 16);
          if (y < 30 && fd < 10) { c = fd > 8.5 ? [180, 140, 50] : [214, 204, 172];
            if (fd < 8.5 && (Math.abs(x - 32) < 1 && y < 16 && y > 9 || Math.abs(y - 16) < 1 && x > 31 && x < 38)) c = [20, 14, 10]; }
          if (y >= 30 && y <= 56 && x >= 24 && x <= 39) { c = [24, 34, 38]; if (Math.abs(x - 32) <= 0 && y > 32) c = [190, 150, 50]; if (Math.hypot(x - 32, y - 52) < 3.5) c = [210, 170, 60]; } }
        return c; }
      case 7: { let c = wallBase(x, y, 2);
        if (x >= 14 && x <= 49 && y >= 5 && y <= 54) {
          if (x < 18 || x > 45 || y < 9 || y > 50) c = hash(x, y, 9) > 0.5 ? [140, 104, 46] : [100, 74, 32];
          else { const g = 96 + (x + y) * 0.5; c = [g * 0.8, g, g * 1.15];
            if (Math.abs(x - y * 0.6 - 10) < 2) c = [190, 210, 225];
            if (segDist(x, y, 30, 9, 38, 28) < 0.7 || segDist(x, y, 38, 28, 33, 44) < 0.7) c = [30, 36, 44]; } }
        return c; }
      case 8: { let c = [56, 34, 20]; c = mul(c, 0.8 + hash(x >> 3, y, 5) * 0.3);
        if (x < 3 || x > 60 || y < 3 || y > 60 || x === 31 || x === 32) c = [28, 16, 9];
        else if ((x >= 6 && x <= 27 || x >= 36 && x <= 57) && ((y >= 6 && y <= 28) || (y >= 34 && y <= 57))) { const e = (x === 6 || x === 36 || y === 6 || y === 34 || x === 27 || x === 57 || y === 28 || y === 57); c = e ? [38, 22, 12] : [76, 48, 28]; }
        if (x >= 27 && x <= 29 && y >= 28 && y <= 36 || x >= 34 && x <= 36 && y >= 28 && y <= 36) c = [200, 160, 60];
        return c; }
      default: { let c = wallBase(x, y, 0);
        if (Math.hypot(x - 22, y - 20) < 11 + hash(x, y, 13) * 3) c = [150, 140, 122];
        if (Math.hypot(x - 22, y - 20) < 7) c = (x + y) % 6 < 3 ? [100, 66, 40] : [26, 18, 14];
        if (segDist(x, y, 40, 4, 46, 22) < 1 || segDist(x, y, 46, 22, 38, 36) < 1 || segDist(x, y, 38, 36, 44, 58) < 1 || segDist(x, y, 12, 40, 26, 46) < 1) c = [14, 10, 8];
        if (hash(x >> 2, y >> 2, 71) > 0.88 && y < 30) c = [150, 140, 122];
        return c; }
    }
  });
}
const WALLTEX = [null]; for (let i = 1; i <= 9; i++) WALLTEX.push(texWall(i));
const TEX_FLOOR = makeTex((x, y) => {
  const row = y >> 3, off = (row * 21) % 64, xx = (x + off) & 63;
  const plank = hash(xx >> 5, row, 3);
  let c = mul([88, 58, 34], 0.78 + plank * 0.36);
  c = mul(c, 0.92 + hash(xx >> 3, y, 7) * 0.16);
  if ((y & 7) === 0 || xx % 32 === 0) c = [20, 12, 8];
  else if ((y & 7) === 7) c = mul(c, 0.8);
  if (plank < 0.09) { c = [30, 20, 15]; if (hash(x, y, 4) > 0.6) c = [14, 9, 7]; }
  if (hash(x >> 1, y >> 1, 9) > 0.87) c = [c[0] * 0.6 + 50, c[1] * 0.6 + 44, c[2] * 0.6 + 36];
  return c;
});
const TEX_RUG = makeTex((x, y) => {
  const b = Math.min(x, y, 63 - x, 63 - y); let c = [112, 26, 34];
  if (b < 3) c = [40, 16, 18]; else if (b < 7) c = (x + y) % 8 < 4 ? [182, 142, 64] : [140, 104, 46]; else if (b < 10) c = [66, 16, 24];
  else { const d = Math.abs(x - 32) + Math.abs(y - 32); const m = d % 16; if (m < 3) c = [170, 130, 62]; else if (m < 6) c = [80, 20, 30]; if (d < 6) c = [196, 156, 72]; }
  c = mul(c, 0.72 + hash(x, y, 13) * 0.3);
  if (hash(x >> 2, y >> 2, 5) > 0.88) c = [c[0] * 0.7 + 38, c[1] * 0.7 + 30, c[2] * 0.7 + 28];
  return c;
});
function ceilBase(x, y) {
  let c = mul([66, 60, 56], 0.8 + hash(x, y, 17) * 0.3);
  if ((x & 31) === 0 || (y & 31) === 0) c = [40, 36, 34];
  if (y >= 26 && y < 38) { c = mul([54, 33, 19], 0.8 + hash(x >> 3, y, 4) * 0.4); if (y === 26 || y === 37) c = [24, 14, 8]; }
  if (hash(x >> 2, y >> 2, 44) > 0.975) c = [28, 24, 22];
  if (x + y < 14 && (x === y || (x * y) % 5 === 0)) c = [150, 150, 156];
  return c;
}
const TEX_CEIL = makeTex(ceilBase);
const TEX_LAMP = makeTex((x, y) => {
  const d = Math.hypot(x - 32, y - 32);
  if (d < 5) return [255, 255, 235, 250];
  if (d < 13) return [255, 232, 160, 250];
  if (d < 18) return [168, 124, 50];
  return ceilBase(x, y);
});

/* ---- lightmap (static lamps + flickering lamps, with line-of-sight) ---- */
const LMS = new Float32Array(LMW * LMH), LMF = new Float32Array(LMW * LMH);
function los(x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.hypot(dx, dy) / 0.15);
  for (let i = 1; i < n; i++) { const t = i / n, x = x0 + dx * t, y = y0 + dy * t; if (MAP[(y | 0) * MW + (x | 0)]) return false; }
  return true;
}
(function buildLightmap() {
  const all = LAMPS.map((l) => ({ x: l[0], y: l[1], i: l[2], r: l[3], f: l[4] }));
  PROPS.filter((p) => p.kind === 'candle').forEach((p) => all.push({ x: p.x, y: p.y, i: 0.5, r: 3.4, f: 0 }));
  all.forEach((lp) => {
    const x0 = Math.max(0, ((lp.x - lp.r) * LMR) | 0), x1 = Math.min(LMW - 1, ((lp.x + lp.r) * LMR) | 0);
    const y0 = Math.max(0, ((lp.y - lp.r) * LMR) | 0), y1 = Math.min(LMH - 1, ((lp.y + lp.r) * LMR) | 0);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      const wx = (i + 0.5) / LMR, wy = (j + 0.5) / LMR;
      if (MAP[(wy | 0) * MW + (wx | 0)]) continue;
      const d = Math.hypot(wx - lp.x, wy - lp.y);
      if (d >= lp.r || !los(lp.x, lp.y, wx, wy)) continue;
      const v = Math.pow(1 - d / lp.r, 2) * lp.i;
      (lp.f ? LMF : LMS)[j * LMW + i] += v;
    }
  });
})();
function flickerFactor(t) {
  const k = Math.floor(t * 13), h = hash(k, 0, 1);
  let f = 0.88 + Math.sin(t * 7.3) * 0.05;
  if (h > 0.84) f *= 0.25 + hash(k, 1, 2) * 0.5;
  return f;
}
function lightAt(x, y, fk) { const i = ((y * LMR) | 0) * LMW + ((x * LMR) | 0); return LMS[i] + LMF[i] * fk; }

/* ============================ 6. COLLISION ============================ */
function solid(x, y) { return x < 0 || y < 0 || x >= MW || y >= MH || MAP[(y | 0) * MW + (x | 0)] !== 0; }
function canMoveG(x, y, r) { return !(solid(x - r, y - r) || solid(x + r, y - r) || solid(x - r, y + r) || solid(x + r, y + r)); }
function canMove(x, y, r) {
  if (!canMoveG(x, y, r)) return false;
  for (let i = 0; i < PROPS.length; i++) { const p = PROPS[i]; if (!p.block) continue; const dx = x - p.x, dy = y - p.y, rr = p.block + r; if (dx * dx + dy * dy < rr * rr) return false; }
  return true;
}

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

/* ============================ 8. GAME STATE =========================== */
const view = $('view'), vctx = view.getContext('2d');
vctx.imageSmoothingEnabled = false;
const img = vctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer), zbuf = new Float32Array(W);
const G = {
  state: 'menu', lang: 'en', sfxVol: 0.7, musVol: 0.5, t: 0, wt: 0,
  time: 0, timeMax: 0, collected: [false, false, false, false, false], sel: 0, lens: false,
  ghosts: [], req: [0, 0, 0, 0, 0], cap: [0, 0, 0, 0, 0], target: null, spellsW: [],
  bookGhost: null, csMode: 'new', backTo: 'menu', started: false, ambT: 5, stepT: 0, shotT: 0, shotTx: 0, shotTy: 0, endT: 0
};
const P = { x: 2.5, y: 8.5, a: 0 };
const cam = { x: 2.5, y: 8.5, a: 0, dx: 1, dy: 0 };
const keys = {};
const parts = [];
let expectUnlock = false, lastTimerTxt = '';

function save() { try { localStorage.setItem('hh5c', JSON.stringify({ l: G.lang, s: G.sfxVol, m: G.musVol })); } catch (e) {} }
function load() { try { const o = JSON.parse(localStorage.getItem('hh5c') || '{}'); if (o.l === 'ar' || o.l === 'en') G.lang = o.l; if (typeof o.s === 'number') G.sfxVol = clamp(o.s, 0, 1); if (typeof o.m === 'number') G.musVol = clamp(o.m, 0, 1); } catch (e) {} }
const tr = (k) => (L[G.lang] && L[G.lang][k]) || L.en[k] || k;
const SPELL_SPOTS = [[3.5, 2.5], [22.5, 2.5], [12.5, 14.5], [28.5, 14.5], [27.5, 21.5], [8.5, 5.5], [18.5, 12.5], [6.5, 18.5], [29.5, 3.5], [10.5, 21.5]];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function buildWorld() {
  // ---- random distribution: every type gets 1..3 ghosts, HUD counts == spawned instances ----
  G.req = [0, 0, 0, 0, 0].map(() => 1 + ((rnd() * 3) | 0));
  G.cap = [0, 0, 0, 0, 0];
  const total = G.req.reduce((a, b) => a + b, 0);
  G.timeMax = 120 + 50 * total; G.time = G.timeMax;
  G.collected = [false, false, false, false, false]; G.sel = 0; G.lens = false; G.target = null; G.bookGhost = null;
  // ---- spells ----
  const spots = shuffle(SPELL_SPOTS.slice());
  G.spellsW = SPELLS.map((s, i) => ({ id: i, x: spots[i][0], y: spots[i][1], got: false, ph: rnd() * TAU }));
  // ---- ghosts ----
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

/* ============================ 9. UPDATE =============================== */
function addP(x, y, z, vx, vy, vz, life, c, sz) { if (parts.length > 520) parts.shift(); parts.push({ x, y, z, vx, vy, vz, l: life, m: life, c, s: sz || 0.022 }); }
function burst(x, y, z, c, n) { for (let i = 0; i < n; i++) { const a = rnd() * TAU, s = 0.5 + rnd() * 1.6; addP(x, y, z, Math.cos(a) * s, Math.sin(a) * s, (rnd() - 0.2) * 1.6, 0.5 + rnd() * 0.7, c, 0.02 + rnd() * 0.025); } }
function stepParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.l -= dt; if (p.l <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; } }
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
function onCaptured(g) {
  G.cap[g.type]++; hudGhosts(); toast(tr('captured'), GHOSTS[g.type].color); sfx('capture');
  if (G.cap.every((c, i) => c >= G.req[i])) { G.endT = 0.7; }
}
function updatePlayer(dt) {
  let mx = 0, my = 0;
  if (keys.KeyW || keys.ArrowUp) my += 1; if (keys.KeyS || keys.ArrowDown) my -= 1;
  if (keys.KeyD) mx += 1; if (keys.KeyA) mx -= 1;
  P.a += ((keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0)) * 2.2 * dt;
  if (mx || my) {
    const l = Math.hypot(mx, my); mx /= l; my /= l;
    const dx = Math.cos(P.a), dy = Math.sin(P.a), sp = 2.7 * dt;
    const vx = (dx * my - dy * mx) * sp, vy = (dy * my + dx * mx) * sp;
    if (canMove(P.x + vx, P.y, 0.22)) P.x += vx;
    if (canMove(P.x, P.y + vy, 0.22)) P.y += vy;
    G.stepT -= dt; if (G.stepT <= 0) { sfx('step'); G.stepT = 0.42; }
  } else G.stepT = 0.05;
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

/* =========================== 10. RENDERING ============================ */
function renderWorld(lensOn, time, wtime) {
  const px_ = cam.x, py_ = cam.y, dx = cam.dx, dy = cam.dy, plx = -dy * FOV, ply = dx * FOV;
  const fk = flickerFactor(time), amb = 0.1 + (lensOn ? 0.1 : 0);
  // ---------- floor & ceiling ----------
  const rx0 = dx - plx, ry0 = dy - ply, rx1 = dx + plx, ry1 = dy + ply;
  for (let y = HALF + 1; y < H; y++) {
    const rd = HALF / (y - HALF);
    let fx = px_ + rd * rx0, fy = py_ + rd * ry0;
    const sx = rd * (rx1 - rx0) / W, sy = rd * (ry1 - ry0) / W;
    let g = 1 - rd / 8; g = g > 0 ? g * g * 0.5 : 0;
    const gl = amb + g, iF = y * W, iC = (H - 1 - y) * W;
    for (let x = 0; x < W; x++, fx += sx, fy += sy) {
      const cx = fx | 0, cy = fy | 0;
      if (fx < 0 || fy < 0 || cx >= MW || cy >= MH) { buf[iF + x] = 0xFF000000; buf[iC + x] = 0xFF000000; continue; }
      const ci = cy * MW + cx, ti = ((((fy - cy) * 64) | 0) << 6) | (((fx - cx) * 64) | 0);
      const li = ((fy * LMR) | 0) * LMW + ((fx * LMR) | 0), lamp = LMS[li] + LMF[li] * fk;
      let mr = gl * 0.9 + lamp, mg = gl * 0.95 + lamp * 0.8, mb = gl * 1.15 + lamp * 0.5;
      let c = (RUG[ci] ? TEX_RUG : TEX_FLOOR)[ti], r = (c & 255) * mr, gg = ((c >>> 8) & 255) * mg, b = ((c >>> 16) & 255) * mb;
      buf[iF + x] = 0xFF000000 | ((b > 255 ? 255 : b) << 16) | ((gg > 255 ? 255 : gg) << 8) | (r > 255 ? 255 : r);
      c = (LAMPCELL[ci] ? TEX_LAMP : TEX_CEIL)[ti];
      if ((c >>> 24) === 250) { mr = mg = mb = 1.15; } else { mr *= 0.7; mg *= 0.7; mb *= 0.75; }
      r = (c & 255) * mr; gg = ((c >>> 8) & 255) * mg; b = ((c >>> 16) & 255) * mb;
      buf[iC + x] = 0xFF000000 | ((b > 255 ? 255 : b) << 16) | ((gg > 255 ? 255 : gg) << 8) | (r > 255 ? 255 : r);
    }
  }
  // ---------- walls ----------
  for (let x = 0; x < W; x++) {
    const camX = 2 * x / W - 1;
    let rdx = dx + plx * camX, rdy = dy + ply * camX;
    if (rdx === 0) rdx = 1e-9; if (rdy === 0) rdy = 1e-9;
    let mx = px_ | 0, my = py_ | 0;
    const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
    let stepX, stepY, sdx, sdy;
    if (rdx < 0) { stepX = -1; sdx = (px_ - mx) * ddx; } else { stepX = 1; sdx = (mx + 1 - px_) * ddx; }
    if (rdy < 0) { stepY = -1; sdy = (py_ - my) * ddy; } else { stepY = 1; sdy = (my + 1 - py_) * ddy; }
    let side = 0, hit = 0;
    while (!hit) {
      if (sdx < sdy) { sdx += ddx; mx += stepX; side = 0; } else { sdy += ddy; my += stepY; side = 1; }
      if (mx < 0 || my < 0 || mx >= MW || my >= MH) { hit = 1; break; }
      hit = MAP[my * MW + mx];
    }
    let perp = side === 0 ? sdx - ddx : sdy - ddy; if (perp < 0.03) perp = 0.03;
    zbuf[x] = perp;
    const lineH = (H / perp) | 0;
    let ds = HALF - (lineH >> 1), de = HALF + (lineH >> 1);
    const step = 64 / lineH; let tp = 0;
    if (ds < 0) { tp = -ds * step; ds = 0; } if (de >= H) de = H - 1;
    let wx = side === 0 ? py_ + perp * rdy : px_ + perp * rdx; wx -= Math.floor(wx);
    let tu = (wx * 64) | 0; if (side === 0 && rdx > 0) tu = 63 - tu; if (side === 1 && rdy < 0) tu = 63 - tu;
    const tex = WALLTEX[hit] || WALLTEX[1];
    const hx = clamp(px_ + perp * rdx - (side === 0 ? stepX * 0.04 : 0), 0.01, MW - 0.01), hy = clamp(py_ + perp * rdy - (side === 1 ? stepY * 0.04 : 0), 0.01, MH - 0.01);
    const lamp = lightAt(hx, hy, fk);
    let g = 1 - perp / 8; g = g > 0 ? g * g * 0.5 : 0;
    const gl = amb + g, sh = side === 1 ? 0.82 : 1;
    const mr = (gl * 0.9 + lamp) * sh, mg = (gl * 0.95 + lamp * 0.8) * sh, mb = (gl * 1.15 + lamp * 0.5) * sh;
    for (let y = ds; y <= de; y++) {
      const c = tex[((tp & 63) << 6) | tu]; tp += step;
      const r = (c & 255) * mr, gg = ((c >>> 8) & 255) * mg, b = ((c >>> 16) & 255) * mb;
      buf[y * W + x] = 0xFF000000 | ((b > 255 ? 255 : b) << 16) | ((gg > 255 ? 255 : gg) << 8) | (r > 255 ? 255 : r);
    }
  }
  // ---------- lens tint (world only; sprites are drawn afterwards) ----------
  if (lensOn) {
    for (let y = 0; y < H; y++) {
      const sl = (y & 1) ? 0.86 : 1;
      for (let x = 0; x < W; x++) {
        const i = y * W + x, c = buf[i];
        let r = (c & 255) * 0.62 * sl + 2, g = ((c >>> 8) & 255) * 0.98 * sl + 12, b = ((c >>> 16) & 255) * 1.18 * sl + 26;
        buf[i] = 0xFF000000 | ((b > 255 ? 255 : b) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r);
      }
    }
  }
}
const DIS = new Float32Array(1024); for (let i = 0; i < 1024; i++) DIS[i] = Math.random();
function drawSprite(spr, S, wx, wy, scale, zl, o) {
  const rx = wx - cam.x, ry = wy - cam.y, ty = cam.dx * rx + cam.dy * ry;
  if (ty < 0.12) return null;
  const tr_ = -cam.dy * rx + cam.dx * ry, sxp = W / 2 * (1 + tr_ / (FOV * ty));
  const size = H / ty * scale, bottom = HALF + (0.5 - zl) * H / ty, top = bottom - size, left = sxp - size / 2;
  const info = { left, top, size, ty, sx: sxp, drawn: false };
  const x0 = Math.max(0, Math.ceil(left)), x1 = Math.min(W - 1, Math.ceil(left + size) - 1);
  const y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H - 1, Math.ceil(bottom) - 1);
  if (x1 < x0 || y1 < y0 || size < 1) return info;
  const lt = o.light, fl = o.flash, ga = o.alpha === undefined ? 1 : o.alpha, dis = o.dis || 0;
  for (let x = x0; x <= x1; x++) {
    if (ty >= zbuf[x]) continue;
    const u = Math.min(S - 1, ((x - left) * S / size) | 0);
    for (let y = y0; y <= y1; y++) {
      const v = Math.min(S - 1, ((y - top) * S / size) | 0), c = spr[v * S + u], a = c >>> 24;
      if (!a) continue;
      if (dis && DIS[(v * 31 + u * 7) & 1023] < dis) continue;
      let r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255;
      if (lt) { r *= lt[0]; g *= lt[1]; b *= lt[2]; if (r > 255) r = 255; if (g > 255) g = 255; if (b > 255) b = 255; }
      if (fl) { r += (fl[0] - r) * fl[3]; g += (fl[1] - g) * fl[3]; b += (fl[2] - b) * fl[3]; }
      const al = a / 255 * ga, di = y * W + x;
      if (al < 0.99) { const d = buf[di]; r = (d & 255) + (r - (d & 255)) * al; g = ((d >>> 8) & 255) + (g - ((d >>> 8) & 255)) * al; b = ((d >>> 16) & 255) + (b - ((d >>> 16) & 255)) * al; }
      buf[di] = 0xFF000000 | (b << 16) | (g << 8) | r;
      info.drawn = true;
    }
  }
  return info;
}
function propLight(p, fk) {
  const d = Math.hypot(p.x - cam.x, p.y - cam.y); let g = 1 - d / 8; g = g > 0 ? g * g * 0.5 : 0;
  const lamp = lightAt(p.x, p.y, fk), gl = 0.14 + g;
  return [gl * 0.9 + lamp + 0.08, gl * 0.95 + lamp * 0.8 + 0.06, gl * 1.15 + lamp * 0.5 + 0.06];
}
function drawParticles() {
  for (const p of parts) {
    const rx = p.x - cam.x, ry = p.y - cam.y, ty = cam.dx * rx + cam.dy * ry;
    if (ty < 0.2) continue;
    const tr_ = -cam.dy * rx + cam.dx * ry, sx = Math.round(W / 2 * (1 + tr_ / (FOV * ty)));
    if (sx < 0 || sx >= W || ty >= zbuf[sx]) continue;
    const sy = Math.round(HALF + (0.5 - p.z) * H / ty), sz = Math.max(1, Math.round(p.s * H / ty)), a = Math.min(1, p.l / p.m * 1.4) * 0.9;
    for (let yy = sy; yy < sy + sz; yy++) for (let xx = sx; xx < sx + sz; xx++) {
      if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
      const i = yy * W + xx, d = buf[i];
      const r = (d & 255) + (p.c[0] - (d & 255)) * a, g = ((d >>> 8) & 255) + (p.c[1] - ((d >>> 8) & 255)) * a, b = ((d >>> 16) & 255) + (p.c[2] - ((d >>> 16) & 255)) * a;
      buf[i] = 0xFF000000 | (b << 16) | (g << 8) | r;
    }
  }
}
function renderFrame(cm, lensOn, time, wtime, interactive) {
  cam.x = cm.x; cam.y = cm.y; cam.a = cm.a; cam.dx = Math.cos(cm.a); cam.dy = Math.sin(cm.a);
  renderWorld(lensOn, time, wtime);
  const fk = flickerFactor(time), list = [];
  for (const g of G.ghosts) {
    g.sr = null; g.vis = false;
    if (g.state === 'captured' || !lensOn) continue;
    const d = Math.hypot(g.x - cam.x, g.y - cam.y); if (d > LENS_RANGE) continue;
    list.push({ k: 'g', o: g, d });
  }
  for (const s of G.spellsW) if (!s.got) list.push({ k: 's', o: s, d: Math.hypot(s.x - cam.x, s.y - cam.y) });
  for (const p of PROPS) list.push({ k: 'p', o: p, d: Math.hypot(p.x - cam.x, p.y - cam.y) });
  list.sort((a, b) => b.d - a.d);
  let seenNew = false;
  for (const it of list) {
    if (it.k === 'p') {
      const p = it.o, lt = p.kind === 'candle' ? [1.2, 1.1, 0.9] : propLight(p, fk);
      drawSprite(PROPSPR[p.kind], SPR, p.x, p.y, p.scale, p.z, { light: lt });
    } else if (it.k === 's') {
      const s = it.o;
      drawSprite(RUNE[s.id], 16, s.x, s.y, 0.36, 0.3 + Math.sin(time * 2.4 + s.ph) * 0.05, { alpha: 0.95 });
    } else {
      const g = it.o, gp = GPAR[g.type], fr = ((time * 6 + g.ph * 2) | 0) & 3;
      const form = g.state === 'hidden' ? 1 : 0;
      let eye = 0;
      if (g.type === 2 && form === 0) { const rx = g.x - cam.x, ry = g.y - cam.y, ty = cam.dx * rx + cam.dy * ry; if (ty > 0.1) eye = clamp(Math.round(-(-cam.dy * rx + cam.dx * ry) / ty * 2.2), -1, 1); }
      const spr = ghostSpr(g.type, form, fr, eye);
      const o = { alpha: clamp((LENS_RANGE - it.d) / 2.5, 0, 1) * (g.state === 'revealed' ? 0.96 : 0.82) };
      let sc = gp.scale, ex = 0;
      if (g.state === 'capturing') {
        const k = g.ct / 0.9; o.flash = (((g.ct * 14) | 0) & 1) ? [255, 255, 255, 0.85] : [GHOSTS[g.type].rgb[0], GHOSTS[g.type].rgb[1], GHOSTS[g.type].rgb[2], 0.6];
        if (k > 0.5) o.dis = (k - 0.5) * 2; sc = gp.scale * (1 - k * 0.5); o.alpha = 1;
      }
      const z = gp.z + Math.sin(time * 1.7 + g.ph) * gp.bob + (g.type === 0 ? 0.04 : 0);
      if (g.type === 1 && ((time * 3 + g.ph) % 5) < 0.2) ex = (rnd() - 0.5) * 0.05;
      const info = drawSprite(spr, SPR, g.x + ex, g.y, sc, z, o);
      if (info && info.drawn) { g.sr = info; g.vis = true; if (!g.seen && interactive) { g.seen = true; seenNew = true; } }
    }
  }
  if (seenNew) G.pendingDetect = true;
  drawParticles();
  vctx.putImageData(img, 0, 0);
  // ---------- targeting (crosshair vs ghost hit boxes) ----------
  G.target = null;
  if (interactive && lensOn) {
    let best = null;
    for (const g of G.ghosts) {
      const r = g.sr; if (!r || g.state === 'capturing') continue;
      const cxp = r.left + r.size * GPAR[g.type].cx;
      if (Math.abs(W / 2 - cxp) > r.size * GPAR[g.type].hw) continue;
      if (HALF < r.top + r.size * 0.06 || HALF > r.top + r.size * 0.97) continue;
      if (r.ty >= zbuf[W >> 1] + 0.01) continue;
      if (!best || r.ty < best.sr.ty) best = g;
    }
    G.target = best;
    if (best) {
      const r = best.sr, c = best.state === 'revealed' ? '#ffffff' : GHOSTS[best.type].color;
      const cxp = r.left + r.size * GPAR[best.type].cx, hw = r.size * GPAR[best.type].hw + 3, t0 = r.top + r.size * 0.04, t1 = r.top + r.size * 0.98, l = Math.max(3, Math.min(8, r.size * 0.1));
      vctx.fillStyle = c;
      const x0 = Math.round(cxp - hw), x1 = Math.round(cxp + hw), y0 = Math.round(t0), y1 = Math.round(t1);
      vctx.fillRect(x0, y0, l, 1); vctx.fillRect(x0, y0, 1, l); vctx.fillRect(x1 - l, y0, l, 1); vctx.fillRect(x1, y0, 1, l);
      vctx.fillRect(x0, y1, l, 1); vctx.fillRect(x0, y1 - l, 1, l); vctx.fillRect(x1 - l, y1, l, 1); vctx.fillRect(x1, y1 - l, 1, l + 1);
    }
  }
  // ---------- shot beam ----------
  if (G.shotT > 0) {
    const k = G.shotT / 0.12; vctx.fillStyle = 'rgba(160,240,255,' + (0.4 + k * 0.5) + ')';
    for (let i = 0; i < 24; i++) { const t = i / 24, x = W / 2 + (G.shotTx - W / 2) * 0 + Math.sin(i * 2.3 + G.t * 40) * (1 - t) * 3, y = H - 2 - (H - 2 - HALF) * t; vctx.fillRect(Math.round(x), Math.round(y), 2, 3); }
    vctx.fillStyle = 'rgba(255,255,255,' + k + ')'; vctx.fillRect(W / 2 - 3, HALF - 3, 6, 6);
  }
}
function render() {
  let cm = P, lensOn = G.lens, interactive = true, wt = G.wt;
  if (G.state === 'menu' || G.state === 'win' || G.state === 'lose' || G.state === 'bye' || G.state === 'ending') {
    const t = G.t; cm = { x: 16 + Math.sin(t * 0.1) * 4, y: 9, a: t * 0.12 }; lensOn = false; interactive = false;
  }
  renderFrame(cm, lensOn, G.state === 'playing' ? G.wt : (interactive ? G.wt : G.t), wt, interactive);
}

/* ============================== 11. UI ================================ */
const el = {
  hud: $('hud'), timer: $('timer'), gc: $('gcounters'), prompt: $('prompt'), toast: $('toast'), clickHint: $('clickHint'),
  lens: $('btnLens'), lensImg: $('lensImg'), crosshair: $('crosshair'), lensFx: $('lensFx'), flash: $('flashFx')
};
const SCREENS = ['menu', 'options', 'language', 'pause', 'cutscene', 'spellPanel', 'book', 'ending', 'win', 'lose', 'bye'];
function showScreen(id) { SCREENS.forEach((s) => $(s).classList.toggle('hidden', s !== id)); }
function hideScreens() { SCREENS.forEach((s) => $(s).classList.add('hidden')); }
let toastTimer = 0;
function toast(txt, color) { const t = el.toast; t.textContent = txt; t.style.setProperty('--tc', color || '#fff'); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
function flashFx(rgb) { el.flash.style.setProperty('--fc', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'); el.flash.classList.remove('go'); void el.flash.offsetWidth; el.flash.classList.add('go'); }

function buildHUD() {
  el.gc.innerHTML = '';
  GHOSTS.forEach((g, i) => {
    const d = document.createElement('div'); d.className = 'gc'; d.style.setProperty('--c', g.color); d.id = 'gc' + i;
    const cv = mkCanvas(SPR, SPR); cv.getContext('2d').drawImage(ghostCanvas(i, 0, 0, 0), 0, 0);
    d.appendChild(cv);
    d.insertAdjacentHTML('beforeend', '<div class="n" id="gcn' + i + '">0/0</div><div class="l" id="gcl' + i + '"></div>');
    el.gc.appendChild(d);
  });
  $('spellCountImg').src = RUNE_URL[0]; $('bookImg').src = ICON.book; $('helpImg').src = ICON.help; $('pauseImg').src = ICON.pause;
}
function hudGhosts() {
  for (let i = 0; i < 5; i++) {
    $('gcn' + i).textContent = G.cap[i] + '/' + G.req[i];
    $('gcl' + i).textContent = (G.req[i] - G.cap[i]) + ' ' + tr('left');
    $('gc' + i).classList.toggle('done', G.cap[i] >= G.req[i]);
    $('gc' + i).title = GHOSTS[i].name[G.lang];
  }
}
function hudTimer() {
  const t = fmtTime(G.time); if (t !== lastTimerTxt) { el.timer.textContent = t; lastTimerTxt = t; }
  el.timer.classList.toggle('low', G.time < 60);
}
function hudSpells() {
  const n = G.collected.filter(Boolean).length; $('spellCountTxt').textContent = n + '/5';
}
function hudLens() {
  el.lens.classList.toggle('on', G.lens); el.lens.classList.toggle('off', !G.lens); el.lensImg.src = G.lens ? ICON.lensOn : ICON.lensOff;
  el.lensFx.classList.toggle('on', G.lens && G.state !== 'menu');
}
function hudStatic() {
  $('keyhint').textContent = tr('keys');
  el.lens.title = tr('tipLens'); $('btnBook').title = tr('tipBook'); $('btnHelp').title = tr('tipHelp'); $('btnPause').title = tr('tipPause');
}
function hudAll() { hudGhosts(); hudTimer(); hudSpells(); hudLens(); hudStatic(); }
let lastPrompt = '';
function updatePrompt() {
  let p = '';
  const sp = nearSpell();
  if (sp) p = tr('collect');
  else if (G.target) p = G.target.state === 'hidden' ? tr('identify') : tr('shootIt');
  if (p !== lastPrompt) { el.prompt.textContent = p; lastPrompt = p; }
  const anyRev = G.lens && G.ghosts.some((g) => g.state === 'revealed' || g.state === 'capturing');
  el.crosshair.className = (anyRev ? 'plus' : 'dot') + (G.target && G.target.state === 'revealed' ? ' hot' : '');
  if (G.target) el.crosshair.style.setProperty('--xc', GHOSTS[G.target.type].color); else el.crosshair.style.setProperty('--xc', '#ff4a4a');
}
function matrixHTML(sp, small) {
  return '<div class="mx' + (small ? ' sm' : '') + '" style="--c:' + sp.color + '">' + sp.kernel.map((v) => '<div>' + v + '</div>').join('') + '</div>';
}
function applyI18n() {
  document.querySelectorAll('[data-i]').forEach((e) => { e.textContent = tr(e.getAttribute('data-i')); });
  $('langEn').classList.toggle('sel', G.lang === 'en'); $('langAr').classList.toggle('sel', G.lang === 'ar');
  $('vSfxTxt').textContent = Math.round(G.sfxVol * 100); $('vMusTxt').textContent = Math.round(G.musVol * 100);
  hudStatic();
}
function setLang(l) {
  G.lang = l; document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  save(); applyI18n(); hudGhosts(); lastPrompt = '';
  if (G.state === 'book') renderBook();
  if (G.state === 'spellPanel' || !$('spellPanel').classList.contains('hidden')) fillSpellPanel(G.panelSpell);
  if (G.state === 'cutscene') { csText(); }
  if (G.state === 'ending') fillEnding();
  if (G.state === 'win') fillWin();
  if (G.state === 'lose') fillLose();
}

/* ---- pointer lock ---- */
function lockPointer() { try { if (document.pointerLockElement !== view) { const p = view.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } } catch (e) {} }
function releasePointer() { if (document.pointerLockElement) { expectUnlock = true; document.exitPointerLock(); } }
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement) {
    if (expectUnlock) { expectUnlock = false; return; }
    if (G.state === 'playing') openPause();
  }
});
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement === view && G.state === 'playing') P.a += e.movementX * SENS;
});

/* ---- flow ---- */
function startNewRun() { buildWorld(); hudAll(); hudLens(); G.wt = 0; G.endT = 0; G.ambT = 5; lastPrompt = ''; }
function playGame() {
  AU.init(); startNewRun(); hideScreens(); el.hud.classList.remove('hidden');
  startCutscene('new');
}
function beginPlaying() {
  hideScreens(); G.state = 'playing'; G.started = true; el.hud.classList.remove('hidden'); lockPointer();
}
function restartGame() { AU.init(); startNewRun(); hideScreens(); el.hud.classList.remove('hidden'); G.state = 'playing'; lockPointer(); }
function toMenu() { releasePointer(); G.state = 'menu'; el.hud.classList.add('hidden'); G.lens = false; hudLens(); showScreen('menu'); G.t = 0; }
function openPause() { if (G.state !== 'playing') return; G.state = 'pause'; releasePointer(); sfx('ui'); showScreen('pause'); }
function resumeGame() { if (G.state !== 'pause') return; hideScreens(); G.state = 'playing'; lockPointer(); }
function winGame() { startEnding(); }          // all ghosts captured -> lesson first
function showWin() {
  G.state = 'win'; releasePointer(); G.t = 0; el.hud.classList.add('hidden'); el.lensFx.classList.remove('on'); fillWin(); showScreen('win');
}
function fillWin() {
  const tot = G.req.reduce((a, b) => a + b, 0);
  $('winStats').innerHTML = '<div><span>' + tr('sGhosts') + '</span><b>' + G.cap.reduce((a, b) => a + b, 0) + '/' + tot + '</b></div><div><span>' + tr('sTime') + '</span><b>' + fmtTime(G.time) + '</b></div><div><span>' + tr('sSpells') + '</span><b>' + G.collected.filter(Boolean).length + '/5</b></div>';
}
function loseGame(reason) {
  G.state = 'lose'; G.loseReason = reason; releasePointer(); G.t = 0; el.hud.classList.add('hidden'); el.lensFx.classList.remove('on'); sfx('lose'); fillLose(); showScreen('lose');
}
function fillLose() { $('loseReason').textContent = G.loseReason === 'time' ? tr('rTime') : tr('rSpell'); }

/* ---- lens ---- */
function toggleLens() {
  if (G.state !== 'playing') return;
  G.lens = !G.lens; hudLens(); sfx(G.lens ? 'lensOn' : 'lensOff'); toast(G.lens ? tr('lensOn') : tr('lensOff'), G.lens ? '#7fe8ff' : '#aaa');
}

/* ---- spells: collect, panel ---- */
function collectSpell() {
  if (G.state !== 'playing') return;
  const s = nearSpell(); if (!s || G.collected[s.id]) return;
  s.got = true; G.collected[s.id] = true; G.sel = s.id; hudSpells(); sfx('collect');
  burst(s.x, s.y, 0.35, SPELLS[s.id].rgb, 30); flashFx(SPELLS[s.id].rgb); toast(tr('spellGot'), SPELLS[s.id].color);
  G.state = 'spellPanel'; releasePointer(); G.panelSpell = s.id; fillSpellPanel(s.id); showScreen('spellPanel');
}
function fillSpellPanel(i) {
  if (i === undefined) return; const sp = SPELLS[i];
  $('spIcon').src = RUNE_URL[i]; $('spTitle').textContent = sp.name[G.lang]; $('spTitle').style.color = sp.color;
  $('spOp').textContent = sp.op[G.lang] + ' — ' + sp.colorName[G.lang]; $('spFn').textContent = sp.fn[G.lang];
  $('spMatrix').innerHTML = matrixHTML(sp, false);
  $('spNorm').textContent = sp.norm ? tr('normLbl') + ': ' + sp.norm : '';
  $('spBox').style.boxShadow = 'inset 0 0 0 4px ' + sp.color + ',inset 0 0 0 8px #2c1a10,0 0 0 4px ' + sp.color;
}
function closeSpellPanel() { if (G.state !== 'spellPanel') return; hideScreens(); G.state = 'playing'; sfx('ui'); lockPointer(); }

/* ---- spellbook ---- */
function openBook() {
  if (G.state !== 'playing') return;
  G.bookGhost = (G.lens && G.target && G.target.state === 'hidden') ? G.target : null;
  G.state = 'book'; releasePointer(); sfx('book');
  if (!G.collected[G.sel]) { const f = G.collected.indexOf(true); if (f >= 0) G.sel = f; }
  $('bkMsg').textContent = ''; renderBook(); showScreen('book');
}
function closeBook() { if (G.state !== 'book') return; hideScreens(); G.state = 'playing'; G.bookGhost = null; sfx('book'); lockPointer(); }
function renderBook() {
  const lang = G.lang, list = $('bkList'); list.innerHTML = '';
  SPELLS.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'bkRow' + (G.collected[i] ? '' : ' locked') + (G.sel === i ? ' sel' : '');
    row.innerHTML = G.collected[i]
      ? '<img src="' + RUNE_URL[i] + '" alt=""><span class="nm" style="color:' + s.color + '">' + (i + 1) + '. ' + s.name[lang] + '</span><i class="sw" style="background:' + s.color + '"></i>'
      : '<img src="' + ICON.lock + '" alt=""><span class="nm">' + (i + 1) + '. ??? ???</span>';
    row.onclick = () => { G.sel = i; sfx('ui'); $('bkMsg').textContent = ''; renderBook(); };
    list.appendChild(row);
  });
  $('bkHint').textContent = G.bookGhost ? tr('selectHint') : tr('browseHint');
  const sp = SPELLS[G.sel], d = $('bkDetail');
  if (G.collected[G.sel]) {
    d.innerHTML = '<div class="bkTitle" style="color:' + sp.color + '">' + sp.name[lang] + '</div><div class="bkOp">' + sp.op[lang] + '</div>' +
      '<div class="bkDesc">' + sp.desc[lang] + '</div><div class="bkMx">' + matrixHTML(sp, true) + '</div>' +
      (sp.norm ? '<div class="bkNorm">' + tr('normLbl') + ': ' + sp.norm + '</div>' : '<div class="bkNorm">&nbsp;</div>') +
      '<div class="bkColor"><span>' + tr('colorLbl') + ':</span><i style="background:' + sp.color + '"></i><span>' + sp.colorName[lang] + '</span></div>';
  } else d.innerHTML = '<div class="bkLocked"><img src="' + ICON.lock + '" alt="">' + tr('locked') + '<br><br>' + tr('lockedHint') + '</div>';
  const at = $('bkAttempts');
  if (G.bookGhost) { const left = 2 - G.bookGhost.wrong; at.innerHTML = '<span>' + tr('attemptsLbl') + ':</span>' + [0, 1].map((k) => '<img src="' + (k < left ? ICON.skull : ICON.skullOff) + '" alt="">').join(''); } else at.innerHTML = '';
  $('bkCast').style.display = G.bookGhost ? '' : 'none';
  $('bkCast').disabled = !G.collected[G.sel]; $('bkCast').style.opacity = G.collected[G.sel] ? 1 : 0.45;
}
function castSpell() {
  const g = G.bookGhost; if (G.state !== 'book' || !g || !G.collected[G.sel]) return;
  if (G.sel === g.type) {
    g.state = 'revealed'; sfx('correct'); flashFx(SPELLS[G.sel].rgb); burst(g.x, g.y, 0.45, SPELLS[G.sel].rgb, 44);
    closeBook(); toast(tr('identified'), SPELLS[g.type].color);
  } else {
    g.wrong++; sfx('wrong'); $('bkMsg').textContent = tr('wrong'); toast(tr('wrong'), '#ff4a4a');
    if (g.wrong >= 2) { hideScreens(); G.bookGhost = null; loseGame('spells'); }
    else { $('bkMsg').textContent = tr('wrong') + ' ' + (2 - g.wrong) + ' ' + tr('attemptsLeft'); renderBook(); }
  }
}

/* ---- shooting ---- */
function shoot() {
  if (G.state !== 'playing') return;
  G.shotT = 0.12; sfx('shoot');
  const t = G.target;
  if (!G.lens || !t) { sfx('miss'); return; }
  if (t.state === 'revealed') { t.state = 'capturing'; t.ct = 0; t.burst = false; flashFx(GHOSTS[t.type].rgb); }
  else if (t.state === 'hidden') { toast(tr('needReveal'), '#ffb060'); sfx('miss'); }
}

/* ---- cutscene ---- */
const csc = $('csCanvas'), cx = csc.getContext('2d'); cx.imageSmoothingEnabled = false;
const CS = { idx: 0, chars: 0, t: 0 };
const R = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
function D(px0, py0, r, c) { cx.fillStyle = c; for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); cx.fillRect(Math.round(px0 - w), Math.round(py0 + y), w * 2 + 1, 1); } }
function TRI(c0, top, hw, h, c) { cx.fillStyle = c; for (let r = 0; r < h; r++) { const w = r / h * hw; cx.fillRect(Math.round(c0 - w), top + r, Math.round(w * 2), 1); } }
function csSky(t) { for (let y = 0; y < 200; y += 4) { const k = y / 200; R(0, y, 320, 4, 'rgb(' + ((8 + k * 22) | 0) + ',' + ((8 + k * 10) | 0) + ',' + ((26 + k * 30) | 0) + ')'); } for (let i = 0; i < 50; i++) if ((((t * 2 + i * 7) | 0) % 5) !== 0) R(hash(i, 1, 1) * 320, hash(i, 2, 1) * 110, 1, 1, '#cfd8ff'); }
function slide0(t) {
  csSky(t); D(250, 38, 16, '#e9e6c4'); D(244, 34, 3, '#cfcba5'); D(256, 44, 4, '#d6d2ae');
  R(0, 160, 320, 40, '#07050a'); R(70, 100, 180, 62, '#0d0814'); R(60, 80, 34, 82, '#0b0611'); R(226, 70, 34, 92, '#0b0611');
  TRI(77, 60, 24, 22, '#120a1c'); TRI(243, 50, 24, 22, '#120a1c'); TRI(160, 72, 100, 28, '#120a1c');
  [[80, 90], [80, 112], [232, 82], [232, 106], [110, 112], [130, 112], [190, 112], [210, 112], [110, 134], [210, 134]].forEach((w, i) => { const lit = hash(i, (t * 1.5) | 0, 9) > 0.3; R(w[0], w[1], 8, 10, lit ? '#e8b84a' : '#1a1020'); if (lit) R(w[0] + 3, w[1], 1, 10, '#6a4a14'); });
  R(150, 130, 20, 32, '#1a0e08'); R(152, 128, 16, 3, '#1a0e08');
  for (let x = 0; x < 320; x += 8) R(x, 150, 2, 14, '#05030a'); R(0, 154, 320, 2, '#05030a');
  R(20, 108, 4, 52, '#05030a'); R(12, 112, 10, 2, '#05030a'); R(24, 120, 12, 2, '#05030a'); R(14, 126, 8, 2, '#05030a'); R(280, 118, 4, 44, '#05030a'); R(284, 124, 12, 2, '#05030a'); R(270, 130, 12, 2, '#05030a');
  cx.globalAlpha = 0.14; for (let i = 0; i < 4; i++) R(((t * 10 + i * 90) % 400) - 60, 148 + i * 5, 130, 6, '#8890b0'); cx.globalAlpha = 1;
}
function slide1(t) {
  R(0, 0, 320, 200, '#0a0612'); for (let i = 0; i < 30; i++) R(hash(i, 3, 2) * 320, hash(i, 4, 2) * 200, 2, 2, '#241838');
  for (let i = 0; i < 40; i++) R(208 + i * 0.9 - 4, 148 + i * 0.9 - 4, 9, 9, '#5a3410');
  D(160, 100, 68, '#6b4a1a'); D(160, 100, 62, '#c9972e'); D(160, 100, 56, '#102a44'); D(160, 100, 48, '#143a5e'); D(160, 100, 34, '#1a4c7a');
  const gx = 160 + Math.sin(t * 1.3) * 14; cx.globalAlpha = 0.4; R(gx - 9, 76, 18, 8, '#b8d8ff'); R(gx - 12, 84, 24, 24, '#b8d8ff'); R(gx - 8, 108, 16, 14, '#b8d8ff'); cx.globalAlpha = 1;
  R(gx - 5, 88, 3, 4, '#1e50ff'); R(gx + 3, 88, 3, 4, '#1e50ff');
  R(120, 66, 20, 4, '#9fd8ff'); R(116, 72, 4, 12, '#9fd8ff'); R(124, 62, 8, 3, '#6fb8e8');
}
function slide2(t) {
  R(0, 0, 320, 200, '#0a0612'); const ctr = [160, 100];
  const c = ghostCanvas(0, 0, ((t * 4) | 0) & 3, 0); cx.globalAlpha = 0.5; cx.drawImage(c, ctr[0] - 48, ctr[1] - 52, 96, 96); cx.globalAlpha = 1;
  for (let i = 0; i < 5; i++) { const a = t * 0.5 + i * TAU / 5, x = ctr[0] + Math.cos(a) * 78, y = ctr[1] + Math.sin(a) * 66; D(x, y, 20, 'rgba(' + SPELLS[i].rgb.join(',') + ',0.2)'); cx.drawImage(drawRuneCached(i), x - 24, y - 24, 48, 48); }
}
const runeCache = {}; function drawRuneCached(i) { return runeCache[i] || (runeCache[i] = drawRune(i)); }
function slide3(t) {
  R(0, 0, 320, 200, '#120a08'); R(30, 26, 260, 140, '#1c0f08'); R(36, 32, 120, 128, '#d9bd88'); R(164, 32, 120, 128, '#d9bd88'); R(156, 32, 8, 128, '#5a3a1a');
  R(36, 32, 120, 3, '#b8975e'); R(164, 32, 120, 3, '#b8975e');
  for (let i = 0; i < 5; i++) { cx.drawImage(drawRuneCached(i), 46, 42 + i * 22, 20, 20); R(72, 48 + i * 22, 60, 3, '#6a4a2a'); R(72, 54 + i * 22, 40, 2, '#9a7a4a'); }
  const k = SPELLS[(t | 0) % 5].kernel, col = SPELLS[(t | 0) % 5].color;
  for (let i = 0; i < 9; i++) { const x = 190 + (i % 3) * 28, y = 56 + ((i / 3) | 0) * 28; R(x, y, 24, 24, '#241522'); R(x, y, 24, 2, col); R(x, y + 22, 24, 2, col); R(x, y, 2, 24, col); R(x + 22, y, 2, 24, col); cx.fillStyle = '#fff'; cx.font = '10px monospace'; cx.textAlign = 'center'; cx.fillText(String(k[i]), x + 12, y + 16); }
  R(190, 44, 80, 4, col); R(190, 148, 80, 3, '#6a4a2a');
}
function slide4(t) {
  R(0, 0, 320, 200, '#0a0612'); for (let i = 0; i < 30; i++) R(hash(i, 7, 2) * 320, hash(i, 8, 2) * 200, 2, 2, '#20142e');
  for (let i = 0; i < 5; i++) { const x = 14 + i * 60, y = 70 + Math.sin(t * 2 + i) * 6; cx.drawImage(ghostCanvas(i, 0, ((t * 5 + i) | 0) & 3, 0), x, y, 56, 56); R(x + 10, 142, 36, 3, GHOSTS[i].color); R(x + 18, 148, 20, 3, GHOSTS[i].color); }
  cx.drawImage(drawRuneCached(0), 6, 6, 32, 32);
}
function slide5(t) {
  R(0, 0, 320, 200, '#14060a'); const pulse = 0.5 + 0.5 * Math.sin(t * 3);
  D(160, 96, 66, 'rgb(' + ((60 + pulse * 60) | 0) + ',10,16)'); D(160, 96, 60, '#d8c89a'); D(160, 96, 54, '#f0e4c0');
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12 - Math.PI / 2; R(160 + Math.cos(a) * 46 - 1, 96 + Math.sin(a) * 46 - 1, 3, 3, '#2a1a10'); }
  const ma = -Math.PI / 2 - 0.25 + Math.sin(t * 0.4) * 0.05, ha = -Math.PI / 2 - 0.1;
  for (let k = 0; k < 40; k++) { R(160 + Math.cos(ma) * k, 96 + Math.sin(ma) * k - 1, 3, 3, '#1a1010'); if (k < 28) R(160 + Math.cos(ha) * k, 96 + Math.sin(ha) * k - 1, 4, 4, '#a01010'); }
  D(160, 96, 3, '#a01010');
  [[8, 70], [250, 80]].forEach(([x, y], i) => { cx.globalAlpha = 0.7; cx.drawImage(ghostCanvas(i * 3 + 1, 1, ((t * 4) | 0) & 3, 0), x, y + Math.sin(t * 2 + i) * 5, 64, 64); cx.globalAlpha = 1; });
}
const SLIDES = [slide0, slide1, slide2, slide3, slide4, slide5];
function csText() {
  const full = tr('cs')[CS.idx] || ''; $('csText').textContent = full.slice(0, Math.floor(CS.chars));
  $('csDots').textContent = SLIDES.map((_, i) => (i === CS.idx ? '■' : '□')).join(' ');
}
function startCutscene(mode) {
  G.csMode = mode; G.state = 'cutscene'; CS.idx = 0; CS.chars = 0; CS.t = 0; releasePointer(); showScreen('cutscene'); csText();
}
function csAdvance() {
  const full = tr('cs')[CS.idx] || '';
  if (CS.chars < full.length) { CS.chars = full.length; csText(); return; }
  if (CS.idx >= SLIDES.length - 1) { endCutscene(); return; }
  CS.idx++; CS.chars = 0; sfx('ui'); csText();
}
function endCutscene() { if (G.state !== 'cutscene') return; hideScreens(); sfx('ui'); beginPlaying(); }
function updateCutscene(dt) {
  CS.t += dt; const full = tr('cs')[CS.idx] || '';
  if (CS.chars < full.length) { CS.chars += dt * 42; csText(); }
  cx.globalAlpha = 1; cx.textAlign = 'start'; SLIDES[CS.idx](CS.t);
}

/* ============================ 12. INPUT & LOOP ======================== */
function bind(id, fn) { $(id).addEventListener('click', (e) => { AU.init(); sfx('ui'); fn(e); e.currentTarget.blur(); }); }
bind('mPlay', playGame);
bind('mOptions', () => { G.backTo = 'menu'; showScreen('options'); });
bind('mLanguage', () => { G.backTo = 'menu'; showScreen('language'); });
bind('mExit', () => { try { window.close(); } catch (e) {} showScreen('bye'); });
bind('byeBack', () => showScreen('menu'));
bind('optBack', () => showScreen(G.backTo));
bind('langBack', () => showScreen(G.backTo));
bind('langEn', () => setLang('en'));
bind('langAr', () => setLang('ar'));
bind('pResume', resumeGame);
bind('pRestart', restartGame);
bind('pOptions', () => { G.backTo = 'pause'; showScreen('options'); });
bind('pLanguage', () => { G.backTo = 'pause'; showScreen('language'); });
bind('pExit', toMenu);
bind('winAgain', restartGame); bind('winMenu', toMenu); bind('loseAgain', restartGame); bind('loseMenu', toMenu);
bind('spCont', closeSpellPanel);
bind('bkClose', closeBook);
bind('bkCast', castSpell);
bind('btnLens', toggleLens);
bind('btnBook', () => { if (G.state === 'playing') openBook(); else if (G.state === 'book') closeBook(); });
bind('btnPause', openPause);
bind('btnHelp', () => { if (G.state === 'playing') startCutscene('help'); });
$('cutscene').addEventListener('click', () => { AU.init(); csAdvance(); });
$('volSfx').addEventListener('input', (e) => { G.sfxVol = e.target.value / 100; AU.vol.sfx = G.sfxVol; AU.setVol(); $('vSfxTxt').textContent = e.target.value; save(); });
$('volSfx').addEventListener('change', () => sfx('ui'));
$('volMus').addEventListener('input', (e) => { G.musVol = e.target.value / 100; AU.vol.mus = G.musVol; AU.setVol(); $('vMusTxt').textContent = e.target.value; save(); });

view.addEventListener('mousedown', (e) => {
  AU.init(); if (e.button !== 0 || G.state !== 'playing') return;
  if (document.pointerLockElement !== view) { lockPointer(); return; }
  shoot();
});
window.addEventListener('keydown', (e) => {
  AU.init(); const c = e.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(c)) e.preventDefault();
  if (e.repeat && c !== 'KeyW' && c !== 'KeyA' && c !== 'KeyS' && c !== 'KeyD') return;
  keys[c] = true;
  switch (G.state) {
    case 'cutscene':
      if (c === 'Enter' || c === 'NumpadEnter') endCutscene(); else if (c === 'Space') csAdvance(); break;
    case 'playing':
      if (c === 'KeyF') collectSpell();
      else if (c === 'KeyL') toggleLens();
      else if (c === 'KeyB') openBook();
      else if (c === 'Escape') openPause();
      else if (c === 'Space') shoot();
      else if (c === 'Tab') releasePointer();
      break;
    case 'book':
      if (c === 'KeyB' || c === 'Escape') closeBook();
      else if (c === 'Enter' || c === 'NumpadEnter') castSpell();
      else if (/^Digit[1-5]$/.test(c)) { G.sel = +c.slice(5) - 1; $('bkMsg').textContent = ''; renderBook(); sfx('ui'); }
      break;
    case 'spellPanel':
      if (c === 'Enter' || c === 'Space' || c === 'Escape' || c === 'KeyF') closeSpellPanel(); break;
    case 'ending':
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space' || c === 'ArrowRight') { sfx('ui'); enGo(1); }
      else if (c === 'ArrowLeft') { sfx('ui'); enGo(-1); }
      else if (c === 'Escape') finishEnding();
      break;
    case 'pause':
      if (c === 'Escape') { if (!$('options').classList.contains('hidden') || !$('language').classList.contains('hidden')) showScreen('pause'); else resumeGame(); } break;
    case 'menu':
      if (c === 'Escape') { if (!$('menu').classList.contains('hidden')) {} else showScreen('menu'); } break;
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (G.state === 'playing') openPause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'playing') openPause(); });
window.addEventListener('contextmenu', (e) => e.preventDefault());

/* ---- ENDING: the lesson (one filter at a time) ---- */
Object.assign(L.en, {
  enTag: 'THE LESSON', enBefore: 'BEFORE', enAfter: 'AFTER', enSkip: 'SKIP', enNextBtn: 'NEXT', enFinish: 'FINISH',
  enIntroTitle: 'WHAT IS A CONVOLUTION?', enIntro1L: 'THE IDEA', enIntro2L: 'YOUR FIVE SPELLS',
  enIntro1: 'A convolution slides a small grid of numbers, the kernel, over every pixel of an image. At each pixel, the neighbors are multiplied by the kernel weights and added up. The sum becomes the new pixel.',
  enIntro2: 'Every spell you collected is a different kernel with a different effect. Let us see what each one did to its ghost.',
  enL1: 'WHAT THE FILTER DOES', enL2: 'WHAT IT DID TO THE GHOST',
  enPasses: 'Applied 3 times so the effect is visible'
});
Object.assign(L.ar, {
  enTag: 'الدرس', enBefore: 'قبل', enAfter: 'بعد', enSkip: 'تخطي', enNextBtn: 'التالي', enFinish: 'إنهاء',
  enIntroTitle: 'ما هو الالتفاف؟', enIntro1L: 'الفكرة', enIntro2L: 'تعاويذك الخمس',
  enIntro1: 'الالتفاف هو تمرير شبكة صغيرة من الأعداد، تُسمّى النواة، فوق كل بكسل في الصورة. عند كل بكسل تُضرب البكسلات المجاورة في أوزان النواة ثم تُجمع النتائج، ويصبح المجموع قيمة البكسل الجديد.',
  enIntro2: 'كل تعويذة جمعتها هي نواة مختلفة ولها تأثير مختلف. لنرَ ماذا فعلت كل تعويذة بشبحها.',
  enL1: 'ماذا يفعل المرشح', enL2: 'ماذا فعل بالشبح',
  enPasses: 'طُبّقت 3 مرات ليظهر الأثر'
});
const LESSON = [
  { does: { en: 'Every pixel becomes a weighted average of its neighbors, and the center counts the most. The weights add up to 16, so we divide by 16 to keep the brightness.',
            ar: 'يصبح كل بكسل متوسطًا مرجّحًا لجيرانه، ويحظى المركز بأكبر وزن. مجموع الأوزان 16، لذلك نقسم على 16 للحفاظ على السطوع.' },
    effect: { en: 'The Wandering Wraith melts into a soft, hazy glow. Sharp edges and fine details disappear.',
              ar: 'يذوب الشبح الهائم ويتحول إلى توهج ناعم ضبابي، وتختفي الحواف الحادة والتفاصيل الدقيقة.' } },
  { does: { en: 'The center is boosted (5) and the four direct neighbors are subtracted (-1 each). Wherever a pixel differs from its neighbors, that difference is exaggerated.',
            ar: 'يُضخَّم المركز (5) وتُطرح البكسلات الأربعة المجاورة (-1 لكل منها). فكلما اختلف البكسل عن جيرانه تضخّم هذا الفرق.' },
    effect: { en: 'The Crimson Reaper becomes crisper: its edges and glowing eyes stand out with more contrast.',
              ar: 'يصبح الحاصد القرمزي أوضح: تبرز حوافه وعيناه المتوهجتان بتباين أكبر.' } },
  { does: { en: 'The center (4) minus its four neighbors. In flat areas the sum is 0 (black). Where brightness changes suddenly, the result is large.',
            ar: 'المركز (4) مطروحًا منه البكسلات الأربعة المجاورة. في المناطق المتجانسة يكون المجموع 0 (أسود)، وعند أي تغيّر مفاجئ في السطوع تكون النتيجة كبيرة.' },
    effect: { en: 'The Hollow Watcher\'s body vanishes. Only the glowing outline of its shape remains.',
              ar: 'يختفي جسد المراقب الأجوف ولا يبقى إلا محيط شكله المتوهج.' } },
  { does: { en: 'The weights are negative on one diagonal and positive on the opposite one, so the result measures brightness change in one direction. A constant is added so flat areas look mid-gray.',
            ar: 'الأوزان سالبة على قطر وموجبة على القطر المقابل، فتقيس النتيجة تغيّر السطوع في اتجاه واحد. وتُضاف قيمة ثابتة كي تظهر المناطق المتجانسة رمادية.' },
    effect: { en: 'The Engraved Phantom looks carved out of stone, as if lit from one side.',
              ar: 'يبدو الشبح المنقوش وكأنه محفور في الحجر ومضاء من جهة واحدة.' } },
  { does: { en: 'Only one column of weights is non-zero, so each pixel is averaged with its neighbors along a single direction (divided by 3).',
            ar: 'عمود واحد فقط من الأوزان غير صفري، فيُحسب متوسط كل بكسل مع جيرانه في اتجاه واحد (القسمة على 3).' },
    effect: { en: 'The Phantom Drifter smears into a streak, as if it were racing past.',
              ar: 'يتمدد الشبح الجوّال على شكل أثر كأنه يندفع بسرعة.' } }
];
const EN = { idx: 0, pos: -40, img: {} };
const enB = $('enB'), enA = $('enA'), ebx = enB.getContext('2d'), eax = enA.getContext('2d');
ebx.imageSmoothingEnabled = false; eax.imageSmoothingEnabled = false;
const EN_BG = 'rgb(14,8,22)';

// builds "before" (true ghost sprite) and "after" (real convolution of it with the spell kernel)
function lessonImgs(i) {
  if (EN.img[i]) return EN.img[i];
  const before = mkCanvas(SPR, SPR), bx = before.getContext('2d');
  bx.fillStyle = EN_BG; bx.fillRect(0, 0, SPR, SPR); bx.drawImage(ghostCanvas(i, 0, 0, 0), 0, 0);
  const sp = SPELLS[i], k = sp.kernel, div = sp.norm ? +sp.norm.split('/')[1] : 1;
  const passes = i === 4 ? 3 : 1, bias = i === 3 ? 100 : 0;
  let cur = bx.getImageData(0, 0, SPR, SPR).data;
  for (let p = 0; p < passes; p++) {
    const out = new Uint8ClampedArray(cur.length), last = p === passes - 1;
    for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
      const o = (y * SPR + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let s = 0;
        for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++)
          s += k[(ky + 1) * 3 + kx + 1] * cur[(clamp(y + ky, 0, SPR - 1) * SPR + clamp(x + kx, 0, SPR - 1)) * 4 + ch];
        s /= div;
        if (last) { if (i === 2) s = Math.abs(s) * 1.2; s += bias; }
        out[o + ch] = s;
      }
      out[o + 3] = 255;
    }
    cur = out;
  }
  const after = mkCanvas(SPR, SPR); after.getContext('2d').putImageData(new ImageData(cur, SPR, SPR), 0, 0);
  return (EN.img[i] = { before, after });
}
function startEnding() {
  G.state = 'ending'; releasePointer(); G.t = 0; el.hud.classList.add('hidden'); el.lensFx.classList.remove('on');
  EN.idx = 0; EN.pos = -40; sfx('win'); fillEnding(); showScreen('ending');
}
function finishEnding() { if (G.state === 'ending') showWin(); }
function enGo(d) {
  if (G.state !== 'ending') return;
  const n = EN.idx + d; if (n < 0) return;
  if (n > 5) { finishEnding(); return; }
  EN.idx = n; EN.pos = -40; fillEnding();
}
function fillEnding() {
  const i = EN.idx, lang = G.lang, intro = i === 0, gi = intro ? 0 : i - 1, sp = SPELLS[gi];
  const col = intro ? '#f0a030' : sp.color;
  $('enCount').textContent = (i + 1) + ' / 6';
  $('enPrev').style.visibility = intro ? 'hidden' : 'visible';
  $('enNext').textContent = tr(i === 5 ? 'enFinish' : 'enNextBtn');
  $('enTag').textContent = tr('enTag');
  enB.style.setProperty('--c', GHOSTS[gi].color); enA.style.setProperty('--c', col);
  $('enPanel').style.boxShadow = 'inset 0 0 0 4px ' + col + ',inset 0 0 0 8px #2c1a10,0 0 0 4px ' + col;
  const g = $('enGhost'); g.textContent = GHOSTS[gi].name[lang]; g.style.color = GHOSTS[gi].color;
  const t = $('enTitle'), op = $('enOp'), note = $('enMxNote');
  t.style.color = col; op.style.color = col;
  if (intro) {
    t.textContent = tr('enIntroTitle'); op.textContent = '?';
    $('enMx').innerHTML = '<div class="mx" style="--c:' + col + '">' + ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((v) => '<div>' + v + '</div>').join('') + '</div>';
    note.textContent = '';
    $('enL1').textContent = tr('enIntro1L'); $('enT1').textContent = tr('enIntro1');
    $('enL2').textContent = tr('enIntro2L'); $('enT2').textContent = tr('enIntro2');
  } else {
    t.textContent = sp.name[lang]; op.textContent = sp.op[lang];
    $('enMx').innerHTML = matrixHTML(sp, false);
    note.textContent = (sp.norm ? tr('normLbl') + ': ' + sp.norm : '') + (gi === 4 ? '\n' + tr('enPasses') : '');
    note.style.whiteSpace = 'pre-line';
    $('enL1').textContent = tr('enL1'); $('enT1').textContent = LESSON[gi].does[lang];
    $('enL2').textContent = tr('enL2'); $('enT2').textContent = LESSON[gi].effect[lang];
  }
}
function updateEnding(dt) {
  const i = EN.idx, gi = i === 0 ? 0 : i - 1, col = i === 0 ? '#f0a030' : SPELLS[gi].color;
  EN.pos += dt * (i === 0 ? 260 : 300);
  if (i === 0 && EN.pos >= 1100) EN.pos = -40;       // intro loops the scan
  const im = lessonImgs(gi), done = EN.pos >= 1024, scanning = EN.pos >= 0 && !done;
  const pos = clamp(EN.pos | 0, 0, 1023), x = pos % SPR, y = (pos / SPR) | 0;
  // before: true ghost + sliding 3x3 kernel window
  ebx.clearRect(0, 0, 96, 96); ebx.drawImage(im.before, 0, 0, 96, 96);
  if (scanning) {
    const l = (x - 1) * 3, tp = (y - 1) * 3; ebx.fillStyle = col;
    ebx.fillRect(l, tp, 9, 2); ebx.fillRect(l, tp + 7, 9, 2); ebx.fillRect(l, tp, 2, 9); ebx.fillRect(l + 7, tp, 2, 9);
  }
  // after: result revealed as the window moves
  eax.fillStyle = EN_BG; eax.fillRect(0, 0, 96, 96);
  if (i === 0) {
    eax.globalAlpha = 0.55 + 0.45 * Math.sin(G.t * 4); eax.fillStyle = col;
    eax.font = '44px "Press Start 2P", monospace'; eax.textAlign = 'center'; eax.fillText('?', 48, 64); eax.globalAlpha = 1;
  } else if (done) {
    eax.drawImage(im.after, 0, 0, 96, 96);
  } else if (scanning) {
    if (y > 0) eax.drawImage(im.after, 0, 0, SPR, y, 0, 0, 96, y * 3);
    eax.drawImage(im.after, 0, y, x + 1, 1, 0, y * 3, (x + 1) * 3, 3);
    eax.fillStyle = col; eax.fillRect(x * 3, y * 3, 3, 1); eax.fillRect(x * 3, y * 3 + 2, 3, 1);
  }
}
bind('enNext', () => enGo(1));
bind('enPrev', () => enGo(-1));
bind('enSkip', finishEnding);

const stage = $('stage');
function fit() {
  const k = Math.min(window.innerWidth / 960, window.innerHeight / 600);
  stage.style.transform = 'scale(' + k + ')';
  stage.style.left = Math.round((window.innerWidth - 960 * k) / 2) + 'px'; stage.style.top = Math.round((window.innerHeight - 600 * k) / 2) + 'px';
}
window.addEventListener('resize', fit);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.state === 'cutscene') { G.t += dt; updateCutscene(dt); }
  else {
    update(dt);
    if (G.shotT > 0) G.shotT -= dt;
    if (G.state === 'ending') updateEnding(dt);
    render();
    if (G.state === 'playing') el.clickHint.textContent = document.pointerLockElement === view ? '' : tr('clickHint');
    else el.clickHint.textContent = '';
    el.crosshair.classList.toggle('off', G.state !== 'playing');
  }
  requestAnimationFrame(frame);
}

/* ---- boot ---- */
function boot() {
  load(); AU.vol.sfx = G.sfxVol; AU.vol.mus = G.musVol;
  buildIcons(); buildRunes(); buildProps(); buildHUD();
  $('volSfx').value = Math.round(G.sfxVol * 100); $('volMus').value = Math.round(G.musVol * 100);
  document.documentElement.lang = G.lang; document.documentElement.dir = G.lang === 'ar' ? 'rtl' : 'ltr';
  applyI18n(); buildWorld(); hudAll(); fit();
  showScreen('menu'); el.crosshair.classList.add('off');
  requestAnimationFrame(frame);
}
boot();

})();