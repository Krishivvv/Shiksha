import React from "react";
import { MdDownload } from "react-icons/md";

const API = import.meta.env.VITE_API_URL;

function VideoBox({ videoUrl }) {
  return (
    <div className="card">
      <div className="label-caps" style={{marginBottom: '16px'}}>Your Generated Video</div>
      
      <div className="output-box" style={{padding: '8px', marginBottom: '16px'}}>
        <video 
          src={videoUrl} 
          controls 
          style={{width: '100%', borderRadius: '4px', backgroundColor: '#000'}} 
        />
      </div>

      <div style={{display: 'flex', gap: '12px'}}>
        <a href={videoUrl} download className="btn btn-primary" style={{flex: 1}}>
          <MdDownload />
          Download Video
        </a>
        <a
          href={`${API}/download-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{flex: 1}}
        >
          <MdDownload />
          Download Study Notes
        </a>
      </div>
    </div>
  );
}

export default VideoBox;
