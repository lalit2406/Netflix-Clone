import axios from 'axios';

// Get credentials from environmental scope
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = import.meta.env.VITE_RAPIDAPI_HOST;

// Helper to guard against missing API configurations upon invocation
const checkConfig = () => {
  if (!API_KEY || !API_HOST) {
    throw new Error("Movie API is not configured. Please add VITE_RAPIDAPI_KEY to .env.");
  }
};

// Instantiate core Axios client for RapidAPI IMDb APIDojo integration
const api = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': API_HOST
  }
});

// Request interceptor to block calls during 429 rate limit cooldown
api.interceptors.request.use((config) => {
  try {
    const until = sessionStorage.getItem("netflix_api_rate_limit_until");
    if (until) {
      const untilMs = parseInt(until, 10);
      if (Date.now() < untilMs) {
        // Reject with a mock 429 error object to avoid hitting network
        const error = new Error("Rate limit active");
        error.response = { status: 429, statusText: "Too Many Requests" };
        return Promise.reject(error);
      } else {
        sessionStorage.removeItem("netflix_api_rate_limit_until");
      }
    }
  } catch (error) {
    console.warn("Interceptors check failed", error);
  }
  return config;
});

// Response interceptor to store cooldown on 429 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      try {
        // Set cooldown duration for 60 seconds (1 minute)
        sessionStorage.setItem("netflix_api_rate_limit_until", String(Date.now() + 60000));
      } catch (error) {
        console.warn("Interceptors write failed", error);
      }
    }
    return Promise.reject(error);
  }
);

// Cache structures for memory allocations
const detailsCache = new Map();
const pendingRequests = new Map();

// Sub-details memory and pending caches
const creditsCache = new Map();
const pendingCreditsRequests = new Map();
const trailerCache = new Map();
const pendingTrailerRequests = new Map();
const similarCache = new Map();
const pendingSimilarRequests = new Map();

// Memory list cache structures
export let popularListCache = null;
export let pendingPopularListRequest = null;
export let topRatedListCache = null;
export let pendingTopRatedListRequest = null;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

// Helper to access sessionStorage safely
const getSessionStorage = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.warn("sessionStorage read failed", error);
    return null;
  }
};

// Helper to write sessionStorage safely
const setSessionStorage = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (error) {
    console.warn("sessionStorage write failed", error);
  }
};

/**
 * Normalizes title IDs like "/title/tt1375666/" or "tt1375666" into "tt1375666"
 */
export function normalizeId(id) {
  if (!id) return '';
  const match = id.match(/(tt\d+)/);
  return match ? match[1] : id;
}

/**
 * Normalizes name/actor IDs like "/name/nm0000138/" into "nm0000138"
 */
export function normalizeActorId(id) {
  if (!id) return '';
  const match = id.match(/(nm\d+)/);
  return match ? match[1] : id;
}

/**
 * Normalizes video IDs like "/videoV2/vi2959588889" into "vi2959588889"
 */
export function normalizeVideoId(id) {
  if (!id) return '';
  const match = id.match(/(vi\d+)/);
  return match ? match[1] : id;
}

/**
 * Maps raw overview details into a unified clean client-side model object
 */
function mapMovie(raw) {
  if (!raw) return null;
  const titleObj = raw.title || {};
  const imageObj = titleObj.image || {};
  const ratingsObj = raw.ratings || {};
  const plotOutlineObj = raw.plotOutline || {};

  const poster = imageObj.url || null;

  return {
    id: normalizeId(raw.id),
    title: titleObj.title || "",
    posterUrl: poster,
    backdropUrl: poster, // Backdrop fallback matches posterUrl initially
    year: titleObj.year ? String(titleObj.year) : "",
    rating: ratingsObj.rating ? String(ratingsObj.rating) : "N/A",
    runtime: titleObj.runningTimeInMinutes ? `${titleObj.runningTimeInMinutes} min` : "N/A",
    genres: raw.genres || [],
    description: plotOutlineObj.text || raw.plotSummary?.text || "",
    cast: [],
    trailerKey: null
  };
}

/**
 * Helper to process Axios requests errors into formatted application errors
 */
function handleApiError(error) {
  if (error.response) {
    if (error.response.status === 429) {
      return new Error("Too many requests: You've hit the API limit. Please wait a minute before retrying.");
    }
    return new Error(`API/HTTP failure: ${error.response.status} ${error.response.statusText}`);
  } else if (error.request) {
    return new Error("Network failure: Unable to reach the movie database. Please check your internet connection.");
  }
  return error;
}

/**
 * Fetch and map movie search lists (debounced in UI)
 */
export const searchMovies = async (query) => {
  checkConfig();
  const trimmed = query ? query.trim() : "";
  if (!trimmed) return [];

  try {
    const res = await api.get('/title/find', {
      params: { q: trimmed }
    });
    if (!res.data || !res.data.results) return [];

    const seenIds = new Set();
    const mapped = [];

    for (const raw of res.data.results) {
      // Keep only movies or series
      if (raw.titleType !== "movie" && raw.titleType !== "tvSeries") continue;
      
      const normId = normalizeId(raw.id);
      if (seenIds.has(normId)) continue;
      seenIds.add(normId);

      mapped.push({
        id: normId,
        title: raw.title || "",
        posterUrl: raw.image?.url || null,
        backdropUrl: raw.image?.url || null,
        year: raw.year ? String(raw.year) : "",
        rating: "N/A",
        runtime: raw.runningTimeInMinutes ? `${raw.runningTimeInMinutes} min` : "N/A",
        genres: [],
        description: "",
        cast: [],
        trailerKey: null
      });
    }
    return mapped;
  } catch (error) {
    throw handleApiError(error);
  }
};

const detailsQueue = [];
let activeRequestsCount = 0;
const MAX_CONCURRENT_DETAILS = 2;

const processDetailsQueue = () => {
  if (detailsQueue.length === 0 || activeRequestsCount >= MAX_CONCURRENT_DETAILS) return;

  const { normalizedId, resolve, reject } = detailsQueue.shift();
  activeRequestsCount++;

  (async () => {
    try {
      console.log(`[Movies API] details ${normalizedId}: NETWORK (queued)`);
      const res = await api.get('/title/get-overview-details', {
        params: { tconst: normalizedId }
      });
      if (!res.data) throw new Error("Invalid/empty API response");
      
      const mapped = mapMovie(res.data);
      if (!mapped) throw new Error("Failed to map raw overview payload");

      detailsCache.set(normalizedId, mapped);
      setSessionStorage(`netflix_movie_details_${normalizedId}_v2`, mapped);
      resolve(mapped);
    } catch (error) {
      reject(handleApiError(error));
    } finally {
      activeRequestsCount--;
      // Process next queued detail query spaced by a small rate limit guard window
      setTimeout(processDetailsQueue, 150);
    }
  })();
};

/**
 * Retrieves details for a specific movie, utilizing caching & request deduplication
 */
export const getMovieDetails = async (id) => {
  checkConfig();
  const normalizedId = normalizeId(id);
  if (!normalizedId) throw new Error("Invalid movie ID provided");

  // 1. Check details cache
  if (detailsCache.has(normalizedId)) {
    console.log(`[Movies API] details ${normalizedId}: CACHE`);
    return detailsCache.get(normalizedId);
  }

  // 2. Check sessionStorage
  const sessionData = getSessionStorage(`netflix_movie_details_${normalizedId}_v2`);
  if (sessionData) {
    console.log(`[Movies API] details ${normalizedId}: CACHE (sessionStorage)`);
    detailsCache.set(normalizedId, sessionData);
    return sessionData;
  }

  // 3. Check pending requests to prevent duplicate calls
  if (pendingRequests.has(normalizedId)) {
    console.log(`[Movies API] details ${normalizedId}: DEDUP`);
    return pendingRequests.get(normalizedId);
  }

  // 4. Return a promise that resolves via the queued runner
  const promise = new Promise((resolve, reject) => {
    detailsQueue.push({ normalizedId, resolve, reject });
    processDetailsQueue();
  });

  pendingRequests.set(normalizedId, promise);
  
  promise.finally(() => {
    pendingRequests.delete(normalizedId);
  });

  return promise;
};

/**
 * Retrieves popular lists, querying metadata sequentially to prevent 429 errors
 */
export const getPopularMovies = async (limit = 16, thin = false) => {
  checkConfig();

  // If thin list requested, return thin ID array immediately
  if (thin) {
    // 1. Check memory cache for full list
    if (popularListCache && popularListCache.length >= limit) {
      return popularListCache.slice(0, limit).map(item => ({ id: item.id }));
    }

    // 2. Check sessionStorage for full list
    const sessionData = getSessionStorage("netflix_popular_movies_v2");
    if (sessionData && sessionData.length >= limit) {
      return sessionData.slice(0, limit).map(item => ({ id: item.id }));
    }

    // 3. Fetch IDs from network
    try {
      console.log("[Movies API] popular list IDs: NETWORK");
      const res = await api.get('/title/get-most-popular-movies');
      if (!res.data || !Array.isArray(res.data)) return [];
      const ids = res.data.slice(0, Math.max(limit, 16)).map(normalizeId);
      return ids.slice(0, limit).map(id => ({ id }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 1. Check memory cache
  if (popularListCache && popularListCache.length >= limit) {
    console.log("[Movies API] popular list: CACHE");
    return popularListCache.slice(0, limit);
  }

  // 2. Check sessionStorage
  const sessionData = getSessionStorage("netflix_popular_movies_v2");
  if (sessionData && sessionData.length >= limit) {
    console.log("[Movies API] popular list: CACHE (sessionStorage)");
    popularListCache = sessionData;
    return popularListCache.slice(0, limit);
  }

  // 3. Check pending request to dedup concurrent calls
  if (pendingPopularListRequest) {
    console.log("[Movies API] popular list: DEDUP");
    return pendingPopularListRequest.then(data => data.slice(0, limit));
  }

  // 4. Fire network request
  console.log("[Movies API] popular list: NETWORK");
  pendingPopularListRequest = (async () => {
    try {
      const res = await api.get('/title/get-most-popular-movies');
      if (!res.data || !Array.isArray(res.data)) return [];

      const ids = res.data.slice(0, Math.max(limit, 16)).map(normalizeId);
      const movies = [];

      // Fetch details sequentially to respect request throttle boundaries
      for (const id of ids) {
        try {
          const detail = await getMovieDetails(id);
          movies.push(detail);
        } catch (err) {
          console.error(`Error loading popular movie details for ID ${id}:`, err.message);
        }
      }

      popularListCache = movies;
      setSessionStorage("netflix_popular_movies_v2", movies);
      return movies;
    } catch (error) {
      throw handleApiError(error);
    } finally {
      pendingPopularListRequest = null;
    }
  })();

  return pendingPopularListRequest.then(data => data.slice(0, limit));
};

/**
 * Retrieves top-rated lists, querying details sequentially to prevent rate limits
 */
export const getTopRatedMovies = async (limit = 8, thin = false) => {
  checkConfig();

  // If thin list requested, return thin ID array immediately
  if (thin) {
    if (topRatedListCache && topRatedListCache.length >= limit) {
      return topRatedListCache.slice(0, limit).map(item => ({ id: item.id }));
    }

    const sessionData = getSessionStorage("netflix_top_rated_movies_v2");
    if (sessionData && sessionData.length >= limit) {
      return sessionData.slice(0, limit).map(item => ({ id: item.id }));
    }

    try {
      console.log("[Movies API] top rated list IDs: NETWORK");
      const res = await api.get('/title/get-top-rated-movies');
      if (!res.data || !Array.isArray(res.data)) return [];
      const ids = res.data.slice(0, Math.max(limit, 8)).map(item => normalizeId(item.id || item));
      return ids.slice(0, limit).map(id => ({ id }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // 1. Check memory cache
  if (topRatedListCache && topRatedListCache.length >= limit) {
    console.log("[Movies API] top rated: CACHE");
    return topRatedListCache.slice(0, limit);
  }

  // 2. Check sessionStorage
  const sessionData = getSessionStorage("netflix_top_rated_movies_v2");
  if (sessionData && sessionData.length >= limit) {
    console.log("[Movies API] top rated: CACHE (sessionStorage)");
    topRatedListCache = sessionData;
    return topRatedListCache.slice(0, limit);
  }

  // 3. Check pending request to dedup concurrent calls
  if (pendingTopRatedListRequest) {
    console.log("[Movies API] top rated: DEDUP");
    return pendingTopRatedListRequest.then(data => data.slice(0, limit));
  }

  // 4. Fire network request
  console.log("[Movies API] top rated: NETWORK");
  pendingTopRatedListRequest = (async () => {
    try {
      const res = await api.get('/title/get-top-rated-movies');
      if (!res.data || !Array.isArray(res.data)) return [];

      const ids = res.data.slice(0, Math.max(limit, 8)).map(item => normalizeId(item.id || item));
      const movies = [];

      for (const id of ids) {
        try {
          const detail = await getMovieDetails(id);
          movies.push(detail);
        } catch (err) {
          console.error(`Error loading top-rated movie details for ID ${id}:`, err.message);
        }
      }

      topRatedListCache = movies;
      setSessionStorage("netflix_top_rated_movies_v2", movies);
      return movies;
    } catch (error) {
      throw handleApiError(error);
    } finally {
      pendingTopRatedListRequest = null;
    }
  })();

  return pendingTopRatedListRequest.then(data => data.slice(0, limit));
};

/**
 * Retrieves full credit lists, mapping actors cleanly
 */
export const getMovieCredits = async (id) => {
  checkConfig();
  const normalizedId = normalizeId(id);
  if (!normalizedId) return { cast: [], directors: [], writers: [] };

  if (creditsCache.has(normalizedId)) {
    console.log(`[Movies API] credits ${normalizedId}: CACHE`);
    return creditsCache.get(normalizedId);
  }

  const sessionData = getSessionStorage(`netflix_movie_credits_${normalizedId}_v1`);
  if (sessionData) {
    console.log(`[Movies API] credits ${normalizedId}: CACHE (sessionStorage)`);
    creditsCache.set(normalizedId, sessionData);
    return sessionData;
  }

  if (pendingCreditsRequests.has(normalizedId)) {
    console.log(`[Movies API] credits ${normalizedId}: DEDUP`);
    return pendingCreditsRequests.get(normalizedId);
  }

  console.log(`[Movies API] credits ${normalizedId}: NETWORK`);
  const promise = (async () => {
    try {
      const res = await api.get('/title/get-full-credits', {
        params: { tconst: normalizedId }
      });
      if (!res.data) return { cast: [], directors: [], writers: [] };

      const castList = (res.data.cast || []).slice(0, 10).map(actor => ({
        id: normalizeActorId(actor.id),
        name: actor.name || "",
        character: actor.character || "Cast Member",
        profileUrl: actor.image?.url || null
      }));

      const crewObj = res.data.crew || {};
      const directorsList = (crewObj.director || []).map(d => d.name || "");
      const writersList = (crewObj.writer || []).map(w => w.name || "");

      const result = {
        cast: castList,
        directors: directorsList,
        writers: writersList
      };

      creditsCache.set(normalizedId, result);
      setSessionStorage(`netflix_movie_credits_${normalizedId}_v1`, result);
      return result;
    } catch (error) {
      throw handleApiError(error);
    } finally {
      pendingCreditsRequests.delete(normalizedId);
    }
  })();

  pendingCreditsRequests.set(normalizedId, promise);
  return promise;
};

/**
 * Searches and ranks video items to isolate the best matching trailer link
 */
export const getMovieTrailer = async (id) => {
  checkConfig();
  const normalizedId = normalizeId(id);
  if (!normalizedId) return null;

  if (trailerCache.has(normalizedId)) {
    console.log(`[Movies API] trailer ${normalizedId}: CACHE`);
    return trailerCache.get(normalizedId);
  }

  const sessionData = getSessionStorage(`netflix_movie_trailer_${normalizedId}_v1`);
  if (sessionData !== null) {
    console.log(`[Movies API] trailer ${normalizedId}: CACHE (sessionStorage)`);
    trailerCache.set(normalizedId, sessionData);
    return sessionData;
  }

  if (pendingTrailerRequests.has(normalizedId)) {
    console.log(`[Movies API] trailer ${normalizedId}: DEDUP`);
    return pendingTrailerRequests.get(normalizedId);
  }

  console.log(`[Movies API] trailer ${normalizedId}: NETWORK`);
  const promise = (async () => {
    try {
      const res = await api.get('/title/get-videos', {
        params: { tconst: normalizedId }
      });
      if (!res.data || !res.data.resource || !Array.isArray(res.data.resource.videos)) {
        trailerCache.set(normalizedId, null);
        setSessionStorage(`netflix_movie_trailer_${normalizedId}_v1`, null);
        return null;
      }

      const videos = res.data.resource.videos;
      const trailers = videos.filter(v => v.contentType === 'Trailer');

      let selected = null;
      if (trailers.length > 0) {
        selected = trailers.find(t => {
          const title = (t.title || "").toLowerCase();
          return title.includes('official') && title.includes('trailer');
        }) || trailers.find(t => {
          const title = (t.title || "").toLowerCase();
          return title.includes('trailer #') || /trailer \d/.test(title);
        }) || trailers.find(t => (t.title || "").toLowerCase().includes('trailer')) || trailers[0];
      }

      if (!selected) {
        selected = videos.find(v => {
          const title = (v.title || "").toLowerCase();
          return title.includes('teaser') || title.includes('preview') || title.includes('promo');
        });
      }

      let embedUrl = null;
      if (selected && selected.id) {
        const normVidId = normalizeVideoId(selected.id);
        embedUrl = `https://www.imdb.com/video/embed/${normVidId}`;
      }

      trailerCache.set(normalizedId, embedUrl);
      setSessionStorage(`netflix_movie_trailer_${normalizedId}_v1`, embedUrl);
      return embedUrl;
    } catch (error) {
      throw handleApiError(error);
    } finally {
      pendingTrailerRequests.delete(normalizedId);
    }
  })();

  pendingTrailerRequests.set(normalizedId, promise);
  return promise;
};

/**
 * Retrieves similar movie recommendations, querying details sequentially
 */
export const getSimilarMovies = async (id, limit = 8) => {
  checkConfig();
  const normalizedId = normalizeId(id);
  if (!normalizedId) return [];

  if (similarCache.has(normalizedId)) {
    console.log(`[Movies API] similar ${normalizedId}: CACHE`);
    return similarCache.get(normalizedId).slice(0, limit);
  }

  const sessionData = getSessionStorage(`netflix_movie_similar_${normalizedId}_v1`);
  if (sessionData) {
    console.log(`[Movies API] similar ${normalizedId}: CACHE (sessionStorage)`);
    similarCache.set(normalizedId, sessionData);
    return sessionData.slice(0, limit);
  }

  if (pendingSimilarRequests.has(normalizedId)) {
    console.log(`[Movies API] similar ${normalizedId}: DEDUP`);
    return pendingSimilarRequests.get(normalizedId).then(data => data.slice(0, limit));
  }

  console.log(`[Movies API] similar ${normalizedId}: NETWORK`);
  const promise = (async () => {
    try {
      const res = await api.get('/title/get-more-like-this', {
        params: { tconst: normalizedId }
      });
      if (!res.data || !Array.isArray(res.data)) return [];

      const ids = res.data.slice(0, limit).map(normalizeId);
      const movies = [];

      for (const similarId of ids) {
        try {
          const detail = await getMovieDetails(similarId);
          movies.push(detail);
        } catch (err) {
          console.error(`Error loading similar movie details for ID ${similarId}:`, err.message);
        }
      }

      similarCache.set(normalizedId, movies);
      setSessionStorage(`netflix_movie_similar_${normalizedId}_v1`, movies);
      return movies;
    } catch (error) {
      throw handleApiError(error);
    } finally {
      pendingSimilarRequests.delete(normalizedId);
    }
  })();

  pendingSimilarRequests.set(normalizedId, promise);
  return promise.then(data => data.slice(0, limit));
};
