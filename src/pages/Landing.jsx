import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPopularMovies } from "../api/movies";
import Footer from "../components/Footer";
import heroBg from "../assets/hero.png";
import "../styles/Landing.css";

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const scrollContainerRef = useRef(null);

  // 1. Navbar transparent-to-solid transition on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch popular movies for Horizontal Preview
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const data = await getPopularMovies(6);
        setMovies(data);
      } catch (err) {
        console.error("Preview movies load failed:", err.message);
        setApiError(err.message || "Failed to load movie previews.");
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, []);

  // 3. Email Form Validation
  const handleGetStarted = (emailVal) => {
    setError("");
    const trimmed = emailVal.trim();

    if (!trimmed) {
      setError("Email address is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("tempEmail", trimmed);
    navigate("/login");
  };

  return (
    <div className="landing-page">
      {/* NAVBAR */}
      <nav className={`landing-navbar ${scrolled ? "scrolled" : ""}`}>
        <h1 className="logo" onClick={() => navigate("/")}>
          NETFLIX
        </h1>
        <Link to="/login" className="btn-signin">
          Sign In
        </Link>
      </nav>

      {/* CINEMATIC HERO */}
      <header
        className="landing-hero"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="hero-content">
          <h1>Unlimited movies, TV shows, and more.</h1>
          <p>Watch anywhere. Cancel at any time.</p>

          <div className="landing-form-container">
            <h3>Ready to watch? Enter your email to create or restart your membership.</h3>
            <div className="landing-form">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGetStarted(email);
                }}
                aria-label="Email address"
              />
              <button onClick={() => handleGetStarted(email)}>
                Get Started ❯
              </button>
            </div>
            {error && <span className="email-error">{error}</span>}
          </div>
        </div>
      </header>

      {/* CORE FEATURES SECTION */}
      <section className="landing-features" aria-label="Platform Features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              {/* TV Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
              </svg>
            </div>
            <h2>Enjoy on your TV</h2>
            <p>Watch on smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players and more.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              {/* Download Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
              </svg>
            </div>
            <h2>Download & watch</h2>
            <p>Save your favorites easily and always have something to watch offline.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              {/* Screen Icon */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v10H4zM20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h3l-1 1v2h10v-2l-1-1h3c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <h2>Watch everywhere</h2>
            <p>Stream unlimited movies and TV shows on your phone, tablet, laptop, and Smart TV.</p>
          </div>
        </div>
      </section>

      {/* MOVIE PREVIEW LIST */}
      <section className="landing-preview" aria-label="Trending Previews">
        <h2>Cinematic Preview</h2>
        
        {loading ? (
          <div style={{ display: "flex", gap: "20px" }}>
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="preview-card skeleton-loading" style={{ height: "270px", backgroundColor: "#1c1c1c" }} />
            ))}
          </div>
        ) : apiError ? (
          <div className="preview-error-box">
            <p>🎬 Explore our library once signed in!</p>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>({apiError})</span>
          </div>
        ) : movies.length === 0 ? (
          <div className="preview-error-box">
            <p>Previews are temporarily unavailable.</p>
          </div>
        ) : (
          <div className="preview-row-container">
            <div className="preview-posters" ref={scrollContainerRef}>
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="preview-card"
                  onClick={() => navigate("/login")}
                >
                  <img
                    className="preview-img"
                    src={movie.posterUrl}
                    alt={movie.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop"; // generic dark fallback
                    }}
                  />
                  <div className="preview-overlay">
                    <h3>{movie.title}</h3>
                    <p>{movie.year} • {movie.rating} ★</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FINAL CALL-TO-ACTION */}
      <section className="landing-cta" aria-label="Call to Action">
        <div className="cta-content">
          <h2>Ready to start streaming?</h2>
          <div className="landing-form-container">
            <h3>Enter your email to join the membership.</h3>
            <div className="landing-form">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGetStarted(email);
                }}
                aria-label="Email address for membership"
              />
              <button onClick={() => handleGetStarted(email)}>
                Get Started ❯
              </button>
            </div>
            {error && <span className="email-error">{error}</span>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
};

export default Landing;
