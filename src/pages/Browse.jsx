import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getPopularMovies, 
  getTopRatedMovies, 
  getMovieTrailer, 
  getMovieDetails,
  searchMovies
} from "../api/movies";

import Navbar from "../components/Navbar";
import Row from "../components/Row";
import Footer from "../components/Footer";
import VideoModal from "../components/VideoModal";
import SearchResultsGrid from "../components/SearchResultsGrid";
import { HeroSkeleton } from "../components/LoadingSkeleton";
import ErrorDisplay from "../components/ErrorDisplay";

import heroBgDefault from "../assets/hero.png";
import "../styles/Browse.css";

const Browse = () => {
  const navigate = useNavigate();

  // Navigation states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchTimeoutRef = useRef(null);

  // Search Results states
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Hero & Row states (unified data loading strategy)
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroDetails, setHeroDetails] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [popularMoviesList, setPopularMoviesList] = useState([]);
  
  // UI state managers (independent rows error boundaries)
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularError, setPopularError] = useState("");
  const [topRatedLoading, setTopRatedLoading] = useState(true);
  const [topRatedError, setTopRatedError] = useState("");
  const [retryCooldown, setRetryCooldown] = useState(false);

  // Trailer Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null);

  // My List states
  const [myListMovies, setMyListMovies] = useState([]);

  // Data Fetcher (fetches popular & top rated thin ID lists instantly)
  const loadPageData = async () => {
    // A. Fetch Popular list
    const fetchPopular = async () => {
      try {
        setPopularLoading(true);
        setPopularError("");
        const popularList = await getPopularMovies(12, true); // PASS thin=true
        
        // Distribute popular thin movies
        setHeroMovies(popularList.slice(0, 3));
        setTrendingMovies(popularList.slice(0, 6));
        setPopularMoviesList(popularList.slice(6, 12));
      } catch (err) {
        console.error("Popular movies load failed:", err);
        setPopularError(err.message || "Movie service is temporarily rate-limited. Please try again in a moment.");
      } finally {
        setPopularLoading(false);
      }
    };

    // B. Fetch Top Rated list
    const fetchTopRated = async () => {
      try {
        setTopRatedLoading(true);
        setTopRatedError("");
        const topRatedList = await getTopRatedMovies(6, true); // PASS thin=true
        setTopRatedMovies(topRatedList);
      } catch (err) {
        console.error("Top Rated movies load failed:", err);
        setTopRatedError(err.message || "Movie service is temporarily rate-limited. Please try again in a moment.");
      } finally {
        setTopRatedLoading(false);
      }
    };

    // Run sequentially to prevent concurrent burst loads
    await fetchPopular();
    await fetchTopRated();
  };

  useEffect(() => {
    loadPageData();
  }, []);

  // Load Hero slide details progressively in the background
  useEffect(() => {
    if (heroMovies.length === 0) return;

    let active = true;
    const loadHeroDetails = async () => {
      const detailsList = [];
      for (const m of heroMovies) {
        try {
          const detail = await getMovieDetails(m.id);
          detailsList.push(detail);
          if (active) {
            setHeroDetails([...detailsList]);
          }
        } catch (err) {
          console.error("Hero movie details load failed:", err);
        }
      }
    };

    loadHeroDetails();
    return () => { active = false; };
  }, [heroMovies]);

  // Cooldown retry logic to prevent API spams
  const handleRetry = () => {
    if (retryCooldown) {
      alert("Please wait a few seconds before retrying.");
      return;
    }
    setRetryCooldown(true);
    setTimeout(() => setRetryCooldown(false), 5000); // 5-second cooldown
    loadPageData();
  };

  // 3. Auto-rotation logic for Hero Slider
  useEffect(() => {
    if (heroDetails.length === 0 || popularLoading || isModalOpen || isHeroHovered) return;

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return; // Skip auto-slide

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroDetails.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [heroDetails, popularLoading, isModalOpen, isHeroHovered]);

  // 4. Debounced Search Handler
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 450); // 450ms debounce time

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // 5. Fetch Search results
  useEffect(() => {
    if (!debouncedQuery) return;

    const performSearch = async () => {
      try {
        setSearchLoading(true);
        setSearchError("");
        const results = await searchMovies(debouncedQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
        setSearchError(err.message || "Search failed.");
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // 6. Fetch "My List" details from LocalStorage
  const loadMyList = async () => {
    try {
      const listIds = JSON.parse(localStorage.getItem("myList") || "[]");
      if (listIds.length === 0) {
        setMyListMovies([]);
        return;
      }

      const moviesData = [];
      for (const id of listIds) {
        try {
          const detail = await getMovieDetails(id);
          moviesData.push(detail);
        } catch (e) {
          console.error(`Failed to load My List movie details for ${id}:`, e);
        }
      }
      setMyListMovies(moviesData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMyList();
    
    // Bind reload event
    window.addEventListener("myListUpdated", loadMyList);
    return () => window.removeEventListener("myListUpdated", loadMyList);
  }, []);

  // 7. Sign Out handler
  // 8. Open Video Trailer Modal
  const handleTrailerPlay = async (movie) => {
    try {
      setTrailerUrl(null);
      setIsModalOpen(true);

      const embedUrl = await getMovieTrailer(movie.id);
      setTrailerUrl(embedUrl);
    } catch (err) {
      console.error("Trailer loading failed:", err);
    }
  };

  return (
    <div className="browse-page">
      {/* NAVBAR */}
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* RENDER SEARCH RESULTS GRID IF QUERY EXISTS */}
      {searchQuery ? (
        <SearchResultsGrid
          movies={searchResults}
          loading={searchLoading}
          error={searchError}
          onTrailerPlay={handleTrailerPlay}
        />
      ) : (
        <>
          {/* RENDER FALLBACK ERROR PANEL OR METADATA SLIDER */}
          {popularError ? (
            <header 
              className="landing-hero animate-fade-in"
              style={{ backgroundImage: `url(${heroBgDefault})` }}
            >
              <div className="hero-content">
                <h1>Browse Movies and TV Shows</h1>
                <div style={{ maxWidth: "450px", margin: "20px auto 0 auto" }}>
                  <ErrorDisplay message={popularError} onRetry={handleRetry} />
                </div>
              </div>
            </header>
          ) : popularLoading || heroDetails.length === 0 ? (
            <HeroSkeleton />
          ) : (
            <header 
              className="hero-slider-container"
              onMouseEnter={() => setIsHeroHovered(true)}
              onMouseLeave={() => setIsHeroHovered(false)}
            >
              {heroDetails.map((movie, idx) => (
                <div
                  key={movie.id}
                  className={`hero-slide ${idx === heroIndex ? "active" : ""}`}
                  style={{ backgroundImage: `url(${movie.backdropUrl || heroBgDefault})` }}
                >
                  <div className="browse-hero-content">
                    <h1>{movie.title}</h1>
                    <div className="hero-meta">
                      {movie.rating && movie.rating !== "N/A" && (
                        <span className="hero-rating-badge">IMDb {movie.rating}</span>
                      )}
                      <span>{movie.year}</span>
                      {movie.runtime && movie.runtime !== "N/A" && <span>{movie.runtime}</span>}
                    </div>
                    {movie.description && <p className="hero-desc">{movie.description}</p>}
                    
                    <div className="hero-slider-btns">
                      <button 
                        className="btn-play-trailer" 
                        onClick={() => handleTrailerPlay(movie)}
                      >
                        ▶ Play Trailer
                      </button>
                      <button 
                        className="btn-more-info"
                        onClick={() => navigate(`/movie/${movie.id}`)}
                      >
                        More Info
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Slider Manual Controls */}
              {heroDetails.length > 1 && (
                <>
                  <button 
                    className="slider-arrow prev" 
                    onClick={() => setHeroIndex((prev) => (prev === 0 ? heroDetails.length - 1 : prev - 1))}
                    aria-label="Previous featured item"
                  >
                    ❮
                  </button>
                  <button 
                    className="slider-arrow next" 
                    onClick={() => setHeroIndex((prev) => (prev + 1) % heroDetails.length)}
                    aria-label="Next featured item"
                  >
                    ❯
                  </button>
                </>
              )}

              {/* Indicators */}
              {heroDetails.length > 1 && (
                <div className="slide-indicators">
                  {heroDetails.map((_, idx) => (
                    <span
                      key={idx}
                      className={`indicator ${idx === heroIndex ? "active" : ""}`}
                      onClick={() => setHeroIndex(idx)}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </header>
          )}

          {/* MOVIE ROWS */}
          <main className="browse-rows-container">
            {/* MY LIST ROW */}
            {myListMovies.length > 0 && (
              <div id="mylist-section">
                <Row
                  title="My List"
                  movies={myListMovies}
                  onTrailerPlay={handleTrailerPlay}
                />
              </div>
            )}

            {/* TRENDING ROW (POPULAR 0-8) */}
            {popularError ? (
              <div className="row">
                <h2>🔥 Trending Now</h2>
                <ErrorDisplay message={popularError} onRetry={handleRetry} />
              </div>
            ) : (
              <Row
                title="🔥 Trending Now"
                movies={popularLoading ? null : trendingMovies}
                onTrailerPlay={handleTrailerPlay}
              />
            )}

            {/* TOP RATED ROW (TOP RATED 0-8) */}
            {topRatedError ? (
              <div className="row">
                <h2>⭐ Top Rated</h2>
                <ErrorDisplay message={topRatedError} onRetry={handleRetry} />
              </div>
            ) : (
              <Row
                title="⭐ Top Rated"
                movies={topRatedLoading ? null : topRatedMovies}
                onTrailerPlay={handleTrailerPlay}
              />
            )}

            {/* POPULAR ROW (POPULAR 8-16) */}
            {popularError ? (
              <div className="row">
                <h2>🎬 Popular Movies</h2>
                <ErrorDisplay message={popularError} onRetry={handleRetry} />
              </div>
            ) : (
              <Row
                title="🎬 Popular Movies"
                movies={popularLoading ? null : popularMoviesList}
                onTrailerPlay={handleTrailerPlay}
              />
            )}
          </main>
        </>
      )}

      {/* VIDEO LIGHTBOX OVERLAY */}
      <VideoModal
        isOpen={isModalOpen}
        videoUrl={trailerUrl}
        onClose={() => {
          setIsModalOpen(false);
          setTrailerUrl(null);
        }}
      />

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Browse;
