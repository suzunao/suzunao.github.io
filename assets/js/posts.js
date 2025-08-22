document.addEventListener("DOMContentLoaded", () => {
  const terminal = document.getElementById("terminalContent");
  const postDate = document.getElementById("postDate").dataset.date;
  const postTitle = document.getElementById("postTitle").dataset.title;

  const session = [
    {
      command: `necrot -c ${postDate}.log --hashfile hash.txt --wordlist rockyou.txt`,
      output: `[*] Parsing ${postDate}.log ... done
[*] Loading hashes from hash.txt ... done
[*] Using wordlist rockyou.txt ... 
[*] Cracked → Access granted to post: "${postTitle}"`
    }
  ];

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
        setTimeout(typeChar, 40);
      } else {
        callback && callback();
      }
    }

    typeChar();
  }

  function typeOutput(outputText, callback) {
    const pre = document.createElement("pre");
    pre.className = "status-message";
    terminal.appendChild(pre);

    let i = 0;
    function typeChar() {
      if (i < outputText.length) {
        pre.textContent += outputText[i];
        i++;
        setTimeout(typeChar, 5);
      } else {
        callback && callback();
      }
    }

    typeChar();
  }

  function runSession(commands) {
    if (!commands.length) return;

    const { command, output } = commands.shift();

    typeCommand(command, () => {
      typeOutput(output, () => {
        // Limpiar  antes de mostrar el contenido
        terminal.innerHTML = "";

        // Mostrar contenido del post
        document.getElementById("postContent").style.display = "block";
        
        runSession(commands);
      });
    });
  }
  runSession([...session]);
});

document.addEventListener("DOMContentLoaded", () => {
  const content = document.querySelector(".post-content");

  if (content) {
    content.innerHTML = content.innerHTML
      // Detecta youtube.com/watch?v=ID
      .replace(
        /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g,
        `<div class="video-container">
           <iframe src="https://www.youtube.com/embed/$2"
                   frameborder="0"
                   allowfullscreen>
           </iframe>
         </div>`
      )
      // Detecta youtu.be/ID
      .replace(
        /(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+))/g,
        `<div class="video-container">
           <iframe src="https://www.youtube.com/embed/$2"
                   frameborder="0"
                   allowfullscreen>
           </iframe>
         </div>`
      );
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach(pre => {
    // Evitar duplicados 
    if (pre.querySelector(".copy-button")) return;
    // Crear el botón
    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "📋";
    // Insertar el botón dentro del <pre>
    pre.style.position = "relative"; 
    pre.appendChild(button);
    // Evento de copiar
    button.addEventListener("click", () => {
      const code = pre.querySelector("code");
      if (!code) return;
      navigator.clipboard.writeText(code.innerText).then(() => {
        button.textContent = "[OK]";
        setTimeout(() => (button.textContent = "📋"), 2000);
      });
    });
  });
});
