---
layout: default
title: Actividades
description: Charlas y presentaciones en conferencias.
permalink: /activities/
---

<!-- ============ VISTA: ACTIVIDADES ============ -->
<section class="hk-posts-section">
  <div class="hk-section-header">
    <h1 class="hk-section-title"><span class="hk-bracket" aria-hidden="true">[</span> ACTIVIDADES <span class="hk-bracket" aria-hidden="true">]</span></h1>
    <div class="hk-section-line" aria-hidden="true"></div>
    <span class="hk-section-count">{{ site.data.activities | size }}</span>
  </div>

  {%- assign activities = site.data.activities | sort: 'date' | reverse -%}
  {%- if activities.size > 0 -%}
    <div class="hk-posts-grid">
      {%- assign bg_array = "matrix,glitch,scan,noise" | split: ',' -%}
      {%- for activity in activities -%}
        {%- assign bg_index = forloop.index0 | modulo: 4 -%}
        {%- assign data_bg = bg_array[bg_index] -%}
        {% include activity-card.html activity=activity bg=data_bg heading_level="h2" %}
      {%- endfor -%}
    </div>
  {%- else -%}
    <div class="hk-empty-state" role="status">
      <p class="hk-empty-title">[ SIN_ACTIVIDADES ]</p>
      <p class="hk-empty-desc">No hay charlas ni eventos registrados todavía.</p>
    </div>
  {%- endif -%}
</section>
