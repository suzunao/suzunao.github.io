# Auditoría Técnica — Cinemáticas y Escenas

**Fecha:** 2026-09-21
**Proyecto:** El Enigma de la Cabaña de los Tres Suspiros
**Archivos analizados:** `phaserScenes.ts`, `characters.ts`, `game.ts`, `phaserConfig.ts`, `index.html`

---

## 1. Instancias de `#phaserAwakening` y `#phaserGarden`

### `#phaserAwakening` (SalaScene)

**Ubicación:** `game.ts:2071-2092`

```typescript
private startAwakeningCanvas() {
  const overlay = document.getElementById('awakeningOverlay');
  if (overlay) overlay.classList.add('active');
  this.state.currentScene = 'sala';

  BootScene.START_SCENE = 'SalaScene';
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
```

- Se crea sin parámetro `nextScene` → `BootScene.START_SCENE` queda en `'SalaScene'` (default estático)
- Pre-carga `sala.jpeg` + `flores.jpeg`, luego arranca `SalaScene`
- Un polling con `setTimeout(checkReady, 100)` espera que `SalaScene` esté activa para inyectar `onSalaComplete`
- Al completar: destruye escena → muestra `#verdictModal` (sobre 3D con sello de cera)

### `#phaserGarden` (GardenScene)

**Ubicación:** `game.ts:2095-2101`

```typescript
private openGardenScene(): void {
  const vwModal = document.getElementById('virtualWorldModal');
  if (vwModal) vwModal.classList.add('active');
  this.state.currentScene = 'garden';

  this.createPhaserGame('phaserGarden', 'GardenScene');
}
```

- Se llama desde 4 puntos:
  1. `btnGoToMeadow` (post-sello de cera en verdictModal)
  2. `bloomGardenYellowFlowers` (btn en secretGardenScenario)
  3. `openGardenScene` (hotspot Willy cuando `state.awakened === true`)
  4. `btnBloomGardenYellowFlowers`
- `BootScene.START_SCENE` se fuerza a `'GardenScene'` vía propiedad estática
- El Phaser.Game se destruye y recrea (no hay reaprovechamiento)

---

## 2. Fallos de Física/Colisiones/Ordenamiento en SalaScene

### Y-sorting: SÍ implementado

**Ubicación:** `phaserScenes.ts:155-161`

```typescript
/* Y-sorting: draw characters by y position */
const chars = [this.gaby, this.willy, this.nolan].sort(
  (a, b) => a.y - b.y,
);
for (const c of chars) {
  drawCharacter(this.adapter as any, c.x, c.y, this.getCharKey(c), c.state, t, c.dir);
}
```

El array se ordena por `y` ascendente antes de dibujar, por lo que el personaje con mayor `y` se dibuja al final (encima). **Esto es correcto.**

### Fallos reales encontrados:

#### A. `drawSleeping()` no dibuja a Willy acostado

**Ubicación:** `characters.ts:499-560`

```typescript
function drawSleeping(
  ctx: CanvasRenderingContext2D,
  s: CharSpec,
  time: number,
): void {
  const legH = 7;
  const legSpread = 1;

  /* Legs (projected forward) — MISMA ORIENTACIÓN VERTICAL */
  ctx.fillStyle = s.pantsColor;
  ctx.fillRect(-s.pantsW - legSpread, 0, s.pantsW, legH);
  ctx.fillRect(legSpread, 0, s.pantsW, legH);

  /* ...idéntico a drawSitting salvo los ojos y zzz... */
}
```

**Problema:** La función es casi idéntica a `drawSitting`. Dibuja al personaje con la misma orientación vertical (piernas hacia abajo, torso vertical). Solo cambia:
- Ojos cerrados (`--` en vez de `••`)
- Texto "zzz" flotante

**No hay rotación horizontal** para simular estar acostado en el sofá. Willy se ve como si estuviera sentado/parado, no durmiendo.

#### B. Sin colisiones entre personajes

**Ubicación:** `phaserScenes.ts:315-329`

```typescript
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
```

Movimiento por interpolación lineal pura (`lerp`). No hay:
- Detección de obstáculos
- Colisión entre personajes
- Separación de overlaps

Los personajes se atraviesan entre sí al caminar.

#### C. Sin walkable mask en escena de sala

**Diferencia clave:**
- `game.ts` tiene `WALKABLE_ZONES` y `BLOCKED_ZONES` para el mapa HTML interactivo
- `SalaScene` en `phaserScenes.ts` **no tiene** validación de trayectorias
- Gaby puede caminar libremente por cualquier coordenada

#### D. Posiciones iniciales vs especificación

| Personaje | Especificación | Código actual (`phaserScenes.ts:108-133`) |
|-----------|---------------|------------------------------------------|
| Nolan | `(20%, 75%)` exterior guardia | `(82%, 46%)` en sala |
| Willy | Sofá central `(55%, 55%)` durmiendo | `(58%, 56%)` ✓ correcto |
| Gaby | Centro `(45%, 60%)` | `(45%, 62%)` ✓ casi correcto |

Nolan está en posición de interior, no de guardia exterior.

---

## 3. Flujo Post-Sello de Cera → Transición al Jardín

### Secuencia completa (`game.ts:2591-2643`):

```
1. click waxSealBtn
   ├─ audio.playSealBreak()
   ├─ seal.classList.add('broken')
   └─ Partículas: 12 divs animados con CSS variables --px/--py

2. setTimeout(500ms)
   └─ flap.classList.add('opened') — animación CSS del sobre

3. setTimeout(1400ms)
   ├─ envelope3D.style.display = 'none'
   └─ letterUnfolded.classList.add('visible') — carta desplegada

4. click btnGoToMeadow
   ├─ verdictModal.classList.remove('active')
   ├─ state.gardenRevealed = true
   ├─ audio.playVictoryWaltz()
   └─ this.openGardenScene()
       ├─ virtualWorldModal.classList.add('active')
       ├─ createPhaserGame('phaserGarden', 'GardenScene')
       └─ BootScene → preload → GardenScene.create()
```

**La transición SÍ funciona.** El `btnGoToMeadow` cierra `verdictModal` y abre `virtualWorldModal` con el Phaser Garden.

---

## 4. Resumen de Fallos Críticos

| # | Fallo | Impacto | Ubicación |
|---|-------|---------|-----------|
| **1** | `drawSleeping()` no dibuja a Willy acostado horizontalmente | Visual rompe la narrativa — se ve sentado/parado en vez de dormido en sofá | `characters.ts:499-560` |
| **2** | Falta hand-in-hand walk en GardenScene | El spec dice que ambos caminan juntos tomados de la mano desde `(92%, 62%)` al banco `(35%, 54%)`. Solo Gaby camina; Willy ya está en el banco | `phaserScenes.ts:456-496` |
| **3** | No hay 40 flores (son 30) | Spec dice 40 flores en anillo. Código tiene `BLOOM_COUNT = 30` | `phaserScenes.ts:438` |
| **4** | No hay sparkle dorado en campo amarillo | Spec: "aparecen destellos dorados en el gran campo amarillo superior" tras completar anillo — no implementado | GardenScene |
| **5** | Falta transición fundido negro/dorado entre escenas | SalaScene tiene fadeOut a negro pero no hay transición visible a GardenScene (se destruye Phaser y se crea nuevo sin animación) | `game.ts:2085-2086, 2095-2101` |
| **6** | Falta Escenario 1 (Exterior con `mapa.png`) como cinemática Phaser | El spec pide secuencia narrativa con Nolan en `(20%, 75%)` y Gaby investigando. Actualmente `mapa.png` solo es fondo HTML estático sin Phaser | No implementado |
| **7** | `BootScene` carga `flores.jpeg` innecesariamente para SalaScene | Sobra carga de red si solo se necesita para GardenScene | `phaserScenes.ts:24-25` |
| **8** | Sin walkable mask en GardenScene | `isBlocked()` existe pero nunca se invoca en el pathfinding de Gaby — dead code | `phaserScenes.ts:811-815` |
| **9** | Carta en GardenScene usa sobre Phaser simplificado | Spec pide modal elegante con sello de conejito que se abre. `showLetterModal()` actual es gráfico básico con "S" | `phaserScenes.ts:672-753` |
| **10** | No hay "SOS MI SOL" visible en GardenScene | La carta muestra solo "S O S   M I   S O L" como texto plano. Falta el contenido narrativo completo de la carta del spec | `phaserScenes.ts:711-714` |

---

## 5. Especificación vs Estado Actual

### Escenarios implementados

| Escenario | Fondo | Estado | Notas |
|-----------|-------|--------|-------|
| Exterior cabaña | `mapa.png` | ❌ Solo fondo HTML estático | No hay cinemática Phaser. Nolan y Gaby son SVGs estáticos en `index.html` |
| Sala interior | `sala.jpeg` | ✅ Funcional con fallos | Cinemática con 9 fases. Falta sleeping real, colisiones, hand-in-hand |
| Jardín flores | `flores.jpeg` | ✅ Funcional con fallos | 5 fases. Falta hand-in-hand, 40 flores, sparkles, carta completa |

### Flujo narrativo completo (spec vs actual)

```
SPEC:
  Prologue → Exterior (mapa.png, Nolan guardia) → Sala (sala.jpeg, café + carta)
  → Jardín (flores.jpeg, banca + flores + carta + modo libre)

ACTUAL:
  Prologue → Sala (sala.jpeg, café + carta) → Sobre 3D → Jardín (flores.jpeg)
  → (falta Exterior como cinemática Phaser)
```

El Escenario 1 (Exterior) está **completamente ausente** como cinemática Phaser. Solo existe como fondo HTML en `index.html`.
