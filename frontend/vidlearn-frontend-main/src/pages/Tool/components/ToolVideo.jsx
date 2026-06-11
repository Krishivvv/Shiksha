import React from "react";

function ToolVideo({ vid, prompt, status }) {
  const label =
    status === "completed" ? "Ready" :
    status === "failed" ? "Failed" :
    status === "processing" ? "Processing" : null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--border)'
    }}>
      <div style={{padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px'}}>
        {label && <span className={`status-dot ${status}`} title={label} />}
        <p style={{fontSize: '13px', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1}}>
          {prompt}
        </p>
      </div>
      {status === "failed" ? (
        <div style={{ padding: '16px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Generation failed — try this prompt again.
        </div>
      ) : (
        <video src={vid} controls preload="metadata" style={{width: '100%', display: 'block'}} />
      )}
    </div>
  );
}

export default ToolVideo;
