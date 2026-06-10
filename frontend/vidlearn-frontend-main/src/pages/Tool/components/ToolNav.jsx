import React from "react";
import { useNavigate } from "react-router-dom";
import ToolVideo from "./ToolVideo";
import { MdOutlineClose } from "react-icons/md";
import { RiLogoutBoxLine } from "react-icons/ri";
import { apiFetch } from "../../../api";

function ToolNav({ open, handleNav, history }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // ignore network errors; navigate to login regardless
    }
    navigate("/login");
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: open ? 0 : '-300px',
        width: '300px',
        height: '100vh',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        zIndex: 1000,
        transition: 'left var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: open ? 'var(--shadow-elevated)' : 'none',
        padding: '24px'
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <span style={{fontWeight: 600, color: 'var(--text-primary)'}}>Past Generations</span>
        <button onClick={handleNav} style={{background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px'}}>
          <MdOutlineClose />
        </button>
      </div>

      <div style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
        {history.length === 0 && (
          <p style={{color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', marginTop: '40px'}}>No videos generated yet.</p>
        )}
        {history.map((item) => (
          <ToolVideo key={item.filename} vid={item.url} prompt={item.prompt_text} />
        ))}
      </div>

      <button className="btn btn-secondary" onClick={handleLogout} style={{width: '100%'}}>
        <RiLogoutBoxLine />
        Log Out
      </button>
    </div>
  );
}

export default ToolNav;
