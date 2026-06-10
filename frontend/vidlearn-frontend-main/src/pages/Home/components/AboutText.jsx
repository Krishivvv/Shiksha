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
          sentence and get back a full animated lesson? Three AI models, a headless
          browser, and a few all-nighters later — it works.
        </p>
        <p>
          GPT-4o writes the script. Gemini sharpens it. p5.js animates every
          scene. OpenAI TTS narrates it. Gemini builds the quiz. FFmpeg assembles
          the final video. You just type.
        </p>
      </div>
    </div>
  );
}

export default AboutText;
