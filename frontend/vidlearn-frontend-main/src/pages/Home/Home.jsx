import React from "react";
import Header from "./components/Header";
import About from "./components/About";
import Footer from "../../components/Footer";
import "./Home.css";

function Home() {
  return (
    <div className="container-wrapper">
      <Header>
        <div className="hero-badge">Oriental Hack 2025 · Tech Titans</div>
        <h1 className="fancy-font">
          Type a topic.<br />
          <span className="gradient-text">Get a full lesson.</span>
        </h1>
        <p className="hero-subtitle">
          GyanAI writes the script, draws every frame, narrates it, and quizzes
          you at the end — all from one sentence. No slides. No editing. Just learn.
        </p>
      </Header>
      <About />
      <Footer />
    </div>
  );
}

export default Home;
