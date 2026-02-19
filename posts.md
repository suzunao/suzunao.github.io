---
layout: default
title: Posts
permalink: /posts/
---

<!-- Posts Page -->
<section class="posts-section" id="posts" style="margin-bottom: 3rem;">
  <div class="section-header" style="margin-bottom: 1.5rem;">
    <h2 class="section-title" style="font-size: 1rem; font-weight: 600; color: #c9d1d9; margin-bottom: 0.5rem; letter-spacing: 2px;">
      <span style="color: #00ff41;">[</span> ALL POSTS <span style="color: #00ff41;">]</span>
    </h2>
    <div class="section-line" style="height: 2px; background: linear-gradient(90deg, #00ff41 0%, transparent 100%); width: 200px;"></div>
  </div>

  <div class="posts-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
    {% assign all_posts = site.posts | sort: 'date' | reverse %}
    {% for post in all_posts %}
    <article class="post-card" onclick="location.href='{{ post.url | relative_url }}'" style="background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(13, 17, 23, 0.85) 100%), url('{{ post.background | default: "/assets/img/icon/wall.jpg" | relative_url }}'); background-size: cover; background-position: center; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; cursor: pointer; transition: all 0.25s; min-height: 280px; display: flex; flex-direction: column;">
      
      <!-- Header: ID y Fecha -->
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: auto;">
        <span class="post-id" style="font-size: 0.75rem; color: rgba(255,255,255,0.6);">#{{ forloop.index | prepend: "00" | slice: -2, 2 }}</span>
        <span class="post-date" style="font-size: 0.75rem; color: #00ff41; font-weight: 600;">{{ post.date | date: "%Y-%m-%d" }}</span>
      </div>
      
      <!-- Título Principal -->
      <h3 class="post-title" style="font-size: 1.1rem; font-weight: 600; color: #ffffff; line-height: 1.4; margin: 0.5rem 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">{{ post.title }}</h3>
      
      <!-- Subtítulo / Descripción -->
      <p class="post-excerpt" style="font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.5; margin: 0 0 1rem 0;">{{ post.excerpt | strip_html | truncate: 80 }}</p>
      
      <!-- Author y Tags -->
      <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
        <!-- Author -->
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <img src="{{ post.author.avatar | default: '/assets/img/icon/Suzunao.png' | relative_url }}" alt="author" style="width: 24px; height: 24px; border-radius: 50%; border: 1px solid #00ff41;">
          <span style="font-size: 0.7rem; color: rgba(255,255,255,0.6);">{{ post.author.name | default: "Suzunao" }}</span>
        </div>
        
        <!-- Tags -->
        <div class="card-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          {% for tag in post.tags %}
            <span class="tag" data-tag="{{ tag }}" style="display: inline-block; padding: 0.2rem 0.5rem; font-size: 0.65rem; color: #00ff41; background: rgba(0, 255, 65, 0.1); border: 1px solid #00ff41; border-radius: 3px;">{{ tag }}</span>
          {% endfor %}
        </div>
      </div>
    </article>
    {% endfor %}
  </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', () => {
  // Mostrar todos los posts
  document.querySelectorAll('.post-card').forEach(card => {
    card.style.display = 'flex';
  });
});
</script>
