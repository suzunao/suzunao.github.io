import { audio } from './audio';
import { getGabySpriteSVG, getWylliStandingSpriteSVG, getCoupleTogetherSVG } from './characterSprites';

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
  type: 'pollen' | 'petal' | 'heart';
}

export interface MemoryNode {
  id: string;
  x: number;
  y: number;
  title: string;
  icon: string;
  clueBadge: string;
  message: string;
  unlocked: boolean;
}

export class VirtualWorldGame {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private container: HTMLElement | null = null;
  private isRunning: boolean = false;
  private animId: number | null = null;

  // Player (Gaby)
  public player = {
    x: 0,
    y: 80,
    targetX: 0,
    targetY: 80,
    speed: 3.5,
    isWalking: false,
    facingLeft: false,
    stepCycle: 0,
  };

  // Companion (Wylli)
  public companion = {
    x: -36,
    y: 80,
    targetX: -36,
    targetY: 80,
    speed: 3.2,
    isWalking: false,
    facingLeft: false,
    stepCycle: 0,
    bubbleText: '«Este mundo se compila solo para ti, amor ❤️»',
    bubbleTimer: 240,
  };

  // Camera
  private camera = {
    x: 0,
    y: 0,
  };

  // Input
  private keys: Record<string, boolean> = {};
  private pointerTarget: { x: number; y: number } | null = null;

  // World Elements
  private flowers: VirtualFlower[] = [];
  private particles: VirtualParticle[] = [];
  private generatedChunks: Set<string> = new Set();
  public flowerCount: number = 0;

  // Story Memory Nodes
  public nodes: MemoryNode[] = [
    {
      id: 'node_sun',
      x: -240,
      y: -180,
      title: 'Altar de la Servilleta: «SOS MI SOL»',
      icon: '📜',
      clueBadge: 'Cifrado ROT-3',
      message: 'Wylli: «Gaby... cuando dejé aquella servilleta en la mesita con "Vrv pl vro", quería recordarte que, sin importar qué tan frío o nublado sea el día, tú eres el sol que ilumina toda mi vida.»',
      unlocked: true,
    },
    {
      id: 'node_stars',
      x: 240,
      y: -180,
      title: 'Fuente de Estrellas: «MI CONSTELACION»',
      icon: '🔮',
      clueBadge: 'As Esteganográfico UV',
      message: 'Wylli: «En la pantalla puedo analizar millones de algoritmos, pero en el cielo de mis noches, tú eres la única constelación que orienta mi corazón hacia su hogar.»',
      unlocked: true,
    },
    {
      id: 'node_coffee',
      x: -200,
      y: 220,
      title: 'Alambique Barista: «DULCE DESPERTAR»',
      icon: '☕',
      clueBadge: 'Fórmula Barista Suprema',
      message: 'Wylli: «Despertar sabiendo que estás a mi lado, sintiendo el calor de tu mano y compartiendo un café en las mañanas, es el sueño más dulce que jamás imaginé tener.»',
      unlocked: true,
    },
    {
      id: 'node_finale',
      x: 0,
      y: -40,
      title: 'El Gran Núcleo de las Flores Amarillas (21 de Septiembre)',
      icon: '🌻',
      clueBadge: 'Promesa Eterna',
      message: 'Wylli: «¡Feliz 21 de Septiembre, mi hermosa detective Gaby! Creé este mundo virtual para que nuestras flores amarillas nunca marchiten y este instante juntos sea eterno. Te amo con todo mi ser.»',
      unlocked: true,
    },
  ];

  // Active Dialogue / Inspection
  private activeNodeNear: MemoryNode | null = null;
  private lastStepDistance: number = 0;

  constructor() {
    // Lazy setup
  }

  public init() {
    this.container = document.getElementById('virtualWorldModal');
    this.canvas = document.getElementById('virtualWorldCanvas') as HTMLCanvasElement;
    if (!this.canvas || !this.container) return;

    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInputs();
    this.seedInitialGarden();
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
    audio.playVictoryWaltz();

    // Start gameloop
    this.lastTime = performance.now();
    this.loop(this.lastTime);

    this.updateHUD();
    this.setWylliBubble('«¡Bienvenida a nuestro Mundo Virtual, Gaby! Camina conmigo ❤️»', 300);
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

      if (k === 'e' || k === ' ') {
        e.preventDefault();
        if (this.activeNodeNear) {
          this.inspectNode(this.activeNodeNear);
        } else {
          this.plantFlowerBurstAroundPlayer();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
    });

    // Canvas click / touch for destination walking
    this.canvas?.addEventListener('pointerdown', (e) => {
      if (!this.isRunning || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const clickScreenX = e.clientX - rect.left;
      const clickScreenY = e.clientY - rect.top;

      // Transform to world coordinates
      const worldX = clickScreenX - this.canvas.width / 2 + this.camera.x;
      const worldY = clickScreenY - this.canvas.height / 2 + this.camera.y;

      this.player.targetX = worldX;
      this.player.targetY = worldY;
      this.pointerTarget = { x: worldX, y: worldY };

      // Spawn a burst of flowers at target or underfoot
      this.spawnFlower(worldX, worldY, 'sunflower', 1.1);
      audio.playChime(620 + Math.random() * 200);
    });

    // UI Buttons
    document.getElementById('btnVwClose')?.addEventListener('click', () => this.close());
    document.getElementById('btnVwPlant')?.addEventListener('click', () => this.plantFlowerBurstAroundPlayer());
    document.getElementById('btnVwWaltz')?.addEventListener('click', () => this.triggerGrandFlowerStorm());
    document.getElementById('btnVwInspectLetter')?.addEventListener('click', () => {
      const letterModal = document.getElementById('secretGardenLetterContainer');
      const gardenModal = document.getElementById('secretGardenScenario');
      if (gardenModal) gardenModal.classList.add('active');
      if (letterModal) {
        letterModal.style.display = 'block';
        letterModal.scrollIntoView({ behavior: 'smooth' });
      }
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

  private seedInitialGarden() {
    // Generate an enchanted central garden around (0, 0)
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 180;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const types: ('sunflower' | 'daisy' | 'goldenRose' | 'starBlossom')[] = [
        'sunflower',
        'daisy',
        'goldenRose',
        'starBlossom',
      ];
      this.spawnFlower(x, y, types[Math.floor(Math.random() * types.length)], 0.8 + Math.random() * 0.5);
    }
  }

  public spawnFlower(
    x: number,
    y: number,
    type: 'sunflower' | 'daisy' | 'goldenRose' | 'starBlossom' = 'sunflower',
    targetScale = 1.0
  ) {
    const flower: VirtualFlower = {
      x,
      y,
      type,
      scale: 0.05,
      targetScale,
      rotation: (Math.random() - 0.5) * 0.4,
      stemHeight: 28 + Math.random() * 32,
      color: Math.random() > 0.3 ? '#ffd166' : '#ffe066',
      bloomSpeed: 0.04 + Math.random() * 0.03,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 1.5 + Math.random() * 1.5,
    };
    this.flowers.push(flower);
    this.flowerCount++;

    // Add rising golden particles
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 10,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.8 - Math.random() * 1.5,
        size: 3 + Math.random() * 4,
        alpha: 1,
        color: Math.random() > 0.4 ? '#ffd166' : '#fff3b0',
        life: 0,
        maxLife: 60 + Math.random() * 50,
        type: Math.random() > 0.8 ? 'heart' : 'pollen',
      });
    }

    this.updateHUD();
  }

  public plantFlowerBurstAroundPlayer() {
    audio.playVictoryWaltz();
    const cx = this.player.x;
    const cy = this.player.y;
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const radius = 35 + Math.random() * 45;
      const fx = cx + Math.cos(angle) * radius;
      const fy = cy + Math.sin(angle) * radius;
      const types: ('sunflower' | 'daisy' | 'goldenRose' | 'starBlossom')[] = [
        'sunflower',
        'daisy',
        'goldenRose',
        'starBlossom',
      ];
      this.spawnFlower(fx, fy, types[i % types.length], 0.9 + Math.random() * 0.4);
    }
    this.setWylliBubble('«¡Mira cómo brotan a tu alrededor, mi amor! 🌻»', 220);
  }

  public triggerGrandFlowerStorm() {
    audio.playVictoryWaltz();
    this.setWylliBubble('«¡El Vals de las Flores Amarillas del 21 de Septiembre! ✨»', 300);

    for (let i = 0; i < 70; i++) {
      setTimeout(() => {
        if (!this.isRunning) return;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 320;
        const fx = this.player.x + Math.cos(angle) * dist;
        const fy = this.player.y + Math.sin(angle) * dist;
        this.spawnFlower(fx, fy, 'sunflower', 1.0 + Math.random() * 0.5);
      }, i * 35);
    }
  }

  public setWylliBubble(text: string, durationFrames = 200) {
    this.companion.bubbleText = text;
    this.companion.bubbleTimer = durationFrames;
  }

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
    // 1. Process Player Input
    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      // Direct keyboard movement cancels pointer click target
      this.pointerTarget = null;
      const len = Math.hypot(moveX, moveY);
      const nx = moveX / len;
      const ny = moveY / len;

      this.player.x += nx * this.player.speed * (dt * 60);
      this.player.y += ny * this.player.speed * (dt * 60);
      this.player.isWalking = true;
      this.player.stepCycle += dt * 10;
      if (moveX !== 0) this.player.facingLeft = moveX < 0;

      this.onPlayerStep();
    } else if (this.pointerTarget) {
      // Move towards pointer click
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 5) {
        this.player.x += (dx / dist) * this.player.speed * (dt * 60);
        this.player.y += (dy / dist) * this.player.speed * (dt * 60);
        this.player.isWalking = true;
        this.player.stepCycle += dt * 10;
        this.player.facingLeft = dx < 0;
        this.onPlayerStep();
      } else {
        this.player.isWalking = false;
        this.pointerTarget = null;
      }
    } else {
      this.player.isWalking = false;
    }

    // 2. Procedural World Generation as player moves!
    this.checkProceduralGeneration(this.player.x, this.player.y);

    // 3. Companion (Wylli) AI Following
    // Wylli walks hand-in-hand / alongside Gaby (offset slightly to the side)
    const targetOffsetX = this.player.facingLeft ? 38 : -38;
    const targetOffsetY = 2;
    const companionTargetX = this.player.x + targetOffsetX;
    const companionTargetY = this.player.y + targetOffsetY;

    const compDx = companionTargetX - this.companion.x;
    const compDy = companionTargetY - this.companion.y;
    const compDist = Math.hypot(compDx, compDy);

    if (compDist > 8) {
      this.companion.x += (compDx / compDist) * Math.min(this.companion.speed, compDist * 0.12) * (dt * 60);
      this.companion.y += (compDy / compDist) * Math.min(this.companion.speed, compDist * 0.12) * (dt * 60);
      this.companion.isWalking = true;
      this.companion.stepCycle += dt * 9;
      this.companion.facingLeft = this.player.facingLeft;

      // Wylli also sprouts flowers when walking!
      if (Math.random() < 0.04) {
        this.spawnFlower(
          this.companion.x + (Math.random() - 0.5) * 14,
          this.companion.y + (Math.random() - 0.5) * 14,
          'daisy',
          0.8
        );
      }
    } else {
      this.companion.isWalking = false;
    }

    // Wylli bubble timer
    if (this.companion.bubbleTimer > 0) {
      this.companion.bubbleTimer--;
    }

    // 4. Smooth Camera Lerp
    const targetCamX = this.player.x;
    const targetCamY = this.player.y;
    this.camera.x += (targetCamX - this.camera.x) * 0.08;
    this.camera.y += (targetCamY - this.camera.y) * 0.08;

    // 5. Update Flowers Growth
    for (const f of this.flowers) {
      if (f.scale < f.targetScale) {
        f.scale = Math.min(f.targetScale, f.scale + f.bloomSpeed);
      }
    }

    // 6. Update Particles
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

    // 7. Check Proximity to Memory Nodes
    let nearNode: MemoryNode | null = null;
    for (const node of this.nodes) {
      const dist = Math.hypot(this.player.x - node.x, this.player.y - node.y);
      if (dist < 60) {
        nearNode = node;
        break;
      }
    }
    this.activeNodeNear = nearNode;
    this.updateInteractPrompt(nearNode);
  }

  private onPlayerStep() {
    this.lastStepDistance += this.player.speed;
    if (this.lastStepDistance > 26) {
      this.lastStepDistance = 0;
      audio.playStep();

      // Dynamically sprout a yellow flower along the trail!
      const fx = this.player.x + (Math.random() - 0.5) * 18;
      const fy = this.player.y + (Math.random() - 0.5) * 18;
      const types: ('sunflower' | 'daisy' | 'goldenRose' | 'starBlossom')[] = [
        'sunflower',
        'daisy',
        'goldenRose',
        'starBlossom',
      ];
      this.spawnFlower(fx, fy, types[Math.floor(Math.random() * types.length)], 0.85 + Math.random() * 0.4);
    }
  }

  // --- PROCEDURAL GENERATION: CHUNKS MATERIALIZE AHEAD ---
  private checkProceduralGeneration(px: number, py: number) {
    const chunkSize = 180;
    const chunkX = Math.floor(px / chunkSize);
    const chunkY = Math.floor(py / chunkSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cx = chunkX + dx;
        const cy = chunkY + dy;
        const key = `${cx},${cy}`;

        if (!this.generatedChunks.has(key)) {
          this.generatedChunks.add(key);
          this.generateChunk(cx * chunkSize, cy * chunkSize, chunkSize);
        }
      }
    }
  }

  private generateChunk(originX: number, originY: number, size: number) {
    // Generate 4 to 8 natural flowers in this new sector of the virtual world!
    const count = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const fx = originX + Math.random() * size;
      const fy = originY + Math.random() * size;
      const types: ('sunflower' | 'daisy' | 'goldenRose' | 'starBlossom')[] = [
        'sunflower',
        'daisy',
        'goldenRose',
        'starBlossom',
      ];
      this.spawnFlower(fx, fy, types[Math.floor(Math.random() * types.length)], 0.75 + Math.random() * 0.45);
    }
  }

  private updateInteractPrompt(node: MemoryNode | null) {
    const prompt = document.getElementById('vwInteractPrompt');
    const textEl = document.getElementById('vwPromptText');
    if (!prompt || !textEl) return;

    if (node) {
      prompt.classList.add('visible');
      textEl.textContent = `Explorar: ${node.title}`;
    } else {
      prompt.classList.remove('visible');
    }
  }

  public inspectNode(node: MemoryNode) {
    audio.playVictoryWaltz();
    this.setWylliBubble(node.message, 360);

    const modal = document.getElementById('vwMemoryModal');
    const title = document.getElementById('vwMemoryTitle');
    const badge = document.getElementById('vwMemoryBadge');
    const body = document.getElementById('vwMemoryBody');
    if (!modal || !title || !badge || !body) return;

    title.textContent = node.title;
    badge.textContent = node.clueBadge;
    body.textContent = node.message;
    modal.classList.add('active');

    document.getElementById('btnVwCloseMemory')?.addEventListener(
      'click',
      () => {
        modal.classList.remove('active');
      },
      { once: true }
    );
  }

  private updateHUD() {
    const countEl = document.getElementById('vwFlowerCount');
    if (countEl) countEl.textContent = String(this.flowerCount);
  }

  // --- RENDERING PIPELINE ---
  private render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Cyber Nebula & Twilight Background Gradient
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height));
    bgGrad.addColorStop(0, '#1c122e');
    bgGrad.addColorStop(0.5, '#120b20');
    bgGrad.addColorStop(1, '#080410');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Save context for camera transformation
    ctx.save();
    ctx.translate(width / 2 - this.camera.x, height / 2 - this.camera.y);

    // 2. Procedural Perspective Cyber Grid
    this.renderCyberGrid(ctx);

    // 3. Memory Nodes (Glowing Altars)
    this.renderMemoryNodes(ctx);

    // 4. Flowers (Sorted by Y for depth)
    const sortedFlowers = [...this.flowers].sort((a, b) => a.y - b.y);
    for (const f of sortedFlowers) {
      this.renderFlower(ctx, f);
    }

    // 5. Couple (Wylli & Gaby)
    this.renderCouple(ctx);

    // 6. Floating Pollen / Hearts / Petals
    this.renderParticles(ctx);

    ctx.restore();

    // 7. Screen-space ambient vignette
    this.renderScreenVignette(ctx, width, height);
  }

  private renderCyberGrid(ctx: CanvasRenderingContext2D) {
    const gridSize = 80;
    const startX = Math.floor((this.camera.x - this.canvas!.width) / gridSize) * gridSize;
    const endX = Math.ceil((this.camera.x + this.canvas!.width) / gridSize) * gridSize;
    const startY = Math.floor((this.camera.y - this.canvas!.height) / gridSize) * gridSize;
    const endY = Math.ceil((this.camera.y + this.canvas!.height) / gridSize) * gridSize;

    ctx.strokeStyle = 'rgba(245, 197, 56, 0.08)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Glowing intersections
    ctx.fillStyle = 'rgba(245, 197, 56, 0.2)';
    for (let x = startX; x <= endX; x += gridSize * 2) {
      for (let y = startY; y <= endY; y += gridSize * 2) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderMemoryNodes(ctx: CanvasRenderingContext2D) {
    const time = performance.now() * 0.002;
    for (const node of this.nodes) {
      // Glowing aura
      const auraGrad = ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, 45);
      auraGrad.addColorStop(0, 'rgba(255, 209, 102, 0.45)');
      auraGrad.addColorStop(0.6, 'rgba(245, 197, 56, 0.15)');
      auraGrad.addColorStop(1, 'rgba(245, 197, 56, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 45, 0, Math.PI * 2);
      ctx.fill();

      // Rotating cyber rings
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.rotate(time);
      ctx.strokeStyle = '#f5c538';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Center Icon
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.icon, node.x, node.y - 2);

      // Label
      ctx.font = 'bold 11px Nunito, sans-serif';
      ctx.fillStyle = '#fff3b0';
      ctx.fillText(node.title, node.x, node.y + 36);
    }
  }

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

    // Stem Leaves
    ctx.fillStyle = '#74c69d';
    ctx.beginPath();
    ctx.ellipse(6, -f.stemHeight * 0.4, 7, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Flower Head
    ctx.translate(0, -f.stemHeight);

    if (f.type === 'sunflower') {
      // Golden Sunflowers
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

      // Dark brown seed center
      ctx.fillStyle = '#582e14';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3d1c08';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (f.type === 'daisy') {
      // White and Yellow Daisy
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
      // Golden Rose / Star Blossom
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

  private renderCouple(ctx: CanvasRenderingContext2D) {
    // 1. Wylli Avatar
    ctx.save();
    ctx.translate(this.companion.x, this.companion.y);

    // Soft shadow
    ctx.fillStyle = 'rgba(10, 6, 16, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sprite drawing
    this.drawPixelCharacter(ctx, 'wylli', this.companion.facingLeft, this.companion.stepCycle);

    // Speech Bubble if active
    if (this.companion.bubbleTimer > 0) {
      this.drawSpeechBubble(ctx, this.companion.bubbleText);
    }

    ctx.restore();

    // 2. Gaby Avatar
    ctx.save();
    ctx.translate(this.player.x, this.player.y);

    ctx.fillStyle = 'rgba(10, 6, 16, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    this.drawPixelCharacter(ctx, 'gaby', this.player.facingLeft, this.player.stepCycle);

    ctx.restore();

    // Love bond line / holding hands when close
    const dist = Math.hypot(this.player.x - this.companion.x, this.player.y - this.companion.y);
    if (dist < 55) {
      ctx.save();
      const midX = (this.player.x + this.companion.x) / 2;
      const midY = (this.player.y + this.companion.y) / 2 - 20;

      ctx.fillStyle = '#ff4d6d';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', midX, midY - 6 + Math.sin(performance.now() * 0.005) * 3);
      ctx.restore();
    }
  }

  private drawPixelCharacter(
    ctx: CanvasRenderingContext2D,
    who: 'gaby' | 'wylli',
    facingLeft: boolean,
    stepCycle: number
  ) {
    ctx.save();
    if (facingLeft) ctx.scale(-1, 1);

    const step = Math.sin(stepCycle) * 3;

    if (who === 'gaby') {
      // Gaby: Pink Sweater, wavy hair, cup
      // Legs
      ctx.fillStyle = '#1e1e1e';
      ctx.fillRect(-6, -15, 5, 15 + step);
      ctx.fillRect(1, -15, 5, 15 - step);

      // Pink sweater
      ctx.fillStyle = '#f4ccd5';
      ctx.fillRect(-9, -28, 18, 14);

      // Head & Hair
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-5, -38, 10, 10);

      ctx.fillStyle = '#442a1b';
      ctx.beginPath();
      ctx.arc(0, -36, 7.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-7, -36, 3, 10);
      ctx.fillRect(4, -36, 3, 10);

      // Cute Cup
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -24, 6, 5);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-1, -25, 2, 1);
    } else {
      // Wylli: White Shark Cap, Headphones, dark jeans
      // Legs
      ctx.fillStyle = '#1b2838';
      ctx.fillRect(-6, -15, 5, 15 + step);
      ctx.fillRect(1, -15, 5, 15 - step);

      // White cyber shirt
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(-9, -28, 18, 14);

      // Headphones around neck
      ctx.fillStyle = '#111111';
      ctx.fillRect(-10, -29, 3, 5);
      ctx.fillRect(7, -29, 3, 5);

      // Head
      ctx.fillStyle = '#fcdbcf';
      ctx.fillRect(-5, -38, 10, 10);

      // White Shark Cap
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-7, -42, 14, 5);
      ctx.fillRect(3, -40, 5, 2); // Visor
      ctx.fillStyle = '#385a7c'; // Shark silhouette
      ctx.fillRect(-2, -41, 4, 2);
    }

    ctx.restore();
  }

  private drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string) {
    ctx.save();
    ctx.font = 'bold 11px Nunito, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const bubbleWidth = textWidth + 20;
    const bubbleHeight = 26;
    const bubbleX = -bubbleWidth / 2;
    const bubbleY = -68;

    // Rounded rectangle bubble
    ctx.fillStyle = 'rgba(28, 18, 42, 0.92)';
    ctx.strokeStyle = '#f5c538';
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Arrow pointer
    ctx.beginPath();
    ctx.moveTo(-4, bubbleY + bubbleHeight);
    ctx.lineTo(0, bubbleY + bubbleHeight + 6);
    ctx.lineTo(4, bubbleY + bubbleHeight);
    ctx.fillStyle = 'rgba(28, 18, 42, 0.92)';
    ctx.fill();

    // Text
    ctx.fillStyle = '#ffd447';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, bubbleY + bubbleHeight / 2);

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'heart') {
        ctx.font = `${p.size * 2}px sans-serif`;
        ctx.fillText('❤️', p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderScreenVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.4, w / 2, h / 2, Math.max(w, h) * 0.7);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(8, 4, 16, 0.6)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
}

export const virtualWorldGame = new VirtualWorldGame();
