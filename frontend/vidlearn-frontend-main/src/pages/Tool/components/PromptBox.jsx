import React, { useRef, useEffect } from "react";

const MAX_PROMPT = 2000; // matches the backend limit

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

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading) {
      handleSubmit(e);
    }
  };

  const sliderFill = `${((timeValue - 1) / 9) * 100}%`;

  return (
    <div className="card">
      <div style={{marginBottom: '16px'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <label className="label-caps">What would you like to learn?</label>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: prompt.length > MAX_PROMPT ? '#ff6b6b' : 'var(--text-muted)' }}>
            {prompt.length}/{MAX_PROMPT}
          </span>
        </div>
        <textarea
          className="input-field"
          style={{paddingTop: '8px', paddingBottom: '8px', minHeight: '80px', resize: 'vertical'}}
          value={prompt}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          maxLength={MAX_PROMPT}
          placeholder="e.g. Explain the First Law of Thermodynamics with visual examples"
          rows="3"
          onInput={adjustHeight}
          ref={textareaRef}
        />
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Tip: press <kbd style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border-strong)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px' }}>Ctrl</kbd> + <kbd style={{ fontFamily: 'var(--font-mono)', border: '1px solid var(--border-strong)', borderRadius: '4px', padding: '1px 5px', fontSize: '10px' }}>Enter</kbd> to generate
        </div>
      </div>

      <div style={{marginBottom: '24px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
          <label className="label-caps">Video length</label>
          <span style={{fontSize: '13px', color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)'}}>{timeValue} min{timeValue > 1 ? "s" : ""}</span>
        </div>
        <input
          type="range"
          className="styled-range"
          min="1"
          max="10"
          step="1"
          value={timeValue}
          onChange={handleSliderChange}
          style={{width: '100%', '--range-fill': sliderFill}}
          aria-label="Video length in minutes"
        />
      </div>

      <div style={{display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap'}}>
        <div
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
          style={{
            flex: 1,
            minWidth: '200px',
            border: '1px dashed var(--border-strong)',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            fontSize: '13px',
            color: file ? 'var(--accent)' : 'var(--text-secondary)',
            transition: 'background var(--transition-fast), border-color var(--transition-fast)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'rgba(79,110,247,0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
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
          className="btn btn-primary btn-shine"
          onClick={handleSubmit}
          disabled={loading}
          style={{width: '180px'}}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
              Generating…
            </>
          ) : (
            "⚡ Generate Video"
          )}
        </button>
      </div>
    </div>
  );
}

export default PromptBox;
