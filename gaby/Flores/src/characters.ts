/* ── Programmatic Character Rendering ────────────────────────── */
/* Canvas 2D primitives — no sprite sheets. Each character is      */
/* drawn with fillRect / arc / ellipse for an indie RPG look.     */

export type CharState = 'idle' | 'walk' | 'sit' | 'sleep' | 'walkToCoffee' | 'deliverLetter';

export interface CharSpec {
  skinColor: string;
  hairColor: string;
  hairW: number;
  hairH: number;
  shirtColor: string;
  shirtW: number;
  shirtH: number;
  pantsColor: string;
  pantsW: number;
  pantsH: number;
  shoeColor: string;
  shoeH: number;
  accessory?: 'cap' | 'none';
  accessoryColor?: string;
  logo?: { color: string; x: number; y: number; w: number; h: number };
  held?: { color: string; x: number; y: number; w: number; h: number };
}

const SPECS: Record<string, CharSpec> = {
  gaby: {
    skinColor: '#f5cba7',
    hairColor: '#3b2314',
    hairW: 12,
    hairH: 8,
    shirtColor: '#f5cbd3',
    shirtW: 16,
    shirtH: 14,
    pantsColor: '#1e1e1e',
    pantsW: 6,
    pantsH: 10,
    shoeColor: '#333333',
    shoeH: 2,
    logo: { color: '#3b82f6', x: -3, y: 1, w: 6, h: 4 },
    held: { color: '#ffffff', x: 8, y: 4, w: 5, h: 4 },
  },
  willy: {
    skinColor: '#f5cba7',
    hairColor: '#2c1810',
    hairW: 10,
    hairH: 6,
    shirtColor: '#f1f5f9',
    shirtW: 15,
    shirtH: 13,
    pantsColor: '#1e293b',
    pantsW: 6,
    pantsH: 10,
    shoeColor: '#333333',
    shoeH: 2,
    accessory: 'cap',
    accessoryColor: '#f8fafc',
  },
  nolan: {
    skinColor: '#f5cba7',
    hairColor: '#5c4033',
    hairW: 10,
    hairH: 7,
    shirtColor: '#182337',
    shirtW: 16,
    shirtH: 14,
    pantsColor: '#0f172a',
    pantsW: 6,
    pantsH: 10,
    shoeColor: '#111827',
    shoeH: 2,
    logo: { color: '#94a3b8', x: -2, y: 2, w: 4, h: 3 },
  },
};

/* ── Main draw function ─────────────────────────────────────── */

export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  who: 'gaby' | 'willy' | 'nolan',
  state: CharState,
  time: number,
  dir: 'left' | 'right' = 'right',
): void {
  const spec = SPECS[who];
  if (!spec) return;

  ctx.save();
  ctx.translate(x, y);

  const flip = dir === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  switch (state) {
    case 'sleep':
      drawSleeping(ctx, spec, time);
      break;
    case 'sit':
      drawSitting(ctx, spec, time);
      break;
    case 'walk':
    case 'walkToCoffee':
    case 'deliverLetter':
      drawWalking(ctx, spec, time);
      break;
    default:
      drawIdle(ctx, spec, time);
  }

  ctx.restore();
}

/* ── IDLE ───────────────────────────────────────────────────── */

function drawIdle(
  ctx: CanvasRenderingContext2D,
  s: CharSpec,
  time: number,
): void {
  const bob = Math.sin(time * 0.003) * 1;
  const legSpread = 1;
  const legH = s.pantsH;
  const armH = s.shirtH - 4;

  /* Shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, legH + s.shoeH + 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Legs */
  ctx.fillStyle = s.pantsColor;
  ctx.fillRect(-s.pantsW - legSpread, bob, s.pantsW, legH);
  ctx.fillRect(legSpread, bob, s.pantsW, legH);

  /* Shoes */
  ctx.fillStyle = s.shoeColor;
  ctx.fillRect(-s.pantsW - legSpread, bob + legH, s.pantsW + 1, s.shoeH);
  ctx.fillRect(legSpread, bob + legH, s.pantsW + 1, s.shoeH);

  /* Body / shirt */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2, -s.shirtH + bob, s.shirtW, s.shirtH);

  /* Logo / badge */
  if (s.logo) {
    ctx.fillStyle = s.logo.color;
    ctx.fillRect(s.logo.x, -s.shirtH + s.logo.y + bob, s.logo.w, s.logo.h);
  }

  /* Arms */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -armH + bob, 3, armH);
  ctx.fillRect(s.shirtW / 2, -armH + bob, 3, armH);

  /* Hands */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -armH + bob + armH - 3, 3, 3);
  ctx.fillRect(s.shirtW / 2, -armH + bob + armH - 3, 3, 3);

  /* Held item */
  if (s.held) {
    ctx.fillStyle = s.held.color;
    ctx.fillRect(s.held.x, -s.shirtH + s.held.y + bob, s.held.w, s.held.h);
  }

  /* Head */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.hairW / 2, -s.shirtH - 10 + bob, s.hairW, 10);

  /* Hair */
  ctx.fillStyle = s.hairColor;
  ctx.fillRect(-s.hairW / 2 - 1, -s.shirtH - 10 + bob - s.hairH + 4, s.hairW + 2, s.hairH);

  /* Accessory: cap */
  if (s.accessory === 'cap') {
    ctx.fillStyle = s.accessoryColor || '#ffffff';
    ctx.fillRect(-s.hairW / 2 - 2, -s.shirtH - 10 + bob - s.hairH + 2, s.hairW + 4, 4);
    /* Blue pixel (shark logo) */
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-1, -s.shirtH - 10 + bob - s.hairH + 3, 2, 2);
  }

  /* Eyes */
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-3, -s.shirtH - 6 + bob, 2, 2);
  ctx.fillRect(2, -s.shirtH - 6 + bob, 2, 2);

  /* Headphones for willy */
  if (s.accessory === 'cap') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(-s.hairW / 2 - 3, -s.shirtH - 4 + bob, 2, 4);
    ctx.fillRect(s.hairW / 2 + 1, -s.shirtH - 4 + bob, 2, 4);
  }
}

/* ── WALKING ────────────────────────────────────────────────── */

function drawWalking(
  ctx: CanvasRenderingContext2D,
  s: CharSpec,
  time: number,
): void {
  const bob = Math.sin(time * 0.008) * 2;
  const legPhase = Math.sin(time * 0.008);
  const legH = s.pantsH;
  const legSpread = 1;
  const armSwing = Math.sin(time * 0.008) * 3;

  /* Shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, legH + s.shoeH + 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Legs (alternating) */
  ctx.fillStyle = s.pantsColor;
  ctx.fillRect(-s.pantsW - legSpread, bob + legPhase * 2, s.pantsW, legH);
  ctx.fillRect(legSpread, bob - legPhase * 2, s.pantsW, legH);

  /* Shoes */
  ctx.fillStyle = s.shoeColor;
  ctx.fillRect(-s.pantsW - legSpread, bob + legPhase * 2 + legH, s.pantsW + 1, s.shoeH);
  ctx.fillRect(legSpread, bob - legPhase * 2 + legH, s.pantsW + 1, s.shoeH);

  /* Body / shirt */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2, -s.shirtH + bob, s.shirtW, s.shirtH);

  /* Logo / badge */
  if (s.logo) {
    ctx.fillStyle = s.logo.color;
    ctx.fillRect(s.logo.x, -s.shirtH + s.logo.y + bob, s.logo.w, s.logo.h);
  }

  /* Arms (swinging) */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -s.shirtH + 4 + bob + armSwing, 3, s.shirtH - 4);
  ctx.fillRect(s.shirtW / 2, -s.shirtH + 4 + bob - armSwing, 3, s.shirtH - 4);

  /* Hands */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -s.shirtH + 4 + bob + armSwing + s.shirtH - 7, 3, 3);
  ctx.fillRect(s.shirtW / 2, -s.shirtH + 4 + bob - armSwing + s.shirtH - 7, 3, 3);

  /* Held item */
  if (s.held) {
    ctx.fillStyle = s.held.color;
    ctx.fillRect(s.held.x, -s.shirtH + s.held.y + bob, s.held.w, s.held.h);
  }

  /* Head */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.hairW / 2, -s.shirtH - 10 + bob, s.hairW, 10);

  /* Hair */
  ctx.fillStyle = s.hairColor;
  ctx.fillRect(-s.hairW / 2 - 1, -s.shirtH - 10 + bob - s.hairH + 4, s.hairW + 2, s.hairH);

  /* Accessory: cap */
  if (s.accessory === 'cap') {
    ctx.fillStyle = s.accessoryColor || '#ffffff';
    ctx.fillRect(-s.hairW / 2 - 2, -s.shirtH - 10 + bob - s.hairH + 2, s.hairW + 4, 4);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-1, -s.shirtH - 10 + bob - s.hairH + 3, 2, 2);
  }

  /* Eyes */
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-3, -s.shirtH - 6 + bob, 2, 2);
  ctx.fillRect(2, -s.shirtH - 6 + bob, 2, 2);

  /* Headphones */
  if (s.accessory === 'cap') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(-s.hairW / 2 - 3, -s.shirtH - 4 + bob, 2, 4);
    ctx.fillRect(s.hairW / 2 + 1, -s.shirtH - 4 + bob, 2, 4);
  }
}

/* ── SITTING ────────────────────────────────────────────────── */

function drawSitting(
  ctx: CanvasRenderingContext2D,
  s: CharSpec,
  time: number,
): void {
  const legH = 7;
  const legSpread = 1;

  /* Shadow */
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(0, legH + s.shoeH + 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  /* Legs (projected forward/sideways) */
  ctx.fillStyle = s.pantsColor;
  ctx.fillRect(-s.pantsW - legSpread, 0, s.pantsW, legH);
  ctx.fillRect(legSpread, 0, s.pantsW, legH);

  /* Shoes */
  ctx.fillStyle = s.shoeColor;
  ctx.fillRect(-s.pantsW - legSpread, legH, s.pantsW + 1, s.shoeH);
  ctx.fillRect(legSpread, legH, s.pantsW + 1, s.shoeH);

  /* Body / shirt */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2, -s.shirtH, s.shirtW, s.shirtH);

  /* Logo / badge */
  if (s.logo) {
    ctx.fillStyle = s.logo.color;
    ctx.fillRect(s.logo.x, -s.shirtH + s.logo.y, s.logo.w, s.logo.h);
  }

  /* Arms (resting at sides) */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -s.shirtH + 4, 3, s.shirtH - 4);
  ctx.fillRect(s.shirtW / 2, -s.shirtH + 4, 3, s.shirtH - 4);

  /* Hands */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.shirtW / 2 - 3, -s.shirtH + 4 + s.shirtH - 7, 3, 3);
  ctx.fillRect(s.shirtW / 2, -s.shirtH + 4 + s.shirtH - 7, 3, 3);

  /* Held item */
  if (s.held) {
    ctx.fillStyle = s.held.color;
    ctx.fillRect(s.held.x, -s.shirtH + s.held.y, s.held.w, s.held.h);
  }

  /* Head */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.hairW / 2, -s.shirtH - 10, s.hairW, 10);

  /* Hair */
  ctx.fillStyle = s.hairColor;
  ctx.fillRect(-s.hairW / 2 - 1, -s.shirtH - 10 - s.hairH + 4, s.hairW + 2, s.hairH);

  /* Accessory: cap */
  if (s.accessory === 'cap') {
    ctx.fillStyle = s.accessoryColor || '#ffffff';
    ctx.fillRect(-s.hairW / 2 - 2, -s.shirtH - 10 - s.hairH + 2, s.hairW + 4, 4);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-1, -s.shirtH - 10 - s.hairH + 3, 2, 2);
  }

  /* Eyes */
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(-3, -s.shirtH - 6, 2, 2);
  ctx.fillRect(2, -s.shirtH - 6, 2, 2);

  /* Headphones */
  if (s.accessory === 'cap') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(-s.hairW / 2 - 3, -s.shirtH - 4, 2, 4);
    ctx.fillRect(s.hairW / 2 + 1, -s.shirtH - 4, 2, 4);
  }
}

/* ── SLEEPING (on sofa) ─────────────────────────────────────── */

function drawSleeping(
  ctx: CanvasRenderingContext2D,
  s: CharSpec,
  time: number,
): void {
  const legH = 7;
  const legSpread = 1;

  /* Legs (projected forward) */
  ctx.fillStyle = s.pantsColor;
  ctx.fillRect(-s.pantsW - legSpread, 0, s.pantsW, legH);
  ctx.fillRect(legSpread, 0, s.pantsW, legH);

  /* Shoes */
  ctx.fillStyle = s.shoeColor;
  ctx.fillRect(-s.pantsW - legSpread, legH, s.pantsW + 1, s.shoeH);
  ctx.fillRect(legSpread, legH, s.pantsW + 1, s.shoeH);

  /* Body / shirt */
  ctx.fillStyle = s.shirtColor;
  ctx.fillRect(-s.shirtW / 2, -s.shirtH, s.shirtW, s.shirtH);

  /* Head (tilted for sleeping) */
  ctx.fillStyle = s.skinColor;
  ctx.fillRect(-s.hairW / 2, -s.shirtH - 8, s.hairW, 8);

  /* Hair */
  ctx.fillStyle = s.hairColor;
  ctx.fillRect(-s.hairW / 2 - 1, -s.shirtH - 8 - s.hairH + 4, s.hairW + 2, s.hairH);

  /* Accessory: cap */
  if (s.accessory === 'cap') {
    ctx.fillStyle = s.accessoryColor || '#ffffff';
    ctx.fillRect(-s.hairW / 2 - 2, -s.shirtH - 8 - s.hairH + 2, s.hairW + 4, 4);
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(-1, -s.shirtH - 8 - s.hairH + 3, 2, 2);
  }

  /* Closed eyes (sleeping) */
  ctx.fillStyle = '#4a3e3d';
  ctx.fillRect(-3, -s.shirtH - 4, 3, 1);
  ctx.fillRect(2, -s.shirtH - 4, 3, 1);

  /* Headphones */
  if (s.accessory === 'cap') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(-s.hairW / 2 - 3, -s.shirtH - 2, 2, 4);
    ctx.fillRect(s.hairW / 2 + 1, -s.shirtH - 2, 2, 4);
  }

  /* ZZZ floating */
  const zzz = Math.sin(time * 0.002);
  ctx.fillStyle = '#facc15';
  ctx.globalAlpha = 0.6 + zzz * 0.3;
  ctx.font = `${10 + Math.abs(zzz) * 3}px monospace`;
  ctx.fillText('z', 8, -s.shirtH - 12 + Math.sin(time * 0.003) * 3);
  ctx.font = `${8 + Math.abs(zzz) * 2}px monospace`;
  ctx.fillText('z', 14, -s.shirtH - 18 + Math.sin(time * 0.004) * 2);
  ctx.globalAlpha = 1;
}

/* ── Helpers ────────────────────────────────────────────────── */

export function drawHearts(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  count: number,
  time: number,
): void {
  for (let i = 0; i < count; i++) {
    const phase = time * 0.002 + i * 0.8;
    const hx = x + Math.sin(phase) * 15;
    const hy = y - 10 - (time * 0.01 + i * 8) % 40;
    const alpha = 1 - ((time * 0.01 + i * 8) % 40) / 40;
    if (alpha <= 0) continue;
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = '#ef4444';
    ctx.font = '10px sans-serif';
    ctx.fillText('\u2764\uFE0F', hx, hy);
  }
  ctx.globalAlpha = 1;
}

export function drawFlowerBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  time: number,
): void {
  const pulse = 1 + Math.sin(time * 0.003) * 0.15;
  const r = size * pulse;
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + time * 0.001;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(px, py, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

export function drawStarBlossom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  time: number,
): void {
  const rot = time * 0.001;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#fde68a';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
    ctx.lineTo(Math.cos(angle + 0.3) * size * 0.4, Math.sin(angle + 0.3) * size * 0.4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawLetter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
): void {
  /* Envelope */
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x - size / 2, y - size * 0.4, size, size * 0.7);
  /* Flap */
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y - size * 0.4);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size / 2, y - size * 0.4);
  ctx.closePath();
  ctx.fill();
  /* Wax seal */
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(x, y - size * 0.05, size * 0.12, 0, Math.PI * 2);
  ctx.fill();
}
