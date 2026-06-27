const express = require('express');
const router = express.Router();
const { gutendex, openLibrary, googleBooks, googleParams, getCached, setCache, normalizeGutendexBook, normalizeOpenLibraryBook, normalizeGoogleBook } = require('../utils/apiClient');

// GET /api/books/openlibrary/:id
router.get('/openlibrary/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `book:ol:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const [workRes, editionsRes] = await Promise.all([
      openLibrary.get(`/works/${id}.json`),
      openLibrary.get(`/works/${id}/editions.json?limit=50`) // Fetch editions to find readable ones
    ]);

    if (!workRes.data) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }

    const work = workRes.data;
    
    // Parse description (Open Library formats it inconsistently)
    let description = '';
    if (typeof work.description === 'string') {
      description = work.description;
    } else if (work.description && work.description.value) {
      description = work.description.value;
    }

    // Find readable editions in Internet Archive
    const editions = editionsRes.data.entries || [];
    const readableEditions = editions
      .filter(e => e.ocaid || (e.ia && e.ia.length > 0))
      .map(e => ({
        id: e.key,
        title: e.title,
        publishDate: e.publish_date,
        publishers: e.publishers,
        ocaid: e.ocaid || (e.ia && e.ia[0]),
        isbn: e.isbn_13?.[0] || e.isbn_10?.[0],
        readUrl: `https://archive.org/details/${e.ocaid || (e.ia && e.ia[0])}`,
        borrowUrl: e.ocaid ? `https://openlibrary.org/borrow/ia/${e.ocaid}` : null
      }));

    const coverId = work.covers && work.covers.length > 0 ? work.covers[0] : null;

    const book = {
      id: id,
      source: 'openlibrary',
      title: work.title,
      authors: [], // Needs extra fetch or we rely on search results for author names
      description: description,
      cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
      coverMedium: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
      subjects: (work.subjects || []).slice(0, 15),
      firstPublishDate: work.first_publish_date || null,
      readUrl: `https://openlibrary.org/works/${id}`,
      readableEditions,
      hasFulltext: readableEditions.length > 0
    };

    setCache(cacheKey, book);
    res.json(book);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }
    next(err);
  }
});

// GET /api/books/gutendex/:id
router.get('/gutendex/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const cacheKey = `book:gutendex:${id}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const response = await gutendex.get(`/books/${id}`);
    
    if (!response.data) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }

    const book = normalizeGutendexBook(response.data);
    book.description = 'Read this free public domain book directly on BookVerse.';

    setCache(cacheKey, book);
    res.json(book);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }
    next(err);
  }
});

// GET /api/books/google/:volumeId
router.get('/google/:volumeId', async (req, res, next) => {
  try {
    const { volumeId } = req.params;

    const cacheKey = `book:google:${volumeId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const response = await googleBooks.get(`/volumes/${volumeId}`, {
      params: googleParams({})
    });

    if (!response.data) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }

    const book = normalizeGoogleBook(response.data);
    
    // Add extra details available in full volume info
    const info = response.data.volumeInfo || {};
    book.description = info.description || '';
    book.publisher = info.publisher || '';
    book.publishedDate = info.publishedDate || '';
    book.pageCount = info.pageCount || null;
    book.previewLink = info.previewLink || '';

    setCache(cacheKey, book);
    res.json(book);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: true, message: 'Book not found' });
    }
    next(err);
  }
});

module.exports = router;
