import React, { useRef, useEffect } from "react";

function PromptBox({
  prompt,
  handleChange,
  handleFileUpload,
  handleSubmit,
  loading,
  timeValue,
  handleSliderChange,
  file,
}) {
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(adjustHeight, []);

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="card">
      <div style={{marginBottom: '16px'}}>
        <label className="label-caps" style={{display: 'block', marginBottom: '8px'}}>What would you like to learn?</label>
        <textarea
          className="input-field"
          style={{paddingTop: '8px', paddingBottom: '8px', minHeight: '80px', resize: 'vertical'}}
          value={prompt}
          onChange={handleChange}
          placeholder="e.g. Explain the First Law of Thermodynamics with visual examples"
          rows="3"
          onInput={adjustHeight}
          ref={textareaRef}
        />
      </div>

      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
          <label className="label-caps">Video length</label>
          <span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>{timeValue} min{timeValue > 1 ? "s" : ""}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={timeValue}
          onChange={handleSliderChange}
          style={{width: '100%', accentColor: 'var(--accent)'}}
        />
      </div>

      <div style={{display: 'flex', gap: '16px', alignItems: 'center'}}>
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          style={{
            flex: 1,
            border: '1px dashed var(--border-strong)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            color: file ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'background var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          {file ? `📄 ${file.name}` : "Drop a PDF or click to browse"}
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            ref={inputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{width: '180px'}}
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>
      </div>
    </div>
  );
}

export default PromptBox;
