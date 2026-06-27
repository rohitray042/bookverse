// BookVerse — Helper Utilities

window.BookVerse = window.BookVerse || {};

BookVerse.helpers = {
  // Debounce function
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // Throttle function
  throttle(fn, limit = 200) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Escape HTML to prevent XSS
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // Truncate text
  truncate(str, maxLen = 100) {
    if (!str || str.length <= maxLen) return str || '';
    return str.slice(0, maxLen).trim() + '…';
  },

  // Format number (e.g., 1200 → "1.2K")
  formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  },

  // Generate star rating HTML
  renderStars(rating, max = 5) {
    if (!rating) return '<span class="stars"><span class="stars__star">☆☆☆☆☆</span></span>';
    let html = '<span class="stars">';
    for (let i = 1; i <= max; i++) {
      if (i <= Math.floor(rating)) {
        html += '<span class="stars__star stars__star--filled">★</span>';
      } else if (i - 0.5 <= rating) {
        html += '<span class="stars__star stars__star--filled">★</span>';
      } else {
        html += '<span class="stars__star">☆</span>';
      }
    }
    html += '</span>';
    return html;
  },

  // Create element from HTML string
  createElement(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
  },

  // Sanitize and strip HTML tags
  stripHtml(html) {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  },

  // Get placeholder color for books without covers
  getPlaceholderColor(title) {
    const colors = [
      'linear-gradient(145deg, #1a1040, #2d1b69)',
      'linear-gradient(145deg, #0a2e3d, #1b4d5c)',
      'linear-gradient(145deg, #2d1524, #4a1f3a)',
      'linear-gradient(145deg, #1a2e0a, #2d4a1b)',
      'linear-gradient(145deg, #2e2a0a, #4a421b)',
      'linear-gradient(145deg, #0a1a2e, #1b2d4a)',
    ];
    const index = (title || '').charCodeAt(0) % colors.length;
    return colors[index];
  },

  // Simple string hash for consistent randomization
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  },

  // Scroll to top smoothly
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
};
