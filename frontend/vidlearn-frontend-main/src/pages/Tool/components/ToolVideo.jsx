import React from "react";

function ToolVideo({ vid, prompt }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)', 
      borderRadius: '8px', 
      overflow: 'hidden', 
      border: '1px solid var(--border)'
    }}>
      <div style={{padding: '8px 12px', borderBottom: '1px solid var(--border)'}}>
        <p style={{fontSize: '13px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {prompt}
        </p>
      </div>
      <video src={vid} controls preload="metadata" style={{width: '100%', display: 'block'}} />
    </div>
  );
}

export default ToolVideo;
