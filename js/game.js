/* =========================================================================
   LE CHATON — a fat-cat pixel platformer.
   Jump platform to platform, up up up. Fall off the bottom = game over.
   Vanilla JS + canvas, drawn at 240x320 and scaled up with hard pixels.
   Palette: Mistral orange brand colors.
   Optional modules (loaded before this file if present):
     window.PALETTE / window.SPRITES / window.drawSprite  (js/art.js)
     window.SFX                                           (js/audio.js)
     window.JUICE                                         (js/juice.js)
   ========================================================================= */
(() => {
'use strict';

// ---------------------------------------------------------------- setup --
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 240, H = 320;
canvas.width = W; canvas.height = H;
ctx.imageSmoothingEnabled = false;

const PAL = window.PALETTE || {
  ink: '#241005', deep: '#3A1C00', bg0: '#160A02', bg1: '#3A1C00',
  yellow: '#FFD800', amber: '#FFAF00', orange: '#FF8205',
  darkOrange: '#FA500F', red: '#E10500', cream: '#FFEDCB',
  white: '#FFF6E8', pink: '#FF8FA3'
};

const SFX = window.SFX || new Proxy({}, { get: () => () => {} });
const JUICE = window.JUICE || null;

// ------------------------------------------------- fallback pixel sprites --
// 16x14 fat cat. chars: k outline, o body, s stripe, w belly, e eye,
// n nose, p inner ear, . transparent
const CAT_ROWS = [
  '................',
  '..kk........kk..',
  '.kppk......kppk.',
  '.kppk......kppk.',
  '.kkooooooooookk.',
  'kooooooooooooook',
  'kooskooooooks ook'.replace(' ', ''),
  'kooeoooooooo eok'.replace(' ', ''),
  'koooooonnnoooook',
  'koowwwwwwwwwwook',
  '.kowwwwwwwwwook.',
  '.kowwwwwwwwwook.',
  '..kooooooooook..',
  '...kkkkkkkkkk...'
];
// fix rows 6/7 to be exactly 16 chars with eyes
const CAT = [
  '................',
  '..kk........kk..',
  '.kppk......kppk.',
  '.kppk......kppk.',
  '.kkooooooooookk.',
  'kooooooooooooook',
  'kooskooooooksook',
  'kooeoooooooo eok'.replace(' ', ''),
  'koooooonnnoooook',
  'koowwwwwwwwwwook',
  '.kowwwwwwwwwook.',
  '.kowwwwwwwwwook.',
  '..kooooooooook..',
  '...kkkkkkkkkk...'
];
const CAT_PAL = { k: 'ink', o: 'orange', s: 'darkOrange', w: 'cream', e: 'ink', n: 'pink', p: 'yellow' };
const SPRITES = window.SPRITES || {
  cat: { pal: CAT_PAL, rows: CAT },
  catJump: { pal: CAT_PAL, rows: CAT.map((r, i) => (i >= 11 ? '..kooooooooook..' : i === 12 ? '...kk....kk....' : r)) },
  star: { pal: { y: 'yellow', k: 'ink' },
    rows: ['..y..', '.yky.', 'yyyyy', '.yky.', '..y..'].map(r => r.padEnd(5, '.')) },
  moon: { pal: { y: 'yellow', k: 'ink' }, rows: [
    '...kkkk.........', '..kyyyykk.......', '.kyyyyyyyk......', '.kyyyyyyyyk.....',
    'kyyyyyyyyyyk....', 'kyyyyyyyyyyyk...', 'kyyyyyyyyyyyk...', 'kyyyyyyyyyyk....',
    'kyyyyyyyyyyk....', '.kyyyyyyyyk.....', '.kyyyyyyyk......', '..kyyyykk.......',
    '...kkkk.........', '................', '................', '................'] },
  cloud: { pal: { w: 'white', k: 'ink' }, rows: [
    '....kkkk........', '..kkwwwwkk......', '.kwwwwwwwwk.....', 'kwwwwwwwwwwk....',
    'kwwwwwwwwwwk....', '.kkkkkkkkkk.....', '................'] },
  fish: { pal: { o: 'orange', k: 'ink', w: 'cream' }, rows: [
    '......kk..', '..kkokk...', '.kowwwkokkk', 'kowwewwwwok', '.kowwwwwk..', '..kkkkkk..'] }
};

// pre-render sprites to offscreen canvases for fast blitting
function bake(sprite) {
  const rows = sprite.rows, h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.' || ch === undefined) continue;
    const key = sprite.pal[ch];
    g.fillStyle = PAL[key] || PAL.ink;
    g.fillRect(x, y, 1, 1);
  }
  return c;
}
const IMG = { cat: bake(SPRITES.cat), catJump: bake(SPRITES.catJump || SPRITES.cat) };
if (SPRITES.star) IMG.star = bake(SPRITES.star);
if (SPRITES.moon) IMG.moon = bake(SPRITES.moon);
if (SPRITES.cloud) IMG.cloud = bake(SPRITES.cloud);
if (SPRITES.fish) IMG.fish = bake(SPRITES.fish);

// ------------------------------------------------------------ pixel font --
// 3x5 glyphs, '#' = on
const FONT = {
  'A': ['.#.', '#.#', '###', '#.#', '#.#'], 'B': ['##.', '#.#', '##.', '#.#', '##.'],
  'C': ['.##', '#..', '#..', '#..', '.##'], 'D': ['##.', '#.#', '#.#', '#.#', '##.'],
  'E': ['###', '#..', '##.', '#..', '###'], 'F': ['###', '#..', '##.', '#..', '#..'],
  'G': ['.##', '#..', '#.#', '#.#', '.##'], 'H': ['#.#', '#.#', '###', '#.#', '#.#'],
  'I': ['###', '.#.', '.#.', '.#.', '###'], 'J': ['..#', '..#', '..#', '#.#', '.#.'],
  'K': ['#.#', '#.#', '##.', '#.#', '#.#'], 'L': ['#..', '#..', '#..', '#..', '###'],
  'M': ['#.#', '###', '#.#', '#.#', '#.#'], 'N': ['#.#', '###', '###', '#.#', '#.#'],
  'O': ['.#.', '#.#', '#.#', '#.#', '.#.'], 'P': ['###', '#.#', '###', '#..', '#..'],
  'Q': ['.#.', '#.#', '#.#', '###', '..#'], 'R': ['##.', '#.#', '##.', '#.#', '#.#'],
  'S': ['.##', '#..', '.#.', '..#', '##.'], 'T': ['###', '.#.', '.#.', '.#.', '.#.'],
  'U': ['#.#', '#.#', '#.#', '#.#', '###'], 'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
  'W': ['#.#', '#.#', '#.#', '###', '#.#'], 'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
  'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'], 'Z': ['###', '..#', '.#.', '#..', '###'],
  '0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'], '3': ['##.', '..#', '.#.', '..#', '##.'],
  '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
  '6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['.#.', '#.#', '.#.', '#.#', '.#.'], '9': ['###', '#.#', '###', '..#', '##.'],
  '!': ['.#.', '.#.', '.#.', '...', '.#.'], '.': ['...', '...', '...', '...', '.#.'],
  '-': ['...', '...', '###', '...', '...'], ' ': ['...', '...', '...', '...', '...'],
  ':': ['...', '.#.', '...', '.#.', '...'], '/': ['..#', '..#', '.#.', '#..', '#..']
};
function pixelText(g, text, x, y, color, scale = 1, align = 'left') {
  text = String(text).toUpperCase();
  const tw = text.length * 4 * scale - scale;
  let cx = align === 'center' ? Math.round(x - tw / 2) : align === 'right' ? Math.round(x - tw) : Math.round(x);
  g.fillStyle = color;
  for (const ch of text) {
    const glyph = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (glyph[r][c] === '#') g.fillRect(cx + c * scale, y + r * scale, scale, scale);
    cx += 4 * scale;
  }
  return tw;
}

// ---------------------------------------------------------------- state --
const GRAV = 0.16, JUMP_V = -5.1, ACCEL = 0.30, MAX_VX = 2.3, FRICTION = 0.82;
const CAT_W = 14, CAT_H = 10; // collision box

let state = 'title';           // 'title' | 'play' | 'over'
let cat, platforms, stars, popups, camY, score, best, genY, startY, milestoneAt, tGlobal;

best = parseInt(localStorage.getItem('lechaton_best') || '0', 10) || 0;
tGlobal = 0;

function rand(a, b) { return a + Math.random() * (b - a); }
function irand(a, b) { return Math.floor(rand(a, b + 1)); }
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

function reset() {
  startY = H - 40;
  cat = { x: W / 2, y: startY - 12, vx: 0, vy: 0, face: 1, stand: null, squash: 0 };
  platforms = [{ x: W / 2 - 40, y: startY, w: 80, h: 6, type: 'normal', vx: 0, t: 0 }];
  stars = []; popups = [];
  camY = 0; score = 0; milestoneAt = 100;
  genY = startY;
  while (genY > camY - 80) genPlatform();
  if (JUICE) JUICE.reset();
}

function genPlatform() {
  const diff = Math.min(10, score * 0.02);
  const gap = rand(26, 40 + diff);
  genY -= gap;
  const w = rand(34, 62);
  const x = rand(4, W - w - 4);
  const r = Math.random();
  const type = r < 0.12 ? 'move' : r < 0.28 ? 'break' : 'normal';
  const p = { x, y: genY, w, h: 6, type, vx: type === 'move' ? rand(0.4, 0.9) * (Math.random() < 0.5 ? -1 : 1) : 0, broken: false, bvy: 0, t: rand(0, 6) };
  platforms.push(p);
  if (Math.random() < 0.10) stars.push({ x: x + w / 2, y: genY - 10, taken: false, t: rand(0, 6) });
}

// ---------------------------------------------------------------- input --
const keys = { left: false, right: false };
function press(code, down) {
  if (code === 'ArrowLeft' || code === 'KeyA') keys.left = down;
  if (code === 'ArrowRight' || code === 'KeyD') keys.right = down;
  if (down && (code === 'Enter' || code === 'Space')) advance();
  if (down && code === 'KeyR' && state !== 'title') { SFX.ui(); reset(); state = 'play'; }
  if (down && code === 'KeyM' && window.SFX) window.SFX.toggleMute();
}
window.addEventListener('keydown', e => { SFX.init && SFX.init(); press(e.code, true); if (['ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault(); });
window.addEventListener('keyup', e => press(e.code, false));

let touchDir = 0;
canvas.addEventListener('touchstart', e => { e.preventDefault(); SFX.init && SFX.init(); handleTouch(e); advance(); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); handleTouch(e); }, { passive: false });
canvas.addEventListener('mousedown', () => { SFX.init && SFX.init(); advance(); });
function handleTouch(e) {
  const r = canvas.getBoundingClientRect();
  const x = (e.touches[0].clientX - r.left) / r.width;
  touchDir = x < 0.38 ? -1 : x > 0.62 ? 1 : 0;
}

function advance() {
  if (state === 'title') { SFX.ui(); reset(); state = 'play'; }
  else if (state === 'over') { SFX.ui(); reset(); state = 'play'; }
}

// --------------------------------------------------------------- update --
function update(dt) {
  tGlobal += dt;
  if (state !== 'play') { // idle bob on title / over screens
    if (JUICE) JUICE.update(dt);
    for (const p of popups) { p.y -= 0.4 * dt; p.t -= dt; }
    popups = popups.filter(p => p.t > 0);
    return;
  }

  // horizontal input
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) || touchDir;
  if (dir !== 0) { cat.vx += dir * ACCEL * dt; cat.face = dir; }
  else cat.vx *= Math.pow(FRICTION, dt);
  cat.vx = Math.max(-MAX_VX, Math.min(MAX_VX, cat.vx));
  cat.x += cat.vx * dt;
  if (cat.x < -10) cat.x = W + 10;
  if (cat.x > W + 10) cat.x = -10;

  // gravity
  cat.vy += GRAV * dt;
  const prevBottom = cat.y + CAT_H / 2;
  cat.y += cat.vy * dt;
  cat.stand = null;

  // platforms
  for (const p of platforms) {
    if (p.type === 'move' && !p.broken) {
      p.x += p.vx * dt;
      if (p.x < 2) { p.x = 2; p.vx = Math.abs(p.vx); }
      if (p.x + p.w > W - 2) { p.x = W - 2 - p.w; p.vx = -Math.abs(p.vx); }
    }
    if (p.broken) { p.bvy += 0.12 * dt; p.y += p.bvy * dt; continue; }
    // landing: falling down, crossing the platform top, within x-range
    const bottom = cat.y + CAT_H / 2;
    if (cat.vy > 0 && prevBottom <= p.y + 1 && bottom >= p.y &&
        cat.x + CAT_W / 2 - 2 > p.x && cat.x - CAT_W / 2 + 2 < p.x + p.w) {
      cat.y = p.y - CAT_H / 2;
      cat.vy = JUMP_V;
      cat.stand = p;
      cat.squash = 1;
      SFX.jump();
      if (JUICE) { JUICE.burst(cat.x, p.y + 2, PAL.amber, 8, { speed: 1.6, life: 18, size: 2 }); JUICE.kick(0.6); }
      if (p.type === 'break') { p.broken = true; SFX.breakPlat(); if (JUICE) JUICE.kick(2.2); }
      else SFX.land();
    }
  }
  // ride moving platforms
  if (cat.stand && cat.stand.type === 'move' && !cat.stand.broken) cat.x += cat.stand.vx * dt;

  // generate upward, cull downward
  while (genY > camY - 80) genPlatform();
  platforms = platforms.filter(p => p.y < camY + H + 60);
  stars = stars.filter(s => !s.taken && s.y < camY + H + 40);

  // camera follows upward only
  const target = cat.y - H * 0.42;
  if (target < camY) camY += (target - camY) * Math.min(1, 0.25 * dt);

  // score = height climbed
  score = Math.max(score, Math.floor((startY - cat.y) / 8));
  if (score >= milestoneAt) {
    milestoneAt += 100;
    const phrases = ['MEOW!', 'PURR!', 'NICE!', 'UP UP!', 'WOOF? NO. MEOW!'];
    addPopup(cat.x, cat.y - 14, phrases[irand(0, phrases.length - 1)], PAL.yellow);
    Math.random() < 0.5 ? SFX.meow() : SFX.milestone();
    if (JUICE) JUICE.ring(cat.x, cat.y, PAL.yellow);
  }

  // stars
  for (const s of stars) {
    s.t += dt;
    if (!s.taken && Math.abs(cat.x - s.x) < 10 && Math.abs(cat.y - s.y) < 12) {
      s.taken = true;
      score += 25;
      addPopup(s.x, s.y - 8, '+25', PAL.yellow);
      SFX.star();
      if (JUICE) { JUICE.burst(s.x, s.y, PAL.yellow, 14, { speed: 2.2, life: 24, size: 2 }); JUICE.ring(s.x, s.y, PAL.orange); }
    }
  }

  // popups
  for (const p of popups) { p.y -= 0.5 * dt; p.t -= dt; }
  popups = popups.filter(p => p.t > 0);

  cat.squash = Math.max(0, cat.squash - 0.08 * dt);
  if (JUICE) JUICE.update(dt);

  // fell off the bottom = game over
  if (cat.y - camY > H + 14) {
    state = 'over';
    SFX.over();
    if (JUICE) { JUICE.burst(cat.x, camY + H - 8, PAL.red, 26, { speed: 3, life: 40, size: 2 }); JUICE.kick(5); }
    if (score > best) { best = score; localStorage.setItem('lechaton_best', String(best)); }
  }
}

function addPopup(x, y, text, color) { popups.push({ x, y, text, color, t: 60 }); }

// --------------------------------------------------------------- render --
function drawSprite(img, x, y, scale, flip) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -(img.width * scale) / 2, -(img.height * scale) / 2, img.width * scale, img.height * scale);
  ctx.restore();
}

function render() {
  // sky gradient (Mistral sunset)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, PAL.bg0);
  g.addColorStop(0.6, PAL.bg1);
  g.addColorStop(1, PAL.darkOrange);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const shk = JUICE ? JUICE.offset() : { x: 0, y: 0 };
  ctx.save();
  ctx.translate(Math.round(shk.x), Math.round(shk.y));

  // parallax stars
  ctx.fillStyle = PAL.cream;
  for (let i = 0; i < 70; i++) {
    const sx = hash(i) * W;
    let sy = (hash(i + 200) * (H + 400) - camY * 0.35) % (H + 400);
    if (sy < 0) sy += H + 400;
    sy -= 200;
    if (hash(i + 400) > 0.5) ctx.fillRect(sx | 0, sy | 0, 1, 1);
    else ctx.fillRect(sx | 0, sy | 0, 2, 1);
  }
  // moon (parallax)
  if (IMG.moon) {
    const mx = W - 52, my = ((60 - camY * 0.15) % (H + 120) + H + 120) % (H + 120) - 60;
    drawSprite(IMG.moon, mx, my, 2, false);
  }
  // clouds (parallax)
  if (IMG.cloud) {
    for (let i = 0; i < 5; i++) {
      const cx = (hash(i + 50) * (W + 80) + tGlobal * (2 + i)) % (W + 80) - 40;
      let cy = (hash(i + 90) * (H + 200) - camY * 0.5) % (H + 200);
      if (cy < 0) cy += H + 200;
      cy -= 100;
      ctx.globalAlpha = 0.5;
      drawSprite(IMG.cloud, cx, cy, 1, false);
      ctx.globalAlpha = 1;
    }
  }

  // platforms
  for (const p of platforms) {
    const sy = p.y - camY;
    if (sy < -10 || sy > H + 10) continue;
    let body = PAL.orange, top = PAL.yellow, under = PAL.deep;
    if (p.type === 'move') { body = PAL.amber; top = PAL.white; }
    if (p.type === 'break') { body = PAL.cream; top = PAL.amber; }
    if (p.broken) { body = PAL.red; top = PAL.darkOrange; }
    ctx.fillStyle = under;
    ctx.fillRect(Math.round(p.x) - 1, Math.round(sy), Math.round(p.w) + 2, p.h + 1);
    ctx.fillStyle = body;
    ctx.fillRect(Math.round(p.x), Math.round(sy) + 1, Math.round(p.w), p.h - 1);
    ctx.fillStyle = top;
    ctx.fillRect(Math.round(p.x), Math.round(sy), Math.round(p.w), 2);
    // pixel rivets
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(Math.round(p.x) + 2, Math.round(sy) + p.h - 1, 1, 1);
    ctx.fillRect(Math.round(p.x + p.w) - 3, Math.round(sy) + p.h - 1, 1, 1);
    if (p.type === 'break' && !p.broken) { // crack marks
      ctx.fillRect(Math.round(p.x + p.w / 2), Math.round(sy) + 1, 1, 3);
      ctx.fillRect(Math.round(p.x + p.w / 2) - 2, Math.round(sy) + 3, 1, 1);
      ctx.fillRect(Math.round(p.x + p.w / 2) + 2, Math.round(sy) + 3, 1, 1);
    }
  }

  // stars
  if (IMG.star) for (const s of stars) {
    const sy = s.y - camY + Math.sin(s.t * 0.15) * 1.5;
    if (sy < -10 || sy > H + 10) continue;
    drawSprite(IMG.star, s.x, sy, 2, false);
  }

  // particles
  if (JUICE) JUICE.render(ctx, camY);

  // ---- the fat cat ----
  if (cat) {
    const sy = cat.y - camY;
    const stretch = 1 + Math.max(-0.28, Math.min(0.32, cat.vy * 0.045)) + cat.squash * 0.25;
    const squashX = 1 + (1 - stretch) * 0.7;
    const img = cat.vy < -0.5 ? IMG.catJump : IMG.cat;
    ctx.save();
    ctx.translate(Math.round(cat.x), Math.round(sy));
    ctx.scale(cat.face * squashX, stretch);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
    // shadow blob on platform
    if (cat.stand && !cat.stand.broken) {
      ctx.fillStyle = 'rgba(36,16,5,0.5)';
      ctx.fillRect(Math.round(cat.stand.x + cat.stand.w / 2) - 6, Math.round(cat.stand.y - camY) + 1, 12, 2);
    }
  }

  // popups
  for (const p of popups) {
    const sy = p.y - camY;
    if (sy > -10 && sy < H + 10) pixelText(ctx, p.text, p.x, sy, p.color, 1, 'center');
  }

  ctx.restore(); // end shake

  // ---------------- HUD & screens ----------------
  if (state === 'play') {
    pixelText(ctx, 'SCORE ' + score, 6, 6, PAL.yellow, 1);
    pixelText(ctx, 'BEST ' + best, 6, 14, PAL.cream, 1);
  } else if (state === 'title') {
    ctx.fillStyle = 'rgba(22,10,2,0.55)';
    ctx.fillRect(0, 0, W, H);
    // big bouncing cat
    const bob = Math.sin(tGlobal * 0.06) * 4;
    ctx.save();
    ctx.translate(W / 2, 118 + bob);
    ctx.scale(6, 6);
    ctx.drawImage(IMG.cat, -IMG.cat.width / 2, -IMG.cat.height / 2);
    ctx.restore();
    pixelText(ctx, 'LE CHATON', W / 2, 40, PAL.yellow, 3, 'center');
    pixelText(ctx, 'FAT CAT CLIMBER', W / 2, 62, PAL.orange, 1, 'center');
    pixelText(ctx, 'JUMP UP UP UP!', W / 2, 176, PAL.cream, 1, 'center');
    pixelText(ctx, 'DONT FALL OFF!', W / 2, 188, PAL.darkOrange, 1, 'center');
    if (Math.floor(tGlobal / 30) % 2 === 0)
      pixelText(ctx, 'PRESS ENTER / TAP', W / 2, 224, PAL.white, 1, 'center');
    pixelText(ctx, 'BEST ' + best, W / 2, 250, PAL.amber, 1, 'center');
  } else if (state === 'over') {
    ctx.fillStyle = 'rgba(22,10,2,0.72)';
    ctx.fillRect(0, 0, W, H);
    pixelText(ctx, 'GAME OVER', W / 2, 84, PAL.red, 3, 'center');
    // dizzy cat
    ctx.save();
    ctx.translate(W / 2, 140);
    ctx.rotate(Math.sin(tGlobal * 0.1) * 0.4);
    ctx.scale(4, 4);
    ctx.drawImage(IMG.cat, -IMG.cat.width / 2, -IMG.cat.height / 2);
    ctx.restore();
    pixelText(ctx, 'SCORE ' + score, W / 2, 190, PAL.yellow, 2, 'center');
    pixelText(ctx, 'BEST  ' + best, W / 2, 206, PAL.amber, 1, 'center');
    if (score >= best && score > 0) pixelText(ctx, 'NEW BEST!', W / 2, 220, PAL.yellow, 1, 'center');
    if (Math.floor(tGlobal / 30) % 2 === 0)
      pixelText(ctx, 'PRESS R / TAP', W / 2, 248, PAL.white, 1, 'center');
  }
}

// ----------------------------------------------------------------- loop --
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 16.666;
  last = now;
  if (dt > 3) dt = 3;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
reset();
state = 'title';
requestAnimationFrame(frame);
})();
