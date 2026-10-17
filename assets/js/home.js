// Home page - Animation for post cards
// Progressive enhancement: las tarjetas son visibles por defecto (CSS).
// Solo las ocultamos si vamos a animar, y respetamos prefers-reduced-motion.
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = document.querySelectorAll('.post-card');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    // Sin animación: todo visible de inmediato.
    cards.forEach(card => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  cards.forEach(card => {
    card.classList.add('pre-reveal');
    observer.observe(card);
  });
});
