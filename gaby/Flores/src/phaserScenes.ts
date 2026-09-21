/* ── Phaser 3 Scenes — Programmatic Characters ────────────── */
/* No sprite sheets. Characters drawn with Canvas 2D primitives. */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './phaserConfig';
import {
  drawCharacter,
  drawHearts,
  drawFlowerBloom,
  drawStarBlossom,
  drawLetter,
} from './characters';
import type { CharState } from './characters';

/* ══════════════════════════════════════════════════════════════
   BOOT SCENE — minimal (no asset loading needed)
   ══════════════════════════════════════════════════════════════ */

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('SalaScene');
  }
}

/* ══════════════════════════════════════════════════════════════
   SALA SCENE — awakening cinematic (3 phases)
   Characters drawn programmatically with Canvas 2D primitives
   ══════════════════════════════════════════════════════════════ */

type SalaPhase =
  | 'initial'
  | 'walkToCoffee'
  | 'makingCoffee'
  | 'returnToSofa'
  | 'awakening'
  | 'letterDelivery'
  | 'nolanFarewell'
  | 'walkToExit'
  | 'fadeOut';

interface CharPos {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  state: CharState;
  dir: 'left' | 'right';
}

export class SalaScene extends Phaser.Scene {
  private gaby!: CharPos;
  private willy!: CharPos;
  private nolan!: CharPos;
  private phase: SalaPhase = 'initial';
  private phaseTimer = 0;
  private graphics!: Phaser.GameObjects.Graphics;
  private heartsActive = false;
  private heartsStartTime = 0;
  private dialogueText = '';
  private dialogueAlpha = 0;

  public onSalaComplete: (() => void) | null = null;

  constructor() {
    super('SalaScene');
  }

  create(): void {
    this.phase = 'initial';
    this.phaseTimer = 0;
    this.heartsActive = false;
    this.dialogueText = '';
    this.dialogueAlpha = 0;

    this.graphics = this.add.graphics();

    /* Initial positions (bottom-centre origin) */
    this.gaby = {
      x: GAME_WIDTH * 0.45,
      y: GAME_HEIGHT * 0.62,
      targetX: GAME_WIDTH * 0.45,
      targetY: GAME_HEIGHT * 0.62,
      state: 'idle',
      dir: 'right',
    };

    this.willy = {
      x: GAME_WIDTH * 0.58,
      y: GAME_HEIGHT * 0.56,
      targetX: GAME_WIDTH * 0.58,
      targetY: GAME_HEIGHT * 0.56,
      state: 'sleep',
      dir: 'left',
    };

    this.nolan = {
      x: GAME_WIDTH * 0.82,
      y: GAME_HEIGHT * 0.46,
      targetX: GAME_WIDTH * 0.82,
      targetY: GAME_HEIGHT * 0.46,
      state: 'idle',
      dir: 'left',
    };

    this.showDialogue('Radio: Detective Gaby, proceda con Caf\u00E9 Supremo.');
    this.time.delayedCall(3500, () => this.startPhase('walkToCoffee'));
  }

  update(_time: number, delta: number): void {
    const t = this.time.now;
    this.phaseTimer += delta;

    /* Move characters towards targets */
    this.moveChar(this.gaby, delta);
    this.moveChar(this.willy, delta);
    this.moveChar(this.nolan, delta);

    /* Phase logic */
    this.updatePhase(t, delta);

    /* Render */
    this.graphics.clear();
    this.renderBackground();
    this.renderDialogue(t);

    /* Y-sorting: draw characters by y position */
    const chars = [this.gaby, this.willy, this.nolan].sort(
      (a, b) => a.y - b.y,
    );
    for (const c of chars) {
      drawCharacter(this.graphics as any, c.x, c.y, this.getCharKey(c), c.state, t, c.dir);
    }

    /* Hearts overlay */
    if (this.heartsActive) {
      drawHearts(
        this.graphics as any,
        (this.gaby.x + this.willy.x) / 2,
        Math.min(this.gaby.y, this.willy.y) - 30,
        8,
        t - this.heartsStartTime,
      );
    }
  }

  /* ── Phase machine ──────────────────────────────────────── */

  private updatePhase(t: number, _delta: number): void {
    switch (this.phase) {
      case 'walkToCoffee':
        if (this.isAtTarget(this.gaby)) {
          this.startPhase('makingCoffee');
        }
        break;

      case 'makingCoffee':
        if (this.phaseTimer > 3000) {
          this.showDialogue('Un Caf\u00E9 Supremo, justo como le gusta a mi Wylli...');
          this.startPhase('returnToSofa');
        }
        break;

      case 'returnToSofa':
        if (this.isAtTarget(this.gaby)) {
          this.startPhase('awakening');
        }
        break;

      case 'awakening':
        if (this.phaseTimer > 500) {
          this.willy.state = 'idle';
        }
        if (this.phaseTimer > 1200 && !this.heartsActive) {
          this.heartsActive = true;
          this.heartsStartTime = t;
          this.showDialogue('Mi detective favorita... despert\u00E9 gracias a ti...');
        }
        if (this.phaseTimer > 5000) {
          this.startPhase('letterDelivery');
        }
        break;

      case 'letterDelivery':
        if (this.phaseTimer > 2000) {
          this.showDialogue('Es para ti, con todo mi amor \u2764\uFE0F');
        }
        if (this.phaseTimer > 4500) {
          this.startPhase('nolanFarewell');
        }
        break;

      case 'nolanFarewell':
        if (this.phaseTimer > 500) {
          this.showDialogue('Radio: 10-4. Caso concluido. Cu\u00EDdense.');
        }
        if (this.phaseTimer > 3000) {
          this.nolan.targetX = GAME_WIDTH * 0.5;
          this.nolan.targetY = GAME_HEIGHT * 0.98;
          this.nolan.state = 'walk';
          this.nolan.dir = 'left';
        }
        if (this.phaseTimer > 4500) {
          this.nolan.state = 'idle';
          this.nolan.y = -100;
          this.startPhase('walkToExit');
        }
        break;

      case 'walkToExit':
        if (this.isAtTarget(this.gaby) && this.isAtTarget(this.willy)) {
          this.startPhase('fadeOut');
        }
        break;

      case 'fadeOut':
        if (this.phaseTimer > 1500) {
          if (this.onSalaComplete) this.onSalaComplete();
        }
        break;
    }
  }

  private startPhase(phase: SalaPhase): void {
    this.phase = phase;
    this.phaseTimer = 0;

    switch (phase) {
      case 'walkToCoffee':
        this.gaby.targetX = GAME_WIDTH * 0.25;
        this.gaby.targetY = GAME_HEIGHT * 0.5;
        this.gaby.state = 'walk';
        this.gaby.dir = 'left';
        break;

      case 'makingCoffee':
        this.gaby.state = 'idle';
        this.gaby.dir = 'right';
        this.showDialogue('Preparando Caf\u00E9 Supremo...');
        break;

      case 'returnToSofa':
        this.gaby.targetX = GAME_WIDTH * 0.55;
        this.gaby.targetY = GAME_HEIGHT * 0.56;
        this.gaby.state = 'walk';
        this.gaby.dir = 'right';
        break;

      case 'awakening':
        this.gaby.state = 'idle';
        this.gaby.dir = 'left';
        break;

      case 'letterDelivery':
        this.heartsActive = false;
        this.willy.targetX = this.gaby.x - 30;
        this.willy.targetY = this.gaby.y;
        this.willy.state = 'walk';
        this.willy.dir = 'left';
        break;

      case 'walkToExit':
        this.gaby.targetX = GAME_WIDTH * 0.5;
        this.gaby.targetY = GAME_HEIGHT * 0.98;
        this.gaby.state = 'walk';
        this.gaby.dir = 'left';

        this.willy.targetX = GAME_WIDTH * 0.55;
        this.willy.targetY = GAME_HEIGHT * 0.98;
        this.willy.state = 'walk';
        this.willy.dir = 'left';
        break;

      case 'fadeOut':
        this.cameras.main.fadeOut(1500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (this.onSalaComplete) this.onSalaComplete();
        });
        break;
    }
  }

  /* ── Movement ───────────────────────────────────────────── */

  private moveChar(c: CharPos, delta: number): void {
    if (c.state !== 'walk') return;
    const speed = 0.08;
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) {
      c.x = c.targetX;
      c.y = c.targetY;
      c.state = 'idle';
      return;
    }
    c.x += (dx / dist) * speed * delta;
    c.y += (dy / dist) * speed * delta;
  }

  private isAtTarget(c: CharPos): boolean {
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    return Math.sqrt(dx * dx + dy * dy) < 3;
  }

  /* ── Rendering ──────────────────────────────────────────── */

  private renderBackground(): void {
    const g = this.graphics;
    /* Dark cabin interior */
    g.fillStyle(0x1a120d);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    /* Floor */
    g.fillStyle(0x2b1b24);
    g.fillRect(0, GAME_HEIGHT * 0.55, GAME_WIDTH, GAME_HEIGHT * 0.45);

    /* Sofa (green) */
    g.fillStyle(0x2d5a37);
    g.fillRoundedRect(GAME_WIDTH * 0.15, GAME_HEIGHT * 0.48, GAME_WIDTH * 0.32, GAME_HEIGHT * 0.16, 8);
    g.fillStyle(0x22452a);
    g.fillRect(GAME_WIDTH * 0.13, GAME_HEIGHT * 0.50, GAME_WIDTH * 0.03, GAME_HEIGHT * 0.12);
    g.fillRect(GAME_WIDTH * 0.45, GAME_HEIGHT * 0.50, GAME_WIDTH * 0.03, GAME_HEIGHT * 0.12);

    /* Coffee machine area */
    g.fillStyle(0x374151);
    g.fillRoundedRect(GAME_WIDTH * 0.18, GAME_HEIGHT * 0.38, GAME_WIDTH * 0.12, GAME_HEIGHT * 0.18, 4);
    g.fillStyle(0x6b7280);
    g.fillRect(GAME_WIDTH * 0.22, GAME_HEIGHT * 0.40, GAME_WIDTH * 0.04, GAME_HEIGHT * 0.04);

    /* Fireplace */
    g.fillStyle(0x7c2d12);
    g.fillRoundedRect(GAME_WIDTH * 0.75, GAME_HEIGHT * 0.32, GAME_WIDTH * 0.15, GAME_HEIGHT * 0.22, 6);
    g.fillStyle(0xf97316);
    g.fillRect(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.40, GAME_WIDTH * 0.08, GAME_HEIGHT * 0.10);

    /* Door */
    g.fillStyle(0x92400e);
    g.fillRect(GAME_WIDTH * 0.46, GAME_HEIGHT * 0.88, GAME_WIDTH * 0.08, GAME_HEIGHT * 0.12);
    g.fillStyle(0xfbbf24);
    g.fillRect(GAME_WIDTH * 0.52, GAME_HEIGHT * 0.93, 3, 3);
  }

  private renderDialogue(t: number): void {
    if (this.dialogueAlpha <= 0 || !this.dialogueText) return;
    const g = this.graphics;
    const alpha = Math.min(1, this.dialogueAlpha);
    const textW = this.dialogueText.length * 5.5 + 40;
    const boxW = Math.min(textW, GAME_WIDTH - 60);
    const boxH = 36;
    const boxX = (GAME_WIDTH - boxW) / 2;
    const boxY = GAME_HEIGHT - 60;

    g.fillStyle(0x2b1b24, alpha * 0.92);
    g.fillRoundedRect(boxX, boxY, boxW, boxH, 8);
    g.lineStyle(1, 0xf5c538, alpha * 0.6);
    g.strokeRoundedRect(boxX, boxY, boxW, boxH, 8);
  }

  /* ── Helpers ────────────────────────────────────────────── */

  private getCharKey(c: CharPos): 'gaby' | 'willy' | 'nolan' {
    if (c === this.gaby) return 'gaby';
    if (c === this.willy) return 'willy';
    return 'nolan';
  }

  private showDialogue(text: string): void {
    this.dialogueText = text;
    this.dialogueAlpha = 0;
    this.tweens.add({
      targets: this,
      dialogueAlpha: 1,
      duration: 400,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }
}

/* ══════════════════════════════════════════════════════════════
   GARDEN SCENE — flower field (plant + bloom + bench)
   Characters drawn programmatically with Canvas 2D primitives
   ══════════════════════════════════════════════════════════════ */

interface GardenFlower {
  x: number;
  y: number;
  type: 'sunflower' | 'daisy' | 'goldenRose' | 'starBlossom';
  size: number;
  swayPhase: number;
  baseX: number;
}

const FLOWER_COLORS: Record<string, string> = {
  sunflower: '#facc15',
  daisy: '#fef3c7',
  goldenRose: '#daa520',
  starBlossom: '#fde68a',
};

export class GardenScene extends Phaser.Scene {
  private gaby!: CharPos;
  private willy!: CharPos;
  private flowers: GardenFlower[] = [];
  private graphics!: Phaser.GameObjects.Graphics;
  private bloomIndex = 0;
  private enteredBench = false;
  private benchFlowersActive = false;

  public onGardenReady: (() => void) | null = null;

  constructor() {
    super('GardenScene');
  }

  create(): void {
    this.flowers = [];
    this.bloomIndex = 0;
    this.enteredBench = false;
    this.benchFlowersActive = false;

    this.graphics = this.add.graphics();

    /* Gaby enters from left */
    this.gaby = {
      x: -30,
      y: GAME_HEIGHT * 0.65,
      targetX: GAME_WIDTH * 0.45,
      targetY: GAME_HEIGHT * 0.6,
      state: 'walk',
      dir: 'right',
    };

    /* Wylli at bench */
    this.willy = {
      x: GAME_WIDTH * 0.55,
      y: GAME_HEIGHT * 0.6,
      targetX: GAME_WIDTH * 0.55,
      targetY: GAME_HEIGHT * 0.6,
      state: 'idle',
      dir: 'left',
    };

    /* Input: click to plant flowers */
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < GAME_HEIGHT * 0.35) return;
      this.plantFlower(ptr.x, ptr.y);
    });

    /* Space to bloom next flower */
    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    spaceKey?.on('down', () => this.bloomNext());

    if (this.onGardenReady) this.onGardenReady();
  }

  update(_time: number, delta: number): void {
    const t = this.time.now;

    /* Move characters */
    this.moveChar(this.gaby, delta);
    this.moveChar(this.willy, delta);

    /* Check if Gaby reached bench */
    if (
      !this.enteredBench &&
      this.isAtTarget(this.gaby) &&
      this.gaby.x > GAME_WIDTH * 0.4
    ) {
      this.enteredBench = true;
      this.gaby.state = 'sit';
      this.willy.state = 'sit';
      this.willy.dir = 'right';
      this.benchFlowersActive = true;
    }

    /* Render */
    this.graphics.clear();
    this.renderBackground();

    /* Bench */
    this.renderBench();

    /* Y-sort characters */
    const chars = [this.gaby, this.willy].sort((a, b) => a.y - b.y);
    for (const c of chars) {
      drawCharacter(
        this.graphics as any,
        c.x,
        c.y,
        c === this.gaby ? 'gaby' : 'willy',
        c.state,
        t,
        c.dir,
      );
    }

    /* Planted flowers */
    for (const f of this.flowers) {
      const sway = Math.sin(t * 0.0015 + f.swayPhase) * 2;
      const fx = f.baseX + sway;
      if (f.type === 'starBlossom') {
        drawStarBlossom(this.graphics as any, fx, f.y, f.size, t);
      } else {
        drawFlowerBloom(this.graphics as any, fx, f.y, f.size, FLOWER_COLORS[f.type], t);
      }
    }

    /* Auto-bloom ring around couple when seated */
    if (this.benchFlowersActive) {
      this.renderBenchFlowerRing(t);
    }
  }

  /* ── Flower ring around bench ──────────────────────────── */

  private renderBenchFlowerRing(t: number): void {
    const cx = (this.gaby.x + this.willy.x) / 2;
    const cy = (this.gaby.y + this.willy.y) / 2 - 10;
    const count = 12;
    const radius = 50;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const fx = cx + Math.cos(angle) * radius;
      const fy = cy + Math.sin(angle) * radius * 0.5;
      const size = 4 + Math.sin(t * 0.002 + i) * 1;
      const colors = ['#facc15', '#fef3c7', '#daa520', '#fde68a'];
      drawFlowerBloom(
        this.graphics as any,
        fx,
        fy,
        size,
        colors[i % colors.length],
        t,
      );
    }

    /* Center star blossom */
    drawStarBlossom(this.graphics as any, cx, cy - 25, 6, t);

    /* Letter overlay appears after a moment */
    if (this.benchFlowersActive && t > 5000) {
      drawLetter(this.graphics as any, cx, cy - 50, 20);
    }
  }

  /* ── Background ────────────────────────────────────────── */

  private renderBackground(): void {
    const g = this.graphics;
    /* Sky gradient */
    g.fillStyle(0x87ceeb);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);
    g.fillStyle(0x98d8a0);
    g.fillRect(0, GAME_HEIGHT * 0.35, GAME_WIDTH, GAME_HEIGHT * 0.15);
    /* Grass */
    g.fillStyle(0x4ade80);
    g.fillRect(0, GAME_HEIGHT * 0.45, GAME_WIDTH, GAME_HEIGHT * 0.55);
    /* Path */
    g.fillStyle(0xd4a574);
    g.fillRect(GAME_WIDTH * 0.3, GAME_HEIGHT * 0.55, GAME_WIDTH * 0.4, GAME_HEIGHT * 0.08);
  }

  private renderBench(): void {
    const g = this.graphics;
    const bx = GAME_WIDTH * 0.42;
    const by = GAME_HEIGHT * 0.58;
    /* Bench legs */
    g.fillStyle(0x78350f);
    g.fillRect(bx, by + 8, 4, 12);
    g.fillRect(bx + 70, by + 8, 4, 12);
    /* Bench seat */
    g.fillStyle(0x92400e);
    g.fillRoundedRect(bx - 5, by, 84, 10, 3);
    /* Bench back */
    g.fillStyle(0xa16207);
    g.fillRoundedRect(bx - 3, by - 14, 80, 6, 2);
  }

  /* ── Planting ──────────────────────────────────────────── */

  private plantFlower(x: number, y: number): void {
    const types: GardenFlower['type'][] = [
      'sunflower',
      'daisy',
      'goldenRose',
      'starBlossom',
    ];
    this.flowers.push({
      x,
      y,
      baseX: x,
      type: types[Math.floor(Math.random() * types.length)],
      size: 3 + Math.random() * 3,
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  private bloomNext(): void {
    if (this.bloomIndex >= this.flowers.length) return;
    this.bloomIndex++;
  }

  /* ── Movement ──────────────────────────────────────────── */

  private moveChar(c: CharPos, delta: number): void {
    if (c.state !== 'walk') return;
    const speed = 0.08;
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) {
      c.x = c.targetX;
      c.y = c.targetY;
      c.state = 'idle';
      return;
    }
    c.x += (dx / dist) * speed * delta;
    c.y += (dy / dist) * speed * delta;
  }

  private isAtTarget(c: CharPos): boolean {
    const dx = c.targetX - c.x;
    const dy = c.targetY - c.y;
    return Math.sqrt(dx * dx + dy * dy) < 3;
  }
}
