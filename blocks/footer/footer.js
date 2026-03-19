import { getMetadata } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  const resp = await fetch(`${footerPath}.plain.html`);
  if (!resp.ok) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = await resp.text();

  // The footer page has a div.footer block wrapper — extract its content directly
  // to avoid infinite recursion that occurs when loadFragment triggers decorateBlocks
  const inner = tmp.querySelector('.footer') ?? tmp;

  block.textContent = '';
  const footer = document.createElement('div');
  [...inner.children].forEach((c) => footer.append(c));
  block.append(footer);
}
