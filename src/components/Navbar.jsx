import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setSearchTerm }) => {
  const navigate = useNavigate();

  return (
    <div className="navbar">
      <h1 className="logo">NETFLIX</h1>

      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search movies..."
          className="search-bar"
          onChange={(e) => setSearchTerm(e.target.value)}
        />

      </div>
    </div>
  );
};

export default Navbar;