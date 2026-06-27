// BookVerse — Bookshelf Page

window.BookVerse = window.BookVerse || {};
BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.bookshelf = {
  render() {
    const app = document.getElementById('app');
    const books = BookVerse.storage.getBookshelf();

    app.innerHTML = `
      <section class="bookshelf-page container">
        <div class="bookshelf-page__header animate-fadeInUp">
          <h1 class="bookshelf-page__title">📚 My Bookshelf</h1>
          <p class="bookshelf-page__count" id="shelf-count">${books.length} ${books.length === 1 ? 'book' : 'books'} saved</p>
        </div>
        ${books.length > 0 ? `
          <div class="bookshelf-page__controls">
            <button class="btn btn--ghost" id="sort-recent">⏱ Most Recent</button>
            <button class="btn btn--ghost" id="sort-title">🔤 Title A–Z</button>
            <button class="btn btn--ghost" id="clear-shelf" style="margin-left:auto;color:var(--accent-red)">🗑️ Clear All</button>
          </div>
        ` : ''}
        <div id="shelf-grid"></div>
      </section>
    `;

    this._renderBooks(books);

    // Sort handlers
    document.getElementById('sort-recent')?.addEventListener('click', () => {
      const sorted = [...books].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      this._renderBooks(sorted);
    });

    document.getElementById('sort-title')?.addEventListener('click', () => {
      const sorted = [...books].sort((a, b) => a.title.localeCompare(b.title));
      this._renderBooks(sorted);
    });

    document.getElementById('clear-shelf')?.addEventListener('click', () => {
      if (confirm('Remove all books from your shelf?')) {
        books.forEach(b => BookVerse.storage.removeFromBookshelf(b.id, b.source));
        BookVerse.toast.info('Bookshelf cleared');
        BookVerse.app?.updateShelfBadge();
        this.render();
      }
    });
  },

  _renderBooks(books) {
    const gridEl = document.getElementById('shelf-grid');
    if (!gridEl) return;

    if (books.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">📚</span>
          <h3 class="empty-state__title">Your shelf is empty</h3>
          <p class="empty-state__text">Start adding books you love! Click the heart icon on any book to save it here.</p>
          <a href="#/" class="btn btn--primary btn--lg">Discover Books</a>
        </div>
      `;
      return;
    }

    BookVerse.bookGrid.renderInto(gridEl, books);
  },
};
