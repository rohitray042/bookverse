// BookVerse — Reader Page

window.BookVerse = window.BookVerse || {};
BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.readerPage = {
  async render({ params }) {
    const app = document.getElementById('app');
    const { source, id } = params;

    // Hide footer for reader
    const footer = document.getElementById('main-footer');
    if (footer) footer.style.display = 'none';

    app.innerHTML = `<div class="reader-page">${BookVerse.loader.render()}</div>`;
    app.className = 'main-content';

    try {
      const book = await BookVerse.api.getBook(source, id);
      this._renderReader(app, book);

      // Track reading history
      BookVerse.storage.addToHistory({
        id: book.id,
        source: book.source,
        title: book.title,
        authors: (book.authors || []).map(a => typeof a === 'object' ? a.name : a),
        cover: book.cover || book.coverMedium,
      });
    } catch (err) {
      app.innerHTML = `
        <div class="reader-page">
          <div class="reader-container__fallback">
            <span class="reader-container__fallback-icon">😵</span>
            <h2 class="reader-container__fallback-title">Could not load reader</h2>
            <p class="reader-container__fallback-text">${BookVerse.helpers.escapeHtml(err.message)}</p>
            <a href="#/" class="btn btn--primary btn--lg">Back to Home</a>
          </div>
        </div>
      `;
    }
  },

  _renderReader(app, book) {
    const authorName = (book.authors || []).map(a => typeof a === 'object' ? a.name : a).join(', ');

    // Find readable edition with Internet Archive ID
    let readerContent = '';
    const iaEdition = book.readableEditions?.find(e => e.ocaid);

    if (iaEdition) {
      readerContent = BookVerse.reader.renderArchiveEmbed(iaEdition.ocaid);
    } else {
      readerContent = BookVerse.reader.renderFallback(book);
    }

    app.innerHTML = `
      <div class="reader-page">
        <div class="reader-toolbar">
          <div class="reader-toolbar__info">
            <button class="reader-toolbar__back" id="reader-back" title="Go back">←</button>
            <div>
              <div class="reader-toolbar__title">${BookVerse.helpers.escapeHtml(book.title)}</div>
              <div class="reader-toolbar__author">${BookVerse.helpers.escapeHtml(authorName)}</div>
            </div>
          </div>
          <div class="reader-toolbar__controls">
            <a href="${book.readUrl || '#'}" target="_blank" rel="noopener" class="btn btn--ghost btn--sm">Open External ↗</a>
          </div>
        </div>
        <div class="reader-container">
          ${readerContent}
        </div>
      </div>
    `;

    // Back button
    document.getElementById('reader-back')?.addEventListener('click', () => {
      window.history.back();
    });
  },

  // Cleanup when leaving reader
  cleanup() {
    const footer = document.getElementById('main-footer');
    if (footer) footer.style.display = '';
  },
};
