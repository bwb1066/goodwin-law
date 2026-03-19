export default function decorate(block) {
  const img = block.querySelector('img');
  if (img) img.closest('p')?.classList.add('hexagon-image-wrapper');
}
