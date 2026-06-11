import React, { useState, useEffect, useRef } from "react";
import ToolNav from "./components/ToolNav";
import PromptBox from "./components/PromptBox";
import VideoBox from "./components/VideoBox";
import GenerationPipeline from "./components/GenerationPipeline";
import QuizPanel from "./components/QuizPanel";
import LinearNav from "../Home/components/LinearNav";
import LinearFooter from "../Home/components/LinearFooter";
import ConfettiBurst from "../../components/ConfettiBurst";
import { useToast } from "../../components/Toast";
import { API, apiFetch } from "../../api";
import "./Tool.css";

function Tool() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [history, setHistory] = useState([]);
  const [timeValue, setTimeValue] = useState(1);
  const [progress, setProgress] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Quiz state — script comes back in the completed task payload
  const [script, setScript] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  // Refs for the active task being polled
  const taskIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const videoIdRef = useRef(null);

  // ── Auth guard + fetch history on mount ────────────────────────────────
  useEffect(() => {
    apiFetch("/history")
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
            url: `${API}/download-video?filename=${encodeURIComponent(v.filename)}`,
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
        const res = await apiFetch(`/task-status/${taskId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProgress(data);

        if (data.state === "completed") {
          // Generation finished — extract filename and build URL
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;

          const filename = data.filename;
          if (filename) {
            const url = `${API}/download-video?filename=${encodeURIComponent(filename)}`;
            setVideoUrl(url);
            setHistory((prev) => [
              { filename, url, prompt_text: prompt, status: "completed" },
              ...prev,
            ]);
          }
          if (data.script) setScript(data.script);
          setLoading(false);
          setCelebrate(true);
          window.setTimeout(() => setCelebrate(false), 4500);
          toast.success("Your lesson is ready — video, notes, and quiz await.");
        } else if (data.state === "failed") {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          const msg = data.message || "Video generation failed.";
          const display = msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")
            ? "API quota exceeded. The team needs to refresh the Gemini API key."
            : msg.length > 200 ? "Generation failed. Check backend logs." : msg;
          toast.error(display, 7000);
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
      const res = await apiFetch("/upload-pdf", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        setFile(f);
        toast.info(`Attached ${f.name}`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Network error uploading file");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return toast.error("Please enter a prompt first.");

    setLoading(true);
    setVideoUrl("");
    setProgress(null);
    setScript(null);
    setQuiz(null);

    const form = new FormData();
    const refined_prompt = `${prompt}. minimum duration of video: ${timeValue} minutes`;
    form.append("prompt", refined_prompt);
    if (file) form.append("attachment", file);

    try {
      const res = await apiFetch("/generate-video", {
        method: "POST",
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
        if (data.video_id) {
          setVideoId(data.video_id);
          videoIdRef.current = data.video_id;
        }
        if (taskId) {
          startPolling(taskId);
        } else {
          // Fallback for old API shape: { success, filename }
          if (data.filename) {
            const url = `${API}/download-video?filename=${encodeURIComponent(data.filename)}`;
            setVideoUrl(url);
            setHistory((prev) => [
              { filename: data.filename, url, prompt_text: refined_prompt, status: "completed" },
              ...prev,
            ]);
          }
          setLoading(false);
        }
      } else {
        toast.error(data.error || "Generation failed");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error — please try again.");
      setLoading(false);
    }
  };

  // ── Quiz generation (uses the script captured from the completed task) ──
  const handleGenerateQuiz = async () => {
    if (!script) {
      toast.error("No script available yet — generate a video first.");
      return;
    }
    setQuizLoading(true);
    try {
      const res = await apiFetch("/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script, video_id: videoId || videoIdRef.current }),
      });
      const data = await res.json();
      if (res.ok && data.quiz && data.quiz.length) {
        setQuiz(data.quiz);
        toast.success(`Quiz ready — ${data.quiz.length} questions.`);
      } else {
        toast.error(data.error || "Quiz generation failed. Try again in a moment.");
      }
    } catch {
      toast.error("Network error generating quiz.");
    } finally {
      setQuizLoading(false);
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
      {celebrate && <ConfettiBurst />}
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
              <span className="gradient-text">educational video</span>
            </h2>
            <p>
              Describe any topic and Shishka AI will build an animated lesson with
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

        {loading && <GenerationPipeline progress={progress} />}

        {videoUrl && !loading && (
          <div style={{ marginTop: "24px" }} className="quiz-card">
            <VideoBox
              videoUrl={videoUrl}
              onGenerateQuiz={script ? handleGenerateQuiz : null}
              quizLoading={quizLoading}
              quizReady={Boolean(quiz)}
            />
          </div>
        )}

        {quiz && !loading && (
          <QuizPanel questions={quiz} onClose={() => setQuiz(null)} />
        )}
      </div>

      <LinearFooter />
    </div>
  );
}

export default Tool;
