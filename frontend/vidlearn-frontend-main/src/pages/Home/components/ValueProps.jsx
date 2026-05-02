import React from "react";

function ValueProps() {
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
          A new paradigm for educational content. Build comprehensive lessons in seconds, not hours.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2px',
          marginTop: '64px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Card 1 */}
          <div className="animate" data-delay="100" style={{
            padding: '32px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transitionDelay: '100ms'
          }}>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontWeight: 600
            }}>Zero Slides</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Generative Animation
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Say goodbye to tedious slide decks. Shiksha writes p5.js code to procedurally draw and animate your concepts frame by frame.
            </p>
          </div>

          {/* Card 2 */}
          <div className="animate" data-delay="200" style={{
            padding: '32px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transitionDelay: '200ms'
          }}>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontWeight: 600
            }}>Instant Voiceover</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Studio-Quality Audio
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              No need for microphones or multiple takes. We synthesize human-like voiceovers perfectly timed with the visual script.
            </p>
          </div>

          {/* Card 3 */}
          <div className="animate" data-delay="300" style={{
            padding: '32px',
            transitionDelay: '300ms'
          }}>
            <div style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--accent)',
              textTransform: 'uppercase',
              marginBottom: '12px',
              fontWeight: 600
            }}>Active Recall</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
              Automated Quizzes
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
              Passive watching isn't enough. The system automatically extracts key concepts to test your knowledge immediately after the video.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValueProps;
