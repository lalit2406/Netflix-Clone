import React, { useEffect, useState, useRef } from "react";
import MovieCard from "./MovieCard";
import ErrorDisplay from "./ErrorDisplay";
import { CardSkeleton } from "./LoadingSkeleton";

const Row = ({ title, fetchData, movies: initialMovies, onTrailerPlay }) => {
  const [movies, setMovies] = useState(initialMovies || []);
  const [loading, setLoading] = useState(!initialMovies);
  const [error, setError] = useState("");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const rowRef = useRef();

  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    if (initialMovies) {
      setMovies(initialMovies);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        if (fetchDataRef.current) {
          const data = await fetchDataRef.current();
          setMovies(data);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load rows data.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [initialMovies]);

  // Handle arrow displays based on scroll position limits
  const updateArrows = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = rowRef.current;
    if (el) {
      el.addEventListener("scroll", updateArrows);
      
      // Run updates after components lay out
      const t = setTimeout(updateArrows, 400);
      return () => {
        el.removeEventListener("scroll", updateArrows);
        clearTimeout(t);
      };
    }
  }, [movies, loading]);

  const handleScroll = (direction) => {
    if (rowRef.current) {
      const containerWidth = rowRef.current.clientWidth;
      const scrollAmount = direction === "left" ? -containerWidth * 0.75 : containerWidth * 0.75;
      rowRef.current.scrollBy({
         left: scrollAmount,
         behavior: "smooth"
      });
    }
  };

  const handleRetry = async () => {
    setError("");
    setLoading(true);
    try {
      if (fetchDataRef.current) {
        const data = await fetchDataRef.current();
        setMovies(data);
      }
    } catch (err) {
      setError(err.message || "Failed to load rows data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="row">
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: "20px", overflow: "hidden", padding: "15px 0" }}>
          {Array(6).fill().map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="row">
        <h2>{title}</h2>
        <ErrorDisplay message={error} onRetry={initialMovies ? null : handleRetry} />
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <div className="row">
      <h2>{title}</h2>
      <div className="row-wrapper">
        <button 
          className={`arrow left ${!showLeftArrow ? "disabled" : ""}`} 
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          disabled={!showLeftArrow}
        >
          ❮
        </button>

        <div className="row-posters" ref={rowRef}>
          {movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie} 
              onTrailerPlay={onTrailerPlay} 
            />
          ))}
        </div>

        <button 
          className={`arrow right ${!showRightArrow ? "disabled" : ""}`} 
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          disabled={!showRightArrow}
        >
          ❯
        </button>
      </div>
    </div>
  );
};

export default Row;