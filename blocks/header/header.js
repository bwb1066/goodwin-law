import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

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

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  if (tmp.children.length >= 4) {
    // Boilerplate structure: separate divs for brand / sections / secondary / tools
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
    // Flat structure: single div containing logo then a ul of all nav items
    const rawDiv = tmp.children[0];
    if (!rawDiv) return;

    // Brand — first paragraph containing an image
    const brandPara = rawDiv.querySelector('p:first-child');
    if (brandPara && brandPara.querySelector('img')) {
      const brand = document.createElement('div');
      brand.className = 'nav-brand';
      const brandWrapper = document.createElement('div');
      brandWrapper.className = 'default-content-wrapper';
      brandWrapper.append(brandPara);
      brand.append(brandWrapper);
      nav.append(brand);
    }

    // Sections — the ul, unwrapping any <p><strong><a> wrappers
    const ul = rawDiv.querySelector('ul');
    if (ul) {
      ul.querySelectorAll(':scope > li').forEach((li) => {
        const nested = li.querySelector(':scope > p > strong > a, :scope > p > a');
        if (nested) {
          li.insertBefore(nested, li.firstChild);
          li.querySelector(':scope > p')?.remove();
        }
      });
      const sections = document.createElement('div');
      sections.className = 'nav-sections';
      const sectionsWrapper = document.createElement('div');
      sectionsWrapper.className = 'default-content-wrapper';
      sectionsWrapper.append(ul);
      sections.append(sectionsWrapper);
      nav.append(sections);
    }
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

  // inline search SVG for CSS fill control
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
}
