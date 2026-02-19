document.addEventListener("DOMContentLoaded", () => {
  // Mostrar directamente el contenido del post
  const postContent = document.getElementById("postContent");
  if (postContent) {
    postContent.style.display = "block";
  }

  // Reemplazo de enlaces de YouTube - optimizado con mejor regex
  const content = document.querySelector(".post-content");
  if (content) {
    const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)([a-zA-Z0-9_-]+)/g;
    let html = content.innerHTML;
    if (youtubeRegex.test(html)) {
      html = html.replace(youtubeRegex, (match, videoId) => {
        return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      });
      content.innerHTML = html;
    }
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
      }).catch(() => {
        button.textContent = "[ERR]";
        setTimeout(() => (button.textContent = "📋"), 2000);
      });
    });
  });
});
