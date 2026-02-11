// CONSTANTES DEL JUEGO - FRASE ACTUALIZADA
const MESSAGE = "WEAR STOCKINGS AND A SKIRT TO PLEASE YOUR MASTER AND BEHAVE YOURSELF";

// LETRAS FIJAS
const FIXED = {
  0: "W",    
  5: "S",        
  15: "A",   
  25: "T",  
  30: "P", 
  36: "E",   
  42: "M",   
  48: "R",   
  53: "B",   
  55: "H",
  60: "Y",   
  67: "F"    
};

const cats = [
  "https://media1.tenor.com/m/U5--bumLp-YAAAAC/loving-yamada-at-lv999-akane-kinoshita.gif",
  "https://media1.tenor.com/m/J0r98xPgGVsAAAAd/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/GrBsQ35iYMcAAAAC/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/mrBF84XZ0ywAAAAC/loving-yamada-at-lv999-akito-yamada.gif",
  "https://media1.tenor.com/m/OybMUSYnNJEAAAAC/akito-yamada-sweater.gif"
];

const errorGif = "https://media1.tenor.com/m/vmwklMDAJ9YAAAAC/loving-yamada-at-lv999-akane-kinoshita.gif";

// VARIABLES GLOBALES DEL JUEGO
let board, catImg, errorImg, status, virtualKeyboard;
let cells = [];
let cursor = 0;
let completedWords = new Set();
let mistakes = 0;
let map = {};
let isMobile = false;

// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  const notification = document.getElementById('systemNotification');
  const gameContainer = document.getElementById('gameContainer');
  const startBtn = document.getElementById('startGameBtn');
  
  // Detectar si es móvil
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
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
});

// FUNCIÓN PARA INICIALIZAR EL JUEGO
function initGame() {
  board = document.getElementById('board');
  catImg = document.getElementById('catImg');
  errorImg = document.getElementById('errorImg');
  status = document.getElementById('status');
  virtualKeyboard = document.getElementById('virtualKeyboard');
  
  // Limpiar contenido previo
  board.innerHTML = '';
  cells = [];
  cursor = 0;
  completedWords.clear();
  mistakes = 0;
  map = {};
  
  // Actualizar contador de errores
  updateMistakesCounter();
  
  // Crear mapa de letras a números
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((letter, index) => {
    map[letter] = index + 1;
  });

  // Crear celdas del tablero
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

    const letterElement = document.createElement("div");
    letterElement.className = "letter";

    const numberElement = document.createElement("div");
    numberElement.className = "number";
    numberElement.innerText = map[character];

    // Si esta posición está fija en FIXED, bloquearla
    if (FIXED[index]) {
      letterElement.innerText = FIXED[index];
      cell.classList.add("locked", "correct");
    }

    cell.append(letterElement, numberElement);
    
    // Evento para seleccionar celda
    cell.addEventListener('click', () => handleCellClick(cell));
    
    // Eventos táctiles para móvil
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
  });

  // Encontrar primera celda no bloqueada
  cursor = cells.findIndex(cell => !cell.classList.contains("locked"));
  if (cursor === -1) cursor = 0;
  setActive();

  // Crear teclado virtual solo si es móvil
  if (isMobile) {
    createVirtualKeyboard();
    virtualKeyboard.classList.add('show');
  }
  
  // Configurar teclado físico solo para PC
  if (!isMobile) {
    setupKeyboardControls();
  }
}

// MANEJAR CLIC EN CELDA
function handleCellClick(cell) {
  if (!cell.classList.contains("locked")) {
    cursor = cells.indexOf(cell);
    setActive();
  }
}

// CREAR TECLADO VIRTUAL DINÁMICAMENTE
function createVirtualKeyboard() {
  virtualKeyboard.innerHTML = '';
  virtualKeyboard.className = 'virtual-keyboard';
  
  // Definir distribución del teclado (como la imagen)
  const keyboardLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['BACKSPACE', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER']
  ];
  
  // Crear filas del teclado
  keyboardLayout.forEach((rowKeys, rowIndex) => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    
    // Añadir espacios para centrar la segunda fila
    if (rowIndex === 1) {
      const spacerLeft = document.createElement('div');
      spacerLeft.className = 'keyboard-spacer half';
      row.appendChild(spacerLeft);
    }
    
    // Crear teclas
    rowKeys.forEach(keyText => {
      const key = document.createElement('button');
      key.className = 'key';
      
      if (keyText === 'BACKSPACE' || keyText === 'ENTER') {
        key.className += ' special-key';
        key.id = keyText.toLowerCase();
        key.textContent = keyText === 'BACKSPACE' ? '⌫' : 'ENTER';
        
        key.addEventListener('click', () => {
          if (keyText === 'BACKSPACE') {
            clearCurrentCell();
          } else if (keyText === 'ENTER') {
            moveCursor(1);
          }
        });
      } else {
        key.dataset.key = keyText;
        key.textContent = keyText;
        
        key.addEventListener('click', () => {
          writeLetter(keyText);
        });
      }
      
      row.appendChild(key);
    });
    
    // Añadir espacio final para segunda fila
    if (rowIndex === 1) {
      const spacerRight = document.createElement('div');
      spacerRight.className = 'keyboard-spacer half';
      row.appendChild(spacerRight);
    }
    
    virtualKeyboard.appendChild(row);
  });
  
  // Crear fila de navegación
  const navRow = document.createElement('div');
  navRow.className = 'keyboard-row navigation-row';
  
  const leftBtn = document.createElement('button');
  leftBtn.className = 'nav-key';
  leftBtn.id = 'moveLeft';
  leftBtn.textContent = '←';
  leftBtn.addEventListener('click', () => moveCursor(-1));
  
  const rightBtn = document.createElement('button');
  rightBtn.className = 'nav-key';
  rightBtn.id = 'moveRight';
  rightBtn.textContent = '→';
  rightBtn.addEventListener('click', () => moveCursor(1));
  
  const clearBtn = document.createElement('button');
  clearBtn.className = 'nav-key';
  clearBtn.id = 'clearCell';
  clearBtn.textContent = 'CLEAR';
  clearBtn.addEventListener('click', clearCurrentCell);
  
  navRow.appendChild(leftBtn);
  navRow.appendChild(rightBtn);
  navRow.appendChild(clearBtn);
  virtualKeyboard.appendChild(navRow);
  
  // Hacer que el teclado sea visible
  virtualKeyboard.style.display = 'block';
}

// ACTUALIZAR CONTADOR DE ERRORES
function updateMistakesCounter() {
  const mistakeDots = document.querySelectorAll('.mistake-dot');
  mistakeDots.forEach((dot, index) => {
    if (index < mistakes) {
      dot.classList.add('used');
    } else {
      dot.classList.remove('used');
    }
  });
}

// CONFIGURAR TECLADO FÍSICO PARA PC
function setupKeyboardControls() {
  document.addEventListener('keydown', function(event) {
    const key = event.key.toUpperCase();
    
    // Letras A-Z
    if (/^[A-Z]$/.test(key)) {
      event.preventDefault();
      writeLetter(key);
    }
    // Flechas
    else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveCursor(-1);
    }
    else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveCursor(1);
    }
    // Enter o Espacio para siguiente
    else if (event.key === 'Enter' || event.key === ' ') {
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
  const cell = cells[cursor];
  if (cell && !cell.classList.contains("locked")) {
    cell.querySelector(".letter").innerText = "";
    cell.classList.remove("correct", "wrong");
  }
}

// ESTABLECER CELDA ACTIVA
function setActive() {
  cells.forEach(cell => cell.classList.remove("active"));
  if (cells[cursor]) {
    cells[cursor].classList.add("active");
    
    // Scroll suave a la celda activa
    cells[cursor].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
}

// MOVER CURSOR
function moveCursor(step) {
  do {
    cursor += step;
  } while (
    cells[cursor] &&
    cells[cursor].classList.contains("locked")
  );

  cursor = Math.max(0, Math.min(cursor, cells.length - 1));
  setActive();
}

// ESCRIBIR UNA LETRA
function writeLetter(letter) {
  const cell = cells[cursor];
  if (!cell || cell.classList.contains("locked")) return;

  cell.querySelector(".letter").innerText = letter;
  
  const isCorrect = letter === cell.dataset.correct;
  
  if (isCorrect) {
    cell.classList.add("correct");
    cell.classList.remove("wrong");
  } else {
    cell.classList.add("wrong");
    cell.classList.remove("correct");
    
    // Incrementar contador de errores
    mistakes++;
    if (mistakes > 3) mistakes = 3;
    updateMistakesCounter();
  }

  checkWords();
  
  // Mover al siguiente automáticamente
  setTimeout(() => {
    moveCursor(1);
  }, 100);
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
      wordCells.forEach(cell => cell.classList.add("locked", "correct"));
      completedWords.add(wordIndex);
      showCat();
    } else {
      showError();
    }

    cellIndex += word.length;
  });

  checkAllCompleted();
}

// MOSTRAR GIF DE GATO
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
    
    // Ocultar teclado virtual si existe
    if (virtualKeyboard) {
      virtualKeyboard.style.display = 'none';
    }
  }
}

// Hacer funciones disponibles globalmente
window.moveCursor = moveCursor;
window.writeLetter = writeLetter;