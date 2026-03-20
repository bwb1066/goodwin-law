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

  const inner = tmp.querySelector('.footer') ?? tmp;
  const row = inner.querySelector(':scope > div > div, :scope > div');

  block.textContent = '';

  if (!row) return;

  const cols = [...row.children];
  if (cols.length < 4) return;

  // ── Col 0: Subscribe CTA ──
  const subscribeCol = document.createElement('div');
  subscribeCol.className = 'footer-subscribe';
  const subscribeLink = cols[0].querySelector('a');
  if (subscribeLink) {
    subscribeLink.className = 'footer-subscribe-btn';
    subscribeCol.append(subscribeLink);
  }

  // ── Cols 1 & 2: link lists ──
  const linksCol = document.createElement('div');
  linksCol.className = 'footer-links';
  [cols[1], cols[2]].forEach((col) => {
    const ul = col.querySelector('ul');
    if (ul) {
      const group = document.createElement('ul');
      group.className = 'footer-link-group';
      [...ul.querySelectorAll('li')].forEach((li) => {
        const newLi = document.createElement('li');
        newLi.append(...li.childNodes);
        group.append(newLi);
      });
      linksCol.append(group);
    }
  });

  // ── Col 3: social icons + copyright ──
  const socialCol = document.createElement('div');
  socialCol.className = 'footer-social';

  const iconsRow = document.createElement('div');
  iconsRow.className = 'footer-social-icons';

  const paras = [...cols[3].querySelectorAll('p')];
  paras.forEach((p) => {
    const img = p.querySelector('img');
    if (img) {
      // social icon — wrap in a span
      const icon = document.createElement('span');
      icon.className = 'footer-social-icon';
      icon.append(p.querySelector('picture') ?? img);
      iconsRow.append(icon);
    } else {
      // copyright text
      const copy = document.createElement('p');
      copy.className = 'footer-copyright';
      copy.textContent = p.textContent;
      socialCol.append(copy);
    }
  });

  socialCol.prepend(iconsRow);

  // ── Assemble ──
  const bar = document.createElement('div');
  bar.className = 'footer-bar';
  bar.append(subscribeCol, linksCol, socialCol);
  block.append(bar);
}
