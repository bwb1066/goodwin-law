import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

const SEARCH_STORAGE_KEY = 'search-hero-recent';
const MAX_RECENT = 5;

const CLOCK_SVG = '<svg class="nav-search-sugg-icon" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="7.5"></circle><path d="m8.5 4.5v4"></path><path d="m10.3066 10.1387-1.80932-1.5768"></path></svg>';
const SEARCH_ICON_SVG = '<svg class="nav-search-sugg-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6.4 0c3.5 0 6.4 2.9 6.4 6.4 0 1.4-.4 2.7-1.2 3.7l4 4c.4.4.4 1 .1 1.5l-.1.1c-.2.2-.5.3-.8.3s-.6-.1-.8-.3l-4-4c-1 .7-2.3 1.2-3.7 1.2-3.4-.1-6.3-3-6.3-6.5s2.9-6.4 6.4-6.4zm0 2.1c-2.3 0-4.3 1.9-4.3 4.3s1.9 4.3 4.3 4.3 4.3-1.9 4.3-4.3-1.9-4.3-4.3-4.3z"></path></svg>';

function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(SEARCH_STORAGE_KEY) || '[]'); } catch { return []; }
}

function getAuthoredSuggestions() {
  const hero = document.querySelector('[data-block-name="search-hero"]');
  if (!hero || !hero.dataset.suggestions) return [];
  try { return JSON.parse(hero.dataset.suggestions); } catch { return []; }
}

function makePanelSuggItem(icon, label, url) {
  const li = document.createElement('li');
  li.className = 'nav-search-suggestion';
  const a = document.createElement('a');
  a.href = url || '#';
  a.innerHTML = `${icon}<span>${label}</span>`;
  li.append(a);
  return li;
}

function buildSearchPanel() {
  const panel = document.createElement('div');
  panel.className = 'nav-search-panel';
  panel.hidden = true;

  const inner = document.createElement('div');
  inner.className = 'nav-search-panel-inner';

  function renderSuggestions(q = '') {
    inner.innerHTML = '';
    const filter = q.toLowerCase();
    const recent = getRecentSearches();
    const authored = getAuthoredSuggestions();

    if (recent.length && !filter) {
      const hdr = document.createElement('div');
      hdr.className = 'nav-search-recent-header';
      const title = document.createElement('p');
      title.textContent = 'Recent searches';
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'nav-search-clear';
      clearBtn.textContent = 'Clear';
      clearBtn.addEventListener('click', () => {
        try { localStorage.removeItem(SEARCH_STORAGE_KEY); } catch { /* ignore */ }
        renderSuggestions(q);
      });
      hdr.append(title, clearBtn);
      inner.append(hdr);

      const ul = document.createElement('ul');
      recent.forEach((term) => {
        ul.append(makePanelSuggItem(CLOCK_SVG, term, `/en/search?q=${encodeURIComponent(term)}`));
      });
      inner.append(ul);
    }

    const filtered = filter
      ? authored.filter((s) => s.label.toLowerCase().includes(filter))
      : authored;

    if (filtered.length) {
      const ul = document.createElement('ul');
      filtered.forEach(({ label, url }) => ul.append(makePanelSuggItem(SEARCH_ICON_SVG, label, url)));
      inner.append(ul);
    }
  }

  panel.renderSuggestions = renderSuggestions;
  panel.append(inner);
  return panel;
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSecondary = nav.querySelector('.nav-secondary');
    if (navSections) {
      const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
      if (navSectionExpanded && isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleAllNavSections(navSections, false);
      } else if (!isDesktop.matches) {
        // eslint-disable-next-line no-use-before-define
        toggleMenu(nav, navSections, false);
      }
    }
    if (navSecondary && isDesktop.matches) {
      navSecondary.querySelectorAll('.nav-drop').forEach((s) => s.setAttribute('aria-expanded', 'false'));
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav HTML directly to avoid decorateSections side-effects
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = await resp.text();

  // Normalize any localhost URLs left over from local-file authoring
  tmp.querySelectorAll('[href],[src]').forEach((el) => {
    ['href', 'src'].forEach((attr) => {
      const val = el.getAttribute(attr);
      if (val && val.startsWith('http://localhost')) {
        el.setAttribute(attr, val.replace(/^http:\/\/localhost(:\d+)?/, ''));
      }
    });
  });

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  if (tmp.children.length >= 2) {
    // Multi-section structure: map divs by position → brand / sections / secondary / tools
    const classes = ['brand', 'sections', 'secondary', 'tools'];
    [...tmp.children].forEach((rawSection, i) => {
      if (!classes[i]) return;
      const section = document.createElement('div');
      section.classList.add(`nav-${classes[i]}`);
      const wrapper = document.createElement('div');
      wrapper.className = 'default-content-wrapper';
      while (rawSection.firstChild) wrapper.append(rawSection.firstChild);
      section.append(wrapper);
      nav.append(section);
    });
  } else {
    // Flat structure: single div with brand image + all nav items in one UL
    const rawDiv = tmp.children[0];
    if (!rawDiv) return;

    // Brand — first paragraph containing an image
    const brandPara = rawDiv.querySelector('p:first-child');
    if (brandPara && brandPara.querySelector('img, picture')) {
      const brand = document.createElement('div');
      brand.className = 'nav-brand';
      const brandWrapper = document.createElement('div');
      brandWrapper.className = 'default-content-wrapper';
      brandWrapper.append(brandPara);
      brand.append(brandWrapper);
      nav.append(brand);
    }

    // Nav ULs — first → nav-sections (primary), second → nav-secondary
    const uls = [...rawDiv.querySelectorAll(':scope > ul')];
    const areaNames = ['nav-sections', 'nav-secondary'];
    uls.forEach((ul, i) => {
      if (!areaNames[i]) return;
      ul.querySelectorAll(':scope > li').forEach((li) => {
        const nested = li.querySelector(':scope > p > strong > a, :scope > p > a');
        if (nested) {
          li.insertBefore(nested, li.firstChild);
          li.querySelector(':scope > p')?.remove();
        }
      });
      const area = document.createElement('div');
      area.className = areaNames[i];
      const areaWrapper = document.createElement('div');
      areaWrapper.className = 'default-content-wrapper';
      areaWrapper.append(ul);
      area.append(areaWrapper);
      nav.append(area);
    });
  }

  // If no tools section was authored, inject one with a search icon
  if (!nav.querySelector('.nav-tools')) {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    const toolsWrapper = document.createElement('div');
    toolsWrapper.className = 'default-content-wrapper';
    const p = document.createElement('p');
    const span = document.createElement('span');
    span.className = 'icon icon-search';
    const img = document.createElement('img');
    img.src = '/icons/search.svg';
    img.alt = 'Search';
    span.append(img);
    p.append(span);
    toolsWrapper.append(p);
    tools.append(toolsWrapper);
    nav.append(tools);
  }

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand && navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    const buttonContainer = brandLink.closest('.button-container');
    if (buttonContainer) buttonContainer.className = '';
  }

  const ARROW_SVG = `<svg class="nav-arrow" viewBox="0 0 18 10" fill="inherit" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.575 8.657 0 1.082 1.082 0l7.575 7.575L16.232 0l1.083 1.082-7.576 7.575L8.658 9.74 7.575 8.657Z"/>
  </svg>`;

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        const link = navSection.querySelector(':scope > a');
        if (link) {
          const label = document.createElement('span');
          label.className = 'nav-label';
          link.replaceWith(label);
          label.append(link);
          label.insertAdjacentHTML('beforeend', ARROW_SVG);
        }
      }
      navSection.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', 'true');
        }
      });
      navSection.addEventListener('mouseleave', () => {
        if (isDesktop.matches) navSection.setAttribute('aria-expanded', 'false');
      });
      navSection.addEventListener('click', () => {
        if (!isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // inline search SVG for CSS fill control + search panel
  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    const iconImg = navTools.querySelector('.icon-search img');
    if (iconImg) {
      fetch(iconImg.src)
        .then((r) => r.text())
        .then((svgText) => {
          const span = iconImg.closest('.icon-search');
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svg = svgDoc.querySelector('svg');
          if (svg) {
            svg.setAttribute('aria-hidden', 'true');
            span.replaceChildren(svg);
          }
        });
    }

    // Build search panel and attach to navWrapper (set after this block runs)
    const searchPanel = buildSearchPanel();
    Promise.resolve().then(() => {
      const wrapper = block.querySelector('.nav-wrapper');
      if (wrapper) wrapper.append(searchPanel);
    });

    // Build inline nav search bar (hidden until icon clicked)
    const searchBar = document.createElement('div');
    searchBar.className = 'nav-search-bar';
    searchBar.hidden = true;
    const searchBarInput = document.createElement('input');
    searchBarInput.type = 'text';
    searchBarInput.placeholder = 'Search by industry, practice, or name…';
    searchBarInput.className = 'nav-search-bar-input';
    searchBarInput.setAttribute('autocomplete', 'off');
    searchBarInput.setAttribute('aria-label', 'Search');
    const searchBarSubmit = document.createElement('button');
    searchBarSubmit.type = 'button';
    searchBarSubmit.className = 'nav-search-bar-submit';
    searchBarSubmit.setAttribute('aria-label', 'Submit search');
    searchBarSubmit.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.273 3.09a8.182 8.182 0 1 0 0 16.364 8.182 8.182 0 0 0 0-16.363Zm-7.328.855a10.364 10.364 0 0 1 15.39 13.84l4.164 4.172-1.544 1.541-4.162-4.17A10.364 10.364 0 0 1 3.945 3.945Z" fill="currentColor"/></svg>';
    searchBar.append(searchBarInput, searchBarSubmit);
    navTools.before(searchBar);

    // X dismiss button — sits in navTools, visible only when search is open
    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'nav-search-dismiss';
    dismissBtn.setAttribute('aria-label', 'Close search');
    dismissBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    navTools.append(dismissBtn);

    const iconSpan = navTools.querySelector('.icon-search');
    if (iconSpan) {
      iconSpan.setAttribute('role', 'button');
      iconSpan.setAttribute('tabindex', '0');
      iconSpan.setAttribute('aria-label', 'Search');

      function closeSearchPanel() {
        searchPanel.hidden = true;
        searchBar.hidden = true;
        nav.classList.remove('nav-search-open');
        // eslint-disable-next-line no-use-before-define
        document.removeEventListener('click', onOutsideClick);
        // eslint-disable-next-line no-use-before-define
        document.removeEventListener('keydown', onEscClose);
      }

      dismissBtn.addEventListener('click', closeSearchPanel);

      function onOutsideClick(e) {
        const inside = searchPanel.contains(e.target)
          || searchBar.contains(e.target)
          || iconSpan.contains(e.target)
          || dismissBtn.contains(e.target);
        if (!inside) closeSearchPanel();
      }

      function onEscClose(e) {
        if (e.key === 'Escape') closeSearchPanel();
      }

      searchBarSubmit.addEventListener('click', () => {
        const q = searchBarInput.value.trim();
        if (q) {
          try {
            const list = [q, ...getRecentSearches().filter((s) => s !== q)].slice(0, MAX_RECENT);
            localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(list));
          } catch { /* ignore */ }
          window.location.href = `/en/search?q=${encodeURIComponent(q)}`;
        }
      });

      searchBarInput.addEventListener('input', () => {
        searchPanel.renderSuggestions(searchBarInput.value);
      });

      searchBarInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const q = searchBarInput.value.trim();
          if (q) {
            try {
              const list = [q, ...getRecentSearches().filter((s) => s !== q)].slice(0, MAX_RECENT);
              localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(list));
            } catch { /* ignore */ }
            window.location.href = `/en/search?q=${encodeURIComponent(q)}`;
          }
        }
      });

      iconSpan.addEventListener('click', () => {
        const isOpen = !searchPanel.hidden;
        if (isOpen) {
          closeSearchPanel();
        } else {
          nav.classList.add('nav-search-open');
          searchBar.hidden = false;
          searchBarInput.value = '';
          searchPanel.renderSuggestions();
          searchPanel.hidden = false;
          searchBarInput.focus();
          setTimeout(() => {
            document.addEventListener('click', onOutsideClick);
            document.addEventListener('keydown', onEscClose);
          }, 0);
        }
      });

    }
  }

  const navSecondary = nav.querySelector('.nav-secondary');
  if (navSecondary) {
    navSecondary.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        const link = navSection.querySelector(':scope > a');
        if (link) {
          const label = document.createElement('span');
          label.className = 'nav-label';
          link.replaceWith(label);
          label.append(link);
          label.insertAdjacentHTML('beforeend', ARROW_SVG);
        }
      }
      navSection.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          navSecondary.querySelectorAll('.nav-drop').forEach((s) => s.setAttribute('aria-expanded', 'false'));
          navSection.setAttribute('aria-expanded', 'true');
        }
      });
      navSection.addEventListener('mouseleave', () => {
        if (isDesktop.matches) navSection.setAttribute('aria-expanded', 'false');
      });
      navSection.addEventListener('click', () => {
        if (!isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          navSecondary.querySelectorAll('.nav-drop').forEach((s) => s.setAttribute('aria-expanded', 'false'));
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Hide on scroll down, reveal on scroll up
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (currentScrollY <= 0 || currentScrollY < lastScrollY) {
      navWrapper.classList.remove('nav-hidden');
    } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
      navWrapper.classList.add('nav-hidden');
    }
    lastScrollY = currentScrollY;
  }, { passive: true });
}
