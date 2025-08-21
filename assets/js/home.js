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
    command: "necrot-log -h",
    output: `
______________________________________________________________________________________
--           ________               _______   __            .__  _______            --
--      ____ \\_____  \\  ___________ \\   _  \\_/  |_          |  | \\   _  \\    ____   --
--     /    \\  _(__  <_/ ___\\_  __ \\/  /_\\  \\   __\\  ______ |  | /  /_\\  \\  / ___\\  --
--    |   |  \\/       \\  \\___|  | \\/\\  \\_/   \\  |   /_____/ |  |_\\  \\_/   \\/ /_/  > --
--    |___|  /______  /\\___  >__|    \\_____  /__|           |____/\\_____  /\\___  /  --
--         \\/       \\/     \\/              \\/                           \\//_____/   --
______________________________________________________________________________________
Usage: n3cr0t-log [options] 
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
    command: "necrot-log -l p4r4_data.7z",
    output: `[*] preview from p4r4_data.7z ...
[*] Indexing entries... done
[*] Extracting metadata... done
[*] Generating preview table
[+] Preview complete: 4/${postCount} records listed`
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
          const postsTable = document.getElementById("postsTable");
          if (postsTable) postsTable.style.display = "table";
        }
        runSession(commands);
      });
    }
  });
}

// Iniciar animación 
document.addEventListener("DOMContentLoaded", () => {
  runSession([...session]); 
});
