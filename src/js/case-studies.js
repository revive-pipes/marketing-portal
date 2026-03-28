/**
 * Case Studies Page — Content Loader
 * Reads content/case-studies.json and builds the page dynamically.
 */
(function () {
  'use strict';

  var CS_URL = 'content/case-studies.json';

  // Controlled SVG strings — not user data, safe for innerHTML within aria-hidden wrappers
  var ICON_BUILDING = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 21h18M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4M5 21V10.87M19 21V10.87"/></svg>';
  var ICON_ARROW    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var ICON_PLAY     = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>';

  async function init() {
    try {
      var res = await fetch(CS_URL, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load case studies: ' + res.status);
      var data = await res.json();
      renderPageHeader(data.pageHeader);
      renderStudies(data.studies);
    } catch (err) {
      console.error(err);
      showError();
    }
  }

  /* ---- Page Header ---- */

  function renderPageHeader(header) {
    var el = document.getElementById('page-header');
    if (!el || !header) return;

    var label = document.createElement('p');
    label.className = 'page-header-label';
    label.textContent = header.label;

    var title = document.createElement('h1');
    title.className = 'page-header-title';
    title.textContent = header.title;

    var desc = document.createElement('p');
    desc.className = 'page-header-desc';
    desc.textContent = header.description;

    el.appendChild(label);
    el.appendChild(title);
    el.appendChild(desc);
  }

  /* ---- Studies List ---- */

  function renderStudies(studies) {
    var container = document.getElementById('studies-container');
    if (!container) return;

    container.textContent = '';

    if (!Array.isArray(studies) || studies.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'cs-empty';
      empty.textContent = 'No case studies available yet.';
      container.appendChild(empty);
      return;
    }

    var fragment = document.createDocumentFragment();
    studies.forEach(function (study, i) {
      fragment.appendChild(buildStudyCard(study, i));
    });
    container.appendChild(fragment);

    // Delegate video button clicks only — read links navigate natively as <a> elements
    container.addEventListener('click', function (e) {
      var videoBtn = e.target.closest('[data-action="video"]');
      if (videoBtn) {
        // TODO: open video modal when built
        console.log('Play video for:', videoBtn.dataset.id);
      }
    });

    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var videoBtn = e.target.closest('[data-action="video"]');
      if (videoBtn) {
        e.preventDefault();
        videoBtn.click();
      }
    });
  }

  /* ---- Study Card ---- */

  function buildStudyCard(study, index) {
    var isReversed = index % 2 === 1;

    var article = document.createElement('article');
    article.className = 'cs-study';

    var grid = document.createElement('div');
    grid.className = 'cs-grid' + (isReversed ? ' reverse' : '');

    // === IMAGE ===
    var imageWrap = document.createElement('div');
    imageWrap.className = 'cs-image';

    if (typeof study.image === 'string' && study.image) {
      var img = document.createElement('img');
      img.src = study.image;
      img.alt = study.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'cs-image-photo';
      imageWrap.appendChild(img);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'cs-image-placeholder';
      imageWrap.appendChild(placeholder);
    }

    var imgLabel = document.createElement('span');
    imgLabel.className = 'cs-image-label';
    imgLabel.textContent = typeof study.buildingType === 'string' ? study.buildingType : 'Project Photo';
    imageWrap.appendChild(imgLabel);

    // === CONTENT ===
    var content = document.createElement('div');
    content.className = 'cs-content';

    // Building type tag
    var meta = document.createElement('div');
    meta.className = 'cs-meta';

    var tag = document.createElement('span');
    tag.className = 'cs-tag';
    var iconWrap = document.createElement('span');
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = ICON_BUILDING;
    tag.appendChild(iconWrap);
    tag.appendChild(document.createTextNode(study.buildingType || ''));
    meta.appendChild(tag);
    content.appendChild(meta);

    // Title
    var title = document.createElement('h2');
    title.className = 'cs-title';
    title.textContent = study.title || '';
    content.appendChild(title);

    // Description
    var desc = document.createElement('p');
    desc.className = 'cs-desc';
    desc.textContent = study.description || '';
    content.appendChild(desc);

    // Stats
    if (Array.isArray(study.stats) && study.stats.length > 0) {
      var statsGrid = document.createElement('div');
      statsGrid.className = 'cs-stats';

      study.stats.forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'cs-stat-card';

        var val = document.createElement('div');
        val.className = 'cs-stat-value';
        val.textContent = s.value || '';

        var lbl = document.createElement('div');
        lbl.className = 'cs-stat-label';
        lbl.textContent = s.label || '';

        card.appendChild(val);
        card.appendChild(lbl);
        statsGrid.appendChild(card);
      });

      content.appendChild(statsGrid);
    }

    // Actions
    var actions = document.createElement('div');
    actions.className = 'cs-actions';

    // Primary CTA — <a> for correct navigation semantics
    var readLink = document.createElement('a');
    readLink.className = 'cs-btn-primary';
    readLink.href = typeof study.detailPage === 'string' && study.detailPage ? study.detailPage : '#';
    readLink.appendChild(document.createTextNode('Read Full Study'));
    var arrowSpan = document.createElement('span');
    arrowSpan.setAttribute('aria-hidden', 'true');
    arrowSpan.innerHTML = ICON_ARROW;
    readLink.appendChild(arrowSpan);
    actions.appendChild(readLink);

    // Video button (only if video exists)
    if (study.hasVideo) {
      var videoBtn = document.createElement('button');
      videoBtn.type = 'button';
      videoBtn.className = 'cs-btn-ghost';
      videoBtn.setAttribute('data-action', 'video');
      videoBtn.dataset.id = study.id || '';
      var playSpan = document.createElement('span');
      playSpan.setAttribute('aria-hidden', 'true');
      playSpan.innerHTML = ICON_PLAY;
      videoBtn.appendChild(playSpan);
      videoBtn.appendChild(document.createTextNode('Watch Video'));
      actions.appendChild(videoBtn);
    }

    content.appendChild(actions);

    grid.appendChild(imageWrap);
    grid.appendChild(content);
    article.appendChild(grid);

    return article;
  }

  /* ---- Error State ---- */

  function showError() {
    var container = document.getElementById('studies-container');
    if (!container) return;
    var errEl = document.createElement('div');
    errEl.className = 'cs-error';
    errEl.textContent = 'Unable to load case studies. Please refresh or try again later.';
    container.textContent = '';
    container.appendChild(errEl);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
