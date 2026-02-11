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
let board, catImg, errorImg, status, virtualInput;
let cells = [];
let cursor = 0;
let completedWords = new Set();
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
  
  // Obtener o crear input virtual
  virtualInput = document.getElementById('virtualKeyboardInput');
  if (!virtualInput) {
    virtualInput = document.createElement('input');
    virtualInput.id = 'virtualKeyboardInput';
    virtualInput.type = 'text';
    virtualInput.maxlength = 1;
    virtualInput.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      border: none !important;
      background: transparent !important;
      color: transparent !important;
      pointer-events: none !important;
      transform: translate(-50%, -50%) !important;
      z-index: -1 !important;
    `;
    document.body.appendChild(virtualInput);
  }
  
  // Configurar el input virtual SOLO para móviles
  if (isMobile) {
    setupVirtualInput();
  }
  
  // Limpiar contenido previo
  board.innerHTML = '';
  cells = [];
  cursor = 0;
  completedWords.clear();
  map = {};
  
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
    
    // Evento para CLIC en celda (funciona en PC y móvil)
    cell.addEventListener('click', handleCellClick);
    
    // Eventos táctiles específicos para móvil
    cell.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (!this.classList.contains("locked")) {
        this.style.transform = 'scale(0.95)';
      }
    });
    
    cell.addEventListener('touchend', function(e) {
      e.preventDefault();
      this.style.transform = '';
      // Solo manejar el clic, no activar teclado aquí
    });

    board.appendChild(cell);
    cells.push(cell);
  });

  // Encontrar primera celda no bloqueada
  cursor = cells.findIndex(cell => !cell.classList.contains("locked"));
  if (cursor === -1) cursor = 0;
  setActive();

  // Configurar teclado físico (solo para PC)
  if (!isMobile) {
    setupKeyboardControls();
  }
}

// MANEJAR CLIC EN CELDA
function handleCellClick() {
  if (!this.classList.contains("locked")) {
    cursor = cells.indexOf(this);
    setActive();
    
    // Si es móvil, activar el teclado virtual
    if (isMobile) {
      activateVirtualKeyboard();
    }
  }
}

// CONFIGURAR INPUT VIRTUAL PARA MÓVILES
function setupVirtualInput() {
  virtualInput.value = '';
  virtualInput.addEventListener('input', function(e) {
    const inputValue = this.value.toUpperCase();
    
    // Aceptar solo letras de la A a la Z
    if (/^[A-Z]$/.test(inputValue)) {
      writeLetter(inputValue);
      this.value = ''; // Limpiar después de escribir
      
      // Automáticamente mover al siguiente cuadrito
      setTimeout(() => {
        moveToNextEmptyCell();
        // Volver a activar el teclado para la siguiente celda
        if (isMobile) {
          setTimeout(activateVirtualKeyboard, 100);
        }
      }, 50);
    } else {
      this.value = ''; // Limpiar si no es una letra válida
    }
  });
  
  virtualInput.addEventListener('keydown', function(e) {
    // Permitir Backspace para borrar
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      clearCurrentCell();
    }
    
    // Permitir Enter para siguiente
    if (e.key === 'Enter') {
      e.preventDefault();
      moveToNextEmptyCell();
      activateVirtualKeyboard();
    }
    
    // Permitir flechas para navegar
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveCursor(-1);
      activateVirtualKeyboard();
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveCursor(1);
      activateVirtualKeyboard();
    }
    
    // Evitar que se escriban números o caracteres especiales
    if (!/^[A-Za-z]$/.test(e.key) && e.key.length === 1 && 
        e.key !== 'Backspace' && e.key !== 'Delete' && 
        e.key !== 'Enter' && !e.key.startsWith('Arrow')) {
      e.preventDefault();
    }
  });
  
  virtualInput.addEventListener('blur', function() {
    // Cuando pierde el foco, limpiar
    setTimeout(() => {
      this.value = '';
    }, 100);
  });
}

// ACTIVAR TECLADO VIRTUAL EN MÓVILES
function activateVirtualKeyboard() {
  if (!isMobile || !virtualInput) return;
  
  // Enfocar el input para abrir teclado
  setTimeout(() => {
    virtualInput.focus();
    
    // Algunos navegadores necesitan un click también
    virtualInput.click();
    
    // Forzar el enfoque en algunos navegadores
    setTimeout(() => {
      virtualInput.focus({preventScroll: true});
    }, 50);
  }, 150);
}

// MOVER AL SIGUIENTE CUADRO VACÍO
function moveToNextEmptyCell() {
  let startCursor = cursor;
  
  do {
    cursor++;
    if (cursor >= cells.length) {
      cursor = 0; // Volver al inicio
    }
    
    // Si damos una vuelta completa, detenerse
    if (cursor === startCursor) {
      break;
    }
  } while (cells[cursor] && 
           (cells[cursor].classList.contains("locked") || 
            cells[cursor].querySelector(".letter").innerText !== ""));
  
  cursor = Math.max(0, Math.min(cursor, cells.length - 1));
  setActive();
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
  cell.classList.toggle("correct", isCorrect);
  cell.classList.toggle("wrong", !isCorrect);

  checkWords();
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
    
    // Ocultar teclado en móvil cuando se completa
    if (isMobile && virtualInput) {
      virtualInput.blur();
      document.activeElement.blur();
    }
  }
}

// Hacer funciones disponibles globalmente
window.moveCursor = moveCursor;
window.writeLetter = writeLetter;