const express = require('express');
const router = express.Router();
const {
  openLibrary,
  googleBooks,
  googleParams,
  hasGoogleKey,
  fetchWithRetry,
  getCached,
  setCache,
  normalizeOpenLibraryBook,
  normalizeGoogleBook,
} = require('../utils/apiClient');

// GET /api/search?q=query&page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: true, message: 'Search query is required' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Check cache
    const cacheKey = `search:${q}:${pageNum}:${limitNum}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Search both APIs in parallel
    const promises = [
      // Open Library search
      fetchWithRetry(openLibrary, '/search.json', {
        params: {
          q: q.trim(),
          page: pageNum,
          limit: limitNum,
          fields: 'key,title,author_name,cover_i,first_publish_year,ratings_average,ratings_count,subject,isbn,edition_count,has_fulltext,ia,language',
        },
      }).catch(err => {
        console.error('Open Library search error:', err.message);
        return { data: { docs: [], numFound: 0 } };
      }),
    ];

    // Only search Google Books if API key is configured
    if (hasGoogleKey) {
      promises.push(
        googleBooks.get('/volumes', {
          params: googleParams({
            q: q.trim(),
            startIndex: (pageNum - 1) * limitNum,
            maxResults: Math.min(limitNum, 40),
            printType: 'books',
            orderBy: 'relevance',
          }),
        }).catch(err => {
          console.error('Google Books search error:', err.message);
          return { data: { items: [], totalItems: 0 } };
        })
      );
    } else {
      promises.push(Promise.resolve({ data: { items: [], totalItems: 0 } }));
    }

    const [olResponse, gbResponse] = await Promise.all(promises);

    // Normalize results
    const olBooks = (olResponse.data.docs || []).map(normalizeOpenLibraryBook);
    const gbBooks = (gbResponse.data.items || []).map(normalizeGoogleBook);

    // Merge & deduplicate (prefer Open Library data, enrich with Google)
    const seen = new Set();
    const merged = [];

    for (const book of olBooks) {
      const key = (book.isbn || book.title).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        // Try to find matching Google book to enrich
        const gbMatch = gbBooks.find(
          gb => gb.isbn === book.isbn || gb.title.toLowerCase() === book.title.toLowerCase()
        );
        if (gbMatch) {
          book.googleBooksId = gbMatch.id;
          book.embeddable = gbMatch.embeddable;
          book.description = gbMatch.description || book.description;
          if (!book.cover && gbMatch.cover) book.cover = gbMatch.cover;
          if (gbMatch.previewAvailable) book.previewAvailable = true;
        }
        merged.push(book);
      }
    }

    // Add remaining Google books not in Open Library results
    for (const book of gbBooks) {
      const key = (book.isbn || book.title).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(book);
      }
    }

    const result = {
      query: q,
      page: pageNum,
      limit: limitNum,
      totalResults: (olResponse.data.numFound || 0) + (gbResponse.data.totalItems || 0),
      results: merged,
    };

    // Cache the results
    setCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/search/suggest?q=query — autocomplete suggestions
router.get('/suggest', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = `suggest:${q}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const response = await openLibrary.get('/search.json', {
      params: {
        q: q.trim(),
        limit: 6,
        fields: 'key,title,author_name,cover_i',
      },
    }).catch(() => ({ data: { docs: [] } }));

    const suggestions = (response.data.docs || []).map(doc => ({
      id: doc.key?.replace('/works/', '') || '',
      title: doc.title,
      author: doc.author_name?.[0] || '',
      cover: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
        : null,
    }));

    const result = { suggestions };
    setCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
