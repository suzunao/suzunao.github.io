// Pixel Art Sprites fieles a las referencias fotográficas reales de Gaby, El Novio y Oficial John Nolan

export interface SpriteOptions {
  size?: number;
  className?: string;
  awakened?: boolean;
}

/**
 * GABY (La Detective Jugable)
 * - Cabello castaño oscuro ondulado con volumen
 * - Sudadera oversize rosa pastel (#f4ccd5 / #f5cbd3) con cuello blanco de camisa asomando
 * - Estampado de perrito con orejas caídas en contorno azul (#4a90e2)
 * - Tacita blanca de té/café sostenida con ambas manos
 * - Pantalón holgado negro (#1e1e1e) y zapatillas (#333333)
 */
export function getGabySpriteSVG(options: SpriteOptions = {}): string {
  const size = options.size || 32;
  const cls = options.className ? ` class="${options.className}"` : '';

  return `
    <svg${cls} width="${size}" height="${size}" viewBox="0 0 32 32" style="image-rendering: pixelated; display: block;">
      <ellipse cx="16" cy="30" rx="9" ry="2" fill="#140f0c" opacity="0.6"/>
      <!-- Pantalón holgado negro -->
      <rect x="10" y="19" width="5" height="9" fill="#1e1e1e"/>
      <rect x="17" y="19" width="5" height="9" fill="#1e1e1e"/>
      <!-- Zapatillas -->
      <rect x="10" y="28" width="5" height="2" fill="#333333"/>
      <rect x="17" y="28" width="5" height="2" fill="#333333"/>
      <!-- Sudadera Rosa Pastel -->
      <rect x="8" y="11" width="16" height="9" rx="1" fill="#f4ccd5"/>
      <!-- Cuello blanco de camisa asomando -->
      <polygon points="14,11 16,13 15,11" fill="#ffffff"/>
      <polygon points="18,11 16,13 17,11" fill="#ffffff"/>
      <!-- Estampado perrito contorno azul -->
      <path d="M13,14 Q16,12 19,14 Q19,16 16,16 Q13,16 13,14" fill="none" stroke="#4a90e2" stroke-width="0.8"/>
      <!-- Tacita blanca sostenida con ambas manos -->
      <rect x="14" y="15" width="4" height="4" rx="0.5" fill="#ffffff"/>
      <rect x="15.5" y="14" width="1" height="1" fill="#9e5b32"/>
      <!-- Manos envolviendo la taza -->
      <rect x="13" y="16" width="1.5" height="2.5" fill="#fcdbcf"/>
      <rect x="17.5" y="16" width="1.5" height="2.5" fill="#fcdbcf"/>
      <!-- Cuello y Rostro -->
      <rect x="12" y="5" width="8" height="6.5" fill="#fcdbcf"/>
      <rect x="13" y="7" width="1.5" height="1.5" fill="#2b1a0e"/>
      <rect x="17" y="7" width="1.5" height="1.5" fill="#2b1a0e"/>
      <!-- Mejillas sonrosadas y sonrisa -->
      <rect x="12" y="9" width="1.5" height="1" fill="#f59f9f" opacity="0.7"/>
      <rect x="18" y="9" width="1.5" height="1" fill="#f59f9f" opacity="0.7"/>
      <line x1="15" y1="9.5" x2="17" y2="9.5" stroke="#a65246" stroke-width="0.7"/>
      <!-- Cabello castaño ondulado -->
      <path d="M10,5 C10,1 22,1 22,5 L23,13 L21,14 L20,7 L12,7 L11,14 L9,13 Z" fill="#442a1b"/>
    </svg>
  `.trim();
}

/**
 * EL NOVIO (El Ciberinvestigador)
 * - Gorra blanca hacia adelante con la silueta de un tiburón bordada al frente
 * - Auriculares de diadema negros alrededor del cuello
 * - Camiseta blanca básica
 * - Recostado en el sofá verde con laptop ThinkPad negra llena de stickers de hacking
 * - Soporta estado dormido o despierto/enamorado
 */
export function getNovioSpriteSVG(options: SpriteOptions = {}): string {
  const size = options.size || 32;
  const cls = options.className ? ` class="${options.className}"` : '';
  const awakened = options.awakened || false;

  // Eyes and expression based on awake status
  const eyesAndSmile = awakened
    ? `
      <!-- Ojos despiertos y brillantes con sonrisa -->
      <circle cx="14" cy="12.5" r="0.9" fill="#2b1a0e"/>
      <circle cx="18" cy="12.5" r="0.9" fill="#2b1a0e"/>
      <circle cx="14.3" cy="12.2" r="0.3" fill="#ffffff"/>
      <circle cx="18.3" cy="12.2" r="0.3" fill="#ffffff"/>
      <path d="M15,14 Q16,15 17,14" stroke="#8a3c28" stroke-width="0.7" fill="none"/>
      <!-- Rubor de felicidad -->
      <rect x="12" y="13" width="1.5" height="0.8" fill="#f29292" opacity="0.8"/>
      <rect x="18.5" y="13" width="1.5" height="0.8" fill="#f29292" opacity="0.8"/>
      <!-- Corazoncito flotando -->
      <path d="M26,9 C26,7 28,7 28,9 C28,11 26,12.5 26,12.5 C26,12.5 24,11 24,9 C24,7 26,7 26,9 Z" fill="#ff4d6d"/>
    `
    : `
      <!-- Ojos descansando pacíficamente -->
      <line x1="13" y1="13" x2="15" y2="13" stroke="#4a3e3d" stroke-width="0.8"/>
      <line x1="17" y1="13" x2="19" y2="13" stroke="#4a3e3d" stroke-width="0.8"/>
      <line x1="15" y1="14.5" x2="17" y2="14.5" stroke="#7a5542" stroke-width="0.6"/>
    `;

  return `
    <svg${cls} width="${size}" height="${size}" viewBox="0 0 32 32" style="image-rendering: pixelated; display: block;">
      <ellipse cx="16" cy="30" rx="10" ry="2" fill="#140f0c" opacity="0.6"/>
      <!-- Sofá verde de fondo -->
      <rect x="3" y="11" width="26" height="17" rx="2" fill="#2d5a37"/>
      <rect x="1" y="15" width="4" height="13" rx="1" fill="#22452a"/>
      <rect x="27" y="15" width="4" height="13" rx="1" fill="#22452a"/>
      <!-- Camiseta blanca -->
      <rect x="9" y="15" width="14" height="11" fill="#ffffff"/>
      <!-- Rostro -->
      <rect x="12" y="9.5" width="8" height="6.5" fill="#d9a882"/>
      ${eyesAndSmile}
      <!-- Auriculares de diadema en el cuello -->
      <path d="M10,15 C10,17.5 22,17.5 22,15" stroke="#1a1a1a" stroke-width="1.8" fill="none"/>
      <rect x="9" y="14" width="2.5" height="3.5" rx="0.5" fill="#111"/>
      <rect x="20.5" y="14" width="2.5" height="3.5" rx="0.5" fill="#111"/>
      <!-- Gorra blanca con el tiburón bordado -->
      <rect x="11" y="6.5" width="10" height="4" rx="0.5" fill="#ffffff"/>
      <rect x="9.5" y="9.5" width="13" height="1.5" fill="#f0f0f0"/>
      <!-- Silueta geométrica de tiburón bordada en la gorra -->
      <polygon points="14,7.5 17,7.5 18,9 15,9" fill="#385a7c"/>
      <!-- Laptop ThinkPad con stickers de ciberseguridad -->
      <rect x="18" y="21" width="8" height="6" rx="0.5" fill="#222"/>
      <rect x="19" y="22" width="2" height="1.5" fill="#4a90e2"/>
      <rect x="23" y="22" width="2" height="2" rx="1" fill="#f5c538"/>
      <rect x="20" y="24.5" width="4" height="1.5" fill="#00ff66"/>
    </svg>
  `.trim();
}

/**
 * WYLLI DE PIE / CAMINANDO (Compañero en el Mundo Virtual)
 * - Gorra blanca con bordado de tiburón
 * - Auriculares al cuello
 * - Camiseta blanca / sudadera con detalles ciber
 * - Jeans azul marino oscuro y zapatillas deportivas
 */
export function getWylliStandingSpriteSVG(options: SpriteOptions & { facingLeft?: boolean; step?: number } = {}): string {
  const size = options.size || 32;
  const cls = options.className ? ` class="${options.className}"` : '';
  const facingLeft = options.facingLeft || false;
  const step = options.step || 0;
  const legOffset1 = step % 2 === 0 ? 1 : -1;
  const legOffset2 = -legOffset1;

  return `
    <svg${cls} width="${size}" height="${size}" viewBox="0 0 32 32" style="image-rendering: pixelated; display: block; ${facingLeft ? 'transform: scaleX(-1);' : ''}">
      <ellipse cx="16" cy="30" rx="9" ry="2" fill="#140f0c" opacity="0.6"/>
      <!-- Jeans vaqueros azul marino -->
      <rect x="11" y="19" width="4.5" height="${9 + legOffset1}" fill="#1b2838"/>
      <rect x="16.5" y="19" width="4.5" height="${9 + legOffset2}" fill="#1b2838"/>
      <!-- Zapatillas -->
      <rect x="10.5" y="${28 + legOffset1}" width="5" height="2" fill="#2b2d42"/>
      <rect x="16.5" y="${28 + legOffset2}" width="5" height="2" fill="#2b2d42"/>
      <!-- Camiseta/Sudadera blanca con acentos ciber -->
      <rect x="9" y="11" width="14" height="9" rx="1" fill="#f8f9fa"/>
      <line x1="10" y1="18" x2="22" y2="18" stroke="#e2e8f0" stroke-width="0.8"/>
      <!-- Auriculares de diadema en el cuello -->
      <path d="M10,12 C10,15 22,15 22,12" stroke="#111111" stroke-width="1.8" fill="none"/>
      <rect x="9" y="11" width="2" height="3" fill="#111111"/>
      <rect x="21" y="11" width="2" height="3" fill="#111111"/>
      <!-- Rostro sonriente despierto de Wylli -->
      <rect x="12" y="5" width="8" height="6.5" fill="#fcdbcf"/>
      <circle cx="14" cy="7.5" r="0.9" fill="#2b1a0e"/>
      <circle cx="18" cy="7.5" r="0.9" fill="#2b1a0e"/>
      <circle cx="14.3" cy="7.2" r="0.3" fill="#ffffff"/>
      <circle cx="18.3" cy="7.2" r="0.3" fill="#ffffff"/>
      <path d="M15,9.5 Q16,10.5 17,9.5" stroke="#8a3c28" stroke-width="0.7" fill="none"/>
      <!-- Rubor sonrosado -->
      <rect x="12.5" y="8.5" width="1.5" height="0.8" fill="#ff758f" opacity="0.8"/>
      <rect x="18" y="8.5" width="1.5" height="0.8" fill="#ff758f" opacity="0.8"/>
      <!-- Gorra blanca con visera y silueta de tiburón bordada -->
      <rect x="11" y="2.5" width="10" height="3.5" rx="0.5" fill="#ffffff"/>
      <polygon points="10,5 22,5 23,6 9,6" fill="#f0f0f0"/>
      <!-- Silueta del tiburón en la gorra -->
      <path d="M14.5,3.5 Q16,2.8 17.5,3.5 Q16.8,4.3 15.2,4.3 Z" fill="#385a7c"/>
    </svg>
  `.trim();
}

/**
 * OFICIAL JOHN NOLAN (LAPD - Nathan Fillion / The Rookie)
 * - Uniforme reglamentario azul marino (#182337 / #121a29)
 * - Corbata negra con pisacorbatas plateado
 * - Placa policial plateada ovalada pulida
 * - Bodycam cuadrada con led azul
 * - Cinturón táctico con radio policial walkie-talkie
 * - Semblante afable y cabello castaño con raya
 */
export function getNolanSpriteSVG(options: SpriteOptions = {}): string {
  const size = options.size || 32;
  const cls = options.className ? ` class="${options.className}"` : '';

  return `
    <svg${cls} width="${size}" height="${size}" viewBox="0 0 32 32" style="image-rendering: pixelated; display: block;">
      <ellipse cx="16" cy="30" rx="9" ry="2" fill="#140f0c" opacity="0.6"/>
      <!-- Pantalón azul marino LAPD -->
      <rect x="11" y="21" width="4" height="8" fill="#121a29"/>
      <rect x="17" y="21" width="4" height="8" fill="#121a29"/>
      <rect x="11" y="28" width="4" height="2" fill="#000000"/>
      <rect x="17" y="28" width="4" height="2" fill="#000000"/>
      <!-- Camisa reglamentaria LAPD -->
      <rect x="10" y="11" width="12" height="10" fill="#182337"/>
      <!-- Corbata negra y pisacorbatas -->
      <polygon points="15,11 17,11 16.5,17 15.5,17" fill="#0b0e14"/>
      <line x1="15" y1="14" x2="17" y2="14" stroke="#dcdcdc" stroke-width="0.6"/>
      <!-- Bodycam central -->
      <rect x="14.5" y="14.5" width="3" height="3" rx="0.3" fill="#111111"/>
      <circle cx="16" cy="16" r="0.7" fill="#3a86ff"/>
      <!-- Placa policial plateada ovalada pulida -->
      <ellipse cx="13" cy="14" rx="1.5" ry="2" fill="#e2e8f0"/>
      <ellipse cx="13" cy="14" rx="0.8" ry="1" fill="#ffffff"/>
      <!-- Cinturón táctico con radio policial -->
      <rect x="9.5" y="19.5" width="13" height="2" fill="#000000"/>
      <rect x="19" y="18" width="2" height="4" fill="#222222"/>
      <line x1="20" y1="18" x2="20" y2="15" stroke="#222222" stroke-width="0.8"/>
      <!-- Rostro de Nolan -->
      <rect x="12" y="5" width="8" height="6" fill="#fcdbcf"/>
      <rect x="13.5" y="7" width="1.5" height="1.5" fill="#261e19"/>
      <rect x="17" y="7" width="1.5" height="1.5" fill="#261e19"/>
      <!-- Sonrisa confiable de oficial -->
      <path d="M15,9 Q16,10 17,9" stroke="#9a4d3a" stroke-width="0.6" fill="none"/>
      <!-- Cabello castaño corto con raya -->
      <path d="M12,5 C12,3 20,3 20,5 L20,7 L12,7 Z" fill="#4d372c"/>
    </svg>
  `.trim();
}

/**
 * MICHI BLANCO (El Guardián del As de Corazones)
 */
export function getMichiSpriteSVG(options: SpriteOptions = {}): string {
  const size = options.size || 32;
  const cls = options.className ? ` class="${options.className}"` : '';

  return `
    <svg${cls} width="${size}" height="${size}" viewBox="0 0 32 32" style="image-rendering: pixelated; display: block;">
      <ellipse cx="16" cy="28" rx="8" ry="2.5" fill="#140f0c" opacity="0.6"/>
      <!-- Cojín añil -->
      <rect x="7" y="22" width="18" height="6" rx="2" fill="#212a42"/>
      <!-- Cuerpo del gatito blanco ovillado -->
      <ellipse cx="16" cy="19" rx="7" ry="5" fill="#ffffff"/>
      <!-- Orejas -->
      <polygon points="12,12 14,16 11,16" fill="#ffffff"/>
      <polygon points="12.5,13 13.5,15.5 11.5,15.5" fill="#f8b6c8"/>
      <polygon points="20,12 21,16 18,16" fill="#ffffff"/>
      <polygon points="19.5,13 20.5,15.5 18.5,15.5" fill="#f8b6c8"/>
      <!-- Cabeza -->
      <circle cx="16" cy="16" r="4.5" fill="#ffffff"/>
      <!-- Ojos cerrados dormilones -->
      <path d="M14,16 Q15,17 16,16" stroke="#5a5265" stroke-width="0.6" fill="none"/>
      <path d="M16.5,16 Q17.5,17 18.5,16" stroke="#5a5265" stroke-width="0.6" fill="none"/>
      <!-- Nariz y bigotitos -->
      <polygon points="15.8,17.5 16.6,17.5 16.2,18" fill="#f8b6c8"/>
      <line x1="12" y1="17.5" x2="14.5" y2="17.8" stroke="#ccc" stroke-width="0.5"/>
      <line x1="17.5" y1="17.8" x2="20" y2="17.5" stroke="#ccc" stroke-width="0.5"/>
      <!-- Patita sobre el As de Corazones -->
      <rect x="18.5" y="19" width="4.5" height="6" rx="0.5" fill="#fdfbf7" stroke="#999" stroke-width="0.4"/>
      <text x="19.5" y="23" font-size="3.5" fill="#d90429" font-weight="bold">♥</text>
      <circle cx="18" cy="20" r="1.5" fill="#ffffff"/>
    </svg>
  `.trim();
}

/**
 * PAREJA EN EL JARDÍN SECRETO: GABY Y WYLLI TOMADOS DE LA MANO
 */
export function getCoupleTogetherSVG(size = 96): string {
  return `
    <svg width="${size}" height="${Math.round(size * 0.9)}" viewBox="0 0 64 54" style="image-rendering: pixelated; display: block;">
      <!-- Sombra suave en el suelo del mirador -->
      <ellipse cx="32" cy="50" rx="24" ry="4" fill="#0c0712" opacity="0.7"/>

      <!-- === WYLLI (A la izquierda) === -->
      <!-- Pantalón vaquero oscuro -->
      <rect x="14" y="32" width="6" height="15" fill="#1b2838"/>
      <rect x="21" y="32" width="6" height="15" fill="#1b2838"/>
      <!-- Zapatillas deportivas -->
      <rect x="13" y="47" width="7" height="3" fill="#2b2d42"/>
      <rect x="21" y="47" width="7" height="3" fill="#2b2d42"/>
      <!-- Camiseta / Sudadera blanca con logo ciber -->
      <rect x="12" y="18" width="16" height="15" rx="1.5" fill="#f8f9fa"/>
      <!-- Auriculares al cuello -->
      <path d="M14,18 C14,21 26,21 26,18" stroke="#111111" stroke-width="2.5" fill="none"/>
      <!-- Gorra blanca de tiburón hacia adelante -->
      <path d="M13,10 C13,4 27,4 27,10 L30,12 L27,13 L13,13 Z" fill="#ffffff"/>
      <!-- Silueta del tiburón en la gorra -->
      <path d="M19,7 Q21,6 23,7 Q22,8 20,8 Z" fill="#4a90e2"/>
      <!-- Rostro sonriente despierto de Wylli -->
      <rect x="15" y="10" width="10" height="7.5" fill="#fcdbcf"/>
      <circle cx="17.5" cy="13" r="1" fill="#2b1a0e"/>
      <circle cx="22.5" cy="13" r="1" fill="#2b1a0e"/>
      <circle cx="17.8" cy="12.7" r="0.4" fill="#ffffff"/>
      <circle cx="22.8" cy="12.7" r="0.4" fill="#ffffff"/>
      <path d="M19,15 Q20,16.2 21,15" stroke="#944835" stroke-width="0.8" fill="none"/>
      <!-- Rubor de amor -->
      <rect x="15.5" y="14" width="2" height="1" fill="#ff758f" opacity="0.75"/>
      <rect x="22.5" y="14" width="2" height="1" fill="#ff758f" opacity="0.75"/>

      <!-- === GABY (A la derecha) === -->
      <!-- Pantalón holgado negro -->
      <rect x="37" y="32" width="6" height="15" fill="#1e1e1e"/>
      <rect x="44" y="32" width="6" height="15" fill="#1e1e1e"/>
      <!-- Zapatillas -->
      <rect x="37" y="47" width="6" height="3" fill="#333333"/>
      <rect x="44" y="47" width="6" height="3" fill="#333333"/>
      <!-- Sudadera rosa pastel oversize -->
      <rect x="35" y="18" width="16" height="15" rx="1.5" fill="#f4ccd5"/>
      <!-- Cuello blanco de camisa -->
      <polygon points="41,18 43,20 42,18" fill="#ffffff"/>
      <polygon points="45,18 43,20 44,18" fill="#ffffff"/>
      <!-- Contorno de perrito azul -->
      <path d="M40,23 Q43,21 46,23 Q46,25 43,25 Q40,25 40,23" fill="none" stroke="#4a90e2" stroke-width="0.8"/>
      <!-- Cabello castaño ondulado -->
      <path d="M37,10 C37,3 49,3 49,10 L51,22 L48,23 L47,12 L39,12 L38,23 L35,22 Z" fill="#442a1b"/>
      <!-- Rostro dulce y sonriente de Gaby -->
      <rect x="38" y="10" width="10" height="7.5" fill="#fcdbcf"/>
      <circle cx="40.5" cy="13" r="1" fill="#2b1a0e"/>
      <circle cx="45.5" cy="13" r="1" fill="#2b1a0e"/>
      <circle cx="40.8" cy="12.7" r="0.4" fill="#ffffff"/>
      <circle cx="45.8" cy="12.7" r="0.4" fill="#ffffff"/>
      <path d="M42,15 Q43,16.2 44,15" stroke="#944835" stroke-width="0.8" fill="none"/>
      <!-- Rubor sonrosado -->
      <rect x="38.5" y="14" width="2" height="1" fill="#ff758f" opacity="0.75"/>
      <rect x="45.5" y="14" width="2" height="1" fill="#ff758f" opacity="0.75"/>

      <!-- === MANOS ENTRELAZADAS EN EL CENTRO ❤️ === -->
      <!-- Brazo derecho de Wylli hacia el centro -->
      <rect x="27" y="23" width="5" height="4" rx="1.5" fill="#f8f9fa"/>
      <!-- Brazo izquierdo de Gaby hacia el centro -->
      <rect x="32" y="23" width="5" height="4" rx="1.5" fill="#f4ccd5"/>
      <!-- Manitas tomadas con amor -->
      <circle cx="32" cy="26" r="2.8" fill="#fcdbcf"/>
      <circle cx="32" cy="26" r="1.5" fill="#ffb4a2"/>

      <!-- Destellos de estrellas y corazones alrededor -->
      <path d="M32,4 C32,2 34,2 34,4 C34,6 32,7.5 32,7.5 C32,7.5 30,6 30,4 C30,2 32,2 32,4 Z" fill="#ff3366"/>
      <circle cx="9" cy="12" r="1" fill="#ffd166"/>
      <circle cx="55" cy="14" r="1.2" fill="#ffd166"/>
    </svg>
  `.trim();
}

/**
 * Devuelve el markup SVG según el identificador de personaje
 */
export function getSpeakerAvatarHTML(speaker: string, size = 32, awakened = false): string {
  switch (speaker) {
    case 'gaby':
      return getGabySpriteSVG({ size });
    case 'novio':
      return getNovioSpriteSVG({ size, awakened });
    case 'nolan':
      return getNolanSpriteSVG({ size });
    case 'michi':
      return getMichiSpriteSVG({ size });
    default:
      return `<span style="font-size: ${Math.round(size * 0.65)}px; line-height: 1;">📜</span>`;
  }
}

