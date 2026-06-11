import React, { useCallback } from "react";

const CARDS = [
  {
    tag: "Zero Slides",
    title: "Generative Animation",
    body: "Say goodbye to tedious slide decks. Shishka AI writes p5.js code to procedurally draw and animate your concepts frame by frame.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    tag: "Instant Voiceover",
    title: "Studio-Quality Audio",
    body: "No need for microphones or multiple takes. We synthesize human-like voiceovers perfectly timed with the visual script.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    tag: "Active Recall",
    title: "Automated Quizzes",
    body: "Passive watching isn't enough. The system automatically extracts key concepts to test your knowledge immediately after the video.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><circle cx="12" cy="12" r="10" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

const TOPICS = [
  "Thermodynamics", "Neural Networks", "Photosynthesis", "Binary Search",
  "Orbital Mechanics", "The Krebs Cycle", "Fourier Transforms", "Plate Tectonics",
  "Bayes' Theorem", "DNA Replication", "Supply & Demand", "Special Relativity",
];

function ValueProps() {
  // Drive the spotlight position via CSS custom properties.
  const onMove = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  return (
    <section id="features" style={{
      padding: '120px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div className="section-container">
        <h2 className="animate" style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 600,
          color: 'white',
          maxWidth: '700px',
          margin: '0 auto',
          letterSpacing: '-0.03em',
          textAlign: 'center',
          lineHeight: 1.2
        }}>
          A new paradigm for educational content. Build comprehensive lessons in <span className="gradient-text">seconds, not hours.</span>
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginTop: '64px'
        }}>
          {CARDS.map((card, i) => (
            <div
              key={card.title}
              className="animate spotlight-card"
              onMouseMove={onMove}
              style={{ padding: '32px', transitionDelay: `${(i + 1) * 100}ms` }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(79,110,247,0.1)',
                border: '1px solid rgba(79,110,247,0.25)',
                color: 'var(--accent)',
                marginBottom: '20px'
              }}>
                {card.icon}
              </div>
              <div style={{
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                marginBottom: '12px',
                fontWeight: 600
              }}>{card.tag}</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {/* Topic marquee */}
        <div className="animate" style={{ marginTop: '72px', transitionDelay: '200ms' }}>
          <div style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginBottom: '20px',
            fontWeight: 600
          }}>
            One prompt away from any topic
          </div>
          <div className="marquee" aria-hidden="true">
            {[0, 1].map((dup) => (
              <div className="marquee-track" key={dup}>
                {TOPICS.map((t) => (
                  <span key={`${dup}-${t}`} style={{
                    fontSize: '15px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    padding: '8px 18px',
                    border: '1px solid var(--border)',
                    borderRadius: '100px',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValueProps;
