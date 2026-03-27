import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Row from "../components/Row";
import Footer from "../components/Footer";
import "../styles/Home.css";

import {
  fetchTrending,
  fetchTopRated,
  fetchPopular,
  fetchAction,
  fetchComedy,
  searchMovies,
} from "../api/tmdb";

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [heroMode, setHeroMode] = useState("landing"); // 🔥 NEW

  return (
    <div>
      <Navbar setSearchTerm={setSearchTerm} />

      {/* 🔥 HERO SWITCH */}
      <Hero onStart={() => setHeroMode("slider")} mode={heroMode} />

      {/* 🔥 ROWS ALWAYS VISIBLE */}
      {searchTerm ? (
        <Row
          title="Search Results"
          fetchData={() => searchMovies(searchTerm)}
        />
      ) : (
        <>
          <Row title="🔥 Trending" fetchData={fetchTrending} />
          <Row title="⭐ Top Rated" fetchData={fetchTopRated} />
          <Row title="🎬 Popular" fetchData={fetchPopular} />
          <Row title="💥 Action" fetchData={fetchAction} />
          <Row title="😂 Comedy" fetchData={fetchComedy} />
        </>
      )}

      <Footer />
    </div>
  );
};

export default Home;