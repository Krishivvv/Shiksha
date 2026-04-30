import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        navigate("/login");
      } else {
        setError(data.error || "Signup failed");
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
              <text x="50%" y="50%" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="60" fill="white" textAnchor="middle" dy=".35em">G</text>
            </svg>
          </Link>
        </div>

        <h2 className="auth-title">Create your account</h2>

        {error && <div className="badge badge-error" style={{marginBottom: '16px', width: '100%', justifyContent: 'center'}}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="label-caps" style={{display: 'block', marginBottom: '8px'}} htmlFor="username">
              Username
            </label>
            <input
              className="input-field"
              type="text"
              id="username"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="label-caps" style={{display: 'block', marginBottom: '8px'}} htmlFor="email">
              Email
            </label>
            <input
              className="input-field"
              type="email"
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{marginTop: '8px'}} disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
