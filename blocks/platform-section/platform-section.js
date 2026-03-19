export default function decorate(block) {
  const rows = [...block.children];
  if (!rows[0]) return;

  const cols = [...rows[0].children];
  const left = cols[0];
  const right = cols[1];

  if (left) left.classList.add('platform-section-text');
  if (right) right.classList.add('platform-section-visual');

  // Style the "Explore" link as a button
  const link = left && left.querySelector('a');
  if (link) link.classList.add('platform-section-link');
}
