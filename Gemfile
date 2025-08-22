source "https://rubygems.org"

# GitHub Pages gem: incluye Jekyll y todas las dependencias compatibles
gem "github-pages", group: :jekyll_plugins

# Plugins compatibles con GitHub Pages
group :jekyll_plugins do
  gem "jekyll-feed"        # Feed RSS
  gem "jekyll-sitemap"     # Mapa del sitio
  gem "jekyll-seo-tag"     # Meta tags SEO
  gem "jekyll-archives"    # Archivos por categorías/tags
  gem "jekyll-compose"     # Herramientas para escritura
  gem "jekyll-paginate"    # Paginación (usar solo 1 vez, v1.1 incluida en GitHub Pages)
end

# Configuración para Windows/JRuby
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
  gem "wdm", "~> 0.1"
  gem "http_parser.rb", "~> 0.6.0" # Solo para JRuby
end

# Performance booster en Windows
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

# NOTA: No declaramos sassc ni jekyll-sass-converter, GitHub Pages los incluye internamente
# No declarar autoprefixer-rails ni jekyll-paginate-v2 si quieres build automático en GitHub Pages
