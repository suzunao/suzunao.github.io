import { GameState, Hotspot } from './types';
import { audio } from './audio';
import { STORY_CHAPTERS, HOTSPOT_DIALOGUES, ACCEPTED_ANSWERS, NOLAN_RADIO_ADVICES, PROLOGUE_STEPS } from './story';
import { getSpeakerAvatarHTML, getWillySpriteSVG, getCoupleTogetherSVG, getGabySpriteSVG, getNolanSpriteSVG } from './characterSprites';
import { virtualWorldGame } from './virtualWorld';
import Phaser from 'phaser';
import { PHASER_CONFIG } from './phaserConfig';
import { BootScene, SalaScene, GardenScene } from './phaserScenes';

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/flag\{|\}/g, '')
    .trim();
}

export class GameController {
  public state: GameState = {
    currentChapter: 0,
    activeTab: 'novel',
    activeHotspot: null,
    flags: {
      flag1: false,
      flag2: false,
      flag3: false,
    },
    investigated: {
      living: false,
      bedroom: false,
      kitchen: false,
    },
    toolsTried: {
      rot3: false,
      uv: false,
      barista: false,
    },
    awakened: false,
    gardenRevealed: false,
    muted: false,
    currentScene: null,
  };

  public readonly CHAPTER_PROGRESS = { PROLOGUE: 0, CHAP_1: 1, CHAP_2: 2, CHAP_3: 3, EPILOGUE: 4 };
  public currentActiveChapter: number = 1;
  public isGrinderCalibrated: boolean = false;

  private currentRadioFlag: 1 | 2 | 3 = 1;
  private nolanStepIndex: number = 0;
  private currentPrologueIndex: number = 0;
  private activeNovelViewChapter: number = 1;
  private uvLightOn: boolean = false;
  private baristaStep: number = 0;
  private caesarCurrentShift: number = 0;
  private caesarSourcePhrase: string = 'Vrv pl vro';
  private phaserGame: Phaser.Game | null = null;

  // Hotspots definition based on exact user coordinates
  public hotspots: Hotspot[] = [
    {
      id: 'barista',
      name: 'Máquina de Espresso y Molinillo',
      room: 'Cocina',
      x: 31,
      y: 33,
      radius: 7,
      actionText: 'Calibrar la molienda del Café Supremo',
      speaker: 'narrator',
      storyChapter: 3,
    },
    {
      id: 'willy',
      name: 'Willy (Sillón de la Sala)',
      room: 'Sala de Estar',
      x: 45,
      y: 44,
      radius: 7,
      actionText: 'Inspeccionar taza de té y notas de ciberseguridad',
      speaker: 'willy',
      storyChapter: 1,
    },
    {
      id: 'table',
      name: 'Mesa de Centro con Taza y Servilleta',
      room: 'Sala de Estar',
      x: 50,
      y: 42,
      radius: 6,
      actionText: '🔍 Inspeccionar la Mesa de Centro',
      speaker: 'nolan',
      storyChapter: 1,
    },
    {
      id: 'michi',
      name: 'Michi Blanco & As de Corazones',
      room: 'Dormitorio',
      x: 68,
      y: 56,
      radius: 7,
      actionText: 'Acariciar al Michi y ver los naipes de Solitario',
      speaker: 'michi',
      storyChapter: 2,
    },
    {
      id: 'nolan',
      name: 'Oficial John Nolan (Puesto de Guardia)',
      room: 'Gazebo & Jardín',
      x: 18,
      y: 68,
      radius: 8,
      actionText: 'Hablar por radio con Nolan sobre el perímetro',
      speaker: 'nolan',
      storyChapter: 0,
    },
  ];

  // Walkable mask: zones where Gaby can walk (percentage-based polygons)
  private static WALKABLE_ZONES = [
    // Camino exterior de tierra
    { x1: 10, y1: 75, x2: 40, y2: 95 },
    // Puente de madera y escaleras
    { x1: 22, y1: 65, x2: 38, y2: 78 },
    // Planta principal - pasillo central
    { x1: 25, y1: 25, x2: 75, y2: 70 },
    // Zona de cocina
    { x1: 25, y1: 25, x2: 45, y2: 40 },
    // Sala de estar
    { x1: 40, y1: 35, x2: 65, y2: 55 },
    // Dormitorio
    { x1: 60, y1: 45, x2: 90, y2: 70 },
    // Gazebo exterior
    { x1: 10, y1: 60, x2: 30, y2: 80 },
  ];

  // Blocked zones: obstacles Gaby cannot walk through
  private static BLOCKED_ZONES = [
    // Estanque de agua
    { type: 'ellipse' as const, cx: 55, cy: 82, rx: 10, ry: 6 },
    // Piscina termal
    { type: 'ellipse' as const, cx: 70, cy: 80, rx: 8, ry: 5 },
    // Chimenea
    { x1: 20, y1: 30, x2: 28, y2: 40 },
    // Cama
    { x1: 72, y1: 50, x2: 88, y2: 65 },
    // Mostrador cocina
    { x1: 28, y1: 28, x2: 38, y2: 35 },
  ];

  private isPointInRect(x: number, y: number, zone: { x1: number; y1: number; x2: number; y2: number }): boolean {
    return x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2;
  }

  private isPointInEllipse(x: number, y: number, zone: { cx: number; cy: number; rx: number; ry: number }): boolean {
    const dx = (x - zone.cx) / zone.rx;
    const dy = (y - zone.cy) / zone.ry;
    return dx * dx + dy * dy <= 1;
  }

  private isPointInWalkable(x: number, y: number): boolean {
    for (const zone of GameController.WALKABLE_ZONES) {
      if (this.isPointInRect(x, y, zone)) return true;
    }
    return false;
  }

  private isPointBlocked(x: number, y: number): boolean {
    for (const zone of GameController.BLOCKED_ZONES) {
      if ('type' in zone && zone.type === 'ellipse') {
        if (this.isPointInEllipse(x, y, zone)) return true;
      } else if ('x1' in zone) {
        if (this.isPointInRect(x, y, zone)) return true;
      }
    }
    return false;
  }

  private findNearestFreePoint(x: number, y: number): { x: number; y: number } {
    if (this.isPointInWalkable(x, y) && !this.isPointBlocked(x, y)) return { x, y };

    // Search in expanding circles for nearest free point
    for (let r = 1; r <= 20; r++) {
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        const testX = x + Math.cos(rad) * r;
        const testY = y + Math.sin(rad) * r;
        if (this.isPointInWalkable(testX, testY) && !this.isPointBlocked(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }
    return { x, y }; // fallback
  }

  // Gaby movement state
  public gaby = {
    x: 48,
    y: 52,
    targetX: 48,
    targetY: 52,
    isWalking: false,
    facingLeft: false,
  };

  private walkAnimFrame: number | null = null;
  private onArrivalCallback: (() => void) | null = null;
  private petalInterval: number | null = null;

  constructor() {
    this.init();
  }

  private init() {
    this.setupMap();
    this.setupUI();
    this.renderChapters();
    this.updateProgressBadge();
    this.updateNotebookProceduralState();
    this.setupCaesarInteractiveDecoder();
    virtualWorldGame.init();
    this.setupListeners();
    this.updateGabyElement();
    this.checkProximity();
    this.openPrologue(0);
  }

  private createPhaserGame(parentId: string): Phaser.Game {
    if (this.phaserGame) {
      this.phaserGame.destroy(true);
      this.phaserGame = null;
    }

    const game = new Phaser.Game({
      ...PHASER_CONFIG,
      parent: parentId,
      scene: [BootScene, SalaScene, GardenScene],
    });

    this.phaserGame = game;
    return game;
  }

  private setupMap() {
    const stage = document.getElementById('scenicStage');
    if (!stage) return;

    // Click on scenic stage to walk
    stage.addEventListener('click', (e: MouseEvent) => {
      // If clicked a button inside, let it handle
      const target = e.target as HTMLElement;
      if (target.closest('.hotspot-zone') || target.closest('.rpg-interact-prompt')) {
        return;
      }

      const rect = stage.getBoundingClientRect();
      const clickXPercent = Math.max(12, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
      const clickYPercent = Math.max(18, Math.min(84, ((e.clientY - rect.top) / rect.height) * 100));

      // Show marker at nearest free point
      const freePoint = this.findNearestFreePoint(clickXPercent, clickYPercent);
      this.showDestinationMarker(freePoint.x, freePoint.y);
      this.walkTo(clickXPercent, clickYPercent);

      // If garden revealed, spawn flowers on click
      if (this.state.gardenRevealed) {
        this.spawnFlowerAt(e.clientX - rect.left, e.clientY - rect.top);
      }
    });

    // Wire up hotspot clicks directly
    this.hotspots.forEach((spot) => {
      const el = document.getElementById(
        spot.id === 'barista'
          ? 'hotspotBarista'
          : spot.id === 'willy'
          ? 'hotspotWilly'
          : spot.id === 'table'
          ? 'hotspotTable'
          : spot.id === 'michi'
          ? 'hotspotMichi'
          : spot.id === 'nolan'
          ? 'hotspotNolan'
          : ''
      );

      if (el) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          audio.init();
          this.showDestinationMarker(spot.x, spot.y);
          this.walkTo(spot.x, spot.y, () => {
            this.triggerHotspotDialogue(spot);
          });
        });
      }
    });
  }

  public showDestinationMarker(x: number, y: number) {
    const marker = document.getElementById('destMarker');
    if (!marker) return;

    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.classList.remove('active');
    // Force reflow
    void marker.offsetWidth;
    marker.classList.add('active');
  }

  public walkTo(targetX: number, targetY: number, onArrival?: () => void) {
    // Find nearest free point if target is blocked or outside walkable zones
    const freePoint = this.findNearestFreePoint(targetX, targetY);
    this.gaby.targetX = Math.max(12, Math.min(88, freePoint.x));
    this.gaby.targetY = Math.max(18, Math.min(84, freePoint.y));
    this.onArrivalCallback = onArrival || null;

    if (this.gaby.targetX < this.gaby.x) {
      this.gaby.facingLeft = true;
    } else if (this.gaby.targetX > this.gaby.x) {
      this.gaby.facingLeft = false;
    }

    if (!this.gaby.isWalking) {
      this.gaby.isWalking = true;
      this.walkLoop();
    }
  }

  private walkLoop = () => {
    const dx = this.gaby.targetX - this.gaby.x;
    const dy = this.gaby.targetY - this.gaby.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.8) {
      // Arrived
      this.gaby.x = this.gaby.targetX;
      this.gaby.y = this.gaby.targetY;
      this.gaby.isWalking = false;
      this.updateGabyElement();
      this.checkProximity();

      if (this.onArrivalCallback) {
        const cb = this.onArrivalCallback;
        this.onArrivalCallback = null;
        cb();
      }
      return;
    }

    // Step size (smooth walking speed)
    const step = Math.min(dist, 0.48);
    this.gaby.x += (dx / dist) * step;
    this.gaby.y += (dy / dist) * step;

    this.updateGabyElement();
    this.checkProximity();

    this.walkAnimFrame = requestAnimationFrame(this.walkLoop);
  };

  private updateGabyElement() {
    const avatarEl = document.getElementById('gabyAvatar');
    const spriteEl = document.getElementById('gabySpriteInner');
    if (!avatarEl || !spriteEl) return;

    avatarEl.style.left = `${this.gaby.x}%`;
    avatarEl.style.top = `${this.gaby.y}%`;

    if (this.gaby.isWalking) {
      avatarEl.classList.add('walking');
    } else {
      avatarEl.classList.remove('walking');
    }

    if (this.gaby.facingLeft) {
      spriteEl.classList.add('face-left');
    } else {
      spriteEl.classList.remove('face-left');
    }
  }

  private checkProximity() {
    let nearestSpot: Hotspot | null = null;
    let minDistance = Infinity;

    for (const spot of this.hotspots) {
      // Aspect ratio compensation
      const dist = Math.hypot(this.gaby.x - spot.x, (this.gaby.y - spot.y) * 1.35);
      if (dist < spot.radius && dist < minDistance) {
        nearestSpot = spot;
        minDistance = dist;
      }
    }

    this.state.activeHotspot = nearestSpot;

    const promptEl = document.getElementById('rpgInteractPrompt');
    const promptText = document.getElementById('interactPromptText');
    if (promptEl && promptText) {
      if (nearestSpot) {
        promptText.textContent = nearestSpot.actionText;
        promptEl.style.display = 'flex';
      } else {
        promptEl.style.display = 'none';
      }
    }
  }

  private setupUI() {
    // Prompt button click
    const promptEl = document.getElementById('rpgInteractPrompt');
    if (promptEl) {
      promptEl.addEventListener('click', () => {
        if (this.state.activeHotspot) {
          this.triggerHotspotDialogue(this.state.activeHotspot);
        }
      });
    }
  }

  public triggerHotspotDialogue(spot: Hotspot) {
    audio.init();
    let dialogue = HOTSPOT_DIALOGUES[spot.id] || HOTSPOT_DIALOGUES.cinnamonTea;

    // Procedural context-aware dialogues to prevent story clutter & re-investigation
    if (spot.id === 'willy') {
      if (this.state.awakened) {
        dialogue = {
          speaker: 'willy',
          speakerName: 'Willy (¡Willy Despierto!)',
          avatar: '💻',
          atmosphere: 'Willy te sonríe con infinita ternura sosteniendo tu mano...',
          text: '«—¡Gaby, mi amada detective! Desperté con el Café Supremo y tu amor. Pero la verdadera sorpresa de este 21 de septiembre te espera en nuestro portal interactivo: he programado un <strong>Mundo Virtual que se crea y florece solo a tu paso</strong>, lleno de flores amarillas infinitas. ¡Ven conmigo a explorarlo!»',
        };
      } else if (this.state.flags.flag1) {
        dialogue = {
          speaker: 'willy',
          speakerName: 'Sala de Estar (Expediente #1 Archivado)',
          avatar: '💻',
          atmosphere: 'Willy descansa con un sueño dulce y reparador sobre los cojines verdes...',
          text: '«Willy duerme con una sonrisa apacible. La servilleta ROT-3 ya fue descifrada con éxito: <strong>«SOS MI SOL»</strong>. El indicio está resuelto y archivado en tu libreta. Ya no es necesario volver a investigarlo.»',
        };
      }
    } else if (spot.id === 'michi') {
      if (!this.state.flags.flag1) {
        dialogue = {
          speaker: 'michi',
          speakerName: 'Dormitorio (Indicio Sellado 🔒)',
          avatar: '🐱',
          atmosphere: 'El Michi blanco duerme plácidamente sobre el edredón...',
          text: '«Acaricias con cariño al Michi blanco sin despertarlo. 🔒 <em>Indicio Sellado:</em> Para no alarmarlo, debes resolver primero el <strong>Caso #1 (La Servilleta ROT-3)</strong> junto a Willy en la sala. Una vez resuelto, podrás acceder al naipe bajo su patita.»',
        };
      } else if (this.state.flags.flag2) {
        dialogue = {
          speaker: 'michi',
          speakerName: 'Dormitorio (Expediente #2 Archivado)',
          avatar: '🐱',
          atmosphere: 'El Michi blanco ronronea feliz, satisfecho con tu caricia...',
          text: '«El Michi blanco ronronea con deleite. El As de Corazones esteganográfico ya fue revelado con la luz ultravioleta: <strong>«MI CONSTELACION»</strong>. El caso #2 está resuelto y archivado en tu libreta. Ya no tienes que volver a investigar este indicio.»',
        };
      }
    } else if (spot.id === 'barista') {
      if (!this.state.flags.flag2) {
        dialogue = {
          speaker: 'narrator',
          speakerName: 'Cocina & Cafetera (Indicio Sellado 🔒)',
          avatar: '☕',
          atmosphere: 'La cafetera de espresso de cobre está apagada y fría...',
          text: '«Examinas la máquina barista. 🔒 <em>Indicio Sellado:</em> Los manómetros están en reposo. Primero debes descifrar el mensaje esteganográfico en el dormitorio para calibrar el espresso. ¡Resuelve el <strong>Caso #2 (El As del Michi)</strong> primero!»',
        };
      } else if (this.state.flags.flag3) {
        dialogue = {
          speaker: 'narrator',
          speakerName: 'Cocina & Cafetera (Expediente #3 Archivado)',
          avatar: '☕',
          atmosphere: 'El aroma a canela y espresso recién extraído inunda la barra...',
          text: '«La extracción del Café Supremo ha finalizado con la fórmula maestra: <strong>«DULCE DESPERTAR»</strong>. El caso #3 está completado y archivado. La taza está humeante y lista para Willy.»',
        };
      }
    }

    if (!dialogue) return;

    // Mark scene as physically investigated by Gaby
    if (spot.id === 'willy') {
      if (!this.state.investigated.living) {
        this.state.investigated.living = true;
        this.renderChapters();
        this.updateNotebookProceduralState();
        this.showToast('📜 ¡Indicio recogido! Servilleta con ROT-3 añadida a tus herramientas.');
      }
    } else if (spot.id === 'michi') {
      if (this.state.flags.flag1 && !this.state.investigated.bedroom) {
        this.state.investigated.bedroom = true;
        this.renderChapters();
        this.updateNotebookProceduralState();
        this.showToast('🃏 ¡Indicio descubierto! As de Corazones esteganográfico añadido a tu libreta.');
      }
    } else if (spot.id === 'barista') {
      if (this.state.flags.flag2 && !this.state.investigated.kitchen) {
        this.state.investigated.kitchen = true;
        this.renderChapters();
        this.updateNotebookProceduralState();
        this.showToast('☕ ¡Máquina barista examinada! Parámetro D____ D________ listo para calibrar.');
      }
    }

    // Play thematic audio
    if (spot.id === 'willy') audio.playChime(440);
    else if (spot.id === 'michi') audio.playPurr();
    else if (spot.id === 'barista') audio.playSteam();
    else if (spot.id === 'nolan') audio.playRadioBeep();
    else audio.playChime(523);

    // Open Visual Novel Dialogue Box
    this.openNovelDialogue(dialogue, spot);

    // Log to narrative chronicle
    this.addChronicleEntry(dialogue.speakerName, dialogue.text, dialogue.avatar, spot?.speaker || dialogue.speaker);
  }

  public openNovelDialogue(
    dialogue: { speaker?: string; speakerName: string; avatar: string; atmosphere?: string; text: string },
    spot?: Hotspot
  ) {
    const modal = document.getElementById('visualNovelModal');
    const nameEl = document.getElementById('vnSpeakerName');
    const avatarEl = document.getElementById('vnAvatar');
    const atmoEl = document.getElementById('vnAtmosphere');
    const textEl = document.getElementById('vnText');
    const actionsEl = document.getElementById('vnActions');

    if (!modal || !nameEl || !avatarEl || !atmoEl || !textEl || !actionsEl) return;

    nameEl.textContent = dialogue.speakerName;
    const speakerKey = (spot?.speaker || dialogue.speaker || 'narrator') as any;
    avatarEl.innerHTML = getSpeakerAvatarHTML(speakerKey, 44, this.state.awakened);
    atmoEl.textContent = dialogue.atmosphere || '';
    textEl.innerHTML = dialogue.text;

    actionsEl.innerHTML = '';

    // Action 1: Forensic Tools or Procedural Navigation
    if (spot && spot.id === 'willy') {
      if (this.state.awakened) {
        const btnVw = document.createElement('button');
        btnVw.className = 'vn-choice-btn primary';
        btnVw.style.background = 'linear-gradient(135deg, #f5c538, #d48e1b)';
        btnVw.style.color = '#1f1103';
        btnVw.innerHTML = '<span>🌐</span> Entrar al Mundo Virtual de Flores Amarillas';
        btnVw.onclick = () => {
          this.closeNovelDialogue();
          this.openGardenScene();
        };
        actionsEl.appendChild(btnVw);

        const btnGarden = document.createElement('button');
        btnGarden.className = 'vn-choice-btn';
        btnGarden.innerHTML = '<span>🌸</span> Ver Jardín Secreto de la Terraza';
        btnGarden.onclick = () => {
          this.closeNovelDialogue();
          this.openSecretGardenScenario();
        };
        actionsEl.appendChild(btnGarden);
      } else if (this.state.flags.flag1) {
        // Case 1 is already closed!
        const archivedBadge = document.createElement('div');
        archivedBadge.className = 'case-archived-summary';
        archivedBadge.style.margin = '0 0 8px 0';
        archivedBadge.innerHTML = `
          <div class="archived-check">✅</div>
          <div class="archived-info">
            <div class="archived-title">Caso #1 Archivado</div>
            <div class="archived-solution">«SOS MI SOL»</div>
          </div>
        `;
        actionsEl.appendChild(archivedBadge);

        if (!this.state.flags.flag2) {
          const btnNext = document.createElement('button');
          btnNext.className = 'vn-choice-btn primary';
          btnNext.innerHTML = '<span>🐾</span> Ir al Dormitorio a examinar el As del Michi';
          btnNext.onclick = () => {
            this.closeNovelDialogue();
            this.walkTo(84, 60, () => {
              const bSpot = this.hotspots.find((s) => s.id === 'michi');
              if (bSpot) this.triggerHotspotDialogue(bSpot);
            });
          };
          actionsEl.appendChild(btnNext);
        } else if (!this.state.flags.flag3) {
          const btnNext = document.createElement('button');
          btnNext.className = 'vn-choice-btn primary';
          btnNext.innerHTML = '<span>☕</span> Ir a la Cocina a calibrar la Cafetera Barista';
          btnNext.onclick = () => {
            this.closeNovelDialogue();
            this.walkTo(36, 30, () => {
              const kSpot = this.hotspots.find((s) => s.id === 'barista');
              if (kSpot) this.triggerHotspotDialogue(kSpot);
            });
          };
          actionsEl.appendChild(btnNext);
        } else {
          const btnServe = document.createElement('button');
          btnServe.className = 'vn-choice-btn primary';
          btnServe.innerHTML = '<span>☕</span> Preparar y Servir el Café Supremo a Willy';
          btnServe.onclick = () => {
            this.closeNovelDialogue();
            document.getElementById('btnServeCoffee')?.click();
          };
          actionsEl.appendChild(btnServe);
        }
      } else {
        const btnTool = document.createElement('button');
        btnTool.className = 'vn-choice-btn primary';
        btnTool.innerHTML = '<span>🔍</span> Inspeccionar Servilleta con Lupa ROT-3';
        btnTool.onclick = () => {
          this.closeNovelDialogue();
          this.openRot3Modal();
        };
        actionsEl.appendChild(btnTool);
      }
    } else if (spot && spot.id === 'michi') {
      if (!this.state.flags.flag1) {
        const btnGoLiving = document.createElement('button');
        btnGoLiving.className = 'vn-choice-btn primary';
        btnGoLiving.innerHTML = '<span>🛋️</span> Ir a la Sala (Caso #1 en curso)';
        btnGoLiving.onclick = () => {
          this.closeNovelDialogue();
          this.walkTo(58, 42, () => {
            const lSpot = this.hotspots.find((s) => s.id === 'willy');
            if (lSpot) this.triggerHotspotDialogue(lSpot);
          });
        };
        actionsEl.appendChild(btnGoLiving);
      } else if (this.state.flags.flag2) {
        // Case 2 is already closed!
        const archivedBadge = document.createElement('div');
        archivedBadge.className = 'case-archived-summary';
        archivedBadge.style.margin = '0 0 8px 0';
        archivedBadge.innerHTML = `
          <div class="archived-check">✅</div>
          <div class="archived-info">
            <div class="archived-title">Caso #2 Archivado</div>
            <div class="archived-solution">«MI CONSTELACION»</div>
          </div>
        `;
        actionsEl.appendChild(archivedBadge);

        if (!this.state.flags.flag3) {
          const btnNext = document.createElement('button');
          btnNext.className = 'vn-choice-btn primary';
          btnNext.innerHTML = '<span>☕</span> Ir a la Cocina a calibrar la Cafetera Barista';
          btnNext.onclick = () => {
            this.closeNovelDialogue();
            this.walkTo(36, 30, () => {
              const kSpot = this.hotspots.find((s) => s.id === 'barista');
              if (kSpot) this.triggerHotspotDialogue(kSpot);
            });
          };
          actionsEl.appendChild(btnNext);
        } else {
          const btnServe = document.createElement('button');
          btnServe.className = 'vn-choice-btn primary';
          btnServe.innerHTML = '<span>☕</span> Ir a la Sala a servir el Café a Willy';
          btnServe.onclick = () => {
            this.closeNovelDialogue();
            this.walkTo(58, 42, () => {
              document.getElementById('btnServeCoffee')?.click();
            });
          };
          actionsEl.appendChild(btnServe);
        }
      } else {
        const btnTool = document.createElement('button');
        btnTool.className = 'vn-choice-btn primary';
        btnTool.innerHTML = '<span>🔮</span> Inspeccionar As con Luz Ultravioleta UV';
        btnTool.onclick = () => {
          this.closeNovelDialogue();
          this.openUvModal();
        };
        actionsEl.appendChild(btnTool);
      }
    } else if (spot && spot.id === 'barista') {
      if (!this.state.flags.flag2) {
        const btnGoBedroom = document.createElement('button');
        btnGoBedroom.className = 'vn-choice-btn primary';
        btnGoBedroom.innerHTML = '<span>🛏️</span> Ir al Dormitorio (Caso #2 en curso)';
        btnGoBedroom.onclick = () => {
          this.closeNovelDialogue();
          this.walkTo(84, 60, () => {
            const bSpot = this.hotspots.find((s) => s.id === 'michi');
            if (bSpot) this.triggerHotspotDialogue(bSpot);
          });
        };
        actionsEl.appendChild(btnGoBedroom);
      } else if (this.state.flags.flag3) {
        // Case 3 is already closed!
        const archivedBadge = document.createElement('div');
        archivedBadge.className = 'case-archived-summary';
        archivedBadge.style.margin = '0 0 8px 0';
        archivedBadge.innerHTML = `
          <div class="archived-check">✅</div>
          <div class="archived-info">
            <div class="archived-title">Caso #3 Archivado</div>
            <div class="archived-solution">«DULCE DESPERTAR»</div>
          </div>
        `;
        actionsEl.appendChild(archivedBadge);

        if (!this.state.awakened) {
          const btnServe = document.createElement('button');
          btnServe.className = 'vn-choice-btn primary';
          btnServe.innerHTML = '<span>☕</span> Llevar Café Supremo a Willy en la Sala';
          btnServe.onclick = () => {
            this.closeNovelDialogue();
            this.walkTo(58, 42, () => {
              document.getElementById('btnServeCoffee')?.click();
            });
          };
          actionsEl.appendChild(btnServe);
        } else {
          const btnVw = document.createElement('button');
          btnVw.className = 'vn-choice-btn primary';
          btnVw.innerHTML = '<span>🌐</span> Entrar al Mundo Virtual de Flores Amarillas';
          btnVw.onclick = () => {
            this.closeNovelDialogue();
            this.openGardenScene();
          };
          actionsEl.appendChild(btnVw);
        }
      } else {
        const btnTool = document.createElement('button');
        btnTool.className = 'vn-choice-btn primary';
        btnTool.innerHTML = '<span>☕</span> Activar Estación Barista de Café Supremo';
        btnTool.onclick = () => {
          this.closeNovelDialogue();
          this.openBaristaModal();
        };
        actionsEl.appendChild(btnTool);
      }
    } else if (spot && spot.id === 'nolan') {
      const btnRadio = document.createElement('button');
      btnRadio.className = 'vn-choice-btn primary';
      btnRadio.innerHTML = '<span>📻</span> Transmisión Táctica LAPD con Nolan';
      btnRadio.onclick = () => {
        this.closeNovelDialogue();
        this.openNolanRadioModal();
      };
      actionsEl.appendChild(btnRadio);
    }

    // Action 2: Nolan's advice from anywhere
    if (spot && spot.id !== 'nolan') {
      const btnNolan = document.createElement('button');
      btnNolan.className = 'vn-choice-btn';
      btnNolan.innerHTML = '<span>📻</span> Pedir Consejo por Radio a Nolan';
      btnNolan.onclick = () => {
        this.closeNovelDialogue();
        const flagTarget: 1 | 2 | 3 = spot.id === 'willy' ? 1 : spot.id === 'michi' ? 2 : 3;
        this.openNolanRadioModal(flagTarget);
      };
      actionsEl.appendChild(btnNolan);
    }

    // Action 3: Open notebook
    const btnDeduce = document.createElement('button');
    btnDeduce.className = 'vn-choice-btn';
    btnDeduce.innerHTML = '<span>📝</span> Ver Libreta de Casos';
    btnDeduce.onclick = () => {
      this.closeNovelDialogue();
      this.switchTab('notebook');
    };
    actionsEl.appendChild(btnDeduce);

    // Close button
    const btnClose = document.createElement('button');
    btnClose.className = 'vn-choice-btn subtle';
    btnClose.textContent = 'Continuar explorando';
    btnClose.onclick = () => this.closeNovelDialogue();
    actionsEl.appendChild(btnClose);

    modal.classList.add('active');
  }

  public closeNovelDialogue() {
    const modal = document.getElementById('visualNovelModal');
    if (modal) modal.classList.remove('active');
  }

  public switchTab(tab: 'novel' | 'notebook') {
    this.state.activeTab = tab;
    const btnNovel = document.getElementById('tabBtnNovel');
    const btnNotebook = document.getElementById('tabBtnNotebook');
    const panelNovel = document.getElementById('panelNovel');
    const panelNotebook = document.getElementById('panelNotebook');

    if (tab === 'novel') {
      btnNovel?.classList.add('active');
      btnNotebook?.classList.remove('active');
      panelNovel?.classList.add('active');
      panelNotebook?.classList.remove('active');
    } else {
      btnNotebook?.classList.add('active');
      btnNovel?.classList.remove('active');
      panelNotebook?.classList.add('active');
      panelNovel?.classList.remove('active');
    }
  }

  public isChapterUnlocked(id: number): boolean {
    return id <= this.currentActiveChapter;
  }

  public getCurrentActiveChapterId(): number {
    if (!this.state.flags.flag1) return 1;
    if (!this.state.flags.flag2) return 2;
    if (!this.state.flags.flag3) return 3;
    return 4;
  }

  public renderChapters() {
    const list = document.getElementById('chaptersList');
    const stepper = document.getElementById('novelChaptersStepper');
    const statusEl = document.getElementById('novelProgressStatus');
    if (!list) return;

    const currentActiveId = this.getCurrentActiveChapterId();

    // If activeNovelViewChapter is locked, point to current active chapter
    if (!this.isChapterUnlocked(this.activeNovelViewChapter)) {
      this.activeNovelViewChapter = currentActiveId;
    }

    if (statusEl) {
      if (currentActiveId === 4 && (this.state.awakened || this.state.gardenRevealed)) {
        statusEl.textContent = '🌸 Historia Completa · Jardín Revelado';
      } else {
        const roman = ['Prólogo', 'I', 'II', 'III', 'Epílogo'];
        statusEl.textContent = `Capítulo ${roman[currentActiveId]} en investigación · Paso a paso`;
      }
    }

    // Render stepper pills
    if (stepper) {
      stepper.innerHTML = '';
      STORY_CHAPTERS.forEach((ch) => {
        const isUnlocked = this.isChapterUnlocked(ch.id);
        const isSolved = ch.solved;
        const isSelected = this.activeNovelViewChapter === ch.id;

        const pill = document.createElement('button');
        let icon = '🔒';
        let stateClass = 'locked';

        if (isSolved) {
          icon = ch.id === 4 ? '🌸' : '✅';
          stateClass = 'solved';
        } else if (isUnlocked) {
          icon = '📖';
          stateClass = isSelected ? 'active' : 'unlocked';
        }

        pill.className = `stepper-pill ${stateClass} ${isSelected ? 'active' : ''}`;
        const shortLabels = ['Prólogo', 'Cap. I', 'Cap. II', 'Cap. III', 'Epílogo'];
        pill.innerHTML = `<span>${icon}</span> ${shortLabels[ch.id] || ch.title}`;

        pill.onclick = () => {
          if (!isUnlocked) {
            audio.playChime(220);
            this.showToast('🔒 Capítulo bloqueado. Resuelve el enigma anterior para continuar.');
            return;
          }
          audio.playRadioClick();
          this.activeNovelViewChapter = ch.id;
          this.renderChapters();
          const targetCard = document.getElementById(`chapterCard-${ch.id}`);
          targetCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        stepper.appendChild(pill);
      });
    }

    list.innerHTML = '';

    // Only render unlocked chapters, plus at most ONE next locked chapter
    // Farther locked chapters are kept hidden to avoid premature context and spoilers
    let nextLockedShown = false;

    STORY_CHAPTERS.forEach((ch) => {
      const isUnlocked = this.isChapterUnlocked(ch.id);
      const card = document.createElement('article');
      card.id = `chapterCard-${ch.id}`;

      if (!isUnlocked) {
        const classifiedTitles: Record<number, {title: string; subtitle: string}> = {
          1: { title: 'Capítulo I: [CONFIDENCIAL — ???]', subtitle: '████████████████████████████████████████████' },
          2: { title: 'Capítulo II: [CONFIDENCIAL — ???]', subtitle: '████████████████████████████████████████████' },
          3: { title: 'Capítulo III: [CONFIDENCIAL — ???]', subtitle: '████████████████████████████████████████████' },
          4: { title: 'Epílogo: [ARCHIVO CLASIFICADO]', subtitle: '████████████████████████████████████████████' },
        };
        const censored = classifiedTitles[ch.id] || { title: 'Capítulo: [CLASSIFICADO]', subtitle: '████████████████████████████████████████████' };

        card.className = 'novel-chapter-card locked-card';
        card.innerHTML = `
          <div class="chapter-badge locked">🔒 ARCHIVO CLASIFICADO</div>
          <h4 class="chapter-title locked">${censored.title}</h4>
          <div class="chapter-subtitle locked">${censored.subtitle}</div>
          <div class="chapter-locked" style="padding: 24px; text-align: center; color: #7f5539; font-weight: 600; background: #faedcd; border-radius: 8px; margin-top: 16px;">
            Completa el objetivo activo para desclasificar este capítulo.
          </div>
        `;
        list.appendChild(card);
        return;
      }

      const isSelected = this.activeNovelViewChapter === ch.id;
      card.className = `novel-chapter-card ${ch.solved ? 'solved' : ''} ${isSelected ? 'active-reading' : ''}`;

        // Action shortcuts for active unsolved chapter
        let actionsHTML = '';
        if (!ch.solved && ch.id > 0) {
          const roomKey = ch.roomTarget as 'willy' | 'michi' | 'barista';
          const isInvestigated = this.state.investigated[roomKey as keyof typeof this.state.investigated];

          if (!isInvestigated) {
            actionsHTML = `
              <div class="novel-mission-box">
                <strong>🕵️‍♀️ Fase 1: Recopilación de Campo</strong><br>
                El indicio físico aún no ha sido recogido de la escena. Camina hasta <em>${ch.roomLabel || 'la estancia'}</em> e inspecciona el lugar para descubrir la pista de Willy.
              </div>
              <div class="novel-actions-row">
                ${
                  ch.roomTarget
                    ? `<button class="novel-action-btn primary" data-action="goto-room" data-room="${ch.roomTarget}">🚶‍♀️ Ir a ${ch.roomLabel || ch.roomTarget} a Investigar</button>`
                    : ''
                }
                ${
                  ch.toolTarget
                    ? `<button class="novel-action-btn disabled" data-action="locked-tool" data-room="${ch.roomTarget}" data-tool-name="${ch.toolName}">🔒 ${ch.toolName || 'Herramienta'} (Bloqueado)</button>`
                    : ''
                }
                ${
                  ch.targetFlagNum
                    ? `<button class="novel-action-btn secondary" data-action="nolan-radio" data-flag="${ch.targetFlagNum}">📻 Orientación de Nolan</button>`
                    : ''
                }
              </div>
            `;
          } else {
            actionsHTML = `
              <div class="novel-mission-box investigated">
                <strong>🔍 Fase 2: Análisis Forense de la Evidencia</strong><br>
                ¡Indicio asegurado en tu libreta! Aplica tu <em>${ch.toolName}</em> para descifrar el mensaje secreto o analiza las hipótesis junto a Nolan.
              </div>
              <div class="novel-actions-row">
                ${
                  ch.toolTarget
                    ? `<button class="novel-action-btn primary" data-action="open-tool" data-tool="${ch.toolTarget}">🔍 Abrir ${ch.toolName || 'Herramienta Forense'}</button>`
                    : ''
                }
                ${
                  ch.targetFlagNum
                    ? `<button class="novel-action-btn secondary" data-action="nolan-radio" data-flag="${ch.targetFlagNum}">📻 Pistas Forenses de Nolan</button>`
                    : ''
                }
                ${
                  ch.roomTarget
                    ? `<button class="novel-action-btn" data-action="goto-room" data-room="${ch.roomTarget}">🚶‍♀️ Volver a la Escena</button>`
                    : ''
                }
              </div>
            `;
          }
        } else if (ch.solved && ch.id === 4) {
          actionsHTML = `
            <div class="novel-actions-row">
              <button class="novel-action-btn primary" data-action="open-garden">🌸 Ir al Jardín Secreto de las Flores Amarillas</button>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="chapter-badge">${ch.solved ? '✅ Capítulo Resuelto' : isSelected ? '📖 En Investigación' : '📖 Capítulo'}</div>
          <h4 class="chapter-title">${ch.title}</h4>
          <div class="chapter-subtitle">${ch.subtitle}</div>
          <div class="chapter-prose">${ch.prose.replace(/\n\n/g, '<br><br>')}</div>
          ${
            ch.clueHint && !ch.solved
              ? `<div class="chapter-hint"><strong>🔍 Pista del Enigma:</strong> ${ch.clueHint}</div>`
              : ''
          }
          ${actionsHTML}
        `;

        // Wire action button events inside card
        card.querySelectorAll('button[data-action]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.getAttribute('data-action');
            if (action === 'goto-room') {
              const room = btn.getAttribute('data-room');
              const coords: Record<string, { x: number; y: number; spotId: string }> = {
                willy: { x: 45, y: 44, spotId: 'willy' },
                barista: { x: 31, y: 33, spotId: 'barista' },
                michi: { x: 68, y: 56, spotId: 'michi' },
                nolan: { x: 18, y: 68, spotId: 'nolan' },
              };
              if (room && coords[room]) {
                const target = coords[room];
                this.showDestinationMarker(target.x, target.y);
                this.walkTo(target.x, target.y, () => {
                  const spot = this.hotspots.find((s) => s.id === target.spotId);
                  if (spot) this.triggerHotspotDialogue(spot);
                });
                this.showToast(`🚶‍♀️ Caminando hacia ${ch.roomLabel}...`);
              }
            } else if (action === 'open-tool') {
              const tool = btn.getAttribute('data-tool');
              if (tool === 'rot3') this.openRot3Modal();
              else if (tool === 'uv') this.openUvModal();
              else if (tool === 'barista') this.openBaristaModal();
            } else if (action === 'nolan-radio') {
              const flag = parseInt(btn.getAttribute('data-flag') || '1', 10) as 1 | 2 | 3;
              this.openNolanRadioModal(flag);
            } else if (action === 'open-garden') {
              this.openSecretGardenScenario();
            }
          });
        });

        list.appendChild(card);
    });
  }

  public addChronicleEntry(sender: string, text: string, avatar = '📜', speakerKey?: string) {
    const list = document.getElementById('chronicleList');
    if (!list) return;

    const item = document.createElement('div');
    item.className = 'chronicle-item';

    let avatarHTML = '';
    const key = speakerKey || (['gaby', 'willy', 'nolan', 'michi', 'narrator'].includes(avatar) ? avatar : null);
    if (key) {
      avatarHTML = getSpeakerAvatarHTML(key as any, 22, this.state.awakened);
    } else if (avatar.includes('<svg')) {
      avatarHTML = avatar;
    } else {
      avatarHTML = `<span style="font-size: 13px;">${avatar}</span>`;
    }

    item.innerHTML = `
      <div class="chronicle-header">
        <span class="chronicle-avatar">${avatarHTML}</span>
        <strong>${sender}</strong>
      </div>
      <div class="chronicle-content">${text}</div>
    `;
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  public validateFlag(num: 1 | 2 | 3) {
    const input = document.getElementById(`flagInput${num}`) as HTMLInputElement;
    const card = document.getElementById(`flagCard${num}`);
    const tag = document.getElementById(`flagTag${num}`);
    if (!input || !card || !tag) return;

    // Procedural progression guard:
    if (num === 2 && !this.state.flags.flag1) {
      audio.playChime(220);
      this.showToast('🔒 Debes resolver primero el Caso #1 (La Servilleta ROT-3) en la sala.');
      return;
    }
    if (num === 3 && !this.state.flags.flag2) {
      audio.playChime(220);
      this.showToast('🔒 Debes resolver primero el Caso #2 (El As del Michi) en el dormitorio.');
      return;
    }

    const val = normalizeStr(input.value);
    const validAnswers = ACCEPTED_ANSWERS[`flag${num}`];
    const isCorrect = validAnswers.some((ans) => {
      const normAns = normalizeStr(ans);
      return val === normAns || val.includes(normAns);
    });

    if (isCorrect) {
      audio.playChime(523.25 + num * 70);
      this.state.flags[`flag${num}`] = true;
      input.classList.remove('invalid');
      input.classList.add('valid');
      input.disabled = true;
      card.classList.add('completed');
      tag.textContent = '✅ Resuelto';
      this.showToast(`✨ ¡Enigma #${num} descifrado con maestría!`);

      // Update hotspot visual status
      if (num === 1) {
        const spotEl = document.getElementById('hotspotWilly');
        const statusEl = document.getElementById('statusLiving');
        spotEl?.classList.add('completed');
        if (statusEl) statusEl.textContent = '✅';
      } else if (num === 2) {
        const spotEl = document.getElementById('hotspotMichi');
        const statusEl = document.getElementById('statusBedroom');
        spotEl?.classList.add('completed');
        if (statusEl) statusEl.textContent = '✅';
      } else if (num === 3) {
        const spotEl = document.getElementById('hotspotBarista');
        const statusEl = document.getElementById('statusBarista');
        spotEl?.classList.add('completed');
        if (statusEl) statusEl.textContent = '✅';
      }

      // Update story chapter procedurally
      if (STORY_CHAPTERS[num]) {
        STORY_CHAPTERS[num].solved = true;
        this.currentActiveChapter = Math.max(this.currentActiveChapter, num + 1);
        const nextChapterId = Math.min(4, num + 1);
        this.activeNovelViewChapter = nextChapterId;
        this.renderChapters();
        const romanNames = ['Prólogo', 'I', 'II', 'III', 'Epílogo'];
        this.showToast(`📖 ¡Capítulo ${romanNames[nextChapterId]} desbloqueado en el Modo Novela!`);
        audio.playChime(660);
      }

      this.updateProgressBadge();
      this.updateNotebookProceduralState();
    } else {
      audio.playChime(220);
      input.classList.add('invalid');
      this.showToast('❌ Deducción incorrecta. Revisa el texto de la novela.');
    }
  }

  public updateNotebookProceduralState() {
    const card1 = document.getElementById('flagCard1');
    const card2 = document.getElementById('flagCard2');
    const card3 = document.getElementById('flagCard3');

    const input1 = document.getElementById('flagInput1') as HTMLInputElement;
    const input2 = document.getElementById('flagInput2') as HTMLInputElement;
    const input3 = document.getElementById('flagInput3') as HTMLInputElement;

    const btn1 = document.getElementById('btnVal1') as HTMLButtonElement;
    const btn2 = document.getElementById('btnVal2') as HTMLButtonElement;
    const btn3 = document.getElementById('btnVal3') as HTMLButtonElement;

    const tag1 = document.getElementById('flagTag1');
    const tag2 = document.getElementById('flagTag2');
    const tag3 = document.getElementById('flagTag3');

    const lockNotice2 = document.getElementById('lockNotice2');
    const lockNotice3 = document.getElementById('lockNotice3');

    const btnOpenRot3 = document.getElementById('btnOpenRot3Modal') as HTMLButtonElement;
    const btnOpenUv = document.getElementById('btnOpenUvModal') as HTMLButtonElement;
    const btnNolan2 = document.getElementById('btnNolanFlag2') as HTMLButtonElement;
    const btnOpenBarista = document.getElementById('btnOpenBaristaModal') as HTMLButtonElement;
    const btnNolan3 = document.getElementById('btnNolanFlag3') as HTMLButtonElement;

    const statusEl = document.getElementById('notebookProgressStatus');

    const sum1 = document.getElementById('archivedSummary1');
    const act1 = document.getElementById('activeContent1');
    const sum2 = document.getElementById('archivedSummary2');
    const act2 = document.getElementById('activeContent2');
    const sum3 = document.getElementById('archivedSummary3');
    const act3 = document.getElementById('activeContent3');
    const title2 = document.getElementById('flagTitle2');
    const title3 = document.getElementById('flagTitle3');

    // Case 1: Always available initially
    if (this.state.flags.flag1) {
      card1?.classList.remove('locked-case');
      card1?.classList.add('completed', 'archived-case');
      if (tag1) {
        tag1.className = 'flag-state-tag';
        tag1.textContent = '✅ Resuelto & Archivado';
      }
      if (sum1) sum1.style.display = 'flex';
      if (act1) act1.style.display = 'none';
      if (input1) input1.disabled = true;
      if (btn1) btn1.disabled = true;
    } else {
      card1?.classList.remove('locked-case', 'completed', 'archived-case');
      if (tag1) {
        tag1.className = 'flag-state-tag';
        tag1.textContent = this.state.investigated.living ? '🔍 Evidencia en Análisis' : '⏳ En Campo';
      }
      if (sum1) sum1.style.display = 'none';
      if (act1) act1.style.display = 'block';
      if (input1) input1.disabled = false;
      if (btn1) btn1.disabled = false;

      if (btnOpenRot3) {
        if (!this.state.investigated.living) {
          btnOpenRot3.innerHTML = '<span>🔒</span> 1. Recoger Servilleta en la Sala';
          if (input1) input1.placeholder = '🔒 Primero inspecciona la servilleta en la sala...';
        } else {
          btnOpenRot3.innerHTML = '<span>🔍</span> 2. Decodificador César Interactivo';
          if (input1) input1.placeholder = 'FLAG{...} o tu deducción (ej: S__ M_ S__)';
        }
      }
    }

    // Case 2: Unlocked only after Flag 1 solved
    if (this.state.flags.flag2) {
      card2?.classList.remove('locked-case');
      card2?.classList.add('completed', 'archived-case');
      if (tag2) {
        tag2.className = 'flag-state-tag';
        tag2.textContent = '✅ Resuelto & Archivado';
      }
      if (title2) title2.innerHTML = '<span>🃏</span> 2. El As Esteganográfico del Michi';
      if (sum2) sum2.style.display = 'flex';
      if (act2) act2.style.display = 'none';
      if (lockNotice2) lockNotice2.style.display = 'none';
      if (input2) input2.disabled = true;
      if (btn2) btn2.disabled = true;
      if (btnOpenUv) btnOpenUv.disabled = false;
      if (btnNolan2) btnNolan2.disabled = false;
    } else if (this.state.flags.flag1) {
      card2?.classList.remove('locked-case', 'completed', 'archived-case');
      if (tag2) {
        tag2.className = 'flag-state-tag';
        tag2.textContent = this.state.investigated.bedroom ? '🔮 Evidencia en Análisis' : '⏳ En Campo';
      }
      if (title2) title2.innerHTML = '<span>🔮</span> 2. El As Esteganográfico del Michi';
      if (sum2) sum2.style.display = 'none';
      if (act2) act2.style.display = 'block';
      if (lockNotice2) lockNotice2.style.display = 'none';
      if (input2) input2.disabled = false;
      if (btn2) btn2.disabled = false;
      if (btnOpenUv) {
        btnOpenUv.disabled = false;
        if (!this.state.investigated.bedroom) {
          btnOpenUv.innerHTML = '<span>🔒</span> 1. Descubrir As con el Michi';
          if (input2) input2.placeholder = '🔒 Acaricia al Michi en el dormitorio para ver el naipe...';
        } else {
          btnOpenUv.innerHTML = '<span>🔮</span> 2. Luz Ultravioleta UV Forense';
          if (input2) input2.placeholder = 'FLAG{...} o tu deducción (ej: M_ C___________N)';
        }
      }
      if (btnNolan2) btnNolan2.disabled = false;
    } else {
      card2?.classList.add('locked-case');
      card2?.classList.remove('completed', 'archived-case');
      if (tag2) {
        tag2.className = 'flag-state-tag locked';
        tag2.textContent = '🔒 Bloqueado (Caso #1)';
      }
      if (title2) title2.innerHTML = '<span>🔒</span> 2. [Diligencia Clasificada ???]';
      if (sum2) sum2.style.display = 'none';
      if (act2) act2.style.display = 'none';
      if (lockNotice2) lockNotice2.style.display = 'flex';
      if (input2) {
        input2.disabled = true;
        input2.placeholder = '🔒 Resuelve primero el Caso #1 para desbloquear';
      }
      if (btn2) btn2.disabled = true;
      if (btnOpenUv) btnOpenUv.disabled = true;
      if (btnNolan2) btnNolan2.disabled = true;
    }

    // Case 3: Unlocked only after Flag 2 solved
    if (this.state.flags.flag3) {
      card3?.classList.remove('locked-case');
      card3?.classList.add('completed', 'archived-case');
      if (tag3) {
        tag3.className = 'flag-state-tag';
        tag3.textContent = '✅ Resuelto & Archivado';
      }
      if (title3) title3.innerHTML = '<span>⚙️</span> 3. El Parámetro Barista de Willy';
      if (sum3) sum3.style.display = 'flex';
      if (act3) act3.style.display = 'none';
      if (lockNotice3) lockNotice3.style.display = 'none';
      if (input3) input3.disabled = true;
      if (btn3) btn3.disabled = true;
      if (btnOpenBarista) btnOpenBarista.disabled = false;
      if (btnNolan3) btnNolan3.disabled = false;
    } else if (this.state.flags.flag2) {
      card3?.classList.remove('locked-case', 'completed', 'archived-case');
      if (tag3) {
        tag3.className = 'flag-state-tag';
        tag3.textContent = this.state.investigated.kitchen ? '☕ Evidencia en Análisis' : '⏳ En Campo';
      }
      if (title3) title3.innerHTML = '<span>☕</span> 3. El Parámetro Barista de Willy';
      if (sum3) sum3.style.display = 'none';
      if (act3) act3.style.display = 'block';
      if (lockNotice3) lockNotice3.style.display = 'none';
      if (input3) input3.disabled = false;
      if (btn3) btn3.disabled = false;
      if (btnOpenBarista) {
        btnOpenBarista.disabled = false;
        if (!this.state.investigated.kitchen) {
          btnOpenBarista.innerHTML = '<span>🔒</span> 1. Examinar Cafetera en Cocina';
          if (input3) input3.placeholder = '🔒 Examina la cafetera y pizarra en la cocina...';
        } else {
          btnOpenBarista.innerHTML = '<span>⚙️</span> 2. Estación Barista de Café';
          if (input3) input3.placeholder = 'FLAG{...} o tu deducción (ej: D____ D________)';
        }
      }
      if (btnNolan3) btnNolan3.disabled = false;
    } else {
      card3?.classList.add('locked-case');
      card3?.classList.remove('completed', 'archived-case');
      if (tag3) {
        tag3.className = 'flag-state-tag locked';
        tag3.textContent = '🔒 Bloqueado (Caso #2)';
      }
      if (title3) title3.innerHTML = '<span>🔒</span> 3. [Protocolo de Cierre Clasificado ???]';
      if (sum3) sum3.style.display = 'none';
      if (act3) act3.style.display = 'none';
      if (lockNotice3) lockNotice3.style.display = 'flex';
      if (input3) {
        input3.disabled = true;
        input3.placeholder = '🔒 Resuelve primero el Caso #2 para desbloquear';
      }
      if (btn3) btn3.disabled = true;
      if (btnOpenBarista) btnOpenBarista.disabled = true;
      if (btnNolan3) btnNolan3.disabled = true;
    }

    if (statusEl) {
      if (this.state.flags.flag1 && this.state.flags.flag2 && this.state.flags.flag3) {
        statusEl.textContent = '¡Todos los casos resueltos! Prepara el café ✨';
      } else if (this.state.flags.flag2) {
        statusEl.textContent = 'Caso 3 de 3 en investigación';
      } else if (this.state.flags.flag1) {
        statusEl.textContent = 'Caso 2 de 3 en investigación';
      } else {
        statusEl.textContent = 'Caso 1 de 3 en investigación';
      }
    }
  }

  // --- INTERACTIVE CAESAR CIPHER DECODER SYSTEM ---

  private caesarShift(text: string, shift: number): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return text
      .split('')
      .map((char) => {
        const upper = char.toUpperCase();
        const idx = alphabet.indexOf(upper);
        if (idx === -1) return char;
        let shiftedIdx = (idx + shift) % 26;
        if (shiftedIdx < 0) shiftedIdx += 26;
        const res = alphabet[shiftedIdx];
        return char === upper ? res : res.toLowerCase();
      })
      .join('');
  }

  public setupCaesarInteractiveDecoder() {
    const slider = document.getElementById('caesarShiftSlider') as HTMLInputElement;
    const btnMinus = document.getElementById('btnCaesarStepMinus');
    const btnPlus = document.getElementById('btnCaesarStepPlus');
    const presets = document.querySelectorAll('.caesar-preset-btn');
    const btnApply = document.getElementById('btnApplyCaesarToNotebook');

    slider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      this.caesarCurrentShift = val;
      this.renderCaesarDecoder();
      audio.playRadioClick();
    });

    btnMinus?.addEventListener('click', () => {
      if (this.caesarCurrentShift > -13) {
        this.caesarCurrentShift--;
        if (slider) slider.value = String(this.caesarCurrentShift);
        this.renderCaesarDecoder();
        audio.playRadioClick();
      }
    });

    btnPlus?.addEventListener('click', () => {
      if (this.caesarCurrentShift < 13) {
        this.caesarCurrentShift++;
        if (slider) slider.value = String(this.caesarCurrentShift);
        this.renderCaesarDecoder();
        audio.playRadioClick();
      }
    });

    presets.forEach((btn) => {
      btn.addEventListener('click', () => {
        const shift = parseInt(btn.getAttribute('data-shift') || '0', 10);
        this.caesarCurrentShift = shift;
        if (slider) slider.value = String(shift);
        this.renderCaesarDecoder();
        audio.playRadioClick();
      });
    });

    btnApply?.addEventListener('click', () => {
      audio.playChime(660);
      const input = document.getElementById('flagInput1') as HTMLInputElement;
      if (input) input.value = 'SOS MI SOL';
      const manualInput = document.getElementById('rot3DeductionInput') as HTMLInputElement;
      if (manualInput) manualInput.value = 'SOS MI SOL';
      this.validateFlag(1);
      this.showToast('✨ «SOS MI SOL» anotado en tu libreta. ¡Caso #1 resuelto!');
      setTimeout(() => this.closeRot3Modal(), 1200);
    });

    this.renderCaesarDecoder();
  }

  public renderCaesarDecoder() {
    const badgeText = document.getElementById('caesarShiftValText');
    if (badgeText) {
      badgeText.textContent = `${this.caesarCurrentShift >= 0 ? '+' : ''}${this.caesarCurrentShift}`;
    }

    // Update active preset button
    document.querySelectorAll('.caesar-preset-btn').forEach((btn) => {
      const shift = parseInt(btn.getAttribute('data-shift') || '0', 10);
      if (shift === this.caesarCurrentShift) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Dual Alphabet strip
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const origContainer = document.getElementById('alphabetStripOriginal');
    const shiftContainer = document.getElementById('alphabetStripShifted');
    const cipherCharsUpper = this.caesarSourcePhrase.toUpperCase().replace(/\s/g, '');

    if (origContainer) {
      origContainer.innerHTML = alphabet
        .map((ch) => {
          const inCipher = cipherCharsUpper.includes(ch);
          return `<span class="alpha-cell ${inCipher ? 'in-cipher' : ''}">${ch}</span>`;
        })
        .join('');
    }

    if (shiftContainer) {
      shiftContainer.innerHTML = alphabet
        .map((ch) => {
          const shiftedCh = this.caesarShift(ch, this.caesarCurrentShift);
          const inCipher = cipherCharsUpper.includes(ch);
          return `<span class="alpha-cell ${inCipher ? 'mapped-active' : ''}">${shiftedCh}</span>`;
        })
        .join('');
    }

    // Dynamic word tiles
    const tilesContainer = document.getElementById('caesarInteractiveTiles');
    if (tilesContainer) {
      const words = this.caesarSourcePhrase.split(' ');
      const wordsHTML = words
        .map((word) => {
          const lettersHTML = word
            .split('')
            .map((char) => {
              const shifted = this.caesarShift(char, this.caesarCurrentShift);
              const isMatch = this.caesarCurrentShift === -3;
              return `
                <div class="step-letter-box ${isMatch ? 'solved' : ''}">
                  <span class="src-char">${char}</span>
                  <span class="arrow-rot">↓ ${this.caesarCurrentShift >= 0 ? '+' : ''}${this.caesarCurrentShift}</span>
                  <span class="target-char ${isMatch ? 'highlight' : ''}">${shifted}</span>
                </div>
              `;
            })
            .join('');
          return `<div style="display:flex; gap:4px;">${lettersHTML}</div>`;
        })
        .join('<div class="step-separator">·</div>');

      tilesContainer.innerHTML = wordsHTML;
    }

    // Decoded sentence banner
    const decodedText = this.caesarShift(this.caesarSourcePhrase, this.caesarCurrentShift).toUpperCase();
    const resultText = document.getElementById('caesarDecodedResultText');
    const resultBanner = document.getElementById('caesarResultBanner');
    const matchTag = document.getElementById('caesarMatchTag');
    const transferBox = document.getElementById('caesarTransferBox');

    if (resultText) resultText.textContent = decodedText;

    const isMatch = decodedText === 'SOS MI SOL';
    if (isMatch) {
      resultBanner?.classList.add('match');
      if (matchTag) {
        matchTag.textContent = '✨ ¡Mensaje Coherente Revelado: «SOS MI SOL»!';
      }
      transferBox?.classList.add('visible');
    } else {
      resultBanner?.classList.remove('match');
      if (matchTag) {
        matchTag.textContent = `🔍 Girando abecedario (${this.caesarCurrentShift >= 0 ? '+' : ''}${this.caesarCurrentShift}). Sigue buscando.`;
      }
      transferBox?.classList.remove('visible');
    }
  }

  private updateProgressBadge() {
    let count = 0;
    if (this.state.flags.flag1) count++;
    if (this.state.flags.flag2) count++;
    if (this.state.flags.flag3) count++;

    const badge = document.getElementById('progressBadge');
    if (badge) badge.textContent = `${count} / 3`;

    const btnServe = document.getElementById('btnServeCoffee') as HTMLButtonElement;
    if (count === 3 && btnServe) {
      btnServe.removeAttribute('disabled');
      btnServe.classList.add('unlocked');
      btnServe.innerHTML = '<span>☕</span> ¡Servir Café Supremo y Despertar a Willy!';
      audio.playVictoryWaltz();
      this.showToast('🎉 ¡Los 3 sellos han sido descifrados! Las flores amarillas comienzan a brotar.');

      // Emergence of yellow flowers at bottom of cabin stage
      this.bloomMeadowInCabinStage();

      this.addChronicleEntry(
        'Oficial John Nolan',
        '¡Brillante deducción, Detective Gaby! Supo unir cada indicio con maestría. La cabaña vibra con flores amarillas y el aroma a canela. Es hora de llevarle el Café Supremo a Willy.',
        '👮‍♂️',
        'nolan'
      );
    }
  }

  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  public showToast(msg: string) {
    const toast = document.getElementById('cozyToast');
    if (!toast) return;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    toast.textContent = msg;
    toast.classList.add('show');
    this.toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // --- FORENSIC MODALS & INVESTIGATION SYSTEM ---

  // --- CINEMATIC STORY PROLOGUE SYSTEM ---

  public openPrologue(step: number = 0) {
    this.currentPrologueIndex = Math.max(0, Math.min(PROLOGUE_STEPS.length - 1, step));
    const modal = document.getElementById('introStoryPrologue');
    if (!modal) return;
    modal.classList.add('active');
    this.renderPrologueStep(this.currentPrologueIndex);

    if (this.currentPrologueIndex === 2) {
      audio.playPhoneRing();
    } else if (this.currentPrologueIndex === 3) {
      audio.playRadioClick();
    } else {
      audio.playChime(440);
    }
  }

  public closePrologue() {
    document.getElementById('introStoryPrologue')?.classList.remove('active');
    this.showToast('🌲 Has ingresado a la cabaña. ¡Explora con WASD o el ratón!');
  }

  public nextPrologueStep() {
    if (this.currentPrologueIndex < PROLOGUE_STEPS.length - 1) {
      this.currentPrologueIndex++;
      this.renderPrologueStep(this.currentPrologueIndex);
      if (this.currentPrologueIndex === 2) {
        audio.playPhoneRing();
      } else if (this.currentPrologueIndex === 3) {
        audio.playRadioClick();
      } else {
        audio.playChime(520);
      }
    } else {
      // Finished prologue, enter cabin!
      audio.playChime(660);
      this.closePrologue();
    }
  }

  public prevPrologueStep() {
    if (this.currentPrologueIndex > 0) {
      this.currentPrologueIndex--;
      this.renderPrologueStep(this.currentPrologueIndex);
      audio.playRadioClick();
    }
  }

  public renderPrologueStep(index: number) {
    const step = PROLOGUE_STEPS[index];
    if (!step) return;

    const badge = document.getElementById('prologueActBadge');
    const dots = document.querySelectorAll('#prologueStepsDots .p-dot');
    const frame = document.getElementById('prologueArtFrame');
    const avatar = document.getElementById('prologueSpeakerAvatar');
    const name = document.getElementById('prologueSpeakerName');
    const sub = document.getElementById('prologueSpeakerSub');
    const ambient = document.getElementById('prologueAmbient');
    const text = document.getElementById('prologueText');
    const highlight = document.getElementById('prologueHighlight');
    const prevBtn = document.getElementById('btnProloguePrev') as HTMLButtonElement;
    const nextBtn = document.getElementById('btnPrologueNext') as HTMLButtonElement;

    if (badge) badge.textContent = `${step.act}: ${step.title}`;
    dots.forEach((d, i) => {
      if (i === index) d.classList.add('active');
      else d.classList.remove('active');
    });

    if (avatar) avatar.textContent = step.avatar;
    if (name) name.textContent = step.speaker;
    if (sub) sub.textContent = step.speakerTitle;
    if (ambient) ambient.textContent = step.ambientNote;
    if (text) text.textContent = step.dialogue;
    if (highlight) {
      highlight.textContent = step.highlightText || '';
      highlight.style.display = step.highlightText ? 'block' : 'none';
    }

    if (prevBtn) {
      prevBtn.disabled = index === 0;
      prevBtn.style.opacity = index === 0 ? '0.4' : '1';
    }

    if (nextBtn) {
      nextBtn.textContent = step.buttonLabel;
    }

    if (frame) {
      frame.innerHTML = this.getPrologueSceneIllustration(step.id);
    }
  }

  public getPrologueSceneIllustration(stepId: number): string {
    if (stepId === 1) {
      return `
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block;">
          <defs>
            <linearGradient id="prologueSky1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#141829"/>
              <stop offset="50%" stop-color="#2a334f"/>
              <stop offset="100%" stop-color="#46425e"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#prologueSky1)"/>
          <circle cx="45" cy="25" r="1.2" fill="#ffd166" opacity="0.8"/>
          <circle cx="120" cy="18" r="1" fill="#ffffff" opacity="0.9"/>
          <circle cx="210" cy="30" r="1.4" fill="#ffd166" opacity="0.7"/>
          <circle cx="280" cy="22" r="1.1" fill="#ffffff" opacity="0.8"/>
          <polygon points="0,180 30,110 70,180" fill="#1b2533"/>
          <polygon points="50,180 100,95 150,180" fill="#151e2b"/>
          <polygon points="180,180 240,90 300,180" fill="#192330"/>
          <polygon points="250,180 290,115 320,180" fill="#131b26"/>
          <rect x="90" y="92" width="140" height="70" fill="#523927" stroke="#342217" stroke-width="2"/>
          <polygon points="75,94 160,48 245,94" fill="#38251a"/>
          <polygon points="85,94 160,54 235,94" fill="#6d4c38"/>
          <rect x="195" y="42" width="16" height="28" fill="#402b1f"/>
          <circle cx="203" cy="32" r="6" fill="#e2e8f0" opacity="0.3"/>
          <circle cx="207" cy="22" r="9" fill="#e2e8f0" opacity="0.2"/>
          <rect x="110" y="108" width="32" height="32" rx="3" fill="#ffe066" stroke="#b08968" stroke-width="2"/>
          <line x1="126" y1="108" x2="126" y2="140" stroke="#b08968" stroke-width="1.5"/>
          <line x1="110" y1="124" x2="142" y2="124" stroke="#b08968" stroke-width="1.5"/>
          <rect x="160" y="112" width="26" height="50" fill="#442a1b" stroke="#342217" stroke-width="1.5"/>
          <circle cx="165" cy="138" r="2" fill="#ffd166"/>
          <path d="M0,162 Q160,152 320,162 L320,180 L0,180 Z" fill="#2d3748"/>
          <g transform="translate(48, 120)">
            ${getGabySpriteSVG({ size: 48 })}
          </g>
        </svg>
      `;
    } else if (stepId === 2) {
      return `
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block;">
          <defs>
            <linearGradient id="prologueInterior" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2b1c14"/>
              <stop offset="100%" stop-color="#19110c"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#prologueInterior)"/>
          <line x1="0" y1="35" x2="320" y2="35" stroke="#4a3022" stroke-width="6"/>
          <line x1="80" y1="0" x2="80" y2="180" stroke="#3d271c" stroke-width="4"/>
          <line x1="240" y1="0" x2="240" y2="180" stroke="#3d271c" stroke-width="4"/>
          <line x1="160" y1="0" x2="160" y2="35" stroke="#888" stroke-width="1.5"/>
          <polygon points="150,35 170,35 176,46 144,46" fill="#c99738"/>
          <circle cx="160" cy="50" r="12" fill="#ffea75" opacity="0.35"/>
          <circle cx="160" cy="50" r="6" fill="#ffffff" opacity="0.8"/>
          <g transform="translate(110, 70)">
            ${getWillySpriteSVG({ size: 90, awakened: false })}
          </g>
          <rect x="210" y="110" width="85" height="45" rx="2" fill="#523927" stroke="#38251a" stroke-width="2"/>
          <polygon points="230,105 270,105 278,125 222,125" fill="#1b1b1b"/>
          <rect x="235" y="85" width="30" height="20" rx="1" fill="#0d1117" stroke="#333" stroke-width="1"/>
          <line x1="238" y1="90" x2="258" y2="90" stroke="#00ff66" stroke-width="1"/>
          <line x1="238" y1="94" x2="262" y2="94" stroke="#00ff66" stroke-width="1"/>
          <line x1="238" y1="98" x2="252" y2="98" stroke="#4a90e2" stroke-width="1"/>
          <g transform="translate(42, 85)">
            ${getGabySpriteSVG({ size: 60 })}
          </g>
          <text x="185" y="80" fill="#cbd5e1" font-size="14" font-weight="bold" font-family="monospace">z</text>
          <text x="195" y="70" fill="#94a3b8" font-size="18" font-weight="bold" font-family="monospace">Z</text>
          <text x="208" y="58" fill="#64748b" font-size="22" font-weight="bold" font-family="monospace">Z</text>
        </svg>
      `;
    } else if (stepId === 3) {
      return `
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block;">
          <defs>
            <linearGradient id="prologueCall" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0a192f"/>
              <stop offset="100%" stop-color="#1e293b"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#prologueCall)"/>
          <circle cx="160" cy="90" r="40" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.3"/>
          <circle cx="160" cy="90" r="65" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.2"/>
          <circle cx="160" cy="90" r="95" fill="none" stroke="#38bdf8" stroke-width="1" opacity="0.15"/>
          <g transform="translate(130, 40)">
            <rect x="18" y="0" width="5" height="30" fill="#334155"/>
            <rect x="0" y="28" width="60" height="85" rx="8" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <circle cx="30" cy="55" r="18" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
            <line x1="20" y1="55" x2="40" y2="55" stroke="#38bdf8" stroke-width="2"/>
            <line x1="30" y1="45" x2="30" y2="65" stroke="#38bdf8" stroke-width="2"/>
            <rect x="10" y="80" width="40" height="20" rx="2" fill="#0284c7"/>
            <text x="14" y="94" fill="#ffffff" font-size="10" font-weight="bold" font-family="monospace">911 · CH 7</text>
          </g>
          <g transform="translate(30, 70)">
            ${getGabySpriteSVG({ size: 68 })}
          </g>
          <text x="215" y="85" fill="#fce079" font-size="13" font-weight="bold">🚨 DESPACHO LAPD</text>
          <text x="215" y="105" fill="#94a3b8" font-size="11">Unidad 10-4 en camino...</text>
        </svg>
      `;
    } else if (stepId === 4) {
      return `
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block;">
          <defs>
            <linearGradient id="prologueNolanBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#172554"/>
              <stop offset="100%" stop-color="#1e1b4b"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#prologueNolanBg)"/>
          <ellipse cx="160" cy="85" rx="55" ry="65" fill="#3b82f6" opacity="0.15"/>
          <ellipse cx="160" cy="85" rx="42" ry="50" fill="#f8fafc" opacity="0.1"/>
          <g transform="translate(125, 45)">
            ${getNolanSpriteSVG({ size: 76 })}
          </g>
          <g transform="translate(45, 65)">
            ${getGabySpriteSVG({ size: 64 })}
          </g>
          <g transform="translate(230, 60)">
            <polygon points="30,10 50,20 40,55 30,65 20,55 10,20" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2"/>
            <polygon points="30,16 44,24 37,48 30,56 23,48 16,24" fill="#cbd5e1"/>
            <text x="23" y="38" fill="#1e293b" font-size="8" font-weight="bold">LAPD</text>
          </g>
        </svg>
      `;
    } else {
      return `
        <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style="display:block;">
          <defs>
            <linearGradient id="prologueMissionBg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#14213d"/>
              <stop offset="100%" stop-color="#283618"/>
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill="url(#prologueMissionBg)"/>
          <rect x="70" y="30" width="180" height="120" rx="8" fill="#fefae0" stroke="#dda15e" stroke-width="3" opacity="0.95"/>
          <text x="85" y="52" fill="#283618" font-size="11" font-weight="bold">🗺️ CABAÑA · 3 INDICIOS OCULTOS</text>
          <circle cx="105" cy="85" r="14" fill="#e9d8a6" stroke="#9b2226" stroke-width="2"/>
          <text x="98" y="89" fill="#9b2226" font-size="10" font-weight="bold">#1</text>
          <circle cx="160" cy="95" r="14" fill="#e9d8a6" stroke="#005f73" stroke-width="2"/>
          <text x="153" y="99" fill="#005f73" font-size="10" font-weight="bold">#2</text>
          <circle cx="215" cy="85" r="14" fill="#e9d8a6" stroke="#ca6702" stroke-width="2"/>
          <text x="208" y="89" fill="#ca6702" font-size="10" font-weight="bold">#3</text>
          <text x="85" y="132" fill="#bc6c25" font-size="8.5" font-weight="bold">🌻 Recompensa: Café Supremo & Jardín Secreto</text>
          <g transform="translate(15, 60)">
            ${getGabySpriteSVG({ size: 55 })}
          </g>
          <g transform="translate(250, 60)">
            ${getNolanSpriteSVG({ size: 55 })}
          </g>
        </svg>
      `;
    }
  }

  // --- PROCEDURAL NOLAN RADIO SYSTEM ---

  public openNolanRadioModal(flagTarget?: 1 | 2 | 3) {
    audio.playRadioClick();
    let target: 1 | 2 | 3 = flagTarget || 1;
    if (flagTarget) {
      if (flagTarget === 2 && !this.state.flags.flag1) {
        this.showToast('📻 Oficial Nolan: «Gaby, concéntrate primero en la servilleta ROT-3 de la sala.»');
        target = 1;
      } else if (flagTarget === 3 && !this.state.flags.flag2) {
        this.showToast('📻 Oficial Nolan: «Gaby, primero descifra el As esteganográfico en el dormitorio.»');
        target = 2;
      } else {
        target = flagTarget;
      }
    } else {
      if (!this.state.flags.flag1) target = 1;
      else if (!this.state.flags.flag2) target = 2;
      else if (!this.state.flags.flag3) target = 3;
      else target = 1;
    }
    this.currentRadioFlag = target;
    this.nolanStepIndex = 0;

    const modal = document.getElementById('nolanRadioModal');
    if (!modal) return;

    this.renderNolanProceduralStep();
    modal.classList.add('active');
  }

  public closeNolanRadioModal() {
    document.getElementById('nolanRadioModal')?.classList.remove('active');
  }

  public renderNolanProceduralStep() {
    const isAll = this.state.flags.flag1 && this.state.flags.flag2 && this.state.flags.flag3;
    const key = isAll ? 'allSolved' : (`flag${this.currentRadioFlag}` as 'flag1' | 'flag2' | 'flag3');
    const advice = NOLAN_RADIO_ADVICES[key];
    const step = advice.steps[this.nolanStepIndex] || advice.steps[0];

    const flagTag = document.getElementById('radioFlagTag');
    const stepBadge = document.getElementById('radioStepBadge');
    const stepDots = document.getElementById('radioStepDots');
    const stepText = document.getElementById('nolanStepText');
    const promptEl = document.getElementById('nolanDeductionPrompt');
    const optionsContainer = document.getElementById('nolanHypothesisOptions');
    const replyEl = document.getElementById('nolanHypothesisReply');
    const prevBtn = document.getElementById('btnNolanPrevStep') as HTMLButtonElement;
    const nextBtn = document.getElementById('btnNolanNextStep') as HTMLButtonElement;
    const toolBtn = document.getElementById('btnNolanOpenTool');
    const statusTag = document.getElementById('radioStatusTag');

    if (statusTag) {
      statusTag.textContent = this.state.flags[`flag${this.currentRadioFlag}`]
        ? 'FRECUENCIA 10-4 · DEDUCCIÓN REGISTRADA ✅'
        : 'ENLACE ACTIVO · SEÑAL CRISTALINA 10-4';
    }

    let isInvestigated = true;
    let roomTargetName = '';
    if (this.currentRadioFlag === 1) {
      isInvestigated = this.state.investigated.living;
      roomTargetName = 'la Sala de Estar';
    } else if (this.currentRadioFlag === 2) {
      isInvestigated = this.state.investigated.bedroom;
      roomTargetName = 'el Dormitorio';
    } else if (this.currentRadioFlag === 3) {
      isInvestigated = this.state.investigated.kitchen;
      roomTargetName = 'la Cocina';
    }

    if (flagTag) flagTag.textContent = advice.title;

    if (!isInvestigated && !isAll) {
      if (stepBadge) stepBadge.textContent = '📻 Protocolo de Campo · Asegurar Escena';
      if (stepText) {
        const roomDesc = this.currentRadioFlag === 1 ? 'la sala' : this.currentRadioFlag === 2 ? 'el dormitorio' : 'la cocina';
        const specificArea = this.currentRadioFlag === 1 ? 'la mesa y el sofá primero' : this.currentRadioFlag === 2 ? 'al Michi y los naipes primero' : 'la cafetera y la pizarra primero';
        stepText.textContent = `«Detective Gaby, el perímetro exterior está en orden, pero aún no tenemos información de ${roomDesc}. Ve a revisar ${specificArea}; no podemos deducir nada a ciegas.»`;
      }
      if (toolBtn) toolBtn.innerHTML = `<span>🚶‍♀️</span> Ir a ${roomTargetName} a Investigar`;
    } else {
      if (stepBadge) stepBadge.textContent = step.badge;
      if (stepText) stepText.textContent = step.text;
      if (toolBtn) toolBtn.innerHTML = `<span>🔍</span> ${advice.toolButtonText}`;
    }

    // Step dots
    if (stepDots) {
      stepDots.innerHTML = advice.steps
        .map(
          (_, i) =>
            `<span class="r-dot ${i === this.nolanStepIndex ? 'active' : ''}" data-step="${i}"></span>`
        )
        .join('');
      // Click on dot to navigate directly
      stepDots.querySelectorAll('.r-dot').forEach((d, i) => {
        d.addEventListener('click', () => {
          this.nolanStepIndex = i;
          this.renderNolanProceduralStep();
          audio.playRadioClick();
        });
      });
    }

    // Prev / Next button state
    if (prevBtn) {
      prevBtn.disabled = this.nolanStepIndex === 0;
    }
    if (nextBtn) {
      const isLast = this.nolanStepIndex === advice.steps.length - 1;
      nextBtn.textContent = isLast ? 'Primer indicio ↩️' : 'Siguiente indicio ➡️';
    }

    // Deduction hypothesis — ONLY show when scene has been investigated
    const deductionSection = document.getElementById('nolanDeductionSection');
    if (!isInvestigated && !isAll) {
      if (deductionSection) deductionSection.style.display = 'none';
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
    } else {
      if (deductionSection) deductionSection.style.display = 'block';
      if (prevBtn) prevBtn.disabled = this.nolanStepIndex === 0;
      if (nextBtn) nextBtn.disabled = false;

      if (promptEl) {
        promptEl.innerHTML = `💡 <em>Deduce junto a Nolan: ${advice.connectingQuestion}</em>`;
      }

      if (replyEl) {
        replyEl.style.display = 'none';
        replyEl.textContent = '';
      }

      if (optionsContainer) {
        optionsContainer.innerHTML = '';
        if (advice.quickOptions && advice.quickOptions.length > 0) {
          advice.quickOptions.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'hypothesis-choice-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => {
              audio.playRadioClick();
              if (replyEl) {
                replyEl.style.display = 'block';
                if (opt.correct) {
                  replyEl.style.borderColor = '#55ef82';
                  replyEl.style.background = 'rgba(85, 239, 130, 0.15)';
                  replyEl.innerHTML = `👮‍♂️ <strong>Oficial Nolan:</strong> «${opt.response}»`;
                  audio.playChime(660);
                  this.showToast('✨ Deducción acertada con Nolan. ¡Regístrala en la libreta!');
                } else {
                  replyEl.style.borderColor = '#f5c538';
                  replyEl.style.background = 'rgba(245, 197, 56, 0.15)';
                  replyEl.innerHTML = `👮‍♂️ <strong>Oficial Nolan:</strong> «${opt.response}»`;
                  audio.playChime(300);
                }
              }
            });
            optionsContainer.appendChild(btn);
          });
        }
      }
    }
  }

  public nextNolanRadioStep() {
    const isAll = this.state.flags.flag1 && this.state.flags.flag2 && this.state.flags.flag3;
    const key = isAll ? 'allSolved' : (`flag${this.currentRadioFlag}` as 'flag1' | 'flag2' | 'flag3');
    const advice = NOLAN_RADIO_ADVICES[key];

    if (this.nolanStepIndex < advice.steps.length - 1) {
      this.nolanStepIndex++;
    } else {
      this.nolanStepIndex = 0;
    }
    audio.playRadioClick();
    this.renderNolanProceduralStep();
  }

  public prevNolanRadioStep() {
    if (this.nolanStepIndex > 0) {
      this.nolanStepIndex--;
      audio.playRadioClick();
      this.renderNolanProceduralStep();
    }
  }

  // --- DEDICATED SECRET GARDEN SCENARIO ---

  public openSecretGardenScenario() {
    audio.playVictoryWaltz();
    const modal = document.getElementById('secretGardenScenario');
    const coupleSvg = document.getElementById('coupleTogetherSvg');
    if (!modal) return;

    if (coupleSvg) {
      coupleSvg.innerHTML = getCoupleTogetherSVG(120);
    }

    modal.classList.add('active');
    this.showToast('🌸 Bienvenidos al Jardín Secreto de Willy & Gaby.');
  }

  public closeSecretGardenScenario() {
    document.getElementById('secretGardenScenario')?.classList.remove('active');
  }

  public openSecretGardenLetter() {
    audio.playChime(780);
    const container = document.getElementById('secretGardenLetterContainer');
    if (container) {
      container.style.display = 'block';
      container.scrollIntoView({ behavior: 'smooth' });
    }
  }

  public playAwakeningCinematic() {
    // Step 0: Show Nolan farewell radio before canvas animation
    this.showNolanFarewell();
  }

  private showNolanFarewell() {
    // Create a temporary radio farewell modal
    const existingModal = document.getElementById('nolanFarewellModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'nolanFarewellModal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-box nolan-radio-modal" style="max-width:440px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <span style="font-size:1.6rem;">👮‍♂️</span>
          <div>
            <strong style="color:var(--accent-gold);">Oficial John Nolan</strong>
            <div style="font-size:0.75rem;color:var(--text-muted);">LAPD · Radio Perimetral · Frecuencia Privada</div>
          </div>
        </div>
        <div style="background:var(--bg-deep);border-left:3px solid var(--accent-gold);padding:12px 14px;border-radius:6px;margin-bottom:16px;line-height:1.6;color:var(--text-primary);font-family:var(--font-prose);">
          <em>«Signos vitales al 100%. Mi patrulla concluyó, excelente trabajo en equipo, Detective.</em><br><br>
          <em>Los dejo a solas... Willy tiene algo muy especial para usted.»</em>
        </div>
        <div style="display:flex;justify-content:center;">
          <button id="btnAcknowledgeFarewell" class="btn-primary" style="background:var(--accent-gold);color:var(--bg-deep);font-weight:600;padding:10px 28px;border-radius:8px;border:none;cursor:pointer;font-size:0.95rem;">
            🌸 Entendido, Oficial
          </button>
        </div>
        <div style="text-align:center;margin-top:10px;font-size:0.7rem;color:var(--text-muted);">
          ── FIN DE COMUNICACIÓN ──
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    audio.playRadioBeep();

    const btnAck = document.getElementById('btnAcknowledgeFarewell');
    if (btnAck) {
      btnAck.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
        // Proceed to canvas awakening animation
        this.startAwakeningCanvas();
      });
    }
  }

  private startAwakeningCanvas() {
    const overlay = document.getElementById('awakeningOverlay');
    if (overlay) overlay.classList.add('active');
    this.state.currentScene = 'sala';

    const game = this.createPhaserGame('phaserAwakening');

    const checkReady = () => {
      const scene = game.scene.getScene('SalaScene') as SalaScene;
      if (scene && scene.sys.isActive()) {
        scene.onSalaComplete = () => {
          if (overlay) overlay.classList.remove('active');
          this.state.currentScene = null;
          game.scene.stop('SalaScene');
          document.getElementById('verdictModal')?.classList.add('active');
        };
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  }

  private openGardenScene(): void {
    const vwModal = document.getElementById('virtualWorldModal');
    if (vwModal) vwModal.classList.add('active');
    this.state.currentScene = 'garden';

    this.createPhaserGame('phaserGarden');
  }

  public bloomGardenYellowFlowers() {
    audio.playVictoryWaltz();
    this.closeSecretGardenScenario();
    this.openGardenScene();
  }

  public openRot3Modal() {
    if (!this.state.investigated.living) {
      audio.playChime(220);
      this.showToast('🕵️‍♀️ Evidencia no asegurada: Camina a la mesa de la Sala e inspecciona la servilleta junto a Willy.');
      this.switchTab('novel');
      this.walkTo(58, 42, () => {
        const spot = this.hotspots.find((s) => s.id === 'willy');
        if (spot) this.triggerHotspotDialogue(spot);
      });
      return;
    }

    audio.playChime(520);
    this.caesarCurrentShift = 0;
    const slider = document.getElementById('caesarShiftSlider') as HTMLInputElement;
    if (slider) slider.value = '0';
    this.renderCaesarDecoder();
    const feedback = document.getElementById('rot3FeedbackMsg');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'forensic-feedback-msg';
    }
    const input = document.getElementById('rot3DeductionInput') as HTMLInputElement;
    if (input && this.state.flags.flag1) {
      input.value = 'SOS MI SOL';
    }
    document.getElementById('rot3ForensicModal')?.classList.add('active');
  }

  public closeRot3Modal() {
    document.getElementById('rot3ForensicModal')?.classList.remove('active');
  }

  public openUvModal() {
    if (!this.state.flags.flag1) {
      audio.playChime(220);
      this.showToast('🔒 Debes resolver primero el Caso #1 (La Servilleta ROT-3) para acceder a este indicio.');
      return;
    }
    if (!this.state.investigated.bedroom) {
      audio.playChime(220);
      this.showToast('🕵️‍♀️ Evidencia no descubierta: Camina al dormitorio y acaricia al Michi Blanco para revelar el As.');
      this.switchTab('novel');
      this.walkTo(84, 60, () => {
        const spot = this.hotspots.find((s) => s.id === 'michi');
        if (spot) this.triggerHotspotDialogue(spot);
      });
      return;
    }

    audio.playChime(640);
    this.uvLightOn = false; // Starts off so Gaby clicks the switch to reveal constellations!
    this.updateUvDisplay();
    const feedback = document.getElementById('uvFeedbackMsg');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'forensic-feedback-msg';
    }
    const input = document.getElementById('uvDeductionInput') as HTMLInputElement;
    if (input && this.state.flags.flag2) {
      input.value = 'MI CONSTELACION';
    }
    document.getElementById('uvForensicModal')?.classList.add('active');
  }

  public closeUvModal() {
    document.getElementById('uvForensicModal')?.classList.remove('active');
  }

  public toggleUvLight() {
    this.uvLightOn = !this.uvLightOn;
    this.updateUvDisplay();
  }

  private updateUvDisplay() {
    const btn = document.getElementById('btnToggleUvLight');
    const textEl = document.getElementById('uvSwitchText');
    const cardEl = document.getElementById('pokerCardVisual');
    const layerEl = document.getElementById('uvConstellationLayer');

    if (this.uvLightOn) {
      btn?.classList.add('active');
      if (textEl) textEl.textContent = 'Luz UV Activada (365nm)';
      cardEl?.classList.add('uv-active');
      layerEl?.classList.add('active');
      audio.playChime(780);
    } else {
      btn?.classList.remove('active');
      if (textEl) textEl.textContent = 'Luz UV Apagada (Luz Natural)';
      cardEl?.classList.remove('uv-active');
      layerEl?.classList.remove('active');
      audio.playChime(340);
    }
  }

  public openBaristaModal() {
    if (!this.state.flags.flag2) {
      audio.playChime(220);
      this.showToast('🔒 Debes resolver primero el Caso #2 (El As del Michi) para calibrar la cafetera.');
      return;
    }
    if (!this.state.investigated.kitchen) {
      audio.playChime(220);
      this.showToast('🕵️‍♀️ Máquina no examinada: Camina a la cocina para inspeccionar la cafetera y la pizarra de notas.');
      this.switchTab('novel');
      this.walkTo(36, 30, () => {
        const spot = this.hotspots.find((s) => s.id === 'barista');
        if (spot) this.triggerHotspotDialogue(spot);
      });
      return;
    }

    audio.playSteam();
    this.baristaStep = 0;
    this.isGrinderCalibrated = false;
    this.resetBaristaUI();
    const feedback = document.getElementById('baristaFeedbackMsg');
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'forensic-feedback-msg';
    }
    const input = document.getElementById('baristaModeInput') as HTMLInputElement;
    if (input) {
      input.value = '';
      input.disabled = false;
    }
    const btnCalibrate = document.getElementById('btnVerifyBaristaMode') as HTMLButtonElement;
    if (btnCalibrate) {
      btnCalibrate.disabled = false;
      btnCalibrate.innerHTML = '<span>⚙️</span> Calibrar Máquina';
    }
    document.getElementById('baristaStationModal')?.classList.add('active');
  }

  public closeBaristaModal() {
    document.getElementById('baristaStationModal')?.classList.remove('active');
  }

  private resetBaristaUI() {
    const step1 = document.getElementById('stepGrind');
    const step2 = document.getElementById('stepExtract');
    const step3 = document.getElementById('stepSteam');
    const result = document.getElementById('supremeCoffeeResult');

    step1?.classList.remove('completed', 'active');
    step2?.classList.remove('completed', 'active');
    step3?.classList.remove('completed', 'active');
    result?.classList.remove('visible');

    const btn1 = document.getElementById('btnActionGrind') as HTMLButtonElement;
    const btn2 = document.getElementById('btnActionExtract') as HTMLButtonElement;
    const btn3 = document.getElementById('btnActionSteam') as HTMLButtonElement;
    if (btn1) { btn1.disabled = true; btn1.textContent = 'Moler Granos'; }
    if (btn2) { btn2.disabled = true; btn2.textContent = 'Extraer Espresso'; }
    if (btn3) { btn3.disabled = true; btn3.textContent = 'Verter con Amor'; }
  }

  private setupListeners() {
    // Tabs
    document.getElementById('tabBtnNovel')?.addEventListener('click', () => this.switchTab('novel'));
    document.getElementById('tabBtnNotebook')?.addEventListener('click', () => this.switchTab('notebook'));

    // Validation buttons & Enter key
    [1, 2, 3].forEach((n) => {
      const num = n as 1 | 2 | 3;
      document.getElementById(`btnVal${num}`)?.addEventListener('click', () => this.validateFlag(num));
      document.getElementById(`flagInput${num}`)?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.validateFlag(num);
      });

      // Archive toggle buttons (expand/collapse notes without clutter)
      document.getElementById(`toggleArchive${num}`)?.addEventListener('click', () => {
        const act = document.getElementById(`activeContent${num}`);
        const btn = document.getElementById(`toggleArchive${num}`);
        if (!act) return;
        const isHidden = act.style.display === 'none' || act.style.display === '';
        act.style.display = isHidden ? 'block' : 'none';
        if (btn) btn.textContent = isHidden ? 'Ocultar detalles' : 'Revisar notas';
      });
    });

    // Nolan Radio buttons
    document.getElementById('btnHeaderRadio')?.addEventListener('click', () => this.openNolanRadioModal());
    document.getElementById('btnNolanFlag1')?.addEventListener('click', () => this.openNolanRadioModal(1));
    document.getElementById('btnNolanFlag2')?.addEventListener('click', () => this.openNolanRadioModal(2));
    document.getElementById('btnNolanFlag3')?.addEventListener('click', () => this.openNolanRadioModal(3));
    document.getElementById('btnCloseNolanRadio')?.addEventListener('click', () => this.closeNolanRadioModal());
    document.getElementById('btnDismissNolanRadio')?.addEventListener('click', () => this.closeNolanRadioModal());
    document.getElementById('btnNolanPrevStep')?.addEventListener('click', () => this.prevNolanRadioStep());
    document.getElementById('btnNolanNextStep')?.addEventListener('click', () => this.nextNolanRadioStep());

    // Prologue buttons
    document.getElementById('btnOpenPrologueHeader')?.addEventListener('click', () => this.openPrologue(0));
    document.getElementById('btnProloguePrev')?.addEventListener('click', () => this.prevPrologueStep());
    document.getElementById('btnPrologueNext')?.addEventListener('click', () => this.nextPrologueStep());
    document.getElementById('btnPrologueSkip')?.addEventListener('click', () => this.closePrologue());
    document.querySelectorAll('#prologueStepsDots .p-dot').forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        this.openPrologue(idx);
      });
    });

    // Secret Garden Scenario buttons
    document.getElementById('btnReturnToCabin')?.addEventListener('click', () => this.closeSecretGardenScenario());
    document.getElementById('btnCloseGardenModal')?.addEventListener('click', () => this.closeSecretGardenScenario());
    document.getElementById('btnBloomGardenYellowFlowers')?.addEventListener('click', () => {
      this.closeSecretGardenScenario();
      audio.playVictoryWaltz();
      this.openGardenScene();
    });
    document.getElementById('secretGardenScenicView')?.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.garden-willy-dialogue') || target.closest('button')) return;
      const rect = (document.getElementById('secretGardenScenicView') as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.spawnFlowerAt(clickX, clickY);
    });

    // Nolan Radio: Open Tool or Go to Scene based on investigation status
    document.getElementById('btnNolanOpenTool')?.addEventListener('click', () => {
      this.closeNolanRadioModal();
      const target = this.currentRadioFlag;
      if (target === 1) {
        if (!this.state.investigated.living) {
          this.switchTab('novel');
          this.showDestinationMarker(58, 42);
          this.walkTo(58, 42, () => {
            const spot = this.hotspots.find((s) => s.id === 'willy');
            if (spot) this.triggerHotspotDialogue(spot);
          });
          this.showToast('🚶‍♀️ Caminando a la Sala a examinar la servilleta de Willy...');
        } else {
          this.openRot3Modal();
        }
      } else if (target === 2) {
        if (!this.state.investigated.bedroom) {
          this.switchTab('novel');
          this.showDestinationMarker(84, 60);
          this.walkTo(84, 60, () => {
            const spot = this.hotspots.find((s) => s.id === 'michi');
            if (spot) this.triggerHotspotDialogue(spot);
          });
          this.showToast('🚶‍♀️ Caminando al Dormitorio a descubrir el As bajo el Michi...');
        } else {
          this.openUvModal();
        }
      } else if (target === 3) {
        if (!this.state.investigated.kitchen) {
          this.switchTab('novel');
          this.showDestinationMarker(36, 30);
          this.walkTo(36, 30, () => {
            const spot = this.hotspots.find((s) => s.id === 'barista');
            if (spot) this.triggerHotspotDialogue(spot);
          });
          this.showToast('🚶‍♀️ Caminando a la Cocina a examinar la cafetera...');
        } else {
          this.openBaristaModal();
        }
      }
    });

    // Nolan Radio: Go to Detective Notebook to type deduction
    document.getElementById('btnNolanGoNotebook')?.addEventListener('click', () => {
      this.closeNolanRadioModal();
      this.switchTab('notebook');
      const input = document.getElementById(`flagInput${this.currentRadioFlag}`) as HTMLInputElement;
      if (input) input.focus();
    });

    // --- FORENSIC TOOL 1: ROT-3 Napkin & Deduction ---
    document.getElementById('btnOpenRot3Modal')?.addEventListener('click', () => this.openRot3Modal());
    document.getElementById('btnCloseRot3Modal')?.addEventListener('click', () => this.closeRot3Modal());

    const verifyRot3Deduction = () => {
      const input = document.getElementById('rot3DeductionInput') as HTMLInputElement;
      const feedback = document.getElementById('rot3FeedbackMsg');
      if (!input) return;
      const val = normalizeStr(input.value);
      const isCorrect = (ACCEPTED_ANSWERS.flag1 as unknown as string[]).some((ans) => val === normalizeStr(ans));
      if (isCorrect) {
        if (feedback) {
          feedback.className = 'forensic-feedback-msg success';
          feedback.textContent = '✨ ¡Correcto! Has deducido «SOS MI SOL». Registrado en tu libreta.';
        }
        audio.playChime(660);
        const nbInput = document.getElementById('flagInput1') as HTMLInputElement;
        if (nbInput) nbInput.value = 'SOS MI SOL';
        this.validateFlag(1);
        setTimeout(() => this.closeRot3Modal(), 1400);
      } else {
        audio.playChime(220);
        if (feedback) {
          feedback.className = 'forensic-feedback-msg error';
          feedback.textContent = '❌ Aún no encaja. Pista de Nolan: Desplaza cada letra -3 posiciones en el abecedario.';
        }
      }
    };
    document.getElementById('btnVerifyRot3Deduction')?.addEventListener('click', verifyRot3Deduction);
    document.getElementById('rot3DeductionInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyRot3Deduction();
    });

    // --- FORENSIC TOOL 2: UV Light Poker Card & Deduction ---
    document.getElementById('btnOpenUvModal')?.addEventListener('click', () => this.openUvModal());
    document.getElementById('btnCloseUvModal')?.addEventListener('click', () => this.closeUvModal());
    document.getElementById('btnToggleUvLight')?.addEventListener('click', () => this.toggleUvLight());

    const verifyUvDeduction = () => {
      const input = document.getElementById('uvDeductionInput') as HTMLInputElement;
      const feedback = document.getElementById('uvFeedbackMsg');
      if (!input) return;
      const val = normalizeStr(input.value);
      const isCorrect = (ACCEPTED_ANSWERS.flag2 as unknown as string[]).some((ans) => val === normalizeStr(ans));
      if (isCorrect) {
        if (feedback) {
          feedback.className = 'forensic-feedback-msg success';
          feedback.textContent = '✨ ¡Deducción confirmada! «MI CONSTELACION» anotada en tu libreta.';
        }
        audio.playChime(740);
        const nbInput = document.getElementById('flagInput2') as HTMLInputElement;
        if (nbInput) nbInput.value = 'MI CONSTELACION';
        this.validateFlag(2);
        setTimeout(() => this.closeUvModal(), 1400);
      } else {
        audio.playChime(220);
        if (feedback) {
          feedback.className = 'forensic-feedback-msg error';
          feedback.textContent = '❌ No coincide. Pista de Nolan: ¿Qué conjunto de estrellas guía en la noche?';
        }
      }
    };
    document.getElementById('btnVerifyUvDeduction')?.addEventListener('click', verifyUvDeduction);
    document.getElementById('uvDeductionInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyUvDeduction();
    });

    // --- FORENSIC TOOL 3: Barista Station & Deduction ---
    document.getElementById('btnOpenBaristaModal')?.addEventListener('click', () => this.openBaristaModal());
    document.getElementById('btnCloseBaristaModal')?.addEventListener('click', () => this.closeBaristaModal());

    const verifyBaristaMode = () => {
      if (this.baristaStep !== 0) return;
      const input = document.getElementById('baristaModeInput') as HTMLInputElement;
      const feedback = document.getElementById('baristaFeedbackMsg');
      if (!input) return;
      const val = normalizeStr(input.value);
      const isCorrect = (ACCEPTED_ANSWERS.flag3 as unknown as string[]).some((ans) => val === normalizeStr(ans));
      if (isCorrect) {
        this.isGrinderCalibrated = true;
        this.baristaStep = 1;
        audio.playChime(800);
        if (feedback) {
          feedback.className = 'forensic-feedback-msg success';
          feedback.textContent = 'SCRIPT: ./wake_boyfriend.sh --mode DULCE DESPERTAR [CALIBRADO OK]';
        }
        input.disabled = true;
        const btnCalibrate = document.getElementById('btnVerifyBaristaMode') as HTMLButtonElement;
        if (btnCalibrate) { btnCalibrate.disabled = true; btnCalibrate.innerHTML = '<span>✓</span> Calibrado'; }
        const btn1 = document.getElementById('btnActionGrind') as HTMLButtonElement;
        const step1 = document.getElementById('stepGrind');
        if (btn1) { btn1.disabled = false; }
        step1?.classList.add('active');
        const nbInput = document.getElementById('flagInput3') as HTMLInputElement;
        if (nbInput) nbInput.value = 'DULCE DESPERTAR';
        this.validateFlag(3);
      } else {
        audio.playChime(220);
        if (feedback) {
          feedback.className = 'forensic-feedback-msg error';
          feedback.textContent = '❌ Modo no reconocido. Pista: combina lo opuesto a amargo con el acto de abrir los ojos por la mañana.';
        }
      }
    };
    document.getElementById('btnVerifyBaristaMode')?.addEventListener('click', verifyBaristaMode);
    document.getElementById('baristaModeInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verifyBaristaMode();
    });

    document.getElementById('btnActionGrind')?.addEventListener('click', () => {
      if (this.baristaStep !== 1) return;
      audio.playChime(420);
      this.baristaStep = 2;
      const step1 = document.getElementById('stepGrind');
      const step2 = document.getElementById('stepExtract');
      const btn1 = document.getElementById('btnActionGrind') as HTMLButtonElement;
      const btn2 = document.getElementById('btnActionExtract') as HTMLButtonElement;

      step1?.classList.add('completed');
      step1?.classList.remove('active');
      step2?.classList.add('active');
      if (btn1) { btn1.disabled = true; btn1.textContent = '✓ Granos Molidos'; }
      if (btn2) { btn2.disabled = false; }
      this.showToast('🌰 Granos molidos finamente con notas aromáticas de canela.');
    });

    document.getElementById('btnActionExtract')?.addEventListener('click', () => {
      if (this.baristaStep !== 2) return;
      audio.playSteam();
      this.baristaStep = 3;
      const step2 = document.getElementById('stepExtract');
      const step3 = document.getElementById('stepSteam');
      const btn2 = document.getElementById('btnActionExtract') as HTMLButtonElement;
      const btn3 = document.getElementById('btnActionSteam') as HTMLButtonElement;

      step2?.classList.add('completed');
      step2?.classList.remove('active');
      step3?.classList.add('active');
      if (btn2) { btn2.disabled = true; btn2.textContent = '✓ Espresso Extraído (9 bares)'; }
      if (btn3) { btn3.disabled = false; }
      this.showToast('⚙️ Espresso doble extraído a 9 bares de presión con densa crema dorada.');
    });

    document.getElementById('btnActionSteam')?.addEventListener('click', () => {
      if (this.baristaStep !== 3) return;
      audio.playVictoryWaltz();
      this.baristaStep = 4;
      const step3 = document.getElementById('stepSteam');
      const btn3 = document.getElementById('btnActionSteam') as HTMLButtonElement;
      const result = document.getElementById('supremeCoffeeResult');

      step3?.classList.add('completed');
      step3?.classList.remove('active');
      if (btn3) { btn3.disabled = true; btn3.textContent = '✓ Café Supremo Listo'; }
      result?.classList.add('visible');

      this.showToast('☕ ¡El Café Supremo está listo y humeante para Willy!');
    });

    document.getElementById('btnFinishBarista')?.addEventListener('click', () => {
      this.closeBaristaModal();
      // Auto walk to Willy at the sofa
      this.walkTo(58, 42, () => {
        const btnServe = document.getElementById('btnServeCoffee');
        if (btnServe) btnServe.click();
      });
    });

    // Serve Coffee Button
    document.getElementById('btnServeCoffee')?.addEventListener('click', () => {
      if (!this.state.flags.flag1 || !this.state.flags.flag2 || !this.state.flags.flag3) return;

      this.walkTo(58, 42, () => {
        audio.playSteam();
        this.state.awakened = true;

        const willyFigure = document.getElementById('willySceneFigure');
        if (willyFigure) {
          willyFigure.innerHTML = getWillySpriteSVG({ size: 44, awakened: true });
        }
        const livingLabel = document.getElementById('willyLabel');
        const statusLiving = document.getElementById('statusLiving');
        if (livingLabel) livingLabel.textContent = '¡Willy Despierto! ❤️';
        if (statusLiving) statusLiving.textContent = '💖';

        const chapterPill = document.getElementById('storyChapterPill');
        const chapterText = document.getElementById('chapterStatusText');
        if (chapterPill && chapterText) {
          chapterPill.classList.add('unlocked');
          chapterText.textContent = '✨ ¡Epílogo: La Gran Revelación!';
        }

        this.addChronicleEntry(
          'Willy Despierto',
          '¡Mmm, qué aroma tan delicioso de canela y café supremo! Abre los ojos sonriendo y contempla a Gaby con infinita ternura: «¡Sabía que lo lograrías, amor! Eres mi detective favorita.»',
          '💻',
          'willy'
        );

        if (STORY_CHAPTERS[4]) {
          STORY_CHAPTERS[4].solved = true;
          this.activeNovelViewChapter = 4;
          this.renderChapters();
        }

        setTimeout(() => {
          this.playAwakeningCinematic();
        }, 600);
      });
    });

    // Wax seal break — 3D envelope animation
    document.getElementById('waxSealBtn')?.addEventListener('click', () => {
      audio.playSealBreak();
      const seal = document.getElementById('waxSealBtn');
      const flap = document.getElementById('envelopeFlap');
      const envelope3D = document.getElementById('envelope3D');
      const instruction = document.getElementById('envelopeInstruction');
      const letterUnfolded = document.getElementById('letterUnfolded');
      if (!seal || !flap || !envelope3D || !instruction || !letterUnfolded) return;

      // Phase 1: Break the seal
      seal.classList.add('broken');

      // Spawn particles
      const sealRect = seal.getBoundingClientRect();
      const sceneRect = (seal.closest('.envelope-3d-scene') as HTMLElement)?.getBoundingClientRect();
      if (sceneRect) {
        for (let i = 0; i < 12; i++) {
          const p = document.createElement('div');
          p.className = 'seal-particle';
          p.style.background = i % 2 === 0 ? '#c0392b' : '#f5c538';
          p.style.left = `${sealRect.left - sceneRect.left + sealRect.width / 2}px`;
          p.style.top = `${sealRect.top - sceneRect.top + sealRect.height / 2}px`;
          const angle = (i / 12) * Math.PI * 2;
          const dist = 40 + Math.random() * 30;
          p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
          p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
          sceneRect as unknown as HTMLElement;
          (seal.closest('.envelope-3d-scene') as HTMLElement).appendChild(p);
          setTimeout(() => p.remove(), 800);
        }
      }

      instruction.textContent = '';

      // Phase 2: Open the flap
      setTimeout(() => {
        flap.classList.add('opened');
      }, 500);

      // Phase 3: Show the letter
      setTimeout(() => {
        envelope3D.style.display = 'none';
        letterUnfolded.classList.add('visible');
      }, 1400);
    });

    // Go to Meadow from letter
    document.getElementById('btnGoToMeadow')?.addEventListener('click', () => {
      document.getElementById('verdictModal')?.classList.remove('active');
      this.state.gardenRevealed = true;
      audio.playVictoryWaltz();
      this.openGardenScene();
    });

    // Fast Room Navigation Chips
    document.querySelectorAll('.rpg-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.rpg-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const target = chip.getAttribute('data-target');
        const coords: Record<string, { x: number; y: number; spotId?: string }> = {
          willy: { x: 45, y: 44, spotId: 'willy' },
          barista: { x: 31, y: 33, spotId: 'barista' },
          michi: { x: 68, y: 56, spotId: 'michi' },
          nolan: { x: 18, y: 68, spotId: 'nolan' },
        };
        if (target && coords[target]) {
          const { x, y, spotId } = coords[target];
          this.showDestinationMarker(x, y);
          this.walkTo(x, y, () => {
            if (spotId) {
              const spot = this.hotspots.find((h) => h.id === spotId);
              if (spot) this.triggerHotspotDialogue(spot);
            }
          });
        }
      });
    });

    // Keyboard WASD Controls
    window.addEventListener('keydown', (e) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      const step = 3;

      if (key === 'e' || key === ' ') {
        if (this.state.activeHotspot) {
          e.preventDefault();
          this.triggerHotspotDialogue(this.state.activeHotspot);
          return;
        }
      }

      let newX = this.gaby.x;
      let newY = this.gaby.y;

      if (key === 'w' || key === 'arrowup') {
        newY -= step;
      } else if (key === 's' || key === 'arrowdown') {
        newY += step;
      } else if (key === 'a' || key === 'arrowleft') {
        newX -= step;
      } else if (key === 'd' || key === 'arrowright') {
        newX += step;
      } else {
        return;
      }

      this.walkTo(newX, newY);
    });

    // Sound toggle
    const soundBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    const soundLabel = document.getElementById('soundLabel');
    soundBtn?.addEventListener('click', () => {
      audio.init();
      audio.muted = !audio.muted;
      if (soundIcon) soundIcon.textContent = audio.muted ? '🔇' : '🔊';
      if (soundLabel) soundLabel.textContent = audio.muted ? 'Silencio' : 'Audio';
      this.showToast(audio.muted ? 'Audio silenciado' : 'Audio activado');
    });

    // Export button
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      const htmlContent = '<!doctype html>\n' + document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'novela-misterio-gaby-21-septiembre.html';
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('📥 Descargando experiencia lista para abrir');
    });
  }

  // --- UPWARD EMERGING YELLOW FLOWERS MEADOW SYSTEM ---

  public bloomMeadowInCabinStage() {
    const stageContainer = document.getElementById('stageBloomingMeadow');
    if (!stageContainer) return;
    stageContainer.innerHTML = '';
    stageContainer.classList.add('active');

    // Generate 16 flowers emerging from the bottom floor of the cabin stage
    const flowerTypes: ('sunflower' | 'daisy' | 'blossom')[] = ['sunflower', 'daisy', 'blossom', 'sunflower'];
    for (let i = 0; i < 18; i++) {
      const left = Math.round((i / 17) * 94 + (Math.random() * 4 - 2));
      const height = 90 + Math.floor(Math.random() * 85);
      const type = flowerTypes[i % flowerTypes.length];
      const delay = i * 0.12;
      const flower = this.createYellowFlowerSprout(height, type, left, delay, true);
      stageContainer.appendChild(flower);
    }

    // Add 10 rising spores floating inside the cabin
    for (let j = 0; j < 10; j++) {
      stageContainer.appendChild(this.createRisingSpore());
    }
  }

  private createYellowFlowerSprout(
    stemHeight: number,
    type: 'sunflower' | 'daisy' | 'blossom',
    leftPercent: number,
    delaySec: number,
    isStageLocal: boolean = false
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'emerging-flower-sprout';
    container.style.left = `${leftPercent}%`;
    container.style.bottom = '0px';
    container.style.animationDelay = `${delaySec}s`;
    container.style.zIndex = isStageLocal ? '36' : '182';

    const width = Math.round(stemHeight * 0.28);
    const headSize = type === 'sunflower' ? 62 : type === 'daisy' ? 48 : 52;

    let headSVG = '';
    if (type === 'sunflower') {
      headSVG = `
        <g class="sprout-flower-head" style="animation-delay: ${delaySec + 0.6}s;">
          <circle cx="31" cy="31" r="29" fill="rgba(255, 214, 10, 0.25)" filter="blur(4px)"/>
          <g fill="#ffb703" stroke="#fb8500" stroke-width="0.8">
            ${[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]
              .map((deg) => `<ellipse cx="31" cy="12" rx="4.8" ry="10" transform="rotate(${deg} 31 31)"/>`)
              .join('')}
          </g>
          <g fill="#ffc72c">
            ${[11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75]
              .map((deg) => `<ellipse cx="31" cy="14" rx="3.8" ry="8" transform="rotate(${deg} 31 31)"/>`)
              .join('')}
          </g>
          <circle cx="31" cy="31" r="12" fill="#43281c"/>
          <circle cx="31" cy="31" r="8.5" fill="#2d170b"/>
          <circle cx="29" cy="29" r="1.3" fill="#ffd166"/>
          <circle cx="33" cy="29" r="1.3" fill="#ffd166"/>
          <circle cx="31" cy="33" r="1.3" fill="#ffd166"/>
          <circle cx="31" cy="31" r="1.6" fill="#fce079"/>
        </g>
      `;
    } else if (type === 'daisy') {
      headSVG = `
        <g class="sprout-flower-head" style="animation-delay: ${delaySec + 0.5}s;">
          <circle cx="24" cy="24" r="22" fill="rgba(255, 238, 50, 0.25)" filter="blur(3px)"/>
          <g fill="#ffee32" stroke="#ffbe0b" stroke-width="0.5">
            ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]
              .map((deg) => `<ellipse cx="24" cy="9" rx="4.2" ry="8.5" transform="rotate(${deg} 24 24)"/>`)
              .join('')}
          </g>
          <circle cx="24" cy="24" r="8" fill="#ffb703" stroke="#e85d04" stroke-width="0.8"/>
          <circle cx="24" cy="24" r="4.8" fill="#ffd166"/>
        </g>
      `;
    } else {
      headSVG = `
        <g class="sprout-flower-head" style="animation-delay: ${delaySec + 0.55}s;">
          <circle cx="26" cy="26" r="24" fill="rgba(254, 215, 68, 0.28)" filter="blur(3px)"/>
          <g fill="#ffd000" stroke="#f48c06" stroke-width="0.8">
            ${[0, 72, 144, 216, 288]
              .map((deg) => `<ellipse cx="26" cy="12" rx="7" ry="9.5" transform="rotate(${deg} 26 26)"/>`)
              .join('')}
          </g>
          <circle cx="26" cy="26" r="6.5" fill="#fb8500"/>
          <circle cx="26" cy="26" r="3.2" fill="#ffffff"/>
        </g>
      `;
    }

    const curveControl = (Math.random() - 0.5) * 24;
    const leafSide = Math.random() > 0.5 ? 1 : -1;
    const leafY1 = stemHeight * 0.42;
    const leafY2 = stemHeight * 0.7;
    const gradId = `stemGrad-${Math.floor(Math.random() * 1000000)}`;

    container.innerHTML = `
      <div class="flower-gentle-sway" style="display: flex; flex-direction: column; align-items: center;">
        <svg width="${headSize}" height="${headSize}" viewBox="0 0 ${type === 'sunflower' ? 62 : type === 'daisy' ? 48 : 52} ${type === 'sunflower' ? 62 : type === 'daisy' ? 48 : 52}" class="sprout-head-svg">
          ${headSVG}
        </svg>
        <svg width="${width + 36}" height="${stemHeight}" viewBox="0 0 ${width + 36} ${stemHeight}" class="sprout-stem-svg" style="margin-top: -6px;">
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#52b788"/>
              <stop offset="100%" stop-color="#2d6a4f"/>
            </linearGradient>
          </defs>
          <path d="M ${(width + 36) / 2} 0 Q ${(width + 36) / 2 + curveControl} ${stemHeight / 2} ${(width + 36) / 2} ${stemHeight}" 
                stroke="url(#${gradId})" stroke-width="4.2" fill="none" stroke-linecap="round"/>
          <path d="M ${(width + 36) / 2} ${leafY1} Q ${(width + 36) / 2 + 18 * leafSide} ${leafY1 - 9} ${(width + 36) / 2 + 24 * leafSide} ${leafY1 - 4} Q ${(width + 36) / 2 + 15 * leafSide} ${leafY1 + 11} ${(width + 36) / 2} ${leafY1}" 
                fill="#52b788" stroke="#2d6a4f" stroke-width="0.8"/>
          <path d="M ${(width + 36) / 2} ${leafY2} Q ${(width + 36) / 2 - 20 * leafSide} ${leafY2 - 9} ${(width + 36) / 2 - 26 * leafSide} ${leafY2 - 4} Q ${(width + 36) / 2 - 16 * leafSide} ${leafY2 + 11} ${(width + 36) / 2} ${leafY2}" 
                fill="#74c69d" stroke="#2d6a4f" stroke-width="0.8"/>
        </svg>
      </div>
    `;

    return container;
  }

  private createRisingSpore(): HTMLElement {
    const spore = document.createElement('div');
    spore.className = 'rising-yellow-spore';
    const size = 6 + Math.random() * 8;
    spore.style.width = `${size}px`;
    spore.style.height = `${size}px`;
    spore.style.left = `${Math.random() * 98}%`;
    spore.style.bottom = '0px';
    spore.style.backgroundColor = Math.random() > 0.4 ? '#ffd166' : '#fff3b0';
    spore.style.boxShadow = '0 0 8px #ffd166';
    spore.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 80}px`);
    spore.style.animationDuration = `${4.5 + Math.random() * 4}s`;
    spore.style.animationDelay = `${Math.random() * 3.5}s`;
    return spore;
  }

  public spawnFlowerAt(x: number, y: number) {
    const stage = document.getElementById('scenicStage');
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const leftPercent = (x / rect.width) * 100;
    const height = Math.max(90, rect.height - y);
    const types: ('sunflower' | 'daisy' | 'blossom')[] = ['sunflower', 'daisy', 'blossom'];
    const flower = this.createYellowFlowerSprout(height, types[Math.floor(Math.random() * types.length)], leftPercent, 0, true);
    stage.appendChild(flower);
    audio.playChime(600 + Math.random() * 200);

    setTimeout(() => {
      flower.classList.add('fading');
      setTimeout(() => flower.remove(), 800);
    }, 4500);
  }
}

// Auto bootstrap when DOM is ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    new GameController();
  });
} else {
  new GameController();
}
