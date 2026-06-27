// BookVerse — Reader Component

window.BookVerse = window.BookVerse || {};

BookVerse.reader = {
  renderFallback(book) {
    const links = [];

    if (book.readUrl) {
      links.push(`<a href="${book.readUrl}" target="_blank" rel="noopener" class="btn btn--primary btn--lg">
        📖 Open on ${book.source === 'openlibrary' ? 'Open Library' : 'Google Books'}
      </a>`);
    }

    if (book.readableEditions && book.readableEditions.length > 0) {
      const edition = book.readableEditions[0];
      links.push(`<a href="${edition.readUrl}" target="_blank" rel="noopener" class="btn btn--primary btn--lg">
        📖 Read on Internet Archive
      </a>`);
      if (edition.borrowUrl) {
        links.push(`<a href="${edition.borrowUrl}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg">
          📚 Borrow from Open Library
        </a>`);
      }
    }

    if (book.googleBooksId || book.source === 'google') {
      const gId = book.googleBooksId || book.id;
      links.push(`<a href="https://books.google.com/books?id=${gId}" target="_blank" rel="noopener" class="btn btn--secondary btn--lg">
        📕 View on Google Books
      </a>`);
    }

    return `
      <div class="reader-container__fallback">
        <span class="reader-container__fallback-icon">📖</span>
        <h2 class="reader-container__fallback-title">Read "${BookVerse.helpers.escapeHtml(book.title)}"</h2>
        <p class="reader-container__fallback-text">
          This book is available to read on the following platforms. Click a link below to start reading!
        </p>
        <div class="reader-container__fallback-links">
          ${links.join('')}
        </div>
      </div>
    `;
  },

  // Try to embed Internet Archive reader
  renderArchiveEmbed(ocaid) {
    return `<iframe src="https://archive.org/embed/${ocaid}" style="width:100%;height:100%;border:none" allowfullscreen></iframe>`;
  },
};
