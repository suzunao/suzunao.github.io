document.addEventListener("DOMContentLoaded", () => {
  // Mostrar directamente el contenido del post
  const postContent = document.getElementById("postContent");
  if (postContent) {
    postContent.style.display = "block";
  }

  // Reemplazo de enlaces de YouTube
  const content = document.querySelector(".post-content");
  if (content) {
    content.innerHTML = content.innerHTML
      .replace(
        /(https?:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))/g,
        `<div class="video-container">
           <iframe src="https://www.youtube.com/embed/$2"
                   frameborder="0"
                   allowfullscreen></iframe>
         </div>`
      )
      .replace(
        /(https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+))/g,
        `<div class="video-container">
           <iframe src="https://www.youtube.com/embed/$2"
                   frameborder="0"
                   allowfullscreen></iframe>
         </div>`
      );
  }

  // Botón para copiar bloques de código
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach(pre => {
    if (pre.querySelector(".copy-button")) return;
    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "📋";
    pre.style.position = "relative";
    pre.appendChild(button);

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
