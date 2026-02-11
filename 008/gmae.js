// CONSTANTES DEL JUEGO
const MESSAGE = "WEAR STOCKINGS AND A SKIRT TO PLEASE YOUR MASTER AND BEHAVE YOURSELF";

// LETRAS FIJAS (pistas)
const FIXED = {
  0: "W",    // W de WEAR
  5: "S",    // S de STOCKINGS
  15: "A",   // A de AND
  25: "T",   // T de TO
  30: "P",   // P de PLEASE
  36: "E",   // E de PLEASE
  42: "M",   // M de MASTER
  48: "R",   // R de MASTER
  53: "B",   // B de BEHAVE
  55: "H",   // H de BEHAVE
  60: "Y",   // Y de YOURSELF
  67: "F"    // F de YOURSELF
};

const cats = [
  "https://media1.tenor.com/m/U5--bumLp-YAAAAC/loving-yamada-at-lv999-akane-kinoshita.gif",
  "https://media1.tenor.com/m/J0r98xPgGVsAAAAd/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/GrBsQ35iYMcAAAAC/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/mrBF84XZ0ywAAAAC/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/OybMUSYnNJEAAAAC/akito-yamada-sweater.gif"
];

const errorGif = "https://media1.tenor.com/m/vmwklMDAJ9YAAAAC/loving-yamada-at-lv999-akane-kinoshita.gif";

// VARIABLES GLOBALES
let board, catImg, errorImg, status, keyboard;
let currentLetter, cursorPosition;
let cells = [];
let selectedLetter = null;
let activeCellIndex = 0;
let completedWords = new Set();
let map = {};

// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  const notification = document.getElementById('systemNotification');
  const gameContainer = document.getElementById('gameContainer');
  const startBtn = document.getElementById('startGameBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  // Mostrar notificación primero
  setTimeout(() => {
    notification.style.display = 'flex';
  }, 100);
  
  // Evento para iniciar el juego
  startBtn.addEventListener('click', function() {
    startBtn.style.transform = 'scale(0.95)';
    startBtn.style.background = 'linear-gradient(135deg, #cc0044, #ff2255)';
    
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.7s ease-out forwards';
      
      setTimeout(() => {
        notification.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        initGame();
        
        setTimeout(() => {
          gameContainer.style.opacity = '1';
        }, 100);
      }, 700);
    }, 200);
  });
  
  // Configurar botones de navegación
  prevBtn.addEventListener('click', () => moveCursor(-1));
  nextBtn.addEventListener('click', () => moveCursor(1));
});

// FUNCIÓN PARA INICIALIZAR EL JUEGO
function initGame() {
  board = document.getElementById('board');
  catImg = document.getElementById('catImg');
  errorImg = document.getElementById('errorImg');
  status = document.getElementById('status');
  keyboard = document.getElementById('keyboard');
  currentLetter = document.getElementById('currentLetter');
  cursorPosition = document.getElementById('cursorPosition');
  
  // Limpiar contenido previo
  board.innerHTML = '';
  keyboard.innerHTML = '';
  cells = [];
  selectedLetter = null;
  activeCellIndex = 0;
  completedWords.clear();
  map = {};
  
  // Crear mapa de letras a números
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter, index) => {
    map[letter] = index + 1;
  });

  // Crear celdas del tablero
  let cellCount = 0;
  MESSAGE.split("").forEach((character, index) => {
    if (character === " ") {
      const space = document.createElement("div");
      space.className = "space";
      board.appendChild(space);
      return;
    }

    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.correct = character;
    cell.dataset.index = index;
    cell.dataset.cellIndex = cellCount;

    const letterElement = document.createElement("div");
    letterElement.className = "letter";

    const numberElement = document.createElement("div");
    numberElement.className = "number";
    numberElement.innerText = map[character];

    // Si esta posición está fija en FIXED, marcarla como pista
    if (FIXED[index] !== undefined) {
      letterElement.innerText = FIXED[index];
      cell.classList.add("locked", "correct", "fixed");
      cell.title = "Pista fija";
    }

    cell.append(letterElement, numberElement);
    
    // Evento para hacer clic en celda
    cell.addEventListener('click', () => {
      if (!cell.classList.contains("locked") && selectedLetter) {
        // Mover cursor a esta celda
        activeCellIndex = parseInt(cell.dataset.cellIndex);
        setActiveCell();
        
        // Escribir la letra seleccionada
        writeSelectedLetter();
      }
    });
    
    // Evento táctil para móvil
    cell.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!cell.classList.contains("locked")) {
        cell.style.transform = 'scale(0.95)';
      }
    });
    
    cell.addEventListener('touchend', (e) => {
      e.preventDefault();
      cell.style.transform = '';
    });

    board.appendChild(cell);
    cells.push(cell);
    cellCount++;
  });

  // Crear teclado
  createKeyboard();
  
  // Encontrar primera celda no bloqueada para cursor
  activeCellIndex = cells.findIndex(cell => !cell.classList.contains("locked"));
  if (activeCellIndex === -1) activeCellIndex = 0;
  
  setActiveCell();
  updateCursorPosition();
  
  // Configurar teclado físico
  setupKeyboardControls();
}

// CREAR TECLADO VISUAL
function createKeyboard() {
  keyboard.innerHTML = '';
  
  // Filas del teclado QWERTY
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];
  
  keyboardRows.forEach((row, rowIndex) => {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.justifyContent = 'center';
    rowDiv.style.gap = '6px';
    rowDiv.style.marginBottom = '6px';
    
    // Añadir margen izquierdo para centrar segunda fila
    if (rowIndex === 1) {
      rowDiv.style.marginLeft = '15px';
      rowDiv.style.marginRight = '15px';
    }
    
    row.forEach(letter => {
      const key = document.createElement("div");
      key.className = "key";
      key.textContent = letter;
      key.dataset.letter = letter;
      
      key.addEventListener('click', () => {
        selectLetter(letter);
      });
      
      // Eventos táctiles para móvil
      key.addEventListener('touchstart', (e) => {
        e.preventDefault();
        key.style.transform = 'scale(0.95)';
      });
      
      key.addEventListener('touchend', (e) => {
        e.preventDefault();
        key.style.transform = '';
      });
      
      rowDiv.appendChild(key);
    });
    
    keyboard.appendChild(rowDiv);
  });
}

// SELECCIONAR LETRA DEL TECLADO
function selectLetter(letter) {
  // Remover selección anterior
  document.querySelectorAll('.key').forEach(k => {
    k.classList.remove('active');
  });
  
  // Seleccionar nueva letra
  const key = document.querySelector(`.key[data-letter="${letter}"]`);
  if (key) {
    key.classList.add('active');
  }
  
  selectedLetter = letter;
  currentLetter.textContent = letter;
  
  // Escribir automáticamente en celda activa
  if (cells[activeCellIndex] && !cells[activeCellIndex].classList.contains("locked")) {
    writeSelectedLetter();
  }
}

// ESCRIBIR LETRA SELECCIONADA EN CELDA ACTIVA
function writeSelectedLetter() {
  const cell = cells[activeCellIndex];
  if (!cell || cell.classList.contains("locked") || !selectedLetter) return;

  const letterElement = cell.querySelector(".letter");
  letterElement.innerText = selectedLetter;
  
  const isCorrect = selectedLetter === cell.dataset.correct;
  
  if (isCorrect) {
    cell.classList.add("correct");
    cell.classList.remove("wrong");
  } else {
    cell.classList.add("wrong");
    cell.classList.remove("correct");
    showError();
  }
  
  checkWords();
  
  // Mover al siguiente automáticamente
  setTimeout(() => {
    moveCursor(1);
  }, 100);
}

// MOVER CURSOR
function moveCursor(direction) {
  const startIndex = activeCellIndex;
  let found = false;
  
  do {
    activeCellIndex += direction;
    
    // Limitar rango
    if (activeCellIndex < 0) activeCellIndex = cells.length - 1;
    if (activeCellIndex >= cells.length) activeCellIndex = 0;
    
    // Si damos una vuelta completa, detenerse
    if (activeCellIndex === startIndex) {
      break;
    }
    
    // Buscar celda no bloqueada
    if (!cells[activeCellIndex].classList.contains("locked")) {
      found = true;
      break;
    }
  } while (!found);
  
  setActiveCell();
  updateCursorPosition();
}

// ESTABLECER CELDA ACTIVA
function setActiveCell() {
  cells.forEach(cell => cell.classList.remove("active"));
  
  if (cells[activeCellIndex]) {
    cells[activeCellIndex].classList.add("active");
    
    // Scroll suave a la celda activa
    cells[activeCellIndex].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
}

// ACTUALIZAR POSICIÓN DEL CURSOR
function updateCursorPosition() {
  cursorPosition.textContent = (activeCellIndex + 1);
}

// CONFIGURAR TECLADO FÍSICO
function setupKeyboardControls() {
  document.addEventListener('keydown', function(event) {
    const key = event.key.toUpperCase();
    
    // Letras A-Z
    if (/^[A-Z]$/.test(key)) {
      event.preventDefault();
      selectLetter(key);
    }
    // Flechas izquierda/derecha
    else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveCursor(-1);
    }
    else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveCursor(1);
    }
    // Backspace para borrar
    else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      clearCurrentCell();
    }
  });
}

// BORRAR CELDA ACTUAL
function clearCurrentCell() {
  const cell = cells[activeCellIndex];
  if (cell && !cell.classList.contains("locked")) {
    cell.querySelector(".letter").innerText = "";
    cell.classList.remove("correct", "wrong");
  }
}

// VERIFICAR PALABRAS COMPLETADAS
function checkWords() {
  hideImages();

  let cellIndex = 0;
  const words = MESSAGE.split(" ");
  
  words.forEach((word, wordIndex) => {
    const wordCells = cells.slice(cellIndex, cellIndex + word.length);

    const filled = wordCells.every(
      cell => cell.querySelector(".letter").innerText !== ""
    );

    if (!filled || completedWords.has(wordIndex)) {
      cellIndex += word.length;
      return;
    }

    const correct = wordCells.every(
      cell => cell.querySelector(".letter").innerText === cell.dataset.correct
    );

    if (correct) {
      // Bloquear todas las celdas de la palabra
      wordCells.forEach(cell => {
        cell.classList.add("locked", "correct");
        cell.title = "Palabra completada";
      });
      
      completedWords.add(wordIndex);
      showCat();
    }

    cellIndex += word.length;
  });

  checkAllCompleted();
}

// MOSTRAR GIF DE GATO (éxito)
function showCat() {
  errorImg.classList.remove("show");
  const randomCat = cats[Math.floor(Math.random() * cats.length)];
  catImg.src = randomCat + "?t=" + new Date().getTime();
  catImg.classList.add("show");

  setTimeout(() => {
    catImg.classList.remove("show");
  }, 2200);
}

// MOSTRAR GIF DE ERROR
function showError() {
  catImg.classList.remove("show");
  errorImg.src = errorGif + "?t=" + new Date().getTime();
  errorImg.classList.add("show");
  
  setTimeout(() => {
    errorImg.classList.remove("show");
  }, 1500);
}

// OCULTAR IMÁGENES
function hideImages() {
  catImg.classList.remove("show");
  errorImg.classList.remove("show");
}

// VERIFICAR SI SE COMPLETÓ TODO
function checkAllCompleted() {
  if (completedWords.size === MESSAGE.split(" ").length) {
    status.innerHTML = `
      <div class="completion-message">
        <strong>⚡ ORDEN DECODIFICADA ⚡</strong><br><br>
        <div class="decoded-text">
          "${MESSAGE}"
        </div>
        <div class="instructions">
          <strong>Instrucción recibida. Procede a obedecer inmediatamente.</strong><br>
          Llama a las 9:00 PM para confirmar cumplimiento.
        </div>
      </div>
    `;
    
    // Ocultar teclado en móvil
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setTimeout(() => {
        keyboard.style.display = 'none';
      }, 1000);
    }
  }
}