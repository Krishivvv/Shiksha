import React from "react";

function HowItWorks() {
  const steps = [
    {
      num: 1,
      title: "Input Context",
      desc: "Provide a simple text prompt or upload a detailed PDF document. Shishka AI's LLM instantly comprehends the material."
    },
    {
      num: 2,
      title: "Generative Processing",
      desc: "The system simultaneously writes the script, generates p5.js animation code, and synthesizes a human voiceover."
    },
    {
      num: 3,
      title: "Export & Learn",
      desc: "Download the fully rendered MP4 video, the extracted PDF study notes, and take the automated quiz."
    }
  ];

  return (
    <section id="how-it-works" style={{
      padding: '100px 0',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center'
    }}>
      <div className="section-container">
        <h2 className="animate" style={{
          fontSize: 'clamp(28px, 3.5vw, 40px)',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '-0.03em',
          marginBottom: '64px'
        }}>
          How it works
        </h2>

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          position: 'relative',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* We only show the dashed line on non-mobile screens realistically, 
              but for simplicity, we'll use a CSS trick or absolute positioning */}
          
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '10%',
            right: '10%',
            height: '1px',
            borderTop: '1px dashed rgba(79,110,247,0.3)',
            zIndex: 0
          }} className="hide-on-mobile" />

          {steps.map((step, i) => (
            <div key={i} className="animate" style={{
              flex: '1 1 250px',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transitionDelay: `${i * 150}ms`
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid rgba(79,110,247,0.4)',
                backgroundColor: '#0a0a0b',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
                marginBottom: '24px',
                boxShadow: '0 0 15px rgba(79,110,247,0.1)'
              }}>
                {step.num}
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'white',
                marginBottom: '12px'
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
      `}} />
    </section>
  );
}

export default HowItWorks;
