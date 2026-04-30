import React from "react";
import { Link } from "react-router-dom";

function LinearFooter() {
  return (
    <footer style={{
      background: '#080809',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '64px 0 32px'
    }}>
      <div className="section-container">
        {/* ROW 1: 5-column grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '40px',
          marginBottom: '48px'
        }}>
          {/* Col 1 */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 600, fontSize: '15px' }}>
              <svg width="18" height="18" viewBox="0 0 100 100">
                <rect width="100" height="100" rx="20" fill="var(--accent)" />
                <text x="50%" y="50%" fontFamily="Inter, sans-serif" fontWeight="bold" fontSize="60" fill="white" textAnchor="middle" dy=".35em">G</text>
              </svg>
              GyanAI
            </div>
            <p style={{ fontSize: '13px', color: '#4a4a5a', marginTop: '8px', maxWidth: '200px' }}>
              The generative engine for educational content.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <a href="#" style={{ color: '#4a4a5a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#f1f1f3'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a5a'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" style={{ color: '#4a4a5a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#f1f1f3'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a5a'}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2 */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>Product</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><Link to="/tool" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Demo</Link></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Pricing</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Changelog</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>Features</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>AI Scripting</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Procedural Animation</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Text-to-Speech</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Quiz Generation</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>Developers</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>API</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Documentation</a></li>
              <li><a href="https://github.com" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>GitHub</a></li>
            </ul>
          </div>

          {/* Col 5 */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>Legal</div>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Privacy Policy</a></li>
              <li><a href="#" style={{ fontSize: '13px', color: '#6b6b7a', transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#c4c4d4'} onMouseLeave={e => e.currentTarget.style.color = '#6b6b7a'}>Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* ROW 2 */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ fontSize: '12px', color: '#4a4a5a' }}>
            © {new Date().getFullYear()} GyanAI. All rights reserved.
          </div>
          <div style={{ fontSize: '12px', color: '#4a4a5a', display: 'flex', gap: '16px' }}>
            <a href="#" style={{ transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#8b8b9a'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a5a'}>Privacy</a>
            <a href="#" style={{ transition: 'color var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.color = '#8b8b9a'} onMouseLeave={e => e.currentTarget.style.color = '#4a4a5a'}>Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LinearFooter;
