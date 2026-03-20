export default function decorate(block) {
  const rows = [...block.children];
  if (!rows[0]) return;

  // First row is the header
  const headerRow = rows[0];
  headerRow.classList.add('commitment-section-header');

  // Remaining rows contain cards (one row, multiple cols per row possible)
  const cardContainer = document.createElement('div');
  cardContainer.className = 'commitment-section-cards';

  rows.slice(1).forEach((row) => {
    [...row.children].forEach((col) => {
      const card = document.createElement('div');
      card.className = 'commitment-section-card';
      card.append(...col.childNodes);

      // Inject orange divider between h3 and the first paragraph after it
      const h3 = card.querySelector('h3');
      if (h3 && h3.nextElementSibling) {
        const divider = document.createElement('div');
        divider.className = 'commitment-section-card-divider';
        h3.after(divider);
      }

      // Inject arrow circle linked to the heading href
      const headingLink = card.querySelector('h3 a');
      if (headingLink) {
        const arrow = document.createElement('div');
        arrow.className = 'commitment-section-card-arrow';
        const arrowLink = document.createElement('a');
        arrowLink.href = headingLink.href;
        arrowLink.setAttribute('aria-hidden', 'true');
        arrowLink.tabIndex = -1;
        arrowLink.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        arrow.append(arrowLink);
        card.append(arrow);
      }

      cardContainer.append(card);
    });
    row.remove();
  });

  block.append(cardContainer);
}
