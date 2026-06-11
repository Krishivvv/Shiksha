import React, { useEffect, useState } from "react";

// Maps backend progress step strings (see main.py set_progress calls) onto
// a fixed visual pipeline: Script → Animate → Record → Narrate → Merge → Done.
const STAGES = [
  { key: "script", label: "Script", icon: "✍️" },
  { key: "animate", label: "Animate", icon: "🎨" },
  { key: "record", label: "Record", icon: "🎬" },
  { key: "narrate", label: "Narrate", icon: "🎙️" },
  { key: "merge", label: "Merge", icon: "🧬" },
  { key: "done", label: "Done", icon: "✓" },
];

export function stageFromStep(step = "") {
  const s = step.toLowerCase();
  if (s.includes("completed")) return 5;
  if (s.includes("merging")) return 4;
  if (s.includes("voiceover")) return 3;
  if (s.includes("recording")) return 2;
  if (s.includes("animation") || s.includes("processing segment")) return 1;
  return 0;
}

export function segmentInfo(step = "") {
  const m = step.match(/\((\d+)\/(\d+)\)/);
  return m ? { current: Number(m[1]), total: Number(m[2]) } : null;
}

function useElapsed(active) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!active) return;
    setSecs(0);
    const id = setInterval(() => setSecs((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function GenerationPipeline({ progress }) {
  const step = progress?.step || "Initializing";
  const stage = stageFromStep(step);
  const seg = segmentInfo(step);
  const elapsed = useElapsed(true);

  return (
    <div className="card quiz-card" style={{ marginTop: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "8px" }}>
        <div className="badge badge-processing">
          <span className="spinner" style={{ width: "10px", height: "10px", borderWidth: "1.5px" }} />
          Generating
        </div>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          {seg && (
            <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
              segment {seg.current}/{seg.total}
            </span>
          )}
          <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            ⏱ {elapsed}
          </span>
        </div>
      </div>

      <div className="pipeline">
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            className={`pipeline-step ${i < stage ? "is-done" : ""} ${i === stage ? "is-active" : ""}`}
          >
            <div className="pipeline-dot">{i < stage ? "✓" : s.icon}</div>
            <div className="pipeline-label">{s.label}</div>
            {i < STAGES.length - 1 && <div className="pipeline-connector" />}
          </div>
        ))}
      </div>

      <div className="progress-track" />

      <p style={{ marginTop: "20px", fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, textAlign: "center" }}>
        {step}
      </p>
      <p style={{ marginTop: "6px", fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
        {progress?.message || "Headless Chrome is drawing your animation while the narrator warms up. This usually takes a few minutes."}
      </p>
    </div>
  );
}

export default GenerationPipeline;
