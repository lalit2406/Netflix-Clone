import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => localStorage.getItem("tempEmail") || "");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/browse";

  const handleLogin = () => {
    setError("");
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError("Email address is required.");
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("user", JSON.stringify({ email: trimmedEmail }));
    localStorage.removeItem("tempEmail"); // clear temp email

    navigate(from, { replace: true });
  };

  return (
    <div className="login">
      <header className="login-header">
        <h1 className="logo" onClick={() => navigate("/")}>
          NETFLIX
        </h1>
      </header>

      <div className="login-box">
        <h1>Sign In</h1>

        {error && <p className="login-error">{error}</p>}

        <input
          type="email"
          value={email}
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
        />

        <button onClick={handleLogin}>Sign In</button>
      </div>
    </div>
  );
};

export default Login;