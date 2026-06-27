// BookVerse — Client-Side Hash Router

window.BookVerse = window.BookVerse || {};

BookVerse.Router = class {
  constructor() {
    this.routes = {};
    this.currentPage = null;
    this.appEl = document.getElementById('app');

    window.addEventListener('hashchange', () => this._onRouteChange());
    window.addEventListener('load', () => this._onRouteChange());
  }

  // Register a route: path pattern → handler function
  on(path, handler) {
    this.routes[path] = handler;
    return this; // chainable
  }

  // Navigate to a route
  navigate(path) {
    window.location.hash = path;
  }

  // Get current hash path
  getPath() {
    return window.location.hash.slice(1) || '/';
  }

  // Parse route parameters from path
  _matchRoute(path) {
    for (const [pattern, handler] of Object.entries(this.routes)) {
      // Convert route pattern to regex
      // e.g., /book/:source/:id → /book/([^/]+)/([^/]+)
      const paramNames = [];
      const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });

      const regex = new RegExp(`^${regexStr}$`);
      const match = path.match(regex);

      if (match) {
        const params = {};
        paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });

        // Parse query string
        const queryIndex = window.location.hash.indexOf('?');
        const query = {};
        if (queryIndex !== -1) {
          const searchParams = new URLSearchParams(window.location.hash.slice(queryIndex));
          for (const [key, value] of searchParams) {
            query[key] = value;
          }
        }

        return { handler, params, query };
      }
    }
    return null;
  }

  _onRouteChange() {
    let fullPath = this.getPath();

    // Separate path and query
    const queryIndex = fullPath.indexOf('?');
    const path = queryIndex !== -1 ? fullPath.slice(0, queryIndex) : fullPath;
    const queryStr = queryIndex !== -1 ? fullPath.slice(queryIndex) : '';

    const match = this._matchRoute(path);

    if (match) {
      // Parse query params
      const query = {};
      if (queryStr) {
        const searchParams = new URLSearchParams(queryStr);
        for (const [key, value] of searchParams) {
          query[key] = value;
        }
      }

      // Update active nav link
      this._updateNavLinks(path);

      // Clear and render page
      this.appEl.innerHTML = '';
      this.appEl.className = 'main-content page-enter';
      BookVerse.helpers.scrollToTop();

      match.handler({ params: match.params, query });
    } else {
      // 404 — redirect to home
      this.navigate('/');
    }
  }

  _updateNavLinks(path) {
    const links = document.querySelectorAll('.navbar__link');
    links.forEach(link => {
      const href = link.getAttribute('href')?.replace('#', '') || '';
      const isActive = path === href || (href !== '/' && path.startsWith(href));
      link.classList.toggle('active', isActive);

      // Special case: home is only active for exact match
      if (href === '/') {
        link.classList.toggle('active', path === '/');
      }
    });
  }
};
