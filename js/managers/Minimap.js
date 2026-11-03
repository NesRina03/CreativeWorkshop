'use strict';

const MM = {
  size: 5,
  canvas: $('minimap'),
  base: null,
  seen: new Uint8Array(MW * MH)
};
MM.ctx = MM.canvas.getContext('2d');

function buildMinimap() {
  const size = MM.size;
  MM.canvas.width = MW * size;
  MM.canvas.height = MH * size;
  MM.base = mkCanvas(MW * size, MH * size);
  const ctx = MM.base.getContext('2d');

  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const index = y * MW + x;
      ctx.fillStyle = MAP[index] ? '#8a7258' : (RUG[index] ? '#4a2a38' : '#2c2132');
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
}

function resetMinimap() {
  MM.seen.fill(0);
}

function drawMinimap() {
  if (!MM.base) return;

  const size = MM.size;
  const ctx = MM.ctx;
  const revealRadius = 4;
  ctx.fillStyle = '#0a060c';
  ctx.fillRect(0, 0, MM.canvas.width, MM.canvas.height);

  const playerCellX = P.x | 0;
  const playerCellY = P.y | 0;
  for (let y = Math.max(0, playerCellY - revealRadius); y <= Math.min(MH - 1, playerCellY + revealRadius); y++) {
    for (let x = Math.max(0, playerCellX - revealRadius); x <= Math.min(MW - 1, playerCellX + revealRadius); x++) {
      const index = y * MW + x;
      if (!MM.seen[index] && los(P.x, P.y, x + 0.5, y + 0.5)) MM.seen[index] = 1;
    }
  }

  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (MM.seen[y * MW + x]) {
        ctx.drawImage(MM.base, x * size, y * size, size, size, x * size, y * size, size, size);
      }
    }
  }

  ctx.save();
  ctx.translate(P.x * size, P.y * size);
  ctx.rotate(P.a);
  ctx.fillStyle = '#5dff8f';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(5, 0);
  ctx.lineTo(-3.5, -3.5);
  ctx.lineTo(-1.5, 0);
  ctx.lineTo(-3.5, 3.5);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}
