// BookVerse — Book Detail Page

window.BookVerse = window.BookVerse || {};
BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.bookDetail = {
  async render({ params }) {
    const app = document.getElementById('app');
    const { source, id } = params;

    app.innerHTML = `<section class="book-detail container">${BookVerse.loader.render()}</section>`;

    try {
      const book = await BookVerse.api.getBook(source, id);
      this._renderBook(app, book);
    } catch (err) {
      app.innerHTML = `
        <section class="book-detail container">
          <div class="empty-state">
            <span class="empty-state__icon">😵</span>
            <h3 class="empty-state__title">Book not found</h3>
            <p class="empty-state__text">${BookVerse.helpers.escapeHtml(err.message)}</p>
            <a href="#/" class="btn btn--primary">Back to Home</a>
          </div>
        </section>
      `;
    }
  },

  _renderBook(app, book) {
    const { escapeHtml, renderStars, stripHtml } = BookVerse.helpers;
    const isSaved = BookVerse.storage.isOnBookshelf(book.id, book.source);
    const description = stripHtml(book.description || '');

    // Authors section
    const authorsHtml = (book.authors || []).map(a => {
      if (typeof a === 'object') {
        return `<a href="#/search?q=${encodeURIComponent(a.name)}">${escapeHtml(a.name)}</a>`;
      }
      return `<a href="#/search?q=${encodeURIComponent(a)}">${escapeHtml(a)}</a>`;
    }).join(', ') || 'Unknown Author';

    // Cover
    const coverUrl = book.cover || book.coverMedium;
    const coverHtml = coverUrl
      ? `<img class="book-detail__cover" src="${escapeHtml(coverUrl)}" alt="${escapeHtml(book.title)}">`
      : `<div class="book-detail__cover-placeholder">📖</div>`;

    // Meta items
    const metaItems = [];
    if (book.rating) {
      metaItems.push(`
        <div class="book-detail__meta-item">
          <span class="book-detail__meta-label">Rating</span>
          <span class="book-detail__meta-value">${renderStars(book.rating)} ${book.rating} (${BookVerse.helpers.formatNumber(book.ratingsCount)})</span>
        </div>
      `);
    }
    if (book.firstPublishDate || book.publishedDate || book.publishYear) {
      metaItems.push(`
        <div class="book-detail__meta-item">
          <span class="book-detail__meta-label">Published</span>
          <span class="book-detail__meta-value">${escapeHtml(book.firstPublishDate || book.publishedDate || String(book.publishYear))}</span>
        </div>
      `);
    }
    if (book.editionCount) {
      metaItems.push(`
        <div class="book-detail__meta-item">
          <span class="book-detail__meta-label">Editions</span>
          <span class="book-detail__meta-value">${book.editionCount}</span>
        </div>
      `);
    }
    if (book.pageCount) {
      metaItems.push(`
        <div class="book-detail__meta-item">
          <span class="book-detail__meta-label">Pages</span>
          <span class="book-detail__meta-value">${book.pageCount}</span>
        </div>
      `);
    }

    // Read actions
    const readActions = [];
    if (book.readableEditions && book.readableEditions.length > 0) {
      const edition = book.readableEditions[0];
      readActions.push(`<a href="#/read/${book.source}/${book.id}" class="btn btn--primary btn--lg">📖 Read Now</a>`);
    } else if (book.readUrl) {
      readActions.push(`<a href="${escapeHtml(book.readUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--lg">📖 View on ${book.source === 'openlibrary' ? 'Open Library' : 'Google Books'}</a>`);
    }

    if (book.googleBooksId || book.source === 'google') {
      const gId = book.googleBooksId || book.id;
      readActions.push(`<a href="https://books.google.com/books?id=${gId}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg">📕 Google Books</a>`);
    }

    // Subjects/Tags
    const subjectsHtml = (book.subjects || []).map(s =>
      `<a href="#/search?q=${encodeURIComponent(s)}" class="tag">${escapeHtml(s)}</a>`
    ).join('');

    // Editions section
    let editionsHtml = '';
    if (book.readableEditions && book.readableEditions.length > 0) {
      editionsHtml = `
        <section class="editions-section">
          <h2 class="section-header__title" style="margin-bottom:var(--space-lg)">📚 Available Editions</h2>
          ${book.readableEditions.map(e => `
            <div class="edition-card">
              <div class="edition-card__info">
                <div class="edition-card__title">${escapeHtml(e.title || book.title)}</div>
                <div class="edition-card__meta">
                  ${e.publishers?.join(', ') || ''} ${e.publishDate ? `• ${e.publishDate}` : ''} ${e.isbn ? `• ISBN: ${e.isbn}` : ''}
                </div>
              </div>
              <a href="${escapeHtml(e.readUrl)}" target="_blank" rel="noopener" class="btn btn--primary btn--sm">Read</a>
            </div>
          `).join('')}
        </section>
      `;
    }

    const bookDataForShelf = {
      id: book.id,
      source: book.source,
      title: book.title,
      authors: (book.authors || []).map(a => typeof a === 'object' ? a.name : a),
      cover: book.cover || book.coverMedium,
      coverMedium: book.coverMedium,
      rating: book.rating,
      publishYear: book.publishYear || book.firstPublishDate,
    };

    app.innerHTML = `
      <section class="book-detail container animate-fadeIn">
        <div class="book-detail__hero">
          <div class="book-detail__cover-wrapper">
            ${coverHtml}
          </div>
          <div class="book-detail__info">
            <h1 class="book-detail__title">${escapeHtml(book.title)}</h1>
            <p class="book-detail__authors">by ${authorsHtml}</p>
            <div class="book-detail__meta">${metaItems.join('')}</div>
            ${description ? `
              <div class="book-detail__description" id="book-description">${escapeHtml(description)}</div>
              ${description.length > 300 ? `<button class="btn btn--ghost" id="toggle-description" style="align-self:flex-start">Show more</button>` : ''}
            ` : ''}
            <div class="book-detail__actions">
              ${readActions.join('')}
              <button class="btn btn--secondary btn--lg" id="shelf-toggle-btn" data-book='${JSON.stringify(bookDataForShelf).replace(/'/g, '&#39;')}'>
                ${isSaved ? '❤️ On Your Shelf' : '🤍 Add to Shelf'}
              </button>
            </div>
            ${subjectsHtml ? `<div class="book-detail__subjects">${subjectsHtml}</div>` : ''}
          </div>
        </div>
        ${editionsHtml}
      </section>
    `;

    // Description toggle
    const descEl = document.getElementById('book-description');
    const toggleBtn = document.getElementById('toggle-description');
    if (descEl && toggleBtn && description.length > 300) {
      descEl.classList.add('clamped');
      toggleBtn.addEventListener('click', () => {
        const isClamped = descEl.classList.toggle('clamped');
        toggleBtn.textContent = isClamped ? 'Show more' : 'Show less';
      });
    }

    // Shelf toggle
    const shelfBtn = document.getElementById('shelf-toggle-btn');
    shelfBtn?.addEventListener('click', () => {
      const data = JSON.parse(shelfBtn.dataset.book);
      const onShelf = BookVerse.storage.isOnBookshelf(data.id, data.source);
      if (onShelf) {
        BookVerse.storage.removeFromBookshelf(data.id, data.source);
        shelfBtn.innerHTML = '🤍 Add to Shelf';
        BookVerse.toast.info('Removed from your shelf');
      } else {
        BookVerse.storage.addToBookshelf(data);
        shelfBtn.innerHTML = '❤️ On Your Shelf';
        BookVerse.toast.success('Added to your shelf!');
      }
      BookVerse.app?.updateShelfBadge();
    });
  },
};
