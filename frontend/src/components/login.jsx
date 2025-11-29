import React, { useState } from "react";
import { login } from "../service/login"; // <-- your API service

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await login(email, password);

      if (res.success && res.token) {
        // Save token to localStorage
        localStorage.setItem("token", res.token);

        // Inform parent
        onLoginSuccess?.(res);

        console.log("Logged in successfully");
      } else {
        setErrorMsg(res.message || "Login failed.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>

      <form onSubmit={handleSubmit} className="login-form">

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            placeholder="your@email.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && <p className="error">{errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
