'use strict';

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

