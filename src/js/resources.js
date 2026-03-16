/**
 * Resources Page — Content Loader
 * Reads content/resources.json, builds featured cards + filterable/searchable document list
 */

(function () {
  'use strict';

  var ICON_FILE = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var ICON_DOWNLOAD = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  var ICON_EYE = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

  var resourcesData = null;
  var currentCategory = 'All';
  var currentSearch = '';

  async function init() {
    try {
      var res = await fetch('../content/resources.json', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load: ' + res.status);
      resourcesData = await res.json();

      if (!resourcesData ||
          !Array.isArray(resourcesData.featured) ||
          !Array.isArray(resourcesData.library) ||
          !Array.isArray(resourcesData.categories)) {
        showError();
        return;
      }

      renderPageHeader(resourcesData.pageHeader);
      renderFeatured(resourcesData.featured);
      renderTabs(resourcesData.categories);
      renderSearch();
      renderDocs();
      attachEvents();
    } catch (err) {
      console.error(err);
      showError();
    }
  }

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

  function renderFeatured(items) {
    var grid = document.getElementById('featured-grid');
    if (!grid || items.length === 0) return;

    for (var i = 0; i < items.length; i++) {
      grid.appendChild(buildFeaturedCard(items[i]));
    }
  }

  function buildFeaturedCard(doc) {
    var card = document.createElement('div');
    card.className = 'res-featured-card';
    card.setAttribute('data-doc-id', doc.id);
    card.setAttribute('data-doc-action', doc.action);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', (doc.action === 'download' ? 'Download: ' : 'View: ') + doc.title);

    // Top row — icon + badge
    var top = document.createElement('div');
    top.className = 'res-featured-top';

    var iconWrap = document.createElement('div');
    iconWrap.className = 'res-featured-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = ICON_FILE;
    top.appendChild(iconWrap);

    if (doc.badge) {
      var badge = document.createElement('span');
      badge.className = 'res-featured-badge' + (doc.badge.toLowerCase() === 'new' ? ' new' : '');
      badge.textContent = doc.badge;
      top.appendChild(badge);
    }

    card.appendChild(top);

    // Title
    var title = document.createElement('div');
    title.className = 'res-featured-title';
    title.textContent = doc.title;
    card.appendChild(title);

    // Description
    var desc = document.createElement('div');
    desc.className = 'res-featured-desc';
    desc.textContent = doc.description;
    card.appendChild(desc);

    // Footer — file type pill + action label
    var footer = document.createElement('div');
    footer.className = 'res-featured-footer';

    var fileType = document.createElement('span');
    fileType.className = 'res-featured-filetype';
    fileType.textContent = doc.fileType || 'PDF';
    footer.appendChild(fileType);

    var cta = document.createElement('span');
    cta.className = 'res-featured-cta';
    cta.appendChild(document.createTextNode(doc.action === 'download' ? 'Download' : 'View'));
    var ctaIcon = document.createElement('span');
    ctaIcon.setAttribute('aria-hidden', 'true');
    ctaIcon.innerHTML = doc.action === 'download' ? ICON_DOWNLOAD : ICON_EYE;
    cta.appendChild(ctaIcon);
    footer.appendChild(cta);

    card.appendChild(footer);

    return card;
  }

  function renderTabs(categories) {
    var container = document.getElementById('res-tabs');
    if (!container) return;

    for (var i = 0; i < categories.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'res-tab' + (categories[i].label === 'All' ? ' active' : '');
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-category', categories[i].label);
      btn.textContent = categories[i].label;
      container.appendChild(btn);
    }
  }

  function renderSearch() {
    var input = document.getElementById('res-search-input');
    if (!input) return;

    input.addEventListener('input', function () {
      currentSearch = this.value.trim().toLowerCase();
      renderDocs();
    });
  }

  function renderDocs() {
    var container = document.getElementById('res-doc-list');
    if (!container || !resourcesData) return;

    var docs = resourcesData.library.filter(function (doc) {
      var matchCat = currentCategory === 'All' || doc.category === currentCategory;
      var matchSearch = !currentSearch ||
        doc.title.toLowerCase().indexOf(currentSearch) !== -1 ||
        (doc.description && doc.description.toLowerCase().indexOf(currentSearch) !== -1);
      return matchCat && matchSearch;
    });

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (docs.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'res-doc-empty';
      empty.textContent = 'No documents found matching your criteria.';
      container.appendChild(empty);
      return;
    }

    for (var i = 0; i < docs.length; i++) {
      container.appendChild(buildDocRow(docs[i]));
    }
  }

  function buildDocRow(doc) {
    var row = document.createElement('div');
    row.className = 'res-doc-row';
    row.setAttribute('data-doc-id', doc.id);
    row.setAttribute('data-doc-action', doc.action);
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', (doc.action === 'download' ? 'Download: ' : 'View: ') + doc.title);

    // Icon
    var iconWrap = document.createElement('div');
    iconWrap.className = 'res-doc-icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = ICON_FILE;
    row.appendChild(iconWrap);

    // Text
    var text = document.createElement('div');
    text.className = 'res-doc-text';

    var titleEl = document.createElement('div');
    titleEl.className = 'res-doc-title';
    titleEl.textContent = doc.title;

    var descEl = document.createElement('div');
    descEl.className = 'res-doc-desc';
    descEl.textContent = doc.description;

    text.appendChild(titleEl);
    text.appendChild(descEl);
    row.appendChild(text);

    // Category tag
    var catTag = document.createElement('span');
    catTag.className = 'res-doc-category';
    catTag.textContent = doc.category;
    catTag.style.backgroundColor = doc.categoryColor;
    row.appendChild(catTag);

    // Action button — visual affordance only, row handles activation
    var actionBtn = document.createElement('button');
    actionBtn.className = 'res-doc-action';
    actionBtn.setAttribute('type', 'button');
    actionBtn.setAttribute('tabindex', '-1');
    actionBtn.setAttribute('aria-hidden', 'true');

    var actionIcon = document.createElement('span');
    actionIcon.setAttribute('aria-hidden', 'true');
    actionIcon.innerHTML = doc.action === 'download' ? ICON_DOWNLOAD : ICON_EYE;
    actionBtn.appendChild(actionIcon);

    var actionText = document.createElement('span');
    actionText.textContent = doc.action === 'download' ? 'Download' : 'View';
    actionBtn.appendChild(actionText);

    row.appendChild(actionBtn);

    return row;
  }

  function attachEvents() {
    // Featured card clicks + keyboard
    var featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid) {
      featuredGrid.addEventListener('click', function (e) {
        var card = e.target.closest('[data-doc-id]');
        if (card) handleDocAction(card.getAttribute('data-doc-id'), card.getAttribute('data-doc-action'));
      });

      featuredGrid.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var card = e.target.closest('[data-doc-id]');
          if (card) {
            e.preventDefault();
            handleDocAction(card.getAttribute('data-doc-id'), card.getAttribute('data-doc-action'));
          }
        }
      });
    }

    // Tab clicks
    var tabsContainer = document.getElementById('res-tabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', function (e) {
        var tab = e.target.closest('.res-tab');
        if (!tab) return;
        currentCategory = tab.getAttribute('data-category');
        var all = tabsContainer.querySelectorAll('.res-tab');
        for (var i = 0; i < all.length; i++) {
          all[i].classList.remove('active');
        }
        tab.classList.add('active');
        renderDocs();
      });
    }

    // Doc row clicks + keyboard
    var listContainer = document.getElementById('res-doc-list');
    if (listContainer) {
      listContainer.addEventListener('click', function (e) {
        var row = e.target.closest('[data-doc-id]');
        if (row) handleDocAction(row.getAttribute('data-doc-id'), row.getAttribute('data-doc-action'));
      });

      listContainer.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          var row = e.target.closest('[data-doc-id]');
          if (row) {
            e.preventDefault();
            handleDocAction(row.getAttribute('data-doc-id'), row.getAttribute('data-doc-action'));
          }
        }
      });
    }
  }

  function handleDocAction(_docId, _action) {
    // Placeholder: locate doc by ID and open/download the file URL
  }

  function showError() {
    var container = document.getElementById('featured-grid');
    if (!container) return;
    container.textContent = '';
    var errDiv = document.createElement('div');
    errDiv.className = 'res-error';
    errDiv.textContent = 'Unable to load resources. Please refresh or try again later.';
    container.appendChild(errDiv);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
