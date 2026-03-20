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

  let copyrightText = '';
  const paras = [...cols[3].querySelectorAll('p')];
  paras.forEach((p) => {
    const img = p.querySelector('img');
    if (img) {
      const icon = document.createElement('span');
      icon.className = 'footer-social-icon';
      icon.append(p.querySelector('picture') ?? img);
      iconsRow.append(icon);
    } else {
      copyrightText = p.textContent;
    }
  });

  socialCol.append(iconsRow);

  // Desktop copyright — inside social column
  if (copyrightText) {
    const copyDesktop = document.createElement('p');
    copyDesktop.className = 'footer-copyright footer-copyright-desktop';
    copyDesktop.textContent = copyrightText;
    socialCol.append(copyDesktop);
  }

  // ── Assemble ──
  const bar = document.createElement('div');
  bar.className = 'footer-bar';
  bar.append(subscribeCol, linksCol, socialCol);

  // Mobile copyright — direct bar child so it can be ordered after links
  if (copyrightText) {
    const copyMobile = document.createElement('p');
    copyMobile.className = 'footer-copyright footer-copyright-mobile';
    copyMobile.textContent = copyrightText;
    bar.append(copyMobile);
  }

  block.append(bar);
}
