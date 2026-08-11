import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";

export default function MobileBottomNav() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

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

  // Fetch unread notification count (exclude chat message notifications)
  useEffect(() => {
    let mounted = true;
    const fetchCount = async () => {
      if (!currentUserId) return;
      try {
        const res = await notificationService.getUserNotifications(currentUserId);
        const rawList = res.data || [];
        const list = rawList.filter((n) => {
          const t = String(n.type || "").toUpperCase();
          const c = String(n.content || n.message || n.title || "").toLowerCase();
          if (t.includes("CHAT") || t.includes("MESSAGE") || t.includes("MSG") || t.includes("INBOX") || c.includes("tin nhắn")) return false;
          return true;
        });
        const unread = list.filter((n) => !n.read).length;
        if (mounted) setUnreadNotifCount(unread);
      } catch {
        // ignore
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, [currentUserId]);

  const navigate = useNavigate();

  const openNotifications = () => {
    // Navigate to notifications page on mobile
    if (navigate) navigate('/notifications');
    else window.dispatchEvent(new CustomEvent("open_notifications"));
  };

  return (
    <nav className={`mobile-bottom-nav ${hidden ? "scroll-hidden" : ""}`}>
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
        title="Trang chủ"
        aria-label="Trang chủ"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </NavLink>

      <NavLink
        to="/videos"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
        title="Video"
        aria-label="Video"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      </NavLink>

      <NavLink
        to="/friends"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
        title="Bạn bè"
        aria-label="Bạn bè"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </NavLink>

      <NavLink
        to="/dashboard"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
        title="Công cụ"
        aria-label="Công cụ"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </NavLink>

      {/* Notification Button */}
      <button
        className={`mobile-nav-item ${""}`}
        onClick={openNotifications}
        title="Thông báo"
        aria-label="Thông báo"
        style={{ background: "none", border: "none" }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadNotifCount > 0 && (
            <span style={{ position: "absolute", top: 6, right: 12, background: "var(--danger)", color: "white", fontSize: 10, fontWeight: "bold", borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
            </span>
          )}
        </div>
      </button>

      {/* Profile Link */}
      {currentUser ? (
        <NavLink
          to={`/profile/${currentUser.id || currentUser.userId}`}
          className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
          title="Hồ sơ"
          aria-label="Hồ sơ"
        >
          {currentUser.avatarUrl ? (
            <img src={currentUser.avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: 12 }}>
              {((currentUser.fullName || currentUser.username) ? (currentUser.fullName || currentUser.username).split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2) : "?")}
            </div>
          )}
        </NavLink>
      ) : (
        <NavLink to="/login" className="mobile-nav-item" title="Đăng nhập" aria-label="Đăng nhập">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        </NavLink>
      )}
    </nav>
  );
}
