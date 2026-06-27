// BookVerse — Search Results Page

window.BookVerse = window.BookVerse || {};
BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.search = {
  currentPage: 1,
  currentQuery: '',

  async render({ query }) {
    const app = document.getElementById('app');
    this.currentQuery = query.q || '';
    this.currentPage = parseInt(query.page) || 1;

    app.innerHTML = `
      <section class="search-page container">
        <div class="search-page__header">
          <div style="margin-bottom:var(--space-xl)">
            ${BookVerse.searchBar.render({ value: this.currentQuery })}
          </div>
          <h1 class="search-page__query" id="search-title"></h1>
          <p class="search-page__count" id="search-count"></p>
        </div>
        <div id="search-results">
          ${BookVerse.loader.renderSkeletonGrid(12)}
        </div>
        <div id="search-pagination"></div>
      </section>
    `;

    BookVerse.searchBar.init();

    if (this.currentQuery) {
      await this._doSearch();
    }
  },

  async _doSearch() {
    const titleEl = document.getElementById('search-title');
    const countEl = document.getElementById('search-count');
    const resultsEl = document.getElementById('search-results');
    const paginationEl = document.getElementById('search-pagination');

    titleEl.textContent = `Results for "${this.currentQuery}"`;
    countEl.textContent = 'Searching...';

    try {
      const data = await BookVerse.api.search(this.currentQuery, this.currentPage);

      countEl.textContent = `${BookVerse.helpers.formatNumber(data.totalResults)} books found`;

      if (data.results && data.results.length > 0) {
        BookVerse.bookGrid.renderInto(resultsEl, data.results);

        // Pagination
        const totalPages = Math.min(Math.ceil(data.totalResults / 20), 50);
        if (totalPages > 1) {
          this._renderPagination(paginationEl, totalPages);
        }
      } else {
        resultsEl.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">🔍</span>
            <h3 class="empty-state__title">No results found</h3>
            <p class="empty-state__text">Try different keywords or check your spelling</p>
          </div>
        `;
      }
    } catch (err) {
      resultsEl.innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">😵</span>
          <h3 class="empty-state__title">Something went wrong</h3>
          <p class="empty-state__text">${BookVerse.helpers.escapeHtml(err.message)}</p>
          <button class="btn btn--primary" onclick="location.reload()">Try Again</button>
        </div>
      `;
    }
  },

  _renderPagination(container, totalPages) {
    const current = this.currentPage;
    let html = '<div class="pagination">';

    // Previous
    html += `<button class="pagination__btn" ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">←</button>`;

    // Page numbers
    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    if (start > 1) {
      html += `<button class="pagination__btn" data-page="1">1</button>`;
      if (start > 2) html += `<span style="color:var(--text-muted)">...</span>`;
    }

    for (let i = start; i <= end; i++) {
      html += `<button class="pagination__btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span style="color:var(--text-muted)">...</span>`;
      html += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next
    html += `<button class="pagination__btn" ${current >= totalPages ? 'disabled' : ''} data-page="${current + 1}">→</button>`;

    html += '</div>';
    container.innerHTML = html;

    // Pagination events
    container.querySelectorAll('.pagination__btn:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        window.location.hash = `/search?q=${encodeURIComponent(this.currentQuery)}&page=${page}`;
      });
    });
  },
};
