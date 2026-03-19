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
      cardContainer.append(card);
    });
    row.remove();
  });

  block.append(cardContainer);
}
