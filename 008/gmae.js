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
let board, catImg, errorImg, status, hiddenInput;
let cells = [];
let cursor = 0;
let completedWords = new Set();
let map = {};

// FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
  const notification = document.getElementById('systemNotification');
  const gameContainer = document.getElementById('gameContainer');
  const startBtn = document.getElementById('startGameBtn');
  
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
  
  // Crear input oculto para teclado móvil
  createHiddenInput();
  
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
    
    // Evento para activar teclado móvil
    cell.addEventListener('click', () => {
      if (!cell.classList.contains("locked")) {
        cursor = cells.indexOf(cell);
        setActive();
        activateMobileKeyboard();
      }
    });
    
    // Eventos táctiles para móvil
    cell.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!cell.classList.contains("locked")) {
        cursor = cells.indexOf(cell);
        setActive();
        cell.style.transform = 'scale(0.95)';
      }
    });
    
    cell.addEventListener('touchend', (e) => {
      e.preventDefault();
      cell.style.transform = '';
      // Activar teclado después del toque
      if (!cell.classList.contains("locked")) {
        activateMobileKeyboard();
      }
    });

    board.appendChild(cell);
    cells.push(cell);
  });

  // Encontrar primera celda no bloqueada
  cursor = cells.findIndex(cell => !cell.classList.contains("locked"));
  if (cursor === -1) cursor = 0;
  setActive();

  // Configurar teclado físico
  setupKeyboardControls();
}

// CREAR INPUT OCULTO PARA TECLADO MÓVIL
function createHiddenInput() {
  // Eliminar input anterior si existe
  if (hiddenInput) {
    hiddenInput.remove();
  }
  
  // Crear nuevo input
  hiddenInput = document.createElement('input');
  hiddenInput.id = 'hiddenKeyboardInput';
  hiddenInput.type = 'text';
  hiddenInput.inputmode = 'text'; // Para teclado normal de letras
  hiddenInput.maxLength = 1;
  hiddenInput.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    border: none;
    background: transparent;
    color: transparent;
    pointer-events: none;
    transform: translate(-100%, -100%);
  `;
  
  // Configurar eventos del input
  hiddenInput.addEventListener('input', function(e) {
    const inputValue = this.value.toUpperCase();
    if (/^[A-Z]$/.test(inputValue)) {
      writeLetter(inputValue);
      this.value = ''; // Limpiar después de usar
    }
  });
  
  hiddenInput.addEventListener('blur', function() {
    // Cuando pierde el foco, limpiar
    setTimeout(() => {
      this.value = '';
    }, 100);
  });
  
  hiddenInput.addEventListener('keydown', function(e) {
    // Permitir backspace para borrar
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      clearCurrentCell();
    }
    // Evitar que se escriban números o caracteres especiales
    if (!/^[A-Za-z]$/.test(e.key) && e.key.length === 1) {
      e.preventDefault();
    }
  });
  
  // Añadir al body
  document.body.appendChild(hiddenInput);
}

// ACTIVAR TECLADO MÓVIL
function activateMobileKeyboard() {
  if (!hiddenInput) return;
  
  // Solo activar en dispositivos móviles
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Enfocar el input para abrir teclado
    setTimeout(() => {
      hiddenInput.focus();
      // Forzar el enfoque en móviles
      hiddenInput.click();
      
      // Algunos navegadores necesitan esto
      setTimeout(() => {
        hiddenInput.focus({preventScroll: true});
      }, 50);
    }, 100);
  }
}

// CONFIGURAR TECLADO FÍSICO
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
  moveCursor(1);
  
  // Volver a activar el teclado para siguiente letra (solo en móvil)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile && hiddenInput) {
    setTimeout(() => {
      activateMobileKeyboard();
    }, 150);
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
    if (hiddenInput) {
      hiddenInput.blur();
    }
    
    // Añadir estilos para el mensaje de completado
    const style = document.createElement('style');
    style.textContent = `
      .completion-message {
        background: linear-gradient(135deg, rgba(34, 34, 34, 0.9), rgba(20, 20, 20, 0.95));
        color: #fff;
        padding: 15px;
        border-radius: 10px;
        margin-top: 15px;
        text-align: center;
        font-size: 14px;
        line-height: 1.5;
        border: 2px solid #ff2255;
        box-shadow: 0 0 20px rgba(255, 34, 85, 0.4);
      }
      
      .decoded-text {
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
        margin: 10px 0;
        padding: 10px;
        background: rgba(255, 34, 85, 0.1);
        border-radius: 6px;
        font-size: 13px;
      }
      
      .instructions {
        margin-top: 10px;
        color: #ff6699;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
}

// Hacer funciones disponibles globalmente
window.moveCursor = moveCursor;
window.writeLetter = writeLetter;