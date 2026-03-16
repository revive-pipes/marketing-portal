/**
 * Navigation Component
 *
 * Builds the nav dynamically from content/nav.json.
 * Place <div id="nav-container"></div> on any page.
 */
(function () {
  var NAV_CONFIG_URL = "../content/nav.json";
  var HOME_PAGE = "index.html";
  var MENU_ID = "mobileMenu";
  var HAMBURGER_ID = "navHamburgerButton";

  function getCurrentPage() {
    return window.location.pathname.split("/").pop() || HOME_PAGE;
  }

  function getUserName() {
    try {
      var raw = sessionStorage.getItem("portalUser");
      if (!raw) return "";
      var parsed = JSON.parse(raw);
      return typeof parsed.name === "string" ? parsed.name.trim() : "";
    } catch (error) {
      console.warn("Unable to read portal user data from session storage:", error);
      return "";
    }
  }

  function toSafeHref(value) {
    var href = typeof value === "string" ? value.trim() : "";
    if (!href) return "#";
    if (href.charAt(0) === "#") return href;
    try {
      var resolved = new URL(href, window.location.href);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return "#";
      return href;
    } catch (error) {
      return "#";
    }
  }

  function createIcon(size, withClass) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (withClass) {
      svg.classList.add(withClass);
    }

    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2");
    svg.appendChild(path);

    var circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", "8.5");
    circle.setAttribute("cy", "7");
    circle.setAttribute("r", "4");
    svg.appendChild(circle);

    var lineOne = document.createElementNS(ns, "line");
    lineOne.setAttribute("x1", "20");
    lineOne.setAttribute("y1", "8");
    lineOne.setAttribute("x2", "20");
    lineOne.setAttribute("y2", "14");
    svg.appendChild(lineOne);

    var lineTwo = document.createElementNS(ns, "line");
    lineTwo.setAttribute("x1", "23");
    lineTwo.setAttribute("y1", "11");
    lineTwo.setAttribute("x2", "17");
    lineTwo.setAttribute("y2", "11");
    svg.appendChild(lineTwo);

    return svg;
  }

  function buildNav(container, nav) {
    var currentPage = getCurrentPage();
    var userName = getUserName();
    var fragment = document.createDocumentFragment();

    var mainNav = document.createElement("nav");
    mainNav.className = "nav";
    mainNav.id = "mainNav";
    mainNav.setAttribute("aria-label", "Primary");

    var navInner = document.createElement("div");
    navInner.className = "nav-inner";

    var navPanel = document.createElement("div");
    navPanel.className = "nav-panel";

    var navLeft = document.createElement("div");
    navLeft.className = "nav-left";

    var logoLink = document.createElement("a");
    logoLink.className = "nav-logo-link";
    logoLink.href = HOME_PAGE;
    logoLink.setAttribute("aria-label", "Go to home page");

    var logo = document.createElement("img");
    logo.className = "nav-logo";
    logo.src = typeof nav.logo === "string" ? nav.logo : "";
    logo.alt = "Revive Pipes";
    logo.loading = "eager";
    logo.decoding = "async";

    logoLink.appendChild(logo);
    navLeft.appendChild(logoLink);

    var navCenterWrap = document.createElement("div");
    navCenterWrap.className = "nav-center-wrap";

    var navCenter = document.createElement("ul");
    navCenter.className = "nav-center";

    var links = Array.isArray(nav.links) ? nav.links : [];
    links.forEach(function (link) {
      if (!link || typeof link.href !== "string" || typeof link.label !== "string") return;

      var li = document.createElement("li");
      var anchor = document.createElement("a");
      var linkHref = toSafeHref(link.href);
      var isActive = currentPage === link.href;

      li.className = "nav-item";
      anchor.className = "nav-link";
      if (isActive) {
        anchor.classList.add("active");
        anchor.setAttribute("aria-current", "page");
      }
      anchor.href = linkHref;
      anchor.textContent = link.label;

      li.appendChild(anchor);
      navCenter.appendChild(li);
    });
    navCenterWrap.appendChild(navCenter);

    var navRight = document.createElement("div");
    navRight.className = "nav-right";

    var navMeta = document.createElement("div");
    navMeta.className = "nav-meta";

    if (userName) {
      var userSpan = document.createElement("span");
      userSpan.className = "nav-user";
      userSpan.append("Welcome, ");
      var strong = document.createElement("strong");
      strong.textContent = userName;
      userSpan.appendChild(strong);
      navMeta.appendChild(userSpan);
    }

    var ctaHref = toSafeHref(nav.ctaButton && nav.ctaButton.href);
    var ctaLabel = nav.ctaButton && typeof nav.ctaButton.label === "string"
      ? nav.ctaButton.label
      : "Action";

    var navActions = document.createElement("div");
    navActions.className = "nav-actions";

    var cta = document.createElement("a");
    cta.href = ctaHref;
    cta.className = "nav-cta";
    cta.appendChild(createIcon(18, "nav-cta-icon"));
    var ctaText = document.createElement("span");
    ctaText.className = "nav-cta-text";
    ctaText.textContent = ctaLabel;
    cta.appendChild(ctaText);
    navActions.appendChild(cta);

    var hamburger = document.createElement("button");
    hamburger.type = "button";
    hamburger.className = "nav-hamburger";
    hamburger.id = HAMBURGER_ID;
    hamburger.setAttribute("aria-label", "Toggle menu");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-controls", MENU_ID);
    hamburger.appendChild(document.createElement("span"));
    hamburger.appendChild(document.createElement("span"));
    hamburger.appendChild(document.createElement("span"));
    navActions.appendChild(hamburger);

    navRight.appendChild(navMeta);
    navRight.appendChild(navActions);

    navPanel.appendChild(navLeft);
    navPanel.appendChild(navCenterWrap);
    navPanel.appendChild(navRight);
    navInner.appendChild(navPanel);
    mainNav.appendChild(navInner);

    var mobileMenu = document.createElement("div");
    mobileMenu.className = "mobile-menu";
    mobileMenu.id = MENU_ID;
    mobileMenu.hidden = true;
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.setAttribute("aria-label", "Mobile menu");

    var mobileMenuInner = document.createElement("div");
    mobileMenuInner.className = "mobile-menu-inner";

    var mobileMenuHeader = document.createElement("div");
    mobileMenuHeader.className = "mobile-menu-header";

    if (userName) {
      var mobileUser = document.createElement("span");
      mobileUser.className = "mobile-menu-user";
      mobileUser.textContent = userName;
      mobileMenuHeader.appendChild(mobileUser);
    }

    if (mobileMenuHeader.children.length > 0) {
      mobileMenuInner.appendChild(mobileMenuHeader);
    }

    links.forEach(function (link) {
      if (!link || typeof link.href !== "string" || typeof link.label !== "string") return;

      var mobileLink = document.createElement("a");
      mobileLink.href = toSafeHref(link.href);
      mobileLink.className = "mobile-link";
      mobileLink.textContent = link.label;
      if (currentPage === link.href) {
        mobileLink.classList.add("active");
        mobileLink.setAttribute("aria-current", "page");
      }
      mobileMenuInner.appendChild(mobileLink);
    });

    var divider = document.createElement("div");
    divider.className = "mobile-menu-divider";
    mobileMenuInner.appendChild(divider);

    var mobileCta = document.createElement("a");
    mobileCta.href = ctaHref;
    mobileCta.className = "mobile-cta";
    mobileCta.appendChild(createIcon(18));
    mobileCta.append(" " + ctaLabel);
    mobileMenuInner.appendChild(mobileCta);

    mobileMenu.appendChild(mobileMenuInner);

    fragment.appendChild(mainNav);
    fragment.appendChild(mobileMenu);

    container.textContent = "";
    container.appendChild(fragment);
  }

  function bindMenuBehavior() {
    var menu = document.getElementById(MENU_ID);
    var hamburger = document.getElementById(HAMBURGER_ID);
    if (!menu || !hamburger) return;

    var lastFocused = null;
    var focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function isOpen() {
      return menu.classList.contains("open");
    }

    function openMenu() {
      lastFocused = document.activeElement;
      menu.hidden = false;
      menu.classList.add("open");
      menu.setAttribute("aria-hidden", "false");
      hamburger.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";

      var firstFocusable = menu.querySelector(focusableSelectors);
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    function closeMenu() {
      menu.classList.remove("open");
      menu.setAttribute("aria-hidden", "true");
      hamburger.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      menu.hidden = true;
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    hamburger.addEventListener("click", function () {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menu.addEventListener("click", function (event) {
      if (event.target && event.target.closest("a")) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && isOpen()) {
        closeMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 1024 && isOpen()) {
        closeMenu();
      }
    });
  }

  function bindScrollBehavior() {
    var navEl = document.getElementById("mainNav");
    if (!navEl) return;

    function updateScrolled() {
      navEl.classList.toggle("scrolled", window.scrollY > 10);
    }

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
  }

  async function initNav() {
    var container = document.getElementById("nav-container");
    if (!container) return;

    try {
      var response = await fetch(NAV_CONFIG_URL, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Navigation request failed with status " + response.status);
      }
      var nav = await response.json();
      buildNav(container, nav);
      bindMenuBehavior();
      bindScrollBehavior();
    } catch (error) {
      console.error("Failed to load navigation:", error);
      container.textContent = "";
      container.setAttribute("data-nav-error", "true");
    }
  }

  document.addEventListener("DOMContentLoaded", initNav);
})();
