// BookVerse — Home Page

window.BookVerse = window.BookVerse || {};

BookVerse.pages = BookVerse.pages || {};

BookVerse.pages.home = {
  async render() {
    const app = document.getElementById('app');

    // Create particles HTML
    let particlesHtml = '';
    for (let i = 0; i < 20; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 15;
      const duration = 10 + Math.random() * 15;
      const size = 2 + Math.random() * 4;
      particlesHtml += `<div class="hero__particle" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px"></div>`;
    }

    app.innerHTML = `
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__particles">${particlesHtml}</div>
        <div class="hero__content container">
          <div class="hero__badge">
            <span class="hero__badge-dot"></span>
            20M+ Books Available
          </div>
          <h1 class="hero__title">
            <span>Discover the</span>
            <span class="text-gradient">Universe of Books</span>
          </h1>
          <p class="hero__subtitle">
            Search, discover, and read millions of books for free. Your personal digital library, powered by the world's largest open book collections.
          </p>
          <div class="hero__search">
            ${BookVerse.searchBar.render({ placeholder: 'Search by title, author, or ISBN...' })}
          </div>
          <div class="hero__stats">
            <div class="hero__stat">
              <div class="hero__stat-number">20M+</div>
              <div class="hero__stat-label">Books</div>
            </div>
            <div class="hero__stat">
              <div class="hero__stat-number">6M+</div>
              <div class="hero__stat-label">Authors</div>
            </div>
            <div class="hero__stat">
              <div class="hero__stat-number">70K+</div>
              <div class="hero__stat-label">Free to Read</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trending Sections -->
      <div id="trending-content" class="container">
        ${BookVerse.loader.renderSkeletonRow(6)}
      </div>

      <!-- Browse Categories -->
      <section class="categories-section container" id="categories-section" style="padding-bottom:var(--space-4xl)">
        <div class="section-header">
          <h2 class="section-header__title">Browse Categories</h2>
          <a href="#/categories" class="section-header__link">View All →</a>
        </div>
        <div id="categories-grid" class="categories-grid">
        </div>
      </section>
    `;

    // Initialize search bar
    BookVerse.searchBar.init();

    // Load trending books
    this._loadTrending();

    // Load categories
    this._loadCategories();
  },

  async _loadTrending() {
    const container = document.getElementById('trending-content');
    try {
      const data = await BookVerse.api.getTrending(12);

      if (data.sections && data.sections.length > 0) {
        container.innerHTML = data.sections.map(section => `
          <section class="trending-section">
            <div class="section-header">
              <h2 class="section-header__title">${BookVerse.helpers.escapeHtml(section.name)}</h2>
              <a href="#/category/${section.key}" class="section-header__link">See More →</a>
            </div>
            <div id="trending-${section.key}"></div>
          </section>
        `).join('');

        // Render books for each section
        data.sections.forEach(section => {
          const sectionEl = document.getElementById(`trending-${section.key}`);
          if (sectionEl) {
            BookVerse.bookGrid.renderInto(sectionEl, section.books, { layout: 'row' });
          }
        });
      } else {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-2xl)">Loading trending books...</p>';
      }
    } catch (err) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:var(--space-2xl)">Could not load trending books. Try searching instead!</p>';
    }
  },

  async _loadCategories() {
    const grid = document.getElementById('categories-grid');
    try {
      const data = await BookVerse.api.getCategories();
      grid.innerHTML = (data.categories || []).slice(0, 8).map(cat => `
        <a href="#/category/${cat.key}" class="category-card">
          <span class="category-card__icon">${cat.icon}</span>
          <span class="category-card__name">${BookVerse.helpers.escapeHtml(cat.name)}</span>
        </a>
      `).join('');
    } catch (err) {
      grid.innerHTML = '<p style="color:var(--text-muted)">Could not load categories</p>';
    }
  },
};
