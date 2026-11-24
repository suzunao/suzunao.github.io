# Informe de mejoras — `suzunao.github.io`

- **Rama de trabajo:** `mejora-diseno-flujo-datos` (sin modificar `main` ni hacer `push`)
- **Commit base:** `dae6ffc` (`Refine activities card description`)
- **Entorno de compilación verificado:** Ruby `3.2.11`, Bundler `2.4.19`, Jekyll `4.4.1` (`JEKYLL_ENV=production bundle exec jekyll build`, 0 errores, 0 advertencias)
- **Pruebas en navegador real:** Chrome headless vía CDP en 5 anchos (`320`, `375`, `768`, `1024`, `1440` px) sobre 7 rutas clave (35 combinaciones) + pruebas interactivas e inspección visual de capturas.

---

## 1. Diagnóstico inicial (Fase 1)

### Verificación de las 15 hipótesis

| # | Hipótesis | Estado | Evidencia encontrada en código / build |
| --- | --- | --- | --- |
| 1 | Tarjeta de post duplicada en `home.html`, `posts.md` y versión manual en `activities.md`; tiempo de lectura repetido en 4 sitios | **DISTINTO** (parcialmente confirmado) | La tarjeta sí estaba duplicada en `_layouts/home.html`, `posts.md` y escrita a mano en `activities.md`. Sin embargo, el cálculo del tiempo de lectura se repetía en **3 sitios** (`_layouts/home.html`, `posts.md` y `_layouts/post.html`), no en 4 (`activities.md` mostraba el literal `⌚ presentación`). |
| 2 | Las actividades son HTML escrito a mano, sin colección ni archivo de datos | **CONFIRMADO** | `activities.md` tenía un `<article class="hk-post-card">` hardcodeado e incluso un `<p style="margin-top:12px;padding:0 14px 14px;">` en línea para el enlace de Instagram. |
| 3 | Índice de búsqueda incrustado en JSON en todas las páginas; solo filtra título y etiquetas; sin actividades | **CONFIRMADO** | `_layouts/default.html` incluía `<script type="application/json" id="hk-posts-data">{% include posts.html %}</script>` en todas las páginas (incluyendo 404 y las 8 páginas `/tag/*`). Aunque `_includes/posts.html` incluía `excerpt` truncado a 60 chars, `assets/js/main.js` solo filtraba por `title` y `tags` y no indexaba actividades. |
| 4 | Etiquetas como `<span>`, no enlaces a `/tag/:name/`, y `jekyll-archives` usa `default` dejando páginas vacías | **CONFIRMADO** | Verificado en el build de línea base (`_site/tag/ads/index.html` y las otras 7): `<div class="hk-content"></div>` se renderizaba completamente vacío. Todas las etiquetas se pintaban como `<span class="hk-tag">`. |
| 5 | El número de tarjeta (`#01`…) sale de `forloop.index` y cambia al añadir un post | **CONFIRMADO** | `_layouts/home.html` y `posts.md` generaban `#01`, `#02`, `#03` desde `forloop.index` sobre `site.posts | sort: 'date' | reverse`, renumerando todo el archivo con cada publicación nueva. |
| 6 | Redes sociales, habilidades y certificaciones repetidas sin fuente única; certificaciones vacías; mezcla de `twitter.com` y `x.com` | **CONFIRMADO** | `_config.yml` y `_layouts/post.html` usaban `twitter.com`, mientras `_includes/about.html` usaba `x.com` con etiqueta `Twitter` y luego `Twitter/X`. Además, `_includes/about.html` renderizaba `.hk-cert-card` con `.hk-cert-name` y `.hk-cert-issuer` vacíos. |
| 7 | Estadística "Tags" suma apariciones y "Temas" cuenta únicas; panel "Estado del sistema" decorativo | **CONFIRMADO** | `_layouts/home.html` sumaba `post.tags.size` bajo "Tags" y contaba etiquetas únicas bajo "Temas". En `_layouts/default.html`, `Servidor: ONLINE`, `Conexión: CIFRADA` y `Uptime` (contador JS desde que se abre la pestaña) eran puramente decorativos. |
| 8 | Inconsistencias en posts: fecha de `P01`, mayúsculas mezcladas en tags, solo `linux`/`windows`/`web` con color | **CONFIRMADO** | `_posts/2026-06-01-P01-Cyber-IoT.md` tenía `date: 2026-05-30` (discrepa del nombre de archivo); las etiquetas mezclaban `windows ` (con espacio final), `ADS`, `NTFS`, `Linux`, `Vulnhub`, `IoTSecurity`, `InfoSec`, `CyberWar`. `_sass/_home.scss` solo definía color para `linux`, `windows` y `web`. |
| 9 | `_layouts/post.html` tiene Liquid en el front matter y `_config.yml` conserva exclusión `gaby` sin uso | **CONFIRMADO** | `_layouts/post.html` líneas 3–4 declaraban `title: {{ page.title }}` y `description: {{ page.description }}` en el front matter YAML. `_config.yml` excluía `gaby` aunque no existe tal carpeta en el repositorio. |
| 10 | `main.js` no contempla `/activities` para el elemento activo ni los atajos `1 2 3` | **CONFIRMADO** | `assets/js/main.js` solo reconocía `/`, `/about`, `/posts` y `/post/`. `/activities/` y `/tag/*` no marcaban ningún elemento activo; `shortcuts` solo mapeaba `1`, `2`, `3` (`home`, `posts`, `about`). |
| 11 | La búsqueda no navega con teclado y solo muestra 5 resultados | **CONFIRMADO** | `assets/js/main.js` hacía `.slice(0, 5)` sin manejo de flechas, `Enter`, `Escape`, roles ARIA ni recuento total. |
| 12 | `assets/img/icon/Suzunao.png` (207 KB) sin referencias; Google Fonts de tercero | **CONFIRMADO** | Auditoría sobre todo el repositorio confirmó **0 referencias** a `Suzunao.png` (212,624 bytes). `_layouts/default.html` cargaba Fira Code desde `fonts.googleapis.com`. |
| 13 | Página de la charla usa paleta y tipografía distintas y pesa ~737 KB con 14 imágenes en base64 | **CONFIRMADO** | `activities/la-curiosidad-tambien-es-una-herramienta-de-hacking.html` pesa **738,986 bytes**, usa paleta ciruela/rosa (`#07040a`, `#d4708a`, inspirada en *99 EMOTIONS*), `JetBrains Mono` + `Inter` (Google Fonts) y 14 imágenes `data:image/webp;base64,...` (677,304 caracteres, ~91.6% del archivo). |
| 14 | `404.html` usa estilos en línea; el tema carece de tokens de espaciado, tipografía y radios | **CONFIRMADO** | `404.html` contenía 6 atributos `style="..."` con verde inconsistente (`#00ff41` frente a `#00ff88`) y textos en inglés. `_sass/_base.scss` solo definía variables de color y `--font-mono`. |
| 15 | Contraste insuficiente en `--text-muted` (`#6e7681`) y scanlines siempre activas | **CONFIRMADO** | `#6e7681` registraba **4.34:1** sobre `--bg-dark`, **4.12:1** sobre `--bg-panel` y **3.77:1** sobre `--bg-terminal` (falla WCAG AA 4.5:1 en las 3 superficies). `.hk-scanlines` y `.hk-screen-door` no tenían control para desactivarlos. |

### Hallazgos nuevos detectados durante la auditoría

- **N1 (Bug crítico de Liquid en navegación entre posts):** `_layouts/post.html` usaba `sorted_posts[forloop.index0 | minus: 1]`, sintaxis inválida en Liquid (emitía 3 `Liquid Warning` en cada build). En producción generaba enlaces rotos `<a href="" class="hk-post-nav-link hk-post-nav-next"><span class="hk-post-nav-title"></span></a>` en `A00-ADS` y `P00-CoffeeAddicts`. **Corregido.**
- **N2 (Jerarquía de encabezados rota en 14 de 17 páginas HTML):** `posts.md` y `activities.md` carecían de `<h1>` (empezaban en `<h2>`); `_includes/about.html` colocaba `<h2>[ SOBRE MÍ ]</h2>` antes de `<h1>Suzunao</h1>`; los 3 posts saltaban de `<h1>` a `<h3>` (sin `<h2>`); y las 8 páginas `/tag/*` no tenían ningún encabezado. **Corregido (0 incidencias en verificación final).**
- **N3 (Avatares sin dimensiones declaradas):** Las 6 instancias de `avatar-96.webp` dentro de tarjetas en `index.html` y `posts/index.html` omitían `width` y `height`. **Corregido (`width="28" height="28"`).**
- **N4 (Script de terceros `platform.x.com/widgets.js` cargado de forma inmediata):** `_posts/2026-06-01-P01-Cyber-IoT.md` incrustaba `<script async src="https://platform.x.com/widgets.js">` directamente. **Sustituido por carga diferida con `IntersectionObserver` solo en páginas con `[data-x-embed]`.**
- **N5 (Objetivos táctiles < 44 px y botón de copiar solo en `:hover`):** `.hk-hamburger` (40×40 px), `.hk-nav-item` (42 px), `.hk-social-link` y `.hk-copy-btn` (invisible en dispositivos táctiles y al navegar con teclado sin `:hover`). **Corregido.**
- **N6 (Espacio final en etiqueta y errata en hero):** `2025-08-18-A00-ADS.md` contenía `- windows ` con espacio final; `_layouts/home.html` escribía `offensive Security Researcher` con minúscula inicial. **Corregido.**
- **N7 (Idioma inconsistente en `404.html`):** El documento declaraba `lang="es"` pero `404.html` mostraba textos en inglés (`The page you are looking for...`, `Return to Home`). **Unificado al español.**

---

## 2. Arquitectura de datos objetivo

```text
                      ┌──────────────────────────┐
                      │       _config.yml        │
                      │  SEO, plugins, archives, │
                      │  search_enabled, limits  │
                      └────────────┬─────────────┘
                                   │
   ┌───────────────────────────────┼───────────────────────────────┐
   ▼                               ▼                               ▼
┌────────────────────┐   ┌────────────────────┐        ┌────────────────────┐
│  _data/profile.yml │   │   _data/tags.yml   │        │ _data/activities   │
│  name, alias, role │   │  slug -> label,    │        │      .yml          │
│  bio, socials (X), │   │  description, tone │        │ id, title, date,   │
│  skill_groups,     │   │  (6 tonos + green) │        │ type, summary,     │
│  certifications[]  │   └─────────┬──────────┘        │ tags, url, links   │
└─────────┬──────────┘             │                   └─────────┬──────────┘
          │                        │                             │
          │                        ├───────────────────────┐     │
          ▼                        ▼                       ▼     ▼
┌────────────────────┐   ┌────────────────────┐   ┌─────────────────────────┐
│ _layouts/default   │   │ _includes/         │   │      search.json        │
│   sidebar, footer, │   │  - post-card.html  │   │  (build-time, posts +   │
│   metadatos build  │   │  - activity-card   │   │   activities; fetch     │
│ _layouts/home      │   │  - tag-list.html   │   │   lazy en main.js)      │
│   hero + stats     │   │  - reading-time    │   └─────────────────────────┘
│ _includes/about    │   │  - post-id.html    │
│   perfil, skills,  │   └─────────┬──────────┘
│   certs (empty),   │             │
│   contacto         │             ▼
│ _layouts/post      │   ┌─────────────────────────────────────────────────┐
│   share X/LinkedIn │   │  Vistas consumidoras                            │
└────────────────────┘   │   • /                 (_layouts/home.html)      │
                         │   • /posts/           (posts.md)                │
                         │   • /activities/      (activities.md)           │
                         │   • /tag/<slug>/      (_layouts/tag.html)       │
                         │   • /post/<titulo>/   (_layouts/post.html)      │
                         │   • /about/           (about.md)                │
                         └─────────────────────────────────────────────────┘
```

### Esquema normalizado de front matter para nuevos posts (`_posts/YYYY-MM-DD-slug.md`)

```yaml
---
layout: post
post_id: "04"                # ID estable cronológico (opcional; fallback automático por orden ascendente de fecha)
title: "Título del artículo"
date: 2026-07-01             # Debe coincidir con la fecha del nombre del archivo
author:
  name: Suzunao
  avatar: /assets/img/optimized/avatar-96.webp
description: "Resumen claro de 1–2 frases (usado en SEO, tarjetas y search.json)."
tags:
  - linux                    # Siempre en minúsculas y sin espacios finales; etiqueta visible definida en _data/tags.yml
  - infosec
toc: true                    # Opcional (por defecto true)
---
```

> **Convención de encabezados dentro de posts:** usar `##` para secciones principales y `###` para subsecciones (el título del post ya es `<h1>`).

---

## 3. Lista de cambios por fase y commits

| Fase | Commit | Resumen de cambios |
| --- | --- | --- |
| **Fase 2 · Datos** | `fd5f267` | Creación de `_data/profile.yml`, `_data/tags.yml` y `_data/activities.yml`; unificación de X en `_config.yml` y limpieza de exclusión `gaby` (más exclusión de `MEJORAS.md` del build público). |
| **Fase 2 · Plantillas** | `73eea49` | Creación de `_includes/reading-time.html`, `_includes/post-id.html`, `_includes/tag-list.html`, `_includes/post-card.html`, `_includes/activity-card.html` y `_layouts/tag.html`. Activación de `layout: tag` en `jekyll-archives`. Corrección de front matter inválido y bug `next_post` en `_layouts/post.html`. Estadísticas reales en Home, metadatos reales del build en sidebar, estado vacío honesto en certificaciones y jerarquía de encabezados corregida en `posts.md`, `activities.md` y `_includes/about.html`. |
| **Fase 2 · Posts** | `0770534` | Front matter normalizado en los 3 posts (`post_id` `"01"`–`"03"`, `date: 2026-06-01` en `P01`, tags en minúsculas sin espacios finales), promoción estructural `###` → `##` sin alterar el contenido técnico y sustitución del `<script>` inmediato de X en `P01` por `data-x-embed` diferido. |
| **Fase 2 · Búsqueda y JS** | `ec281d1` | Generación de `search.json` en build (posts + actividades), eliminación de `#hk-posts-data` y `_includes/posts.html`. Reescritura de `assets/js/main.js` con fetch diferido único, navegación por teclado (`ArrowDown`/`ArrowUp`/`Home`/`End`/`Enter`/`Escape`), resaltado seguro `<mark>`, estados de carga/error con reintento, elemento activo para `/activities/` y `/tag/*`, atajos `1 2 3 4` + `/`, foco del cajón móvil, control persistente de efectos CRT, TOC responsive + activo por scroll y carga diferida de `platform.x.com/widgets.js`. |
| **Fase 3 · Diseño** | `36379a8` | Sistema completo de tokens en `:root` (colores WCAG AA, tipografía, espaciado, radios, sombras, anchos y curvas de movimiento custom), tarjetas con patrón stretched-link válido en HTML5, tarjeta destacada diferenciada, etiquetas por tono semántico (`data-tone`), columna de lectura `70ch` + TOC pegajoso en escritorio, `404.html` sin estilos en línea y en español, estados vacíos, soporte `prefers-reduced-motion`, `prefers-contrast: more` y `html[data-fx="off"]`. |
| **Fase 4 · Rendimiento** | `9568e70` | Autoalojamiento de Fira Code Variable (`fira-code-latin-wght.woff2` + `fira-code-latin-ext-wght.woff2`, `font-display: swap`, preload del subset principal), eliminación de Google Fonts en el sitio, división de CSS específico por página (`main.css`, `page-post.css`, `page-about.css`) y eliminación de `assets/img/icon/Suzunao.png` (207 KB sin uso). |
| **Fase 3/5 · Pulido visual** | `3a7e27f` | Ajustes detectados tras revisar capturas en Chrome: envolvimiento limpio del footer en 375 px sin corchetes huérfanos, indicador `▸`/`▾` explícito en `<summary class="hk-toc-title">` y borde reforzado en la píldora de etiqueta activa. |

### Revisión de ingeniería de interfaz (patrones aplicados)

| Antes | Después | Por qué |
| --- | --- | --- |
| Valores sueltos en `.scss` y `style="..."` en `404.html` / `activities.md` | Tokens `:root` (`--space-*`, `--text-*`, `--radius-*`, `--ease-*`) y clases dedicadas | Mantiene coherencia visual y evita deriva en futuros cambios |
| `transition: all 0.25s ease` en `404.html` y `ease` genérico en UI | Propiedades explícitas (`transform`, `opacity`, `border-color`, `background-color`) con `--ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) y `< 300ms` | Evita repintados innecesarios y mejora la respuesta percibida |
| Sin respuesta táctil `:active` y `:hover` activo en pantallas táctiles | `:active { transform: scale(0.97) }` en botones y elevación de tarjetas restringida a `@media (hover: hover) and (pointer: fine)` | Respuesta táctil inmediata sin estados hover pegados en móvil |
| Resultados de búsqueda sin estados ni teclado | Navegación instantánea (sin animación) por teclado + estados `loading`, `empty` y `error` con `[Reintentar]` | Las acciones repetitivas de teclado deben responder sin retardo |
| `<a>` envolviendo toda la tarjeta con etiquetas `<span>` no navegables | Patrón stretched-link (`::after` en título + `z-index: 2` en etiquetas/acciones) | HTML5 válido, toda la tarjeta clicable y etiquetas navegables de forma independiente |

---

## 4. Comparativa Antes / Después

### URLs, sitemap e integridad estructural

| Métrica | Antes (Fase 0) | Después (Fase 5) | Resultado |
| --- | --- | --- | --- |
| URLs en `sitemap.xml` | 16 | 16 (100% idénticas, ninguna eliminada) | Cumplido |
| Páginas `/tag/*/` con contenido real | 0 / 8 (todas vacías) | 8 / 8 con título, descripción, conteo y tarjetas | Corregido |
| Enlaces internos rotos | 0 (pero 2 enlaces `href=""` vacíos en `next_post`) | 0 (y `next_post` corregido) | Corregido |
| Imágenes sin `alt`, `width` o `height` | 6 (`avatar-96.webp` en tarjetas) | 0 | Corregido |
| Páginas con saltos o falta de `<h1>` | 14 | 0 | Corregido |
| Advertencias Liquid en build | 3 (`_layouts/post.html` línea 55) | 0 | Corregido |
| Desbordamiento horizontal (`320`–`1440` px × 7 rutas) | No medido en línea base | 0 / 35 combinaciones | Verificado en Chrome |
| Errores de consola JS en Chrome | No medido en línea base | 0 | Verificado en Chrome |
| Dependencias de Google Fonts (sitio principal) | 3 `<link>` por página | 0 (Fira Code variable autoalojada) | Eliminado |

### Pesos de archivos y build (`_site/`)

| Recurso | Antes | Después | Delta |
| --- | ---: | ---: | ---: |
| **Total `_site/`** | **3,060,801 B** (2.92 MiB) | **2,979,699 B** (2.84 MiB) | **-81,102 B (-2.65%)** |
| `index.html` | 13,745 B | 14,938 B | +1,193 B *(incluye SVGs accesibles, estadísticas ampliadas y links de tags; sin JSON inline)* |
| `posts/index.html` | 11,802 B | 13,463 B | +1,661 B *(incluye barra de filtro de etiquetas)* |
| `activities/index.html` | 9,025 B | 10,464 B | +1,439 B |
| `about/index.html` | 13,688 B | 14,737 B | +1,049 B |
| `post/P01-Cyber-IoT/index.html` | 26,681 B | 27,964 B | +1,283 B *(sin `<script>` bloqueante de X)* |
| `tag/ads/index.html` (ejemplo) | 7,349 B *(vacía)* | 12,245 B *(listado completo)* | +4,896 B |
| `assets/css/main.css` | 17,761 B *(monolítico)* | 26,381 B *(núcleo + `@font-face` + tokens + tags + 404 + a11y)* | +8,620 B *(dividido: `page-post.css` 6,837 B y `page-about.css` 2,862 B solo se cargan en sus páginas)* |
| `assets/js/main.js` | 6,959 B | 20,667 B | +13,708 B *(búsqueda lazy + teclado + foco drawer + TOC activo + CRT toggle + X lazy)* |
| `search.json` *(nuevo, solo bajo demanda)* | — *(incrustado en cada HTML)* | 2,015 B | Cargado 1 sola vez al enfocar buscador |
| `assets/fonts/fira-code-*-wght.woff2` *(autoalojadas)* | — *(tercero Google Fonts)* | 35,600 B (`latin`) + 12,644 B (`latin-ext`) | 1 sola petición (`35.6 KB`) en español |
| `assets/img/icon/Suzunao.png` | 212,624 B *(sin uso)* | Eliminado (0 B) | **-212,624 B** |
| `activities/la-curiosidad-...html` | 738,986 B | 738,986 B *(sin cambios, ver sección 5)* | 0 B |

### Contraste WCAG 2.1 (ratio sobre `--bg-dark` `#050a06` / `--bg-panel` `#0d1117` / `--bg-terminal` `#161b22`)

| Token | Antes (hex y ratios) | Después (hex y ratios) | WCAG AA (≥ 4.5:1) |
| --- | --- | --- | --- |
| `--text-primary` | `#c9d1d9` (12.93 / 12.26 / 11.21) | `#d4dce4` (14.40 / 13.66 / 12.49) | Pasa AAA |
| `--text-secondary` | `#8b949e` (6.49 / 6.15 / 5.62) | `#adb7c2` (9.81 / 9.31 / 8.51) | Pasa AAA |
| `--text-muted` | `#6e7681` (**4.34 / 4.12 / 3.77**) | `#8b949e` (**6.49 / 6.15 / 5.62**) | **Antes FALLA → Ahora PASA AA** |
| `--accent-green` | `#00ff88` (14.88 / 14.11 / 12.90) | `#00ff88` (14.88 / 14.11 / 12.90) | Pasa AAA |
| `--accent-blue` | `#58a6ff` (7.90 / 7.49 / 6.85) | `#58a6ff` (7.90 / 7.49 / 6.85) | Pasa AA/AAA |
| `--accent-yellow` | `#d29922` (7.90 / 7.50 / 6.85) | `#e3b341` (10.25 / 9.72 / 8.89) | Pasa AAA |
| `--accent-purple` | `#a371f7` (5.95 / 5.64 / 5.16) | `#b48bff` (7.67 / 7.28 / 6.65) | Pasa AA/AAA |
| `--accent-red` | `#f85149` (5.95 / 5.65 / 5.16) | `#ff7b72` (7.91 / 7.51 / 6.86) | Pasa AA/AAA |
| `--accent-cyan` | `#56d4dd` (11.27 / 10.69 / 9.77) | `#56d4dd` (11.27 / 10.69 / 9.77) | Pasa AAA |

### Auditoría Lighthouse móvil

| Página | Antes | Después | Nota |
| --- | --- | --- | --- |
| Inicio (`/`) | **no medido** | **no medido** | `bunx lighthouse` se colgó en `chrome-launcher` bajo Bun en Windows (sin Node nativo instalado en el equipo). |
| Post (`/post/P01-Cyber-IoT/`) | **no medido** | **no medido** | Verificación funcional, responsive, red, consola y capturas ejecutadas directamente contra Chrome headless vía CDP. |
| Artículos (`/posts/`) | **no medido** | **no medido** | Se recomienda ejecutar Lighthouse desde DevTools en Chrome tras desplegar o en un entorno con Node 20+. |

### Pruebas interactivas verificadas en Chrome headless (Fase 5)

- **Navegación activa:** confirmada en `/`, `/posts/`, `/activities/`, `/about/`, `/tag/ads/` y `/post/A00-ADS/` (`aria-current="page"`).
- **Búsqueda lazy + teclado:** 0 peticiones a `/search.json` al cargar la página; exactamente 1 petición al enfocar el buscador; la búsqueda `"iot"` devolvió 2 resultados (1 `post` + 1 `activity`); `ArrowDown` actualizó `aria-activedescendant="hk-search-opt-0"`; `Escape` cerró la lista.
- **Control CRT:** alterna `aria-pressed`, `data-fx="off"` y `localStorage['hk-fx']`.
- **Cajón móvil (375 px):** abre con `aria-expanded="true"`, mueve el foco dentro del cajón, cierra con `Escape` y devuelve el foco al botón hamburguesa.
- **TOC y copiar código (`/post/P01-Cyber-IoT/`):** TOC abierto con 6 entradas en escritorio (`1440 px`) y plegado por defecto en móvil (`375 px`); 5 botones `[data-copy-btn]` inyectados.
- **No probado manualmente en dispositivo físico real:** `NO PROBADO` el gesto táctil real en teléfono físico ni el portapapeles real en Safari iOS; tampoco se ejecutó la gema `html-proofer` (se sustituyó por un comprobador estático equivalente sobre todos los HTML de `_site/`).

---

## 5. Pendientes, decisiones tuyas y guía de reversión

### Decisiones que quedan en tus manos

1. **Certificaciones en `_data/profile.yml`:** actualmente `certifications: []` muestra un estado honesto `[ EN_PROGRESO ]` junto a tus enlaces de TryHackMe y HackTheBox. Cuando quieras publicar certificaciones reales, solo añade entradas en `_data/profile.yml`:
   ```yaml
   certifications:
     - name: "eJPT"
       issuer: "INE Security"
       year: "2026"
   ```
2. **Página de la charla (`activities/la-curiosidad-tambien-es-una-herramienta-de-hacking.html`, 739 KB):**
   - **Coherencia visual:** es un *slide deck* interactivo 16:9 independiente con estética propia ciruela/rosa (*99 EMOTIONS*), animaciones de cifrado y 14 imágenes WebP en base64 que le permiten funcionar incluso como archivo HTML autónomo sin conexión. Cambiarle la paleta a verde terminal alteraría notablemente su identidad visual, por lo que **se dejó intacta** siguiendo la regla del proyecto.
   - **Propuesta opcional (reversible) para reducir su peso (~91%):** si prefieres optimizarla para web sacrificando la portabilidad de archivo único, se pueden extraer las 14 imágenes `data:image/webp;base64,...` a `assets/img/activities/curiosidad-01.webp` … `curiosidad-14.webp` y reemplazar los atributos `data-src` por rutas `/assets/img/activities/...`, bajando el HTML de ~739 KB a ~62 KB (y sirviendo cada captura solo al llegar a su diapositiva). Si decides hacerlo, conviene además añadir un botón de regreso al blog (`/activities/`) y reemplazar su enlace de Google Fonts por las fuentes autoalojadas.
3. **Medición con Lighthouse móvil y `html-proofer`:** marcados como `no medido` / `NO PROBADO` respectivamente por limitaciones de runtime local (sin Node nativo para `chrome-launcher` y sin añadir `html-proofer` al workflow).
4. **Dimensiones OG de `brand-1200x630.webp`:** `_config.yml` declara `width: 1080, height: 567` en `defaults.values.image` (se mantuvo sin tocar para no alterar metadatos existentes sin confirmar las dimensiones reales en píxeles de ese WebP).

### Cómo revertir cada cambio importante

Todos los cambios están aislados en la rama `mejora-diseno-flujo-datos` en commits atómicos:

- **Descartar toda la rama:** `git checkout main && git branch -D mejora-diseno-flujo-datos`
- **Revertir un bloque específico** (sin perder el resto):
  - Pulido visual menor: `git revert 3a7e27f`
  - Autoalojamiento de fuentes, división de CSS y borrado de `Suzunao.png`: `git revert 9568e70`
  - Rediseño CSS, tokens y `404.html`: `git revert 36379a8`
  - Búsqueda con `search.json` y mejoras de `main.js`: `git revert ec281d1`
  - Normalización de posts (`post_id`, fecha de `P01`, tags en minúsculas, `##` y embed diferido de X): `git revert 0770534`
  - Plantillas unificadas y layout `/tag/*/`: `git revert 73eea49`
  - Archivos `_data/*.yml` y limpieza de `_config.yml`: `git revert fd5f267`
- **Restaurar un archivo puntual desde `main`:** `git checkout main -- <ruta/del/archivo>`
