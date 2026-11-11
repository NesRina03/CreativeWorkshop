'use strict';

/* ============================================================================
   LEVELS: EASY / MEDIUM / HARD.
   What changes from level to level:
     - how many ghosts, how much time, how fast the ghosts move
     - how many wrong spells you are allowed on one ghost
     - bonus time for each capture
     - in the casting scene: pieces stay still (easy), drift slowly (medium) or race around (hard)
     - HARD only: grey "fake dust" hides among the real pieces; putting it in the heart costs time
     - EASY only: the spellbook gives a glowing hint on the right spell
   Loaded after GameUI.js. It replaces buildWorld / pickTarget / onCaptured / playGame.
   ============================================================================ */

const LEVELS = [
  { id: 0, color: '#7dffa0', name: { en: 'EASY', ar: 'سهل' },
    desc: { en: 'Few ghosts · slow ghosts · lots of time · the spellbook gives hints', ar: 'أشباح قليلة وبطيئة · وقت كثير · كتاب التعاويذ يعطيك تلميحات' },
    perType: () => 1, timeBase: 120, timePer: 60, speed: 0.8, drift: 0, decoys: 0, penalty: 0, maxWrong: 3, bonus: 15, hint: true },
  { id: 1, color: '#ffd92e', name: { en: 'MEDIUM', ar: 'متوسط' },
    desc: { en: 'More ghosts · magic pieces drift away · bonus time for every catch', ar: 'أشباح أكثر · قطع السحر تتحرك · وقت إضافي مع كل أسر' },
    perType: () => 1 + ((rnd() * 2) | 0), timeBase: 100, timePer: 48, speed: 1, drift: 1, decoys: 0, penalty: 0, maxWrong: 2, bonus: 10, hint: false },
  { id: 2, color: '#ff4a4a', name: { en: 'HARD', ar: 'صعب' },
    desc: { en: 'Many fast ghosts · racing pieces · fake dust to avoid · less time', ar: 'أشباح كثيرة وسريعة · قطع سريعة · غبار مزيف يجب تجنبه · وقت أقل' },
    perType: () => 2, timeBase: 90, timePer: 38, speed: 1.35, drift: 2, decoys: 3, penalty: 8, maxWrong: 2, bonus: 6, hint: false }
];
G.level = 0; G.maxWrong = 2; G.introSeen = false; G.wrongTotal = 0;
SCREENS.push('levels');

/* ---- best stars per level (saved in the browser) ---- */
function lvBest(i) { try { const o = JSON.parse(localStorage.getItem('hh5c_stars') || '{}'); return o[i] | 0; } catch (e) { return 0; } }
function lvSave(i, s) {
  try { const o = JSON.parse(localStorage.getItem('hh5c_stars') || '{}'); if ((o[i] | 0) < s) { o[i] = s; localStorage.setItem('hh5c_stars', JSON.stringify(o)); } } catch (e) {}
}

/* ---- level select screen ---- */
function fillLevels() {
  const box = $('lvList'); box.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button'); b.className = 'btn lvBtn'; b.style.setProperty('--lc', lv.color);
    const st = lvBest(i);
    b.innerHTML = '<span class="lvName">' + lv.name[G.lang] + '</span><span class="lvDesc">' + lv.desc[G.lang] + '</span><span class="lvStars">' +
      [0, 1, 2].map((k) => '<img alt="" src="' + starURL(k < st) + '">').join('') + '</span>';
    b.onclick = () => { AU.init(); sfx('ui'); startLevel(i); };
    box.appendChild(b);
  });
}
function openLevels() { G.state = 'menu'; hideScreens(); fillLevels(); showScreen('levels'); }
function playGame() { AU.init(); openLevels(); }                 // the PLAY button now opens the level select
function startLevel(i) {
  G.level = i; AU.init(); startNewRun(); hideScreens(); el.hud.classList.remove('hidden');
  if (!G.introSeen) { G.introSeen = true; startCutscene('new'); }  // story + guide + practice, only the first time
  else { beginPlaying(); toast(LEVELS[i].name[G.lang], LEVELS[i].color); }
}
bind('lvBack', () => showScreen('menu'));
bind('winNext', () => startLevel(Math.min(2, (G.level | 0) + 1)));

/* ---- the world, built for the chosen level ---- */
function buildWorld() {
  const lv = LEVELS[G.level | 0];
  G.req = [0, 0, 0, 0, 0].map(() => lv.perType());
  G.cap = [0, 0, 0, 0, 0];
  const total = G.req.reduce((a, b) => a + b, 0);
  G.timeMax = lv.timeBase + lv.timePer * total; G.time = G.timeMax; G.maxWrong = lv.maxWrong;
  G.collected = [false, false, false, false, false]; G.sel = 0; G.lens = false; G.target = null; G.bookGhost = null;
  const spots = shuffle(SPELL_SPOTS.slice());
  G.spellsW = SPELLS.map((s, i) => ({ id: i, x: spots[i][0], y: spots[i][1], got: false, ph: rnd() * TAU }));
  const cand = [];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (MAP[y * MW + x]) continue;
    const cx0 = x + 0.5, cy0 = y + 0.5;
    if (Math.hypot(cx0 - 2.5, cy0 - 8.5) < 5) continue;
    if (PROPS.some((p) => Math.hypot(p.x - cx0, p.y - cy0) < 0.9)) continue;
    if (G.spellsW.some((s) => Math.hypot(s.x - cx0, s.y - cy0) < 1.2)) continue;
    cand.push([cx0, cy0]);
  }
  shuffle(cand);
  G.ghosts = []; const placed = [];
  for (let type = 0; type < 5; type++) for (let n = 0; n < G.req[type]; n++) {
    let pos = null;
    for (let k = 0; k < cand.length; k++) { const c = cand[k]; if (placed.every((p) => Math.hypot(p[0] - c[0], p[1] - c[1]) > 2.4)) { pos = c; cand.splice(k, 1); break; } }
    if (!pos) pos = cand.pop();
    placed.push(pos);
    G.ghosts.push({ type, x: pos[0], y: pos[1], hx: pos[0], hy: pos[1], tx: pos[0], ty: pos[1], spd: GPAR[type].speed * lv.speed, wait: rnd() * 2, state: 'hidden', wrong: 0, ph: rnd() * TAU, ct: 0, seen: false, vis: false, sr: null });
  }
  parts.length = 0;
  P.x = 2.5; P.y = 8.5; P.a = 0;
}

/* ---- ghosts move faster on harder levels ---- */
function pickTarget(g) {
  const p = GPAR[g.type], m = LEVELS[G.level | 0].speed;
  for (let n = 0; n < 8; n++) {
    const a = rnd() * TAU, r = p.dart && rnd() < 0.5 ? 1 + rnd() * 1.2 : 0.4 + rnd() * p.rad;
    const tx = g.hx + Math.cos(a) * r, ty = g.hy + Math.sin(a) * r;
    if (canMoveG(tx, ty, 0.2) && canMoveG((tx + g.x) / 2, (ty + g.y) / 2, 0.2)) { g.tx = tx; g.ty = ty; g.spd = (p.dart && rnd() < 0.45 ? 4.6 : p.speed) * m; return; }
  }
  g.tx = g.x; g.ty = g.y;
}

/* ---- capturing a ghost gives bonus time ---- */
function onCaptured(g) {
  const lv = LEVELS[G.level | 0];
  G.cap[g.type]++; hudGhosts();
  G.time += lv.bonus;
  toast(tr('captured') + '  +' + lv.bonus + 's', GHOSTS[g.type].color); sfx('capture');
  if (G.cap.every((c, i) => c >= G.req[i])) { G.endT = 0.7; }
}