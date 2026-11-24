(function () {
  'use strict';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* =========================================================
     0. Toast minimalista (feedback inmediato sin ruido)
     ========================================================= */
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.hidden = false;
    window.requestAnimationFrame(() => toastEl.classList.add('is-visible'));
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
      window.setTimeout(() => { toastEl.hidden = true; }, 220);
    }, 2200);
  }

  async function copyText(text, okMsg) {
    if (!navigator.clipboard?.writeText) {
      showToast('Portapapeles no disponible');
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      if (okMsg) showToast(okMsg);
      return true;
    } catch {
      showToast('No se pudo copiar');
      return false;
    }
  }

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
     2. Menú móvil deslizante con trampa de foco
     ========================================================= */
  const hamburger = document.querySelector('[data-hamburger]');
  const drawer = document.getElementById('hk-drawer');
  const drawerClose = document.querySelector('[data-drawer-close]');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const mobileLayout = window.matchMedia('(max-width: 820px)');

  function getFocusables(container) {
    if (!container) return [];
    return Array.from(
      container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.offsetParent !== null);
  }

  function setDrawerOpen(open, restoreFocus) {
    if (!drawer) return;
    drawer.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    hamburger?.setAttribute('aria-expanded', String(open));
    hamburger?.setAttribute('aria-label', open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) {
      const focusables = getFocusables(drawer);
      if (focusables.length > 0) focusables[0].focus();
    } else if (restoreFocus) {
      hamburger?.focus();
    }
  }

  hamburger?.addEventListener('click', () => {
    const willOpen = !drawer?.classList.contains('open');
    setDrawerOpen(willOpen, !willOpen);
  });
  drawerClose?.addEventListener('click', () => setDrawerOpen(false, true));
  backdrop?.addEventListener('click', () => setDrawerOpen(false, true));
  drawer?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setDrawerOpen(false, false));
  });

  drawer?.addEventListener('keydown', (event) => {
    if (!drawer.classList.contains('open') || event.key !== 'Tab') return;
    const focusables = getFocusables(drawer);
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

  mobileLayout.addEventListener('change', (ev) => {
    if (!ev.matches && drawer?.classList.contains('open')) {
      setDrawerOpen(false, false);
    }
  });

  /* =========================================================
     3. Control de efectos CRT (sincronizado en header y cajón)
     ========================================================= */
  const fxButtons = document.querySelectorAll('[data-fx-toggle]');

  function isFxEnabled() {
    return document.documentElement.getAttribute('data-fx') !== 'off';
  }

  function syncFxButtons() {
    const on = isFxEnabled();
    fxButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(on));
      const label = btn.querySelector('[data-fx-label]');
      if (label) label.textContent = on ? 'Efectos CRT: ON' : 'Efectos CRT: OFF';
    });
  }

  function toggleFx() {
    const nextOn = !isFxEnabled();
    if (nextOn) document.documentElement.removeAttribute('data-fx');
    else document.documentElement.setAttribute('data-fx', 'off');
    try { localStorage.setItem('hk-fx', nextOn ? 'on' : 'off'); } catch {}
    syncFxButtons();
    showToast(nextOn ? 'Efectos CRT activados' : 'Efectos CRT desactivados');
  }

  syncFxButtons();
  fxButtons.forEach((btn) => btn.addEventListener('click', toggleFx));

  /* =========================================================
     4. Command Palette (⌘K / /) con búsqueda lazy (/search.json)
     ========================================================= */
  const cmdkBackdrop = document.querySelector('[data-cmdk-backdrop]');
  const cmdkOpeners = document.querySelectorAll('[data-open-cmdk]');
  const cmdkClose = document.querySelector('[data-close-cmdk]');
  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  const searchLive = document.querySelector('[data-search-live]');

  let indexData = null;
  let indexPromise = null;
  let cmdkReturnFocus = null;
  let activeIndex = -1;
  let currentOptions = [];

  const quickActions = [
    { kind: 'action', type: 'Navegar', title: 'Ir a Inicio', description: 'Volver a la portada principal', url: '/' },
    { kind: 'action', type: 'Navegar', title: 'Ver todos los artículos', description: 'Explorar y filtrar todas las publicaciones', url: '/posts/' },
    { kind: 'action', type: 'Navegar', title: 'Ver actividades y charlas', description: 'Presentaciones en conferencias', url: '/activities/' },
    { kind: 'action', type: 'Navegar', title: 'Sobre mí', description: 'Perfil, habilidades y contacto', url: '/about/' },
    { kind: 'action', type: 'Acción', title: 'Alternar efectos CRT', description: 'Activar o desactivar las líneas de pantalla', run: () => toggleFx() },
    { kind: 'action', type: 'Acción', title: 'Copiar enlace de esta página', description: window.location.pathname, run: () => copyText(window.location.href, 'Enlace copiado al portapapeles') },
  ];

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function loadSearchIndex() {
    if (!searchInput) return Promise.resolve([]);
    if (indexData) return Promise.resolve(indexData);
    if (indexPromise) return indexPromise;
    const url = searchInput.dataset.searchUrl || '/search.json';
    indexPromise = fetch(url, { headers: { Accept: 'application/json' } })
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

  function appendHighlighted(parent, text, rawQuery) {
    const source = String(text || '');
    const normQuery = normalizeText(rawQuery);
    if (!normQuery) {
      parent.appendChild(document.createTextNode(source));
      return;
    }
    const normSource = normalizeText(source);
    let cursor = 0;
    let idx = normSource.indexOf(normQuery, cursor);
    while (idx !== -1) {
      if (idx > cursor) parent.appendChild(document.createTextNode(source.slice(cursor, idx)));
      const mark = document.createElement('mark');
      mark.className = 'hk-search-mark';
      mark.textContent = source.slice(idx, idx + rawQuery.length);
      parent.appendChild(mark);
      cursor = idx + rawQuery.length;
      idx = normSource.indexOf(normQuery, cursor);
    }
    if (cursor < source.length) parent.appendChild(document.createTextNode(source.slice(cursor)));
  }

  function setActiveOption(nextIndex) {
    if (currentOptions.length === 0) {
      activeIndex = -1;
      searchInput?.removeAttribute('aria-activedescendant');
      return;
    }
    if (nextIndex < 0) nextIndex = currentOptions.length - 1;
    if (nextIndex >= currentOptions.length) nextIndex = 0;
    currentOptions.forEach((opt, i) => {
      const sel = i === nextIndex;
      opt.classList.toggle('is-active', sel);
      opt.setAttribute('aria-selected', String(sel));
    });
    activeIndex = nextIndex;
    searchInput?.setAttribute('aria-activedescendant', currentOptions[activeIndex].id);
    currentOptions[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function closeCmdk(restoreFocus = true) {
    if (!cmdkBackdrop || cmdkBackdrop.hidden) return;
    cmdkBackdrop.hidden = true;
    document.body.style.overflow = '';
    searchInput?.setAttribute('aria-expanded', 'false');
    searchInput?.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    currentOptions = [];
    if (restoreFocus && cmdkReturnFocus instanceof HTMLElement) {
      cmdkReturnFocus.focus();
    }
  }

  function renderCmdkItem(item, idx, rawQuery) {
    const row = document.createElement('div');
    row.className = 'hk-search-result';
    row.id = `hk-search-opt-${idx}`;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');

    const interactive = item.run ? document.createElement('button') : document.createElement('a');
    if (item.run) {
      interactive.type = 'button';
      interactive.addEventListener('click', () => {
        closeCmdk(true);
        item.run();
      });
    } else {
      interactive.href = item.url;
      if (item.external) {
        interactive.target = '_blank';
        interactive.rel = 'noopener noreferrer';
      }
      interactive.addEventListener('click', () => closeCmdk(false));
    }
    interactive.tabIndex = -1;

    const top = document.createElement('div');
    top.className = 'hk-search-result-top';
    const badge = document.createElement('span');
    badge.className = 'hk-search-badge';
    badge.dataset.kind = item.kind || 'post';
    badge.textContent = item.type || 'Artículo';
    top.appendChild(badge);
    if (item.date) {
      const dateEl = document.createElement('span');
      dateEl.className = 'hk-search-date';
      dateEl.textContent = item.date;
      top.appendChild(dateEl);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'hk-search-result-title';
    appendHighlighted(titleEl, item.title || 'Sin título', rawQuery);
    interactive.append(top, titleEl);

    if (item.description) {
      const descEl = document.createElement('div');
      descEl.className = 'hk-search-result-desc';
      const rawDesc = String(item.description).trim();
      const snippet = rawDesc.length > 118 ? `${rawDesc.slice(0, 118).replace(/\s+\S*$/, '')}…` : rawDesc;
      appendHighlighted(descEl, snippet, rawQuery);
      interactive.appendChild(descEl);
    }

    row.appendChild(interactive);
    row.addEventListener('mousemove', () => setActiveOption(idx));
    return row;
  }

  function renderCmdk() {
    if (!searchInput || !searchResults) return;
    const rawQuery = searchInput.value.trim();
    const query = normalizeText(rawQuery);
    searchResults.replaceChildren();
    currentOptions = [];
    activeIndex = -1;

    if (!indexData) {
      const box = document.createElement('div');
      box.className = 'hk-search-state';
      box.textContent = 'Cargando índice de búsqueda...';
      searchResults.appendChild(box);
      loadSearchIndex()
        .then(() => renderCmdk())
        .catch(() => {
          searchResults.replaceChildren();
          const err = document.createElement('div');
          err.className = 'hk-search-state hk-search-state--error';
          const p = document.createElement('p');
          p.textContent = 'No se pudo cargar el índice de búsqueda.';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hk-search-retry';
          btn.textContent = '[Reintentar]';
          btn.addEventListener('click', () => {
            loadSearchIndex().then(() => renderCmdk()).catch(() => {});
          });
          err.append(p, btn);
          searchResults.appendChild(err);
        });
      return;
    }

    let list = [];
    if (query.length === 0) {
      const recent = indexData.filter((i) => i.kind === 'post' || i.kind === 'activity').slice(0, 4);
      const groupRecent = document.createElement('div');
      groupRecent.className = 'hk-cmdk-group';
      groupRecent.textContent = '// Contenido reciente';
      searchResults.appendChild(groupRecent);
      recent.forEach((item) => {
        const row = renderCmdkItem(item, currentOptions.length, '');
        searchResults.appendChild(row);
        currentOptions.push(row);
      });

      const groupActions = document.createElement('div');
      groupActions.className = 'hk-cmdk-group';
      groupActions.textContent = '// Acciones rápidas';
      searchResults.appendChild(groupActions);
      quickActions.forEach((act) => {
        const row = renderCmdkItem(act, currentOptions.length, '');
        searchResults.appendChild(row);
        currentOptions.push(row);
      });
      setActiveOption(0);
      return;
    }

    const pool = [...indexData, ...quickActions];
    list = pool.filter((item) => {
      const hay = normalizeText([
        item.title,
        item.description,
        item.type,
        item.date,
        ...(item.tags || []),
        ...(item.tagSlugs || []),
      ].join(' '));
      return hay.includes(query);
    });

    if (list.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hk-search-empty';
      const t = document.createElement('div');
      t.className = 'hk-search-empty-title';
      t.textContent = '[ SIN RESULTADOS ]';
      const h = document.createElement('div');
      h.className = 'hk-search-empty-hint';
      h.textContent = `No hay coincidencias para "${rawQuery}". Prueba con otra etiqueta, tema o acción.`;
      empty.append(t, h);
      searchResults.appendChild(empty);
      if (searchLive) searchLive.textContent = `Sin resultados para ${rawQuery}`;
      return;
    }

    const countEl = document.createElement('div');
    countEl.className = 'hk-search-count';
    countEl.textContent = list.length === 1 ? '1 resultado encontrado' : `${list.length} resultados encontrados`;
    searchResults.appendChild(countEl);
    if (searchLive) searchLive.textContent = countEl.textContent;

    list.forEach((item) => {
      const row = renderCmdkItem(item, currentOptions.length, rawQuery);
      searchResults.appendChild(row);
      currentOptions.push(row);
    });
    setActiveOption(0);
  }

  function openCmdk() {
    if (!cmdkBackdrop || !searchInput) return;
    if (drawer?.classList.contains('open')) setDrawerOpen(false, false);
    cmdkReturnFocus = document.activeElement;
    cmdkBackdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    searchInput.setAttribute('aria-expanded', 'true');
    searchInput.focus();
    searchInput.select();
    renderCmdk();
  }

  cmdkOpeners.forEach((btn) => btn.addEventListener('click', openCmdk));
  cmdkClose?.addEventListener('click', () => closeCmdk(true));
  cmdkBackdrop?.addEventListener('click', (event) => {
    if (event.target === cmdkBackdrop) closeCmdk(true);
  });

  searchInput?.addEventListener('input', renderCmdk);
  searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCmdk(true);
      return;
    }
    if (currentOptions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveOption(activeIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveOption(activeIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveOption(currentOptions.length - 1);
    } else if (event.key === 'Enter') {
      const chosen = currentOptions[activeIndex >= 0 ? activeIndex : 0];
      const actionEl = chosen?.querySelector('a, button');
      if (actionEl) {
        event.preventDefault();
        actionEl.click();
      }
    }
  });

  /* =========================================================
     5. Filtrado y orden en vivo en /posts/
     ========================================================= */
  const archiveRoot = document.querySelector('[data-posts-archive]');
  if (archiveRoot) {
    const filterInput = archiveRoot.querySelector('[data-archive-search]');
    const sortSelect = archiveRoot.querySelector('[data-archive-sort]');
    const tagButtons = Array.from(archiveRoot.querySelectorAll('[data-filter-tag]'));
    const grid = archiveRoot.querySelector('[data-archive-grid]');
    const cards = Array.from(archiveRoot.querySelectorAll('[data-post-card]'));
    const countBadge = archiveRoot.querySelector('[data-archive-count]');
    const emptyBox = archiveRoot.querySelector('[data-archive-empty]');
    const resetBtn = archiveRoot.querySelector('[data-archive-reset]');

    let activeTag = 'all';

    function applyArchiveFilter() {
      const q = normalizeText(filterInput?.value.trim() || '');
      const order = sortSelect?.value || 'newest';

      const sorted = [...cards].sort((a, b) => {
        const da = Number(a.dataset.date || 0);
        const db = Number(b.dataset.date || 0);
        return order === 'oldest' ? da - db : db - da;
      });
      sorted.forEach((card) => grid?.appendChild(card));

      let visible = 0;
      sorted.forEach((card) => {
        const cardTags = (card.dataset.tags || '').split(',').filter(Boolean);
        const tagMatch = activeTag === 'all' || cardTags.includes(activeTag);
        const textMatch = !q || normalizeText(`${card.dataset.title || ''} ${card.dataset.desc || ''} ${card.dataset.tags || ''}`).includes(q);
        const show = tagMatch && textMatch;
        card.hidden = !show;
        if (show) visible += 1;
      });

      if (countBadge) {
        countBadge.textContent = visible === cards.length
          ? `${cards.length} ${cards.length === 1 ? 'artículo' : 'artículos'}`
          : `${visible} de ${cards.length}`;
      }
      if (emptyBox) emptyBox.hidden = visible > 0;
    }

    tagButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTag = btn.dataset.filterTag || 'all';
        tagButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        applyArchiveFilter();
      });
    });

    filterInput?.addEventListener('input', applyArchiveFilter);
    sortSelect?.addEventListener('change', applyArchiveFilter);
    resetBtn?.addEventListener('click', () => {
      activeTag = 'all';
      if (filterInput) filterInput.value = '';
      if (sortSelect) sortSelect.value = 'newest';
      tagButtons.forEach((b) => {
        const isAll = b.dataset.filterTag === 'all';
        b.classList.toggle('is-active', isAll);
        b.setAttribute('aria-pressed', String(isAll));
      });
      applyArchiveFilter();
      filterInput?.focus();
    });
  }

  /* =========================================================
     6. Mejoras de lectura en posts: progreso, tamaño, código,
        anclas de sección, TOC activo y lightbox de imágenes
     ========================================================= */
  const progressBar = document.querySelector('[data-reading-progress]');
  const postContent = document.querySelector('[data-post-content]');

  if (progressBar && postContent) {
    function updateProgress() {
      const rect = postContent.getBoundingClientRect();
      const total = postContent.offsetHeight - window.innerHeight * 0.65;
      if (total <= 0) {
        progressBar.style.transform = 'scaleX(0)';
        return;
      }
      const scrolled = Math.min(Math.max(-rect.top + 80, 0), total);
      progressBar.style.transform = `scaleX(${(scrolled / total).toFixed(4)})`;
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  // Selector de tamaño de texto (A- / A / A+)
  const sizeBtns = document.querySelectorAll('[data-prose-btn]');
  if (sizeBtns.length > 0) {
    function syncSizeButtons(size) {
      sizeBtns.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.proseBtn === size));
      });
    }
    const currentSize = document.documentElement.getAttribute('data-prose-size') || 'md';
    syncSizeButtons(currentSize);

    const sizeLabels = { sm: 'Compacto', md: 'Estándar', lg: 'Grande' };
    sizeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const sz = btn.dataset.proseBtn || 'md';
        document.documentElement.setAttribute('data-prose-size', sz);
        try { localStorage.setItem('hk-prose-size', sz); } catch {}
        syncSizeButtons(sz);
        showToast(`Tamaño de lectura: ${sizeLabels[sz] || sz}`);
      });
    });
  }

  // Botones copiar URL del artículo
  document.querySelectorAll('[data-copy-url]').forEach((btn) => {
    btn.addEventListener('click', () => copyText(window.location.href, 'Enlace del artículo copiado'));
  });

  // Bloques de código mejorados (cabecera de lenguaje + botón copiar persistente)
  if (postContent) {
    postContent.querySelectorAll('pre').forEach((pre) => {
      const code = pre.querySelector('code');
      if (!code || pre.closest('.hk-code-block')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'hk-code-block';

      const rougeHost = pre.closest('.highlighter-rouge');
      const langClass = Array.from(rougeHost?.classList || [])
        .concat(Array.from(code.classList || []))
        .find((c) => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '') : 'terminal';

      const head = document.createElement('div');
      head.className = 'hk-code-head';
      const langEl = document.createElement('span');
      langEl.className = 'hk-code-lang';
      langEl.textContent = lang;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hk-copy-btn';
      button.setAttribute('data-copy-btn', '');
      button.setAttribute('aria-label', 'Copiar bloque de código');
      button.textContent = 'Copiar';
      button.addEventListener('click', async () => {
        const ok = await copyText(code.textContent || '', 'Código copiado al portapapeles');
        if (ok) {
          button.classList.add('copied');
          button.textContent = 'Copiado ✓';
          window.setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = 'Copiar';
          }, 1800);
        }
      });

      head.append(langEl, button);
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.append(head, pre);
    });

    // Anclas copiables en encabezados + Tabla de contenidos
    const headings = Array.from(postContent.querySelectorAll('h2, h3'));
    const tocNav = document.querySelector('[data-toc]');
    const tocDetails = document.querySelector('[data-toc-details]');
    const tocCount = document.querySelector('[data-toc-count]');
    const tocLinks = new Map();

    headings.forEach((heading, i) => {
      if (!heading.id) heading.id = `sec-${i + 1}`;
      const rawText = heading.textContent.trim();

      const anchorBtn = document.createElement('button');
      anchorBtn.type = 'button';
      anchorBtn.className = 'hk-heading-anchor';
      anchorBtn.setAttribute('aria-label', `Copiar enlace a la sección ${rawText}`);
      anchorBtn.textContent = '#';
      anchorBtn.addEventListener('click', () => {
        const url = `${window.location.origin}${window.location.pathname}#${heading.id}`;
        window.history.replaceState(null, '', `#${heading.id}`);
        copyText(url, 'Enlace de sección copiado');
      });
      heading.appendChild(anchorBtn);

      if (tocNav) {
        tocLinks.set(heading.id, { heading, text: rawText });
      }
    });

    if (tocNav) {
      if (headings.length > 1) {
        const ul = document.createElement('ul');
        const linkNodes = new Map();
        tocLinks.forEach(({ heading, text }, id) => {
          const li = document.createElement('li');
          if (heading.tagName === 'H3') li.className = 'hk-toc-sub';
          const a = document.createElement('a');
          a.href = `#${id}`;
          a.textContent = text;
          li.appendChild(a);
          ul.appendChild(li);
          linkNodes.set(id, a);
        });
        tocNav.appendChild(ul);
        if (tocCount) tocCount.textContent = `${headings.length} secciones`;

        const desktopTocQuery = window.matchMedia('(min-width: 1060px)');
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
                linkNodes.forEach((link) => link.classList.remove('is-active'));
                const active = linkNodes.get(entry.target.id);
                if (active) active.classList.add('is-active');
              });
            },
            { rootMargin: '-12% 0px -72% 0px', threshold: 0 }
          );
          headings.forEach((h) => observer.observe(h));
        }
      } else {
        const aside = tocNav.closest('.hk-toc-aside');
        if (aside) aside.hidden = true;
        const layout = tocNav.closest('.hk-post-layout');
        if (layout) layout.classList.add('hk-post-layout--no-toc');
      }
    }

    // Lightbox para capturas técnicas en posts
    const lightbox = document.getElementById('hk-lightbox');
    const lbCaption = lightbox?.querySelector('[data-lightbox-caption]');
    const lbClose = lightbox?.querySelector('[data-lightbox-close]');
    const lbStage = lightbox?.querySelector('[data-lightbox-stage]');

    if (lightbox && lbStage && typeof lightbox.showModal === 'function') {
      postContent.querySelectorAll('img').forEach((img) => {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        const label = img.alt && !/^(descripcion|descripción|imagen|img|png|a)$/i.test(img.alt.trim())
          ? img.alt.trim()
          : 'Captura técnica (clic para ampliar)';
        img.setAttribute('title', 'Ampliar imagen');

        function openLightbox() {
          const fullImg = document.createElement('img');
          fullImg.src = img.currentSrc || img.src;
          fullImg.alt = img.alt || label;
          if (img.naturalWidth) fullImg.width = img.naturalWidth;
          if (img.naturalHeight) fullImg.height = img.naturalHeight;
          lbStage.replaceChildren(fullImg);
          if (lbCaption) lbCaption.textContent = label;
          lightbox.showModal();
        }

        img.addEventListener('click', openLightbox);
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox();
          }
        });
      });

      lbClose?.addEventListener('click', () => lightbox.close());
      lbStage?.addEventListener('click', () => lightbox.close());
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.close();
      });
      lightbox.addEventListener('close', () => lbStage.replaceChildren());
    }
  }

  /* =========================================================
     7. Carga diferida de embeds de X/Twitter
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
      toTop.classList.toggle('show', window.scrollY > 420);
    }, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     9. Atajos de teclado globales (⌘K / Ctrl+K / / / 1-4 / Esc)
     ========================================================= */
  const shortcuts = { '1': 'home', '2': 'posts', '3': 'activities', '4': 'about' };
  document.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      if (cmdkBackdrop) {
        event.preventDefault();
        if (cmdkBackdrop.hidden) openCmdk();
        else closeCmdk(true);
      }
      return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Escape') {
      if (cmdkBackdrop && !cmdkBackdrop.hidden) {
        closeCmdk(true);
        return;
      }
      if (drawer?.classList.contains('open')) {
        setDrawerOpen(false, true);
      }
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement
      && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;

    if (event.key === '/' && cmdkBackdrop) {
      event.preventDefault();
      openCmdk();
      return;
    }

    if (shortcuts[event.key]) {
      const link = document.querySelector(`.hk-nav-item[data-nav="${shortcuts[event.key]}"]`);
      if (link instanceof HTMLAnchorElement) window.location.assign(link.href);
    }
  });
})();
