import React from "react";
import MovieCard from "./MovieCard";
import { CardSkeleton } from "./LoadingSkeleton";

const SearchResultsGrid = ({ movies, loading, error, onTrailerPlay }) => {
  if (loading) {
    return (
      <div className="search-loading-container">
        <h2>Searching...</h2>
        <div className="search-results-grid">
          {Array(8).fill().map((_, idx) => (
            <CardSkeleton key={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-error-container">
        <p style={{ color: "#E50914", fontWeight: "bold", fontSize: "16px" }}>🎬 {error}</p>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="search-empty-container">
        <h3>No matches found</h3>
        <p>Try searching for a different title or keyword.</p>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <h2>Search Results</h2>
      <div className="search-results-grid">
        {movies.map((movie) => (
          <MovieCard 
            key={movie.id} 
            movie={movie} 
            onTrailerPlay={onTrailerPlay} 
          />
        ))}
      </div>
    </div>
  );
};

export default SearchResultsGrid;
