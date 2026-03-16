(function () {
  'use strict';

  var ICONS = {
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>'
  };

  var testCurrent = 0;
  var testTotal = 0;

  async function init() {
    try {
      var res = await fetch('content/home.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load: ' + res.status);
      var data = await res.json();

      renderHero(data.hero);
      renderAbout(data.about);
      renderServices(data.services);
      renderWhyUs(data.whyUs);
      renderBeforeAfter(data.whyUs && data.whyUs.beforeAfter);
      renderProjects(data.projects);
      renderTestimonials(data.testimonials);
      initSliders();
      attachTestNav();
    } catch (err) {
      console.error(err);
    }
  }

  function renderHero(d) {
    var el = document.getElementById('hero-content');
    if (!el) return;
    el.textContent = '';

    var bg = document.querySelector('.hero-bg');
    if (bg) {
      bg.textContent = '';
      if (d.backgroundImage) {
        var heroImg = document.createElement('img');
        heroImg.src = d.backgroundImage;
        heroImg.alt = '';
        heroImg.loading = 'eager';
        heroImg.decoding = 'async';
        heroImg.fetchPriority = 'high';
        bg.appendChild(heroImg);
      }
    }

    var label = document.createElement('div');
    label.className = 'hero-label';
    label.textContent = d.label;

    var title = document.createElement('h1');
    title.className = 'hero-title';
    title.textContent = d.title;

    var sub = document.createElement('p');
    sub.className = 'hero-subtitle';
    sub.textContent = d.subtitle;

    el.appendChild(label);
    el.appendChild(title);
    el.appendChild(sub);

    if (d.stats && d.stats.length >= 2) {
      var left = document.getElementById('hero-stat-left');
      var right = document.getElementById('hero-stat-right');
      if (left) { left.querySelector('.hero-stat-label').textContent = d.stats[0].label; left.querySelector('.hero-stat-value').textContent = d.stats[0].value; }
      if (right) { right.querySelector('.hero-stat-label').textContent = d.stats[1].label; right.querySelector('.hero-stat-value').textContent = d.stats[1].value; }
    }
  }

  function renderAbout(d) {
    var heading = document.getElementById('about-heading');
    var stats = document.getElementById('about-stats');
    var desc = document.getElementById('about-desc');
    if (!heading || !stats || !desc) return;
    heading.textContent = '';
    stats.textContent = '';

    heading.textContent = d.heading + ' ';
    var muted = document.createElement('span');
    muted.className = 'muted';
    muted.textContent = d.headingMuted;
    heading.appendChild(muted);

    if (Array.isArray(d.stats)) {
      for (var i = 0; i < d.stats.length; i++) {
        var s = d.stats[i];
        var div = document.createElement('div');
        var val = document.createElement('div');
        val.className = 'about-stat-value';
        val.textContent = s.value;
        var lab = document.createElement('div');
        lab.className = 'about-stat-label';
        lab.textContent = s.label;
        div.appendChild(val);
        div.appendChild(lab);
        stats.appendChild(div);
      }
    }

    desc.textContent = d.description;
  }

  function renderServices(d) {
    var heading = document.getElementById('svc-heading');
    var desc = document.getElementById('svc-desc');
    var accordion = document.getElementById('svc-accordion');
    if (!heading || !accordion) return;
    accordion.textContent = '';

    heading.textContent = d.heading;
    if (desc) desc.textContent = d.description;

    if (d.imageTags) {
      var tagsEl = document.getElementById('svc-image-tags');
      if (tagsEl) {
        tagsEl.textContent = '';
        for (var t = 0; t < d.imageTags.length; t++) {
          var tag = document.createElement('span');
          tag.className = 'svc-image-tag';
          tag.textContent = d.imageTags[t];
          tagsEl.appendChild(tag);
        }
      }
    }

    if (Array.isArray(d.items)) {
      for (var i = 0; i < d.items.length; i++) {
        var item = d.items[i];
        var card = document.createElement('div');
        card.className = 'svc-card' + (i === 0 ? ' active' : '');
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('data-index', i);
        card.setAttribute('aria-expanded', i === 0 ? 'true' : 'false');

        card.innerHTML = '<div class="svc-card-top"><div class="svc-card-left"><span class="svc-card-num">' + (i + 1) + '</span><span class="svc-card-title"></span></div><div class="svc-card-arrow" aria-hidden="true">' + ICONS.arrow + '</div></div><div class="svc-card-desc"><p></p></div>';
        card.querySelector('.svc-card-title').textContent = item.title;
        card.querySelector('.svc-card-desc p').textContent = item.description;
        accordion.appendChild(card);
      }
    }

    accordion.addEventListener('click', function (e) {
      var card = e.target.closest('.svc-card');
      if (!card) return;
      var wasActive = card.classList.contains('active');
      var all = accordion.querySelectorAll('.svc-card');
      for (var j = 0; j < all.length; j++) {
        all[j].classList.remove('active');
        all[j].setAttribute('aria-expanded', 'false');
      }
      if (!wasActive) {
        card.classList.add('active');
        card.setAttribute('aria-expanded', 'true');
      }
    });

    accordion.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var card = e.target.closest('.svc-card');
        if (card) { e.preventDefault(); card.click(); }
      }
    });
  }

  function renderWhyUs(d) {
    var heading = document.getElementById('why-heading');
    var desc = document.getElementById('why-desc');
    var grid = document.getElementById('why-cards');
    if (!heading || !grid) return;
    grid.textContent = '';

    heading.textContent = d.heading;
    if (desc) desc.textContent = d.description;

    if (Array.isArray(d.cards)) {
      for (var i = 0; i < d.cards.length; i++) {
        var c = d.cards[i];
        var card = document.createElement('div');
        card.className = 'why-card';

        var icon = document.createElement('div');
        icon.className = 'why-card-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = ICONS[c.icon] || ICONS.check;

        var title = document.createElement('div');
        title.className = 'why-card-title';
        title.textContent = c.title;

        var descEl = document.createElement('div');
        descEl.className = 'why-card-desc';
        descEl.textContent = c.description;

        card.appendChild(icon);
        card.appendChild(title);
        card.appendChild(descEl);
        grid.appendChild(card);
      }
    }
  }

  function renderBeforeAfter(items) {
    var grid = document.getElementById('ba-grid');
    if (!grid) return;
    grid.textContent = '';

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    for (var i = 0; i < items.length; i++) {
      grid.appendChild(buildBeforeAfterSlider(items[i], i));
    }
  }

  function buildBeforeAfterSlider(item, index) {
    var slider = document.createElement('div');
    slider.className = 'ba-slider';
    slider.setAttribute('role', 'slider');
    slider.setAttribute('tabindex', '0');
    slider.setAttribute('aria-label', 'Before and after image comparison ' + (index + 1));
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '100');
    slider.dataset.split = '50';
    slider.style.setProperty('--split', '50%');

    var afterLayer = document.createElement('div');
    afterLayer.className = 'ba-media ba-media-after';
    afterLayer.appendChild(buildBeforeAfterImage(item && item.after, 'After image'));

    var beforeReveal = document.createElement('div');
    beforeReveal.className = 'ba-before-reveal';
    beforeReveal.appendChild(buildBeforeAfterImage(item && item.before, 'Before image'));

    var handle = document.createElement('div');
    handle.className = 'ba-handle';
    handle.setAttribute('aria-hidden', 'true');

    var handleCircle = document.createElement('div');
    handleCircle.className = 'ba-handle-circle';
    handleCircle.innerHTML = '<div class="ba-arr ba-arr-l"></div><div class="ba-arr ba-arr-r"></div>';
    handle.appendChild(handleCircle);

    var beforeLabel = document.createElement('span');
    beforeLabel.className = 'ba-label ba-label-b';
    beforeLabel.textContent = 'Before';

    var afterLabel = document.createElement('span');
    afterLabel.className = 'ba-label ba-label-a';
    afterLabel.textContent = 'After';

    slider.appendChild(afterLayer);
    slider.appendChild(beforeReveal);
    slider.appendChild(handle);
    slider.appendChild(beforeLabel);
    slider.appendChild(afterLabel);
    updateBeforeAfterSlider(slider, 0.5);

    return slider;
  }

  function buildBeforeAfterImage(src, alt) {
    var wrap = document.createElement('div');
    wrap.className = 'ba-media-inner';

    if (typeof src === 'string' && src) {
      var img = document.createElement('img');
      img.className = 'ba-image';
      img.src = src;
      img.alt = alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', function () {
        wrap.classList.add('is-placeholder');
        wrap.textContent = '';

        var placeholder = document.createElement('div');
        placeholder.className = 'ba-image-placeholder';
        wrap.appendChild(placeholder);
      });
      wrap.appendChild(img);
    } else {
      wrap.classList.add('is-placeholder');
      var placeholder = document.createElement('div');
      placeholder.className = 'ba-image-placeholder';
      wrap.appendChild(placeholder);
    }

    return wrap;
  }

  function updateBeforeAfterSlider(slider, ratio) {
    var clamped = Math.max(0, Math.min(1, ratio));
    var percent = Math.round(clamped * 100);
    slider.dataset.split = String(percent);
    slider.style.setProperty('--split', percent + '%');
    slider.setAttribute('aria-valuenow', String(percent));
    slider.setAttribute('aria-valuetext', percent + '% before visible');
  }

  function renderProjects(d) {
    var heading = document.getElementById('proj-heading');
    var desc = document.getElementById('proj-desc');
    if (heading) heading.textContent = d.heading;
    if (desc) desc.textContent = d.description;

    var bigType = document.getElementById('proj-big-type');
    var bigTitle = document.getElementById('proj-big-title');
    var bigDesc = document.getElementById('proj-big-desc');
    var bigLink = document.getElementById('proj-big-link');
    if (bigType) bigType.textContent = d.featured.type;
    if (bigTitle) bigTitle.textContent = d.featured.title;
    if (bigDesc) bigDesc.textContent = d.featured.description;
    if (bigLink) bigLink.href = 'case-study-detail.html?id=' + d.featured.id;

    var grid = document.getElementById('proj-small-grid');
    if (grid && Array.isArray(d.items)) {
      grid.textContent = '';
      for (var i = 0; i < d.items.length; i++) {
        var p = d.items[i];
        var a = document.createElement('a');
        a.href = 'case-study-detail.html?id=' + p.id;
        a.className = 'proj-small';
        a.innerHTML = '<div class="proj-small-image"><div class="proj-small-image-ph"></div></div><div class="proj-small-type"></div><div class="proj-small-title"></div>';
        a.querySelector('.proj-small-type').textContent = p.type;
        a.querySelector('.proj-small-title').textContent = p.title;
        grid.appendChild(a);
      }
    }
  }

  function renderTestimonials(items) {
    var track = document.getElementById('test-track');
    var dots = document.getElementById('test-dots');
    if (!track || !Array.isArray(items) || items.length === 0) return;
    track.textContent = '';
    if (dots) dots.textContent = '';

    testTotal = items.length;

    for (var i = 0; i < items.length; i++) {
      var slide = document.createElement('div');
      slide.className = 'test-slide';

      var q = document.createElement('p');
      q.className = 'test-quote';
      q.textContent = '\u201C' + items[i].quote + '\u201D';

      var author = document.createElement('div');
      author.className = 'test-author';
      author.textContent = items[i].author;

      var role = document.createElement('div');
      role.className = 'test-role';
      role.textContent = items[i].role;

      slide.appendChild(q);
      slide.appendChild(author);
      slide.appendChild(role);
      track.appendChild(slide);

      if (dots) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'test-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        dot.dataset.index = String(i);
        dots.appendChild(dot);
      }
    }
  }

  function initSliders() {
    document.querySelectorAll('.ba-slider').forEach(function (slider) {
      var activePointerId = null;

      function updatePos(clientX) {
        var rect = slider.getBoundingClientRect();
        var ratio = rect.width ? (clientX - rect.left) / rect.width : 0.5;
        updateBeforeAfterSlider(slider, ratio);
      }

      slider.addEventListener('pointerdown', function (e) {
        activePointerId = e.pointerId;
        slider.setPointerCapture(e.pointerId);
        updatePos(e.clientX);
      });

      slider.addEventListener('pointermove', function (e) {
        if (activePointerId !== e.pointerId) return;
        updatePos(e.clientX);
      });

      slider.addEventListener('pointerup', function (e) {
        if (activePointerId !== e.pointerId) return;
        activePointerId = null;
        slider.releasePointerCapture(e.pointerId);
      });

      slider.addEventListener('pointercancel', function (e) {
        if (activePointerId !== e.pointerId) return;
        activePointerId = null;
        slider.releasePointerCapture(e.pointerId);
      });

      slider.addEventListener('keydown', function (e) {
        var current = parseInt(slider.dataset.split || '50', 10) / 100;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          updateBeforeAfterSlider(slider, current - 0.05);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          updateBeforeAfterSlider(slider, current + 0.05);
        } else if (e.key === 'Home') {
          e.preventDefault();
          updateBeforeAfterSlider(slider, 0);
        } else if (e.key === 'End') {
          e.preventDefault();
          updateBeforeAfterSlider(slider, 1);
        }
      });
    });
  }

  function moveTestSlide(dir) {
    var track = document.getElementById('test-track');
    var dots = document.getElementById('test-dots');
    if (!track) return;
    testCurrent = (testCurrent + dir + testTotal) % testTotal;
    track.style.transform = 'translateX(-' + (testCurrent * 100) + '%)';
    if (dots) {
      var allDots = dots.querySelectorAll('.test-dot');
      for (var i = 0; i < allDots.length; i++) allDots[i].classList.toggle('active', i === testCurrent);
    }
  }

  function attachTestNav() {
    var prev = document.getElementById('test-prev');
    var next = document.getElementById('test-next');
    var dots = document.getElementById('test-dots');
    var slider = document.querySelector('.test-slider');
    if (prev) prev.addEventListener('click', function () { moveTestSlide(-1); });
    if (next) next.addEventListener('click', function () { moveTestSlide(1); });
    if (dots) {
      dots.addEventListener('click', function (e) {
        var dot = e.target.closest('.test-dot');
        if (!dot) return;
        var index = parseInt(dot.dataset.index || '0', 10);
        if (isNaN(index)) return;
        testCurrent = index;
        moveTestSlide(0);
      });
    }

    if (slider) {
      var startX = null;
      var activePointerId = null;

      slider.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startX = e.clientX;
        activePointerId = e.pointerId;
      });

      slider.addEventListener('pointerup', function (e) {
        if (activePointerId !== e.pointerId || startX === null) return;
        var deltaX = e.clientX - startX;
        startX = null;
        activePointerId = null;

        if (Math.abs(deltaX) < 36) return;
        moveTestSlide(deltaX < 0 ? 1 : -1);
      });

      slider.addEventListener('pointercancel', function (e) {
        if (activePointerId !== e.pointerId) return;
        startX = null;
        activePointerId = null;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
