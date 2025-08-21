source "https://rubygems.org"
# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!
# gem "jekyll", "~> 4.4.1"
# This is the default theme for new Jekyll sites. You may change this to anything you like.
# gem "minima", "~> 2.5"
# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins
# If you have any plugins, put them here!
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"          # Feed RSS
  gem "jekyll-sitemap", "~> 1.4"        # Mapa del sitio
  gem "jekyll-seo-tag", "~> 2.8"        # Meta tags SEO
  gem "jekyll-sass-converter", "~> 3.0" # Soporte para Sass
  gem "jekyll-archives", "~> 2.2"       # Archivos por categorías/tags
  gem "jekyll-compose", "~> 0.12"       # Herramientas para escritura
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
  gem "wdm", "~> 0.1"                   # Monitor de cambios en Windows
  gem "http_parser.rb", "~> 0.6.0"      # Solo para JRuby
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock `http_parser.rb` gem to `v0.6.x` on JRuby builds since newer versions of the gem
# do not have a Java counterpart.
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]


gem "sassc", "~> 2.4"                   # Compilador Sass más rápido
gem "autoprefixer-rails", "~> 10.4"     # Prefixes CSS

gem "jekyll-paginate", "~> 1.1"

gem "jekyll-paginate-v2", "~> 3.0"
