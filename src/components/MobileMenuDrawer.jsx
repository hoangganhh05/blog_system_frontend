import React from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function MobileMenuDrawer({ isOpen, onClose, isDark, onToggleTheme }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  const ACCENT_COLORS = [
    { name: "Sapphire Indigo", color: "#4f46e5" },
    { name: "Cyber Cyan", color: "#0284c7" },
    { name: "Neon Violet", color: "#7c3aed" },
    { name: "Emerald Mint", color: "#059669" },
    { name: "Ruby Coral", color: "#e11d48" },
  ];

  const handleSelectAccentColor = (color) => {
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--primary-light", `${color}1a`);
    document.documentElement.style.setProperty("--primary-hover", `${color}dd`);
    document.documentElement.style.setProperty("--text-link", color);
    localStorage.setItem("blog_accent_color", color);
  };

  return createPortal(
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
            Menu Chức Năng
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="mobile-drawer-body">
          {/* User Profile Banner if logged in */}
          {currentUser ? (
            <Link
              to={`/profile/${currentUser.id}`}
              onClick={onClose}
              className="mobile-menu-profile-card"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName || currentUser.username}
                  className="avatar avatar-md"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div
                  className="avatar avatar-md"
                  style={{
                    background: currentUser.avatarColor
                      ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)`
                      : undefined
                  }}
                >
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.fullName || currentUser.username}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Xem trang cá nhân của bạn
                </div>
              </div>
            </Link>
          ) : (
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <Link to="/login" onClick={onClose} style={{ flex: 1 }}>
                <button className="btn btn-secondary btn-full">Đăng nhập</button>
              </Link>
              <Link to="/register" onClick={onClose} style={{ flex: 1 }}>
                <button className="btn btn-primary btn-full">Đăng ký</button>
              </Link>
            </div>
          )}

          {/* Lối Tắt Tất Cả Chức Năng (Grid Style Facebook) */}
          <div className="mobile-menu-grid">
            <Link to="/" onClick={onClose} className="mobile-menu-tile">
              <div className="mobile-menu-tile-icon" style={{ background: "rgba(79,70,229,0.12)", color: "#4f46e5" }}>🏠</div>
              <span>Trang chủ</span>
            </Link>

            <Link to="/videos" onClick={onClose} className="mobile-menu-tile">
              <div className="mobile-menu-tile-icon" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>🎥</div>
              <span>Video Clips</span>
            </Link>

            <Link to="/games" onClick={onClose} className="mobile-menu-tile">
              <div className="mobile-menu-tile-icon" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>🎮</div>
              <span>Giải trí</span>
            </Link>

            {currentUser && (
              <>
                <Link to="/saved" onClick={onClose} className="mobile-menu-tile">
                  <div className="mobile-menu-tile-icon" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>🔖</div>
                  <span>Bài đã lưu</span>
                </Link>

                <Link to={`/profile/${currentUser.id}?tab=security`} onClick={onClose} className="mobile-menu-tile">
                  <div className="mobile-menu-tile-icon" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>🔒</div>
                  <span>Bảo mật</span>
                </Link>

                <Link to="/dashboard" onClick={onClose} className="mobile-menu-tile">
                  <div className="mobile-menu-tile-icon" style={{ background: "rgba(107,114,128,0.12)", color: "#6b7280" }}>⚙️</div>
                  <span>Dashboard</span>
                </Link>
              </>
            )}
          </div>

          {/* Cài Đặt Giao Diện & Màu Sắc */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>
              Cài đặt & Giao diện
            </div>

            {/* Cài đặt bảo mật */}
            {currentUser && (
              <div
                onClick={() => {
                  onClose();
                  navigate("/security");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  background: "var(--bg-input)",
                  borderRadius: 14,
                  cursor: "pointer",
                  marginBottom: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14 }}>
                  <span>🔒</span>
                  <span>Cài đặt bảo mật</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>Mở</span>
              </div>
            )}

            {/* Toggle Theme */}
            <div
              onClick={onToggleTheme}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                background: "var(--bg-input)",
                borderRadius: 14,
                cursor: "pointer",
                marginBottom: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14 }}>
                <span>{isDark ? "🌙" : "☀️"}</span>
                <span>Chế độ {isDark ? "Tối" : "Sáng"}</span>
              </div>
              <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700 }}>Đổi</span>
            </div>

            {/* Color Accent Picker */}
            <div style={{ padding: "12px 14px", background: "var(--bg-input)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Màu chủ đề ứng dụng:</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
                {ACCENT_COLORS.map((c) => (
                  <div
                    key={c.color}
                    onClick={() => handleSelectAccentColor(c.color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: c.color,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Đăng xuất */}
            {currentUser && (
              <button
                onClick={handleLogout}
                className="btn btn-danger btn-full"
                style={{ marginTop: 16, borderRadius: 14, padding: "12px 0", fontWeight: 700 }}
              >
                🚪 Đăng xuất tài khoản
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
