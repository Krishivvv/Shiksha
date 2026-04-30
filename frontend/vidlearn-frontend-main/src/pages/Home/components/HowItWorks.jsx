import React from "react";

const steps = [
  { n: "01", title: "You type a prompt", detail: "Any topic, any depth. One sentence is enough." },
  { n: "02", title: "AI builds the script", detail: "GPT-4o drafts it. Gemini refines it. Kept under 10 minutes." },
  { n: "03", title: "p5.js draws every frame", detail: "Custom animations render in a headless browser. No stock footage." },
  { n: "04", title: "Watch & test yourself", detail: "Narrated video drops. Gemini quiz follows. You're done." },
];

function HowItWorks() {
  return (
    <div className="how-section">
      <p className="section-label">How it works</p>
      <div className="how-steps">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="how-step">
              <span className="how-n">{s.n}</span>
              <p className="how-title">{s.title}</p>
              <p className="how-detail">{s.detail}</p>
            </div>
            {i < steps.length - 1 && <div className="how-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default HowItWorks;
