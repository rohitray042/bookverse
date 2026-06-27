// BookVerse — Categories Page

window.BookVerse = window.BookVerse || {};
BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.categoriesPage = {
  async render({ params, query }) {
    const app = document.getElementById('app');

    // If a specific category is selected
    if (params && params.category) {
      return this._renderCategoryBooks(app, params.category, query);
    }

    // All categories grid
    app.innerHTML = `
      <section class="categories-page container">
        <h1 class="categories-page__title animate-fadeInUp">📂 Browse Categories</h1>
        <div id="all-categories" class="categories-grid stagger">
        </div>
      </section>
    `;

    try {
      const data = await BookVerse.api.getCategories();
      const grid = document.getElementById('all-categories');
      grid.innerHTML = (data.categories || []).map(cat => `
        <a href="#/category/${cat.key}" class="category-card">
          <span class="category-card__icon">${cat.icon}</span>
          <span class="category-card__name">${BookVerse.helpers.escapeHtml(cat.name)}</span>
        </a>
      `).join('');
    } catch (err) {
      document.getElementById('all-categories').innerHTML =
        '<p style="color:var(--text-muted);text-align:center;grid-column:1/-1">Could not load categories</p>';
    }
  },

  async _renderCategoryBooks(app, category, query = {}) {
    const page = parseInt(query.page) || 1;

    app.innerHTML = `
      <section class="search-page container">
        <div class="search-page__header">
          <a href="#/categories" class="btn btn--ghost" style="margin-bottom:var(--space-md)">← All Categories</a>
          <h1 class="search-page__query" id="cat-title">Loading...</h1>
          <p class="search-page__count" id="cat-count"></p>
        </div>
        <div id="cat-results">
          ${BookVerse.loader.renderSkeletonGrid(12)}
        </div>
        <div id="cat-pagination"></div>
      </section>
    `;

    try {
      const data = await BookVerse.api.getCategoryBooks(category, page, 24);

      document.getElementById('cat-title').textContent = data.category || category;
      document.getElementById('cat-count').textContent =
        `${BookVerse.helpers.formatNumber(data.totalResults)} books`;

      const resultsEl = document.getElementById('cat-results');

      if (data.results && data.results.length > 0) {
        BookVerse.bookGrid.renderInto(resultsEl, data.results);

        // Pagination
        const totalPages = Math.min(Math.ceil(data.totalResults / 24), 20);
        if (totalPages > 1) {
          const paginationEl = document.getElementById('cat-pagination');
          let phtml = '<div class="pagination">';
          phtml += `<button class="pagination__btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">←</button>`;

          for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            phtml += `<button class="pagination__btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
          }

          phtml += `<button class="pagination__btn" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">→</button>`;
          phtml += '</div>';
          paginationEl.innerHTML = phtml;

          paginationEl.querySelectorAll('.pagination__btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
              window.location.hash = `/category/${category}?page=${btn.dataset.page}`;
            });
          });
        }
      } else {
        resultsEl.innerHTML = `
          <div class="empty-state">
            <span class="empty-state__icon">📭</span>
            <h3 class="empty-state__title">No books found in this category</h3>
            <a href="#/categories" class="btn btn--primary">Browse Other Categories</a>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('cat-results').innerHTML = `
        <div class="empty-state">
          <span class="empty-state__icon">😵</span>
          <h3 class="empty-state__title">Could not load books</h3>
          <p class="empty-state__text">${BookVerse.helpers.escapeHtml(err.message)}</p>
        </div>
      `;
    }
  },
};
