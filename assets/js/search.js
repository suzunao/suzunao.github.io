document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');
  const posts = JSON.parse(document.getElementById('posts-data').textContent);

  const performSearch = (query) => {
    resultsContainer.innerHTML = '';
    query = query.toLowerCase().trim();

    if (query.length < 1) {
      resultsContainer.style.display = 'none'; 
      return;
    }

    const results = posts.filter(post => {
      const titleMatch = post.title.toLowerCase().includes(query);
      const tagMatch = post.tags && post.tags.some(tag => `#${tag.toLowerCase()}`.includes(query));
      return titleMatch || tagMatch;
    });

    if (results.length > 0) {
      results.forEach(post => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result';
        resultItem.innerHTML = `
          <a href="${post.url}">
            <strong>${post.title}</strong>
            ${post.tags ? `<div class="tags">${post.tags.map(tag => `<span>#${tag}</span>`).join('')}</div>` : ''}
          </a>
        `;
        resultsContainer.appendChild(resultItem);
      });
      resultsContainer.style.display = 'block'; 
    } else {
      resultsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
      resultsContainer.style.display = 'block'; 
    }
  };


  searchInput.addEventListener('input', e => performSearch(e.target.value));
});
