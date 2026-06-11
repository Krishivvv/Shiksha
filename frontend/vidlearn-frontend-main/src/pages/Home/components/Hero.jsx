import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ParticleField from "../../../components/ParticleField";

const DEMO_TOPICS = [
  "Explain the First Law of Thermodynamics with visual examples",
  "How does a neural network actually learn?",
  "Visualize the Doppler effect with a moving ambulance",
  "Why do orbits stay up? Gravity, explained with vectors",
  "Teach me binary search with an animated number line",
];

const DEMO_STAGES = [
  { label: "Writing script", icon: "✍️" },
  { label: "Generating p5.js animation", icon: "🎨" },
  { label: "Recording frames", icon: "🎬" },
  { label: "Synthesizing voiceover", icon: "🎙️" },
  { label: "Merging with FFmpeg", icon: "🧬" },
];

// Typewriter that cycles through phrases forever.
function useTypewriter(phrases, typeMs = 38, holdMs = 2600) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(phrases[0]);
      return;
    }
    let i = 0;
    let timer;
    const phrase = phrases[idx % phrases.length];
    const typeNext = () => {
      i += 1;
      setText(phrase.slice(0, i));
      if (i < phrase.length) {
        timer = setTimeout(typeNext, typeMs + Math.random() * 40);
      } else {
        timer = setTimeout(() => {
          setText("");
          setIdx((v) => v + 1);
        }, holdMs);
      }
    };
    timer = setTimeout(typeNext, 400);
    return () => clearTimeout(timer);
  }, [idx, phrases, typeMs, holdMs]);

  return text;
}

// Looping fake pipeline for the hero mockup.
function useDemoPipeline() {
  const [stage, setStage] = useState(0);
  const [frames, setFrames] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(2);
      setFrames(87);
      return;
    }
    let cancelled = false;
    let timers = [];
    const run = () => {
      if (cancelled) return;
      setDone(false);
      setFrames(0);
      DEMO_STAGES.forEach((_, i) => {
        timers.push(setTimeout(() => !cancelled && setStage(i), i * 1900));
      });
      // frame counter rolls during the "recording" stage
      timers.push(
        setTimeout(() => {
          let f = 0;
          const fi = setInterval(() => {
            f += 3;
            if (cancelled || f > 120) {
              clearInterval(fi);
              return;
            }
            setFrames(f);
          }, 45);
          timers.push(fi);
        }, 2 * 1900)
      );
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          setDone(true);
          timers.push(setTimeout(run, 3200));
        }, DEMO_STAGES.length * 1900)
      );
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
    };
  }, []);

  return { stage, frames, done };
}

function Hero() {
  const typed = useTypewriter(DEMO_TOPICS);
  const demo = useDemoPipeline();

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

      {/* Constellation particles */}
      <ParticleField />

      {/* Aurora orbs */}
      <div className="aurora-orb" style={{ width: '420px', height: '420px', top: '-120px', left: '-80px', background: 'rgba(79,110,247,0.5)' }} />
      <div className="aurora-orb" style={{ width: '360px', height: '360px', bottom: '5%', right: '-100px', background: 'rgba(122,92,255,0.4)', animationDelay: '-6s' }} />

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
          <span className="pulse-glow" style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '50%' }} />
          Introducing Shishka AI 2.0: Instant Quiz Generation →
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
        <span className="gradient-text">Watch it become a lesson.</span>
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
        Shishka AI writes the script, animates every frame, narrates it, and tests your knowledge. The fastest way to create educational content.
      </p>

      {/* CTAs */}
      <div className="animate" style={{
        marginTop: '40px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        transitionDelay: '450ms'
      }}>
        <Link to="/tool" className="btn btn-primary btn-large btn-shine">Get Started</Link>
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

      {/* Hero Mockup — a live, looping simulation of the real pipeline */}
      <div className="animate float" style={{
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
              shishka.ai/tool
            </div>
          </div>

          {/* Live UI Content */}
          <div style={{ padding: '32px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
            {/* Prompt Area — types itself */}
            <div style={{
              border: '1px solid var(--border-strong)',
              borderRadius: '8px',
              padding: '16px',
              background: '#16161a'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Prompt</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '14px', fontFamily: 'var(--font-mono)', minHeight: '22px' }}>
                {typed}<span className="type-caret" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>PDF: thermo_notes.pdf</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: '4px' }}>3 mins</span>
                </div>
                {demo.done ? (
                  <div style={{ background: 'rgba(62,207,142,0.12)', color: 'var(--success)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ✓ Lesson ready
                  </div>
                ) : (
                  <div style={{ background: 'rgba(79,110,247,0.12)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="spinner" style={{ width: '8px', height: '8px', borderWidth: '1.5px' }} /> {DEMO_STAGES[demo.stage].label}…
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline visual */}
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
              {/* stage chips */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', right: '16px' }}>
                {DEMO_STAGES.map((s, i) => (
                  <div key={s.label} style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    padding: '4px 10px',
                    borderRadius: '100px',
                    border: `1px solid ${i < demo.stage || demo.done ? 'rgba(62,207,142,0.5)' : i === demo.stage ? 'var(--accent)' : 'var(--border-strong)'}`,
                    color: i < demo.stage || demo.done ? 'var(--success)' : i === demo.stage ? 'var(--accent)' : 'var(--text-muted)',
                    background: i === demo.stage && !demo.done ? 'rgba(79,110,247,0.1)' : 'transparent',
                    transition: 'all 400ms ease'
                  }}>
                    {i < demo.stage || demo.done ? '✓ ' : ''}{s.icon} {s.label}
                  </div>
                ))}
              </div>

              {demo.done ? (
                <div style={{ textAlign: 'center' }} className="quiz-card">
                  <div className="pulse-glow" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(62,207,142,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(62,207,142,0.4)' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--success)"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  </div>
                  <div style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>lesson.mp4 · quiz · study notes — ready</div>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {/* orbiting p5 sketch */}
                  <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 16px' }}>
                    <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 4s linear infinite', borderTopColor: 'transparent' }} />
                    <div style={{ position: 'absolute', inset: '12px', border: '2px dashed var(--accent-2)', borderRadius: '50%', animation: 'spin 2.4s linear reverse infinite' }} />
                    <div style={{ position: 'absolute', inset: '26px', background: 'var(--accent)', borderRadius: '50%', opacity: 0.6 }} />
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    {demo.stage === 2 ? `Capturing frames [${demo.frames}/120]` : `${DEMO_STAGES[demo.stage].label}…`}
                  </div>
                </div>
              )}

              {/* equalizer during the voiceover stage */}
              {demo.stage === 3 && !demo.done && (
                <div style={{ position: 'absolute', bottom: '18px', left: 0, right: 0, display: 'flex', gap: '4px', justifyContent: 'center', height: '26px', alignItems: 'flex-end' }}>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className="eq-bar" style={{ height: '100%', animationDelay: `${(i % 7) * 0.11}s` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
