import React from "react";
import Video from "./Video";
import Nav from "./Nav";

function Header({ children }) {
  return (
    <div className="container">
      <Nav />
      <div className="header-home">
        <div className="col col-left">
          {children}
          <div className="hero-cta">
            <a href="/signup">
              <button className="btn primary">Start Creating →</button>
            </a>
            <a href="/login">
              <button className="btn">Log In</button>
            </a>
          </div>
        </div>
        <div className="col">
          <Video />
        </div>
      </div>
    </div>
  );
}

export default Header;
