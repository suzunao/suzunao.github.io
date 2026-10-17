(function () {
  'use strict';

  const navItems = document.querySelectorAll('.hk-nav-item');
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentNav = currentPath === '/'
    ? 'home'
    : currentPath === '/about'
      ? 'about'
      : currentPath === '/posts' || currentPath.startsWith('/post/')
        ? 'posts'
        : '';

  navItems.forEach((item) => {
    const active = item.dataset.nav === currentNav;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });

  const hamburger = document.querySelector('[data-hamburger]');
  const drawer = document.querySelector('.hk-sidebar');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const mobileLayout = window.matchMedia('(max-width: 800px)');

  function setDrawerOpen(open) {
    if (!drawer || !mobileLayout.matches) return;
    drawer.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    hamburger?.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (drawer) drawer.setAttribute('aria-hidden', String(mobileLayout.matches));
  hamburger?.addEventListener('click', () => setDrawerOpen(!drawer?.classList.contains('open')));
  backdrop?.addEventListener('click', () => setDrawerOpen(false));
  drawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setDrawerOpen(false));
  });
  mobileLayout.addEventListener('change', () => {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    if (drawer) drawer.setAttribute('aria-hidden', String(mobileLayout.matches));
    document.body.style.overflow = '';
  });

  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  let postsData = [];
  const dataEl = document.getElementById('hk-posts-data');
  if (dataEl) {
    try {
      postsData = JSON.parse(dataEl.textContent || '[]');
    } catch (error) {
      console.error('No se pudo leer el índice de búsqueda del blog.', error);
    }
  }

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      searchResults.replaceChildren();
      if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
      }

      const matches = postsData.filter((post) =>
        String(post.title || '').toLowerCase().includes(query)
        || (post.tags || []).some((tag) => String(tag).toLowerCase().includes(query))
      ).slice(0, 5);

      searchResults.style.display = 'block';
      if (matches.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'hk-search-empty';
        empty.textContent = `Sin resultados para "${query}"`;
        searchResults.appendChild(empty);
        return;
      }

      matches.forEach((post) => {
        const result = document.createElement('div');
        result.className = 'hk-search-result';
        const link = document.createElement('a');
        link.href = post.url;
        link.textContent = post.title || 'Sin título';
        result.appendChild(link);
        searchResults.appendChild(result);
      });
    });
  }

  document.querySelectorAll('.hk-post-content pre').forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code || pre.querySelector('[data-copy-btn]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hk-copy-btn';
    button.setAttribute('data-copy-btn', '');
    button.setAttribute('aria-label', 'Copiar código');
    button.textContent = navigator.clipboard?.writeText ? 'Copiar' : 'No disponible';
    button.disabled = !navigator.clipboard?.writeText;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        button.classList.add('copied');
        button.textContent = 'Copiado';
        window.setTimeout(() => {
          button.classList.remove('copied');
          button.textContent = 'Copiar';
        }, 1800);
      } catch (error) {
        console.error('No se pudo copiar el bloque de código.', error);
        button.textContent = 'Error';
      }
    });
    pre.appendChild(button);
  });

  const uptime = document.querySelector('[data-uptime]');
  if (uptime) {
    const startedAt = Date.now();
    window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const pad = (value) => String(value).padStart(2, '0');
      uptime.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }, 1000);
  }

  const toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const shortcuts = { '1': 'home', '2': 'posts', '3': 'about' };
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
    if (event.key === 'Escape') setDrawerOpen(false);
    if (shortcuts[event.key]) {
      const link = document.querySelector(`.hk-nav-item[data-nav="${shortcuts[event.key]}"]`);
      if (link instanceof HTMLAnchorElement) window.location.assign(link.href);
    }
  });
})();
