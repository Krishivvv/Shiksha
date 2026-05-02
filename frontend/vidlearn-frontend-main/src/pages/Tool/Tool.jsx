import React, { useState, useEffect, useRef } from "react";
import ToolNav from "./components/ToolNav";
import PromptBox from "./components/PromptBox";
import VideoBox from "./components/VideoBox";
import LinearNav from "../Home/components/LinearNav";
import LinearFooter from "../Home/components/LinearFooter";
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
  const [authChecked, setAuthChecked] = useState(false);

  // Refs for the active task being polled
  const taskIdRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ── Auth guard + fetch history on mount ────────────────────────────────
  useEffect(() => {
    fetch(`${API}/history`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/login";
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setAuthChecked(true);
        const videos = data.videos || data || [];
        setHistory(
          videos.map((v) => ({
            ...v,
            url: `${API}/download-video?filename=${v.filename}`,
          }))
        );
      })
      .catch(() => {
        // Network error — show the page anyway, endpoints will handle auth
        setAuthChecked(true);
      });
  }, []);

  // ── Cleanup poll on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ── Poll /task-status/<task_id> while loading ───────────────────────────
  const startPolling = (taskId) => {
    taskIdRef.current = taskId;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/task-status/${taskId}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data);

        if (data.state === "completed") {
          // Generation finished — extract filename and build URL
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;

          const filename = data.filename;
          if (filename) {
            const url = `${API}/download-video?filename=${filename}`;
            setVideoUrl(url);
            setHistory((prev) => [
              { filename, url, prompt_text: prompt, status: "completed" },
              ...prev,
            ]);
          }
          setLoading(false);
        } else if (data.state === "failed") {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          const msg = data.message || "Video generation failed.";
          const display = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")
            ? "API quota exceeded. The team needs to refresh the Gemini API key."
            : msg.length > 200 ? "Generation failed. Check backend logs." : msg;
          alert(display);
          setLoading(false);
        }
      } catch {
        // silently retry
      }
    }, 2500);
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleNav = (e) => {
    if (e) e.preventDefault();
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

    try {
      const res = await fetch(`${API}/upload-pdf`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setFile(f);
      } else {
        alert(data.error || "Upload failed");
      }
    } catch {
      alert("Network error uploading file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return alert("Please enter a prompt.");

    setLoading(true);
    setVideoUrl("");
    setProgress(null);

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

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (res.ok || res.status === 202) {
        // Backend returns { task_id, video_id } and runs generation in bg
        const taskId = data.task_id;
        if (taskId) {
          startPolling(taskId);
        } else {
          // Fallback for old API shape: { success, filename }
          if (data.filename) {
            const url = `${API}/download-video?filename=${data.filename}`;
            setVideoUrl(url);
            setHistory((prev) => [
              { filename: data.filename, url, prompt_text: refined_prompt },
              ...prev,
            ]);
          }
          setLoading(false);
        }
      } else {
        alert(data.error || "Generation failed");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if (!authChecked) {
    return (
      <div className="tool-loading-screen">
        <div className="tool-spinner" />
      </div>
    );
  }

  return (
    <div className="tool-layout">
      <LinearNav />
      <ToolNav open={open} handleNav={handleNav} history={history} />

      <div className="tool-container fade-in">
        <div
          className="tool-header-area"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2>
              Generate an{" "}
              <span style={{ color: "var(--accent)" }}>educational video</span>
            </h2>
            <p>
              Describe any topic and Shiksha will build an animated lesson with
              voiceover.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={handleNav}>
            View History
          </button>
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
          <div className="card" style={{ marginTop: "24px" }}>
            <div className="progress-area">
              <div className="spinner" />
              <div className="badge badge-processing">Processing</div>
              <p className="progress-step">
                {progress?.step || "Initializing generation…"}
              </p>
              <p className="progress-msg">
                {progress?.message ||
                  "Setting up your video pipeline. This may take a few minutes."}
              </p>
            </div>
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div className="skeleton" style={{ height: "16px", width: "100%" }} />
              <div className="skeleton" style={{ height: "16px", width: "80%" }} />
              <div className="skeleton" style={{ height: "16px", width: "90%" }} />
            </div>
          </div>
        )}

        {videoUrl && !loading && (
          <div style={{ marginTop: "24px" }}>
            <VideoBox videoUrl={videoUrl} />
          </div>
        )}
      </div>

      <LinearFooter />
    </div>
  );
}

export default Tool;
