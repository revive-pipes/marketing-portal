/**
 * Videos Page — Content Loader
 * Reads content/videos.json and builds the page dynamically.
 * Place <div id="featured-player">, <div id="featured-list">,
 * <div id="library-tabs">, <div id="library-grid"> on the page.
 */
(function () {
  var VIDEOS_URL = 'content/videos.json';

  // Controlled SVG strings — not user data, safe for innerHTML
  var ICONS = {
    wrench:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 0 1 0 4h-.09c-.66 0-1.25.4-1.51 1z"/></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
  };

  // Module-scoped state (not global)
  var featuredData = [];
  var libraryData  = [];
  var currentCategory = 'All';

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

    el.textContent = '';
    el.appendChild(label);
    el.appendChild(title);
    el.appendChild(desc);
  }

  /* ---- Featured Player ---- */

  function setPlayerContent(playerEl, item) {
    playerEl.textContent = '';

    if (item && typeof item.thumbnail === 'string' && item.thumbnail) {
      var img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
      playerEl.appendChild(img);
    } else {
      var bg = document.createElement('div');
      bg.className = 'featured-player-bg';
      playerEl.appendChild(bg);
    }

    var btn = document.createElement('div');
    btn.className = 'featured-play-btn';
    btn.setAttribute('aria-label', (item && item.title) ? 'Play ' + item.title : 'Play video');
    playerEl.appendChild(btn);
  }

  /* ---- Featured List ---- */

  function renderFeatured(items) {
    var playerEl = document.getElementById('featured-player');
    var listEl   = document.getElementById('featured-list');
    if (!playerEl || !listEl || !Array.isArray(items) || items.length === 0) return;

    featuredData = items;
    setPlayerContent(playerEl, items[0]);

    var fragment = document.createDocumentFragment();

    items.forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'feature-card' + (i === 0 ? ' active' : '');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      card.dataset.index = String(i);

      var inner = document.createElement('div');
      inner.className = 'feature-card-inner';

      var iconWrap = document.createElement('div');
      iconWrap.className = 'feature-card-icon';
      iconWrap.innerHTML = ICONS[item.icon] || ICONS.wrench;

      var titleEl = document.createElement('div');
      titleEl.className = 'feature-card-title';
      titleEl.textContent = item.title;

      var descEl = document.createElement('div');
      descEl.className = 'feature-card-desc';
      descEl.textContent = item.description;

      inner.appendChild(iconWrap);
      inner.appendChild(titleEl);
      inner.appendChild(descEl);
      card.appendChild(inner);
      fragment.appendChild(card);
    });

    listEl.textContent = '';
    listEl.appendChild(fragment);

    // Single delegated listener for clicks
    listEl.addEventListener('click', function (e) {
      var card = e.target.closest('.feature-card');
      if (card) selectFeature(card, listEl, playerEl);
    });

    // Keyboard: Enter / Space activates the card
    listEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.feature-card');
      if (!card) return;
      e.preventDefault();
      selectFeature(card, listEl, playerEl);
    });
  }

  function selectFeature(card, listEl, playerEl) {
    listEl.querySelectorAll('.feature-card').forEach(function (c) {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('active');
    card.setAttribute('aria-pressed', 'true');

    var index = parseInt(card.dataset.index, 10);
    setPlayerContent(playerEl, featuredData[isNaN(index) ? 0 : index] || null);
  }

  /* ---- Video Library ---- */

  function buildVideoCard(v) {
    var card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Play: ' + v.title);
    card.dataset.id = v.id;

    // Thumbnail area
    var thumb = document.createElement('div');
    thumb.className = 'video-card-thumb';

    if (v.thumbnail) {
      thumb.style.backgroundImage = 'url(' + v.thumbnail + ')';
      thumb.style.backgroundSize = 'cover';
      thumb.style.backgroundPosition = 'center';
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'video-card-thumb-placeholder';
      thumb.appendChild(placeholder);
    }

    var play = document.createElement('div');
    play.className = 'video-card-play';
    play.setAttribute('aria-hidden', 'true');
    thumb.appendChild(play);

    var duration = document.createElement('span');
    duration.className = 'video-card-duration';
    duration.textContent = v.duration;
    thumb.appendChild(duration);

    var tag = document.createElement('span');
    tag.className = 'video-card-tag';
    tag.textContent = v.category;
    if (v.tagColor) tag.style.background = v.tagColor;
    thumb.appendChild(tag);

    card.appendChild(thumb);

    // Body
    var body = document.createElement('div');
    body.className = 'video-card-body';

    var titleEl = document.createElement('div');
    titleEl.className = 'video-card-title';
    titleEl.textContent = v.title;

    var descEl = document.createElement('div');
    descEl.className = 'video-card-desc';
    descEl.textContent = v.description;

    body.appendChild(titleEl);
    body.appendChild(descEl);
    card.appendChild(body);

    return card;
  }

  function renderVideoCards(gridEl, videos, category) {
    var filtered = category === 'All'
      ? videos
      : videos.filter(function (v) { return v.category === category; });

    gridEl.textContent = '';

    if (filtered.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'library-empty';
      empty.textContent = 'No videos in this category yet.';
      gridEl.appendChild(empty);
      return;
    }

    var fragment = document.createDocumentFragment();
    filtered.forEach(function (v) { fragment.appendChild(buildVideoCard(v)); });
    gridEl.appendChild(fragment);
  }

  function renderLibrary(categories, videos) {
    var tabsEl = document.getElementById('library-tabs');
    var gridEl = document.getElementById('library-grid');
    if (!tabsEl || !gridEl || !Array.isArray(categories) || !Array.isArray(videos)) return;

    libraryData = videos;

    // Build tabs
    var tabFragment = document.createDocumentFragment();
    categories.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'library-tab' + (cat === 'All' ? ' active' : '');
      btn.textContent = cat;
      btn.dataset.category = cat;
      tabFragment.appendChild(btn);
    });
    tabsEl.textContent = '';
    tabsEl.appendChild(tabFragment);

    // Delegated listener for tab clicks
    tabsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.library-tab');
      if (!btn) return;
      tabsEl.querySelectorAll('.library-tab').forEach(function (t) { t.classList.remove('active'); });
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderVideoCards(gridEl, libraryData, currentCategory);
    });

    // Delegated listener for video card clicks
    gridEl.addEventListener('click', function (e) {
      var card = e.target.closest('.video-card');
      if (!card) return;
      // TODO: open video modal / lightbox when video files are added
      console.log('Video selected:', card.dataset.id);
    });

    // Keyboard activation for video cards
    gridEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var card = e.target.closest('.video-card');
      if (!card) return;
      e.preventDefault();
      card.click();
    });

    // Initial render
    renderVideoCards(gridEl, libraryData, 'All');
  }

  /* ---- Init ---- */

  async function initVideosPage() {
    var container = document.getElementById('page-header');
    if (!container) return;

    try {
      var response = await fetch(VIDEOS_URL, { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error('Videos data request failed with status ' + response.status);
      }
      var data = await response.json();
      renderPageHeader(data.pageHeader);
      renderFeatured(data.featured);
      renderLibrary(data.categories, data.library);
    } catch (err) {
      console.error('Failed to load videos content:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', initVideosPage);
})();
