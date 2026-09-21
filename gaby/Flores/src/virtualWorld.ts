/* ── Virtual World — Phaser 3 migration ──────────────────────── */
/* Rendering moved to src/phaserScenes.ts (GardenScene).          */
/* Interfaces kept for type compatibility.                        */

export interface VirtualFlower {
  x: number;
  y: number;
  type: 'sunflower' | 'daisy' | 'goldenRose' | 'starBlossom';
  scale: number;
  targetScale: number;
  rotation: number;
  stemHeight: number;
  color: string;
  bloomSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface VirtualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'pollen' | 'petal' | 'heart' | 'sparkle';
}

/**
 * Stub class — all rendering is now handled by Phaser 3 GardenScene.
 * Kept so existing `virtualWorldGame.init()` / `.open()` calls compile.
 */
export class VirtualWorldGame {
  public init(): void { /* no-op — Phaser handles rendering */ }
  public open(): void { /* no-op — use openGardenScene() in game.ts */ }
}

export const virtualWorldGame = new VirtualWorldGame();
