import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import postService from "../services/postService";
import NotificationDrawer from "./NotificationDrawer";
import MobileMenuDrawer from "./MobileMenuDrawer";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Navbar({ onToggleTheme, isDark, onSearchChange, searchValue }) {
  const { currentUser, logout } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleUnreadChatCount = (e) => {
      setUnreadChatCount(e.detail?.count || 0);
    };
    window.addEventListener("unread_chat_count_changed", handleUnreadChatCount);
    return () => window.removeEventListener("unread_chat_count_changed", handleUnreadChatCount);
  }, []);

  // States cho Live Search Autocomplete
  const [searchFocused, setSearchFocused] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);

  // States cho Color Picker
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef(null);

  const ACCENT_COLORS = [
    { name: "Sapphire Indigo (Signature)", color: "#4f46e5" },
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
    setColorPickerOpen(false);
  };

  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  // Lấy dữ liệu người dùng & bài viết phục vụ gợi ý tìm kiếm
  useEffect(() => {
    userService.getAll().then((res) => setAllUsers(res.data || [])).catch(() => {});
    postService.getAll(0, 50).then((res) => setAllPosts(res.data.content || [])).catch(() => {});
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setColorPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset menu khi chuyển trang
  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
    setSearchFocused(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter kết quả tìm kiếm live
  const searchTerm = (searchValue || "").trim().toLowerCase();
  const matchingUsers = searchTerm
    ? allUsers.filter(
        (u) => (u.fullName || u.username).toLowerCase().includes(searchTerm)
      ).slice(0, 5)
    : [];

  const matchingPosts = searchTerm
    ? allPosts.filter(
        (p) => (p.title || "").toLowerCase().includes(searchTerm) || (p.content || "").toLowerCase().includes(searchTerm)
      ).slice(0, 5)
    : [];

  const hasResults = matchingUsers.length > 0 || matchingPosts.length > 0;

  // Auto-hide Navbar on scroll down (Facebook style)
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setNavHidden(true);
      } else {
        setNavHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${navHidden ? "scroll-hidden" : ""}`}>
      {/* Left Section: Logo + Search Bar */}
      <div className="navbar-left">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/>
              <path d="M6 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3z"/>
              <line x1="6" y1="12" x2="18" y2="12"/>
            </svg>
          </div>
          <span>BlogViet</span>
        </Link>

        {/* Live Search Bar ở bên trái */}
        <div className="navbar-search" ref={searchRef} style={{ position: "relative" }}>
          <span className="navbar-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchValue || ""}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              onSearchChange && onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
          />

          {/* Autocomplete Dropdown Menu */}
          {searchFocused && searchTerm.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                width: 320,
                background: "var(--bg-card)",
                borderRadius: 16,
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1)",
                border: "1px solid var(--border-light)",
                zIndex: 9999,
                overflow: "hidden",
                maxHeight: 420,
                overflowY: "auto",
                animation: "dropdownFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              {!hasResults ? (
                <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  Không tìm thấy kết quả phù hợp cho <strong>"{searchValue}"</strong>
                </div>
              ) : (
                <>
                  {/* Người dùng */}
                  {matchingUsers.length > 0 && (
                    <div style={{ borderBottom: "1px solid var(--border-light)", padding: "8px 0" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", padding: "6px 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        👥 Người dùng ({matchingUsers.length})
                      </div>
                      {matchingUsers.map((u) => {
                        const name = u.fullName || u.username;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              navigate(`/profile/${u.id}`);
                              setSearchFocused(false);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "8px 16px",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={name} className="avatar avatar-sm" style={{ objectFit: "cover" }} />
                            ) : (
                              <div className="avatar avatar-sm" style={{ background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                                {getInitials(name)}
                              </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>@{u.username}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bài viết */}
                  {matchingPosts.length > 0 && (
                    <div style={{ padding: "8px 0" }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", padding: "6px 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        📝 Bài viết ({matchingPosts.length})
                      </div>
                      {matchingPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            navigate(`/posts/${p.id}`);
                            setSearchFocused(false);
                          }}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            padding: "8px 16px",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p.title || p.content?.slice(0, 45)}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--primary)" }}>
                            Đăng bởi {p.user?.fullName || p.user?.username || "Ẩn danh"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Các Tab Chức Năng Chính (Giao diện chuẩn Facebook) */}
      <div className="navbar-center-tabs">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Trang chủ"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="nav-tab-label">Trang chủ</span>
        </NavLink>

        <NavLink
          to="/trending"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Bảng Xu Hướng & Top Tác Giả"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="nav-tab-label">Xu hướng</span>
        </NavLink>

        <NavLink
          to="/radio"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="BlogViet Radio - Chill Lounge"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          <span className="nav-tab-label">Radio</span>
        </NavLink>

        <NavLink
          to="/games"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Góc Giải Trí Mini Games"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M6 12h4m-2-2v4m10-2h.01m-3-1h.01"/>
          </svg>
          <span className="nav-tab-label">Giải trí</span>
        </NavLink>

        <NavLink
          to="/ai-creator"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Studio Sáng Tạo Nghệ Thuật & Nội Dung"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v8m0 4v8M4.93 4.93l5.66 5.66m2.83 2.83l5.66 5.66M2 12h8m4 0h8M4.93 19.07l5.66-5.66m2.83-2.83l5.66-5.66"/>
          </svg>
          <span className="nav-tab-label">Sáng tạo</span>
        </NavLink>
      </div>

      {/* Right Actions */}
      <div className="navbar-right">
          {currentUser ? (
            <>
              {/* Notification Bell */}
              <div style={{ position: "relative" }} ref={notifRef}>
                <button
                  className="navbar-icon-btn"
                  onClick={() => setNotifOpen((v) => !v)}
                  title="Thông báo"
                  style={{ position: "relative" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      background: "var(--danger)",
                      color: "white",
                      fontSize: 10,
                      fontWeight: "bold",
                      borderRadius: "50%",
                      minWidth: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Drawer Component */}
                <NotificationDrawer
                  currentUser={currentUser}
                  isOpen={notifOpen}
                  onClose={() => setNotifOpen(false)}
                  onUnreadCountChange={setUnreadCount}
                />
              </div>
            </>
          ) : (
            <div className="navbar-auth-btns" style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Link to="/login">
                <button className="btn btn-secondary btn-sm" style={{ padding: "5px 10px", fontSize: 12 }}>Đăng nhập</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm" style={{ padding: "5px 10px", fontSize: 12 }}>Đăng ký</button>
              </Link>
            </div>
          )}

          {/* Messenger Chat Button */}
          <button
            className="navbar-icon-btn mobile-chat-btn"
            onClick={() => window.dispatchEvent(new CustomEvent("toggle_chat_widget"))}
            title="Tin nhắn Messenger"
            style={{ position: "relative" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            {unreadChatCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  background: "var(--danger)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: "bold",
                  borderRadius: "50%",
                  minWidth: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {unreadChatCount > 9 ? "9+" : unreadChatCount}
              </span>
            )}
          </button>

          {/* Mobile Search Magnifying Glass 🔍 Button */}
          <button
            className="navbar-icon-btn mobile-search-btn"
            onClick={() => setMobileSearchOpen((v) => !v)}
            title="Tìm kiếm bài viết, người dùng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          {/* Hamburger Menu ☰ Button for Mobile */}
          <button
            className="navbar-icon-btn mobile-menu-trigger"
            onClick={(e) => {
              e.stopPropagation();
              setMobileDrawerOpen(true);
            }}
            title="Menu chức năng"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

      {/* Mobile Live Search Bar Overlay */}
      {mobileSearchOpen && (
        <div
          className="mobile-search-overlay"
          style={{
            position: "fixed",
            top: 56,
            left: 0,
            right: 0,
            background: "var(--bg-card)",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border-light)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            animation: "slideDown 0.15s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-input)", borderRadius: 20, padding: "6px 14px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              autoFocus
              placeholder="Nhập tên người dùng hoặc bài viết..."
              value={searchValue || ""}
              onChange={(e) => {
                onSearchChange && onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 15,
                color: "var(--text-primary)",
              }}
            />
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchFocused(false);
              }}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 16, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          {/* Autocomplete Results cho Mobile */}
          {searchTerm.length > 0 && (
            <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {!hasResults ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  Không tìm thấy kết quả phù hợp cho "{searchValue}"
                </div>
              ) : (
                <>
                  {matchingUsers.map((u) => {
                    const name = u.fullName || u.username;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          navigate(`/profile/${u.id}`);
                          setMobileSearchOpen(false);
                          setSearchFocused(false);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--border-light)" }}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={name} className="avatar avatar-sm" style={{ objectFit: "cover" }} />
                        ) : (
                          <div className="avatar avatar-sm" style={{ background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                            {getInitials(name)}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{name}</span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username}</span>
                        </div>
                      </div>
                    );
                  })}
                  {matchingPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        navigate(`/posts/${p.id}`);
                        setMobileSearchOpen(false);
                        setSearchFocused(false);
                      }}
                      style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid var(--border-light)" }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)" }}>📝 {p.title || "Bài viết"}</span>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Bởi @{p.user?.username || "Ẩn danh"}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer Menu ☰ Component */}
      <MobileMenuDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      />
    </nav>
  );
}

export default Navbar;
