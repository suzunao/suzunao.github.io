import { StoryChapter, StoryDialogue } from './types';

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 0,
    chapterNumber: 0,
    title: 'Prólogo: La Cabaña de los Tres Suspiros',
    subtitle: '21 de Septiembre · El Despertar de la Detective',
    prose: `La niebla vespertina desciende con delicadeza sobre el bosque de abetos. En lo alto del risco, la cabaña de madera rústica exhala el cálido aroma de la leña de cedro y la canela recién molida. 

Gaby, la perspicaz detective del corazón, ha llegado al umbral. Todo parece suspendido en un ensueño: su novio Willy, un brillante investigador de ciberseguridad, ha caído en un profundo letargo frente a sus monitores luminosos tras semanas de silenciosa preparación.

Para romper el sortilegio y revelar el gran misterio que él juró develar este 21 de septiembre, Gaby debe recorrer las estancias de la cabaña, investigar los indicios forenses y desentrañar tres enigmas cifrados paso a paso. El leal Oficial John Nolan (LAPD) vigila el perímetro y la asistirá por radio con pistas graduales...`,
    clueHint: 'Inicia tu investigación en la Sala de Estar frente a la chimenea donde descansa Willy.',
    solved: true,
    requiredFlag: 'none',
    roomTarget: 'willy',
    roomLabel: 'Sala de Estar (Willy)',
  },
  {
    id: 1,
    chapterNumber: 1,
    title: 'Capítulo I: El Suspiro de la Canela y las Brasas',
    subtitle: 'La Mesa de la Sala con Chimenea',
    prose: `Frente al fuego crepitante de la chimenea de piedra, una pequeña tacita de porcelana despide espirales de vapor tibio junto a Willy, que descansa en el sofá verde con su gorra blanca de tiburón. Sobre una servilleta de lino, Willy escribió a mano un misterioso mensaje cifrado:

«Vrv pl vro»

Una nota de ciberseguridad al pie susurra: —"Aquel que cifra sus sentimientos busca que solo tú, dueña de su sol matutino, recuerdes las tres letras de desplazamiento (ROT-3) que iluminan cada despertar..."`,
    clueHint: 'Investiga la servilleta junto a la taza en la sala y usa la Lupa Forense para girar el dial del abecedario.',
    solved: false,
    requiredFlag: 'none',
    roomTarget: 'willy',
    roomLabel: 'Sala de Estar (Sofá Verde)',
    toolTarget: 'rot3',
    toolName: 'Lupa Forense ROT-3',
    targetFlagNum: 1,
  },
  {
    id: 2,
    chapterNumber: 2,
    title: 'Capítulo II: La Guarda del Felino Blanco',
    subtitle: 'La Suite del Silencio y el As Velado',
    prose: `En la serenidad de la suite, un gatito blanco como la nieve de cumbre duerme ovillado sobre un cojín de terciopelo añil. Su respiración acompasada custodia un secreto dejado por Willy.

Bajo una de sus suaves patitas, resalta un naipe de baraja: el As de Corazones (♥ A). Willy le aplicó esteganografía forense: al pasarle luz ultravioleta, una filigrana dorada revela estrellas conectadas y el texto:

«En la inmensidad del cielo nocturno, tú eres el mapa de estrellas que guía cada uno de mis pasos... M_ C___________N»`,
    clueHint: 'Acaricia al Michi en el dormitorio para descubrir el As de Corazones y enciende la linterna UV de 365nm.',
    solved: false,
    requiredFlag: 'flag1',
    lockedSummary: '🔒 Este capítulo permanece velado en las sombras. Para desbloquearlo, Gaby debe resolver primero el Capítulo I (La Servilleta ROT-3 en la sala).',
    roomTarget: 'michi',
    roomLabel: 'Dormitorio (Michi Blanco)',
    toolTarget: 'uv',
    toolName: 'Luz Ultravioleta UV Forense',
    targetFlagNum: 2,
  },
  {
    id: 3,
    chapterNumber: 3,
    title: 'Capítulo III: El Alquimista del Café & el Código Kernel',
    subtitle: 'La Barra Barista de Cobre Pulido',
    prose: `El vapor sisea suavemente en la cafetera de espresso de cobre y latón en la cocina. Sobre la pizarra de notas, Willy programó la fórmula alquímica del antídoto:

«SCRIPT: wake_boyfriend.sh --mode D____ D________»

El aroma a granos tostados de especialidad y canela de Ceilán inunda la cocina. Para preparar el legendario Café Supremo y despertar a Willy, Gaby debe deducir la frase del amanecer más dulce.`,
    clueHint: 'Examina la cafetera en la cocina y deduce el modo «D____ D________» para extraer el Café Supremo.',
    solved: false,
    requiredFlag: 'flag2',
    lockedSummary: '🔒 La fórmula alquímica de la cafetera de espresso permanece bajo llave. Resuelve el Capítulo II (El As Esteganográfico del Michi) para desbloquear este capítulo.',
    roomTarget: 'barista',
    roomLabel: 'Cocina (Barra Barista)',
    toolTarget: 'barista',
    toolName: 'Estación Barista de Café',
    targetFlagNum: 3,
  },
  {
    id: 4,
    chapterNumber: 4,
    title: 'Epílogo: La Gran Revelación de la Montaña',
    subtitle: '¡El Sortilegio Roto y el Jardín Secreto!',
    prose: `Con los tres sellos descifrados y el Café Supremo servido con infinita ternura, los párpados de Willy se abren despacio. Su mirada se llena de alegría al ver a Gaby victoriosa frente a él.

—Sabía que tu ingenio y tu corazón encontrarían cada una de mis huellas, amor —susurra Willy con una sonrisa conmovida—. Toma esta carta lacrada con cera escarlata. Ven conmigo al mirador secreto de la montaña; lo que está escrito allí florecerá para ti en todo el valle...

En ese instante, la brisa de la montaña disipa la densa bruma exterior, abriendo paso al escenario de las flores amarillas del 21 de septiembre.`,
    clueHint: 'Despierta a Willy con el Café Supremo y acompáñalo al Jardín Secreto de las Flores Amarillas.',
    solved: false,
    requiredFlag: 'all',
    lockedSummary: '🔒 El epílogo final y el Jardín Secreto de Willy solo se revelarán cuando Gaby resuelva los tres enigmas y sirva el Café Supremo para despertarlo.',
    roomTarget: 'willy',
    roomLabel: 'El Sofá de Willy Despierto',
  },
];

export const HOTSPOT_DIALOGUES: Record<string, StoryDialogue> = {
  barista: {
    speaker: 'narrator',
    speakerName: 'Máquina de Espresso y Molinillo',
    avatar: '☕',
    atmosphere: 'El vapor aromático de granos tostados y canela se eleva junto a la cafetera de cobre...',
    text: '«Examinas la barra de espresso. Sobre la pizarra de roble, Willy programó la calibración del antídoto: <code>wake_boyfriend.sh --mode D____ D________</code>. Descifra las dos palabras del amanecer más dulce o usa la Estación Barista para preparar el Café Supremo.»',
  },
  willy: {
    speaker: 'willy',
    speakerName: 'Willy (Sillón de la Sala)',
    avatar: '💻',
    atmosphere: 'Willy descansa en el sofá verde con su gorra blanca de tiburón y auriculares al cuello...',
    text: '«Willy duerme plácidamente tras días de programar este misterio para ti. Sobre la mesa baja de roble, junto a una taza tibia de canela, descansa una servilleta de lino con el cifrado: <code>«Vrv pl vro»</code>. Usa tu lupa forense para rotar las letras o consulta a Nolan por radio.»',
  },
  table: {
    speaker: 'narrator',
    speakerName: 'Mesa de Centro con Taza y Servilleta',
    avatar: '🔍',
    atmosphere: 'La luz de la chimenea ilumina la servilleta de lino y la taza de porcelana...',
    text: '«Sobre la mesa de centro descansa la servilleta de Willy junto a una taza tibia de canela. El mensaje cifrado dice: <code>«Vrv pl vro»</code>. Examina la servilleta para descubrir el ROT-3.»',
  },
  michi: {
    speaker: 'michi',
    speakerName: 'Michi Blanco & As de Corazones',
    avatar: '🐱',
    atmosphere: 'El Michi blanco ronronea apaciblemente sobre el edredón junto a los naipes de Solitario...',
    text: '«Acaricias al Michi blanco, que ronronea con ternura. Bajo su patita suave reluce el As de Corazones (♥ A). Willy le aplicó un mensaje esteganográfico invisible a simple vista: <code>«El mapa de estrellas que guía todas mis noches... M_ C___________N»</code>. Usa la luz UV forense para verlo brillar.»',
  },
  nolan: {
    speaker: 'nolan',
    speakerName: 'Oficial John Nolan (Puesto de Guardia)',
    avatar: '👮‍♂️',
    atmosphere: 'Nolan vigila junto al gazebo con su comunicador policial y placa de plata reluciente...',
    text: '«—¡Buenas noches, Detective Gaby! —saluda el Oficial Nolan con una cálida sonrisa—. He revisado el perímetro y todo está seguro. Willy preparó cada enigma con devoción antes de caer rendido. Estoy aquí para asesorarla como su oficial de apoyo táctico. ¿En qué pista necesita mi análisis policial?»',
  },
  cinnamonTea: {
    speaker: 'narrator',
    speakerName: 'Mesa de Té & Servilleta de Willy',
    avatar: '📜',
    atmosphere: 'El fuego de la chimenea proyecta cálidas sombras doradas sobre la servilleta...',
    text: '«Examinas la servilleta doblada junto a la taza de canela. La caligrafía de Willy dice: <code>«Vrv pl vro»</code> con la anotación: ROT-3 (-3 posiciones en el alfabeto). ¿Qué palabras de amor te dice al despertar?»',
  },
  espresso: {
    speaker: 'narrator',
    speakerName: 'Alquimia Barista de Willy',
    avatar: '☕',
    atmosphere: 'El cobre de la cafetera resplandece bajo las luces cálidas de la barra...',
    text: '«La máquina de espresso mantiene la presión óptima de extracción. En la libreta de recetas, Willy dejó escrito: <code>«wake_boyfriend.sh --mode D____ D________»</code>. Deduce la frase del amanecer más dulce para calibrar la molienda.»',
  },
  nolanRadio: {
    speaker: 'nolan',
    speakerName: 'Oficial John Nolan (LAPD)',
    avatar: '👮‍♂️',
    atmosphere: 'El oficial observa el bosque con semblante noble y atento...',
    text: '«—Detective Gaby, recuerde: en la policía de Los Ángeles resolvemos los casos analizando los patrones y las emociones de quien dejó las pistas. Willy la ama profundamente; cada código es una carta de amor encriptada. ¡Confíe en su instinto o pídame una pista por radio en cualquier momento!»',
  },
};

export interface NolanStepItem {
  speaker: string;
  badge: string;
  text: string;
}

export interface NolanAdviceItem {
  title: string;
  location: string;
  brief: string;
  steps: NolanStepItem[];
  connectingQuestion: string;
  quickOptions: { text: string; correct: boolean; response: string }[];
  toolTarget: 'rot3' | 'uv' | 'barista';
  toolButtonText: string;
}

export interface PrologueStep {
  id: number;
  act: string;
  title: string;
  speaker: string;
  speakerTitle: string;
  avatar: string;
  sceneImage?: string;
  ambientNote: string;
  dialogue: string;
  highlightText?: string;
  buttonLabel: string;
}

export const PROLOGUE_STEPS: PrologueStep[] = [
  {
    id: 1,
    act: 'Acto I: El Viaje a la Cabaña',
    title: '21 de Septiembre en la Cumbre',
    speaker: 'Gaby',
    speakerTitle: 'Detective & Protagonista',
    avatar: '🧣',
    ambientNote: 'El viento mece los pinos y la niebla acaricia las maderas de la cabaña...',
    dialogue: 'He llegado a la Cabaña de los Tres Suspiros. Hoy es 21 de septiembre, una fecha que Willy y yo marcamos en el calendario con tanto anhelo. El aroma a leña de cedro y canela inunda el porche... pero el silencio que sale del interior es extraño.',
    highlightText: '«Un silencio misterioso flota en la cabaña...»',
    buttonLabel: 'Entrar a la Cabaña ➡️',
  },
  {
    id: 2,
    act: 'Acto II: El Hallazgo Inusual',
    title: 'Willy en el Sofá Verde',
    speaker: 'Gaby',
    speakerTitle: 'Detective & Protagonista',
    avatar: '🧣',
    ambientNote: 'Las pantallas parpadean con candados digitales y un cursor esmeralda...',
    dialogue: '¡Willy! Al cruzar la puerta lo encuentro en el sofá verde, con su gorra blanca de tiburón y auriculares al cuello. Duerme plácidamente, pero al llamarlo suavemente no reacciona. En su laptop parpadea un aviso: [MODO PROTOCOLO: 3 SELLOS ACTIVOS]. Una nota adhesiva dice: «Amor, solo el Café Supremo calibrado romperá mi letargo».',
    highlightText: '«Willy está sumido en un sueño profundo bajo 3 sellos criptográficos...»',
    buttonLabel: 'Pedir Apoyo Táctico ➡️',
  },
  {
    id: 3,
    act: 'Acto III: Llamada al 911 de la LAPD',
    title: 'La Central de Policía Responde',
    speaker: 'Central LAPD',
    speakerTitle: 'Operadora de Comunicaciones',
    avatar: '📻',
    ambientNote: 'Tono de llamada de radio policial... estática limpia...',
    dialogue: '—Central de Policía LAPD, ¿cuál es su emergencia? —¡Operadora! Soy Gaby, estoy en la cabaña del risco y mi Willy investigador no despierta; hay notas cifradas y candados digitales en la sala. —Tranquila, señorita Gaby. Tenemos una patrulla en la zona. Le enviamos de inmediato a nuestro oficial más noble y perspicaz: el Oficial John Nolan.',
    highlightText: '«Patrulla asignada: Oficial John Nolan en camino...»',
    buttonLabel: 'Esperar a Nolan en la Puerta ➡️',
  },
  {
    id: 4,
    act: 'Acto IV: La Llegada del Compañero Táctico',
    title: 'El Oficial John Nolan en Escena',
    speaker: 'Oficial John Nolan',
    speakerTitle: 'Oficial de Policía (LAPD)',
    avatar: '👮‍♂️',
    ambientNote: 'Nolan entra con paso firme, uniforme azul marino y placa reluciente...',
    dialogue: '—¡Buenas noches, Detective Gaby! He asegurado el perímetro. Ya inspeccioné a Willy: su pulso es sereno y tiene una leve sonrisa. Esto no es un peligro, es una declaración de amor y desafío de ciberseguridad. Para despertarlo debemos preparar el Café Supremo, pero sus 3 ingredientes están sellados en la cabaña.',
    highlightText: '«—Yo seré su apoyo táctico por radio: le daré pistas cortas, una a la vez...»',
    buttonLabel: 'Escuchar el Plan de Nolan ➡️',
  },
  {
    id: 5,
    act: 'Acto V: El Inicio de la Investigación',
    title: '¡Manos a la Obra, Detective!',
    speaker: 'Oficial John Nolan',
    speakerTitle: 'Oficial de Policía (LAPD)',
    avatar: '👮‍♂️',
    ambientNote: 'Nolan ajusta el walkie-talkie en su hombro...',
    dialogue: '—Estaré vigilando desde el gazebo y el bosque. Llévese este radiotransmisor en la frecuencia táctica. Cuando se acerque a un objeto o necesite deducir, llámeme por el Canal 7. Le daré pistas cortas y progresivas para que no se sature. ¡Encontremos esos 3 sellos y despertemos a Willy!',
    highlightText: '«¡Es hora de desentrañar el misterio de la cabaña!»',
    buttonLabel: '💼 ¡Comenzar la Investigación! 🔍',
  },
];

export const NOLAN_RADIO_ADVICES: Record<'flag1' | 'flag2' | 'flag3' | 'allSolved', NolanAdviceItem> = {
  flag1: {
    title: 'Pista 1: La Servilleta ROT-3',
    location: 'Sala de Estar (Sofás Verdes)',
    brief: 'Sobre la mesita baja junto a Willy hay una servilleta escrita: «Vrv pl vro» (ROT-3).',
    steps: [
      {
        speaker: 'Oficial John Nolan',
        badge: 'Procedimiento de Campo',
        text: '10-4, Detective Gaby. Primero lo primero: acérquese a la sala e inspeccione la mesita de café junto a Willy. Una buena detective nunca deduce sin recoger la evidencia física con sus propios ojos.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Criptoanálisis Clásico',
        text: 'Al examinar la servilleta verá «Vrv pl vro» con una anotación de ROT-3. Es el cifrado de Julio César: cada carácter se desplazó una distancia fija en el abecedario. Debe usar la Lupa Forense para girar el dial hacia atrás.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Guía de Deducción',
        text: 'Fíjese en la última palabra: «vro». Si retrocede 3 letras en el abecedario a cada letra (V→S, R→O, O→L), obtendrá el nombre del astro que da luz a nuestros días. Y «Vrv» se convierte en una afirmación de amor.',
      },
    ],
    connectingQuestion: '¿Qué método criptográfico empleó Willy y hacia dónde debemos rotar el dial?',
    quickOptions: [
      { text: 'Rotar el abecedario -3 posiciones con la Lupa Forense', correct: true, response: '¡Exacto, Gaby! Al rotar -3 letras en la Lupa Forense, las palabras tomarán sentido en español.' },
      { text: 'Buscar un código de barras digital en la servilleta', correct: false, response: 'Negativo, no es un código de barras. Es escritura manual con cifrado César clásico.' },
      { text: 'Dejar el dial en 0 y esperar que se resuelva solo', correct: false, response: 'En 0 el texto queda como «Vrv pl vro». Debe desplazar el dial para descifrarlo.' },
    ],
    toolTarget: 'rot3',
    toolButtonText: 'Abrir Lupa Forense ROT-3',
  },
  flag2: {
    title: 'Pista 2: El As Esteganográfico',
    location: 'Dormitorio (Bajo el Michi Blanco)',
    brief: 'Bajo la patita del Michi Blanco hay un naipe As de Corazones con puntos velados.',
    steps: [
      {
        speaker: 'Oficial John Nolan',
        badge: 'Procedimiento de Campo',
        text: '10-4, Detective Gaby. Para este segundo indicio, camine hasta la suite principal. Acaricie con delicadeza al Michi Blanco para ver qué custodia bajo su patita.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Análisis Forense UV',
        text: 'A simple vista es un As de Corazones común. Pero Willy aplicó esteganografía con tinta invisible. Debe encender la linterna ultravioleta (365nm) para que las estrellas doradas ocultas brillen en la oscuridad.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Guía de Deducción',
        text: 'Al iluminar el naipe, verá un conjunto de estrellas enlazadas y la plantilla: «M_ C___________N». La segunda palabra tiene 12 letras y es el término astronómico que describe un conjunto de estrellas que forman una figura.',
      },
    ],
    connectingQuestion: '¿Cómo podemos hacer visible el mensaje secreto que custodia el Michi?',
    quickOptions: [
      { text: 'Encender la linterna de luz ultravioleta (UV 365nm)', correct: true, response: '¡10-4! La longitud de onda UV revela la tinta fluorescente y el mapa celeste.' },
      { text: 'Raspar el naipe con una navaja', correct: false, response: '¡No dañe la evidencia! La tinta es fluorescente y solo necesita luz ultravioleta.' },
      { text: 'Mojar el naipe con agua caliente', correct: false, response: 'El agua estropearía el naipe. Use la linterna UV forense de su equipo.' },
    ],
    toolTarget: 'uv',
    toolButtonText: 'Examinar con Linterna UV',
  },
  flag3: {
    title: 'Pista 3: La Alquimia del Café',
    location: 'Cocina (Cafetera de Cobre)',
    brief: 'En la cafetera hay una terminal: wake_boyfriend.sh --mode D____ D________',
    steps: [
      {
        speaker: 'Oficial John Nolan',
        badge: 'Procedimiento de Campo',
        text: '10-4, Detective Gaby. El tercer enigma está en la cocina. Acérquese a la máquina barista de cobre y examine la pizarra donde Willy programó la terminal.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Análisis de la Fórmula',
        text: 'En la pizarra figura el comando: wake_boyfriend.sh --mode D____ D________. Son dos palabras con D: la primera es el sabor de la canela y la miel (lo opuesto a amargo), y la segunda es el acto de abrir los ojos.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Preparación Barista',
        text: 'Una vez descifrada la fórmula («D____ D________»), active los tres pasos en la máquina: muela los granos con canela, extraiga el espresso a 9 bares de presión y emulsione la leche tibia.',
      },
    ],
    connectingQuestion: '¿Qué dos conceptos forman el modo matutino para despertar a Willy?',
    quickOptions: [
      { text: 'Lo opuesto a amargo (5 letras) + el momento de abrir los ojos (9 letras)', correct: true, response: '¡Exactamente, Detective! Es el concepto del amanecer más dulce y tierno.' },
      { text: 'Café instantáneo con agua helada', correct: false, response: 'Willy es un barista meticuloso, ¡requiere espresso doble calibrado!' },
      { text: 'Una contraseña numérica aleatoria', correct: false, response: 'No son números, son dos palabras poéticas que describen su despertar.' },
    ],
    toolTarget: 'barista',
    toolButtonText: 'Abrir Estación Barista',
  },
  allSolved: {
    title: '¡Sellos Descifrados!',
    location: 'Cabaña & Terraza',
    brief: 'Los 3 enigmas están resueltos y el Café Supremo está listo para servirse.',
    steps: [
      {
        speaker: 'Oficial John Nolan',
        badge: 'Misión Cumplida',
        text: '¡Extraordinario trabajo deductivo, Detective Gaby! Todos los indicios encajaron a la perfección.',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'Paso Final',
        text: 'Lleve la taza de Café Supremo humeante con canela hasta los sofás verdes. ¡El aroma despertará a Willy!',
      },
      {
        speaker: 'Oficial John Nolan',
        badge: 'La Sorpresa',
        text: 'Willy la está esperando para revelarle la sorpresa más hermosa del 21 de septiembre.',
      },
    ],
    connectingQuestion: '¡Es hora de despertar a Willy con el Café Supremo!',
    quickOptions: [],
    toolTarget: 'barista',
    toolButtonText: 'Ir a los Sofás Verdes',
  },
};

export const ACCEPTED_ANSWERS: Record<string, string[]> = {
  flag1: ['sos mi sol', 'eres mi sol', 'tu eres mi sol', 'mi sol', 'flag{sos_mi_sol}'],
  flag2: ['mi constelacion', 'constelacion', 'mi constelación', 'constelación', 'flag{mi_constelacion}'],
  flag3: ['dulce despertar', 'despertar dulce', 'el dulce despertar', 'flag{dulce_despertar}'],
};

