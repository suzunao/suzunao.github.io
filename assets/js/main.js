(function () {
  'use strict';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* =========================================================
     1. Navegación activa
     ========================================================= */
  const navItems = document.querySelectorAll('.hk-nav-item');
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentNav = currentPath === '/'
    ? 'home'
    : currentPath === '/about'
      ? 'about'
      : currentPath === '/activities' || currentPath.startsWith('/activities/')
        ? 'activities'
        : currentPath === '/posts' || currentPath.startsWith('/post/') || currentPath.startsWith('/tag/')
          ? 'posts'
          : '';

  navItems.forEach((item) => {
    const active = item.dataset.nav === currentNav;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });

  /* =========================================================
     2. Cajón móvil con gestión de foco
     ========================================================= */
  const hamburger = document.querySelector('[data-hamburger]');
  const drawer = document.querySelector('.hk-sidebar');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const mobileLayout = window.matchMedia('(max-width: 800px)');

  function getDrawerFocusables() {
    if (!drawer) return [];
    return Array.from(
      drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function setDrawerOpen(open, restoreFocus) {
    if (!drawer || !mobileLayout.matches) return;
    drawer.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    hamburger?.setAttribute('aria-expanded', String(open));
    hamburger?.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      const focusables = getDrawerFocusables();
      if (focusables.length > 0) focusables[0].focus();
    } else if (restoreFocus) {
      hamburger?.focus();
    }
  }

  if (drawer) drawer.setAttribute('aria-hidden', String(mobileLayout.matches));
  hamburger?.addEventListener('click', () => {
    const willOpen = !drawer?.classList.contains('open');
    setDrawerOpen(willOpen, !willOpen);
  });
  backdrop?.addEventListener('click', () => setDrawerOpen(false, true));
  drawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setDrawerOpen(false, false));
  });

  drawer?.addEventListener('keydown', (event) => {
    if (!mobileLayout.matches || !drawer.classList.contains('open') || event.key !== 'Tab') return;
    const focusables = getDrawerFocusables();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  mobileLayout.addEventListener('change', () => {
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
    if (drawer) drawer.setAttribute('aria-hidden', String(mobileLayout.matches));
    document.body.style.overflow = '';
  });

  /* =========================================================
     3. Control de efectos CRT / Scanlines
     ========================================================= */
  const fxToggle = document.querySelector('[data-fx-toggle]');
  const fxLabel = document.querySelector('[data-fx-label]');

  function isFxEnabled() {
    return document.documentElement.getAttribute('data-fx') !== 'off';
  }

  function syncFxButton() {
    if (!fxToggle) return;
    const on = isFxEnabled();
    fxToggle.setAttribute('aria-pressed', String(on));
    if (fxLabel) fxLabel.textContent = on ? 'Efectos CRT: ON' : 'Efectos CRT: OFF';
  }

  syncFxButton();
  fxToggle?.addEventListener('click', () => {
    const nextOn = !isFxEnabled();
    if (nextOn) {
      document.documentElement.removeAttribute('data-fx');
    } else {
      document.documentElement.setAttribute('data-fx', 'off');
    }
    try {
      localStorage.setItem('hk-fx', nextOn ? 'on' : 'off');
    } catch (e) {}
    syncFxButton();
  });

  /* =========================================================
     4. Búsqueda con carga diferida (/search.json) y teclado
     ========================================================= */
  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  const searchLive = document.querySelector('[data-search-live]');

  if (searchInput && searchResults) {
    const searchUrl = searchInput.dataset.searchUrl || '/search.json';
    let indexData = null;
    let indexPromise = null;
    let activeIndex = -1;
    let currentOptions = [];

    function normalizeText(value) {
      return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }

    function announce(message) {
      if (searchLive) searchLive.textContent = message;
    }

    function openResults() {
      searchResults.hidden = false;
      searchInput.setAttribute('aria-expanded', 'true');
    }

    function closeResults() {
      searchResults.hidden = true;
      searchInput.setAttribute('aria-expanded', 'false');
      searchInput.removeAttribute('aria-activedescendant');
      activeIndex = -1;
      currentOptions = [];
    }

    function appendHighlighted(parent, text, rawQuery) {
      const source = String(text || '');
      if (!rawQuery) {
        parent.appendChild(document.createTextNode(source));
        return;
      }
      const normSource = normalizeText(source);
      const normQuery = normalizeText(rawQuery);
      if (!normQuery) {
        parent.appendChild(document.createTextNode(source));
        return;
      }

      let cursor = 0;
      let idx = normSource.indexOf(normQuery, cursor);
      while (idx !== -1) {
        if (idx > cursor) {
          parent.appendChild(document.createTextNode(source.slice(cursor, idx)));
        }
        const mark = document.createElement('mark');
        mark.className = 'hk-search-mark';
        mark.textContent = source.slice(idx, idx + rawQuery.length);
        parent.appendChild(mark);
        cursor = idx + rawQuery.length;
        idx = normSource.indexOf(normQuery, cursor);
      }
      if (cursor < source.length) {
        parent.appendChild(document.createTextNode(source.slice(cursor)));
      }
    }

    function loadSearchIndex() {
      if (indexData) return Promise.resolve(indexData);
      if (indexPromise) return indexPromise;

      indexPromise = fetch(searchUrl, { headers: { Accept: 'application/json' } })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          indexData = Array.isArray(data) ? data : [];
          return indexData;
        })
        .catch((err) => {
          indexPromise = null;
          throw err;
        });

      return indexPromise;
    }

    function setActiveOption(nextIndex) {
      if (currentOptions.length === 0) {
        activeIndex = -1;
        searchInput.removeAttribute('aria-activedescendant');
        return;
      }
      if (nextIndex < 0) nextIndex = currentOptions.length - 1;
      if (nextIndex >= currentOptions.length) nextIndex = 0;

      currentOptions.forEach((opt, idx) => {
        const selected = idx === nextIndex;
        opt.classList.toggle('is-active', selected);
        opt.setAttribute('aria-selected', String(selected));
      });
      activeIndex = nextIndex;
      const activeEl = currentOptions[activeIndex];
      searchInput.setAttribute('aria-activedescendant', activeEl.id);
      activeEl.scrollIntoView({ block: 'nearest' });
    }

    function renderLoading() {
      searchResults.replaceChildren();
      const box = document.createElement('div');
      box.className = 'hk-search-state';
      box.textContent = 'Cargando índice de búsqueda...';
      searchResults.appendChild(box);
      openResults();
    }

    function renderError() {
      searchResults.replaceChildren();
      const box = document.createElement('div');
      box.className = 'hk-search-state hk-search-state--error';
      const msg = document.createElement('p');
      msg.textContent = 'No se pudo cargar el índice de búsqueda.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'hk-search-retry';
      retry.textContent = '[Reintentar]';
      retry.addEventListener('click', () => {
        renderLoading();
        loadSearchIndex().then(() => runQuery()).catch(() => renderError());
      });
      box.append(msg, retry);
      searchResults.appendChild(box);
      openResults();
      announce('Error al cargar el índice de búsqueda.');
    }

    function runQuery() {
      const rawQuery = searchInput.value.trim();
      const query = normalizeText(rawQuery);
      searchResults.replaceChildren();
      activeIndex = -1;
      currentOptions = [];

      if (query.length < 2) {
        closeResults();
        return;
      }

      if (!indexData) {
        renderLoading();
        loadSearchIndex()
          .then(() => runQuery())
          .catch(() => renderError());
        return;
      }

      const matches = indexData.filter((item) => {
        const haystack = normalizeText([
          item.title,
          item.description,
          item.type,
          item.date,
          ...(item.tags || []),
          ...(item.tagSlugs || []),
        ].join(' '));
        return haystack.includes(query);
      });

      openResults();

      if (matches.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'hk-search-empty';
        const title = document.createElement('div');
        title.className = 'hk-search-empty-title';
        title.textContent = `[ SIN RESULTADOS ]`;
        const hint = document.createElement('div');
        hint.className = 'hk-search-empty-hint';
        hint.textContent = `No hay coincidencias para "${rawQuery}". Prueba con otra etiqueta o término.`;
        empty.append(title, hint);
        searchResults.appendChild(empty);
        announce(`Sin resultados para ${rawQuery}.`);
        return;
      }

      const summary = document.createElement('div');
      summary.className = 'hk-search-count';
      summary.textContent = matches.length === 1
        ? '1 resultado encontrado'
        : `${matches.length} resultados encontrados`;
      searchResults.appendChild(summary);
      announce(summary.textContent);

      matches.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'hk-search-result';
        row.id = `hk-search-opt-${idx}`;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', 'false');

        const link = document.createElement('a');
        link.href = item.url;
        link.tabIndex = -1;
        if (item.external) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }

        const top = document.createElement('div');
        top.className = 'hk-search-result-top';
        const badge = document.createElement('span');
        badge.className = 'hk-search-badge';
        badge.dataset.kind = item.kind || 'post';
        badge.textContent = item.type || 'Artículo';
        const dateEl = document.createElement('span');
        dateEl.className = 'hk-search-date';
        dateEl.textContent = item.date || '';
        top.append(badge, dateEl);

        const titleEl = document.createElement('div');
        titleEl.className = 'hk-search-result-title';
        appendHighlighted(titleEl, item.title || 'Sin título', rawQuery);

        link.append(top, titleEl);

        if (item.description) {
          const descEl = document.createElement('div');
          descEl.className = 'hk-search-result-desc';
          appendHighlighted(descEl, item.description.slice(0, 120), rawQuery);
          link.appendChild(descEl);
        }

        row.appendChild(link);
        row.addEventListener('mousemove', () => setActiveOption(idx));
        searchResults.appendChild(row);
        currentOptions.push(row);
      });
    }

    searchInput.addEventListener('focus', () => {
      loadSearchIndex().catch(() => {});
      if (searchInput.value.trim().length >= 2) runQuery();
    });

    searchInput.addEventListener('input', () => runQuery());

    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        if (!searchResults.hidden) {
          event.preventDefault();
          closeResults();
        } else if (searchInput.value) {
          event.preventDefault();
          searchInput.value = '';
        } else {
          searchInput.blur();
        }
        return;
      }

      if (searchResults.hidden || currentOptions.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveOption(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveOption(activeIndex <= 0 ? currentOptions.length - 1 : activeIndex - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        setActiveOption(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        setActiveOption(currentOptions.length - 1);
      } else if (event.key === 'Enter') {
        const chosen = currentOptions[activeIndex >= 0 ? activeIndex : 0];
        const link = chosen?.querySelector('a');
        if (link) {
          event.preventDefault();
          if (link.target === '_blank') {
            window.open(link.href, '_blank', 'noopener,noreferrer');
          } else {
            window.location.assign(link.href);
          }
        }
      }
    });

    document.addEventListener('click', (event) => {
      if (!searchInput.closest('.hk-search')?.contains(event.target)) {
        closeResults();
      }
    });
  }

  /* =========================================================
     5. Botón copiar en bloques de código
     ========================================================= */
  document.querySelectorAll('.hk-post-content pre').forEach((pre) => {
    const code = pre.querySelector('code');
    if (!code || pre.querySelector('[data-copy-btn]')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hk-copy-btn';
    button.setAttribute('data-copy-btn', '');
    button.setAttribute('aria-label', 'Copiar bloque de código');
    const supported = Boolean(navigator.clipboard?.writeText);
    button.textContent = supported ? 'Copiar' : 'No disponible';
    button.disabled = !supported;

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

  /* =========================================================
     6. Tabla de contenidos (plegada en móvil, pegajosa en escritorio)
     ========================================================= */
  const tocNav = document.querySelector('[data-toc]');
  const tocDetails = document.querySelector('[data-toc-details]');
  if (tocNav) {
    const headings = Array.from(document.querySelectorAll('.hk-post-content h2, .hk-post-content h3'));
    if (headings.length > 1) {
      const ul = document.createElement('ul');
      const tocLinks = new Map();

      headings.forEach((heading, i) => {
        if (!heading.id) heading.id = 'sec-' + i;
        const li = document.createElement('li');
        if (heading.tagName === 'H3') li.className = 'hk-toc-sub';
        const a = document.createElement('a');
        a.href = '#' + heading.id;
        a.textContent = heading.textContent.trim();
        li.appendChild(a);
        ul.appendChild(li);
        tocLinks.set(heading.id, a);
      });
      tocNav.appendChild(ul);

      const desktopTocQuery = window.matchMedia('(min-width: 1024px)');
      function syncTocOpen() {
        if (tocDetails) tocDetails.open = desktopTocQuery.matches;
      }
      syncTocOpen();
      desktopTocQuery.addEventListener('change', syncTocOpen);

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              tocLinks.forEach((link) => link.classList.remove('is-active'));
              const activeLink = tocLinks.get(entry.target.id);
              if (activeLink) activeLink.classList.add('is-active');
            });
          },
          { rootMargin: '-12% 0px -70% 0px', threshold: 0 }
        );
        headings.forEach((h) => observer.observe(h));
      }
    } else {
      const aside = tocNav.closest('.hk-toc-aside') || tocNav.closest('.hk-toc');
      if (aside) aside.hidden = true;
      const layout = tocNav.closest('.hk-post-layout');
      if (layout) layout.classList.add('hk-post-layout--no-toc');
    }
  }

  /* =========================================================
     7. Carga diferida de embeds de X/Twitter solo cuando se necesitan
     ========================================================= */
  const xEmbeds = document.querySelectorAll('[data-x-embed], blockquote.twitter-tweet');
  if (xEmbeds.length > 0) {
    let xLoaded = false;
    function loadXWidgets() {
      if (xLoaded) return;
      xLoaded = true;
      const script = document.createElement('script');
      script.src = 'https://platform.x.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);
    }

    if ('IntersectionObserver' in window) {
      const embedObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            embedObserver.disconnect();
            loadXWidgets();
          }
        },
        { rootMargin: '250px 0px' }
      );
      xEmbeds.forEach((el) => embedObserver.observe(el));
    } else {
      loadXWidgets();
    }
  }

  /* =========================================================
     8. Botón volver arriba
     ========================================================= */
  const toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     9. Atajos de teclado globales (1-4 navegación, / búsqueda)
     ========================================================= */
  const shortcuts = { '1': 'home', '2': 'posts', '3': 'activities', '4': 'about' };
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;

    if (event.key === 'Escape') {
      setDrawerOpen(false, true);
      return;
    }

    if (event.key === '/' && searchInput) {
      event.preventDefault();
      if (mobileLayout.matches) setDrawerOpen(true, false);
      searchInput.focus();
      return;
    }

    if (shortcuts[event.key]) {
      const link = document.querySelector(`.hk-nav-item[data-nav="${shortcuts[event.key]}"]`);
      if (link instanceof HTMLAnchorElement) window.location.assign(link.href);
    }
  });
})();
