const CLOCK_SVG = '<svg class="search-hero-sugg-icon" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="8" cy="8" r="7.5"></circle><path d="m8.5 4.5v4"></path><path d="m10.3066 10.1387-1.80932-1.5768"></path></svg>';
const SEARCH_SVG = '<svg class="search-hero-sugg-icon" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6.4 0c3.5 0 6.4 2.9 6.4 6.4 0 1.4-.4 2.7-1.2 3.7l4 4c.4.4.4 1 .1 1.5l-.1.1c-.2.2-.5.3-.8.3s-.6-.1-.8-.3l-4-4c-1 .7-2.3 1.2-3.7 1.2-3.4-.1-6.3-3-6.3-6.5s2.9-6.4 6.4-6.4zm0 2.1c-2.3 0-4.3 1.9-4.3 4.3s1.9 4.3 4.3 4.3 4.3-1.9 4.3-4.3-1.9-4.3-4.3-4.3z"></path></svg>';

const STORAGE_KEY = 'search-hero-recent';
const MAX_RECENT = 5;

function getRecent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveRecent(q) {
  const list = [q, ...getRecent().filter((s) => s !== q)].slice(0, MAX_RECENT);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function makeSuggItem(icon, label, url) {
  const li = document.createElement('li');
  li.className = 'search-hero-suggestion';
  const a = document.createElement('a');
  a.href = url || '#';
  a.innerHTML = `${icon}<span>${label}</span>`;
  li.append(a);
  return li;
}

export default function decorate(block) {
  const rows = [...block.children];

  const placeholder = rows[0]?.children[0]?.textContent?.trim() || 'Search';
  const authored = [...rows].slice(1).map((row) => ({
    label: row.children[0]?.textContent?.trim(),
    url: row.children[1]?.textContent?.trim(),
  })).filter((s) => s.label);

  block.innerHTML = '';

  // ── Input row ──
  const inputWrapper = document.createElement('div');
  inputWrapper.className = 'search-hero-input-wrapper';

  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-hero-icon';
  searchIcon.innerHTML = '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6.4 0c3.5 0 6.4 2.9 6.4 6.4 0 1.4-.4 2.7-1.2 3.7l4 4c.4.4.4 1 .1 1.5l-.1.1c-.2.2-.5.3-.8.3s-.6-.1-.8-.3l-4-4c-1 .7-2.3 1.2-3.7 1.2-3.4-.1-6.3-3-6.3-6.5s2.9-6.4 6.4-6.4zm0 2.1c-2.3 0-4.3 1.9-4.3 4.3s1.9 4.3 4.3 4.3 4.3-1.9 4.3-4.3-1.9-4.3-4.3-4.3z"></path></svg>';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = placeholder;
  input.className = 'search-hero-input';
  input.setAttribute('aria-label', placeholder);
  input.setAttribute('autocomplete', 'off');

  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'search-hero-submit';
  submitBtn.setAttribute('aria-label', 'Search');
  submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M11.273 3.09a8.182 8.182 0 1 0 0 16.364 8.182 8.182 0 0 0 0-16.363Zm-7.328.855a10.364 10.364 0 0 1 15.39 13.84l4.164 4.172-1.544 1.541-4.162-4.17A10.364 10.364 0 0 1 3.945 3.945Z" fill="currentColor"/></svg>';

  inputWrapper.append(searchIcon, input, submitBtn);

  // ── Suggestions panel ──
  const panel = document.createElement('div');
  panel.className = 'search-hero-suggestions';
  panel.hidden = true;

  function renderPanel(q) {
    panel.innerHTML = '';
    const recent = getRecent();
    const filter = q.toLowerCase();

    if (recent.length && !filter) {
      const header = document.createElement('p');
      header.className = 'search-hero-recent-header';
      header.textContent = 'Recent searches';
      panel.append(header);

      const ul = document.createElement('ul');
      recent.forEach((term) => {
        ul.append(makeSuggItem(CLOCK_SVG, term, `/en/search?q=${encodeURIComponent(term)}`));
      });
      panel.append(ul);
    }

    const filtered = filter
      ? authored.filter((s) => s.label.toLowerCase().includes(filter))
      : authored;

    if (filtered.length) {
      const ul = document.createElement('ul');
      filtered.forEach(({ label, url }) => ul.append(makeSuggItem(SEARCH_SVG, label, url)));
      panel.append(ul);
    }
  }

  // ── Submit ──
  const doSearch = () => {
    const q = input.value.trim();
    if (q) {
      saveRecent(q);
      window.location.href = `/en/search?q=${encodeURIComponent(q)}`;
    }
  };
  submitBtn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

  // ── Filter on type ──
  input.addEventListener('input', () => renderPanel(input.value));

  // ── Show/hide ──
  input.addEventListener('focus', () => {
    renderPanel(input.value);
    panel.hidden = false;
  });
  input.addEventListener('blur', () => {
    setTimeout(() => { panel.hidden = true; }, 150);
  });

  block.append(inputWrapper, panel);
}
