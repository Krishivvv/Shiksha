import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function LinearNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        width: "100%",
        height: "56px",
        zIndex: 1000,
        background: scrolled ? "rgba(10,10,11,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        transition: "background 300ms ease, backdrop-filter 300ms ease, border-bottom 300ms ease",
        display: "flex",
        alignItems: "center"
      }}
    >
      <div className="section-container" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Left: Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "15px", color: "white" }}>
          <svg width="20" height="20" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="20" fill="var(--accent)" />
            <text x="50%" y="50%" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="60" fill="white" textAnchor="middle" dy=".35em">G</text>
          </svg>
          Shiksha
        </Link>

        {/* Center: Nav Links */}
        <div className="nav-links" style={{ display: "flex", gap: "24px" }}>
          <a href="#features" style={{ fontSize: "14px", color: "var(--text-secondary)", transition: "color 150ms" }}>Features</a>
          <a href="#how-it-works" style={{ fontSize: "14px", color: "var(--text-secondary)", transition: "color 150ms" }}>How it works</a>
          <Link to="/tool" style={{ fontSize: "14px", color: "var(--text-secondary)", transition: "color 150ms" }}>Demo</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: "14px", color: "var(--text-secondary)", transition: "color 150ms" }}>GitHub</a>
        </div>

        {/* Right: Buttons */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">GitHub</a>
          <Link to="/tool" className="btn btn-primary">Try Now</Link>
        </div>

      </div>
    </nav>
  );
}

export default LinearNav;
