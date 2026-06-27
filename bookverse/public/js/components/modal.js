// BookVerse — Modal Component

window.BookVerse = window.BookVerse || {};

BookVerse.modal = {
  overlay: null,
  modal: null,
  contentEl: null,

  init() {
    this.overlay = document.getElementById('book-modal-overlay');
    this.modal = document.getElementById('book-modal');
    this.contentEl = document.getElementById('modal-content');

    document.getElementById('modal-close')?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay?.classList.contains('active')) {
        this.close();
      }
    });
  },

  open(html) {
    if (!this.overlay) this.init();
    this.contentEl.innerHTML = html;
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  close() {
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  },
};
