'use strict';

/* ============================================================================
   KID MODE: removes every grid / matrix / maths word from the screens the child sees.
   Loaded AFTER GameUI.js and BEFORE CastScene.js. It replaces:
     - the "spell found" panel (no matrix, just the spell symbol)
     - the spellbook (no matrix, just symbol + story)
     - the intro cutscene page with the grid (now a symbol collecting sparkles)
     - the ending lesson (no kernel / weights / "convolution"; a story instead)
   ============================================================================ */

Object.assign(L.en, {
  kidHow: 'It collects tiny pieces of magic around a heart and puts them inside it!',
  kidSymbol: 'This is your spell symbol. Look for the same symbol on the ghost\'s grey heart!',
  enIntroTitle: 'HOW DID THE SPELLS WORK?',
  enIntro1L: 'THE IDEA',
  enIntro1: 'Every ghost lost its magic heart. Your spell collects little pieces of magic around the heart, from right to left, and puts them inside. Then the heart comes back!',
  enIntro2L: 'YOUR FIVE SPELLS',
  enIntro2: 'Each spell collects magic in its own special way, so each one helps a different ghost. Let us see what each one did!',
  enL1: 'WHAT THE SPELL DOES', enL2: 'WHAT IT DID TO THE GHOST'
});
Object.assign(L.ar, {
  kidHow: 'تجمع قطعًا صغيرة من السحر حول القلب وتضعها بداخله!',
  kidSymbol: 'هذا رمز تعويذتك. ابحث عن الرمز نفسه على القلب الرمادي للشبح!',
  enIntroTitle: 'كيف عملت التعاويذ؟',
  enIntro1L: 'الفكرة',
  enIntro1: 'كل شبح فقد قلبه السحري. تجمع تعويذتك قطعًا صغيرة من السحر حول القلب، من اليمين إلى اليسار، وتضعها بداخله. فيعود القلب!',
  enIntro2L: 'تعاويذك الخمس',
  enIntro2: 'كل تعويذة تجمع السحر بطريقتها الخاصة، لذلك تساعد كل واحدة شبحًا مختلفًا. لنرَ ماذا فعلت كل واحدة!',
  enL1: 'ماذا تفعل التعويذة', enL2: 'ماذا فعلت بالشبح'
});

/* the lesson texts: stories only, no numbers */
const KID_DOES = [
  { en: 'The spell collects the magic around every spot and mixes it all together. Tiny specks cannot hide in the mix, so the fuzz melts away.',
    ar: 'تجمع التعويذة السحر المحيط بكل نقطة وتمزجه معًا. لا تستطيع البقع الصغيرة الاختباء في هذا المزيج، فيذوب التشويش.' },
  { en: 'The spell makes every spot stand out from the pieces next to it. Soft, smudgy edges become bold and clear again.',
    ar: 'تجعل التعويذة كل نقطة تبرز عن القطع المجاورة لها. فتصبح الحواف الباهتة قوية وواضحة من جديد.' },
  { en: 'The spell ignores calm, flat places. It only lights up where something changes, like the outline of a drawing.',
    ar: 'تتجاهل التعويذة الأماكن الهادئة المسطّحة. وتُضيء فقط حيث يتغير شيء، مثل خطوط الرسم الخارجية.' },
  { en: 'The spell checks which side is lighter and which is darker, and turns that into little hills and shadows, like pressing a coin into clay.',
    ar: 'تفحص التعويذة أي جانب أفتح وأي جانب أغمق، وتحوّل ذلك إلى تلال صغيرة وظلال، كأنك تضغط عملة على الطين.' },
  { en: 'The spell collects magic from the sides of every spot and stretches it sideways, filling the gaps between the thin stripes.',
    ar: 'تجمع التعويذة السحر من جانبَي كل نقطة وتمدّه إلى الجانب، فتمتلئ الفراغات بين الشرائح الرفيعة.' }
];
KID_DOES.forEach((d, i) => { LESSON[i].does = d; });

/* ---- spell found panel: just the symbol ---- */
function fillSpellPanel(i) {
  if (i === undefined) return; const sp = SPELLS[i];
  $('spIcon').src = RUNE_URL[i]; $('spTitle').textContent = sp.name[G.lang]; $('spTitle').style.color = sp.color;
  $('spFn').textContent = sp.fn[G.lang];
  $('spMatrix').innerHTML = '<img class="bigRune" alt="" src="' + RUNE_URL[i] + '">';
  $('spNorm').textContent = tr('kidHow');
  $('spBox').style.boxShadow = 'inset 0 0 0 4px ' + sp.color + ',inset 0 0 0 8px #2c1a10,0 0 0 4px ' + sp.color;
}

/* ---- spellbook: symbol + story, no matrix ---- */
function renderBook() {
  const lang = G.lang, list = $('bkList'); list.innerHTML = '';
  SPELLS.forEach((s, i) => {
    const row = document.createElement('div'); row.className = 'bkRow' + (G.collected[i] ? '' : ' locked') + (G.sel === i ? ' sel' : '');
    row.innerHTML = G.collected[i]
      ? '<img src="' + RUNE_URL[i] + '" alt=""><span class="nm" style="color:' + s.color + '">' + (i + 1) + '. ' + s.name[lang] + '</span><i class="sw" style="background:' + s.color + '"></i>'
      : '<img src="' + ICON.lock + '" alt=""><span class="nm">' + (i + 1) + '. ??? ???</span>';
    row.onclick = () => selectBookSpell(i);
    list.appendChild(row);
  });
  $('bkHint').textContent = G.bookGhost ? tr('selectHint') : tr('browseHint');
  const sp = SPELLS[G.sel], d = $('bkDetail');
  if (G.collected[G.sel]) {
    d.innerHTML = '<div class="bkTitle" style="color:' + sp.color + '">' + sp.name[lang] + '</div>' +
      '<div class="bkDesc">' + sp.desc[lang] + '</div>' +
      '<div class="bkHeartBox" style="--c:' + sp.color + '"><img class="bigRune" alt="" src="' + RUNE_URL[G.sel] + '"><div class="bkHeartTxt">' + tr('kidSymbol') + '</div></div>' +
      '<div class="bkColor"><span>' + tr('colorLbl') + ':</span><i style="background:' + sp.color + '"></i><span>' + sp.colorName[lang] + '</span></div>';
  } else d.innerHTML = '<div class="bkLocked"><img src="' + ICON.lock + '" alt="">' + tr('locked') + '<br><br>' + tr('lockedHint') + '</div>';
  const at = $('bkAttempts');
  if (G.bookGhost) { const left = 2 - G.bookGhost.wrong; at.innerHTML = '<span>' + tr('attemptsLbl') + ':</span>' + [0, 1].map((k) => '<img src="' + (k < left ? ICON.skull : ICON.skullOff) + '" alt="">').join(''); } else at.innerHTML = '';
  $('bkCast').style.display = G.bookGhost ? '' : 'none';
  $('bkCast').disabled = !G.collected[G.sel]; $('bkCast').style.opacity = G.collected[G.sel] ? 1 : 0.45;
}

/* ---- intro cutscene page 4: the book, with the symbol collecting sparkles (no grid) ---- */
function slide3Kid(t) {
  R(0, 0, 320, 200, '#120a08'); R(30, 26, 260, 140, '#1c0f08'); R(36, 32, 120, 128, '#d9bd88'); R(164, 32, 120, 128, '#d9bd88'); R(156, 32, 8, 128, '#5a3a1a');
  R(36, 32, 120, 3, '#b8975e'); R(164, 32, 120, 3, '#b8975e');
  for (let i = 0; i < 5; i++) { cx.drawImage(drawRuneCached(i), 46, 42 + i * 22, 20, 20); R(72, 48 + i * 22, 60, 3, '#6a4a2a'); R(72, 54 + i * 22, 40, 2, '#9a7a4a'); }
  const k = (t | 0) % 5, col = SPELLS[k].rgb, mx = 224, my = 96;
  D(mx, my, 34, 'rgba(' + col.join(',') + ',0.16)');
  for (let j = 0; j < 10; j++) {                         // sparkles flying into the symbol
    const ph = (t * 0.8 + j / 10) % 1, a = j * TAU / 10 + 0.5, r = 52 * (1 - ph) + 8;
    R(mx + Math.cos(a) * r - 1, my + Math.sin(a) * r - 1, 3, 3, 'rgba(' + Math.min(255, col[0] + 80) + ',' + Math.min(255, col[1] + 80) + ',' + Math.min(255, col[2] + 80) + ',' + (0.3 + 0.7 * ph).toFixed(2) + ')');
  }
  const s = 52 + Math.sin(t * 5) * 3; cx.drawImage(drawRuneCached(k), mx - s / 2, my - s / 2, s, s);
}
SLIDES[3] = slide3Kid;

/* ---- ending lesson: no matrix, the spell symbol in the middle ---- */
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
    $('enMx').innerHTML = [0, 1, 2, 3, 4].map((n) => '<img alt="" src="' + RUNE_URL[n] + '" style="width:34px;height:34px;image-rendering:pixelated;margin:2px">').join('');
    note.textContent = '';
    $('enL1').textContent = tr('enIntro1L'); $('enT1').textContent = tr('enIntro1');
    $('enL2').textContent = tr('enIntro2L'); $('enT2').textContent = tr('enIntro2');
  } else {
    t.textContent = sp.name[lang]; op.textContent = sp.colorName[lang];
    $('enMx').innerHTML = '<img class="bigRune" alt="" src="' + RUNE_URL[gi] + '">';
    note.textContent = '';
    $('enL1').textContent = tr('enL1'); $('enT1').textContent = LESSON[gi].does[lang];
    $('enL2').textContent = tr('enL2'); $('enT2').textContent = LESSON[gi].effect[lang];
  }
}
/* the magic ring that moves over the ghost while the picture is revealed */
function updateEnding(dt) {
  const i = EN.idx, gi = i === 0 ? 0 : i - 1, col = i === 0 ? '#f0a030' : SPELLS[gi].color;
  EN.pos += dt * (i === 0 ? 260 : 300);
  if (i === 0 && EN.pos >= 1100) EN.pos = -40;
  const im = lessonImgs(gi), done = EN.pos >= 1024, scanning = EN.pos >= 0 && !done;
  const pos = clamp(EN.pos | 0, 0, 1023), x = pos % SPR, y = (pos / SPR) | 0;
  ebx.clearRect(0, 0, 96, 96); ebx.drawImage(im.before, 0, 0, 96, 96);
  if (scanning) {
    ebx.strokeStyle = col; ebx.lineWidth = 2; ebx.beginPath(); ebx.arc(x * 3 + 1.5, y * 3 + 1.5, 6, 0, TAU); ebx.stroke();
  }
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
