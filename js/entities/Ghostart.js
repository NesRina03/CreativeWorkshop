'use strict';

/* ============================================================================
   GHOST ART: bolder, clearer ghost drawings (big eyes, strong outlines, chunky shapes).
   Loaded after GameUI.js and before anything is drawn: it replaces the drawing functions
   of ghosts.js (GDRAW), moves each ghost's heart to a free spot on its chest,
   and makes the Red-Hooded Ghost less blurry while hidden so its true form comes out crisp.
   ============================================================================ */

function gEll(c, cx0, cy0, rx, ry, col) {         // filled ellipse
  c.fillStyle = col;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) c.fillRect(cx0 - w, cy0 + y, w * 2, 1);
  }
}

/* 0 - THE FOGGY GHOST: a friendly round ghost, soft blue, big shiny eyes */
function artWraith(c, f) {
  const ph = f * Math.PI / 2;
  for (let y = 4; y <= 28; y++) {
    const hw = y < 12 ? Math.round(10 * Math.sqrt(Math.max(0, 1 - Math.pow((12 - y) / 8, 2)))) : 10;
    if (hw <= 0) continue;
    const t = (y - 4) / 24, xc = 16 + Math.round(Math.sin(y * 0.35 + ph) * 1.4 * t);
    c.fillStyle = 'rgb(' + ((228 - t * 60) | 0) + ',' + ((243 - t * 45) | 0) + ',255)';
    c.fillRect(xc - hw, y, hw * 2, 1);
    c.fillStyle = '#6f9ae8'; c.fillRect(xc - hw, y, 1, 1); c.fillRect(xc + hw - 1, y, 1, 1);
    if (y === 5) c.fillRect(xc - hw, y, hw * 2, 1);
  }
  for (let x = 5; x <= 27; x++) {                  // wavy hem
    const edge = 25 + Math.round(Math.sin(x * 0.95 + ph) * 2);
    c.clearRect(x, edge + 1, 1, 8);
    c.fillStyle = '#6f9ae8'; c.fillRect(x, edge, 1, 1);
  }
  c.fillStyle = '#16246b';
  if (f === 3) { c.fillRect(10, 13, 4, 1); c.fillRect(18, 13, 4, 1); }               // blink
  else { c.fillRect(10, 11, 4, 5); c.fillRect(18, 11, 4, 5); c.fillStyle = '#ffffff'; c.fillRect(11, 12, 2, 2); c.fillRect(19, 12, 2, 2); }
  c.fillStyle = '#ffb3c6'; c.fillRect(8, 16, 3, 2); c.fillRect(21, 16, 3, 2);
  c.fillStyle = '#16246b'; c.fillRect(14, 17, 4, 2); c.fillStyle = '#ff7a9a'; c.fillRect(15, 18, 2, 1);
  const ab = [0, 1, 0, -1][f];
  gEll(c, 4, 19 + ab, 3, 2, '#d8ebff'); gEll(c, 28, 19 - ab, 3, 2, '#d8ebff');
}

/* 1 - THE RED-HOODED GHOST: crimson hood, dark face with glowing eyes, little scythe */
function artReaper(c, f) {
  for (let y = 14; y <= 29; y++) {
    const hw = Math.min(13, Math.round(6 + (y - 14) * 0.6));
    c.fillStyle = y < 22 ? '#8a1224' : '#5e0b16'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = '#3a0610'; c.fillRect(16 - hw, y, 1, 1); c.fillRect(16 + hw - 1, y, 1, 1);
    if (y >= 28) for (let x = 16 - hw; x < 16 + hw; x++) if (((x + f) & 3) < 2) c.clearRect(x, y, 1, 1);
  }
  for (let y = 2; y <= 15; y++) {
    const hw = Math.min(9, Math.round(2 + (y - 2) * 0.7));
    c.fillStyle = '#c4182f'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = '#ff5a6a'; c.fillRect(16 - hw, y, 2, 1);
    c.fillStyle = '#7a0f1e'; c.fillRect(16 + hw - 2, y, 2, 1);
  }
  gEll(c, 16, 10, 5, 5, '#12040a');
  c.fillStyle = '#ffe066';
  if (f === 3) { c.fillRect(12, 10, 3, 1); c.fillRect(17, 10, 3, 1); }
  else { c.fillRect(12, 9, 3, 3); c.fillRect(17, 9, 3, 3); c.fillStyle = '#ffffff'; c.fillRect(13, 10, 1, 1); c.fillRect(18, 10, 1, 1); }
  c.fillStyle = '#6a0e1c'; c.fillRect(4, 17, 5, 6); c.fillRect(23, 17, 5, 6);
  c.fillStyle = '#7a5a36'; c.fillRect(28, 3, 2, 27);
  c.fillStyle = '#eee8d8'; c.fillRect(21, 3, 8, 2); c.fillRect(20, 5, 3, 2);
  c.fillStyle = '#cfc8b8'; c.fillRect(19, 7, 2, 1);
  c.fillStyle = '#e0d6d0'; c.fillRect(26, 19, 4, 3);
}

/* 2 - THE FOG WATCHER: one giant eye in a tall misty body (the pupil follows you when revealed) */
function artWatcher(c, f, eye) {
  for (let y = 4; y <= 30; y++) {
    const hw = y < 9 ? Math.round(3 + (y - 4) * 1.2) : (y < 22 ? 9 : Math.max(2, Math.round(9 - (y - 22) * 0.8)));
    const a = y > 24 ? Math.max(0.2, 1 - (y - 24) / 8) : 1;
    c.fillStyle = 'rgba(22,48,36,' + a.toFixed(2) + ')'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = 'rgba(70,160,110,' + a.toFixed(2) + ')'; c.fillRect(16 - hw, y, 1, 1); c.fillRect(16 + hw - 1, y, 1, 1);
  }
  c.fillStyle = 'rgba(60,140,100,0.7)';
  for (let i = 0; i < 4; i++) c.fillRect(9 + i * 5 + ((f + i) & 1), 28 + (i & 1), 2, 2);
  gEll(c, 16, 14, 9, 7, '#2f8a5a');
  gEll(c, 16, 14, 8, 6, '#e8fff0');
  gEll(c, 16 + eye * 2, 14, 4, 4, '#1fd860');
  gEll(c, 16 + eye * 2, 14, 2, 3, '#06240f');
  c.fillStyle = '#ffffff'; c.fillRect(16 + eye * 2 - 2, 12, 2, 2);
  if (f === 3) { c.fillStyle = '#16301f'; c.fillRect(7, 8, 18, 6); c.fillStyle = '#46a06e'; c.fillRect(7, 14, 18, 1); }
  c.fillStyle = '#46a06e'; c.fillRect(8, 6, 16, 1);
}

/* 3 - THE CARVED GHOST: an arched stone slab with glowing purple eyes and carved bands */
function artEngraved(c, f) {
  for (let y = 4; y <= 28; y++) {
    const hw = y < 13 ? Math.round(9 * Math.sqrt(Math.max(0, 1 - Math.pow((13 - y) / 9, 2)))) : 9;
    if (hw <= 0) continue;
    c.fillStyle = '#6f6c88'; c.fillRect(16 - hw, y, hw * 2, 1);
    c.fillStyle = '#8f8bb0'; c.fillRect(16 - hw, y, 2, 1);
    c.fillStyle = '#4d4a68'; c.fillRect(16 + hw - 2, y, 2, 1);
  }
  c.fillStyle = '#5b5876'; c.fillRect(3, 15, 5, 10); c.fillRect(24, 15, 5, 10);
  c.fillStyle = '#7d79a0'; c.fillRect(3, 15, 5, 1); c.fillRect(24, 15, 5, 1);
  c.fillStyle = '#1a0c2e'; c.fillRect(10, 8, 5, 5); c.fillRect(17, 8, 5, 5);
  c.fillStyle = (f & 1) ? '#f4d8ff' : '#c070ff'; c.fillRect(11, 9, 3, 3); c.fillRect(18, 9, 3, 3);
  c.fillStyle = '#1a0c2e'; c.fillRect(13, 14, 6, 1); c.fillRect(12, 15, 1, 1); c.fillRect(19, 15, 1, 1);
  c.fillStyle = (f === 1 || f === 3) ? '#c27bff' : '#8a5ad0';                 // glowing carvings
  c.fillRect(9, 17, 14, 1); c.fillRect(9, 26, 14, 1); c.fillRect(9, 20, 1, 3); c.fillRect(22, 20, 1, 3);
  c.fillRect(11, 19, 2, 1); c.fillRect(19, 19, 2, 1);
  c.fillStyle = '#4d4a68'; c.fillRect(12, 6, 1, 2); c.fillRect(21, 22, 2, 1);   // little cracks
  c.fillStyle = '#8a86a8'; c.fillRect(8 + f * 4, 30, 2, 1); c.fillRect(22 - f * 3, 30, 2, 1);
}

/* 4 - THE SPEEDY GHOST: a yellow ball with a pointy tail, speed streaks and happy eyes (facing right) */
function artDrifter(c, f) {
  for (let i = 0; i < 5; i++) {
    const y = 9 + i * 3, len = 6 + ((i + f) % 3) * 4;
    for (let x = 0; x < len; x++) { c.fillStyle = 'rgba(255,226,70,' + (0.15 + 0.5 * (1 - x / len)).toFixed(2) + ')'; c.fillRect(14 - x, y, 1, 2); }
  }
  gEll(c, 21, 15, 9, 8, '#d9b92a');
  gEll(c, 21, 14, 8, 7, '#ffe94a');
  gEll(c, 19, 11, 4, 3, '#fff7b0');
  c.fillStyle = '#ffe94a'; c.fillRect(11, 13, 4, 3); c.fillRect(9, 14, 3, 1);
  c.fillStyle = '#1f1800'; c.fillRect(19, 10, 3, 5); c.fillRect(25, 10, 3, 5);
  c.fillStyle = '#ffffff'; c.fillRect(19, 10, 1, 2); c.fillRect(25, 10, 1, 2);
  c.fillStyle = '#1f1800'; c.fillRect(21, 16, 5, 1); c.fillRect(20, 15, 1, 1); c.fillRect(26, 15, 1, 1);
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(12 + (f % 2) * 2, 24, 3, 2); c.fillRect(17 - (f % 2) * 2, 26, 2, 2);
  if (f & 1) { c.fillStyle = '#ffffff'; c.fillRect(29, 7, 1, 3); c.fillRect(28, 8, 3, 1); }
}

GDRAW[0] = artWraith; GDRAW[1] = artReaper; GDRAW[2] = artWatcher; GDRAW[3] = artEngraved; GDRAW[4] = artDrifter;
HEART[0] = [16, 22]; HEART[1] = [16, 21]; HEART[2] = [16, 24]; HEART[3] = [16, 22]; HEART[4] = [21, 20];
/* the Red-Hooded Ghost is blurred once (not twice) while hidden, so the sharpening spell brings back a crisp picture */
DEGRADE[1] = (d) => filterRGBA(d, SPR, SPR, KERN[0].k, KERN[0].div);