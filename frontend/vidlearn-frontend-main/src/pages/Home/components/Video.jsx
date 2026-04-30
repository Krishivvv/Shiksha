import React from "react";

function Video() {
  return (
    <div className="video">
      <div className="video-glow" />
      <video
        className="video-home"
        src="/videoFrontend.mp4"
        controls={true}
        playsInline
      />
    </div>
  );
}

export default Video;
