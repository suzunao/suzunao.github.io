const menuBtn = document.getElementById('menu-btn');
const searchBtn = document.getElementById('search-btn');
const menu = document.getElementById('menu');
const search = document.getElementById('search');

// Inicialmente ocultos
menu.style.display = 'none';
search.style.display = 'none';

menuBtn.addEventListener('click', () => {
  const isVisible = menu.style.display === 'block';
  menu.style.display = isVisible ? 'none' : 'block';
  search.style.display = 'none';
});

searchBtn.addEventListener('click', () => {
  const isVisible = search.style.display === 'block';
  search.style.display = isVisible ? 'none' : 'block';
  menu.style.display = 'none';
});

// Opcional: cerrar > clic fuera
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target) && !menuBtn.contains(e.target)) menu.style.display = 'none';
  if (!search.contains(e.target) && !searchBtn.contains(e.target)) search.style.display = 'none';
});

