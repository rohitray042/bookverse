const axios = require('axios');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  // Cleanup old entries
  if (cache.size > 200) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].time - b[1].time);
    oldest.slice(0, 50).forEach(([k]) => cache.delete(k));
  }
}

// Open Library API client
const openLibrary = axios.create({
  baseURL: process.env.OPEN_LIBRARY_BASE_URL || 'https://openlibrary.org',
  timeout: 30000,
  headers: {
    'User-Agent': 'BookVerse/1.0 (Personal E-Book Library App)',
  },
});

// Add retry logic with exponential backoff
async function fetchWithRetry(client, url, config = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await client.get(url, config);
    } catch (err) {
      if (i === retries) throw err;
      const delay = 1000 * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${retries} for ${url} in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Google Books API client
const googleBooks = axios.create({
  baseURL: 'https://www.googleapis.com/books/v1',
  timeout: 15000,
});

// Check if Google Books API key is configured
const hasGoogleKey = !!(process.env.GOOGLE_BOOKS_API_KEY && process.env.GOOGLE_BOOKS_API_KEY.trim());

// Build Google Books params with optional API key
function googleParams(params = {}) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  if (key && key.trim()) params.key = key;
  return params;
}

// Normalize Open Library book to unified format
function normalizeOpenLibraryBook(doc) {
  const coverId = doc.cover_i || doc.cover_id;
  return {
    id: doc.key?.replace('/works/', '') || doc.edition_key?.[0] || '',
    source: 'openlibrary',
    title: doc.title || 'Untitled',
    authors: doc.author_name || (doc.authors?.map(a => a.name)) || [],
    cover: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null,
    coverMedium: coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`
      : null,
    publishYear: doc.first_publish_year || doc.publish_year?.[0] || null,
    rating: doc.ratings_average ? parseFloat(doc.ratings_average.toFixed(1)) : null,
    ratingsCount: doc.ratings_count || 0,
    subjects: (doc.subject || []).slice(0, 8),
    isbn: doc.isbn?.[0] || null,
    language: doc.language || [],
    editionCount: doc.edition_count || 0,
    hasFulltext: doc.has_fulltext || false,
    iaCollection: doc.ia || [],
    readUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
    previewAvailable: doc.has_fulltext || false,
  };
}

// Normalize Google Books volume to unified format
function normalizeGoogleBook(vol) {
  const info = vol.volumeInfo || {};
  const imageLinks = info.imageLinks || {};
  return {
    id: vol.id,
    source: 'google',
    title: info.title || 'Untitled',
    authors: info.authors || [],
    cover: imageLinks.thumbnail?.replace('http:', 'https:') || null,
    coverMedium: imageLinks.smallThumbnail?.replace('http:', 'https:') || null,
    publishYear: info.publishedDate ? parseInt(info.publishedDate) : null,
    rating: info.averageRating || null,
    ratingsCount: info.ratingsCount || 0,
    subjects: info.categories || [],
    isbn: info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier
      || info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier
      || null,
    language: [info.language || 'en'],
    editionCount: 1,
    pageCount: info.pageCount || null,
    description: info.description || '',
    hasFulltext: vol.accessInfo?.viewability === 'ALL_PAGES',
    readUrl: info.previewLink || info.infoLink || null,
    previewAvailable: ['PARTIAL', 'ALL_PAGES'].includes(vol.accessInfo?.viewability),
    embeddable: vol.accessInfo?.embeddable || false,
    googleBooksId: vol.id,
  };
}

module.exports = {
  openLibrary,
  googleBooks,
  googleParams,
  hasGoogleKey,
  fetchWithRetry,
  getCached,
  setCache,
  normalizeOpenLibraryBook,
  normalizeGoogleBook,
};
