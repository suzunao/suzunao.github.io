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

// Inicializar tabla al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  initPostsTable();
});
