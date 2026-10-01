/*
 * site.js — vanilla runtime for the static HTML export.
 * Mirrors the React client components 1:1:
 *   MotionRuntime (Lenis, reveals, clip-path wipes, parallax, anchors)
 *   SiteHeader (scroll shadow, scroll-spy, mobile menu)
 *   Magnetic, TiltCard, Faq accordion, ZipCheck
 * All styling comes from the exported CSS; this file only toggles classes.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HEADER_OFFSET = -104;
  var isHome = !!document.getElementById('top');
  var lenis = null;

  /* ------------------------------------------------------------------ */
  /* Reveals + clip-path wipes (one shared IntersectionObserver)         */
  /* ------------------------------------------------------------------ */
  // Wipe layers are fully clipped at rest, so their parent section is observed.
  var marks = new Map();
  document.querySelectorAll('[data-reveal],[data-reveal-text],[data-wipe]').forEach(function (el) {
    var watch = el.hasAttribute('data-wipe') ? el.parentElement || el : el;
    var list = marks.get(watch) || [];
    list.push(el);
    marks.set(watch, list);
  });
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (marks.get(e.target) || []).forEach(function (el) {
          el.classList.add('is-in');
        });
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 }
  );
  marks.forEach(function (_, watch) {
    io.observe(watch);
  });

  /* ------------------------------------------------------------------ */
  /* Lenis smooth scroll + parallax                                       */
  /* ------------------------------------------------------------------ */
  var layers = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  function updateParallax() {
    var vh = window.innerHeight;
    layers.forEach(function (el) {
      var speed = parseFloat(el.getAttribute('data-parallax') || '0.2');
      var host = el.parentElement || el;
      var r = host.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var offset = (r.top + r.height / 2 - vh / 2) * speed * -1;
      el.style.transform = 'translate3d(0, ' + offset.toFixed(1) + 'px, 0)';
    });
  }

  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', updateParallax);
    var raf = function (t) {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  } else if (!reduce) {
    window.addEventListener('scroll', updateParallax, { passive: true });
  }
  if (!reduce) updateParallax();

  function scrollToEl(el, offset, immediate) {
    if (lenis) lenis.scrollTo(el, { offset: offset, immediate: !!immediate });
    else {
      var y = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
    }
  }

  /* Anchor links: "#id" and "index.html#id" on the home page */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a');
    if (!a || !isHome) return;
    var href = a.getAttribute('href') || '';
    var hash = href.charAt(0) === '#' ? href : href.indexOf('index.html#') === 0 ? href.slice(10) : '';
    if (!hash || hash === '#main') return;
    var el = hash === '#top' ? document.body : document.querySelector(hash);
    if (!el) return;
    ev.preventDefault();
    closeMenu();
    scrollToEl(el, hash === '#top' ? 0 : HEADER_OFFSET);
    history.replaceState(null, '', hash);
  });
  if (isHome && location.hash.length > 1) {
    var initial = document.querySelector(location.hash);
    if (initial) setTimeout(function () { scrollToEl(initial, HEADER_OFFSET, true); }, 60);
  }

  /* ------------------------------------------------------------------ */
  /* Header: scroll shadow, scroll-spy, mobile menu                        */
  /* ------------------------------------------------------------------ */
  var header = document.querySelector('header');
  var SHADOW = 'shadow-[0_12px_32px_-20px_rgba(51,52,99,0.45)]';
  var menuBtn = document.querySelector('button[aria-controls="mobile-nav"]');
  var menu = document.getElementById('mobile-nav');
  var menuOpen = false;
  var PATH_OPEN = 'M6 6l12 12M18 6 6 18';
  var PATH_CLOSED = 'M4 7h16M4 12h16M4 17h10';

  function syncShadow() {
    if (!header) return;
    header.classList.toggle(SHADOW, window.scrollY > 24 || menuOpen);
  }
  window.addEventListener('scroll', syncShadow, { passive: true });
  syncShadow();

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menuOpen = open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    var path = menuBtn.querySelector('path');
    if (path) path.setAttribute('d', open ? PATH_OPEN : PATH_CLOSED);
    ['max-h-[80vh]', 'opacity-100'].forEach(function (c) { menu.classList.toggle(c, open); });
    ['max-h-0', 'opacity-0'].forEach(function (c) { menu.classList.toggle(c, !open); });
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (lenis) open ? lenis.stop() : lenis.start();
    syncShadow();
  }
  function closeMenu() {
    if (menuOpen) setMenu(false);
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  if (menu) menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav[aria-label="Primary"] a'));
  function setActive(id) {
    navLinks.forEach(function (a) {
      var on = (a.getAttribute('href') || '').split('#')[1] === id;
      a.classList.toggle('text-summit', on);
      a.classList.toggle('text-slate', !on);
      a.classList.toggle('hover:text-summit', !on);
      var bar = a.querySelector('span');
      if (bar) {
        bar.classList.toggle('scale-x-100', on);
        bar.classList.toggle('scale-x-0', !on);
      }
    });
  }
  if (isHome) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    navLinks.forEach(function (a) {
      var id = (a.getAttribute('href') || '').split('#')[1];
      var sec = id && document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic buttons + 3D tilt cards                                     */
  /* ------------------------------------------------------------------ */
  function bindMagnetic(el, strength) {
    strength = strength || 0.28;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = el.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * strength;
      var y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.classList.add('is-pulling');
      el.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
    });
    el.addEventListener('pointerleave', function () {
      el.classList.remove('is-pulling');
      el.style.transform = '';
    });
  }
  document.querySelectorAll('.magnetic').forEach(function (el) { bindMagnetic(el); });

  document.querySelectorAll('.tilt').forEach(function (el) {
    var frame = 0;
    var max = 7;
    el.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var cx = e.clientX;
      var cy = e.clientY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        var px = (cx - r.left) / r.width;
        var py = (cy - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', ((px - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
    });
    el.addEventListener('pointerleave', function () {
      cancelAnimationFrame(frame);
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  /* ------------------------------------------------------------------ */
  /* FAQ accordion (one open at a time, first open by default)            */
  /* ------------------------------------------------------------------ */
  var faqButtons = Array.prototype.slice.call(document.querySelectorAll('button[id^="faq-q-"]'));
  var OPEN_ICON = ['rotate-45', 'border-teal', 'bg-teal', 'text-white'];
  var CLOSED_ICON = ['border-summit/15', 'text-summit'];
  function setFaq(btn, open) {
    btn.setAttribute('aria-expanded', String(open));
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.setAttribute('data-open', String(open));
    var icon = btn.querySelector('span[aria-hidden="true"]');
    if (icon) {
      OPEN_ICON.forEach(function (c) { icon.classList.toggle(c, open); });
      CLOSED_ICON.forEach(function (c) { icon.classList.toggle(c, !open); });
    }
  }
  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wasOpen = btn.getAttribute('aria-expanded') === 'true';
      faqButtons.forEach(function (b) { setFaq(b, false); });
      if (!wasOpen) setFaq(btn, true);
    });
  });

  /* ------------------------------------------------------------------ */
  /* ZIP availability pre-check (Florida ZIPs 32000–34999)                */
  /* ------------------------------------------------------------------ */
  var zipInput = document.querySelector('input[autocomplete="postal-code"]');
  if (zipInput && zipInput.form) {
    var form = zipInput.form;
    var msg = document.getElementById(zipInput.getAttribute('aria-describedby'));
    // Reuse the header's small navy CallButton markup so the result CTA is pixel-identical.
    var ctaTemplate = document.querySelector('header .magnetic');

    zipInput.addEventListener('input', function () {
      zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var zip = zipInput.value;
      msg.innerHTML = '';
      if (!/^\d{5}$/.test(zip)) {
        zipInput.setAttribute('aria-invalid', 'true');
        var err = document.createElement('p');
        err.className = 'mt-3 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-[#b42318]';
        err.textContent = 'Please enter a valid 5-digit ZIP code.';
        msg.appendChild(err);
        return;
      }
      zipInput.setAttribute('aria-invalid', 'false');
      var n = Number(zip);
      var fl = n >= 32000 && n <= 34999;

      var card = document.createElement('div');
      card.className =
        'hero-in mt-4 flex flex-col gap-4 rounded-2xl bg-white p-5 text-summit shadow-[0_18px_40px_-20px_rgba(51,52,99,0.8)] sm:flex-row sm:items-center';
      var p = document.createElement('p');
      p.className = 'flex-1 text-sm leading-relaxed text-slate';
      var strong = document.createElement('span');
      strong.className = 'font-semibold text-summit';
      if (fl) {
        strong.textContent = 'Summit Fiber serves communities in the ' + zip + ' area.';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(' Availability varies by address. Call to confirm service at your home and today’s pricing.'));
      } else {
        strong.textContent = 'Summit Broadband’s fiber network serves Florida communities.';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(' Call to confirm the options available for ZIP ' + zip + '.'));
      }
      card.appendChild(p);

      if (ctaTemplate) {
        var cta = ctaTemplate.cloneNode(true);
        cta.style.transform = '';
        var link = cta.querySelector('a');
        if (link) {
          // Replace the label text (last text node) with "Call to order".
          for (var i = link.childNodes.length - 1; i >= 0; i--) {
            if (link.childNodes[i].nodeType === 3) link.removeChild(link.childNodes[i]);
          }
          link.appendChild(document.createTextNode('Call to order'));
        }
        bindMagnetic(cta);
        card.appendChild(cta);
      }
      msg.appendChild(card);
    });
  }
})();
