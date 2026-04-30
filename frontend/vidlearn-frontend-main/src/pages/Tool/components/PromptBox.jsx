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
    <div className="prompt-box">
      <p className="prompt-label">What would you like to learn?</p>

      <textarea
        value={prompt}
        onChange={handleChange}
        placeholder="e.g. Explain the First Law of Thermodynamics with visual examples"
        rows="3"
        onInput={adjustHeight}
        ref={textareaRef}
      />

      <div className="slider-group">
        <div className="slider-row">
          <span>Video length</span>
          <span className="slider-value">{timeValue} min{timeValue > 1 ? "s" : ""}</span>
        </div>
        <input
          type="range"
          className="slider"
          min="1"
          max="10"
          step="1"
          value={timeValue}
          onChange={handleSliderChange}
        />
      </div>

      <div className="prompt-actions">
        <div
          className={`upload-box ${file ? "has-file" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
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
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate Video"}
        </button>
      </div>
    </div>
  );
}

export default PromptBox;
