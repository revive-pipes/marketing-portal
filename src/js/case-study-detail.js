/**
 * Case Study Detail Page — Content Loader
 * Reads ?id= from URL, finds matching study in case-studies.json, renders full detail
 */

(function () {
  'use strict';

  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';

  function getStudyId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async function init() {
    try {
      var res = await fetch('content/case-studies.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load: ' + res.status);
      var data = await res.json();

      if (!data || !Array.isArray(data.studies)) {
        showNotFound();
        return;
      }

      var studyId = getStudyId();
      if (!studyId) {
        showNotFound();
        return;
      }

      var study = null;
      for (var i = 0; i < data.studies.length; i++) {
        if (data.studies[i].id === studyId) {
          study = data.studies[i];
          break;
        }
      }

      if (!study || !study.detail) {
        showNotFound();
        return;
      }

      document.title = study.title + ' — Revive Pipes';
      renderBackLink();
      renderHero(study);
      renderImage(study.detail);
      renderStats(study.stats);
      renderChallenge(study.detail.challenge);
      renderComparison(study.detail.traditional, study.detail.solution);

      if (study.hasVideo && study.detail.videoFile) {
        renderVideo();
      }

      if (study.detail.testimonial) {
        renderTestimonial(study.detail.testimonial);
      }

      renderCta(study.detail);

    } catch (err) {
      console.error(err);
      showError();
    }
  }

  function renderBackLink() {
    var el = document.getElementById('back-link');
    if (!el) return;
    var iconSpan = document.createElement('span');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.innerHTML = ICON_BACK;
    var text = document.createTextNode(' Return to Case Studies');
    el.appendChild(iconSpan);
    el.appendChild(text);
    el.href = 'case-studies.html';
  }

  function renderHero(study) {
    var el = document.getElementById('hero');
    if (!el) return;

    // Left column
    var left = document.createElement('div');
    left.className = 'detail-hero-left';

    var label = document.createElement('div');
    label.className = 'detail-hero-label';
    label.textContent = study.buildingType;

    var title = document.createElement('h1');
    title.className = 'detail-hero-title';

    // Split title intelligently — break at last space before midpoint
    var words = study.title.split(' ');
    var mid = Math.ceil(words.length / 2);
    var line1 = words.slice(0, mid).join(' ');
    var line2 = words.slice(mid).join(' ');

    title.appendChild(document.createTextNode(line1));
    if (line2) {
      title.appendChild(document.createElement('br'));
      var span2 = document.createElement('strong');
      span2.textContent = line2;
      title.appendChild(span2);
    }

    left.appendChild(label);
    left.appendChild(title);

    // Right column
    var right = document.createElement('p');
    right.className = 'detail-hero-summary';
    right.textContent = study.detail.heroSummary;

    el.appendChild(left);
    el.appendChild(right);
  }

  function renderImage(detail) {
    var el = document.getElementById('hero-image');
    if (!el) return;

    if (detail.heroImage) {
      var img = document.createElement('img');
      img.src = detail.heroImage;
      img.alt = 'Project photo';
      img.loading = 'eager';
      img.className = 'detail-image-photo';
      el.appendChild(img);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'detail-image-placeholder';
      el.appendChild(placeholder);
    }

    var label = document.createElement('span');
    label.className = 'detail-image-label';
    label.textContent = 'Project Photo';
    el.appendChild(label);
  }

  function renderStats(stats) {
    var el = document.getElementById('stats-bar');
    if (!el || !stats || stats.length === 0) return;

    for (var i = 0; i < stats.length; i++) {
      var item = document.createElement('div');
      item.className = 'detail-stat';

      var val = document.createElement('div');
      val.className = 'detail-stat-value';
      val.textContent = stats[i].value;

      var label = document.createElement('div');
      label.className = 'detail-stat-label';
      label.textContent = stats[i].label;

      item.appendChild(val);
      item.appendChild(label);
      el.appendChild(item);
    }
  }

  function renderChallenge(text) {
    var el = document.getElementById('challenge-text');
    if (!el || !text) return;
    el.textContent = text;
  }

  function renderComparison(traditional, solution) {
    var tradEl = document.getElementById('comp-traditional');
    var solEl = document.getElementById('comp-solution');
    if (!tradEl || !solEl) return;

    // Traditional items
    if (traditional && traditional.length > 0) {
      for (var i = 0; i < traditional.length; i++) {
        var li = document.createElement('li');
        var icon = document.createElement('span');
        icon.className = 'comp-icon';
        icon.innerHTML = ICON_X;

        var textWrap = document.createElement('span');
        var strong = document.createElement('strong');
        strong.textContent = traditional[i].label + ': ';
        var desc = document.createTextNode(traditional[i].description);
        textWrap.appendChild(strong);
        textWrap.appendChild(desc);

        li.appendChild(icon);
        li.appendChild(textWrap);
        tradEl.appendChild(li);
      }
    }

    // Solution heading
    var headingEl = document.getElementById('comp-solution-heading');
    if (headingEl && solution && solution.heading) {
      headingEl.textContent = solution.heading;
    }

    // Solution items
    if (solution && solution.items && solution.items.length > 0) {
      for (var j = 0; j < solution.items.length; j++) {
        var card = document.createElement('div');
        card.className = 'comp-sol-item';

        var h5 = document.createElement('h5');
        h5.textContent = solution.items[j].title;

        var p = document.createElement('p');
        p.textContent = solution.items[j].description;

        card.appendChild(h5);
        card.appendChild(p);
        solEl.appendChild(card);
      }
    }
  }

  function renderVideo() {
    var section = document.getElementById('video-section');
    if (section) {
      section.style.display = 'block';
    }
  }

  function renderTestimonial(testimonial) {
    var section = document.getElementById('testimonial-section');
    if (!section) return;
    section.style.display = 'block';

    var quoteEl = document.getElementById('testimonial-quote');
    var authorEl = document.getElementById('testimonial-author');

    if (quoteEl) quoteEl.textContent = '\u201C' + testimonial.quote + '\u201D';
    if (authorEl) authorEl.textContent = testimonial.author + ', ' + testimonial.organization;
  }

  function renderCta(detail) {
    var heading = document.getElementById('cta-heading');
    var desc = document.getElementById('cta-desc');
    var btn = document.getElementById('cta-btn');

    if (heading) heading.textContent = detail.ctaHeading || 'Ready to get started?';
    if (desc) desc.textContent = detail.ctaDescription || 'Discover how our trenchless solutions can protect your infrastructure.';
    if (btn) {
      var btnText = document.createTextNode((detail.ctaButton || 'Get in Touch') + ' ');
      btn.textContent = '';
      btn.appendChild(btnText);
      var iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.innerHTML = ICON_ARROW;
      btn.appendChild(iconSpan);
    }
  }

  function showNotFound() {
    var main = document.getElementById('detail-main');
    if (!main) return;
    main.textContent = '';
    var wrap = document.createElement('div');
    wrap.className = 'detail-not-found';
    var p = document.createElement('p');
    p.textContent = 'Case study not found.';
    var link = document.createElement('a');
    link.href = 'case-studies.html';
    link.textContent = 'Return to Case Studies';
    wrap.appendChild(p);
    wrap.appendChild(link);
    main.appendChild(wrap);
  }

  function showError() {
    var main = document.getElementById('detail-main');
    if (!main) return;
    main.textContent = '';
    var wrap = document.createElement('div');
    wrap.className = 'detail-error';
    wrap.textContent = 'Unable to load this case study. Please refresh or try again later.';
    main.appendChild(wrap);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
