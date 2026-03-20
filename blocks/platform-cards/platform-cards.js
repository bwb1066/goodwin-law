function buildPanel(row, addDivider = false) {
  const [ctaCol, contentCol] = row.children;
  const panel = document.createElement('div');
  panel.className = 'platform-card';

  if (contentCol) {
    const content = document.createElement('div');
    content.className = 'platform-card-content';
    [...contentCol.children].forEach((el, i) => {
      content.append(el);
      // Orange rule after the first element (heading)
      if (addDivider && i === 0) {
        const rule = document.createElement('div');
        rule.className = 'platform-card-divider';
        content.append(rule);
      }
    });
    panel.append(content);
  }

  if (ctaCol) {
    const link = ctaCol.querySelector('a');
    if (link) {
      link.classList.add('platform-card-cta');
      const ctaWrapper = document.createElement('div');
      ctaWrapper.className = 'platform-card-cta-wrapper';
      ctaWrapper.append(link);
      panel.append(ctaWrapper);
    }
  }

  return panel;
}

export default function decorate(block) {
  const rows = [...block.children];
  const [platformRow, ...industryRows] = rows;

  // Card[0] — "The Goodwin Platform" — always visible, with orange divider
  const platformPanel = buildPanel(platformRow, true);
  platformPanel.classList.add('platform-card-platform');

  // Industry cards — one shown at a time, orange divider between heading and body
  const industryPanels = industryRows.map((row) => buildPanel(row, true));

  const dynamicArea = document.createElement('div');
  dynamicArea.className = 'platform-card-dynamic';
  industryPanels.forEach((p) => dynamicArea.append(p));

  block.textContent = '';
  block.append(platformPanel, dynamicArea);

  // idx -1 = platform card (default); idx 0–5 = Healthcare…Technology
  function showCard(idx) {
    platformPanel.style.display = idx >= 0 ? 'none' : '';
    industryPanels.forEach((p, i) => p.classList.toggle('platform-card-active', i === idx));
  }

  // Pre-scroll default: platform card only, no industry panel
  showCard(-1);

  document.addEventListener('hexagon:segment', (e) => {
    showCard(e.detail.index); // -1 for default, 0–5 for industries
  });
}
