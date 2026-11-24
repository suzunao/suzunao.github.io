---
layout: default
title: Artículos
description: Todos los artículos del blog sobre hacking, cybersecurity y writeups de CTF.
permalink: /posts/
---

<!-- ============ VISTA: POSTS ============ -->
<section class="hk-posts-section">
  <div class="hk-section-header">
    <h1 class="hk-section-title"><span class="hk-bracket" aria-hidden="true">[</span> TODOS LOS ARTÍCULOS <span class="hk-bracket" aria-hidden="true">]</span></h1>
    <div class="hk-section-line" aria-hidden="true"></div>
    <span class="hk-section-count">{{ site.posts | size }}</span>
  </div>

  {%- if site.tags.size > 0 -%}
    <nav class="hk-tag-filter-bar" aria-label="Filtrar por etiqueta">
      <span class="hk-filter-label">Etiquetas:</span>
      {%- assign _tag_names = "" | split: "" -%}
      {%- for _t in site.tags -%}
        {%- assign _tag_names = _tag_names | push: _t[0] -%}
      {%- endfor -%}
      {%- assign _tag_names = _tag_names | sort_natural -%}
      {%- for _tname in _tag_names -%}
        {%- assign _tslug = _tname | downcase | strip -%}
        {%- assign _tmeta = site.data.tags[_tslug] -%}
        {%- assign _tlabel = _tmeta.label | default: _tname -%}
        {%- assign _ttone = _tmeta.tone | default: "green" -%}
        <a href="{{ '/tag/' | append: _tslug | append: '/' | relative_url }}" class="hk-tag" data-tone="{{ _ttone }}">#{{ _tlabel }}</a>
      {%- endfor -%}
    </nav>
  {%- endif -%}

  {%- assign all_posts = site.posts | sort: 'date' | reverse -%}
  {%- if all_posts.size > 0 -%}
    <div class="hk-posts-grid">
      {%- assign bg_array = "matrix,glitch,scan,noise" | split: ',' -%}
      {%- for post in all_posts -%}
        {%- assign bg_index = forloop.index0 | modulo: 4 -%}
        {%- assign data_bg = bg_array[bg_index] -%}
        {% include post-card.html post=post bg=data_bg heading_level="h2" %}
      {%- endfor -%}
    </div>
  {%- else -%}
    <div class="hk-empty-state" role="status">
      <p class="hk-empty-title">[ SIN_ARTÍCULOS ]</p>
      <p class="hk-empty-desc">Aún no hay publicaciones disponibles.</p>
    </div>
  {%- endif -%}
</section>
