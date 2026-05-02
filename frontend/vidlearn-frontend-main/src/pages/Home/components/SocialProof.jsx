import React, { useEffect, useRef, useState } from "react";

function SocialProof() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  // Simple intersection observer to trigger stats
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (statsRef.current) {
      observer.observe(statsRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Animated counter component
  const Counter = ({ target, suffix = "" }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!statsVisible) return;
      let start = null;
      const duration = 1200;
      
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        // easeOutQuart
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOut * target));
        
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    }, [statsVisible, target]);

    return <>{count}{suffix}</>;
  };

  return (
    <section style={{
      position: 'relative',
      padding: '100px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '80%', height: '80%',
        background: 'radial-gradient(ellipse at center, rgba(79,110,247,0.05), transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      <div className="section-container" ref={statsRef}>
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '32px',
          marginBottom: '80px',
          textAlign: 'center'
        }}>
          {[
            { target: 10, suffix: 'x', label: 'Faster content creation' },
            { target: 100, suffix: '%', label: 'Automated workflow' },
            { target: 50, suffix: 'ms', label: 'Average latency' },
            { target: 24, suffix: '/7', label: 'Always available' }
          ].map((stat, i) => (
            <div key={i} className="animate" data-delay={i * 100} style={{ transitionDelay: `${i * 100}ms` }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 700,
                color: 'white',
                letterSpacing: '-0.04em',
                marginBottom: '8px'
              }}>
                <Counter target={stat.target} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              quote: "Shiksha completely changed how I prepare for my lectures. What used to take a weekend of slide building now takes five minutes.",
              name: "Dr. Sarah Jenkins",
              role: "Professor of Physics"
            },
            {
              quote: "We integrated this into our onboarding flow. New engineers get personalized video lessons on our architecture instantly.",
              name: "Marcus Chen",
              role: "VP of Engineering"
            },
            {
              quote: "The automated quiz generation is mind-blowing. It perfectly extracts the core concepts I need my students to remember.",
              name: "Elena Rodriguez",
              role: "Instructional Designer"
            }
          ].map((test, i) => (
            <div key={i} className="animate" data-delay={200 + (i * 150)} style={{
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '24px',
              transitionDelay: `${200 + (i * 150)}ms`
            }}>
              <p style={{
                fontSize: '15px',
                color: '#c4c4d4',
                lineHeight: 1.7,
                marginBottom: '24px'
              }}>
                "{test.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #2b40a3)'
                }} />
                <div>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: 500 }}>{test.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{test.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProof;
