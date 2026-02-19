document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const posts = JSON.parse(document.getElementById('posts-data').textContent);

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const performSearch = debounce((query) => {
    resultsContainer.innerHTML = '';
    query = query.toLowerCase().trim();

    if (query.length < 2) {
      resultsContainer.style.display = 'none'; 
      return;
    }

    const results = posts.filter(post => 
      post.title.toLowerCase().includes(query) || 
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
    );

    if (results.length > 0) {
      const fragment = document.createDocumentFragment();
      results.forEach(post => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result';
        resultItem.innerHTML = `
          <a href="${post.url}">
            <strong>${post.title}</strong>
            ${post.tags ? `<div class="tags">${post.tags.map(tag => `<span>#${tag}</span>`).join('')}</div>` : ''}
          </a>
        `;
        fragment.appendChild(resultItem);
      });
      resultsContainer.appendChild(fragment);
      resultsContainer.style.display = 'block'; 
    } else {
      resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
      resultsContainer.style.display = 'block'; 
    }
  }, 200);
  
  if (searchInput) searchInput.addEventListener('input', e => performSearch(e.target.value));
});
