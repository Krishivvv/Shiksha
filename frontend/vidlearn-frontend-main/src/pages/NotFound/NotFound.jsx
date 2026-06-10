import React from "react";
import { Link } from "react-router-dom";
import LinearNav from "../Home/components/LinearNav";
import LinearFooter from "../Home/components/LinearFooter";

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
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "14px",
            letterSpacing: "0.08em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Error 404
        </div>
        <h1
          style={{
            fontSize: "clamp(40px, 6vw, 64px)",
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
