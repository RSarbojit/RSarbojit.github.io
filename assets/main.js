// Name to highlight in author lists (matched on last name + first initial).
const ME = { last: 'Roy', first: 'S' };

const GROUPS = [
  { title: 'Published', types: ['article', 'inproceedings', 'incollection', 'book'] },
  { title: 'Preprints', types: ['misc', 'techreport'] },
  { title: 'In preparation', types: ['unpublished'] },
];

// Minimal BibTeX parser: handles {braced} and "quoted" values, nested braces and bare numbers.
function parseBibtex(src) {
  const entries = [];
  const re = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g;
  let m;
  while ((m = re.exec(src))) {
    const type = m[1].toLowerCase();
    if (type === 'comment' || type === 'string' || type === 'preamble') continue;
    const fields = {};
    let i = re.lastIndex;
    while (i < src.length) {
      const fm = /^\s*([\w-]+)\s*=\s*/.exec(src.slice(i));
      if (!fm) break;
      i += fm[0].length;
      let value = '';
      if (src[i] === '{' || src[i] === '"') {
        const close = src[i] === '{' ? '}' : '"';
        let depth = 0, j = i + 1;
        for (; j < src.length; j++) {
          if (src[j] === '{') depth++;
          else if (src[j] === '}' && depth > 0) depth--;
          else if (src[j] === close && depth === 0) break;
        }
        value = src.slice(i + 1, j);
        i = j + 1;
      } else {
        const bare = /^[^,}\s]+/.exec(src.slice(i));
        value = bare ? bare[0] : '';
        i += value.length;
      }
      fields[fm[1].toLowerCase()] = value.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();
      const sep = /^\s*,?/.exec(src.slice(i));
      i += sep[0].length;
      if (/^\s*\}/.test(src.slice(i))) break;
    }
    const end = src.indexOf('\n}', i);
    entries.push({ type, key: m[2], fields, raw: src.slice(m.index, end === -1 ? undefined : end + 2).trim() });
    re.lastIndex = i;
  }
  return entries;
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function formatAuthors(str) {
  const names = str.split(/\s+and\s+/).map(n => {
    const [last, first = ''] = n.includes(',') ? n.split(',').map(s => s.trim()) : [n.split(' ').pop(), n.split(' ').slice(0, -1).join(' ')];
    const isMe = last === ME.last && first.startsWith(ME.first);
    const label = esc(`${first} ${last}`.trim());
    return isMe ? `<b>${label}</b>` : label;
  });
  return names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names.at(-1) : names[0];
}

function venue(f) {
  if (f.journal) {
    let v = f.journal;
    if (f.volume) v += `, ${f.volume}${f.number ? `(${f.number})` : ''}`;
    if (f.pages) v += `: ${f.pages.replace('--', '–')}`;
    return v;
  }
  if (f.booktitle) return f.booktitle + (f.pages ? `, pp. ${f.pages.replace('--', '–')}` : '');
  if (f.eprint) return `arXiv:${f.eprint}`;
  return f.note || '';
}

function renderEntry(e) {
  const f = e.fields;
  const link = f.url || (f.doi && `https://doi.org/${f.doi}`) || (f.eprint && `https://arxiv.org/abs/${f.eprint}`);
  const actions = [
    f.pdf && `<a class="chip" href="${esc(f.pdf)}">PDF</a>`,
    f.doi && `<a class="chip" href="https://doi.org/${esc(f.doi)}">DOI</a>`,
    f.eprint && `<a class="chip" href="https://arxiv.org/abs/${esc(f.eprint)}">arXiv</a>`,
    f.url && !f.doi && `<a class="chip" href="${esc(f.url)}">Paper</a>`,
    f.code && `<a class="chip" href="${esc(f.code)}">Code</a>`,
    e.type !== 'unpublished' && `<button class="chip" type="button" data-bib>BibTeX</button>`,
  ].filter(Boolean).join('');
  const title = link ? `<a class="title" href="${esc(link)}">${esc(f.title)}</a>` : `<span class="title">${esc(f.title)}</span>`;
  return `<article class="pub">
    <div class="year">${esc(f.year || '')}</div>
    <div>
      ${title}
      <div class="authors">${formatAuthors(f.author || '')}</div>
      ${e.type === 'unpublished' ? '' : `<div class="venue">${esc(venue(f))}</div>`}
      ${actions ? `<div class="actions">${actions}</div>` : ''}
      <pre class="bibtex" hidden>${esc(e.raw)}</pre>
    </div>
  </article>`;
}

async function loadPublications() {
  const target = document.getElementById('pub-list');
  try {
    const res = await fetch('data/publications.bib');
    if (!res.ok) throw new Error(res.status);
    const entries = parseBibtex(await res.text());
    target.innerHTML = GROUPS.map(g => {
      const items = entries.filter(e => g.types.includes(e.type)).sort((a, b) => (b.fields.year || 0) - (a.fields.year || 0));
      if (!items.length) return '';
      return `<div class="pub-group"><h3>${g.title}<span class="count">${items.length}</span></h3>${items.map(renderEntry).join('')}</div>`;
    }).join('');
  } catch (err) {
    target.innerHTML = '<p class="muted">Publications could not be loaded. If you opened this file directly, serve the folder over HTTP instead (see README).</p>';
  }
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-bib]');
  if (!btn) return;
  const pre = btn.closest('.pub').querySelector('.bibtex');
  pre.hidden = !pre.hidden;
  if (!pre.hidden) navigator.clipboard?.writeText(pre.textContent).then(() => {
    btn.textContent = 'Copied';
    setTimeout(() => (btn.textContent = 'BibTeX'), 1500);
  }, () => {});
});

// Theme toggle: remembers an explicit choice, otherwise follows the system.
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
});

// Highlight the nav link for the section in view.
const navLinks = [...document.querySelectorAll('.nav a')];
const observer = new IntersectionObserver(items => {
  items.forEach(it => {
    if (it.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.hash === '#' + it.target.id));
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section').forEach(s => observer.observe(s));

document.getElementById('year').textContent = new Date().getFullYear();
loadPublications();
