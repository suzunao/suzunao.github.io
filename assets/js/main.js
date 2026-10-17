(function () {
  'use strict';

  /* === VIEW ROUTING (hash) === */
  const validViews = ['home', 'posts', 'post', 'about', '404'];
  function showView(name) {
    if (validViews.indexOf(name) === -1) name = 'home';
    document.querySelectorAll('[data-vista]').forEach(v => {
      v.classList.toggle('visible', v.getAttribute('data-vista') === name);
    });
    document.querySelectorAll('.hk-nav-item').forEach(n => {
      const active = n.getAttribute('data-nav') === name;
      n.classList.toggle('active', active);
      if (active) n.setAttribute('aria-current', 'page');
      else n.removeAttribute('aria-current');
    });
    document.getElementById('contenido')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function navigate(v) {
    if (window.location.hash !== '#' + v) history.pushState(null, '', '#' + v);
    showView(v);
    closeDrawer();
  }
  document.querySelectorAll('[data-nav]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navigate(a.getAttribute('data-nav'));
    });
  });
  function onHash() {
    const h = window.location.hash.slice(1);
    showView(validViews.indexOf(h) > -1 ? h : 'home');
  }
  onHash();
  window.addEventListener('hashchange', onHash);

  /* === MOBILE DRAWER === */
  const hamburger = document.querySelector('[data-hamburger]');
  const drawer = document.querySelector('.hk-drawer');
  const backdrop = document.querySelector('[data-drawer-backdrop]');
  const drawerClose = document.querySelector('[data-drawer-close]');

  // Build drawer from sidebar HTML (clone)
  if (drawer && !drawer.querySelector('.hk-logo')) {
    const sidebar = document.querySelector('.hk-sidebar');
    if (sidebar) {
      // We don't need to clone; the drawer is hidden by CSS
      // Just bind close event to existing close button
    }
  }

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    backdrop && backdrop.classList.add('open');
    hamburger && hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    backdrop && backdrop.classList.remove('open');
    hamburger && hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (hamburger) hamburger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  /* === SEARCH === */
  const searchInput = document.querySelector('[data-search-input]');
  const searchResults = document.querySelector('[data-search-results]');
  let postsData = [];
  try {
    const dataEl = document.getElementById('hk-posts-data');
    if (dataEl) postsData = JSON.parse(dataEl.textContent || '[]');
  } catch (e) {}
  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function () {
      const q = searchInput.value.toLowerCase().trim();
      searchResults.innerHTML = '';
      if (q.length < 2) { searchResults.style.display = 'none'; return; }
      const hits = postsData.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      ).slice(0, 5);
      searchResults.style.display = 'block';
      if (!hits.length) {
        searchResults.innerHTML = '<div class="hk-search-empty">Sin resultados para "' + q + '"</div>';
      } else {
        hits.forEach(p => {
          const div = document.createElement('div');
          div.className = 'hk-search-result';
          const a = document.createElement('a');
          a.href = p.url; a.textContent = p.title || 'Sin título';
          a.addEventListener('click', e => {
            e.preventDefault(); navigate('post');
          });
          div.appendChild(a); searchResults.appendChild(div);
        });
      }
    });
  }

  /* === COPY CODE BUTTONS === */
  document.querySelectorAll('.hk-post-content pre').forEach(pre => {
    if (pre.querySelector('[data-copy-btn]')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'hk-copy-btn';
    btn.setAttribute('data-copy-btn', ''); btn.setAttribute('aria-label', 'Copiar código');
    btn.textContent = '⧉ Copiar';
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code');
      const text = code ? code.textContent : '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          btn.classList.add('copied'); btn.textContent = '✓ Copiado';
          setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '⧉ Copiar'; }, 1800);
        });
      }
    });
    pre.appendChild(btn);
  });

  /* === UPTIME CLOCK === */
  const uptime = document.querySelector('[data-uptime]');
  if (uptime) {
    const t0 = Date.now();
    setInterval(() => {
      const e = Date.now() - t0;
      const h = Math.floor(e / 3600000);
      const m = Math.floor((e % 3600000) / 60000);
      const s = Math.floor((e % 60000) / 1000);
      const p = (n) => String(n).padStart(2, '0');
      uptime.textContent = p(h) + ':' + p(m) + ':' + p(s);
    }, 1000);
  }

  /* === BACK TO TOP === */
  const toTop = document.querySelector('[data-to-top]');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 480);
    }, { passive: true });
    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* === KEYBOARD SHORTCUTS === */
  const navMap = { '1': 'home', '2': 'posts', '3': 'post', '4': 'about', '5': '404' };
  document.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (navMap[e.key]) { e.preventDefault(); navigate(navMap[e.key]); }
    else if (e.key === 'Escape') closeDrawer();
  });
})();
