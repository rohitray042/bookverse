const express = require('express');
const router = express.Router();
const { openLibrary, getCached, setCache, normalizeOpenLibraryBook } = require('../utils/apiClient');

const TRENDING_SECTIONS = [
  { key: 'trending', name: '🔥 Currently Trending', query: 'q=*&sort=rating' },
  { key: 'classic', name: '📖 Classic Literature', query: 'subject=classic_literature&sort=rating' },
  { key: 'scifi', name: '🚀 Science Fiction', query: 'subject=science_fiction&sort=rating' },
  { key: 'mystery', name: '🔍 Mystery & Detective', query: 'subject=mystery&sort=rating' },
  { key: 'romance', name: '💕 Romance', query: 'subject=romance&sort=rating' },
];

// GET /api/trending
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const cacheKey = `trending:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const promises = TRENDING_SECTIONS.map(async (section) => {
      try {
        const response = await openLibrary.get(`/search.json?${section.query}&limit=${limit}&fields=key,title,author_name,cover_i,ratings_average,first_publish_year,has_fulltext,ia`);
        
        const books = (response.data.docs || [])
          .map(normalizeOpenLibraryBook)
          .filter(b => b.cover); // Only return books with covers for trending

        return {
          key: section.key,
          name: section.name,
          books
        };
      } catch (err) {
        console.error(`Error fetching trending ${section.key}:`, err.message);
        return { key: section.key, name: section.name, books: [] };
      }
    });

    const sections = await Promise.all(promises);

    const result = { sections };
    setCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
