import React from "react";

function FeatureSection({ 
  numberBadge, 
  title, 
  description, 
  subFeatures, 
  mockup, 
  reverse = false 
}) {
  const textColumn = (
    <div className={reverse ? "animate-right" : "animate-left"} style={{ flex: 1, minWidth: '300px' }}>
      <div style={{
        fontSize: '12px',
        color: 'var(--accent)',
        fontFamily: 'var(--font-mono)',
        marginBottom: '20px'
      }}>
        {numberBadge}
      </div>
      <h2 style={{
        fontSize: 'clamp(28px, 3.5vw, 40px)',
        fontWeight: 700,
        color: 'white',
        letterSpacing: '-0.03em',
        lineHeight: 1.15,
        marginBottom: '16px'
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '16px',
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        marginBottom: '32px'
      }}>
        {description}
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {subFeatures.map((feat, i) => (
          <div 
            key={i} 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f1f1f3'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <span style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              marginRight: '12px'
            }}>
              {numberBadge.split('.')[0]}.{i + 1}
            </span>
            <span style={{
              fontSize: '14px',
              color: '#6b6b7a',
              fontWeight: 500,
              transition: 'color var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f1f1f3'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#6b6b7a'}
            >
              {feat}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px' }}>
        <a href="#" style={{
          color: 'var(--accent)',
          fontSize: '14px',
          textDecoration: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
        >
          Learn more →
        </a>
      </div>
    </div>
  );

  const mockupColumn = (
    <div className={reverse ? "animate-left" : "animate-right"} style={{ flex: 1, minWidth: '300px' }}>
      <div style={{
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        {mockup}
      </div>
    </div>
  );

  return (
    <section style={{
      padding: '100px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div className="section-container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '80px',
        alignItems: 'center',
        flexDirection: reverse ? 'row-reverse' : 'row'
      }}>
        {textColumn}
        {mockupColumn}
      </div>
    </section>
  );
}

export default FeatureSection;
