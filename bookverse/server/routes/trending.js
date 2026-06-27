const express = require('express');
const router = express.Router();
const { gutendex, openLibrary, getCached, setCache, normalizeOpenLibraryBook, normalizeGutendexBook } = require('../utils/apiClient');

const OL_TRENDING_SECTIONS = [
  { key: 'trending', name: '🔥 Currently Trending', query: 'q=*&sort=rating' },
  { key: 'classic', name: '📖 Classic Literature', query: 'subject=classic_literature&sort=rating' },
  { key: 'scifi', name: '🚀 Science Fiction', query: 'subject=science_fiction&sort=rating' },
  { key: 'mystery', name: '🔍 Mystery & Detective', query: 'subject=mystery&sort=rating' },
  { key: 'romance', name: '💕 Romance', query: 'subject=romance&sort=rating' },
];

const GUTENDEX_TRENDING_SECTIONS = [
  { key: 'trending', name: '🔥 Most Downloaded', query: '?sort=popular' },
  { key: 'adventure', name: '⚔️ Adventure', query: '?topic=adventure&sort=popular' },
  { key: 'science', name: '🔬 Science & Nature', query: '?topic=science&sort=popular' },
  { key: 'romance', name: '💕 Romance', query: '?topic=romance&sort=popular' },
  { key: 'mystery', name: '🔍 Mystery & Detective', query: '?topic=mystery&sort=popular' },
];

// GET /api/trending
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const provider = req.query.provider || 'openlibrary';

    const cacheKey = `trending:${provider}:${limit}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    if (provider === 'gutendex') {
      const promises = GUTENDEX_TRENDING_SECTIONS.map(async (section) => {
        try {
          const response = await gutendex.get(`/books${section.query}`);
          const books = (response.data.results || [])
            .map(normalizeGutendexBook)
            .filter(b => b.cover)
            .slice(0, limit);
          return { key: section.key, name: section.name, books };
        } catch (err) {
          console.error(`Error fetching trending ${section.key}:`, err.message);
          return { key: section.key, name: section.name, books: [] };
        }
      });
      const sections = await Promise.all(promises);
      const result = { sections };
      setCache(cacheKey, result);
      return res.json(result);
    }

    // Default to Open Library
    const promises = OL_TRENDING_SECTIONS.map(async (section) => {
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
