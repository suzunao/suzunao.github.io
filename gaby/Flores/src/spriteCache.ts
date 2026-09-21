/* ── Sprite Sheet Cache ──────────────────────────────────────── */
/* Loads PNG sprite sheets and extracts idle frames as data URLs  */
/* for use in HTML UI (replacing SVG geometric avatars).          */

const FRAME_SIZE = 62;
const SHEETS: Record<string, string> = {
  gaby: 'gaby.png',
  willy: 'willy.png',
  nolan: 'nolan.png',
};

const cache: Record<string, string> = {};
let loaded = false;

function extractFrame(
  img: HTMLImageElement,
  row: number,
  col: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_SIZE;
  canvas.height = FRAME_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    col * FRAME_SIZE,
    row * FRAME_SIZE,
    FRAME_SIZE,
    FRAME_SIZE,
    0,
    0,
    FRAME_SIZE,
    FRAME_SIZE,
  );
  return canvas.toDataURL('image/png');
}

function loadSheet(key: string, src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      cache[key] = extractFrame(img, 0, 0);
      cache[`${key}-walk`] = extractFrame(img, 1, 0);
      cache[`${key}-sit`] = extractFrame(img, 2, 0);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export async function initSpriteCache(): Promise<void> {
  if (loaded) return;
  await Promise.all(
    Object.entries(SHEETS).map(([k, src]) => loadSheet(k, src)),
  );
  loaded = true;
}

export function getSpriteDataUrl(key: string): string | null {
  return cache[key] ?? null;
}

export function isSpriteCacheReady(): boolean {
  return loaded;
}
