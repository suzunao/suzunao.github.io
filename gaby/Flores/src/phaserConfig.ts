/* ── Phaser 3 Configuration ─────────────────────────────────── */

import Phaser from 'phaser';

export { Phaser };

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const SPRITE_FRAME = 62;

export const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  input: {
    activePointers: 2,
  },
};

/* ── Sprite-sheet frame mappings (500×500 PNGs, 62×62 frames) ──
   Rows: 0=IDLE, 1=WALKING, 2=SITTING, 3=INVESTIGATING
   Adjust FRAME_WIDTH / FRAME_HEIGHT if characters look wrong. */

export const FRAME_W = SPRITE_FRAME;
export const FRAME_H = SPRITE_FRAME;

/** Frames per row for each animation row (index = row number) */
export const ROW_FRAME_COUNT = [4, 7, 5, 4] as const;

/**
 * Returns the start and end frame indices for a given row.
 * Row 0 starts at 0, row 1 starts at row0*count, etc.
 */
export function rowRange(
  row: number,
  count?: number,
): { start: number; end: number } {
  const fc = count ?? ROW_FRAME_COUNT[row] ?? 4;
  let start = 0;
  for (let r = 0; r < row; r++) {
    start += ROW_FRAME_COUNT[r] ?? 4;
  }
  return { start, end: start + fc - 1 };
}

/** Total frames in a standard 4-row sheet */
export const TOTAL_FRAMES =
  ROW_FRAME_COUNT[0] + ROW_FRAME_COUNT[1] + ROW_FRAME_COUNT[2] + ROW_FRAME_COUNT[3];

/* ── Helper: create all character animations ───────────────── */

export function createCharacterAnims(scene: Phaser.Scene, key: string): void {
  const idle = rowRange(0);
  const walk = rowRange(1);
  const sit = rowRange(2);

  scene.anims.create({
    key: `${key}-idle-front`,
    frames: [{ key, frame: idle.start }],
    frameRate: 1,
  });

  scene.anims.create({
    key: `${key}-walk-front`,
    frames: scene.anims.generateFrameNumbers(key, {
      start: walk.start,
      end: Math.min(walk.start + 2, walk.end),
    }),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: `${key}-walk-left`,
    frames: scene.anims.generateFrameNumbers(key, {
      start: Math.min(walk.start + 3, walk.end),
      end: Math.min(walk.start + 4, walk.end),
    }),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: `${key}-walk-right`,
    frames: scene.anims.generateFrameNumbers(key, {
      start: Math.min(walk.start + 5, walk.end),
      end: Math.min(walk.start + 6, walk.end),
    }),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: `${key}-walk-back`,
    frames: scene.anims.generateFrameNumbers(key, {
      start: walk.start,
      end: Math.min(walk.start + 1, walk.end),
    }),
    frameRate: 8,
    repeat: -1,
  });

  scene.anims.create({
    key: `${key}-sit`,
    frames: scene.anims.generateFrameNumbers(key, {
      start: sit.start,
      end: sit.end,
    }),
    frameRate: 4,
    repeat: -1,
  });
}
