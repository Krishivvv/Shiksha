import React from "react";
import { Link } from "react-router-dom";

function FinalCTA() {
  return (
    <section style={{
      padding: '140px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(79,110,247,0.1), transparent 60%)',
        zIndex: -1
      }} />

      <div className="section-container">
        <h2 className="animate" style={{
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-0.04em',
          marginBottom: '20px'
        }}>
          Built for the future. <br/> Available today.
        </h2>
        <p className="animate" style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          marginBottom: '40px',
          transitionDelay: '100ms'
        }}>
          Stop wasting hours on slides. Generate your first video lesson in minutes.
        </p>

        <div className="animate" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          transitionDelay: '200ms'
        }}>
          <Link to="/tool" className="btn btn-primary btn-large">Get Started for Free</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">View GitHub</a>
        </div>

        <p className="animate" style={{
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginTop: '24px',
          transitionDelay: '300ms'
        }}>
          Already used by developers and educators worldwide
        </p>
      </div>
    </section>
  );
}

export default FinalCTA;
