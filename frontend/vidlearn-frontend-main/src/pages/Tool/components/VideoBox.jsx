import React from "react";
import { MdDownload } from "react-icons/md";

const API = import.meta.env.VITE_API_URL;

function VideoBox({ videoUrl }) {
  return (
    <div className="video-box">
      <p className="video-box-title">Your Generated Video</p>

      <video src={videoUrl} controls className="video-result" />

      <div className="video-actions">
        <a href={videoUrl} download className="download-btn">
          <MdDownload />
          Download Video
        </a>
        <a
          href={`${API}/download-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="download-btn"
        >
          <MdDownload />
          Download Study Notes (PDF)
        </a>
      </div>
    </div>
  );
}

export default VideoBox;
