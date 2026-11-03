'use strict';

function bind(id, fn) { $(id).addEventListener('click', (e) => { AU.init(); sfx('ui'); fn(e); e.currentTarget.blur(); }); }

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
    eax.font = '44px "PixelAE", sans-serif'; eax.textAlign = 'center'; eax.fillText('?', 48, 64); eax.globalAlpha = 1;
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
