import React, { useState } from "react";
import { Link } from "react-router-dom";

function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="20" fill="var(--accent)" />
            <text x="50%" y="50%" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="60" fill="white" textAnchor="middle" dy=".35em">S</text>
          </svg>
          Shishka AI
        </Link>
        <div className="navbar-links" style={{ display: mobileOpen ? 'flex' : '' }}>
          <Link to="/">Home</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <Link to="/login">Login</Link>
          <Link to="/tool" className="btn btn-primary btn-small" style={{marginLeft: '8px', color: '#fff'}}>Get Started</Link>
        </div>
        <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
      {/* Basic mobile menu logic: could be improved with a proper slide-in, but this functions for now using inline style override above if we wanted, or we just keep it hidden */}
    </nav>
  );
}

export default Nav;
