import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMyListClick = (e) => {
    e.preventDefault();
    if (location.pathname === "/browse") {
      document.getElementById("mylist-section")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/browse");
      // Stagger scroll action slightly to allow page routing compile time
      setTimeout(() => {
        document.getElementById("mylist-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <footer className="netflix-footer" aria-label="Global Footer">
      <div className="footer-container">
        <p className="footer-contact">
          Questions? Call <a href="tel:000-800-919-1743">000-800-919-1743</a>
        </p>

        <nav className="footer-links" aria-label="Footer Links Grid">
          <div className="footer-column">
            <Link to="/browse" className="footer-link">Home</Link>
            <Link to="/browse" className="footer-link">Browse</Link>
            <a href="#mylist" className="footer-link" onClick={handleMyListClick}>My List</a>
          </div>

          <div className="footer-column">
            <a href="#faq" className="footer-link">FAQ</a>
            <a href="#help" className="footer-link">Help Center</a>
            <a href="#media" className="footer-link">Media Center</a>
          </div>

          <div className="footer-column">
            <a href="#privacy" className="footer-link">Privacy Policy</a>
            <a href="#terms" className="footer-link">Terms of Use</a>
            <a href="#contact" className="footer-link">Contact Us</a>
          </div>
        </nav>

        <div className="footer-socials" aria-label="Portfolio social links">
          <a href="https://github.com/lalit2406" target="_blank" rel="noopener noreferrer" className="footer-social-link">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">LinkedIn</a>
          <a href="https://github.com/lalit2406/Netflix-Clone" target="_blank" rel="noopener noreferrer" className="footer-social-link">Portfolio</a>
        </div>

        <div className="footer-bottom">
          <h2 className="footer-logo">NETFLIX CLONE</h2>
          <p className="footer-tech">Built with React • Vite • RapidAPI IMDb</p>
          <div className="footer-copyright">
            <p>© 2026 Netflix Clone</p>
            <p className="footer-disclaimer">Educational / Portfolio Project</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;