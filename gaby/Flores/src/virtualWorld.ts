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

  // Characters — positioned center-left, walk to center-right
  public player = {
    x: -120,
    y: 30,
    speed: 1.8,
    isWalking: true,
    facingLeft: false,
    stepCycle: 0,
  };

  public companion = {
    x: -120,
    y: 34,
    speed: 1.8,
    isWalking: true,
    facingLeft: false,
    stepCycle: 0,
    bubbleText: '«Gracias por traerme de vuelta, Gaby... Feliz 21 de Septiembre. Este jardín es todo tuyo ❤️»',
    bubbleTimer: 0,
    bubbleDelay: 180,
  };

  // Walk animation
  private walkProgress = 0;
  private walkDone = false;

  // Camera
  private camera = { x: 0, y: 0 };

  // Input
  private keys: Record<string, boolean> = {};

  // World Elements
  private flowers: VirtualFlower[] = [];
  private particles: VirtualParticle[] = [];

  // Bloom queue for sequential spawning
  private bloomQueue: BloomEntry[] = [];
  private bloomTimer = 0;
  private bloomIndex = 0;
  private bloomStarted = false;

  // Floating petals
  private floatingPetals: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; rot: number; rotSpeed: number }[] = [];

  // Stars for sky
  private stars: { x: number; y: number; size: number; phase: number }[] = [];

  // Dialogue
  private dialogueAlpha = 0;
  private dialogueStarted = false;

  // Exclusion zone radius (pixels)
  private readonly EXCLUSION_RADIUS = 80;

  // Flower count for display
  public flowerCount = 0;

  // DOM elements for UI
  private dialogueEl: HTMLElement | null = null;
  private flowerCountEl: HTMLElement | null = null;

  constructor() {}

  public init() {
    this.container = document.getElementById('virtualWorldModal');
    this.canvas = document.getElementById('virtualWorldCanvas') as HTMLCanvasElement;
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.dialogueEl = document.getElementById('vwDialogueText');
    this.flowerCountEl = document.getElementById('vwFlowerCount');

    this.setupInputs();
    this.generateStars();
    this.generateFloatingPetals();
  }

  private resizeCanvas() {
    if (!this.canvas || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width || window.innerWidth;
    this.canvas.height = rect.height || window.innerHeight;
  }

  public open() {
    if (!this.container) this.init();
    if (!this.container) return;

    this.container.classList.add('active');
    this.resizeCanvas();
    this.isRunning = true;

    // Reset state
    this.walkProgress = 0;
    this.walkDone = false;
    this.dialogueAlpha = 0;
    this.dialogueStarted = false;
    this.bloomStarted = false;
    this.bloomIndex = 0;
    this.flowers = [];
    this.particles = [];
    this.flowerCount = 0;

    // Position characters center-left
    this.player.x = -120;
    this.player.y = 30;
    this.player.stepCycle = 0;
    this.companion.x = -120;
    this.companion.y = 34;
    this.companion.stepCycle = 0;
    this.companion.bubbleTimer = 0;
    this.companion.bubbleDelay = 180;

    this.camera.x = 0;
    this.camera.y = 30;

    // Build bloom queue
    this.buildBloomQueue();

    // Update UI
    if (this.flowerCountEl) this.flowerCountEl.textContent = '0';

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
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      const k = e.key.toLowerCase();
      this.keys[k] = true;

      if (k === ' ') {
        e.preventDefault();
        this.spawnPlayerFlower();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    });

    // Canvas click to plant flower
    this.canvas?.addEventListener('pointerdown', (e) => {
      if (!this.isRunning || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      const worldX = clickScreenX - this.canvas.width / 2 + this.camera.x;
      const worldY = clickScreenY - this.canvas.height / 2 + this.camera.y;

      this.spawnFlowerAtClick(worldX, worldY);
    });

    // UI Buttons
    document.getElementById('btnVwClose')?.addEventListener('click', () => this.close());

    document.getElementById('btnVwLetter')?.addEventListener('click', () => {
      this.close();
      const letterModal = document.getElementById('secretGardenLetterContainer');
      const gardenModal = document.getElementById('secretGardenScenario');
      if (gardenModal) gardenModal.classList.add('active');
      if (letterModal) {
        letterModal.style.display = 'block';
        letterModal.scrollIntoView({ behavior: 'smooth' });
      }
    });

    document.getElementById('btnVwPlantMore')?.addEventListener('click', () => {
      this.plantBurstAroundPlayer();
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

  // --- STARS ---
  private generateStars() {
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.35,
        size: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // --- FLOATING PETALS ---
  private generateFloatingPetals() {
    this.floatingPetals = [];
    for (let i = 0; i < 24; i++) {
      this.floatingPetals.push(this.createPetal());
    }
  }

  private createPetal() {
    return {
      x: Math.random() * 2000 - 500,
      y: Math.random() * 1200 - 200,
      vx: -0.3 + Math.random() * 0.2,
      vy: 0.2 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
      alpha: 0.3 + Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    };
  }

  // --- BLOOM QUEUE ---
  private buildBloomQueue() {
    this.bloomQueue = [];
    let delay = 60;

    // Perimeter ring — flowers around the edges
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const rx = 220 + Math.random() * 80;
      const ry = 140 + Math.random() * 60;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry + 20;
      if (!this.isInExclusionZone(x, y)) {
        this.bloomQueue.push({ x, y, delay });
        delay += 6;
      }
    }

    // Path along the walk — flowers where they walk
    for (let i = 0; i < 20; i++) {
      const t = i / 20;
      const x = -140 + t * 300;
      const y = 30 + Math.sin(t * Math.PI * 2) * 15 + (Math.random() - 0.5) * 40;
      if (!this.isInExclusionZone(x, y)) {
        this.bloomQueue.push({ x, y, delay });
        delay += 4;
      }
    }

    // Scattered extras
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 500;
      const y = Math.random() * 180 - 40;
      if (!this.isInExclusionZone(x, y)) {
        this.bloomQueue.push({ x, y, delay });
        delay += 5;
      }
    }

    // Sort by delay for sequential bloom
    this.bloomQueue.sort((a, b) => a.delay - b.delay);
  }

  private isInExclusionZone(x: number, y: number): boolean {
    const chars = [
      { x: this.player.x, y: this.player.y },
      { x: this.companion.x, y: this.companion.y },
    ];
    for (const c of chars) {
      const dx = x - c.x;
      const dy = y - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.EXCLUSION_RADIUS) return true;
    }
    return false;
  }

  private displaceFromCharacters(x: number, y: number): { x: number; y: number } {
    const centerX = (this.player.x + this.companion.x) / 2;
    const centerY = (this.player.y + this.companion.y) / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.EXCLUSION_RADIUS) {
      const pushDist = this.EXCLUSION_RADIUS + 20;
      const angle = Math.atan2(dy, dx) || Math.random() * Math.PI * 2;
      return { x: centerX + Math.cos(angle) * pushDist, y: centerY + Math.sin(angle) * pushDist };
    }
    return { x, y };
  }

  // --- FLOWER SPAWNING ---
  private spawnFlower(x: number, y: number, type: VirtualFlower['type'] = 'sunflower', targetScale = 1.0) {
    const flower: VirtualFlower = {
      x,
      y,
      type,
      scale: 0.05,
      targetScale,
      rotation: (Math.random() - 0.5) * 0.3,
      stemHeight: 28 + Math.random() * 30,
      color: Math.random() > 0.3 ? '#ffd166' : '#ffe066',
      bloomSpeed: 0.03 + Math.random() * 0.025,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 1.2 + Math.random() * 1.2,
    };
    this.flowers.push(flower);
    this.flowerCount++;
    if (this.flowerCountEl) this.flowerCountEl.textContent = String(this.flowerCount);

    // Sparkle particles
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y - flower.stemHeight * 0.6 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.5 - Math.random() * 1.0,
        size: 1.5 + Math.random() * 2,
        alpha: 1,
        color: '#ffd166',
        life: 0,
        maxLife: 40 + Math.random() * 20,
        type: 'sparkle',
      });
    }

    // Musical note
    const notes = [523, 587, 659, 784, 880];
    audio.playChime(notes[Math.floor(Math.random() * notes.length)]);
  }

  private spawnFlowerAtClick(x: number, y: number) {
    const pos = this.displaceFromCharacters(x, y);
    this.spawnFlower(pos.x, pos.y, 'sunflower', 1.0);
  }

  private spawnPlayerFlower() {
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
      const types: VirtualFlower['type'][] = ['sunflower', 'daisy', 'goldenRose', 'starBlossom'];
      this.spawnFlower(x, y, types[Math.floor(Math.random() * types.length)], 0.8 + Math.random() * 0.4);
    }
    audio.playVictoryWaltz();
    this.setWylliBubble('«¡Mira cómo brotan a tu alrededor, mi amor! 🌻»', 220);
  }

  // --- WYLLI BUBBLE ---
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
    // 1. Walk animation — characters move from left to center
    if (!this.walkDone) {
      this.walkProgress += dt * 0.12;
      if (this.walkProgress >= 1) {
        this.walkProgress = 1;
        this.walkDone = true;
      }
      this.player.x = -120 + this.walkProgress * 240;
      this.companion.x = -120 + this.walkProgress * 240;
      this.player.stepCycle += dt * 6;
      this.companion.stepCycle += dt * 5.5;
      this.player.isWalking = true;
      this.companion.isWalking = true;
    } else {
      this.player.isWalking = false;
      this.companion.isWalking = false;

      // Show dialogue after walk finishes
      if (!this.dialogueStarted) {
        this.dialogueStarted = true;
        this.companion.bubbleTimer = 600;
      }
    }

    // 2. Keyboard WASD movement after walk is done
    if (this.walkDone) {
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
    }

    // 3. Companion follows player
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
    } else if (this.walkDone) {
      this.companion.isWalking = false;
    }

    // 4. Bubble timer
    if (this.companion.bubbleTimer > 0) {
      this.companion.bubbleTimer--;
    }

    // 5. Camera follows characters
    const targetCamX = (this.player.x + this.companion.x) / 2;
    const targetCamY = (this.player.y + this.companion.y) / 2 - 10;
    this.camera.x += (targetCamX - this.camera.x) * 0.06;
    this.camera.y += (targetCamY - this.camera.y) * 0.06;

    // 6. Sequential bloom from queue
    if (this.bloomStarted && this.bloomIndex < this.bloomQueue.length) {
      this.bloomTimer++;
      const entry = this.bloomQueue[this.bloomIndex];
      if (this.bloomTimer >= entry.delay) {
        const types: VirtualFlower['type'][] = ['sunflower', 'daisy', 'goldenRose', 'starBlossom'];
        this.spawnFlower(entry.x, entry.y, types[Math.floor(Math.random() * types.length)], 0.8 + Math.random() * 0.5);
        this.bloomIndex++;
      }
    }

    // Start bloom after a short delay
    if (!this.bloomStarted && this.walkDone) {
      this.bloomStarted = true;
      this.bloomTimer = 0;
    }

    // 7. Update flower growth
    for (const f of this.flowers) {
      if (f.scale < f.targetScale) {
        f.scale = Math.min(f.targetScale, f.scale + f.bloomSpeed);
      }
    }

    // 8. Update particles
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

    // 9. Update floating petals
    for (const petal of this.floatingPetals) {
      petal.x += petal.vx;
      petal.y += petal.vy;
      petal.rot += petal.rotSpeed;
      // Wrap around
      if (petal.y > (this.canvas?.height || 800) + 50) {
        petal.y = -30;
        petal.x = Math.random() * ((this.canvas?.width || 1200) + 200) - 100;
      }
      if (petal.x < -100) {
        petal.x = (this.canvas?.width || 1200) + 50;
      }
    }

    // 10. Dialogue fade-in
    if (this.dialogueStarted && this.dialogueAlpha < 1) {
      this.dialogueAlpha = Math.min(1, this.dialogueAlpha + dt * 0.8);
    }
  }

  // --- RENDER ---
  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // CAPA 0: Warm sunset background
    this.renderSunsetBackground(ctx, w, h);

    // Camera transform for world-space elements
    ctx.save();
    ctx.translate(w / 2 - this.camera.x, h / 2 - this.camera.y);

    // CAPA 1: Back flowers (above character Y = background)
    const charY = (this.player.y + this.companion.y) / 2;
    const backFlowers = this.flowers.filter((f) => f.y < charY);
    for (const f of backFlowers) {
      this.renderFlower(ctx, f);
    }

    // CAPA 2: Couple (characters)
    this.renderCouple(ctx);

    // CAPA 3: Front flowers (below character Y = foreground)
    const frontFlowers = this.flowers.filter((f) => f.y >= charY);
    for (const f of frontFlowers) {
      this.renderFlower(ctx, f);
    }

    // CAPA 4: Sparkle particles (world space)
    this.renderParticles(ctx);

    ctx.restore();

    // CAPA 4b: Floating petals (screen space)
    this.renderFloatingPetals(ctx, w, h);

    // CAPA 5: UI — dialogue box + controls
    this.renderDialogue(ctx, w, h);
    this.renderScreenVignette(ctx, w, h);
  }

  // --- CAPA 0: SUNSET BACKGROUND ---
  private renderSunsetBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Sky gradient: deep violet → warm peach → golden horizon
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#2b1b24');
    skyGrad.addColorStop(0.3, '#4a2a3a');
    skyGrad.addColorStop(0.55, '#7d4a5a');
    skyGrad.addColorStop(0.72, '#c98a5a');
    skyGrad.addColorStop(0.82, '#f5c538');
    skyGrad.addColorStop(0.88, '#f5d76e');
    skyGrad.addColorStop(1, '#3a7d44');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Soft radial glow at horizon
    const glowGrad = ctx.createRadialGradient(w * 0.5, h * 0.75, 20, w * 0.5, h * 0.75, w * 0.45);
    glowGrad.addColorStop(0, 'rgba(245, 197, 56, 0.35)');
    glowGrad.addColorStop(0.5, 'rgba(245, 197, 56, 0.1)');
    glowGrad.addColorStop(1, 'rgba(245, 197, 56, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars in upper sky
    const time = performance.now() * 0.001;
    for (const star of this.stars) {
      const sx = star.x * w;
      const sy = star.y * h;
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.8 + star.phase);
      ctx.globalAlpha = 0.3 + pulse * 0.5;
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon crescent
    const moonX = w * 0.82;
    const moonY = h * 0.1;
    ctx.fillStyle = 'rgba(255, 253, 240, 0.85)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a3a';
    ctx.beginPath();
    ctx.arc(moonX + 6, moonY - 3, 14, 0, Math.PI * 2);
    ctx.fill();

    // Grass ground at bottom
    const grassGrad = ctx.createLinearGradient(0, h * 0.85, 0, h);
    grassGrad.addColorStop(0, '#2d6a4f');
    grassGrad.addColorStop(0.5, '#40916c');
    grassGrad.addColorStop(1, '#1b4332');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, h * 0.85, w, h * 0.15);

    // Subtle grass blades
    ctx.strokeStyle = 'rgba(64, 145, 108, 0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 80; i++) {
      const gx = (i / 80) * w;
      const gy = h * 0.86 + Math.random() * (h * 0.12);
      const gh = 6 + Math.random() * 10;
      const sway = Math.sin(time * 0.5 + i * 0.3) * 2;
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.quadraticCurveTo(gx + sway, gy - gh * 0.6, gx + sway * 1.5, gy - gh);
      ctx.stroke();
    }
  }

  // --- CAPA 2: COUPLE ---
  private renderCouple(ctx: CanvasRenderingContext2D) {
    const stepP = Math.sin(this.player.stepCycle) * 3;
    const stepC = Math.sin(this.companion.stepCycle) * 3;

    // === WYLLI ===
    ctx.save();
    ctx.translate(this.companion.x, this.companion.y);

    // Shadow
    ctx.fillStyle = 'rgba(10, 6, 16, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const sc = 2.5;
    if (this.companion.facingLeft) ctx.scale(-1, 1);

    // Legs (jeans)
    ctx.fillStyle = '#1b2838';
    ctx.fillRect(-6 * sc, -15 * sc + stepC, 5 * sc, 15 * sc - stepC);
    ctx.fillRect(1 * sc, -15 * sc - stepC, 5 * sc, 15 * sc + stepC);

    // White shirt
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(-9 * sc, -28 * sc, 18 * sc, 14 * sc);

    // Headphones
    ctx.fillStyle = '#111111';
    ctx.fillRect(-10 * sc, -29 * sc, 3 * sc, 5 * sc);
    ctx.fillRect(7 * sc, -29 * sc, 3 * sc, 5 * sc);

    // Head
    ctx.fillStyle = '#fcdbcf';
    ctx.fillRect(-5 * sc, -38 * sc, 10 * sc, 10 * sc);

    // Smile
    ctx.strokeStyle = '#c9846a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -33 * sc, 3 * sc, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(-3 * sc, -36 * sc, 2 * sc, 2 * sc);
    ctx.fillRect(2 * sc, -36 * sc, 2 * sc, 2 * sc);

    // Shark cap
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-7 * sc, -42 * sc, 14 * sc, 5 * sc);
    ctx.fillRect(3 * sc, -40 * sc, 5 * sc, 2 * sc);
    ctx.fillStyle = '#385a7c';
    ctx.fillRect(-2 * sc, -41 * sc, 4 * sc, 2 * sc);

    // Bouquet of yellow flowers in hand
    const bouquetX = 10 * sc;
    const bouquetY = -20 * sc;
    ctx.fillStyle = '#52b788';
    ctx.fillRect(bouquetX - 1, bouquetY, 2, 14);
    const petalColors = ['#f5c538', '#ffd166', '#ffe066'];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + Math.sin(performance.now() * 0.001) * 0.1;
      ctx.fillStyle = petalColors[i % 3];
      ctx.beginPath();
      ctx.ellipse(bouquetX + Math.cos(a) * 5, bouquetY - 4 + Math.sin(a) * 4, 3, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(bouquetX, bouquetY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // === GABY ===
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    // Shadow
    ctx.fillStyle = 'rgba(10, 6, 16, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.player.facingLeft) ctx.scale(-1, 1);

    // Legs
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(-6 * sc, -15 * sc + stepP, 5 * sc, 15 * sc - stepP);
    ctx.fillRect(1 * sc, -15 * sc - stepP, 5 * sc, 15 * sc + stepP);

    // Pink sweater
    ctx.fillStyle = '#f4ccd5';
    ctx.fillRect(-9 * sc, -28 * sc, 18 * sc, 14 * sc);

    // Head
    ctx.fillStyle = '#fcdbcf';
    ctx.fillRect(-5 * sc, -38 * sc, 10 * sc, 10 * sc);

    // Smile
    ctx.strokeStyle = '#c9846a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -33 * sc, 3 * sc, 0.1, Math.PI - 0.1);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#2c1810';
    ctx.fillRect(-3 * sc, -36 * sc, 2 * sc, 2 * sc);
    ctx.fillRect(2 * sc, -36 * sc, 2 * sc, 2 * sc);

    // Wavy hair
    ctx.fillStyle = '#442a1b';
    ctx.beginPath();
    ctx.arc(0, -36 * sc, 7.5 * sc, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-7 * sc, -36 * sc, 3 * sc, 10 * sc);
    ctx.fillRect(4 * sc, -36 * sc, 3 * sc, 10 * sc);
    // Wavy ends
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

    // Cup in hand
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3 * sc, -24 * sc, 6 * sc, 5 * sc);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-1 * sc, -25 * sc, 2 * sc, 1 * sc);
    // Steam
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

    ctx.restore();

    // Heart between them
    const dist = Math.hypot(this.player.x - this.companion.x, this.player.y - this.companion.y);
    if (dist < 50) {
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

    // Wylli speech bubble
    if (this.companion.bubbleTimer > 0) {
      this.drawSpeechBubble(ctx, this.companion.bubbleText, this.companion.x, this.companion.y - 110);
    }
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

    const lineHeight = 15;
    const bubbleW = maxWidth + 20;
    const bubbleH = lines.length * lineHeight + 14;
    const bx = cx - bubbleW / 2;
    const by = cy - bubbleH;

    ctx.fillStyle = 'rgba(43, 27, 36, 0.92)';
    ctx.strokeStyle = '#f5c538';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 10);
    ctx.fill();
    ctx.stroke();

    // Arrow
    ctx.beginPath();
    ctx.moveTo(cx - 5, by + bubbleH);
    ctx.lineTo(cx, by + bubbleH + 8);
    ctx.lineTo(cx + 5, by + bubbleH);
    ctx.fillStyle = 'rgba(43, 27, 36, 0.92)';
    ctx.fill();

    ctx.fillStyle = '#ffd447';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, by + 7 + i * lineHeight);
    }
    ctx.restore();
  }

  // --- CAPA 1/3: FLOWERS ---
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
      const petalCount = 12;
      ctx.fillStyle = '#f5c538';
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
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
      const petalCount = 8;
      ctx.fillStyle = '#fffdf0';
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
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

  // --- CAPA 4: PARTICLES ---
  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'sparkle') {
        // Four-pointed star
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

  // --- CAPA 4b: FLOATING PETALS ---
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

  // --- CAPA 5: DIALOGUE ---
  private renderDialogue(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (this.dialogueAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.dialogueAlpha;

    const text = 'Wylli: «Gracias por traerme de vuelta, Gaby... Feliz 21 de Septiembre. Este jardín es todo tuyo ❤️»';
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
    vig.addColorStop(1, 'rgba(43, 27, 36, 0.45)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
}

export const virtualWorldGame = new VirtualWorldGame();
