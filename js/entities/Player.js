'use strict';

const P = { x: 2.5, y: 8.5, a: 0 };
const cam = { x: 2.5, y: 8.5, a: 0, dx: 1, dy: 0 };
const keys = {};
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
