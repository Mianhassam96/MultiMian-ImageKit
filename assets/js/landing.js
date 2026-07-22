// MultiMian ImageKit — Shared Landing Page JS

// ── Dark mode ────────────────────────────────────────────────
(function() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('lpDarkBtn');
    if (!btn) return;
    btn.textContent = saved === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      btn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  });
})();

// ── FAQ accordion ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.lp-faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.lp-faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.lp-faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.lp-faq-q').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  // Scroll animation
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lp-visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.lp-step, .lp-feature, .lp-related-card, .lp-why-item').forEach(el => {
      el.style.opacity = '0'; el.style.transform = 'translateY(14px)';
      el.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(.22,1,.36,1)';
      obs.observe(el);
    });
  }
});

// When elements become visible
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = '.lp-visible { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
});
