// BookVerse — Book Card Component

window.BookVerse = window.BookVerse || {};

BookVerse.bookCard = {
  render(book, options = {}) {
    const { showBadge = true } = options;
    const { escapeHtml, renderStars, truncate, getPlaceholderColor } = BookVerse.helpers;
    const isSaved = BookVerse.storage.isOnBookshelf(book.id, book.source);

    const coverHtml = book.cover
      ? `<img class="book-card__cover" src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';

    const placeholderBg = getPlaceholderColor(book.title);

    return `
      <article class="book-card" data-book-id="${escapeHtml(book.id)}" data-book-source="${escapeHtml(book.source)}">
        <div class="book-card__cover-wrapper">
          ${coverHtml}
          <div class="book-card__cover-placeholder" style="background:${placeholderBg};${book.cover ? 'display:none' : ''}">
            📖
          </div>
          ${showBadge && book.hasFulltext ? '<span class="book-card__badge">Free to Read</span>' : ''}
          <button class="book-card__shelf-btn ${isSaved ? 'saved' : ''}"
                  data-action="toggle-shelf"
                  data-book='${JSON.stringify(book).replace(/'/g, '&#39;')}'
                  title="${isSaved ? 'Remove from shelf' : 'Add to shelf'}">
            ${isSaved ? '❤️' : '🤍'}
          </button>
          <div class="book-card__overlay">
            <div class="book-card__actions">
              <button class="btn btn--primary btn--sm" data-action="view-book">View Details</button>
            </div>
          </div>
        </div>
        <div class="book-card__info">
          <h3 class="book-card__title">${escapeHtml(book.title)}</h3>
          <p class="book-card__author">${escapeHtml((book.authors || []).join(', ') || 'Unknown Author')}</p>
          <div class="book-card__meta">
            <div class="book-card__rating">
              ${book.rating ? `${renderStars(book.rating)} <span>${book.rating}</span>` : '<span style="color:var(--text-muted)">No rating</span>'}
            </div>
            ${book.publishYear ? `<span class="book-card__year">${book.publishYear}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  },

  // Attach event listeners to all book cards in a container
  attachEvents(container) {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.book-card');
      if (!card) return;

      const bookId = card.dataset.bookId;
      const bookSource = card.dataset.bookSource;

      // Toggle shelf button
      const shelfBtn = e.target.closest('[data-action="toggle-shelf"]');
      if (shelfBtn) {
        e.stopPropagation();
        const bookData = JSON.parse(shelfBtn.dataset.book);
        const isOnShelf = BookVerse.storage.isOnBookshelf(bookData.id, bookData.source);

        if (isOnShelf) {
          BookVerse.storage.removeFromBookshelf(bookData.id, bookData.source);
          shelfBtn.classList.remove('saved');
          shelfBtn.innerHTML = '🤍';
          shelfBtn.title = 'Add to shelf';
          BookVerse.toast.info('Removed from your shelf');
        } else {
          BookVerse.storage.addToBookshelf(bookData);
          shelfBtn.classList.add('saved');
          shelfBtn.innerHTML = '❤️';
          shelfBtn.title = 'Remove from shelf';
          BookVerse.toast.success('Added to your shelf!');
        }

        // Update badge count
        BookVerse.app?.updateShelfBadge();
        return;
      }

      // Navigate to book detail
      window.location.hash = `/book/${bookSource}/${bookId}`;
    });
  },
};
