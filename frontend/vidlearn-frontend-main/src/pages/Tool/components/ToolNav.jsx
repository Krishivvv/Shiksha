import React from "react";
import { useNavigate } from "react-router-dom";
import ToolVideo from "./ToolVideo";
import { MdOutlineClose } from "react-icons/md";
import { RiLogoutBoxLine } from "react-icons/ri";

const API = import.meta.env.VITE_API_URL;

function ToolNav({ open, handleNav, history }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${API}/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  return (
    <div className={`tool-nav ${open ? "active" : ""}`}>
      <div className="tool-nav-top">
        <span className="tool-nav-title">Past Generations</span>
        <button className="icon-btn" onClick={handleNav} aria-label="Close">
          <MdOutlineClose />
        </button>
      </div>

      <div className="vid-gallery">
        {history.length === 0 && (
          <p className="history-empty">No videos generated yet.</p>
        )}
        {history.map((item) => (
          <ToolVideo key={item.filename} vid={item.url} prompt={item.prompt_text} />
        ))}
      </div>

      <button className="logout-btn" onClick={handleLogout}>
        <RiLogoutBoxLine />
        Log Out
      </button>
    </div>
  );
}

export default ToolNav;
