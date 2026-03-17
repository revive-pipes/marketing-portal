/**
 * Navigation Component
 *
 * Builds the nav dynamically from content/nav.json.
 * Place <div id="nav-container"></div> on any page.
 */
(function () {
  var NAV_CONFIG_URL = "content/nav.json";
  var HOME_PAGE = "index.html";
  var MENU_ID = "mobileMenu";
  var HAMBURGER_ID = "navHamburgerButton";
  var USER_MENU_ID = "navUserMenu";
  var USER_DROPDOWN_ID = "navUserDropdown";

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

  function getUserEmail() {
    try {
      var raw = sessionStorage.getItem("portalUser");
      if (!raw) return "";
      var parsed = JSON.parse(raw);
      return typeof parsed.email === "string" ? parsed.email.trim() : "";
    } catch (error) {
      return "";
    }
  }

  function signOut() {
    try { sessionStorage.clear(); } catch (e) {}
    window.location.replace("/login.html");
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

  function createSvg(width, height, withClass) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    if (withClass) svg.classList.add(withClass);
    return svg;
  }

  function createUserIcon(size, withClass) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = createSvg(size, size, withClass);
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2");
    svg.appendChild(path);
    var circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", "8.5");
    circle.setAttribute("cy", "7");
    circle.setAttribute("r", "4");
    svg.appendChild(circle);
    var lineOne = document.createElementNS(ns, "line");
    lineOne.setAttribute("x1", "20"); lineOne.setAttribute("y1", "8");
    lineOne.setAttribute("x2", "20"); lineOne.setAttribute("y2", "14");
    svg.appendChild(lineOne);
    var lineTwo = document.createElementNS(ns, "line");
    lineTwo.setAttribute("x1", "23"); lineTwo.setAttribute("y1", "11");
    lineTwo.setAttribute("x2", "17"); lineTwo.setAttribute("y2", "11");
    svg.appendChild(lineTwo);
    return svg;
  }

  function createChevronIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = createSvg(12, 12, "nav-user-chevron");
    svg.setAttribute("stroke-width", "2.5");
    var polyline = document.createElementNS(ns, "polyline");
    polyline.setAttribute("points", "6 9 12 15 18 9");
    svg.appendChild(polyline);
    return svg;
  }

  function createSignOutIcon() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = createSvg(15, 15, null);
    var path = document.createElementNS(ns, "path");
    path.setAttribute("d", "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4");
    svg.appendChild(path);
    var polyline = document.createElementNS(ns, "polyline");
    polyline.setAttribute("points", "16 17 21 12 16 7");
    svg.appendChild(polyline);
    var line = document.createElementNS(ns, "line");
    line.setAttribute("x1", "21"); line.setAttribute("y1", "12");
    line.setAttribute("x2", "9");  line.setAttribute("y2", "12");
    svg.appendChild(line);
    return svg;
  }

  function buildUserMenu(userName) {
    var userEmail = getUserEmail();
    var firstName = userName.split(" ")[0];

    // Wrapper (relative position anchor for dropdown)
    var userMenu = document.createElement("div");
    userMenu.className = "nav-user-menu";
    userMenu.id = USER_MENU_ID;

    // Trigger button
    var userBtn = document.createElement("button");
    userBtn.type = "button";
    userBtn.className = "nav-user-btn";
    userBtn.setAttribute("aria-expanded", "false");
    userBtn.setAttribute("aria-haspopup", "true");
    userBtn.setAttribute("aria-controls", USER_DROPDOWN_ID);
    userBtn.setAttribute("aria-label", "Account menu for " + firstName);

    var avatar = document.createElement("span");
    avatar.className = "nav-user-avatar";
    avatar.textContent = userName.charAt(0).toUpperCase();

    var nameSpan = document.createElement("span");
    nameSpan.className = "nav-user-name";
    nameSpan.textContent = firstName;

    userBtn.appendChild(avatar);
    userBtn.appendChild(nameSpan);
    userBtn.appendChild(createChevronIcon());

    // Dropdown panel
    var dropdown = document.createElement("div");
    dropdown.className = "nav-user-dropdown";
    dropdown.id = USER_DROPDOWN_ID;
    dropdown.hidden = true;
    dropdown.setAttribute("role", "menu");

    var infoBlock = document.createElement("div");
    infoBlock.className = "nav-user-dropdown-info";

    var fullNameEl = document.createElement("div");
    fullNameEl.className = "nav-user-dropdown-name";
    fullNameEl.textContent = userName;
    infoBlock.appendChild(fullNameEl);

    if (userEmail) {
      var emailEl = document.createElement("div");
      emailEl.className = "nav-user-dropdown-email";
      emailEl.textContent = userEmail;
      infoBlock.appendChild(emailEl);
    }

    var divider = document.createElement("div");
    divider.className = "nav-user-dropdown-divider";

    var signOutBtn = document.createElement("button");
    signOutBtn.type = "button";
    signOutBtn.className = "nav-user-signout-btn";
    signOutBtn.setAttribute("role", "menuitem");
    signOutBtn.appendChild(createSignOutIcon());
    var signOutText = document.createElement("span");
    signOutText.textContent = "Sign Out";
    signOutBtn.appendChild(signOutText);
    signOutBtn.addEventListener("click", signOut);

    dropdown.appendChild(infoBlock);
    dropdown.appendChild(divider);
    dropdown.appendChild(signOutBtn);

    userMenu.appendChild(userBtn);
    userMenu.appendChild(dropdown);

    return userMenu;
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
      navMeta.appendChild(buildUserMenu(userName));
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
    cta.appendChild(createUserIcon(18, "nav-cta-icon"));
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

    // ---- Mobile menu ----
    var mobileMenu = document.createElement("div");
    mobileMenu.className = "mobile-menu";
    mobileMenu.id = MENU_ID;
    mobileMenu.hidden = true;
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.setAttribute("aria-label", "Mobile menu");

    var mobileMenuInner = document.createElement("div");
    mobileMenuInner.className = "mobile-menu-inner";

    if (userName) {
      var mobileMenuHeader = document.createElement("div");
      mobileMenuHeader.className = "mobile-menu-header";

      var mobileAvatar = document.createElement("span");
      mobileAvatar.className = "mobile-menu-avatar";
      mobileAvatar.textContent = userName.charAt(0).toUpperCase();

      var mobileUserInfo = document.createElement("div");
      mobileUserInfo.className = "mobile-menu-user-info";

      var mobileUserName = document.createElement("span");
      mobileUserName.className = "mobile-menu-user";
      mobileUserName.textContent = userName;
      mobileUserInfo.appendChild(mobileUserName);

      var mobileUserEmail = getUserEmail();
      if (mobileUserEmail) {
        var mobileEmailEl = document.createElement("span");
        mobileEmailEl.className = "mobile-menu-email";
        mobileEmailEl.textContent = mobileUserEmail;
        mobileUserInfo.appendChild(mobileEmailEl);
      }

      mobileMenuHeader.appendChild(mobileAvatar);
      mobileMenuHeader.appendChild(mobileUserInfo);
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
    mobileCta.appendChild(createUserIcon(18));
    mobileCta.append(" " + ctaLabel);
    mobileMenuInner.appendChild(mobileCta);

    if (userName) {
      var mobileSignOut = document.createElement("button");
      mobileSignOut.type = "button";
      mobileSignOut.className = "mobile-signout";
      mobileSignOut.appendChild(createSignOutIcon());
      var mobileSignOutText = document.createElement("span");
      mobileSignOutText.textContent = "Sign Out";
      mobileSignOut.appendChild(mobileSignOutText);
      mobileSignOut.addEventListener("click", signOut);
      mobileMenuInner.appendChild(mobileSignOut);
    }

    mobileMenu.appendChild(mobileMenuInner);

    fragment.appendChild(mainNav);
    fragment.appendChild(mobileMenu);

    container.textContent = "";
    container.appendChild(fragment);
  }

  function bindUserMenu() {
    var userMenu = document.getElementById(USER_MENU_ID);
    if (!userMenu) return;

    var userBtn = userMenu.querySelector(".nav-user-btn");
    var dropdown = document.getElementById(USER_DROPDOWN_ID);
    if (!userBtn || !dropdown) return;

    function isOpen() {
      return !dropdown.hidden;
    }

    function openDropdown() {
      dropdown.hidden = false;
      userBtn.setAttribute("aria-expanded", "true");
      userBtn.classList.add("open");
    }

    function closeDropdown() {
      dropdown.hidden = true;
      userBtn.setAttribute("aria-expanded", "false");
      userBtn.classList.remove("open");
    }

    userBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isOpen()) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    // Close when clicking outside
    document.addEventListener("click", function (e) {
      if (isOpen() && !userMenu.contains(e.target)) {
        closeDropdown();
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) {
        closeDropdown();
        userBtn.focus();
      }
    });
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
      bindUserMenu();
      bindMenuBehavior();
      bindScrollBehavior();
    } catch (error) {
      console.error("Failed to load navigation:", error);
      container.textContent = "";
      container.setAttribute("data-nav-error", "true");
    }
  }

  document.addEventListener("DOMContentLoaded", initNav);
}());
