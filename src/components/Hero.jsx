import React, { useState, useEffect } from "react";
import { fetchTrending, fetchMovieVideos } from "../api/tmdb";

const Hero = ({ onStart, mode }) => {
  const [email, setEmail] = useState("");

  const [movies, setMovies] = useState([]);
  const [index, setIndex] = useState(0);
  const [videoKey, setVideoKey] = useState(null);

  const [playTrailer, setPlayTrailer] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);

  // 🎬 Fetch movies
  useEffect(() => {
    if (mode !== "slider") return;

    const getData = async () => {
      try {
        const res = await fetchTrending();
        setMovies(res.data.results.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };

    getData();
  }, [mode]);

  // 🎥 Fetch trailer
  useEffect(() => {
    if (mode !== "slider" || movies.length === 0) return;

    const getVideo = async () => {
      try {
        const res = await fetchMovieVideos(movies[index].id);
        const trailer = res.data.results.find(
          (vid) => vid.type === "Trailer" && vid.site === "YouTube"
        );
        setVideoKey(trailer ? trailer.key : null);
      } catch (err) {
        console.error(err);
      }
    };

    getVideo();

    setPlayTrailer(false);
    setLoadingVideo(false);

  }, [index, movies, mode]);

  // 🔁 Auto slide (stops when playing)
  useEffect(() => {
    if (
      mode !== "slider" ||
      movies.length === 0 ||
      playTrailer
    )
      return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % movies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [movies, mode, playTrailer]);

  // ⬅️➡️ Controls
  const prevSlide = () => {
    setIndex((prev) =>
      prev === 0 ? movies.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % movies.length);
  };

  // ================= LANDING =================
  if (mode === "landing") {
    return (
      <div className="hero-landing">
        <div className="hero-overlay">
          <h1>Unlimited movies, shows and more</h1>

          <p className="sub-text">
            Starts at ₹149. Cancel anytime.
          </p>

          <div className="hero-input">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={() => {
                if (!email) {
                  alert("Enter email first");
                  return;
                }

                localStorage.setItem("user", email);
                onStart();
              }}
            >
              Get Started ❯
            </button>
          </div>
        </div>
      </div>
    );
  }

  const movie = movies[index];

  // ================= SLIDER =================
  return (
    <div className="hero-slider">

      {/* 🎬 VIDEO OR IMAGE */}
      {playTrailer && videoKey ? (
        <>
          {loadingVideo && <div className="video-loader"></div>}

          <iframe
            className="hero-video"
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
            title="Trailer"
            allow="autoplay"
            allowFullScreen
            onLoad={() => setLoadingVideo(false)}
          />
        </>
      ) : (
        <div
          className="hero-fallback"
          style={{
            backgroundImage: movie
              ? `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
              : "",
          }}
        />
      )}

      {/* 🔥 CONTENT */}
      <div className={`hero-overlay slider-content ${playTrailer ? "hide-content" : ""}`}>
        <h1>{movie?.title}</h1>
        <p>⭐ {movie?.vote_average}</p>
        <p className="hero-desc">{movie?.overview}</p>

        <div className="hero-buttons">
          {!playTrailer && (
            <>
              <button
                className="play-btn"
                onClick={() => {
                  setPlayTrailer(true);
                  setLoadingVideo(true);
                }}
              >
                ▶ Play
              </button>

              <button className="info-btn">More Info</button>
            </>
          )}
        </div>
      </div>

      {/* 🔥 CLOSE BUTTON (WITH FADE-IN) */}
      {playTrailer && (
        <button
          className="hero-close-btn show"
          onClick={() => setPlayTrailer(false)}
        >
          ✕
        </button>
      )}

      {/* ⬅️➡️ ARROWS */}
      {!playTrailer && (
        <>
          <button className="hero-arrow left" onClick={prevSlide}>
            ❮
          </button>

          <button className="hero-arrow right" onClick={nextSlide}>
            ❯
          </button>
        </>
      )}
    </div>
  );
};

export default Hero;