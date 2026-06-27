// BookVerse — Main Application

window.BookVerse = window.BookVerse || {};

BookVerse.app = {
  router: null,

  init() {
    // Initialize theme
    this._initTheme();

    // Initialize components
    BookVerse.toast.init();
    BookVerse.modal.init();
    BookVerse.navbar.init();

    // Initialize router
    this.router = new BookVerse.Router();

    this.router
      .on('/', ({ query }) => {
        BookVerse.pages.home.render();
      })
      .on('/search', ({ query }) => {
        BookVerse.pages.search.render({ query });
      })
      .on('/book/:source/:id', ({ params }) => {
        // Cleanup reader if navigating away
        BookVerse.pages.readerPage.cleanup?.();
        BookVerse.pages.bookDetail.render({ params });
      })
      .on('/read/:source/:id', ({ params }) => {
        BookVerse.pages.readerPage.render({ params });
      })
      .on('/bookshelf', () => {
        BookVerse.pages.readerPage.cleanup?.();
        BookVerse.pages.bookshelf.render();
      })
      .on('/categories', ({ query }) => {
        BookVerse.pages.readerPage.cleanup?.();
        BookVerse.pages.categoriesPage.render({ params: {}, query });
      })
      .on('/category/:category', ({ params, query }) => {
        BookVerse.pages.readerPage.cleanup?.();
        BookVerse.pages.categoriesPage.render({ params, query });
      });

    // Update shelf badge
    this.updateShelfBadge();

    console.log('📚 BookVerse initialized!');
  },

  _initTheme() {
    const theme = BookVerse.storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    this._updateThemeIcon(theme);

    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      BookVerse.storage.setTheme(next);
      this._updateThemeIcon(next);
    });
  },

  _updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) {
      // If dark theme, show Sun (to switch to Day). If light theme, show Moon (to switch to Dark).
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    if (text) {
      text.textContent = theme === 'dark' ? 'Day' : 'Dark';
    }
  },

  updateShelfBadge() {
    const badge = document.getElementById('shelf-badge');
    const count = BookVerse.storage.getBookshelfCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  },
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  BookVerse.app.init();
});
