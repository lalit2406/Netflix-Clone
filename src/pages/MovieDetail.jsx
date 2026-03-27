import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchMovieDetails,
  fetchMovieVideos,
  fetchMovieCredits,
  fetchSimilarMovies,
  fetchRecommendations,
} from "../api/tmdb";

import Row from "../components/Row"; // ✅ reuse Row
import "../styles/MovieDetail.css";

const MovieDetail = () => {
  const { id } = useParams();

  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [cast, setCast] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);

  useEffect(() => {
    const getData = async () => {
      try {
        const [detailRes, videoRes, creditRes] = await Promise.all([
          fetchMovieDetails(id),
          fetchMovieVideos(id),
          fetchMovieCredits(id),
        ]);

        // 🎬 Movie
        setMovie(detailRes.data);

        // 🎥 Trailer
        const trailerVideo = videoRes.data.results.find(
          (vid) => vid.type === "Trailer" && vid.site === "YouTube"
        );
        setTrailer(trailerVideo);

        // 🎭 Cast
        setCast(creditRes.data.cast.slice(0, 10));
      } catch (err) {
        console.error(err);
      }
    };

    getData();
  }, [id]);

  if (!movie) {
  return (
    <div className="detail-loading">
      <div className="banner-skeleton shimmer"></div>

      <div className="section">
        <div className="title-skeleton shimmer"></div>

        <div className="cast-list">
          {Array(6)
            .fill()
            .map((_, i) => (
              <div key={i} className="cast-card">
                <div className="cast-img-skeleton shimmer"></div>
                <div className="cast-text-skeleton shimmer"></div>
              </div>
            ))}
        </div>
      </div>

      <div className="row">
        <div className="title-skeleton shimmer"></div>
        <div className="row-posters">
          {Array(6)
            .fill()
            .map((_, i) => (
              <div key={i} className="card skeleton"></div>
            ))}
        </div>
      </div>
    </div>
  );
}

  return (
    <div>
      {/* 🔥 HERO BANNER */}
      <div
        className="detail-banner"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
        }}
      >
        <div className="banner-content">
          <h1>{movie.title}</h1>

          <p>⭐ {movie.vote_average}</p>
          <p>📅 {movie.release_date}</p>

          <p className="plot">{movie.overview}</p>

          <div className="btn-group">
            <button
              className="play-btn"
              onClick={() => setShowTrailer(true)}
            >
              ▶ Play
            </button>

            <button className="info-btn">+ My List</button>
          </div>
        </div>
      </div>

      {/* 🎬 VIDEO OVERLAY */}
      {showTrailer && trailer && (
        <div className="video-overlay">
          <button
            className="close-btn"
            onClick={() => setShowTrailer(false)}
          >
            ✕
          </button>

          <iframe
            src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
            title="Trailer"
            allow="autoplay"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {/* 🎭 CAST */}
      <div className="section">
        <h2>Cast</h2>

        <div className="cast-list">
          {cast.map((actor) => (
            <div key={actor.id} className="cast-card">
              <img
                src={
                  actor.profile_path
                    ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                    : "https://via.placeholder.com/100"
                }
                alt={actor.name}
              />
              <p>{actor.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 SIMILAR (USING ROW) */}
      <Row
        title="More Like This"
        fetchData={() => fetchSimilarMovies(id)}
      />

      {/* 🔥 RECOMMENDED (USING ROW) */}
      <Row
        title="Recommended For You"
        fetchData={() => fetchRecommendations(id)}
      />
    </div>
  );
};

export default MovieDetail;