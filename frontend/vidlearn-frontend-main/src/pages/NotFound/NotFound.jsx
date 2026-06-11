import React from "react";
import { Link } from "react-router-dom";
import LinearNav from "../Home/components/LinearNav";
import LinearFooter from "../Home/components/LinearFooter";
import ParticleField from "../../components/ParticleField";

function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <LinearNav />
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "120px 24px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <ParticleField />
        <div className="aurora-orb" style={{ width: "360px", height: "360px", top: "10%", left: "-100px", background: "rgba(79,110,247,0.4)" }} />
        <div
          className="float"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(90px, 16vw, 160px)",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: "8px",
          }}
        >
          <span className="gradient-text">404</span>
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "white",
            margin: 0,
          }}
        >
          Page not found
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            maxWidth: "460px",
            lineHeight: 1.6,
            marginTop: "16px",
          }}
        >
          The page you’re looking for doesn’t exist or may have moved. Let’s get
          you back on track.
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
          <Link to="/" className="btn btn-primary btn-large">
            Back to home
          </Link>
          <Link to="/tool" className="btn btn-secondary btn-large">
            Open the tool
          </Link>
        </div>
      </main>
      <LinearFooter />
    </div>
  );
}

export default NotFound;
