// BookVerse — Toast Component

window.BookVerse = window.BookVerse || {};

BookVerse.toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
  },

  show(message, type = 'info', duration = 3000) {
    if (!this.container) this.init();

    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span class="toast__message">${BookVerse.helpers.escapeHtml(message)}</span>
      <button class="toast__close" aria-label="Close">&times;</button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => this._remove(toast));

    this.container.appendChild(toast);

    setTimeout(() => this._remove(toast), duration);
  },

  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error', 5000); },
  info(message) { this.show(message, 'info'); },

  _remove(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  },
};
