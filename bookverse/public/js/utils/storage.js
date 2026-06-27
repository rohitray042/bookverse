// BookVerse — LocalStorage Manager

window.BookVerse = window.BookVerse || {};

BookVerse.storage = {
  KEYS: {
    BOOKSHELF: 'bookverse_bookshelf',
    THEME: 'bookverse_theme',
    READING_HISTORY: 'bookverse_history',
    PREFERENCES: 'bookverse_prefs',
  },

  _get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  _set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  },

  // === Bookshelf ===
  getBookshelf() {
    return this._get(this.KEYS.BOOKSHELF) || [];
  },

  addToBookshelf(book) {
    const shelf = this.getBookshelf();
    // Check if already exists
    if (shelf.find(b => b.id === book.id && b.source === book.source)) {
      return false; // Already on shelf
    }
    shelf.unshift({
      id: book.id,
      source: book.source,
      title: book.title,
      authors: book.authors,
      cover: book.cover,
      coverMedium: book.coverMedium,
      rating: book.rating,
      publishYear: book.publishYear,
      addedAt: Date.now(),
    });
    this._set(this.KEYS.BOOKSHELF, shelf);
    return true;
  },

  removeFromBookshelf(id, source) {
    const shelf = this.getBookshelf();
    const filtered = shelf.filter(b => !(b.id === id && b.source === source));
    this._set(this.KEYS.BOOKSHELF, filtered);
    return filtered;
  },

  isOnBookshelf(id, source) {
    const shelf = this.getBookshelf();
    return shelf.some(b => b.id === id && b.source === source);
  },

  getBookshelfCount() {
    return this.getBookshelf().length;
  },

  // === Theme ===
  getTheme() {
    return this._get(this.KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    this._set(this.KEYS.THEME, theme);
  },

  // === Reading History ===
  addToHistory(book) {
    const history = this._get(this.KEYS.READING_HISTORY) || [];
    // Remove if already exists
    const filtered = history.filter(b => !(b.id === book.id && b.source === book.source));
    filtered.unshift({
      id: book.id,
      source: book.source,
      title: book.title,
      authors: book.authors,
      cover: book.cover,
      readAt: Date.now(),
    });
    // Keep last 50
    this._set(this.KEYS.READING_HISTORY, filtered.slice(0, 50));
  },

  getHistory() {
    return this._get(this.KEYS.READING_HISTORY) || [];
  },
};
