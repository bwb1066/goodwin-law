export default function decorate(block) {
  const rows = [...block.children];
  if (!rows[0]) return;

  const cols = [...rows[0].children];
  const left = cols[0];
  const right = cols[1];

  if (left) left.classList.add('platform-section-text');
  if (right) right.classList.add('platform-section-visual');

  // Hide the static h2 when platform-cards is present — the card content replaces it
  if (left && left.querySelector('.platform-cards')) {
    const h2 = left.querySelector(':scope > h2');
    if (h2) h2.hidden = true;
  }
}
