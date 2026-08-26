import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMovieDetails } from "../api/movies";
import { CardSkeleton } from "./LoadingSkeleton";

const MovieCard = ({ movie, onTrailerPlay }) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(movie.title ? movie : null);
  const [loading, setLoading] = useState(!movie.title);
  const [error, setError] = useState("");

  const [isInList, setIsInList] = useState(() =>
    JSON.parse(localStorage.getItem("myList") || "[]").includes(movie.id)
  );

  useEffect(() => {
    const handleUpdate = () => {
      const list = JSON.parse(localStorage.getItem("myList") || "[]");
      setIsInList(list.includes(movie.id));
    };
    window.addEventListener("myListUpdated", handleUpdate);
    return () => window.removeEventListener("myListUpdated", handleUpdate);
  }, [movie.id]);

  useEffect(() => {
    // If movie details are already provided (resolved or cached), use them immediately
    if (movie.title) {
      setDetails(movie);
      setLoading(false);
      return;
    }

    let active = true;
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMovieDetails(movie.id);
        if (active) {
          setDetails(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCardDetails();
    return () => { active = false; };
  }, [movie]);

  const handleToggleList = (e) => {
    e.stopPropagation();
    let list = JSON.parse(localStorage.getItem("myList") || "[]");
    if (list.includes(movie.id)) {
      list = list.filter(id => id !== movie.id);
      setIsInList(false);
    } else {
      list.push(movie.id);
      setIsInList(true);
    }
    localStorage.setItem("myList", JSON.stringify(list));
    // Trigger custom event to notify other My List rows to update
    window.dispatchEvent(new Event("myListUpdated"));
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (onTrailerPlay && details) {
      onTrailerPlay(details);
    }
  };

  const handleCardClick = () => {
    navigate(`/movie/${movie.id}`);
  };

  if (loading) {
    return <CardSkeleton />;
  }

  // If loading fails, render an unobtrusive fallback card with a retry option or title text
  if (error || !details) {
    return (
      <div 
        className="card error-card"
        onClick={handleCardClick}
        role="button"
        tabIndex="0"
        aria-label="Failed to load movie info"
      >
        <div className="card-error-content">
          <p>⚠️ Error</p>
          <span className="card-error-retry">Click for details</span>
        </div>
      </div>
    );
  }

  // Use the preloaded details from now on
  const activeMovie = details;

  return (
    <div 
      className="card"
      onClick={handleCardClick}
      role="button"
      tabIndex="0"
      aria-label={`${activeMovie.title} (${activeMovie.year})`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleCardClick();
      }}
    >
      <img
        src={activeMovie.posterUrl || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop"}
        alt={activeMovie.title}
        className="card-img"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop";
        }}
      />
      <div className="card-overlay">
        <h3>{activeMovie.title}</h3>
        <p className="card-meta">
          <span>{activeMovie.year}</span>
          {activeMovie.rating && activeMovie.rating !== "N/A" && (
            <span className="card-rating">⭐ {activeMovie.rating}</span>
          )}
        </p>
        <div className="card-buttons">
          <button 
            className="card-btn play" 
            onClick={handlePlayClick}
            aria-label="Play trailer"
          >
            ▶
          </button>
          <button 
            className="card-btn list" 
            onClick={handleToggleList}
            aria-label={isInList ? "Remove from List" : "Add to List"}
          >
            {isInList ? "✓" : "+"}
          </button>
          <button 
            className="card-btn info" 
            onClick={handleCardClick}
            aria-label="More Info"
          >
            ℹ
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
