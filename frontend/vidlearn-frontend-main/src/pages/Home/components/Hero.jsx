import React from "react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <section 
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '120px',
        paddingBottom: '80px',
        overflow: 'hidden'
      }}
    >
      {/* Background Gradients */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,110,247,0.18), transparent 70%), radial-gradient(ellipse 40% 30% at 80% 60%, rgba(120,80,255,0.08), transparent 60%)',
        zIndex: -2
      }} />
      
      {/* Noise Texture */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        opacity: 0.03,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      {/* Announcement Badge */}
      <div className="animate" style={{ transitionDelay: '100ms' }}>
        <a href="#how-it-works" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(79,110,247,0.3)',
          backgroundColor: 'rgba(79,110,247,0.08)',
          borderRadius: '100px',
          padding: '6px 14px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
          transition: 'all 200ms',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79,110,247,0.6)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(79,110,247,0.3)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        >
          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%' }} />
          Introducing Shiksha 2.0: Instant Quiz Generation →
        </a>
      </div>

      {/* Main Headline */}
      <h1 className="animate" style={{
        fontSize: 'clamp(48px, 7vw, 80px)',
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1.05,
        color: 'white',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto',
        transitionDelay: '200ms'
      }}>
        Type a topic. <br/>
        Watch it become a lesson.
      </h1>

      {/* Sub-headline */}
      <p className="animate" style={{
        fontSize: '18px',
        color: 'var(--text-secondary)',
        maxWidth: '520px',
        textAlign: 'center',
        lineHeight: 1.6,
        marginTop: '20px',
        transitionDelay: '350ms'
      }}>
        Shiksha writes the script, animates every frame, narrates it, and tests your knowledge. The fastest way to create educational content.
      </p>

      {/* CTAs */}
      <div className="animate" style={{
        marginTop: '40px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        transitionDelay: '450ms'
      }}>
        <Link to="/tool" className="btn btn-primary btn-large">Get Started</Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-large">View on GitHub</a>
      </div>

      <div className="animate" style={{
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '16px',
        letterSpacing: '0.04em',
        transitionDelay: '450ms'
      }}>
        Open source · No signup required · MIT License
      </div>

      {/* Hero Mockup */}
      <div className="animate" style={{
        marginTop: '80px',
        width: '100%',
        maxWidth: '1000px',
        marginLeft: 'auto',
        marginRight: 'auto',
        position: 'relative',
        transitionDelay: '600ms',
        padding: '0 24px'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '20%',
          right: '20%',
          height: '40px',
          background: 'var(--accent)',
          filter: 'blur(80px)',
          opacity: 0.15,
          zIndex: -1
        }} />

        {/* Mockup Window */}
        <div style={{
          background: '#111113',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
        }}>
          {/* Browser Chrome */}
          <div style={{
            height: '40px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '8px'
          }}>
            <div style={{display: 'flex', gap: '6px'}}>
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56'}} />
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e'}} />
              <div style={{width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f'}} />
            </div>
            <div style={{
              flex: 1,
              marginLeft: '16px',
              marginRight: '36px',
              background: '#1a1a1e',
              borderRadius: '6px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              gyan-ai.app/tool
            </div>
          </div>

          {/* Fake UI Content */}
          <div style={{ padding: '32px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
            {/* Prompt Area */}
            <div style={{
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              padding: '16px',
              background: '#16161a'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Prompt</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--text-mono)' }}>Explain the First Law of Thermodynamics with visual examples.</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>PDF: thermo_notes.pdf</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>3 mins</span>
                </div>
                <div style={{ background: 'rgba(79,110,247,0.12)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} /> Processing...
                </div>
              </div>
            </div>

            {/* Video Placeholder Area */}
            <div style={{
              height: '300px',
              background: '#0d0d10',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'linear-gradient(90deg, #1a1a1e 25%, #222228 50%, #1a1a1e 75%)' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'linear-gradient(90deg, #1a1a1e 25%, #222228 50%, #1a1a1e 75%)' }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'linear-gradient(90deg, #1a1a1e 25%, #222228 50%, #1a1a1e 75%)', border: '1px solid var(--accent)' }} />
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(79,110,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--text-mono)', fontSize: '13px' }}>Generating frames [42/120]</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
