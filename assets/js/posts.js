document.addEventListener("DOMContentLoaded", () => {
  // Mostrar contenido del post
  const postContent = document.getElementById("postContent");
  if (postContent) postContent.style.display = "block";

  // Reemplazo de enlaces de YouTube
  const content = document.querySelector(".post-content");
  if (content) {
    const youtubeRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const html = content.innerHTML;
    // Usar .test() solo para detectar, sin flag /g (que es stateful y causa
    // falsos negativos entre llamadas). El reemplazo sí usa regex con /g local.
    if (youtubeRegex.test(html)) {
      const replaceRegex = /(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)([a-zA-Z0-9_-]+)/g;
      const newHtml = html.replace(replaceRegex, (match, videoId) =>
        `<div class="video-container"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="Video de YouTube" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      );
      if (newHtml !== html) content.innerHTML = newHtml;
    }
  }

  // Botón copiar código
  document.querySelectorAll("pre").forEach(pre => {
    if (pre.querySelector(".copy-button")) return;
    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "📋";
    pre.style.position = "relative";
    pre.appendChild(button);

    button.addEventListener("click", () => {
      const code = pre.querySelector("code");
      if (!code) return;
      navigator.clipboard.writeText(code.innerText)
        .then(() => {
          button.textContent = "[OK]";
          setTimeout(() => button.textContent = "📋", 2000);
        })
        .catch(() => {
          button.textContent = "[ERR]";
          setTimeout(() => button.textContent = "📋", 2000);
        });
    });
  });
});
