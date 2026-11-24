---
layout: default
title: Artículos
description: Todos los artículos del blog sobre hacking, cybersecurity y writeups de CTF.
permalink: /posts/
---

{%- assign all_posts = site.posts | sort: 'date' | reverse -%}
<section class="hk-archive-page" data-posts-archive>
  <header class="hk-page-header">
    <div>
      <p class="hk-kicker">// ARCHIVO TÉCNICO</p>
      <h1 class="hk-page-title">Artículos</h1>
      <p class="hk-page-subtitle">Investigaciones, write-ups de máquinas y notas de seguridad ofensiva y sistemas.</p>
    </div>
    <span class="hk-mono-badge" data-archive-count>{{ all_posts | size }} {% if all_posts.size == 1 %}artículo{% else %}artículos{% endif %}</span>
  </header>

  <div class="hk-archive-toolbar" role="region" aria-label="Filtrar y ordenar artículos">
    <div class="hk-archive-controls">
      <label for="hk-archive-filter" class="sr-only">Filtrar artículos por palabra clave</label>
      <div class="hk-inline-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>
        <input id="hk-archive-filter" type="search" class="hk-inline-search-input" placeholder="Filtrar por título o tema..." data-archive-search autocomplete="off">
      </div>

      <label for="hk-archive-sort" class="sr-only">Ordenar artículos</label>
      <select id="hk-archive-sort" class="hk-select" data-archive-sort>
        <option value="newest">Más recientes</option>
        <option value="oldest">Más antiguos</option>
      </select>
    </div>

    {%- if site.tags.size > 0 -%}
      <div class="hk-filter-chips" role="group" aria-label="Filtrar por etiqueta">
        <button type="button" class="hk-filter-chip is-active" data-filter-tag="all" aria-pressed="true">Todos ({{ all_posts | size }})</button>
        {%- assign _tag_names = "" | split: "" -%}
        {%- for _t in site.tags -%}
          {%- assign _tag_names = _tag_names | push: _t[0] -%}
        {%- endfor -%}
        {%- assign _tag_names = _tag_names | sort_natural -%}
        {%- for _tname in _tag_names -%}
          {%- assign _tslug = _tname | downcase | strip -%}
          {%- assign _tmeta = site.data.tags[_tslug] -%}
          {%- assign _tlabel = _tmeta.label | default: _tname -%}
          <button type="button" class="hk-filter-chip" data-filter-tag="{{ _tslug }}" aria-pressed="false">#{{ _tlabel }}</button>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>

  {%- if all_posts.size > 0 -%}
    <div class="hk-posts-grid" data-archive-grid>
      {%- for post in all_posts -%}
        {% include post-card.html post=post heading_level="h2" %}
      {%- endfor -%}
    </div>

    <div class="hk-empty-state" data-archive-empty role="status" hidden>
      <p class="hk-empty-title">[ SIN_COINCIDENCIAS ]</p>
      <p class="hk-empty-desc">Ningún artículo coincide con el filtro actual.</p>
      <button type="button" class="hk-btn hk-btn-secondary" data-archive-reset>Limpiar filtros</button>
    </div>
  {%- else -%}
    <div class="hk-empty-state" role="status">
      <p class="hk-empty-title">[ SIN_ARTÍCULOS ]</p>
      <p class="hk-empty-desc">Aún no hay publicaciones disponibles.</p>
    </div>
  {%- endif -%}
</section>
