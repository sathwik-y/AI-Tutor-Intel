import React from "react";

export default function AnimatedIconButton({ icon, label, onClick, color = "#212121", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: color, opacity: disabled ? 0.6 : 1 }}
      className="animated-icon-btn"
    >
      <div className="svg-wrapper-1">
        <div className="svg-wrapper">
          {icon}
        </div>
      </div>
      <span>{label}</span>
    </button>
  );
} 