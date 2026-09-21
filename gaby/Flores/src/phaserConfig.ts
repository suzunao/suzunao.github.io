/* ── Phaser 3 Configuration ─────────────────────────────────── */

import Phaser from 'phaser';

export { Phaser };

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

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
