import axios from "axios";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// 🔥 Trending
export const fetchTrending = () =>
  axios.get(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);

// ⭐ Top Rated
export const fetchTopRated = () =>
  axios.get(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}`);

// 🎬 Popular
export const fetchPopular = () =>
  axios.get(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);

// 😂 Comedy
export const fetchComedy = () =>
  axios.get(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35`
  );

// 🔥 Action
export const fetchAction = () =>
  axios.get(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28`
  );

  // 🎬 Trailer
export const fetchMovieVideos = (id) =>
  axios.get(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`);

// 🎭 Cast
export const fetchMovieCredits = (id) =>
  axios.get(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`);

export const fetchSimilarMovies = (id) =>
  axios.get(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`);

export const fetchRecommendations = (id) =>
  axios.get(`${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}`);

// 🔍 Search
export const searchMovies = (query) =>
  axios.get(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${query}`
  );

// 🎥 Details
export const fetchMovieDetails = (id) =>
  axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);