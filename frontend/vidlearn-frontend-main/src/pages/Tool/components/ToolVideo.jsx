import React from "react";

function ToolVideo({ vid, prompt }) {
  return (
    <div className="history-item">
      <video src={vid} controls preload="metadata" />
    </div>
  );
}

export default ToolVideo;
