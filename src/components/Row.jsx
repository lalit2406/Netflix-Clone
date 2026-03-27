import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Row = ({ title, fetchData }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ NEW
  const rowRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      try {
        const res = await fetchData();
        setMovies(res.data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false); // ✅ stop loading
      }
    };

    getData();
  }, [fetchData]);

  const scroll = (dir) => {
    rowRef.current.scrollBy({
      left: dir === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  return (
    <div className="row">
      <h2>{title}</h2>

      <div className="row-wrapper">
        <button className="arrow left" onClick={() => scroll("left")}>
          ❮
        </button>

        <div className="row-posters" ref={rowRef}>
          {loading
            ? Array(8)
                .fill()
                .map((_, i) => (
                  <div key={i} className="card skeleton"></div>
                ))
            : movies.map((movie) => (
                <div
                  key={movie.id}
                  className="card"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                    className="card-img"
                  />

                  <div className="card-overlay">
                    <h3>{movie.title}</h3>
                    <p>{movie.release_date}</p>
                  </div>
                </div>
              ))}
        </div>

        <button className="arrow right" onClick={() => scroll("right")}>
          ❯
        </button>
      </div>
    </div>
  );
};

export default Row;