import React from "react";

function AboutText() {
  return (
    <div className="about-text">
      <div className="about-col">
        <h2 className="fancy-font">
          We got tired of boring study content. So we automated the good kind.
        </h2>
      </div>
      <div className="about-col">
        <p>
          Shishka AI started as a hackathon question: what if a student could type one
          sentence and get back a full animated lesson? A language model, a headless
          browser, and a few all-nighters later — it works.
        </p>
        <p>
          An LLM writes and sharpens the script. p5.js animates every
          scene. Neural TTS narrates it. Gemini builds the quiz. FFmpeg assembles
          the final video. You just type.
        </p>
      </div>
    </div>
  );
}

export default AboutText;
