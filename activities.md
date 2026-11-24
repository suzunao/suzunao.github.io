---
layout: default
title: Actividades
description: Charlas y presentaciones en conferencias.
permalink: /activities/
---

{%- assign activities = site.data.activities | sort: 'date' | reverse -%}
<section class="hk-archive-page">
  <header class="hk-page-header">
    <div>
      <p class="hk-kicker">// CHARLAS Y COMUNIDAD</p>
      <h1 class="hk-page-title">Actividades</h1>
      <p class="hk-page-subtitle">Presentaciones en conferencias, ponencias técnicas y divulgación en ciberseguridad.</p>
    </div>
    <span class="hk-mono-badge">{{ activities | size }} {% if activities.size == 1 %}actividad{% else %}actividades{% endif %}</span>
  </header>

  {%- if activities.size > 0 -%}
    <div class="hk-posts-grid hk-posts-grid--single">
      {%- for activity in activities -%}
        {% include activity-card.html activity=activity heading_level="h2" %}
      {%- endfor -%}
    </div>
  {%- else -%}
    <div class="hk-empty-state" role="status">
      <p class="hk-empty-title">[ SIN_ACTIVIDADES ]</p>
      <p class="hk-empty-desc">No hay charlas ni eventos registrados todavía.</p>
    </div>
  {%- endif -%}
</section>
