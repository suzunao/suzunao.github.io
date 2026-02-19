document.addEventListener('DOMContentLoaded', () => {
  // === UPTIME COUNTER ===
  const uptimeElement = document.getElementById('uptime');
  if (uptimeElement) {
    const startTime = Date.now();
    setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      uptimeElement.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // === MOBILE MENU ===
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
    });

    // Close menu when clicking a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
      });
    });
  }

  // === SIDEBAR SEARCH ===
  const searchInputSidebar = document.getElementById('search-input-sidebar');
  const searchResultsSidebar = document.getElementById('search-results-sidebar');
  
  if (searchInputSidebar && searchResultsSidebar) {
    // Get posts data from the hidden element
    const postsDataElement = document.getElementById('posts-data');
    if (postsDataElement) {
      const posts = JSON.parse(postsDataElement.textContent);
      
      // Debounce function
      const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };

      const performSearch = debounce((query) => {
        searchResultsSidebar.innerHTML = '';
        query = query.toLowerCase().trim();

        if (query.length < 2) {
          searchResultsSidebar.style.display = 'none';
          return;
        }

        const results = posts.filter(post => {
          const titleMatch = post.title.toLowerCase().includes(query);
          const tagMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(query));
          return titleMatch || tagMatch;
        });

        if (results.length > 0) {
          results.slice(0, 5).forEach(post => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result';
            resultItem.innerHTML = `<a href="${post.url}">${post.title}</a>`;
            searchResultsSidebar.appendChild(resultItem);
          });
          searchResultsSidebar.style.display = 'block';
        } else {
          searchResultsSidebar.innerHTML = '<div class="search-result">No results</div>';
          searchResultsSidebar.style.display = 'block';
        }
      }, 200);

      searchInputSidebar.addEventListener('input', e => performSearch(e.target.value));
    }
  }

  // === CATEGORY FILTERS ===
  const categoryItems = document.querySelectorAll('.nav-category');
  categoryItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      console.log('Filter by category:', category);
      // Future: implement category filtering
    });
  });
});
