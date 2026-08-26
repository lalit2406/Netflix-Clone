import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const user = localStorage.getItem("user");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    // Clear session caching on signout to keep data isolated
    sessionStorage.clear();
    navigate("/");
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/browse") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/browse");
    }
  };

  const handleMyListClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/browse") {
      const el = document.getElementById("mylist-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        // Scroll to bottom if list is empty
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    } else {
      navigate("/browse");
      // Stagger scroll invocation to allow browse navigation compile time
      setTimeout(() => {
        document.getElementById("mylist-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <nav className={`netflix-navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-left">
        <h1 className="logo" onClick={() => navigate(user ? "/browse" : "/")}>
          NETFLIX
        </h1>
        {user && (
          <ul className="nav-links">
            <li>
              <a 
                href="/browse" 
                className={location.pathname === "/browse" && !searchQuery ? "active" : ""}
                onClick={handleHomeClick}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#mylist" 
                onClick={handleMyListClick}
              >
                My List
              </a>
            </li>
          </ul>
        )}
      </div>

      <div className="nav-right">
        {user && setSearchQuery && (
          <div className="search-container">
            <svg 
              className="search-icon-svg"
              width="15" 
              height="15" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Titles, genres..."
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search titles"
            />
            {searchQuery && (
              <button 
                className="search-clear-btn" 
                onClick={() => setSearchQuery("")}
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {user && (
          <button className="btn-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;