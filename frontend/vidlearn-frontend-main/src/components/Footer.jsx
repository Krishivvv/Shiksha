import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/tool">Tool</Link>
          <Link to="/login">Login</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <div className="footer-copyright">
          © {new Date().getFullYear()} Tech Titans · Oriental Hack 2025. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
