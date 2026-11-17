// Правовой раздел: статьи лежат в data/articles.json, страница рисует их
// через createElement/textContent — никакого innerHTML, поэтому ни текст
// статьи, ни hash в адресе не могут внедрить разметку или скрипт.
(function () {
  'use strict';

  const view = document.getElementById('view');
  let articles = [];

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Ссылки только https://, картинки только из своей папки img/ — даже если
  // в JSON когда-нибудь попадёт чужая или кривая запись, javascript:/data:
  // и внешние адреса отсеются здесь.
  function safeUrl(u) {
    try {
      const url = new URL(u, location.href);
      return url.protocol === 'https:' ? url.href : null;
    } catch (e) { return null; }
  }
  function safeImg(p) {
    return typeof p === 'string' && /^img\/[\w\-\/.]+\.(jpe?g|png|webp)$/i.test(p) ? p : null;
  }

  function renderList() {
    document.title = 'Правовая помощь — Безвестный полк';
    view.replaceChildren();

    view.appendChild(el('h1', null, 'Правовая помощь'));
    view.appendChild(el('p', 'lede',
      'Разборы для семей военнослужащих, пропавших без вести: какие у родных есть права, какие документы нужны и куда обращаться.'));

    if (!articles.length) {
      view.appendChild(el('p', 'empty', 'Материалы пока не опубликованы.'));
      return;
    }

    const grid = el('div', 'cards');
    for (const a of articles) {
      const card = el('a', 'card');
      card.href = '#' + encodeURIComponent(a.slug);

      const cover = safeImg(a.cover);
      if (cover) {
        const img = el('img');
        img.src = cover;
        img.alt = '';
        img.loading = 'lazy';
        card.appendChild(img);
      }
      const body = el('div', 'card-body');
      body.appendChild(el('h2', 'card-title', a.title));
      if (a.summary) body.appendChild(el('p', 'card-summary', a.summary));
      card.appendChild(body);
      grid.appendChild(card);
    }
    view.appendChild(grid);
  }

  function renderBlock(block, article) {
    switch (block.type) {
      case 'p':
        return el('p', null, block.text);
      case 'h':
        return el('h2', null, block.text);
      case 'ul': {
        const ul = el('ul');
        for (const item of block.items || []) ul.appendChild(el('li', null, item));
        return ul;
      }
      case 'cta': {
        const box = el('div', 'cta');
        box.appendChild(el('p', null, block.text));
        const href = safeUrl(block.url);
        if (href) {
          const a = el('a', null, block.label || href);
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          box.appendChild(a);
        }
        return box;
      }
      default:
        return null;
    }
  }

  function renderArticle(article) {
    document.title = article.title + ' — Безвестный полк';
    view.replaceChildren();

    const wrap = el('article', 'article');
    const back = el('a', 'back', '← Все материалы');
    back.href = '#';
    wrap.appendChild(back);
    wrap.appendChild(el('h1', null, article.title));

    const cover = safeImg(article.cover);
    if (cover) {
      const img = el('img', 'cover');
      img.src = cover;
      img.alt = '';
      wrap.appendChild(img);
    }
    for (const block of article.blocks || []) {
      const node = renderBlock(block, article);
      if (node) wrap.appendChild(node);
    }
    view.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  function route() {
    const slug = decodeURIComponent(location.hash.replace(/^#/, ''));
    // slug только ищется среди загруженных статей, в разметку он не попадает
    const article = slug && articles.find(a => a.slug === slug);
    if (article) renderArticle(article); else renderList();
  }

  fetch('data/articles.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => { articles = Array.isArray(data) ? data : []; route(); })
    .catch(() => {
      view.replaceChildren(el('p', 'empty',
        'Не удалось загрузить материалы. Если вы открыли файл напрямую (file://), запустите локальный сервер.'));
    });

  window.addEventListener('hashchange', route);
})();
