const express = require('express');
const router = express.Router();
const { gutendex, openLibrary, getCached, setCache, normalizeOpenLibraryBook, normalizeGutendexBook } = require('../utils/apiClient');

const CATEGORIES = {
  fiction: { name: 'Fiction', subject: 'fiction', gutenberg: 'fiction' },
  mystery: { name: 'Mystery & Thriller', subject: 'mystery_and_detective_stories', gutenberg: 'mystery' },
  romance: { name: 'Romance', subject: 'romance', gutenberg: 'romance' },
  fantasy: { name: 'Fantasy', subject: 'fantasy', gutenberg: 'fantasy' },
  scifi: { name: 'Science Fiction', subject: 'science_fiction', gutenberg: 'science fiction' },
  horror: { name: 'Horror', subject: 'horror', gutenberg: 'horror' },
  history: { name: 'History', subject: 'history', gutenberg: 'history' },
  science: { name: 'Science', subject: 'science', gutenberg: 'science' },
  philosophy: { name: 'Philosophy', subject: 'philosophy', gutenberg: 'philosophy' },
  art: { name: 'Art & Photography', subject: 'art', gutenberg: 'art' },
  biography: { name: 'Biography', subject: 'biography', gutenberg: 'biography' },
  business: { name: 'Business & Finance', subject: 'business', gutenberg: 'business' },
  children: { name: "Children's", subject: 'children', gutenberg: 'children' },
  cooking: { name: 'Cooking & Food', subject: 'cooking', gutenberg: 'cookery' },
  health: { name: 'Health & Wellness', subject: 'health', gutenberg: 'health' },
  poetry: { name: 'Poetry', subject: 'poetry', gutenberg: 'poetry' },
  psychology: { name: 'Psychology', subject: 'psychology', gutenberg: 'psychology' },
  religion: { name: 'Religion & Spirituality', subject: 'religion', gutenberg: 'religion' },
  self_help: { name: 'Self-Help', subject: 'self_help', gutenberg: 'self_help' },
  travel: { name: 'Travel', subject: 'travel', gutenberg: 'travel' }
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
    const provider = req.query.provider || 'openlibrary';

    const cat = CATEGORIES[category];
    if (!cat) {
      return res.status(404).json({ error: true, message: 'Category not found' });
    }

    const cacheKey = `cat:${provider}:${category}:${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let result = {};

    if (provider === 'gutendex') {
      const response = await gutendex.get(`/books`, {
        params: { topic: cat.gutenberg, page }
      });
      const books = (response.data.results || []).map(normalizeGutendexBook);
      result = {
        category: cat.name,
        categoryKey: category,
        page,
        limit,
        totalResults: response.data.count || 0,
        results: books
      };
    } else {
      const offset = (page - 1) * limit;
      const response = await openLibrary.get(`/subjects/${cat.subject}.json`, {
        params: {
          limit,
          offset,
          details: true
        }
      });

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

      result = {
        category: cat.name,
        categoryKey: category,
        page,
        limit,
        totalResults: response.data.work_count || 0,
        results: books
      };
    }

    setCache(cacheKey, result);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
