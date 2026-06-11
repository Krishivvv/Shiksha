import React from "react";
import { MdDownload, MdQuiz } from "react-icons/md";
import { API } from "../../../api";

function VideoBox({ videoUrl, onGenerateQuiz, quizLoading, quizReady }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div className="label-caps">Your Generated Video</div>
        <div className="badge badge-success">✓ Ready</div>
      </div>

      <div className="output-box" style={{ padding: "8px", marginBottom: "16px" }}>
        <video
          src={videoUrl}
          controls
          preload="metadata"
          style={{ width: "100%", borderRadius: "4px", backgroundColor: "#000" }}
        />
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a href={videoUrl} download className="btn btn-primary btn-shine" style={{ flex: 1, minWidth: "160px" }}>
          <MdDownload />
          Download Video
        </a>
        <a
          href={`${API}/download-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ flex: 1, minWidth: "160px" }}
        >
          <MdDownload />
          Study Notes (PDF)
        </a>
        {onGenerateQuiz && !quizReady && (
          <button
            className="btn btn-secondary"
            onClick={onGenerateQuiz}
            disabled={quizLoading}
            style={{ flex: 1, minWidth: "160px", borderColor: "rgba(79,110,247,0.4)", color: "var(--accent)" }}
          >
            {quizLoading ? (
              <>
                <span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "2px" }} />
                Building quiz…
              </>
            ) : (
              <>
                <MdQuiz />
                Test My Knowledge
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default VideoBox;
