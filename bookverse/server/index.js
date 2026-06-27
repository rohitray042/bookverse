require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const searchRoutes = require('./routes/search');
const booksRoutes = require('./routes/books');
const trendingRoutes = require('./routes/trending');
const categoriesRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/search', searchRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/categories', categoriesRoutes);

// SPA fallback — serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
  });
});
 
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n📚 BookVerse server running at http://localhost:${PORT}\n`);
  });
}

// Export the Express API for Vercel
module.exports = app;
