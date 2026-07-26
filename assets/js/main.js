/* Mawqoot — shared site behavior: language toggle, theme toggle, scroll reveal */
(function () {
  'use strict';

  var STORAGE_LANG = 'iqamaLang';
  var STORAGE_THEME = 'iqamaTheme';
  var heroDemoState = 'prayer';
  var refreshHeroDemo = function () {};
  var refreshPrayerCountdown = function () {};

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

    var navToggle = document.getElementById('navToggle');
    if (navToggle) navToggle.setAttribute('aria-label', ar ? 'القائمة' : 'Menu');

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

  /* ---------- Mobile nav ---------- */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var panel = document.getElementById('navLinks');
    if (!toggle || !panel) return;

    function setOpen(open) {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Close after choosing a destination.
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Close on outside click / Escape.
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset when the layout returns to desktop.
    var desktop = window.matchMedia('(min-width: 901px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
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

  /* ---------- Hero countdown + demo ---------- */
  function timeToSeconds(value) {
    var parts = value.split(':');
    return (Number(parts[0]) * 3600) + (Number(parts[1]) * 60);
  }

  function formatClock(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  function buildPrayerSchedule() {
    return [
      { key: 'fajr', ar: 'الفجر', en: 'Fajr', time: '04:07' },
      { key: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', time: '12:42' },
      { key: 'asr', ar: 'العصر', en: 'Asr', time: '15:58' },
      { key: 'maghrib', ar: 'المغرب', en: 'Maghrib', time: '19:43' },
      { key: 'isha', ar: 'العشاء', en: 'Isha', time: '21:05' }
    ];
  }

  function getPrayerState(now, schedule) {
    var nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var today = schedule.map(function (item) {
      return {
        key: item.key,
        ar: item.ar,
        en: item.en,
        time: item.time,
        seconds: timeToSeconds(item.time)
      };
    });

    var next = today.find(function (item) { return item.seconds > nowSeconds; });
    var previous = null;
    if (!next) {
      next = today[0];
      previous = today[today.length - 1];
      return {
        next: next,
        previous: previous,
        remaining: (24 * 3600 - nowSeconds) + next.seconds,
        total: (24 * 3600 - previous.seconds) + next.seconds
      };
    }

    var idx = today.indexOf(next);
    previous = idx > 0 ? today[idx - 1] : today[today.length - 1];
    return {
      next: next,
      previous: previous,
      remaining: next.seconds - nowSeconds,
      total: next.seconds - previous.seconds
    };
  }

  function setTextPair(el, ar, en, lang) {
    if (!el) return;
    el.setAttribute('data-ar', ar);
    el.setAttribute('data-en', en);
    replaceText(el, lang === 'ar' ? ar : en);
  }

  function initHeroCountdown() {
    var countPrayer = document.getElementById('countdownPrayer');
    var countTime = document.getElementById('countdownTime');
    var countFill = document.getElementById('countdownFill');
    var futureCountdown = document.getElementById('futureCountdown');
    var futurePrayer = document.getElementById('futurePrayer');
    if (!countPrayer && !countTime && !futureCountdown) return;

    refreshPrayerCountdown = function () {
      var schedule = buildPrayerSchedule();
      var state = getPrayerState(new Date(), schedule);
      var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
      if (countPrayer) setTextPair(countPrayer, state.next.ar, state.next.en, lang);
      if (futurePrayer) setTextPair(futurePrayer, state.next.ar, state.next.en, lang);
      if (countTime) replaceText(countTime, formatClock(state.remaining * 1000));
      if (futureCountdown) replaceText(futureCountdown, formatClock(state.remaining * 1000));
      if (countFill) countFill.style.width = Math.max(6, Math.min(100, (1 - (state.remaining / Math.max(state.total, 1))) * 100)) + '%';
    };

    // Tick only while the tab is visible — no point burning a timer in a
    // background tab, and the display is refreshed the moment it returns.
    var timer = null;
    function start() { if (!timer) timer = window.setInterval(refreshPrayerCountdown, 1000); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); }
      else { refreshPrayerCountdown(); start(); }
    });

    refreshPrayerCountdown();
    start();
  }

  function initHeroDemo() {
    var demoButtons = document.querySelectorAll('[data-demo]');
    if (!demoButtons.length) return;

    var frontTitle = document.getElementById('demoFrontTitle');
    var frontPill = document.getElementById('demoFrontPill');
    var frontPrimary = document.getElementById('demoFrontPrimary');
    var frontBody = document.getElementById('demoFrontBody');
    var backTitle = document.getElementById('demoBackTitle');
    var backPill = document.getElementById('demoBackPill');
    var backPrimary = document.getElementById('demoBackPrimary');
    var backBody = document.getElementById('demoBackBody');
    var heroFloatLabel = document.getElementById('heroFloatLabel');
    var heroFloatText = document.getElementById('heroFloatText');
    var demoFrontPanel = document.getElementById('demoFrontPanel');
    var demoTimeList = document.getElementById('demoTimeList');
    var demoBackList = document.getElementById('demoBackList');

    var configs = {
      prayer: {
        front: {
          titleAr: 'مواقيت الصلاة',
          titleEn: 'Prayer Times',
          pillAr: 'الصلاة القادمة',
          pillEn: 'Next prayer',
          primaryAr: 'العصر',
          primaryEn: 'Asr',
          bodyAr: 'متبقي 01:24',
          bodyEn: '01:24 remaining'
        },
        back: {
          titleAr: 'القرآن الكريم',
          titleEn: 'Quran Reader',
          pillAr: 'الورد اليومي',
          pillEn: 'Daily portion',
          primaryAr: 'سورة الكهف',
          primaryEn: 'Surah Al-Kahf',
          bodyAr: 'حفظ هادئ مع تلاوة واضحة ومتابعة تقدّم بسيطة.',
          bodyEn: 'A calm reading flow with clear recitation and progress tracking.'
        },
        floatAr: 'تجربة موحّدة ومريحة',
        floatEn: 'One unified, calmer experience'
      },
      quran: {
        front: {
          titleAr: 'القرآن الكريم',
          titleEn: 'Quran Reader',
          pillAr: 'صفحة اليوم',
          pillEn: "Today's page",
          primaryAr: 'الصفحة 284',
          primaryEn: 'Page 284',
          bodyAr: 'تقدم ثابت وتلاوة واضحة مع متابعة الختمة.',
          bodyEn: 'Steady progress with clear recitation and Khatma tracking.'
        },
        back: {
          titleAr: 'الأذكار',
          titleEn: 'Athkar',
          pillAr: 'صباح ومساء',
          pillEn: 'Morning and evening',
          primaryAr: 'أذكار الصباح',
          primaryEn: 'Morning Athkar',
          bodyAr: 'تذكير لطيف يبدأ اليوم بهدوء واتساق.',
          bodyEn: 'A gentle reminder that starts the day calmly and consistently.'
        },
        floatAr: 'قراءة أهدأ وأوضح',
        floatEn: 'Calmer, clearer reading'
      },
      mosque: {
        front: {
          titleAr: 'المساجد القريبة',
          titleEn: 'Nearby Mosques',
          pillAr: 'أقرب نتيجة',
          pillEn: 'Closest result',
          primaryAr: 'مسجد النور',
          primaryEn: 'Al-Noor Mosque',
          bodyAr: '12 دقيقة سيراً مع اتجاه واضح على الخريطة.',
          bodyEn: '12 minutes on foot with a clear map direction.'
        },
        back: {
          titleAr: 'اتجاه القبلة',
          titleEn: 'Qibla direction',
          pillAr: 'دقة عالية',
          pillEn: 'High accuracy',
          primaryAr: '145°',
          primaryEn: '145°',
          bodyAr: 'بوصلة لطيفة بقراءة سريعة للاتجاه.',
          bodyEn: 'A smooth compass with a quick direction readout.'
        },
        floatAr: 'العثور على المكان الأنسب',
        floatEn: 'Find the right place quickly'
      },
      community: {
        front: {
          titleAr: 'تحديثات المجتمع',
          titleEn: 'Community updates',
          pillAr: 'إعلان المسجد',
          pillEn: 'Mosque notice',
          primaryAr: 'درس بعد المغرب',
          primaryEn: 'Maghrib lecture',
          bodyAr: 'تنبيه بسيط للأحداث والمواعيد القريبة.',
          bodyEn: 'A simple notice for nearby events and timings.'
        },
        back: {
          titleAr: 'المناسبات الإسلامية',
          titleEn: 'Islamic events',
          pillAr: 'التقويم الهجري',
          pillEn: 'Hijri calendar',
          primaryAr: 'ليلة الجمعة',
          primaryEn: 'Thursday night',
          bodyAr: 'ملاحظات خفيفة تربط العبادة بالمجتمع.',
          bodyEn: 'Lightweight notes that connect worship and community.'
        },
        floatAr: 'المجتمع حولك في مكان واحد',
        floatEn: 'Community around you, together'
      }
    };

    function renderList(items, lang) {
      if (!demoTimeList) return;
      demoTimeList.innerHTML = '';
      items.forEach(function (item, index) {
        var row = document.createElement('div');
        if (index === 2) row.className = 'time-list--active';
        var label = document.createElement('span');
        var value = document.createElement('strong');
        label.setAttribute('data-ar', item.ar);
        label.setAttribute('data-en', item.en);
        value.textContent = item.time;
        replaceText(label, lang === 'ar' ? item.ar : item.en);
        row.appendChild(label);
        row.appendChild(value);
        demoTimeList.appendChild(row);
      });
    }

    function refreshDemo() {
      var cfg = configs[heroDemoState];
      var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
      if (!cfg) return;

      setTextPair(frontTitle, cfg.front.titleAr, cfg.front.titleEn, lang);
      setTextPair(frontPill, cfg.front.pillAr, cfg.front.pillEn, lang);
      setTextPair(frontPrimary, cfg.front.primaryAr, cfg.front.primaryEn, lang);
      setTextPair(frontBody, cfg.front.bodyAr, cfg.front.bodyEn, lang);

      setTextPair(backTitle, cfg.back.titleAr, cfg.back.titleEn, lang);
      setTextPair(backPill, cfg.back.pillAr, cfg.back.pillEn, lang);
      setTextPair(backPrimary, cfg.back.primaryAr, cfg.back.primaryEn, lang);
      setTextPair(backBody, cfg.back.bodyAr, cfg.back.bodyEn, lang);

      setTextPair(heroFloatLabel, cfg.front.pillAr, cfg.front.pillEn, lang);
      setTextPair(heroFloatText, cfg.floatAr, cfg.floatEn, lang);

      var panel = demoFrontPanel;
      if (panel) panel.classList.remove('demo-shift');
      if (panel) {
        // Force a restart of the shift animation.
        void panel.offsetWidth;
        panel.classList.add('demo-shift');
      }

      var items = [];
      if (heroDemoState === 'prayer') {
        items = [
          { ar: 'الفجر', en: 'Fajr', time: '04:07' },
          { ar: 'الظهر', en: 'Dhuhr', time: '12:42' },
          { ar: 'العصر', en: 'Asr', time: '15:58' },
          { ar: 'المغرب', en: 'Maghrib', time: '19:43' }
        ];
      } else if (heroDemoState === 'quran') {
        items = [
          { ar: 'الورد اليومي', en: 'Daily portion', time: '12 pgs' },
          { ar: 'التفسير', en: 'Tafseer', time: 'On' },
          { ar: 'الختمة', en: 'Khatma', time: '68%' },
          { ar: 'الاستماع', en: 'Listening', time: 'Ready' }
        ];
      } else if (heroDemoState === 'mosque') {
        items = [
          { ar: 'المسجد الأقرب', en: 'Closest mosque', time: '12 min' },
          { ar: 'الاتجاه', en: 'Direction', time: '145°' },
          { ar: 'المسافة', en: 'Distance', time: '1.6 km' },
          { ar: 'الخريطة', en: 'Map', time: 'Live' }
        ];
      } else {
        items = [
          { ar: 'حدث اليوم', en: 'Today event', time: '19:00' },
          { ar: 'الإشعار', en: 'Notice', time: 'New' },
          { ar: 'التقويم', en: 'Calendar', time: 'Hijri' },
          { ar: 'المجتمع', en: 'Community', time: 'Open' }
        ];
      }
      renderList(items, lang);
    }

    refreshHeroDemo = refreshDemo;
    refreshDemo();

    demoButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        heroDemoState = button.getAttribute('data-demo') || 'prayer';
        demoButtons.forEach(function (other) {
          var active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        refreshDemo();
      });
    });
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
    initMobileNav();
    initReveal();
    initHeroCountdown();
    initHeroDemo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
