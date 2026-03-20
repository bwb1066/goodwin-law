export default function decorate(block) {
  // Find the section heading (h2 sibling before this block)
  const section = block.closest('.section');

  // Style any standalone link in this section (outside the block) as a theme CTA
  if (section) {
    [...section.querySelectorAll('p > a')].forEach((a) => {
      if (!block.contains(a)) a.classList.add('featured-highlights-view-all');
    });
  }
  const heading = section && section.querySelector('h2');

  if (heading) {
    const wrapper = document.createElement('div');
    wrapper.className = 'featured-highlights-header';
    heading.replaceWith(wrapper);
    wrapper.append(heading);
  }

  // Each row becomes a card
  [...block.children].forEach((row) => {
    row.classList.add('featured-highlights-card');

    const [imgCell, textCell] = row.children;
    if (imgCell) imgCell.classList.add('featured-highlights-image');
    if (textCell) {
      textCell.classList.add('featured-highlights-text');

      // Unwrap title: <h3><strong><a> → keep <a>, promote to card link
      const titleLink = textCell.querySelector('h3 strong a, h3 a');
      if (titleLink) {
        const h3 = titleLink.closest('h3');
        titleLink.classList.add('featured-highlights-title');
        h3.replaceWith(titleLink);
      }

      // Description: split on | — text before = always visible, text after = hover-only
      textCell.querySelectorAll('p').forEach((p) => {
        // Flatten any links to plain text for the description
        p.querySelectorAll('a').forEach((a) => {
          const span = document.createElement('span');
          span.textContent = a.textContent;
          a.replaceWith(span);
        });

        const raw = p.textContent;
        const pipeIdx = raw.indexOf('|');
        if (pipeIdx === -1) return; // no pipe — leave as-is (always visible)

        const before = raw.slice(0, pipeIdx).trim();
        const after = raw.slice(pipeIdx + 1).trim();

        p.textContent = '';
        if (before) {
          const preSpan = document.createElement('span');
          preSpan.className = 'featured-highlights-desc-pre';
          preSpan.textContent = before;
          p.append(preSpan);
        }
        if (after) {
          const postSpan = document.createElement('span');
          postSpan.className = 'featured-highlights-desc-post';
          postSpan.textContent = after;
          p.append(postSpan);
        }
        if (!p.children.length) p.remove();
      });

      // Arrow button
      const arrow = document.createElement('span');
      arrow.className = 'featured-highlights-arrow';
      arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
      textCell.append(arrow);
    }

    // Make entire card a link using the title href
    const titleEl = row.querySelector('.featured-highlights-title');
    if (titleEl) {
      const href = titleEl.getAttribute('href');
      row.style.cursor = 'pointer';
      row.addEventListener('click', () => { window.location.href = href; });
    }
  });
}
