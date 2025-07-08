import React from "react";

/**
 * AnimatedIconButton
 * Props:
 * - icon: JSX.Element (icon to display)
 * - label: string (button label)
 * - onClick: function (click handler)
 * - color: string (optional, background color)
 * - disabled: boolean (optional)
 */
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

// Add styles for the button (can be moved to a CSS/SCSS file)
// Place this in your global CSS or import as needed
//
// .animated-icon-btn {
//   font-family: inherit;
//   font-size: 20px;
//   background: #212121;
//   color: white;
//   fill: rgb(155, 153, 153);
//   padding: 0.7em 1em;
//   padding-left: 0.9em;
//   display: flex;
//   align-items: center;
//   cursor: pointer;
//   border: none;
//   border-radius: 15px;
//   font-weight: 1000;
// }
// .animated-icon-btn span {
//   display: block;
//   margin-left: 0.3em;
//   transition: all 0.3s ease-in-out;
// }
// .animated-icon-btn svg {
//   display: block;
//   transform-origin: center center;
//   transition: transform 0.3s ease-in-out;
// }
// .animated-icon-btn:hover {
//   background: #000;
// }
// .animated-icon-btn:hover .svg-wrapper {
//   transform: scale(1.25);
//   transition: 0.5s linear;
// }
// .animated-icon-btn:hover svg {
//   transform: translateX(1.2em) scale(1.1);
//   fill: #fff;
// }
// .animated-icon-btn:hover span {
//   opacity: 0;
//   transition: 0.5s linear;
// }
// .animated-icon-btn:active {
//   transform: scale(0.95);
// } 