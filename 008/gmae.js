// CONSTANTES DEL JUEGO
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

// VARIABLES GLOBALES
let board, catImg, errorImg, status, keyboard;
let cells = [];
let selectedLetter = null;
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
  keyboard = document.getElementById('keyboard');
  
  // Limpiar contenido previo
  board.innerHTML = '';
  keyboard.innerHTML = '';
  cells = [];
  selectedLetter = null;
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
    
    // Evento para hacer clic en celda
    cell.addEventListener('click', () => {
      if (!cell.classList.contains("locked") && selectedLetter) {
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
      }
    });
    
    // Evento táctil para móvil
    cell.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!cell.classList.contains("locked") && selectedLetter) {
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

  // Crear teclado
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
    const key = document.createElement("div");
    key.className = "key";
    key.textContent = letter;
    
    key.addEventListener('click', () => {
      // Remover selección anterior
      document.querySelectorAll('.key').forEach(k => {
        k.classList.remove('active');
      });
      
      // Seleccionar nueva letra
      key.classList.add('active');
      selectedLetter = letter;
      status.textContent = `Selected: ${letter}`;
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
    
    keyboard.appendChild(key);
  });

  // Configurar teclado físico
  setupKeyboardControls();
}

// CONFIGURAR TECLADO FÍSICO
function setupKeyboardControls() {
  document.addEventListener('keydown', function(event) {
    const key = event.key.toUpperCase();
    
    // Letras A-Z
    if (/^[A-Z]$/.test(key)) {
      event.preventDefault();
      
      // Actualizar teclado visual
      document.querySelectorAll('.key').forEach(k => {
        k.classList.remove('active');
        if (k.textContent === key) {
          k.classList.add('active');
        }
      });
      
      selectedLetter = key;
      status.textContent = `Selected: ${key}`;
    }
  });
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
  }
}

// Estilos para tecla activa
const style = document.createElement('style');
style.textContent = `
  .key.active {
    background: #ff2255 !important;
    border-color: #ff2255 !important;
    color: white !important;
  }
`;
document.head.appendChild(style);