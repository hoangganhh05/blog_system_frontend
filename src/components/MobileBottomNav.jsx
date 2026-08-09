import React, { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

export default function MobileBottomNav() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`mobile-bottom-nav ${hidden ? "scroll-hidden" : ""}`}>
      <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Trang chủ</span>
      </NavLink>

      <NavLink to="/trending" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>Xu hướng</span>
      </NavLink>

      <NavLink to="/radio" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
        </svg>
        <span>Radio</span>
      </NavLink>

      <NavLink to="/games" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 12h4m-2-2v4m10-2h.01m-3-1h.01"/>
        </svg>
        <span>Giải trí</span>
      </NavLink>

      <NavLink to="/ai-creator" className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v8m0 4v8M4.93 4.93l5.66 5.66m2.83 2.83l5.66 5.66M2 12h8m4 0h8M4.93 19.07l5.66-5.66m2.83-2.83l5.66-5.66"/>
        </svg>
        <span>AI Creator</span>
      </NavLink>
    </nav>
  );
}
