// BookVerse — Navbar Component

window.BookVerse = window.BookVerse || {};

BookVerse.navbar = {
  init() {
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const overlay = document.getElementById('mobile-menu-overlay');

    // Mobile menu toggle
    menuToggle?.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    // Close on overlay click
    overlay?.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      overlay.classList.remove('active');
    });

    // Close on link click (mobile)
    navLinks?.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('active');
        overlay.classList.remove('active');
      });
    });

    // Scrolled state
    const navbar = document.getElementById('main-nav');
    window.addEventListener('scroll', BookVerse.helpers.throttle(() => {
      navbar.classList.toggle('navbar--scrolled', window.scrollY > 20);
    }, 100));
  },
};
