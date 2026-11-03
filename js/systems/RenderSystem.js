'use strict';

const view = $('view'), vctx = view.getContext('2d');
vctx.imageSmoothingEnabled = false;
const img = vctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer), zbuf = new Float32Array(W);
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
/* sliding 3x3 window over the REAL convolution frames: scanned pixels show the next frame, the rest the previous one */
const SCAN_BUF = new Uint32Array(SPR * SPR);
function scanSpr(g, fr, eye) {
  const N = SPR * SPR, F = revFrames(g.type, fr, eye), wrong = g.state === 'wrongcast';
  let A, B, k;
  if (wrong) { A = F.s[0]; B = wrongSpr(g.type, g.wj, fr, eye); k = g.rt / WRONG_SCAN; }
  else { const n = F.s.length - 1, kk = clamp(g.rt / REVEAL_T, 0, 0.9999) * n, p = kk | 0; A = F.s[p]; B = F.s[p + 1]; k = kk - p; }
  const done = k >= 1, pos = done ? N : clamp((k * N) | 0, 0, N - 1);
  for (let i = 0; i < N; i++) SCAN_BUF[i] = i < pos ? B[i] : A[i];
  if (!done) {
    const c = SPELLS[wrong ? g.wj : g.type].rgb, col = 0xFF000000 | (c[2] << 16) | (c[1] << 8) | c[0], wx = pos % SPR, wy = (pos / SPR) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = wx + dx, y = wy + dy; if (x < 0 || y < 0 || x >= SPR || y >= SPR) continue;
      SCAN_BUF[y * SPR + x] = (dx === 0 && dy === 0) ? 0xFFFFFFFF : col;
    }
  }
  return SCAN_BUF;
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
      const form = g.state === 'hidden' ? 1 : 2;   // 1 = hidden image, 2 = revealed (real convolution result)
      let eye = 0;
      if (g.type === 2 && form === 2) { const rx = g.x - cam.x, ry = g.y - cam.y, ty = cam.dx * rx + cam.dy * ry; if (ty > 0.1) eye = clamp(Math.round(-(-cam.dy * rx + cam.dx * ry) / ty * 2.2), -1, 1); }
      const spr = (g.state === 'revealing' || g.state === 'wrongcast') ? scanSpr(g, fr, eye) : ghostSpr(g.type, form, fr, eye);
      const o = { alpha: clamp((LENS_RANGE - it.d) / 2.5, 0, 1) * ((g.state === 'revealed' || g.state === 'revealing') ? 0.96 : 0.82) };
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
      const r = g.sr; if (!r || g.state === 'capturing' || g.state === 'revealing' || g.state === 'wrongcast') continue;
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