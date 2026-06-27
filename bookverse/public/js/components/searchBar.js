// BookVerse — Search Bar Component

window.BookVerse = window.BookVerse || {};

BookVerse.searchBar = {
  render(options = {}) {
    const { placeholder = 'Search books, authors, ISBN...', size = 'normal', value = '' } = options;

    return `
      <div class="search-bar${size === 'large' ? ' search-bar--large' : ''}">
        <div class="search-bar__wrapper">
          <span class="search-bar__icon">🔍</span>
          <input type="text"
                 class="search-bar__input"
                 id="search-input"
                 placeholder="${placeholder}"
                 value="${BookVerse.helpers.escapeHtml(value)}"
                 autocomplete="off"
                 aria-label="Search books">
          <button class="search-bar__clear" id="search-clear" aria-label="Clear search">&times;</button>
          <button class="search-bar__btn" id="search-btn">Search</button>
        </div>
        <div class="search-bar__suggestions" id="search-suggestions"></div>
      </div>
    `;
  },

  init() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsEl = document.getElementById('search-suggestions');

    if (!input) return;

    const doSearch = () => {
      const query = input.value.trim();
      if (query) {
        suggestionsEl.classList.remove('visible');
        window.location.hash = `/search?q=${encodeURIComponent(query)}`;
      }
    };

    // Submit on enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
      if (e.key === 'Escape') {
        suggestionsEl.classList.remove('visible');
        input.blur();
      }
    });

    // Search button click
    searchBtn?.addEventListener('click', doSearch);

    // Clear button
    clearBtn?.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.remove('visible');
      suggestionsEl.classList.remove('visible');
      input.focus();
    });

    // Toggle clear button visibility
    input.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', input.value.length > 0);
    });

    // Initial clear button state
    clearBtn.classList.toggle('visible', input.value.length > 0);

    // Autocomplete suggestions
    const fetchSuggestions = BookVerse.helpers.debounce(async (query) => {
      if (query.length < 2) {
        suggestionsEl.classList.remove('visible');
        return;
      }

      try {
        const data = await BookVerse.api.suggest(query);
        if (data.suggestions && data.suggestions.length > 0) {
          suggestionsEl.innerHTML = data.suggestions.map(s => `
            <div class="search-bar__suggestion" data-title="${BookVerse.helpers.escapeHtml(s.title)}">
              ${s.cover
                ? `<img class="search-bar__suggestion-cover" src="${s.cover}" alt="" loading="lazy">`
                : '<div class="search-bar__suggestion-cover" style="display:flex;align-items:center;justify-content:center;font-size:1rem">📖</div>'
              }
              <div class="search-bar__suggestion-info">
                <div class="search-bar__suggestion-title">${BookVerse.helpers.escapeHtml(s.title)}</div>
                <div class="search-bar__suggestion-author">${BookVerse.helpers.escapeHtml(s.author)}</div>
              </div>
            </div>
          `).join('');

          suggestionsEl.classList.add('visible');

          // Click suggestion
          suggestionsEl.querySelectorAll('.search-bar__suggestion').forEach(el => {
            el.addEventListener('click', () => {
              input.value = el.dataset.title;
              suggestionsEl.classList.remove('visible');
              doSearch();
            });
          });
        } else {
          suggestionsEl.classList.remove('visible');
        }
      } catch {
        suggestionsEl.classList.remove('visible');
      }
    }, 350);

    input.addEventListener('input', () => fetchSuggestions(input.value.trim()));

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) {
        suggestionsEl.classList.remove('visible');
      }
    });
  },
};
