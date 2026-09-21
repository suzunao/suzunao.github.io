import { audio } from './audio';

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

interface BloomEntry {
  x: number;
  y: number;
  delay: number;
}

export class VirtualWorldGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private isRunning: boolean = false;
  private animId: number | null = null;

  // Background image
  private bgImage: HTMLImageElement | null = null;
  private bgLoaded = false;

  // Sprite sheets (2048x2048, 16x16 grid, 128x128 per frame)
  private spriteGaby: HTMLImageElement | null = null;
  private spriteWylli: HTMLImageElement | null = null;
  private spriteNolan: HTMLImageElement | null = null;
  private spritesLoaded = { gaby: false, wylli: false, nolan: false };

  // Characters
  public player = {
    x: 0,
    y: 0,
    speed: 1.2,
    isWalking: true,
    facingLeft: false,
    stepCycle: 0,
  };

  public companion = {
    x: 0,
    y: 0,
    speed: 1.2,
    isWalking: true,
    facingLeft: false,
    stepCycle: 0,
    bubbleText: 'Ven conmigo...',
    bubbleTimer: 0,
    bubbleDelay: 60,
  };

  // Walk system — waypoint-based
  private walkPhase: 'farewell' | 'approaching' | 'sitting' | 'done' = 'farewell';
  private waypointIndex = 0;
  private isSitting = false;
  private freeMode = false;

  // Camera
  private camera = { x: 0, y: 0 };

  // Input
  private keys: Record<string, boolean> = {};

  // World Elements
  private flowers: VirtualFlower[] = [];
  private particles: VirtualParticle[] = [];

  // Bloom queue
  private bloomQueue: BloomEntry[] = [];
  private bloomIndex = 0;
  private bloomInterval: ReturnType<typeof setInterval> | null = null;

  // Floating petals (cherry blossom pink)
  private floatingPetals: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; rot: number; rotSpeed: number }[] = [];

  // Dialogue
  private dialogueAlpha = 0;
  private dialogueStarted = false;

  // Flower count
  public flowerCount = 0;

  // DOM elements
  private dialogueEl: HTMLElement | null = null;
  private flowerCountEl: HTMLElement | null = null;

  // Anchor points (percentage of canvas)
  private static ANCHORS = {
    spawn: { x: 92, y: 62 },
    wp1: { x: 82, y: 55 },
    wp2: { x: 60, y: 54 },
    wp3: { x: 38, y: 56 },
    bench: { x: 35, y: 54 },
    pond: { x1: 12, y1: 68, x2: 42, y2: 90 },
    cherry: { x: 28, y: 56 },
    blanket: { x: 68, y: 65 },
    grandMantle: { x1: 45, y1: 25, x2: 95, y2: 48 },
  };

  // Waypoints for path walking (in order)
  private static WAYPOINTS = [
    VirtualWorldGame.ANCHORS.spawn,
    VirtualWorldGame.ANCHORS.wp1,
    VirtualWorldGame.ANCHORS.wp2,
    VirtualWorldGame.ANCHORS.wp3,
    VirtualWorldGame.ANCHORS.bench,
  ];

  constructor() {}

  public init() {
    this.canvas = document.getElementById('virtualWorldCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext('2d') || null;
    this.container = document.getElementById('virtualWorldModal');
    this.dialogueEl = document.getElementById('awakeningDialogue');
    this.flowerCountEl = null; // No longer in DOM

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Load background image
    this.bgImage = new Image();
    this.bgImage.src = 'campo de flores.jpeg';
    this.bgImage.onload = () => { this.bgLoaded = true; };

    // Load sprite sheets
    this.loadSpriteSheet('gaby', 'gaby.jpeg');
    this.loadSpriteSheet('wylli', 'willy.jpeg');
    this.loadSpriteSheet('nolan', 'nolan.jpeg');

    this.generateFloatingPetals();
    this.setupInputs();
  }

  private resizeCanvas() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const topBar = this.container.querySelector('.vw-top-bar') as HTMLElement;
    const barH = topBar?.offsetHeight || 50;
    this.canvas.width = rect.width;
    this.canvas.height = rect.height - barH;
  }

  private loadSpriteSheet(name: 'gaby' | 'wylli' | 'nolan', src: string) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.spritesLoaded[name] = true;
      if (name === 'gaby') this.spriteGaby = img;
      if (name === 'wylli') this.spriteWylli = img;
      if (name === 'nolan') this.spriteNolan = img;
    };
  }

  public open() {
    if (!this.container) this.init();
    if (!this.container) return;

    this.container.classList.add('active');
    this.resizeCanvas();
    this.isRunning = true;

    // Reset state
    this.walkPhase = 'farewell';
    this.waypointIndex = 0;
    this.isSitting = false;
    this.freeMode = false;
    this.dialogueAlpha = 0;
    this.dialogueStarted = false;
    this.bloomIndex = 0;
    this.flowers = [];
    this.particles = [];
    this.flowerCount = 0;

    // Position characters at spawn point (percentage -> pixels)
    const w = this.canvas?.width || 1200;
    const h = this.canvas?.height || 900;
    this.player.x = (VirtualWorldGame.ANCHORS.spawn.x / 100) * w;
    this.player.y = (VirtualWorldGame.ANCHORS.spawn.y / 100) * h;
    this.player.stepCycle = 0;
    this.player.isWalking = false;
    this.player.facingLeft = false;
    this.companion.x = this.player.x + 20;
    this.companion.y = this.player.y + 2;
    this.companion.stepCycle = 0;
    this.companion.isWalking = false;
    this.companion.bubbleTimer = 0;
    this.companion.bubbleText = 'Ven conmigo...';
    this.companion.facingLeft = false;

    // Nolan farewell: show radio message
    this.companion.bubbleText = '«Perímetro asegurado. Disfruten, Detective.»';
    this.companion.bubbleTimer = 180; // 3 seconds at 60fps

    // Camera at spawn
    this.camera.x = this.player.x;
    this.camera.y = this.player.y - 10;

    // Build bloom queue
    this.buildBloomQueue();

    // Update UI
    if (this.flowerCountEl) this.flowerCountEl.textContent = '0';

    // Hide letter overlay
    document.getElementById('vwLetterOverlay')?.classList.remove('active');

    // Play music
    audio.playVictoryWaltz();

    // Start game loop
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public close() {
    if (!this.container) return;
    this.container.classList.remove('active');
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.bloomInterval) { clearInterval(this.bloomInterval); this.bloomInterval = null; }
    document.getElementById('vwLetterOverlay')?.classList.remove('active');
  }

  private setupInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Canvas click — plant flower in free mode
    this.canvas?.addEventListener('click', (e) => {
      if (!this.freeMode || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.spawnFlowerAtClick(x, y);
    });

    // Spacebar — burst in free mode
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' && this.freeMode) {
        e.preventDefault();
        this.plantBurstAroundPlayer();
      }
    });

    // UI Buttons
    document.getElementById('btnVwClose')?.addEventListener('click', () => this.close());

    // Letter overlay button — stay in garden
    document.getElementById('btnStayInGarden')?.addEventListener('click', () => {
      this.hideLetterOverlay();
    });

    // Wax seal click inside letter overlay
    document.getElementById('vwWaxSealBtn')?.addEventListener('click', () => {
      this.openLetter();
    });

    // Touch D-Pad
    document.querySelectorAll('.vw-dpad-btn').forEach((btn) => {
      const dir = btn.getAttribute('data-dir');
      const startMove = (e: Event) => {
        e.preventDefault();
        if (dir === 'up') this.keys['w'] = true;
        if (dir === 'down') this.keys['s'] = true;
        if (dir === 'left') this.keys['a'] = true;
        if (dir === 'right') this.keys['d'] = true;
      };
      const stopMove = (e: Event) => {
        e.preventDefault();
        if (dir === 'up') this.keys['w'] = false;
        if (dir === 'down') this.keys['s'] = false;
        if (dir === 'left') this.keys['a'] = false;
        if (dir === 'right') this.keys['d'] = false;
      };
      btn.addEventListener('pointerdown', startMove);
      btn.addEventListener('pointerup', stopMove);
      btn.addEventListener('pointerleave', stopMove);
    });
  }

  private generateFloatingPetals() {
    this.floatingPetals = [];
    for (let i = 0; i < 20; i++) {
      this.floatingPetals.push(this.createPetal());
    }
  }

  private createPetal() {
    return {
      x: Math.random() * 2000 - 500,
      y: Math.random() * 1200 - 200,
      vx: -0.2 + Math.random() * 0.15,
      vy: 0.15 + Math.random() * 0.35,
      size: 2 + Math.random() * 3,
      alpha: 0.3 + Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    };
  }

  // --- BLOOM QUEUE: 40 flowers around the bench ---
  private buildBloomQueue() {
    this.bloomQueue = [];

    // Ring around the bench (40 flowers, 110ms each)
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const rx = 8 + Math.random() * 10;
      const ry = 5 + Math.random() * 6;
      const x = VirtualWorldGame.ANCHORS.bench.x + Math.cos(angle) * rx;
      const y = VirtualWorldGame.ANCHORS.bench.y + Math.sin(angle) * ry;
      if (!this.isInExclusionZone(x, y)) {
        this.bloomQueue.push({ x, y, delay: i });
      }
    }
  }

  // Elliptical exclusion zone around the bench
  private isInExclusionZone(x: number, y: number): boolean {
    const bx = VirtualWorldGame.ANCHORS.bench.x;
    const by = VirtualWorldGame.ANCHORS.bench.y;
    const dx = (x - bx) / 8;
    const dy = (y - by) / 5;
    return dx * dx + dy * dy < 1;
  }

  private isPointInPond(x: number, y: number): boolean {
    const p = VirtualWorldGame.ANCHORS.pond;
    return x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2;
  }

  private displaceFromCharacters(x: number, y: number): { x: number; y: number } {
    const bx = VirtualWorldGame.ANCHORS.bench.x;
    const by = VirtualWorldGame.ANCHORS.bench.y;
    const dx = x - bx;
    const dy = y - by;
    const dist = Math.hypot(dx, dy);
    const minDist = 12;
    if (dist < minDist && dist > 0) {
      return { x: bx + (dx / dist) * minDist, y: by + (dy / dist) * minDist };
    }
    return { x, y };
  }

  private spawnFlower(x: number, y: number, type: VirtualFlower['type'] = 'sunflower', targetScale = 1.0) {
    this.flowers.push({
      x,
      y,
      type,
      scale: 0.05,
      targetScale,
      rotation: (Math.random() - 0.5) * 0.3,
      stemHeight: 28 + Math.random() * 30,
      color: Math.random() < 0.7 ? '#ffd166' : '#ffe066',
      bloomSpeed: 0.03 + Math.random() * 0.025,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 1.2 + Math.random() * 1.2,
    });

    // Sparkle particles
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        alpha: 1,
        color: '#ffd166',
        life: 0,
        maxLife: 40 + Math.random() * 20,
        type: 'sparkle',
      });
    }

    audio.playChime([523, 587, 659, 784, 880][Math.floor(Math.random() * 5)]);
    this.flowerCount++;
    if (this.flowerCountEl) this.flowerCountEl.textContent = String(this.flowerCount);
  }

  private spawnFlowerAtClick(x: number, y: number) {
    if (!this.canvas) return;
    // Convert screen coords to percentage, then displace if near bench
    const px = (x / this.canvas.width) * 100;
    const py = (y / this.canvas.height) * 100;
    const displaced = this.displaceFromCharacters(px, py);
    const worldX = (displaced.x / 100) * this.canvas.width;
    const worldY = (displaced.y / 100) * this.canvas.height;
    this.spawnFlower(worldX, worldY, 'sunflower', 0.8 + Math.random() * 0.5);
  }

  private spawnPlayerFlower() {
    if (!this.canvas) return;
    const x = this.player.x + (Math.random() - 0.5) * 30;
    const y = this.player.y + 5 + (Math.random() - 0.5) * 20;
    this.spawnFlower(x, y, 'daisy', 0.9 + Math.random() * 0.3);
  }

  private plantBurstAroundPlayer() {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = 30 + Math.random() * 25;
      const x = this.player.x + Math.cos(angle) * dist;
      const y = this.player.y + Math.sin(angle) * dist * 0.6;
      this.spawnFlower(x, y, Math.random() < 0.5 ? 'sunflower' : 'daisy', 0.8 + Math.random() * 0.4);
    }
    this.companion.bubbleText = '«¡Mira cómo brotan a tu alrededor, mi amor! 🌻»';
    this.companion.bubbleTimer = 220;
  }

  public setWylliBubble(text: string, durationFrames = 200) {
    this.companion.bubbleText = text;
    this.companion.bubbleTimer = durationFrames;
  }

  // --- GAME LOOP ---
  private lastTime = 0;

  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const w = this.canvas?.width || 1200;
    const h = this.canvas?.height || 900;

    // 1. Walk system — waypoint-based approach
    if (this.walkPhase === 'farewell') {
      // Wait for Nolan farewell bubble to expire
      if (this.companion.bubbleTimer <= 0) {
        this.walkPhase = 'approaching';
        this.companion.bubbleText = 'Ven conmigo...';
        this.companion.bubbleTimer = 120;
        this.player.isWalking = true;
        this.companion.isWalking = true;
      }
    } else if (this.walkPhase === 'approaching') {
      const wp = VirtualWorldGame.WAYPOINTS[this.waypointIndex];
      if (!wp) {
        this.walkPhase = 'sitting';
        this.startSitting();
        return;
      }
      const targetX = (wp.x / 100) * w;
      const targetY = (wp.y / 100) * h;
      const dx = targetX - this.player.x;
      const dy = targetY - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4) {
        this.waypointIndex++;
        if (this.waypointIndex >= VirtualWorldGame.WAYPOINTS.length) {
          this.walkPhase = 'sitting';
          this.startSitting();
          return;
        }
      } else {
        const speed = this.player.speed;
        this.player.x += (dx / dist) * speed * (dt * 60);
        this.player.y += (dy / dist) * speed * (dt * 60);
        this.companion.x = this.player.x + 20;
        this.companion.y = this.player.y + 2;
        this.player.stepCycle += dt * 6;
        this.companion.stepCycle += dt * 5.5;
        this.player.isWalking = true;
        this.companion.isWalking = true;
        this.player.facingLeft = dx < 0;
        this.companion.facingLeft = dx < 0;
      }
    }

    // 2. WASD movement in free mode
    if (this.freeMode) {
      let moveX = 0;
      let moveY = 0;
      if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
      if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
      if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        this.player.x += (moveX / len) * this.player.speed * (dt * 60);
        this.player.y += (moveY / len) * this.player.speed * (dt * 60);
        this.player.stepCycle += dt * 10;
        this.player.facingLeft = moveX < 0;
        this.player.isWalking = true;
      } else {
        this.player.isWalking = false;
      }

      // Companion follows
      const targetOffsetX = this.player.facingLeft ? 32 : -32;
      const companionTargetX = this.player.x + targetOffsetX;
      const companionTargetY = this.player.y + 4;
      const compDx = companionTargetX - this.companion.x;
      const compDy = companionTargetY - this.companion.y;
      const compDist = Math.hypot(compDx, compDy);
      if (compDist > 6) {
        this.companion.x += (compDx / compDist) * Math.min(this.companion.speed, compDist * 0.1) * (dt * 60);
        this.companion.y += (compDy / compDist) * Math.min(this.companion.speed, compDist * 0.1) * (dt * 60);
        this.companion.isWalking = true;
        this.companion.stepCycle += dt * 9;
        this.companion.facingLeft = this.player.facingLeft;
      } else {
        this.companion.isWalking = false;
      }
    }

    // 3. Bubble timer
    if (this.companion.bubbleTimer > 0) {
      this.companion.bubbleTimer--;
    }

    // 4. Camera follows characters
    const targetCamX = (this.player.x + this.companion.x) / 2;
    const targetCamY = (this.player.y + this.companion.y) / 2 - 10;
    this.camera.x += (targetCamX - this.camera.x) * 0.06;
    this.camera.y += (targetCamY - this.camera.y) * 0.06;

    // 5. Update flower growth
    for (const f of this.flowers) {
      if (f.scale < f.targetScale) {
        f.scale = Math.min(f.targetScale, f.scale + f.bloomSpeed);
      }
    }

    // 6. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 7. Update floating petals
    for (const petal of this.floatingPetals) {
      petal.x += petal.vx;
      petal.y += petal.vy;
      petal.rot += petal.rotSpeed;
      if (petal.y > (this.canvas?.height || 800) + 50) {
        petal.y = -30;
        petal.x = Math.random() * ((this.canvas?.width || 1200) + 200) - 100;
      }
      if (petal.x < -100) {
        petal.x = (this.canvas?.width || 1200) + 50;
      }
    }

    // 8. Dialogue fade-in
    if (this.dialogueStarted && this.dialogueAlpha < 1) {
      this.dialogueAlpha = Math.min(1, this.dialogueAlpha + dt * 0.8);
    }
  }

  // --- SITTING TRANSITION ---
  private startSitting() {
    this.isSitting = true;
    this.player.isWalking = false;
    this.companion.isWalking = false;

    const w = this.canvas?.width || 1200;
    const h = this.canvas?.height || 900;
    const benchX = (VirtualWorldGame.ANCHORS.bench.x / 100) * w;
    const benchY = (VirtualWorldGame.ANCHORS.bench.y / 100) * h;

    // Position on bench — Wylli left, Gaby right
    this.companion.x = benchX - 15;
    this.companion.y = benchY;
    this.companion.facingLeft = false;
    this.player.x = benchX + 15;
    this.player.y = benchY;
    this.player.facingLeft = true; // Face Wylli

    // Show Wylli dialogue
    this.companion.bubbleText = '«Aquí es donde quería traerte... Feliz 21 de septiembre, Gaby ❤️»';
    this.companion.bubbleTimer = 180;

    // Start bloom after 1.5s
    setTimeout(() => this.startBloomSequence(), 1500);
  }

  // --- BLOOM SEQUENCE: 110ms per flower ---
  private startBloomSequence() {
    this.bloomIndex = 0;
    this.bloomInterval = window.setInterval(() => {
      if (this.bloomIndex >= this.bloomQueue.length) {
        if (this.bloomInterval) clearInterval(this.bloomInterval);
        this.bloomInterval = null;
        this.onBloomComplete();
        return;
      }
      const entry = this.bloomQueue[this.bloomIndex];
      const w = this.canvas?.width || 1200;
      const h = this.canvas?.height || 900;
      const worldX = (entry.x / 100) * w;
      const worldY = (entry.y / 100) * h;
      const types: VirtualFlower['type'][] = ['sunflower', 'daisy', 'goldenRose', 'starBlossom'];
      this.spawnFlower(worldX, worldY, types[Math.floor(Math.random() * types.length)], 0.8 + Math.random() * 0.5);
      this.bloomIndex++;
    }, 110);
  }

  // --- BLOOM COMPLETE: Show letter ---
  private onBloomComplete() {
    // Spawn golden pollen particles toward grand mantle
    for (let i = 0; i < 20; i++) {
      const w = this.canvas?.width || 1200;
      const h = this.canvas?.height || 900;
      this.particles.push({
        x: (VirtualWorldGame.ANCHORS.bench.x / 100) * w + (Math.random() - 0.5) * 100,
        y: (VirtualWorldGame.ANCHORS.bench.y / 100) * h - 30,
        vx: 0.5 + Math.random() * 1.5,
        vy: -0.3 - Math.random() * 0.8,
        size: 2 + Math.random() * 2,
        alpha: 1,
        color: '#ffd166',
        life: 0,
        maxLife: 80 + Math.random() * 40,
        type: 'pollen',
      });
    }

    // Show letter overlay after 2s
    setTimeout(() => this.showLetterOverlay(), 2000);
  }

  private showLetterOverlay() {
    const overlay = document.getElementById('vwLetterOverlay');
    if (overlay) {
      overlay.classList.add('active');
      // Reset envelope state
      document.getElementById('vwEnvelopeFlap')?.classList.remove('opened');
      document.getElementById('vwWaxSealBtn')?.classList.remove('broken');
      document.getElementById('vwLetterUnfolded')?.classList.remove('visible');
      document.getElementById('vwEnvelope3D')?.style.setProperty('display', 'flex');
      document.getElementById('vwEnvelopeInstruction')?.style.setProperty('display', 'block');
    }
  }

  private hideLetterOverlay() {
    document.getElementById('vwLetterOverlay')?.classList.remove('active');
    this.freeMode = true;
    // Show only the Volver button
    const actions = document.querySelector('.vw-actions');
    if (actions) {
      (actions as HTMLElement).style.display = 'flex';
    }
  }

  private openLetter() {
    audio.playSealBreak();
    // Break seal
    document.getElementById('vwWaxSealBtn')?.classList.add('broken');
    // Spawn golden particles around seal
    const seal = document.getElementById('vwWaxSealBtn');
    if (seal) {
      const rect = seal.getBoundingClientRect();
      for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'seal-particle';
        const angle = (i / 12) * Math.PI * 2;
        const dist = 30 + Math.random() * 20;
        particle.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
        particle.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        particle.style.background = i % 2 === 0 ? '#f5c538' : '#ffd166';
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
      }
    }
    // Open flap after 0.5s
    setTimeout(() => {
      document.getElementById('vwEnvelopeFlap')?.classList.add('opened');
      document.getElementById('vwEnvelopeInstruction')?.style.setProperty('display', 'none');
      // Show letter after flap opens
      setTimeout(() => {
        document.getElementById('vwEnvelope3D')?.style.setProperty('display', 'none');
        document.getElementById('vwLetterUnfolded')?.classList.add('visible');
      }, 800);
    }, 500);
  }

  // --- RENDER ---
  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // CAPA 0: Background image
    this.renderBackground(ctx, w, h);

    // Camera transform for world-space elements
    ctx.save();
    ctx.translate(w / 2 - this.camera.x, h / 2 - this.camera.y);

    // Back flowers (behind characters)
    const charY = (this.player.y + this.companion.y) / 2;
    for (const f of this.flowers) {
      if (f.y < charY) this.renderFlower(ctx, f);
    }

    // Couple (with internal depth sorting between characters)
    this.renderCouple(ctx);

    // Front flowers (in front of characters)
    for (const f of this.flowers) {
      if (f.y >= charY) this.renderFlower(ctx, f);
    }

    // CAPA 4: Particles
    this.renderParticles(ctx);

    ctx.restore();

    // CAPA 4b: Floating petals (screen space)
    this.renderFloatingPetals(ctx, w, h);

    // CAPA 5: Dialogue
    this.renderDialogue(ctx, w, h);
    this.renderScreenVignette(ctx, w, h);
  }

  // --- BACKGROUND IMAGE ---
  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.bgLoaded && this.bgImage) {
      const imgRatio = this.bgImage.width / this.bgImage.height;
      const canvasRatio = w / h;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);
    } else {
      // Fallback: green meadow + blue sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#87ceeb');
      skyGrad.addColorStop(0.5, '#b8e4f0');
      skyGrad.addColorStop(0.7, '#52b788');
      skyGrad.addColorStop(1, '#2d6a4f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // --- SPRITE FRAME EXTRACTION ---
  // Sprite sheets: 2048x2048, 16x16 grid, 128x128 per frame
  private static readonly SPRITE_FRAME = 128;

  private drawSpriteFrame(
    ctx: CanvasRenderingContext2D,
    sheet: HTMLImageElement,
    row: number,
    col: number,
    destX: number,
    destY: number,
    scale: number = 2.5,
    flipX: boolean = false
  ) {
    const F = VirtualWorldGame.SPRITE_FRAME;
    const srcX = col * F;
    const srcY = row * F;
    const size = F * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flipX) {
      ctx.translate(destX + size / 2, destY);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, srcX, srcY, F, F, -size / 2, -size, size, size);
    } else {
      ctx.drawImage(sheet, srcX, srcY, F, F, destX - size / 2, destY - size, size, size);
    }
    ctx.restore();
  }
    ctx.restore();
  }

  // --- WALK FRAME MAPPING ---
  // gaby.jpeg rows: 0=IDLE, 1=WALKING, 2=SITTING, 3=INVESTIGATING
  // willy.jpeg rows: 0=IDLE+WALK, 1=WALKING+OFFERING, 2=???, 3=SITTING+INVESTIGATING
  private getWalkFrame(isGaby: boolean, facingLeft: boolean, frameIndex: number): { row: number; col: number } {
    const fi = frameIndex % 4;
    if (isGaby) {
      // gaby.jpeg: walking row = 1
      if (facingLeft) return { row: 1, col: 2 + fi };  // cols 2-5: walk left
      return { row: 1, col: 6 + fi };                   // cols 6-9: walk right
    } else {
      // willy.jpeg: idle row has walking left/right
      if (facingLeft) return { row: 0, col: 3 + fi };  // cols 3-6: walk left
      return { row: 0, col: 7 + fi };                   // cols 7-10: walk right
    }
  }

  private getIdleFrame(isGaby: boolean, facingLeft: boolean): { row: number; col: number } {
    if (isGaby) {
      return facingLeft ? { row: 0, col: 1 } : { row: 0, col: 0 };
    } else {
      return facingLeft ? { row: 0, col: 1 } : { row: 0, col: 0 };
    }
  }

  // --- BENCH RENDERING ---
  private renderBench(ctx: CanvasRenderingContext2D, sc: number) {
    const bx = this.companion.x - 25;
    const by = this.companion.y + 8;

    // Seat planks
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(bx, by, 50 * sc, 3 * sc);
    ctx.fillStyle = '#9B7424';
    ctx.fillRect(bx, by + 5 * sc, 50 * sc, 3 * sc);

    // Plank texture lines
    ctx.strokeStyle = '#6B4F12';
    ctx.lineWidth = 0.6;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + i * 10 * sc, by);
      ctx.lineTo(bx + i * 10 * sc, by + 8 * sc);
      ctx.stroke();
    }

    // Backrest
    ctx.fillStyle = '#7A5C12';
    ctx.fillRect(bx + 2 * sc, by - 12 * sc, 46 * sc, 3 * sc);
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(bx + 2 * sc, by - 7 * sc, 46 * sc, 3 * sc);

    // Legs
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(bx + 2 * sc, by + 8 * sc, 3 * sc, 10 * sc);
    ctx.fillRect(bx + 45 * sc, by + 8 * sc, 3 * sc, 10 * sc);
  }

  // --- COLLISION RADIUS ---
  private readonly COLLISION_RADIUS = 10;

  private isTooCloseToCharacters(x: number, y: number): boolean {
    const pDist = Math.hypot(x - this.player.x, y - this.player.y);
    const cDist = Math.hypot(x - this.companion.x, y - this.companion.y);
    return pDist < this.COLLISION_RADIUS || cDist < this.COLLISION_RADIUS;
  }

  // --- COUPLE RENDERING ---
  private renderCouple(ctx: CanvasRenderingContext2D) {
    const sc = 2.5;

    if (this.isSitting) {
      this.renderSittingCouple(ctx, sc);
      return;
    }

    // --- Depth sort: draw character with lower Y first (behind) ---
    const chars = [
      { isPlayer: true, x: this.player.x, y: this.player.y },
      { isPlayer: false, x: this.companion.x, y: this.companion.y },
    ].sort((a, b) => a.y - b.y);

    for (const c of chars) {
      const char = c.isPlayer ? this.player : this.companion;
      const sheet = c.isPlayer ? this.spriteGaby : this.spriteWylli;
      const loaded = c.isPlayer ? this.spritesLoaded.gaby : this.spritesLoaded.wylli;

      // Shadow
      ctx.fillStyle = 'rgba(10, 6, 16, 0.35)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 2, 18, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (loaded && sheet) {
        // Sprite sheet rendering — idle vs walk
        let frame: { row: number; col: number };
        if (char.isWalking) {
          const walkFrame = Math.floor(char.stepCycle) % 4;
          frame = this.getWalkFrame(c.isPlayer, char.facingLeft, walkFrame);
        } else {
          frame = this.getIdleFrame(c.isPlayer, char.facingLeft);
        }
        this.drawSpriteFrame(ctx, sheet, frame.row, frame.col, c.x, c.y, sc, char.facingLeft);
      } else {
        // Fallback: shape-based rendering
        this.renderCharacterShapes(ctx, c.isPlayer, char, sc);
      }
    }

    // Heart between them
    const dist = Math.hypot(this.player.x - this.companion.x, this.player.y - this.companion.y);
    if (dist < 60) {
      const midX = (this.player.x + this.companion.x) / 2;
      const midY = (this.player.y + this.companion.y) / 2 - 80;
      ctx.save();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      const bob = Math.sin(performance.now() * 0.004) * 3;
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(performance.now() * 0.003);
      ctx.fillText('❤️', midX, midY + bob);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Speech bubble
    if (this.companion.bubbleTimer > 0) {
      this.drawSpeechBubble(ctx, this.companion.bubbleText, this.companion.x, this.companion.y - 110);
    }
  }

  // --- FALLBACK: Shape-based character rendering (when sprites not loaded) ---
  private renderCharacterShapes(ctx: CanvasRenderingContext2D, isPlayer: boolean, char: any, sc: number) {
    const step = Math.sin(char.stepCycle) * 3;
    const x = char.x;
    const y = char.y;

    ctx.save();
    ctx.translate(x, y);
    if (char.facingLeft) ctx.scale(-1, 1);

    if (isPlayer) {
      // GABY shape fallback
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(-6 * sc, -15 * sc + step, 5 * sc, 15 * sc - step);
      ctx.fillRect(1 * sc, -15 * sc - step, 5 * sc, 15 * sc + step);
      ctx.fillStyle = '#f4ccd5';
      ctx.fillRect(-9 * sc, -28 * sc, 18 * sc, 14 * sc);
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-3 * sc, -22 * sc);
      ctx.lineTo(-1 * sc, -20 * sc);
      ctx.lineTo(1 * sc, -22 * sc);
      ctx.stroke();
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-5 * sc, -38 * sc, 10 * sc, 10 * sc);
      ctx.strokeStyle = '#c9846a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -33 * sc, 3 * sc, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.fillStyle = '#2c1810';
      ctx.fillRect(-3 * sc, -36 * sc, 2 * sc, 2 * sc);
      ctx.fillRect(2 * sc, -36 * sc, 2 * sc, 2 * sc);
      ctx.fillStyle = '#442a1b';
      ctx.beginPath();
      ctx.arc(0, -36 * sc, 7.5 * sc, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-7 * sc, -36 * sc, 3 * sc, 10 * sc);
      ctx.fillRect(4 * sc, -36 * sc, 3 * sc, 10 * sc);
      ctx.beginPath();
      ctx.moveTo(-7 * sc, -26 * sc);
      ctx.quadraticCurveTo(-9 * sc, -22 * sc, -7 * sc, -18 * sc);
      ctx.quadraticCurveTo(-5 * sc, -22 * sc, -4 * sc, -26 * sc);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4 * sc, -26 * sc);
      ctx.quadraticCurveTo(5 * sc, -22 * sc, 7 * sc, -18 * sc);
      ctx.quadraticCurveTo(9 * sc, -22 * sc, 7 * sc, -26 * sc);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3 * sc, -24 * sc, 6 * sc, 5 * sc);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-1 * sc, -25 * sc, 2 * sc, 1 * sc);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      const steamTime = performance.now() * 0.002;
      for (let i = 0; i < 3; i++) {
        const sx = (-1 + i) * sc;
        const sy = -27 * sc - Math.sin(steamTime + i) * 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + Math.sin(steamTime + i * 2) * 2, sy - 4, sx, sy - 7);
        ctx.stroke();
      }
    } else {
      // WYLLI shape fallback
      ctx.fillStyle = '#1b2838';
      ctx.fillRect(-6 * sc, -15 * sc + step, 5 * sc, 15 * sc - step);
      ctx.fillRect(1 * sc, -15 * sc - step, 5 * sc, 15 * sc + step);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(-9 * sc, -28 * sc, 18 * sc, 14 * sc);
      ctx.fillStyle = '#111111';
      ctx.fillRect(-10 * sc, -29 * sc, 3 * sc, 5 * sc);
      ctx.fillRect(7 * sc, -29 * sc, 3 * sc, 5 * sc);
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-5 * sc, -38 * sc, 10 * sc, 10 * sc);
      ctx.strokeStyle = '#c9846a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, -33 * sc, 3 * sc, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.fillStyle = '#2c1810';
      ctx.fillRect(-3 * sc, -36 * sc, 2 * sc, 2 * sc);
      ctx.fillRect(2 * sc, -36 * sc, 2 * sc, 2 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7 * sc, -42 * sc, 14 * sc, 5 * sc);
      ctx.fillRect(3 * sc, -40 * sc, 5 * sc, 2 * sc);
      ctx.fillStyle = '#385a7c';
      ctx.fillRect(-2 * sc, -41 * sc, 4 * sc, 2 * sc);
      const bX = 10 * sc, bY = -20 * sc;
      ctx.fillStyle = '#52b788';
      ctx.fillRect(bX - 1, bY, 2, 14);
      const pCols = ['#f5c538', '#ffd166', '#ffe066'];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + Math.sin(performance.now() * 0.001) * 0.1;
        ctx.fillStyle = pCols[i % 3];
        ctx.beginPath();
        ctx.ellipse(bX + Math.cos(a) * 5, bY - 4 + Math.sin(a) * 4, 3, 5, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(bX, bY - 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- SITTING COUPLE AT BENCH ---
  private renderSittingCouple(ctx: CanvasRenderingContext2D, sc: number) {
    const time = performance.now() * 0.001;

    // Draw bench first (behind characters)
    this.renderBench(ctx, sc);

    // Depth sort sitting characters
    const chars = [
      { isPlayer: true, x: this.player.x, y: this.player.y },
      { isPlayer: false, x: this.companion.x, y: this.companion.y },
    ].sort((a, b) => a.y - b.y);

    for (const c of chars) {
      const sheet = c.isPlayer ? this.spriteGaby : this.spriteWylli;
      const loaded = c.isPlayer ? this.spritesLoaded.gaby : this.spritesLoaded.wylli;

      // Shadow
      ctx.fillStyle = 'rgba(10, 6, 16, 0.25)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 8, 22, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (loaded && sheet) {
        if (c.isPlayer) {
          // Gaby sitting: gaby.jpeg row 2, col 4 (sitting reading), facing left toward Wylli
          this.drawSpriteFrame(ctx, sheet, 2, 4, c.x, c.y, sc, true);
        } else {
          // Wylli sitting: willy.jpeg row 1, col 3 (sitting offering envelope)
          this.drawSpriteFrame(ctx, sheet, 1, 3, c.x, c.y, sc, false);
        }
      } else {
        // Fallback: shape-based sitting
        this.renderSittingShape(ctx, c.isPlayer, c.x, c.y, sc, time);
      }
    }

    // Floating heart
    const midX = (this.player.x + this.companion.x) / 2;
    const midY = Math.min(this.player.y, this.companion.y) - 70;
    ctx.save();
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    const bob = Math.sin(time * 2) * 3;
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(time * 1.5);
    ctx.fillText('❤️', midX, midY + bob);
    ctx.globalAlpha = 1;
    ctx.restore();

    // Speech bubble
    if (this.companion.bubbleTimer > 0) {
      this.drawSpeechBubble(ctx, this.companion.bubbleText, this.companion.x, this.companion.y - 80);
    }
  }

  // --- FALLBACK: Shape-based sitting rendering ---
  private renderSittingShape(ctx: CanvasRenderingContext2D, isPlayer: boolean, x: number, y: number, sc: number, time: number) {
    ctx.save();
    ctx.translate(x, y);

    if (!isPlayer) {
      // WYLLI sitting shape fallback
      ctx.fillStyle = '#1b2838';
      ctx.fillRect(-8 * sc, -2 * sc, 7 * sc, 4 * sc);
      ctx.fillRect(1 * sc, -2 * sc, 7 * sc, 4 * sc);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(-7 * sc, -16 * sc, 14 * sc, 14 * sc);
      ctx.fillStyle = '#111111';
      ctx.fillRect(-8 * sc, -17 * sc, 3 * sc, 4 * sc);
      ctx.fillRect(5 * sc, -17 * sc, 3 * sc, 4 * sc);
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-4 * sc, -26 * sc, 8 * sc, 9 * sc);
      ctx.strokeStyle = '#c9846a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(1 * sc, -21 * sc, 2.5 * sc, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.fillStyle = '#2c1810';
      ctx.fillRect(-1 * sc, -24 * sc, 2 * sc, 2 * sc);
      ctx.fillRect(4 * sc, -24 * sc, 2 * sc, 2 * sc);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5 * sc, -30 * sc, 12 * sc, 4 * sc);
      ctx.fillRect(3 * sc, -28 * sc, 4 * sc, 2 * sc);
      ctx.fillStyle = '#385a7c';
      ctx.fillRect(-1 * sc, -29 * sc, 4 * sc, 2 * sc);
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(7 * sc, -12 * sc, 10 * sc, 3 * sc);
      ctx.fillStyle = '#f5e6d0';
      ctx.fillRect(14 * sc, -14 * sc, 8 * sc, 6 * sc);
      ctx.strokeStyle = '#c9a882';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(14 * sc, -14 * sc, 8 * sc, 6 * sc);
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.arc(18 * sc, -11 * sc, 2 * sc, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // GABY sitting shape fallback
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(-8 * sc, -2 * sc, 7 * sc, 4 * sc);
      ctx.fillRect(1 * sc, -2 * sc, 7 * sc, 4 * sc);
      ctx.fillStyle = '#f4ccd5';
      ctx.fillRect(-7 * sc, -16 * sc, 14 * sc, 14 * sc);
      ctx.strokeStyle = '#4a90e2';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-2 * sc, -10 * sc);
      ctx.lineTo(0, -8 * sc);
      ctx.lineTo(2 * sc, -10 * sc);
      ctx.stroke();
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-4 * sc, -26 * sc, 8 * sc, 9 * sc);
      ctx.strokeStyle = '#c9846a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(-1 * sc, -21 * sc, 2.5 * sc, 0.1, Math.PI - 0.1);
      ctx.stroke();
      ctx.fillStyle = '#2c1810';
      ctx.fillRect(-3 * sc, -24 * sc, 2 * sc, 2 * sc);
      ctx.fillRect(2 * sc, -24 * sc, 2 * sc, 2 * sc);
      ctx.fillStyle = 'rgba(255, 150, 150, 0.3)';
      ctx.beginPath();
      ctx.arc(-3 * sc, -21 * sc, 2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3 * sc, -21 * sc, 2 * sc, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#442a1b';
      ctx.beginPath();
      ctx.arc(0, -24 * sc, 6 * sc, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-6 * sc, -24 * sc, 2.5 * sc, 8 * sc);
      ctx.fillRect(3.5 * sc, -24 * sc, 2.5 * sc, 8 * sc);
      ctx.beginPath();
      ctx.moveTo(-6 * sc, -16 * sc);
      ctx.quadraticCurveTo(-7 * sc, -13 * sc, -5.5 * sc, -10 * sc);
      ctx.quadraticCurveTo(-4 * sc, -13 * sc, -3.5 * sc, -16 * sc);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(3.5 * sc, -16 * sc);
      ctx.quadraticCurveTo(4 * sc, -13 * sc, 5.5 * sc, -10 * sc);
      ctx.quadraticCurveTo(7 * sc, -13 * sc, 6 * sc, -16 * sc);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10 * sc, -10 * sc, 5 * sc, 4 * sc);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-9 * sc, -11 * sc, 3 * sc, 1 * sc);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const sx = (-9 + i) * sc;
        const sy = -13 * sc - Math.sin(time + i) * 3;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + Math.sin(time + i * 2) * 2, sy - 4, sx, sy - 7);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // --- SPEECH BUBBLE ---
  private drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number) {
    ctx.save();
    ctx.font = 'bold 11px Nunito, sans-serif';
    const maxWidth = 220;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineH = 15;
    const boxW = maxWidth + 20;
    const boxH = lines.length * lineH + 14;
    const bx = cx - boxW / 2;
    const by = cy - boxH;

    ctx.fillStyle = 'rgba(43, 27, 36, 0.92)';
    ctx.strokeStyle = '#f5c538';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    // Arrow
    ctx.fillStyle = 'rgba(43, 27, 36, 0.92)';
    ctx.beginPath();
    ctx.moveTo(cx - 5, by + boxH);
    ctx.lineTo(cx, by + boxH + 8);
    ctx.lineTo(cx + 5, by + boxH);
    ctx.fill();

    ctx.fillStyle = '#ffd447';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, by + 7 + i * lineH);
    }
    ctx.restore();
  }

  // --- FLOWER RENDERING ---
  private renderFlower(ctx: CanvasRenderingContext2D, f: VirtualFlower) {
    ctx.save();
    ctx.translate(f.x, f.y);
    const time = performance.now() * 0.001;
    const sway = Math.sin(time * f.swaySpeed + f.swayPhase) * 0.08;
    ctx.rotate(f.rotation + sway);
    ctx.scale(f.scale, f.scale);

    // Stem
    ctx.strokeStyle = '#52b788';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -f.stemHeight * 0.5, 0, -f.stemHeight);
    ctx.stroke();

    // Leaves
    ctx.fillStyle = '#74c69d';
    ctx.beginPath();
    ctx.ellipse(6, -f.stemHeight * 0.4, 7, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-5, -f.stemHeight * 0.65, 6, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Flower head
    ctx.translate(0, -f.stemHeight);

    if (f.type === 'sunflower') {
      ctx.fillStyle = '#f5c538';
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -14, 4.5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#582e14';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d1c08';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'daisy') {
      ctx.fillStyle = '#fffdf0';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -11, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#ffd166';
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -10, 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ffb703';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- PARTICLES ---
  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.type === 'sparkle') {
        ctx.fillStyle = '#ffd166';
        ctx.translate(p.x, p.y);
        ctx.rotate(performance.now() * 0.003);
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'heart') {
        ctx.font = `${p.size * 2}px sans-serif`;
        ctx.fillText('❤️', p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- FLOATING PETALS ---
  private renderFloatingPetals(ctx: CanvasRenderingContext2D, _w: number, _h: number) {
    for (const petal of this.floatingPetals) {
      ctx.save();
      ctx.globalAlpha = petal.alpha;
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rot);
      ctx.fillStyle = '#f5c538';
      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size, petal.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // --- DIALOGUE ---
  private renderDialogue(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.dialogueAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.dialogueAlpha;

    const text = 'Wylli: «Desperté... pero este no es el final. Hay un lugar secreto detrás del jardín que preparé para ti. Ven conmigo ❤️»';
    ctx.font = 'bold 13px Nunito, sans-serif';
    const maxWidth = Math.min(400, w - 40);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      const test = currentLine ? currentLine + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = test;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineH = 18;
    const boxW = maxWidth + 30;
    const boxH = lines.length * lineH + 20;
    const bx = (w - boxW) / 2;
    const by = h * 0.12;

    ctx.fillStyle = 'rgba(43, 27, 36, 0.88)';
    ctx.strokeStyle = '#f5c538';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd447';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, by + 10 + i * lineH);
    }
    ctx.restore();
  }

  // --- VIGNETTE ---
  private renderScreenVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(43, 27, 36, 0.35)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
}

export const virtualWorldGame = new VirtualWorldGame();
