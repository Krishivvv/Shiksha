import React, { useState, useEffect } from "react";
import ToolNav from "./components/ToolNav";
import PromptBox from "./components/PromptBox";
import VideoBox from "./components/VideoBox";
import Nav from "../Home/components/Nav"; // We can reuse the main Nav for top
import Footer from "../../components/Footer";

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
    <div className="tool-layout">
      <Nav />
      <ToolNav open={open} handleNav={handleNav} history={history} />
      <div className="tool-container fade-in">
        <div className="tool-header-area" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div>
            <h2>Generate an <span style={{color: 'var(--accent)'}}>educational video</span></h2>
            <p>Describe any topic and GyanAI will build an animated lesson with voiceover.</p>
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
          <div className="card" style={{marginTop: '24px'}}>
            <div className="progress-area">
              <div className="spinner" />
              <div className="badge badge-processing">Processing</div>
              <p className="progress-step">
                {progress?.step || "Initializing generation…"}
              </p>
              <p className="progress-msg">
                {progress?.message || "Setting up your video pipeline. This may take a few minutes."}
              </p>
            </div>
            {/* Skeletons to show it's working */}
            <div style={{marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
               <div className="skeleton" style={{height: '16px', width: '100%'}}></div>
               <div className="skeleton" style={{height: '16px', width: '80%'}}></div>
               <div className="skeleton" style={{height: '16px', width: '90%'}}></div>
            </div>
          </div>
        )}

        {videoUrl && !loading && (
          <div style={{marginTop: '24px'}}>
            <VideoBox videoUrl={videoUrl} />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default Tool;
