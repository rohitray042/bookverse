const express = require('express');
const router = express.Router();
const {
  gutendex,
  openLibrary,
  googleBooks,
  googleParams,
  hasGoogleKey,
  fetchWithRetry,
  getCached,
  setCache,
  normalizeGutendexBook,
  normalizeOpenLibraryBook,
  normalizeGoogleBook,
} = require('../utils/apiClient');

// GET /api/search?q=query&page=1&limit=20&provider=openlibrary
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20, provider = 'openlibrary' } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: true, message: 'Search query is required' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const cacheKey = `search:${provider}:${q}:${pageNum}:${limitNum}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    if (provider === 'gutendex') {
      // Gutendex Search
      const response = await fetchWithRetry(gutendex, '/books', {
        params: { search: q.trim(), page: pageNum }
      });
      const books = (response.data.results || []).map(normalizeGutendexBook);
      const result = {
        query: q,
        page: pageNum,
        limit: limitNum,
        totalResults: response.data.count || 0,
        results: books,
      };
      setCache(cacheKey, result);
      return res.json(result);
    }

    // Default: Open Library Search (with Google Books enrichment)
    const promises = [
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

    const olBooks = (olResponse.data.docs || []).map(normalizeOpenLibraryBook);
    const gbBooks = (gbResponse.data.items || []).map(normalizeGoogleBook);

    const seen = new Set();
    const merged = [];

    for (const book of olBooks) {
      const key = (book.isbn || book.title).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
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

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/search/suggest?q=query
router.get('/suggest', async (req, res, next) => {
  try {
    const { q, provider = 'openlibrary' } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = `suggest:${provider}:${q}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let suggestions = [];

    if (provider === 'gutendex') {
      const response = await gutendex.get('/books', {
        params: { search: q.trim() }
      }).catch(() => ({ data: { results: [] } }));
      
      suggestions = (response.data.results || []).slice(0, 6).map(doc => ({
        id: doc.id.toString(),
        title: doc.title,
        author: doc.authors?.[0]?.name || '',
        cover: doc.formats['image/jpeg'] || null,
      }));
    } else {
      const response = await openLibrary.get('/search.json', {
        params: {
          q: q.trim(),
          limit: 6,
          fields: 'key,title,author_name,cover_i',
        },
      }).catch(() => ({ data: { docs: [] } }));

      suggestions = (response.data.docs || []).map(doc => ({
        id: doc.key?.replace('/works/', '') || '',
        title: doc.title,
        author: doc.author_name?.[0] || '',
        cover: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
          : null,
      }));
    }

    const result = { suggestions };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
