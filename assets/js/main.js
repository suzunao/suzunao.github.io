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

  // === TYPEWRITER EFFECT FOR WELCOME TERMINAL ===
  const terminalBody = document.getElementById('terminalBody');
  if (terminalBody) {
    const commands = [
      { text: 'cat /var/www/about.txt', output: 'Bienvenido a mi portal de seguridad', isHtml: false },
      { text: 'ls -la ~/skills/', output: '<span class="skill-tag">Penetration Testing</span><span class="skill-tag">Reverse Engineering</span><span class="skill-tag">Malware Analysis</span><span class="skill-tag">CTF</span>', isHtml: true }
    ];

    let delay = 500;

    commands.forEach((cmd, index) => {
      setTimeout(() => {
        // Create command line
        const commandLine = document.createElement('div');
        commandLine.className = 'command-line';
        
        const prompt = document.createElement('span');
        prompt.className = 'prompt-symbol';
        prompt.textContent = '$ ';
        
        const commandSpan = document.createElement('span');
        commandSpan.className = 'command';
        
        commandLine.appendChild(prompt);
        commandLine.appendChild(commandSpan);
        terminalBody.appendChild(commandLine);
        
        // Typewriter effect
        let charIndex = 0;
        const typeInterval = setInterval(() => {
          if (charIndex < cmd.text.length) {
            commandSpan.textContent += cmd.text.charAt(charIndex);
            charIndex++;
          } else {
            clearInterval(typeInterval);
            
            // Add output after command is typed
            setTimeout(() => {
              const output = document.createElement('p');
              output.className = 'output';
              if (cmd.isHtml) {
                output.innerHTML = cmd.output;
              } else {
                output.textContent = cmd.output;
              }
              terminalBody.appendChild(output);
              
              // Add cursor at the end
              if (index === commands.length - 1) {
                const cursorLine = document.createElement('p');
                cursorLine.className = 'cursor-line';
                cursorLine.innerHTML = '<span class="cursor-blink">▋</span>';
                terminalBody.appendChild(cursorLine);
              }
            }, 300);
          }
        }, 80);
        
      }, delay);
      delay += cmd.text.length * 80 + 800;
    });
  }

  // === MOBILE MENU ===
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
    });

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
    const postsDataElement = document.getElementById('posts-data');
    if (postsDataElement) {
      const posts = JSON.parse(postsDataElement.textContent);
      
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

  // === TAG FILTERING IN POSTS ===
  const postTagElements = document.querySelectorAll('.post-card .tag');
  postTagElements.forEach(tagEl => {
    tagEl.style.cursor = 'pointer';
    tagEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const tagText = tagEl.getAttribute('data-tag');
      filterPostsByTag(tagText);
    });
  });

  function filterPostsByTag(tag) {
    const postCards = document.querySelectorAll('.post-card');
    postCards.forEach(card => {
      const cardTags = Array.from(card.querySelectorAll('.tag')).map(t => t.getAttribute('data-tag'));
      if (cardTags.includes(tag)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Add click handlers to tag pills in the sidebar for future category filtering
  const navPostsLink = document.getElementById('nav-posts');
  if (navPostsLink) {
    navPostsLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll to posts section
      const postsSection = document.getElementById('posts');
      if (postsSection) {
        postsSection.scrollIntoView({ behavior: 'smooth' });
      }
      // Show all posts when clicking "Artículos"
      const postCards = document.querySelectorAll('.post-card');
      postCards.forEach(card => {
        card.style.display = '';
      });
    });
  }
});
