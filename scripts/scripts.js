import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlock,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds the two-column hero layout from the first section,
 * splitting content at the "Insights & Resources" heading.
 * Runs after decorateSections and decorateBlocks, so operates on the
 * post-decoration DOM structure.
 * Handles both:
 *   - New structure: div.top-section > div > [leftCol, rightCol]
 *   - Old structure: flat content split at an h2 containing "Insights"
 * @param {Element} main
 */

/**
 * Converts block tables (first cell = block name) to block divs.
 * Needed when blocks are nested inside section containers that the backend
 * doesn't pre-convert.
 * @param {Element} container
 */
function convertBlockTables(container) {
  container.querySelectorAll('table').forEach((table) => {
    const firstCell = table.querySelector('td, th');
    if (!firstCell) return;
    const blockName = firstCell.textContent.trim().toLowerCase().replace(/[^0-9a-z]/g, '-');
    if (!blockName) return;
    const block = document.createElement('div');
    block.className = blockName;
    [...table.querySelectorAll('tr')].slice(1).forEach((row) => {
      const rowDiv = document.createElement('div');
      [...row.querySelectorAll('td, th')].forEach((cell) => {
        const cellDiv = document.createElement('div');
        // move child nodes (preserves pictures, links, etc.)
        [...cell.childNodes].forEach((n) => cellDiv.append(n));
        rowDiv.append(cellDiv);
      });
      block.append(rowDiv);
    });
    table.replaceWith(block);
  });
}

function buildHeroLayout(main) {
  const section = main.querySelector(':scope > div.section');
  if (!section) return;

  // ── Path A: new two-column structure inside div.top-section ──
  const topSectionEl = section.querySelector('.top-section');
  if (topSectionEl) {
    // Convert any block tables that the backend left unconverted
    convertBlockTables(topSectionEl);

    // Expect: div.top-section > div > [leftCol, rightCol]
    const container = topSectionEl.querySelector(':scope > div');
    if (!container) return;
    const cols = [...container.querySelectorAll(':scope > div')];
    if (cols.length < 2) return;
    const [leftCol, rightCol] = cols;

    const searchHero = leftCol.querySelector('.search-hero');
    if (!searchHero) return;

    // Build card – move all left column children into cardInner
    const cardInner = document.createElement('div');
    cardInner.className = 'hero-card-inner';
    [...leftCol.children].forEach((c) => cardInner.append(c));

    // Orange rule after the first heading
    const orangeRule = document.createElement('div');
    orangeRule.className = 'hero-orange-rule';
    const headingEl = cardInner.querySelector('h1, h2');
    if (headingEl) headingEl.after(orangeRule);
    else cardInner.prepend(orangeRule);

    // Ensure search-hero is decorated so loadSection picks it up
    decorateBlock(searchHero);

    const heroCard = document.createElement('div');
    heroCard.className = 'hero-card';
    heroCard.append(cardInner);

    const heroLeft = document.createElement('div');
    heroLeft.className = 'hero-left';
    heroLeft.append(heroCard);

    // Right column – move all right column children
    const heroRight = document.createElement('div');
    heroRight.className = 'hero-right';
    [...rightCol.children].forEach((c) => heroRight.append(c));

    const heroLayout = document.createElement('div');
    heroLayout.className = 'hero-layout';
    heroLayout.append(heroLeft, heroRight);

    // Remove the now-empty top-section container chain first,
    // then prepend heroLayout so it appears before platform/commitment sections
    topSectionEl.closest('div:not(.section)')?.remove();
    [...section.children].forEach((child) => {
      if (!child.hasChildNodes()) child.remove();
    });
    section.prepend(heroLayout);
    return;
  }

  // ── Path B: flat content split at the Insights h2 (legacy structure) ──
  const searchHero = section.querySelector('.search-hero');
  if (!searchHero) return;

  const insightsH2 = [...section.querySelectorAll('h2')].find(
    (el) => el.textContent.includes('Insights'),
  );
  if (!insightsH2) return;

  const sectionChildren = [...section.children];
  const insightsContainer = sectionChildren.find(
    (child) => child === insightsH2 || child.contains(insightsH2),
  );
  const insightsContainerIdx = sectionChildren.indexOf(insightsContainer);

  const leftWrappers = sectionChildren.slice(0, insightsContainerIdx);
  const insightsContainerKids = [...insightsContainer.children];
  const h2IdxInContainer = insightsContainerKids.indexOf(insightsH2);
  const leftExtraChildren = insightsContainerKids.slice(0, h2IdxInContainer);
  const rightFromContainer = insightsContainerKids.slice(h2IdxInContainer);
  const rightWrappers = sectionChildren.slice(insightsContainerIdx + 1);

  const cardInner = document.createElement('div');
  cardInner.className = 'hero-card-inner';

  const searchHeroWrapper = searchHero.parentElement;
  leftWrappers.forEach((wrapper) => {
    if (wrapper === searchHeroWrapper) return;
    if (wrapper.classList.contains('default-content-wrapper')) {
      [...wrapper.children].forEach((c) => cardInner.append(c));
    } else {
      cardInner.append(wrapper);
    }
  });
  leftExtraChildren.forEach((c) => cardInner.append(c));
  cardInner.append(searchHeroWrapper);

  const orangeRule = document.createElement('div');
  orangeRule.className = 'hero-orange-rule';
  const h1El = cardInner.querySelector('h1');
  if (h1El) h1El.after(orangeRule);
  else cardInner.prepend(orangeRule);

  const heroCard = document.createElement('div');
  heroCard.className = 'hero-card';
  heroCard.append(cardInner);

  const heroLeft = document.createElement('div');
  heroLeft.className = 'hero-left';
  heroLeft.append(heroCard);

  const heroRight = document.createElement('div');
  heroRight.className = 'hero-right';
  rightFromContainer.forEach((c) => heroRight.append(c));
  rightWrappers.forEach((w) => heroRight.append(w));

  const heroLayout = document.createElement('div');
  heroLayout.className = 'hero-layout';
  heroLayout.append(heroLeft, heroRight);

  section.append(heroLayout);

  [...section.children].forEach((child) => {
    if (child !== heroLayout && !child.hasChildNodes()) child.remove();
  });
}

/**
 * Reorders named section containers within the first section to a canonical order.
 * @param {Element} main
 */
function reorderSections(main) {
  const section = main.querySelector(':scope > div.section');
  if (!section) return;
  const order = ['hero-layout', 'platform-section', 'commitment-section'];
  // Prepend in reverse order so first item ends up first
  [...order].reverse().forEach((name) => {
    // Find the direct child of section that has or contains the named element
    const target = [...section.children].find(
      (child) => child.classList.contains(name) || child.querySelector(`.${name}`),
    );
    if (target) section.prepend(target);
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  buildHeroLayout(main);
  reorderSections(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
function addVideoBackground() {
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.id = 'page-video-bg';
  const source = document.createElement('source');
  source.src = '/assets/video-background.mp4';
  source.type = 'video/mp4';
  video.append(source);
  document.body.prepend(video);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  addVideoBackground();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
