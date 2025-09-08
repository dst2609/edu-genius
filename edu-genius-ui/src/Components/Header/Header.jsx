import React from "react";
import "./header.css";

export default function Header() {
  return (
    <header className="eg-header">
      <div className="eg-header__inner">
        {/* Brand / Title */}
        <div className="eg-brand">
          <span className="eg-title">EduGenius</span>
          <span className="eg-subtitle">AI-Powered Personalized Learning Assistant</span>
        </div>

        {/* Right side text or actions */}
        <nav className="eg-actions">
          <span className="eg-tagline">Welcome to Smart Learning 🚀</span>
        </nav>
      </div>
    </header>
  );
}
