import React, { useState, useEffect } from "react";
import Logo from "../../../components/Logo";

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`nav ${scrolled ? "nav--scrolled" : ""}`}>
      <div className="nav-inner">
        <Logo />
        <div className="nav-links">
          <a href="/login" className="nav-link">
            Log In
          </a>
          <a href="/signup">
            <button className="btn primary">Get Started</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Nav;
