// Contenedor principal de la terminal
const terminal = document.getElementById("terminalContent");

// Número de posts desde data-attribute, convertido a número
const postCount = parseInt(document.getElementById("postCount").dataset.count, 10) || 0;

// Velocidades de animación
const commandSpeed = 70; 
const outputSpeed = 20;  

// Array de comandos y outputs
const session = [
  {
    command: "necrot -h",
  output: `___________________________________________________________________________
--     _____  ___    _______   ______    _______     ______  ___________ --
--    (\"   \\|"  \\  /" __   ) /" _  "\\  /"      \\   /    " \\("     _   ") --
--    |.\\   \\    |(__/ _) ./(: ( \\___)|:        | // ____  \\)__/  \\\\__/  --
--    |: \\.   \\\\  |    /  //  \\/ \\     |_____/   )/  /    ) :)  \\\\_ /    --  
--    |.  \\    \\. | __ \\_ \\\\  //  \\ _   //      /(: (____/ //   |.  |    -- 
--    |    \\    \\ |(: \\__) :\\(:   _) \\ |:  __   \\ \\        /    \\:  |    --   
--     \\___|\\____\\) \\_______) \\_______)|__|  \\___) \\"_____/      \\__|    --   
___________________________________________________________________________

Usage: necrot [options] 
  -l, --less[file]      analyze file
  --hashfile [file]     load password hashes
  -c, --crack [file]    crack target file 
  --wordlist            specify wordlist for cracking
  --report              generate analysis report
  -h, --help            show this help message
`,
    instant: true 
  },
  {
    command: "necrot -l p4r4_data.7z",
    output: `[*] preview from p4r4_data.7z ...
[*] Indexing entries... done
[*] Extracting metadata... done
[*] Generating preview table
[+] Preview complete: ${postCount} records listed`
  }
];

// Función para escribir comando con prompt dinámico
function typeCommand(commandText, callback) {
  const p = document.createElement("p");
  p.className = "prompt";
  p.innerHTML = `<span class="user">root@p4r4$it3</span>:~<span class="prompt-symbol">#</span> <span class="tool"></span>`;
  terminal.appendChild(p);

  const toolSpan = p.querySelector(".tool");
  let i = 0;

  function typeChar() {
    if (i < commandText.length) {
      toolSpan.textContent += commandText[i];
      i++;
      setTimeout(typeChar, commandSpeed);
    } else {
      callback && callback();
    }
  }

  typeChar();
}

// Función para escribir salida tipo log 
function typeOutput(outputText, callback) {
  const pre = document.createElement("pre");
  pre.className = "status-message";
  terminal.appendChild(pre);

  let i = 0;

  function typeChar() {
    if (i < outputText.length) {
      pre.textContent += outputText[i];
      i++;
      terminal.scrollTop = terminal.scrollHeight; 
      setTimeout(typeChar, outputSpeed);
    } else {
      callback && callback();
    }
  }

  typeChar();
}

// Ejecutar sesión completa de comandos
function runSession(commands) {
  if (!commands.length) return;

  const { command, output, instant } = commands.shift();

  typeCommand(command, () => {
    if (instant) {
      const pre = document.createElement("pre");
      pre.className = "status-message";
      pre.textContent = output;
      terminal.appendChild(pre);
      terminal.scrollTop = terminal.scrollHeight;
      runSession(commands);
    } else {
      typeOutput(output, () => {
        // Mostrar tabla al final de la sesión
        if (!commands.length) {
          initPostsTable();
        }
        runSession(commands);
      });
    }
  });
}

function initPostsTable() {
  const postsTable = document.getElementById("postsTable");
  const loadMoreBtnRow = document.getElementById("loadMoreBtnRow");

  if (!postsTable || !loadMoreBtnRow) return;

  const rows = postsTable.querySelectorAll("tbody tr:not(#loadMoreBtnRow)");
  let visibleCount = 4;

  // Mostrar primeros 4
  rows.forEach((row, index) => {
    row.style.display = index < visibleCount ? "" : "none";
  });

  postsTable.style.display = "table";

  // Mostrar fila "Ver más" si hay posts ocultos
  const totalVisible = rows.length;
  loadMoreBtnRow.style.display = totalVisible > visibleCount ? "" : "none";

  // Evento click
  loadMoreBtnRow.addEventListener("click", () => {
    rows.forEach(row => row.style.display = "");   
    loadMoreBtnRow.style.display = "none";        
  });
}

// Iniciar animación 
document.addEventListener("DOMContentLoaded", () => {
  runSession([...session]); 
});
