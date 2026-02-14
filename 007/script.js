// === 1. ELEMENTOS DEL DOM ===
const wrapper = document.getElementById("wrapper");
const question = document.getElementById("question");
const gif = document.getElementById("gif");
const yesBtn = document.getElementById("yes-btn");
const noBtn = document.getElementById("no-btn");
const retoFlags = document.getElementById("reto-flags");
const successCard = document.getElementById("success-card");
const retosBuscaminas = document.getElementById("retos");
const successMessage = document.getElementById("success-message");
const continuarBtn = document.getElementById("continuar-btn");
const gifOverlay = document.getElementById("gif-overlay");
const narutoGif = document.getElementById("naruto-gif");
const gifMessage = document.getElementById("gif-message");
const mensajeSecreto = document.getElementById("mensaje-secreto");

// === DETECCIÓN DE DISPOSITIVO MÓVIL ===
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// === MENSAJE SECRETO (SOLO EN JS) ===
const SECRETOS = {
    MENSAJE: "💜 Vos sos, mi amor, mi kernel, mi constante en un mar de variables 💜"
};

// === 2. CREAR CONTENEDOR PARA MARIPOSAS ===
const app = document.createElement('div');
app.id = 'app';
document.body.appendChild(app);

// === 3. MANEJO DE LA CARTA INICIAL ===
yesBtn.addEventListener("click", () => {
    question.innerHTML = "¡Sabía que lo harías! 💜";
    gif.src = "https://media.giphy.com/media/UMon0fuimoAN9ueUNP/giphy.gif";
    setTimeout(() => {
        wrapper.style.display = "none";
        retoFlags.style.display = "flex";
    }, 1500);
});

noBtn.addEventListener("mouseover", () => {
    if (!isMobile) {
        moveNoButton();
    }
});

noBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    moveNoButton();
});

function moveNoButton() {
    const noBtnRect = noBtn.getBoundingClientRect();
    const maxX = window.innerWidth - noBtnRect.width;
    const maxY = window.innerHeight - noBtnRect.height;
    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);
    noBtn.style.left = randomX + "px";
    noBtn.style.top = randomY + "px";
}

// === 4. VALIDACIÓN DE FLAGS ===
const flagInput1 = document.getElementById("flag1");
const flagInput2 = document.getElementById("flag2");
const flagInput3 = document.getElementById("flag3");
const verificarBtn = document.getElementById("verificar-flags");
const flagError = document.getElementById("flag-error");

const FLAG_CORRECTA1 = "FLAG1{sudo_put_you_in_my_heart}";
const FLAG_CORRECTA2 = "FLAG2{grep_-r_amor_/dev/gaby}";
const FLAG_CORRECTA3 = "FLAG3{echo_te_amo_>_forever.txt}";

verificarBtn.addEventListener("click", () => {
    const f1 = flagInput1.value.trim();
    const f2 = flagInput2.value.trim();
    const f3 = flagInput3.value.trim();

    if (f1 === FLAG_CORRECTA1 && f2 === FLAG_CORRECTA2 && f3 === FLAG_CORRECTA3) {
        flagError.style.display = "none";
        retoFlags.style.display = "none";
        if (mensajeSecreto) {
            mensajeSecreto.textContent = SECRETOS.MENSAJE;
        }
        successCard.style.display = "flex";
        spawnButterflySwarm(30);
    } else {
        flagError.style.display = "block";
    }
});

// === 5. FUNCIÓN PARA MARIPOSAS ALEATORIAS ===
function spawnButterflySwarm(count = 30) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const butterfly = document.createElement('div');
            butterfly.className = 'butterfly';
            const spriteIndex = Math.floor(Math.random() * 4);
            butterfly.style.backgroundPosition = `-${spriteIndex * 32}px 0px`;
            
            const side = Math.floor(Math.random() * 4);
            let startX, startY;
            
            switch(side) {
                case 0: startX = Math.random() * window.innerWidth; startY = -50; break;
                case 1: startX = window.innerWidth + 50; startY = Math.random() * window.innerHeight; break;
                case 2: startX = Math.random() * window.innerWidth; startY = window.innerHeight + 50; break;
                case 3: startX = -50; startY = Math.random() * window.innerHeight; break;
            }
            
            butterfly.style.left = startX + 'px';
            butterfly.style.top = startY + 'px';
            
            const targetX = window.innerWidth / 2 + (Math.random() - 0.5) * 300;
            const targetY = window.innerHeight / 2 + (Math.random() - 0.5) * 300;
            const dx = targetX - startX;
            const dy = targetY - startY;
            const angle = Math.atan2(dy, dx);
            const speed = 3 + Math.random() * 4;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            document.body.appendChild(butterfly);
            
            let x = startX;
            let y = startY;
            let life = 0;
            
            const animate = () => {
                life += 0.02;
                x += vx;
                y += vy;
                
                butterfly.style.left = x + 'px';
                butterfly.style.top = y + 'px';
                butterfly.style.opacity = 1 - life * 0.8;
                butterfly.style.transform = `rotate(${Math.sin(life * 10) * 0.2 + angle}rad)`;
                
                if (life < 1.2 && x > -100 && x < window.innerWidth + 100 && y > -100 && y < window.innerHeight + 100) {
                    requestAnimationFrame(animate);
                } else {
                    butterfly.remove();
                }
            };
            
            animate();
        }, i * 80);
    }
}

// === 6. BOTÓN CONTINUAR ===
continuarBtn.addEventListener("click", () => {
    successCard.style.display = "none";
    retosBuscaminas.style.display = "flex";
});

continuarBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    successCard.style.display = "none";
    retosBuscaminas.style.display = "flex";
});

// === 7. LÓGICA DEL BUSCAMINAS ===
const BOARD_SIZE = 10;
const MINES = 18;
let board = [], revealed = [], flags = [], gameOver = false, flagMode = false;
let comboCount = 0;
let fallos = 0;
let streak = 0;
let longPressTimer = null; 

const GIFS = {
    COMBO: [
        { url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBseGNtdHA2b2d2Y2swYWFvNHAxbWIwc2hxZWtwcDA1YjNxMDYyOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Mscw2tH9hcAne/giphy.gif", msg: "¡Combo Ninja! 🍥" },
        { url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbWhxYmhwbGlxcTExYWx4NmJqend2aXU3OG9wbzFuYmY1YnI2emViciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BzJsxLoe112BW/giphy.gif", msg: "¡Rasengan! 🌀" },
        { url: "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bmVhZmUwd2hwc202YzFuenZ3NWUyMXlrZnF2ZmRhc3d4dGpweWc3ZSZlcD12MV9naWZzX3JlbGF0ZWQmY3Q9Zw/eemPC4yhITcTm/giphy.gif", msg: "¡Modo Sabio! 🔥" },
        { url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBseGNtdHA2b2d2Y2swYWFvNHAxbWIwc2hxZWtwcDA1YjNxMDYyOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Nzz86dByLtYTS/giphy.gif", msg: "¡Pein!" }
    ],
    FALLO: [
        { url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTBseGNtdHA2b2d2Y2swYWFvNHAxbWIwc2hxZWtwcDA1YjNxMDYyOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/w7CP59oLYw6PK/giphy.gif", msg: "¡Oops! 💥" },
        { url: "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZmxrajkweHhxZHpoNjhvc2E1b3pzdTk1aHR5YWNwbDRwb3Z0ajZiciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Do5GRTYRIhSFy/giphy.gif", msg: "¡Qué mal! " }
    ]
};

function showGif(type, level = 0) {
    let gifData;
    if (type === 'combo') {
        const index = Math.min(level, GIFS.COMBO.length - 1);
        gifData = GIFS.COMBO[index];
    } else {
        const randomIndex = Math.floor(Math.random() * GIFS.FALLO.length);
        gifData = GIFS.FALLO[randomIndex];
    }
    
    narutoGif.src = gifData.url;
    gifMessage.textContent = gifData.msg;
    gifOverlay.style.display = 'block';
    
    setTimeout(() => {
        gifOverlay.style.display = 'none';
    }, 2000);
}

function initBoard() {
    board = []; revealed = []; flags = []; gameOver = false; flagMode = false;
    comboCount = 0; fallos = 0; streak = 0;
    
    document.getElementById('combo-counter').textContent = '💜 0 Corazones Ninja';
    document.getElementById('fallos-counter').textContent = '💣 0 / 4 Fallos';
    document.getElementById('combo-streak').textContent = '⚡ Racha: 0';
    document.getElementById('flag-mode').textContent = 'Marcar';
    gifOverlay.style.display = 'none';
    
    for(let i = 0; i < BOARD_SIZE; i++) {
        board[i] = []; revealed[i] = []; flags[i] = [];
        for(let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = 0; revealed[i][j] = false; flags[i][j] = false;
        }
    }
    
    placeMines();
    calculateNumbers();
    renderBoard();
}

function placeMines() {
    let placed = 0;
    while(placed < MINES) {
        let r = Math.floor(Math.random() * BOARD_SIZE);
        let c = Math.floor(Math.random() * BOARD_SIZE);
        if(board[r][c] !== -1) {
            board[r][c] = -1;
            placed++;
        }
    }
}

function calculateNumbers() {
    for(let i = 0; i < BOARD_SIZE; i++)
        for(let j = 0; j < BOARD_SIZE; j++)
            if(board[i][j] !== -1)
                board[i][j] = countMines(i, j);
}

function countMines(r, c) {
    let count = 0;
    for(let dr = -1; dr <= 1; dr++)
        for(let dc = -1; dc <= 1; dc++) {
            let nr = r + dr, nc = c + dc;
            if(nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === -1)
                count++;
        }
    return count;
}

function renderBoard() {
    const boardEl = document.getElementById('game-board');
    boardEl.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
    boardEl.innerHTML = '';
    
    for(let i = 0; i < BOARD_SIZE; i++) {
        for(let j = 0; j < BOARD_SIZE; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            if (isMobile) {
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    longPressTimer = setTimeout(() => {
                        handleRightClick(i, j);
                        longPressTimer = null;
                    }, 500); 
                });
                
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        handleClick(i, j);
                    }
                });
                
                cell.addEventListener('touchcancel', () => {
                    if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                    }
                });
            } else {
                cell.onclick = () => handleClick(i, j);
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    handleRightClick(i, j);
                    return false;
                };
            }
            
            boardEl.appendChild(cell);
        }
    }
}
// === TU FUNCIÓN CORREGIDA ===
// === FUNCIÓN DE DERROTA ACTUALIZADA (IGUAL A LA IMAGEN) ===
function mostrarMensajeDerrota() {
    const derrotaOverlay = document.createElement('div');
    derrotaOverlay.id = 'derrota-overlay';
    // Estilos del fondo oscuro con desenfoque
    derrotaOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(8px);
    `;
    
    derrotaOverlay.innerHTML = `
        <div style="
            background: white;
            padding: 35px 20px;
            border-radius: 40px;
            text-align: center;
            max-width: 450px;
            width: 90%;
            border: 5px solid #ff6b35;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        ">
            <h2 style="font-size: 3rem; color: #ff1744; margin-bottom: 10px; font-family: 'Dancing Script', cursive;">💥 ¡BUUUM! 💥</h2>
            <p style="font-size: 1.8rem; color: #4a1b5c; margin-bottom: 5px; font-family: 'Dancing Script', cursive;">
                Pisaste 4 minas...
            </p>
            <p style="font-size: 1.6rem; color: #4a1b5c; margin-bottom: 25px; font-family: 'Dancing Script', cursive;">
                Pero no te preocupes, amor
            </p>
            
            <div style="
                display: flex;
                flex-direction: row; 
                justify-content: center;
                align-items: center;
                gap: 12px;
                width: 100%;
                margin: 10px 0;
            ">
                <button id="reintentar-btn" style="
                    flex: 1;
                    position: relative;
                    background: #ff80ab;
                    color: white;
                    border: none;
                    padding: 12px 5px;
                    font-size: 1.3rem;
                    border-radius: 50px;
                    cursor: pointer;
                    font-family: 'Dancing Script', cursive;
                    font-weight: bold;
                    box-shadow: 0 4px 10px rgba(255,128,171,0.4);
                    transition: transform 0.2s;
                    white-space: nowrap;
                    width: auto;
                    height: auto;
                    left: auto;
                    margin: 0;
                ">🔄 Reintentar</button>
                
                <button id="ir-final-btn" style="
                    flex: 1;
                    position: relative;
                    background: #8a2be2;
                    color: white;
                    border: none;
                    padding: 12px 5px;
                    font-size: 1.3rem;
                    border-radius: 50px;
                    cursor: pointer;
                    font-family: 'Dancing Script', cursive;
                    font-weight: bold;
                    box-shadow: 0 4px 10px rgba(138,43,226,0.4);
                    transition: transform 0.2s;
                    white-space: nowrap;
                    width: auto;
                    height: auto;
                    left: auto;
                    margin: 0;
                ">💜 Ir al final</button>
            </div>
            
            <p style="font-size: 1.1rem; color: #888; margin-top: 20px; font-family: 'Dancing Script', cursive;">
                (Puedes seguir intentando o ver la sorpresa)
            </p>
        </div>
    `;
    
    document.body.appendChild(derrotaOverlay);
    
    // Configuración de botones
    document.getElementById('reintentar-btn').onclick = () => {
        derrotaOverlay.remove();
        initBoard(); 
    };
    
    document.getElementById('ir-final-btn').onclick = () => {
        derrotaOverlay.remove();
        showFinalRedirect();
    };
    
    if (typeof spawnButterflySwarm === "function") spawnButterflySwarm(15);
}

// === FUNCIÓN HANDLECLICK CORREGIDA (CON 4 FALLOS) ===
function handleClick(r, c) {
    if (flagMode) {
        handleRightClick(r, c);
        return;
    }
    
    if(gameOver || flags[r][c] || revealed[r][c]) return;
    
    if(board[r][c] === -1) {
        revealMine(r, c);
        fallos++;
        document.getElementById('fallos-counter').textContent = `💣 ${fallos} / 4 Fallos`;
        spawnButterflyBurst(r * 38 + 120, c * 38 + 200, 5);
        showGif('fallo');
        streak = 0;
        document.getElementById('combo-streak').textContent = '⚡ Racha: 0';
        
        if (fallos >= 4) {
            gameOver = true;
            mostrarMensajeDerrota();
        }
        return;
    }
    
    revealCell(r, c);
    spawnButterflyBurst(r * 38 + 120, c * 38 + 200, 3);
    
    comboCount++;
    streak++;
    updateCombo();
    
    if (streak >= 8) showGif('combo', 3);
    else if (streak >= 5) showGif('combo', 2);
    else if (streak >= 3) showGif('combo', 1);
    else if (streak >= 1) showGif('combo', 0);
    
    document.getElementById('combo-streak').textContent = `⚡ Racha: ${streak}`;
    
    if(checkWin()) showFinalRedirect();
}

function handleRightClick(r, c) {
    if(revealed[r][c] || gameOver) return;
    
    flags[r][c] = !flags[r][c];
    
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
        if (flags[r][c]) {
            cell.classList.add('flagged');
            cell.textContent = '';
        } else {
            cell.classList.remove('flagged');
        }
    }
    
    if(flags[r][c] && board[r][c] === -1) {
        spawnButterflyBurst(r * 38 + 120, c * 38 + 200, 6);
        comboCount += 2;
        updateCombo();
        
        streak++;
        document.getElementById('combo-streak').textContent = `⚡ Racha: ${streak}`;
        showGif('combo', 1);
    }
}

function revealMine(r, c) {
    if (revealed[r][c]) return;
    revealed[r][c] = true;
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
        cell.classList.add('mine');
        cell.classList.remove('flagged');
    }
}

function revealCell(r, c) {
    if(r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE || 
       revealed[r][c] || flags[r][c]) return;
       
    revealed[r][c] = true;
    const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
    if (cell) {
        cell.classList.add('revealed');
        cell.classList.remove('flagged');
        
        if(board[r][c] > 0) {
            cell.textContent = board[r][c];
        } else {
            cell.textContent = '';
        }
    }
    
    if(board[r][c] === 0) {
        for(let dr = -1; dr <= 1; dr++)
            for(let dc = -1; dc <= 1; dc++)
                revealCell(r + dr, c + dc);
    }
}

function checkWin() {
    let revealedCount = 0;
    for(let i = 0; i < BOARD_SIZE; i++)
        for(let j = 0; j < BOARD_SIZE; j++)
            if(revealed[i][j]) revealedCount++;
    return revealedCount === BOARD_SIZE * BOARD_SIZE - MINES;
}

function spawnButterflyBurst(x, y, count = 8) {
    for(let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'butterfly burst';
        const spriteIndex = Math.floor(Math.random() * 4);
        el.style.backgroundPosition = `-${spriteIndex * 32}px 0px`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed * -0.7;
        
        let life = 0;
        const anim = () => {
            life += 0.08;
            el.style.left = `${parseFloat(el.style.left) + vx}px`;
            el.style.top = `${parseFloat(el.style.top) + vy}px`;
            el.style.opacity = 1 - life;
            el.style.transform = `rotate(${life * 20}rad) scale(${1-life * 0.5})`;
            
            if(life < 1.2) requestAnimationFrame(anim);
            else el.remove();
        };
        anim();
    }
}

function updateCombo() {
    document.getElementById('combo-counter').textContent = `💜 ${comboCount} Corazones Ninja`;
}

function newGame() { initBoard(); }

function toggleFlagMode() {
    flagMode = !flagMode;
    const flagModeSpan = document.getElementById('flag-mode');
    if (flagModeSpan) {
        flagModeSpan.textContent = flagMode ? 'Abrir' : 'Marcar';
    }
    
    const btn = document.querySelector('[onclick="toggleFlagMode()"]');
    if (btn) {
        btn.style.background = flagMode ? '#ff80ab' : '#ff99bb';
    }
}

// === 8. REDIRECCIÓN FINAL ===
function showFinalRedirect() {
    retosBuscaminas.style.display = 'none';
    successMessage.style.display = 'flex';

    const mensajeFinal = document.querySelector('#success-message .card-content p');
    if (mensajeFinal) {
        mensajeFinal.innerHTML = '✨ ¡Lo lograste! ✨';
    }
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            spawnButterflySwarm(40); 
        }, i * 500);
    }
  
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            spawnButterflyBurst(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                5
            );
        }, i * 100);
    }
    
    setTimeout(() => {
        window.location.href = 'gaby.html';
    }, 3000);
}

// === 9. INICIALIZACIÓN ===
initBoard();

// Exponer funciones globales
window.newGame = newGame;
window.toggleFlagMode = toggleFlagMode;

// === ANIMACIÓN POPIN (agregar al CSS) ===
const style = document.createElement('style');
style.textContent = `
    @keyframes popIn {
        0% { transform: scale(0.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    #reintentar-btn:hover, #ir-final-btn:hover {
        transform: scale(1.1);
    }
    #reintentar-btn:hover {
        background: #ff99bb !important;
    }
    #ir-final-btn:hover {
        background: #9b3cf3 !important;
    }
`;
document.head.appendChild(style);