import React from "react";

const API = import.meta.env.VITE_API_URL;

function VideoBox({ videoUrl }) {
  return (
    <div className="video-box tool-row">
      <video src={videoUrl} controls className="w-full rounded-lg shadow-md" />
      <div className="row mt-2 space-x-2">
        {/* Video download */}
        <a href={videoUrl} download>
          <button className="submit-btn">Download Video</button>
        </a>

        {/* PDF download */}
        <a
          href={`${API}/download-pdf`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button className="submit-btn">Download PDF</button>
        </a>
      </div>
    </div>
  );
}

export default VideoBox;
