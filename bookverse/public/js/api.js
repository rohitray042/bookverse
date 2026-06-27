// BookVerse — API Client (Frontend)

window.BookVerse = window.BookVerse || {};

BookVerse.api = {
  BASE: '/api',

  async _fetch(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },

  // Search books
  async search(query, page = 1, limit = 20) {
    const provider = BookVerse.storage.getProvider();
    const params = new URLSearchParams({ q: query, page, limit, provider });
    return this._fetch(`${this.BASE}/search?${params}`);
  },

  // Autocomplete suggestions
  async suggest(query) {
    const provider = BookVerse.storage.getProvider();
    const params = new URLSearchParams({ q: query, provider });
    return this._fetch(`${this.BASE}/search/suggest?${params}`);
  },

  // Get book details
  async getBook(source, id) {
    return this._fetch(`${this.BASE}/books/${source}/${id}`);
  },

  // Get trending books
  async getTrending(limit = 12) {
    const provider = BookVerse.storage.getProvider();
    return this._fetch(`${this.BASE}/trending?limit=${limit}&provider=${provider}`);
  },

  // Get categories list
  async getCategories() {
    return this._fetch(`${this.BASE}/categories`);
  },

  // Get books in a category
  async getCategoryBooks(category, page = 1, limit = 24) {
    const provider = BookVerse.storage.getProvider();
    const params = new URLSearchParams({ page, limit, provider });
    return this._fetch(`${this.BASE}/categories/${category}?${params}`);
  },
};
