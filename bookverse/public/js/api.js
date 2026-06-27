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
    const params = new URLSearchParams({ q: query, page, limit });
    return this._fetch(`${this.BASE}/search?${params}`);
  },

  // Autocomplete suggestions
  async suggest(query) {
    const params = new URLSearchParams({ q: query });
    return this._fetch(`${this.BASE}/search/suggest?${params}`);
  },

  // Get book details
  async getBook(source, id) {
    return this._fetch(`${this.BASE}/books/${source}/${id}`);
  },

  // Get trending books
  async getTrending(limit = 12) {
    return this._fetch(`${this.BASE}/trending?limit=${limit}`);
  },

  // Get categories list
  async getCategories() {
    return this._fetch(`${this.BASE}/categories`);
  },

  // Get books in a category
  async getCategoryBooks(category, page = 1, limit = 24) {
    const params = new URLSearchParams({ page, limit });
    return this._fetch(`${this.BASE}/categories/${category}?${params}`);
  },
};
