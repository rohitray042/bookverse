const express = require('express');
const router = express.Router();
const { openLibrary, getCached, setCache, normalizeOpenLibraryBook } = require('../utils/apiClient');

const CATEGORIES = {
  fiction: { name: 'Fiction', subject: 'fiction' },
  mystery: { name: 'Mystery & Thriller', subject: 'mystery_and_detective_stories' },
  romance: { name: 'Romance', subject: 'romance' },
  fantasy: { name: 'Fantasy', subject: 'fantasy' },
  scifi: { name: 'Science Fiction', subject: 'science_fiction' },
  horror: { name: 'Horror', subject: 'horror' },
  history: { name: 'History', subject: 'history' },
  science: { name: 'Science', subject: 'science' },
  philosophy: { name: 'Philosophy', subject: 'philosophy' },
  art: { name: 'Art & Photography', subject: 'art' },
  biography: { name: 'Biography', subject: 'biography' },
  business: { name: 'Business & Finance', subject: 'business' },
  children: { name: "Children's", subject: 'children' },
  cooking: { name: 'Cooking & Food', subject: 'cooking' },
  health: { name: 'Health & Wellness', subject: 'health' },
  poetry: { name: 'Poetry', subject: 'poetry' },
  psychology: { name: 'Psychology', subject: 'psychology' },
  religion: { name: 'Religion & Spirituality', subject: 'religion' },
  self_help: { name: 'Self-Help', subject: 'self_help' },
  travel: { name: 'Travel', subject: 'travel' }
};

// GET /api/categories
router.get('/', (req, res) => {
  const icons = {
    fiction: '📖', mystery: '🔍', romance: '💕', fantasy: '🐉',
    scifi: '🚀', horror: '👻', history: '🏛️', science: '🔬',
    philosophy: '🤔', art: '🎨', biography: '👤', business: '💼',
    children: '🧒', cooking: '🍳', health: '🧘', poetry: '✨',
    psychology: '🧠', religion: '🕊️', self_help: '🌱', travel: '✈️'
  };

  const list = Object.entries(CATEGORIES).map(([key, val]) => ({
    key,
    name: val.name,
    icon: icons[key] || '📘'
  }));

  res.json({ categories: list });
});

// GET /api/categories/:category
router.get('/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 24;

    const cat = CATEGORIES[category];
    if (!cat) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    const cacheKey = `cat:${category}:${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const offset = (page - 1) * limit;

    const response = await openLibrary.get(`/subjects/${cat.subject}.json`, {
      params: {
        limit,
        offset,
        details: true
      }
    });

    // Subject API response is slightly different from Search API
    const books = (response.data.works || []).map(work => {
      const coverId = work.cover_id;
      return {
        id: work.key?.replace('/works/', ''),
        source: 'openlibrary',
        title: work.title,
        authors: work.authors?.map(a => a.name) || [],
        cover: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null,
        coverMedium: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
        publishYear: work.first_publish_year || null,
        editionCount: work.edition_count || 0,
        hasFulltext: work.has_fulltext || false,
      };
    });

    const result = {
      category: cat.name,
      categoryKey: category,
      page,
      limit,
      totalResults: response.data.work_count || 0,
      results: books
    };

    setCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
