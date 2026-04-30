import React from "react";
import Logo from "../../../components/Logo";
import { RiMenu3Fill } from "react-icons/ri";

function ToolHeader({ open, handleNav }) {
  return (
    <div className="tool-header">
      <div className="tool-header-left">
        <button
          className={`menu-icon ${open ? "hide" : ""}`}
          onClick={handleNav}
          aria-label="Open history"
        >
          <RiMenu3Fill />
        </button>
      </div>
      <Logo />
    </div>
  );
}

export default ToolHeader;
