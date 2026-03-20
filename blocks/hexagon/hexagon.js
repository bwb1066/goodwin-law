export default async function decorate(block) {
  const resp = await fetch('/icons/hexagon.svg');
  if (!resp.ok) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(await resp.text(), 'image/svg+xml');
  const svg = doc.querySelector('svg');
  if (!svg) return;

  // 6 ring hit-area paths (first <g> in the SVG)
  const rings = [...svg.querySelector('g').querySelectorAll('path')];

  // 6 gradient fill paths (the fadeOut group)
  const fadeGroup = [...svg.querySelectorAll('g')].find((g) => g.className.baseVal.includes('fadeOut'));
  const fadePaths = fadeGroup ? [...fadeGroup.querySelectorAll('path')] : [];

  // 7 textLink groups — [0] = "The Goodwin Platform", [1-6] = industries
  const textLinks = [...svg.querySelectorAll('g')].filter((g) => g.className.baseVal.includes('textLink'));
  const industryLinks = textLinks.slice(1);

  // Add stable classes; strip React module class names
  rings.forEach((r) => { r.className.baseVal = 'hex-ring'; });
  fadePaths.forEach((p) => { p.classList.add('hex-fade'); });
  textLinks.forEach((t) => { t.className.baseVal = 'hex-label'; });

  // Clockwise draw order for scroll-in animation
  [5, 3, 4, 1, 0, 2].forEach((pathIdx, order) => {
    if (fadePaths[pathIdx]) fadePaths[pathIdx].dataset.order = order;
  });

  // Default: all gradient segments visible, "The Goodwin Platform" label orange
  function setDefault() {
    svg.classList.remove('hex-industry-active');
    rings.forEach((r) => r.classList.remove('hex-ring-active'));
    textLinks.forEach((t) => t.classList.remove('hex-label-active'));
    textLinks[0].classList.add('hex-label-active');
    document.dispatchEvent(new CustomEvent('hexagon:segment', { detail: { index: -1 } }));
  }

  // Industry hover: fade out all gradient fills, fill the corresponding ring solid orange
  function activate(idx) {
    svg.classList.add('hex-industry-active');
    rings.forEach((r, i) => r.classList.toggle('hex-ring-active', i === idx));
    textLinks.forEach((t) => t.classList.remove('hex-label-active'));
    industryLinks[idx].classList.add('hex-label-active');
    document.dispatchEvent(new CustomEvent('hexagon:segment', { detail: { index: idx } }));
  }

  // Only text labels trigger the hover state
  industryLinks.forEach((label, idx) => {
    label.style.cursor = 'pointer';
    label.addEventListener('mouseenter', () => activate(idx));
  });

  // Mouse leaving the SVG reverts to default
  svg.addEventListener('mouseleave', setDefault);

  block.textContent = '';
  block.append(svg);

  // Scroll-in: draw border clockwise when hexagon enters the viewport
  const io = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    io.disconnect();

    svg.classList.add('hex-build');

    setTimeout(() => {
      svg.classList.remove('hex-build');
      svg.classList.add('hex-ready');
      setDefault();
    }, 2200);
  }, { threshold: 0.5, rootMargin: '0px 0px -15% 0px' });

  io.observe(block);
}
