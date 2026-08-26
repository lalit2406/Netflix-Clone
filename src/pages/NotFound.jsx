import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ padding: "100px 20px", textAlign: "center", color: "#fff" }}>
      <h1 style={{ fontSize: "64px", marginBottom: "20px" }}>404</h1>
      <p style={{ fontSize: "20px", marginBottom: "30px" }}>Page Not Found</p>
      <Link
        to="/"
        style={{
          color: "#e50914",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "18px"
        }}
      >
        Back Home
      </Link>
    </div>
  );
};

export default NotFound;
