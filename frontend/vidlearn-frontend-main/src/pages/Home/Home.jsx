import React, { useEffect } from "react";
import LinearNav from "./components/LinearNav";
import Hero from "./components/Hero";
import ValueProps from "./components/ValueProps";
import FeatureSection from "./components/FeatureSection";
import SocialProof from "./components/SocialProof";
import HowItWorks from "./components/HowItWorks";
import FinalCTA from "./components/FinalCTA";
import LinearFooter from "./components/LinearFooter";

function Home() {
  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(el => {
        if (el.isIntersecting) {
          el.target.classList.add('is-visible');
          observer.unobserve(el.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.animate, .animate-left, .animate-right').forEach(el => {
      observer.observe(el);
    });

    // Cursor Glow Effect
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    const moveGlow = (e) => {
      glow.style.left = `${e.clientX}px`;
      glow.style.top = `${e.clientY}px`;
    };

    window.addEventListener('mousemove', moveGlow);

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', moveGlow);
      if (document.body.contains(glow)) {
        document.body.removeChild(glow);
      }
    };
  }, []);

  return (
    <div>
      <LinearNav />
      <Hero />
      <ValueProps />
      
      {/* 1.0 Feature Section */}
      <FeatureSection 
        numberBadge="1.0"
        title="LLM-Powered Scripting"
        description="GyanAI analyzes your prompt or PDF document to structure a comprehensive lesson plan, breaking down complex topics into digestible narrative segments."
        subFeatures={[
          "Context-aware generation from text or PDFs",
          "Automatic pacing and segment duration",
          "Pedagogically sound lesson structures"
        ]}
        mockup={
          <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
            <div style={{display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-strong)', paddingBottom: '16px'}}>
              <div style={{background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '12px'}}>Scripting</div>
              <div style={{color: 'var(--text-secondary)', padding: '4px 12px', fontSize: '12px'}}>Animation</div>
              <div style={{color: 'var(--text-secondary)', padding: '4px 12px', fontSize: '12px'}}>Voiceover</div>
            </div>
            <div style={{fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#c4c4d4', lineHeight: 1.6}}>
              <span style={{color: '#ff7b72'}}>const</span> <span style={{color: '#79c0ff'}}>lessonPlan</span> <span style={{color: '#ff7b72'}}>=</span> {'{'}
              <br/>&nbsp;&nbsp;<span style={{color: '#a5d6ff'}}>"segment_1"</span>: {'{'}
              <br/>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color: '#a5d6ff'}}>"voiceover"</span>: <span style={{color: '#a5d6ff'}}>"Welcome to thermodynamics..."</span>,
              <br/>&nbsp;&nbsp;&nbsp;&nbsp;<span style={{color: '#a5d6ff'}}>"duration"</span>: <span style={{color: '#79c0ff'}}>15</span>
              <br/>&nbsp;&nbsp;{'}'}
              <br/>{'}'};
            </div>
          </div>
        }
      />

      {/* 2.0 Feature Section (Reversed) */}
      <FeatureSection 
        numberBadge="2.0"
        title="Procedural Animation Engine"
        description="We don't use stock footage. GyanAI dynamically writes and executes p5.js code to procedurally draw mathematical and conceptual animations."
        subFeatures={[
          "Real-time canvas rendering via headless browser",
          "Code-driven precise visual demonstrations",
          "Synchronized perfectly with the voice script"
        ]}
        reverse={true}
        mockup={
          <div style={{background: '#0a0a0b', border: '1px solid var(--border-strong)', borderRadius: '8px', height: '200px', position: 'relative', overflow: 'hidden'}}>
            {/* Fake p5.js canvas drawing */}
            <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100px', height: '100px', border: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 4s linear infinite'}} />
            <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', border: '2px dashed var(--success)', borderRadius: '50%', animation: 'spin 2s linear reverse infinite'}} />
            <div style={{position: 'absolute', bottom: '12px', left: '12px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)'}}>
              p5.js active rendering...
            </div>
          </div>
        }
      />

      {/* 3.0 Feature Section */}
      <FeatureSection 
        numberBadge="3.0"
        title="Neural Text-to-Speech"
        description="Bring the lesson to life with a studio-quality AI voiceover. Our integrated TTS engine reads the script with natural human intonation."
        subFeatures={[
          "OpenAI TTS Alloy voice integration",
          "High-fidelity MP3 streaming",
          "Automated segment merging using FFmpeg"
        ]}
        mockup={
          <div style={{display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#16161a', borderRadius: '8px'}}>
            <div style={{width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #2b40a3)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </div>
            <div style={{flex: 1}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                <span style={{fontSize: '13px', color: 'white', fontWeight: 500}}>voiceover_seg1.mp3</span>
                <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>0:15 / 0:15</span>
              </div>
              {/* Fake Audio Waveform */}
              <div style={{display: 'flex', gap: '4px', height: '24px', alignItems: 'center'}}>
                {[30,50,80,100,60,40,90,70,50,80,40,20,50,90,100,60,30,20].map((h, i) => (
                  <div key={i} style={{flex: 1, height: `${h}%`, background: i < 8 ? 'var(--accent)' : 'var(--border-strong)', borderRadius: '2px'}} />
                ))}
              </div>
            </div>
          </div>
        }
      />

      {/* 4.0 Feature Section (Reversed) */}
      <FeatureSection 
        numberBadge="4.0"
        title="Interactive Quizzes"
        description="Instantly convert the generated video content into a comprehensive quiz. Extract key takeaways and assess comprehension."
        subFeatures={[
          "Automated question generation",
          "Multi-choice and true/false formats",
          "Exportable PDF study notes"
        ]}
        reverse={true}
        mockup={
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
            <div style={{fontSize: '14px', color: 'white', fontWeight: 500, marginBottom: '8px'}}>Q: What is the First Law of Thermodynamics?</div>
            {["Energy cannot be created or destroyed", "Heat always flows to colder bodies", "Entropy always increases"].map((opt, i) => (
              <div key={i} style={{
                padding: '12px 16px',
                border: i === 0 ? '1px solid var(--success)' : '1px solid var(--border-strong)',
                background: i === 0 ? 'rgba(62,207,142,0.1)' : '#16161a',
                borderRadius: '8px',
                fontSize: '13px',
                color: i === 0 ? 'var(--success)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{width: '16px', height: '16px', borderRadius: '50%', border: i === 0 ? '4px solid var(--success)' : '1px solid var(--text-muted)'}} />
                {opt}
              </div>
            ))}
          </div>
        }
      />

      <SocialProof />
      <HowItWorks />
      <FinalCTA />
      <LinearFooter />
    </div>
  );
}

export default Home;
