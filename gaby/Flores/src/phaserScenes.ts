/* ── Phaser 3 Scenes ──────────────────────────────────────── */
/* BootScene → SalaScene → GardenScene                         */

import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  createCharacterAnims,
} from './phaserConfig';

/* ══════════════════════════════════════════════════════════════
   BOOT SCENE — preload assets, create animations
   ══════════════════════════════════════════════════════════════ */

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.image('sala-bg', 'sala.jpeg');
    this.load.image('garden-bg', 'campo de flores.jpeg');

    this.load.spritesheet('gaby', 'gaby.png', {
      frameWidth: 62,
      frameHeight: 62,
    });
    this.load.spritesheet('willy', 'willy.png', {
      frameWidth: 62,
      frameHeight: 62,
    });
    this.load.spritesheet('nolan', 'nolan.png', {
      frameWidth: 62,
      frameHeight: 62,
    });
  }

  create(): void {
    createCharacterAnims(this, 'gaby');
    createCharacterAnims(this, 'willy');
    createCharacterAnims(this, 'nolan');
    this.scene.start('SalaScene');
    this.scene.sleep('SalaScene');
  }
}

/* ══════════════════════════════════════════════════════════════
   SALA SCENE — awakening cinematic (4 states)
   ══════════════════════════════════════════════════════════════ */

type SalaState = 'vigilia' | 'cafe' | 'despertar' | 'carta';

export class SalaScene extends Phaser.Scene {
  private gaby!: Phaser.Physics.Arcade.Sprite;
  private willy!: Phaser.Physics.Arcade.Sprite;
  private nolan!: Phaser.Physics.Arcade.Sprite;
  private state: SalaState = 'vigilia';
  private dialogueText!: Phaser.GameObjects.Text;
  private letterDelivered = false;

  public onSalaComplete: (() => void) | null = null;

  constructor() {
    super('SalaScene');
  }

  create(): void {
    this.letterDelivered = false;
    this.state = 'vigilia';

    /* ── background ─────────────────────────────────────────── */
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'sala-bg')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    /* ── characters (origin bottom-centre for Y-sorting) ───── */
    this.gaby = this.physics.add
      .sprite(GAME_WIDTH * 0.45, GAME_HEIGHT * 0.6, 'gaby')
      .setOrigin(0.5, 1)
      .setDepth(GAME_HEIGHT * 0.6)
      .setScale(2.2);

    this.willy = this.physics.add
      .sprite(GAME_WIDTH * 0.58, GAME_HEIGHT * 0.55, 'willy')
      .setOrigin(0.5, 1)
      .setDepth(GAME_HEIGHT * 0.55)
      .setScale(2.2)
      .play('willy-sit');

    this.nolan = this.physics.add
      .sprite(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.45, 'nolan')
      .setOrigin(0.5, 1)
      .setDepth(GAME_HEIGHT * 0.45)
      .setScale(2.2)
      .play('nolan-idle-front');

    /* ── dialogue text (bottom of screen) ───────────────────── */
    this.dialogueText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 80, '', {
        fontFamily: 'Crimson Pro, serif',
        fontSize: '18px',
        color: '#ffeccf',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 80 },
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    /* ── kick off cinematic ─────────────────────────────────── */
    this.runCinematic();
  }

  update(): void {
    this.gaby.setDepth(this.gaby.y);
    this.willy.setDepth(this.willy.y);
    this.nolan.setDepth(this.nolan.y);
  }

  /* ── helpers ──────────────────────────────────────────────── */

  private showDialogue(
    speaker: string,
    text: string,
    duration = 3000,
  ): Promise<void> {
    return new Promise((resolve) => {
      const label =
        speaker === 'gaby'
          ? 'Gaby'
          : speaker === 'willy'
            ? 'Wylli'
            : speaker === 'nolan'
              ? 'Nolan'
              : 'Radio';
      this.dialogueText.setText(`[${label}] ${text}`);
      this.tweens.add({
        targets: this.dialogueText,
        alpha: 1,
        duration: 300,
      });
      this.time.delayedCall(duration, () => {
        this.tweens.add({
          targets: this.dialogueText,
          alpha: 0,
          duration: 400,
          onComplete: () => resolve(),
        });
      });
    });
  }

  private walkTo(
    sprite: Phaser.Physics.Arcade.Sprite,
    tx: number,
    ty: number,
    speed = 120,
  ): Promise<void> {
    return new Promise((resolve) => {
      const dx = tx - sprite.x;
      const dir = dx < 0 ? 'left' : 'right';
      const animKey = `${sprite.texture.key}-walk-${dir}`;
      if (this.anims.exists(animKey)) sprite.play(animKey);

      this.physics.moveTo(sprite, tx, ty, speed);

      const check = this.time.addEvent({
        delay: 50,
        loop: true,
        callback: () => {
          const dist = Phaser.Math.Distance.Between(
            sprite.x,
            sprite.y,
            tx,
            ty,
          );
          if (dist < 8) {
            sprite.setVelocity(0, 0);
            check.remove();
            const idleKey = `${sprite.texture.key}-idle-front`;
            if (this.anims.exists(idleKey)) sprite.play(idleKey);
            resolve();
          }
        },
      });
    });
  }

  private spawnHearts(x: number, y: number, count = 6): void {
    for (let i = 0; i < count; i++) {
      const heart = this.add
        .text(
          x + (Math.random() - 0.5) * 40,
          y - 20,
          '\u2764\uFE0F',
          { fontSize: '16px' },
        )
        .setOrigin(0.5)
        .setAlpha(1)
        .setDepth(2000);

      this.tweens.add({
        targets: heart,
        y: heart.y - 60 - Math.random() * 30,
        alpha: 0,
        duration: 1500 + Math.random() * 500,
        ease: 'Cubic.easeOut',
        onComplete: () => heart.destroy(),
      });
    }
  }

  /* ── main cinematic flow ──────────────────────────────────── */

  private async runCinematic(): Promise<void> {
    /* STATE 1 — VIGILIA */
    this.state = 'vigilia';
    await this.showDialogue(
      'nolan',
      'Radio: Detective Gaby, proceda con Caf\u00E9 Supremo. El sospechoso sigue dormido.',
      4000,
    );

    /* STATE 2 — CAF\u00C9 */
    this.state = 'cafe';
    await this.walkTo(this.gaby, GAME_WIDTH * 0.25, GAME_HEIGHT * 0.48);
    this.showDialogue(
      'gaby',
      'Un Caf\u00E9 Supremo, justo como le gusta a mi Wylli...',
      3000,
    );
    /* steam particle burst */
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 800,
      onUpdate: (_tween: Phaser.Tweens.Tween) => {
        if (Math.random() > 0.6) {
          const p = this.add
            .circle(
              GAME_WIDTH * 0.25 + (Math.random() - 0.5) * 20,
              GAME_HEIGHT * 0.44,
              3 + Math.random() * 4,
              0xffffff,
              0.6,
            )
            .setDepth(900);
          this.tweens.add({
            targets: p,
            y: p.y - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => p.destroy(),
          });
        }
      },
    });
    await this.delay(2500);

    /* STATE 3 — DESPERTAR */
    this.state = 'despertar';
    await this.walkTo(this.gaby, GAME_WIDTH * 0.55, GAME_HEIGHT * 0.55);

    await this.delay(500);
    if (this.anims.exists('willy-idle-front')) {
      this.willy.play('willy-idle-front');
    }
    await this.delay(600);

    this.spawnHearts(
      (this.gaby.x + this.willy.x) / 2,
      Math.min(this.gaby.y, this.willy.y) - 40,
      8,
    );

    await this.showDialogue(
      'willy',
      'Mi detective favorita... despert\u00E9 gracias a ti. Te estuve preparando esto todo este tiempo...',
      5000,
    );

    /* STATE 4 — CARTA + TRANSICI\u00D3N */
    this.state = 'carta';

    await this.walkTo(this.willy, this.gaby.x - 40, this.gaby.y);
    await this.showDialogue(
      'willy',
      'Es para ti, con todo mi amor \u2764\uFE0F',
      3000,
    );
    this.letterDelivered = true;

    if (this.anims.exists('nolan-walk-front')) {
      this.nolan.play('nolan-walk-front');
    }
    await this.walkTo(this.nolan, GAME_WIDTH * 0.5, GAME_HEIGHT * 0.95);
    this.nolan.setAlpha(0);

    this.showDialogue('nolan', 'Radio: 10-4. Me retiro. Cu\u00EDdense.', 2500);
    await this.delay(2000);

    await Promise.all([
      this.walkTo(this.gaby, GAME_WIDTH * 0.5, GAME_HEIGHT * 0.95),
      this.walkTo(this.willy, GAME_WIDTH * 0.55, GAME_HEIGHT * 0.95),
    ]);

    this.cameras.main.fadeOut(1500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.onSalaComplete) this.onSalaComplete();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => this.time.delayedCall(ms, r));
  }
}

/* ══════════════════════════════════════════════════════════════
   GARDEN SCENE — flower field (plant + bloom)
   ══════════════════════════════════════════════════════════════ */

interface GardenFlower {
  sprite: Phaser.GameObjects.Image;
  type: string;
  baseY: number;
  swayPhase: number;
}

const FLOWER_TYPES = [
  { key: 'sunflower', emoji: '\uD83C\uDF3B', color: '#ffd700' },
  { key: 'daisy', emoji: '\uD83C\uDF3C', color: '#fffacd' },
  { key: 'goldenRose', emoji: '\uD83C\uDF39', color: '#daa520' },
  { key: 'starBlossom', emoji: '\u2B50', color: '#ffe4b5' },
];

export class GardenScene extends Phaser.Scene {
  private flowers: GardenFlower[] = [];
  private gaby!: Phaser.Physics.Arcade.Sprite;
  private bloomIndex = 0;
  private letterOverlayShown = false;
  private flowerTextures: string[] = [];

  public onGardenReady: (() => void) | null = null;

  constructor() {
    super('GardenScene');
  }

  create(): void {
    this.flowers = [];
    this.bloomIndex = 0;
    this.letterOverlayShown = false;
    this.flowerTextures = [];

    /* ── background ─────────────────────────────────────────── */
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'garden-bg')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    /* ── Gaby enters from left ──────────────────────────────── */
    this.gaby = this.physics.add
      .sprite(-30, GAME_HEIGHT * 0.65, 'gaby')
      .setOrigin(0.5, 1)
      .setDepth(GAME_HEIGHT * 0.65)
      .setScale(2.2)
      .play('gaby-walk-right');

    this.tweens.add({
      targets: this.gaby,
      x: GAME_WIDTH * 0.4,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.gaby.setVelocity(0, 0);
        if (this.anims.exists('gaby-idle-front')) {
          this.gaby.play('gaby-idle-front');
        }
        if (this.onGardenReady) this.onGardenReady();
      },
    });

    /* ── input ──────────────────────────────────────────────── */
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.y < GAME_HEIGHT * 0.35) return;
      this.plantFlower(ptr.x, ptr.y);
    });

    const spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    spaceKey?.on('down', () => this.bloomNext());

    /* ── sway update ────────────────────────────────────────── */
    this.events.on('update', () => this.updateSway());
  }

  /* ── flower planting ────────────────────────────────────── */

  private plantFlower(x: number, y: number): void {
    const ft = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)];

    const texKey = `flower-${this.flowerTextures.length}`;
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(ft.color).color, 1);
    g.fillCircle(12, 12, 10);
    g.generateTexture(texKey, 24, 24);
    g.destroy();
    this.flowerTextures.push(texKey);

    const sprite = this.add
      .image(x, y, texKey)
      .setOrigin(0.5, 1)
      .setDepth(y)
      .setScale(0);

    this.tweens.add({
      targets: sprite,
      scale: 1.2,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const flower: GardenFlower = {
      sprite,
      type: ft.key,
      baseY: y,
      swayPhase: Math.random() * Math.PI * 2,
    };
    this.flowers.push(flower);
  }

  /* ── bloom next flower ──────────────────────────────────── */

  private bloomNext(): void {
    if (this.bloomIndex >= this.flowers.length) return;
    const f = this.flowers[this.bloomIndex];
    this.bloomIndex++;

    this.tweens.add({
      targets: f.sprite,
      scale: 2,
      duration: 300,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });

    for (let i = 0; i < 5; i++) {
      const spark = this.add
        .text(
          f.sprite.x + (Math.random() - 0.5) * 30,
          f.sprite.y - 10,
          '\u2728',
          { fontSize: '12px' },
        )
        .setOrigin(0.5)
        .setDepth(3000);
      this.tweens.add({
        targets: spark,
        y: spark.y - 40 - Math.random() * 20,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        onComplete: () => spark.destroy(),
      });
    }

    if (this.bloomIndex >= this.flowers.length && !this.letterOverlayShown) {
      this.letterOverlayShown = true;
      this.time.delayedCall(1200, () => {
        document.getElementById('vwLetterOverlay')?.classList.add('active');
      });
    }
  }

  /* ── sway animation ─────────────────────────────────────── */

  private updateSway(): void {
    const t = this.time.now * 0.001;
    for (const f of this.flowers) {
      const sway = Math.sin(t * 1.5 + f.swayPhase) * 3;
      f.sprite.x = f.sprite.x + sway * 0.02;
    }
  }
}
