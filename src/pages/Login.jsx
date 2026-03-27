import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  useEffect(() => {
    // 🔥 get email from hero
    const storedEmail = localStorage.getItem("tempEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleLogin = () => {
    if (!email) return;

    localStorage.setItem("user", email);
    localStorage.removeItem("tempEmail"); // clean

    navigate("/");
  };

 return (
  <div className="login">
    <div className="login-box">
      <h1>Sign In</h1>

      <input
        type="email"
        value={email}
        placeholder="Enter email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleLogin}>Continue</button>
    </div>
  </div>
);
};

export default Login;