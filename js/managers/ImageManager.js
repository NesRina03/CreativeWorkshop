'use strict';

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

