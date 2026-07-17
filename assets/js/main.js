/* Mawqoot — shared site behavior: language toggle, theme toggle, scroll reveal */
(function () {
  'use strict';

  var STORAGE_LANG = 'iqamaLang';
  var STORAGE_THEME = 'iqamaTheme';

  /* ---------- Language ---------- */
  function replaceText(el, text) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) {
        n.nodeValue = text;
        return;
      }
    }
    el.textContent = text;
  }

  function applyLang(lang) {
    var ar = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-ar]').forEach(function (el) {
      var t = el.getAttribute('data-' + lang);
      if (t) replaceText(el, t);
    });

    var titleAr = document.documentElement.getAttribute('data-title-ar');
    var titleEn = document.documentElement.getAttribute('data-title-en');
    if (titleAr && titleEn) document.title = ar ? titleAr : titleEn;

    var langBtn = document.getElementById('langBtn');
    if (langBtn) {
      langBtn.textContent = ar ? 'English' : 'العربية';
      langBtn.setAttribute('aria-label', ar ? 'Switch to English' : 'التبديل إلى العربية');
    }

    try { localStorage.setItem(STORAGE_LANG, lang); } catch (e) {}
  }

  function toggleLang() {
    applyLang(document.documentElement.lang === 'ar' ? 'en' : 'ar');
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      var ar = document.documentElement.lang === 'ar';
      themeBtn.setAttribute('aria-label', theme === 'dark' ? (ar ? 'تفعيل الوضع الفاتح' : 'Switch to light mode') : (ar ? 'تفعيل الوضع الداكن' : 'Switch to dark mode'));
    }
    try { localStorage.setItem(STORAGE_THEME, theme); } catch (e) {}
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    if (!current) {
      current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  /* ---------- Nav scroll state ---------- */
  function initNavScroll() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    els.forEach(function (el) {
      var group = el.closest('.stagger');
      if (group) {
        var idx = Array.prototype.indexOf.call(group.children, el);
        el.style.setProperty('--i', idx);
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Init ---------- */
  function init() {
    var lang = 'ar';
    try {
      var saved = localStorage.getItem(STORAGE_LANG);
      if (saved) lang = saved;
    } catch (e) {}
    applyLang(lang);

    var theme = null;
    try { theme = localStorage.getItem(STORAGE_THEME); } catch (e) {}
    if (theme) applyTheme(theme);

    var langBtn = document.getElementById('langBtn');
    if (langBtn) langBtn.addEventListener('click', toggleLang);

    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    initNavScroll();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
