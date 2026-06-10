import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../../api";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password }),
      });

      const data = await res.json();
      if (res.ok) {
        navigate("/tool");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in">
      <div className="card auth-card">
        <div style={{textAlign: 'center', marginBottom: '24px'}}>
          <Link to="/" style={{display: 'inline-block'}}>
            <svg width="40" height="40" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="20" fill="var(--accent)" />
              <text x="50%" y="50%" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="60" fill="white" textAnchor="middle" dy=".35em">S</text>
            </svg>
          </Link>
        </div>

        <h2 className="auth-title">Welcome back</h2>

        {error && <div className="badge badge-error" style={{marginBottom: '16px', width: '100%', justifyContent: 'center'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="label-caps" style={{display: 'block', marginBottom: '8px'}} htmlFor="username">
              Username or Email
            </label>
            <input
              className="input-field"
              type="text"
              id="username"
              placeholder="you@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label-caps" style={{display: 'block', marginBottom: '8px'}} htmlFor="password">
              Password
            </label>
            <input
              className="input-field"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '8px'}} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-link">Create one free</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
