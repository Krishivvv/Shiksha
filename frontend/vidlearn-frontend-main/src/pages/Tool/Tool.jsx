import React, { useState, useEffect } from "react";
import ToolNav from "./components/ToolNav";
import PromptBox from "./components/PromptBox";
import ToolHeader from "./components/ToolHeader";
import VideoBox from "./components/VideoBox";
import "./Tool.css";

const API = import.meta.env.VITE_API_URL;

function Tool() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [timeValue, setTimeValue] = useState(1);
  const [progress, setProgress] = useState(null);

  // Fetch past generations on mount
  useEffect(() => {
    fetch(`${API}/history`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) =>
        setHistory(
          data.map((v) => ({
            ...v,
            url: `${API}/download-video?filename=${v.filename}`,
          }))
        )
      )
      .catch(console.error);
  }, []);

  // Poll /progress while loading
  useEffect(() => {
    if (!loading) {
      setProgress(null);
      return;
    }
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${API}/progress`, { credentials: "include" });
        const data = await res.json();
        setProgress(data);
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [loading]);

  const handleNav = (e) => {
    e.preventDefault();
    setOpen((o) => !o);
  };

  const handleChange = (e) => setPrompt(e.target.value);

  const handleSliderChange = (e) =>
    setTimeValue(parseInt(e.target.value, 10));

  const handleFileUpload = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const form = new FormData();
    form.append("attachment", f);

    const res = await fetch(`${API}/upload-pdf`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const data = await res.json();
    if (res.ok) {
      setFile(f);
    } else {
      alert(data.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return alert("Please enter a prompt.");

    setLoading(true);
    setVideoUrl("");
    const form = new FormData();
    const refined_prompt = `${prompt}. minimum duration of video: ${timeValue} minutes`;
    form.append("prompt", refined_prompt);
    if (file) form.append("attachment", file);

    try {
      const res = await fetch(`${API}/generate-video`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        const url = `${API}/download-video?filename=${data.filename}`;
        setVideoUrl(url);
        setHistory((prev) => [
          { filename: data.filename, url, prompt_text: refined_prompt },
          ...prev,
        ]);
      } else {
        alert(data.error || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-wrapper">
      <ToolNav open={open} handleNav={handleNav} history={history} />
      <div className="tool-main">
        <ToolHeader open={open} handleNav={handleNav} />
        <div className="tool-content">
          <div className="tool-heading">
            <h1 className="tool-title">
              Generate an{" "}
              <span className="gradient-text">educational video</span>
            </h1>
            <p className="tool-subtitle">
              Describe any topic and GyanAI will build an animated lesson with voiceover.
            </p>
          </div>

          <PromptBox
            prompt={prompt}
            handleChange={handleChange}
            handleFileUpload={handleFileUpload}
            handleSubmit={handleSubmit}
            loading={loading}
            timeValue={timeValue}
            handleSliderChange={handleSliderChange}
            file={file}
          />

          {loading && (
            <div className="progress-section">
              <div className="progress-spinner" />
              <p className="progress-step">
                {progress?.step || "Initializing generation…"}
              </p>
              <p className="progress-msg">
                {progress?.message ||
                  "Setting up your video pipeline. This may take a few minutes."}
              </p>
            </div>
          )}

          {videoUrl && !loading && <VideoBox videoUrl={videoUrl} />}
        </div>
      </div>
    </div>
  );
}

export default Tool;
