'use strict';

/* ============================ 12. INPUT & LOOP ======================== */
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
bind('btnMap', toggleMap);
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
      else if (c === 'KeyM' || e.key.toLowerCase() === 'm') toggleMap();
      else if (c === 'KeyH') startCutscene('help');
      else if (c === 'Escape') openPause();
      else if (c === 'Space') shoot();
      else if (c === 'Tab') releasePointer();
      break;
    case 'book':
      if (c === 'KeyB' || c === 'Escape') closeBook();
      else if (c === 'Enter' || c === 'NumpadEnter') castSpell();
      else if (c === 'ArrowUp') selectBookSpell((G.sel + SPELLS.length - 1) % SPELLS.length);
      else if (c === 'ArrowDown') selectBookSpell((G.sel + 1) % SPELLS.length);
      else if (/^Digit[1-5]$/.test(c)) selectBookSpell(+c.slice(5) - 1);
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
    if (!el.hud.classList.contains('hidden')) drawMinimap();
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