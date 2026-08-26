import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMovieDetails,
  getMovieTrailer,
  getMovieCredits,
  getSimilarMovies
} from "../api/movies";

import Row from "../components/Row";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VideoModal from "../components/VideoModal";
import moviePlaceholder from "../assets/movie-placeholder.svg";
import avatarPlaceholder from "../assets/avatar-placeholder.svg";
import "../styles/MovieDetail.css";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Core details states
  const [movie, setMovie] = useState(null);
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [cast, setCast] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [writers, setWriters] = useState([]);
  const [similar, setSimilar] = useState([]);

  // UI state managers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);
  const [isInList, setIsInList] = useState(false);

  // Sync My List state from LocalStorage on mount/id change
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("myList") || "[]");
    setIsInList(list.includes(id));
  }, [id]);

  // Load detailed information on mount/id change
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError("");

        // Run data fetches in parallel for efficiency
        const [detailData, creditsData, similarData] = await Promise.all([
          getMovieDetails(id),
          getMovieCredits(id),
          getSimilarMovies(id, 8)
        ]);

        setMovie(detailData);
        setCast(creditsData.cast || []);
        setDirectors(creditsData.directors || []);
        setWriters(creditsData.writers || []);
        setSimilar(similarData || []);

        // Load trailer separately so it doesn't block critical page details
        try {
          const trailerEmbed = await getMovieTrailer(id);
          setTrailerUrl(trailerEmbed);
        } catch (trailerErr) {
          console.warn("Failed to retrieve movie trailer:", trailerErr);
        }
      } catch (err) {
        console.error("Failed to load details for movie ID:", id, err);
        setError(err.message || "Failed to load movie details.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  const handleToggleList = () => {
    let list = JSON.parse(localStorage.getItem("myList") || "[]");
    if (list.includes(id)) {
      list = list.filter(item => item !== id);
      setIsInList(false);
    } else {
      list.push(id);
      setIsInList(true);
    }
    localStorage.setItem("myList", JSON.stringify(list));
    // Dispatch event to keep other rows updated in real-time
    window.dispatchEvent(new Event("myListUpdated"));
  };

  const handleTrailerPlay = async (m) => {
    try {
      setShowTrailer(true);
      // If it's a similar movie card played, fetch its trailer URL on demand
      if (m && m.id !== id) {
        setTrailerUrl(null);
        const url = await getMovieTrailer(m.id);
        setTrailerUrl(url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Loading skeleton block
  if (loading) {
    return (
      <div className="detail-page-loading">
        <Navbar />
        <div className="detail-loading">
          <div className="banner-skeleton shimmer"></div>
          <div className="section">
            <div className="title-skeleton shimmer"></div>
            <div className="cast-list">
              {Array(6).fill().map((_, i) => (
                <div key={i} className="cast-card">
                  <div className="cast-img-skeleton shimmer"></div>
                  <div className="cast-text-skeleton shimmer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error boundary page fallback
  if (error || !movie) {
    return (
      <div className="detail-error-container">
        <Navbar />
        <div className="detail-error-box">
          <h2 className="error-title">Error Loading Title</h2>
          <p className="error-message">{error || "The movie details could not be found."}</p>
          <button className="btn-error-return" onClick={() => navigate("/browse")}>
            Return to Browse
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="movie-detail-page">
      <Navbar />

      {/* Detail Navigation Bar */}
      <div className="detail-navigation-bar" aria-label="Details Page Navigation">
        <button 
          className="btn-nav-back" 
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate("/browse");
            }
          }}
          aria-label="Go back to previous page"
        >
          ← Back
        </button>
        <button 
          className="btn-nav-home" 
          onClick={() => navigate("/browse")}
          aria-label="Go to browse home"
        >
          ⌂ Home
        </button>
      </div>

      {/* 1. CINEMATIC DETAIL HERO BACKGROUND */}
      <div 
        className="detail-hero"
        style={{
          backgroundImage: `url(${movie.backdropUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200"})`
        }}
      >
        <div className="hero-gradient-overlay" />
        
        <div className="detail-hero-container">
          {/* Double column: Left poster */}
          <div className="detail-poster-column">
            <img 
              src={movie.posterUrl || moviePlaceholder} 
              alt={movie.title}
              className="detail-poster-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = moviePlaceholder;
              }}
            />
          </div>

          {/* Double column: Right metadata details */}
          <div className="detail-content-column">
            <h1 className="detail-title">{movie.title}</h1>
            
            <div className="detail-meta">
              {movie.rating && movie.rating !== "N/A" && (
                <span className="detail-badge-rating">IMDb {movie.rating}</span>
              )}
              <span>{movie.year}</span>
              {movie.runtime && movie.runtime !== "N/A" && <span>{movie.runtime}</span>}
            </div>

            {movie.genres && movie.genres.length > 0 && (
              <p className="detail-genres">
                <strong>Genres: </strong>{movie.genres.join(", ")}
              </p>
            )}

            <p className="detail-description">{movie.description}</p>

            <div className="detail-action-buttons">
              <button 
                className="play-btn"
                onClick={() => handleTrailerPlay(movie)}
                disabled={!trailerUrl}
                style={{ opacity: trailerUrl ? 1 : 0.6 }}
              >
                ▶ Play Trailer
              </button>

              <button className="info-btn" onClick={handleToggleList}>
                {isInList ? "✓ In My List" : "+ Add to List"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SPECIFIC METADATA INFORMATION TABLE */}
      <section className="detail-info-section" aria-label="Movie Metadata">
        <div className="info-grid">
          {directors.length > 0 && (
            <div className="info-item">
              <span className="info-label">Director</span>
              <span className="info-value">{directors.join(", ")}</span>
            </div>
          )}
          
          {writers.length > 0 && (
            <div className="info-item">
              <span className="info-label">Writers</span>
              <span className="info-value">{writers.join(", ")}</span>
            </div>
          )}

          {movie.genres && movie.genres.length > 0 && (
            <div className="info-item">
              <span className="info-label">Genres</span>
              <span className="info-value">{movie.genres.join(", ")}</span>
            </div>
          )}

          {movie.runtime && movie.runtime !== "N/A" && (
            <div className="info-item">
              <span className="info-label">Runtime</span>
              <span className="info-value">{movie.runtime}</span>
            </div>
          )}

          {movie.rating && movie.rating !== "N/A" && (
            <div className="info-item">
              <span className="info-label">IMDb Rating</span>
              <span className="info-value">{movie.rating} / 10</span>
            </div>
          )}
        </div>
      </section>

      {/* 3. CAST SECTION */}
      {cast.length > 0 && (
        <section className="detail-cast-section" aria-label="Cast Members">
          <h2>Cast</h2>
          <div className="cast-list">
            {cast.map((actor) => (
              <div key={actor.id} className="cast-card">
                <div className="cast-img-wrapper">
                  <img
                    src={actor.profileUrl || avatarPlaceholder}
                    alt={actor.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = avatarPlaceholder;
                    }}
                  />
                </div>
                <p className="cast-name">{actor.name}</p>
                {actor.character && <p className="cast-character">{actor.character}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. SIMILAR RECOMMENDATIONS */}
      {similar.length > 0 && (
        <section className="detail-recommendations" aria-label="Similar Titles">
          <div style={{ padding: "0 50px" }}>
            <Row
              title="More Like This"
              movies={similar}
              onTrailerPlay={handleTrailerPlay}
            />
          </div>
        </section>
      )}

      {/* TRAILER MODAL OVERLAY */}
      <VideoModal
        isOpen={showTrailer}
        videoUrl={trailerUrl}
        onClose={() => setShowTrailer(false)}
      />

      <Footer />
    </div>
  );
};

export default MovieDetail;