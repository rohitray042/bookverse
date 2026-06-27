// BookVerse — Book Grid Component

window.BookVerse = window.BookVerse || {};

BookVerse.bookGrid = {
  render(books, options = {}) {
    const { layout = 'grid', compact = false } = options;

    if (!books || books.length === 0) {
      return `
        <div class="empty-state">
          <span class="empty-state__icon">📚</span>
          <h3 class="empty-state__title">No books found</h3>
          <p class="empty-state__text">Try a different search or browse our categories</p>
        </div>
      `;
    }

    const className = layout === 'row'
      ? 'book-row'
      : `book-grid${compact ? ' book-grid--compact' : ''} stagger`;

    let html = `<div class="${className}">`;
    books.forEach(book => {
      html += BookVerse.bookCard.render(book);
    });
    html += '</div>';
    return html;
  },

  // Render with container and attach events
  renderInto(container, books, options = {}) {
    container.innerHTML = this.render(books, options);
    BookVerse.bookCard.attachEvents(container);
  },
};
