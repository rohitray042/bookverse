// BookVerse — Loader Component

window.BookVerse = window.BookVerse || {};

BookVerse.loader = {
  // Full-page spinner
  render() {
    return `
      <div class="loader">
        <div>
          <div class="loader__spinner"></div>
          <p class="loader__text">Discovering books...</p>
        </div>
      </div>
    `;
  },

  // Skeleton book cards
  renderSkeletonGrid(count = 12) {
    let html = '<div class="book-grid stagger">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton skeleton-card__cover"></div>
          <div class="skeleton skeleton-card__title"></div>
          <div class="skeleton skeleton-card__author"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },

  // Skeleton row
  renderSkeletonRow(count = 6) {
    let html = '<div class="book-row">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card" style="min-width:180px">
          <div class="skeleton skeleton-card__cover"></div>
          <div class="skeleton skeleton-card__title"></div>
          <div class="skeleton skeleton-card__author"></div>
        </div>
      `;
    }
    html += '</div>';
    return html;
  },
};
