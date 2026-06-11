import React, { useState } from "react";

// Interactive quiz. `questions` is the backend shape: an array of
// [question, optionA, optionB, optionC, optionD, answerLetter] tuples.
const LETTERS = ["A", "B", "C", "D"];

function ScoreRing({ score, total }) {
  const pct = total ? score / total : 0;
  const R = 52;
  const C = 2 * Math.PI * R;
  const color = pct >= 0.7 ? "var(--success)" : pct >= 0.4 ? "var(--warning)" : "#ff6b6b";
  return (
    <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
      <svg className="score-ring" width="140" height="140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--bg-elevated)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={R} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: "30px", fontWeight: 700, color: "white", letterSpacing: "-0.03em" }}>
          {score}/{total}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>score</span>
      </div>
    </div>
  );
}

function QuizPanel({ questions, onClose }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const q = questions[idx];
  const answerIdx = q ? LETTERS.indexOf(String(q[5]).trim().toUpperCase()) : -1;

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === answerIdx) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= total) {
      setFinished(true);
    } else {
      setIdx((v) => v + 1);
      setPicked(null);
    }
  };

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = score / total;
    const verdict =
      pct >= 0.9 ? "Outstanding — you own this topic." :
      pct >= 0.7 ? "Strong work. A quick rewatch will lock it in." :
      pct >= 0.4 ? "Good start — try the video once more." :
      "Tough one. Rewatch the lesson and try again!";
    return (
      <div className="card quiz-card" style={{ marginTop: "24px", textAlign: "center", padding: "40px 28px" }}>
        <ScoreRing score={score} total={total} />
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "white", marginTop: "20px", letterSpacing: "-0.02em" }}>
          Quiz complete
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>{verdict}</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
          <button className="btn btn-primary" onClick={restart}>Retake Quiz</button>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="card quiz-card" style={{ marginTop: "24px" }} key={idx}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span className="label-caps">Knowledge Check</span>
        <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          {idx + 1} / {total}
        </span>
      </div>

      <div className="quiz-progress-bar" style={{ marginBottom: "24px" }}>
        <div className="quiz-progress-fill" style={{ width: `${((idx + (picked !== null ? 1 : 0)) / total) * 100}%` }} />
      </div>

      <h3 style={{ fontSize: "17px", fontWeight: 600, color: "white", lineHeight: 1.5, marginBottom: "20px" }}>
        {q[0]}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {LETTERS.map((letter, i) => {
          const cls =
            picked === null ? "" :
            i === answerIdx ? "is-correct" :
            i === picked ? "is-wrong" : "";
          return (
            <button
              key={letter}
              className={`quiz-option ${cls}`}
              onClick={() => pick(i)}
              disabled={picked !== null}
            >
              <span className="quiz-key">{letter}</span>
              <span>{q[i + 1]}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="quiz-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "13.5px", color: picked === answerIdx ? "var(--success)" : "#ff9b9b", fontWeight: 500 }}>
            {picked === answerIdx ? "✓ Correct!" : `✗ Correct answer: ${LETTERS[answerIdx]}`}
          </span>
          <button className="btn btn-primary" onClick={next}>
            {idx + 1 >= total ? "See results" : "Next question →"}
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizPanel;
