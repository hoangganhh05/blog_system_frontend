import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import postService from "../services/postService";
import NotificationDrawer from "./NotificationDrawer";
import MobileMenuDrawer from "./MobileMenuDrawer";
import MobileSearchOverlay from "./MobileSearchOverlay";

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
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("blog_recent_searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const saveRecentSearch = (item) => {
    try {
      const saved = JSON.parse(localStorage.getItem("blog_recent_searches") || "[]");
      const filtered = saved.filter((i) => i.id !== item.id && i.text !== item.text);
      const updated = [item, ...filtered].slice(0, 8);
      localStorage.setItem("blog_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

  const removeRecentSearch = (id, e) => {
    e && e.stopPropagation();
    try {
      const updated = recentSearches.filter((i) => i.id !== id);
      localStorage.setItem("blog_recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {}
  };

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

  // Lắng nghe sự kiện cập nhật tổng số tin nhắn chưa đọc
  useEffect(() => {
    const handleUnreadUpdate = (e) => {
      if (typeof e.detail?.count === "number") {
        setUnreadChatCount(e.detail.count);
      }
    };
    window.addEventListener("unread_chat_count_updated", handleUnreadUpdate);
    return () => window.removeEventListener("unread_chat_count_updated", handleUnreadUpdate);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper tìm kiếm tiếng Việt không dấu
  const removeVietnameseTones = (str) => {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const matchesQuery = (text, query) => {
    if (!text || !query) return false;
    return removeVietnameseTones(text).includes(removeVietnameseTones(query.trim()));
  };

  // Filter kết quả tìm kiếm live thông minh
  const searchTerm = (searchValue || "").trim();
  const matchingUsers = searchTerm
    ? allUsers.filter(
        (u) => matchesQuery(u.fullName, searchTerm) || matchesQuery(u.username, searchTerm)
      ).slice(0, 5)
    : [];

  const matchingPosts = searchTerm
    ? allPosts.filter(
        (p) =>
          matchesQuery(p.title, searchTerm) ||
          matchesQuery(p.content, searchTerm) ||
          matchesQuery(p.category?.name, searchTerm)
      ).slice(0, 5)
    : [];

  const hasResults = matchingUsers.length > 0 || matchingPosts.length > 0;

  const handleExecuteSearch = (queryStr) => {
    const q = queryStr || searchValue;
    if (q && q.trim()) {
      setSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  // Auto-hide Navbar on scroll down (Facebook style)
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Track mobile viewport so we can hide desktop-only UI like the top notification bell
  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Chỉ tự động ẩn Navbar trên di động (<= 768px). Trên PC giữ cố định Navbar luôn hiển thị 100%.
      if (window.innerWidth > 768) {
        setNavHidden(false);
        return;
      }
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

  // Listen for global event from MobileBottomNav to open notifications drawer
  useEffect(() => {
    const handler = () => setNotifOpen(true);
    window.addEventListener("open_notifications", handler);
    return () => window.removeEventListener("open_notifications", handler);
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
            placeholder="Tìm kiếm từ khóa, tên, video..."
            value={searchValue || ""}
            onClick={() => setMobileSearchOpen(true)}
            onFocus={() => {
              setSearchFocused(true);
              setMobileSearchOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleExecuteSearch(searchValue);
              }
            }}
            onChange={(e) => {
              onSearchChange && onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
          />

          {/* Facebook Desktop Search Popup Panel */}
          {searchFocused && (
            <div
              style={{
                position: "absolute",
                top: -6,
                left: -8,
                width: 360,
                background: "var(--bg-card)",
                borderRadius: 16,
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.12)",
                border: "1px solid var(--border-light)",
                zIndex: 99999,
                overflow: "hidden",
                maxHeight: 520,
                overflowY: "auto",
                animation: "dropdownFadeIn 0.18s ease-out",
                boxSizing: "border-box",
              }}
            >
              {/* Header: Nút back arrow + Thanh gõ tìm kiếm */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border-light)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setSearchFocused(false)}
                  title="Đóng tìm kiếm"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "4px 8px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  ←
                </button>

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    background: "var(--bg-input)",
                    borderRadius: 20,
                    padding: "6px 12px",
                  }}
                >
                  <span style={{ fontSize: 14, opacity: 0.6, marginRight: 8 }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm trên BlogViet"
                    value={searchValue || ""}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchValue.trim()) {
                          saveRecentSearch({
                            id: `query_${Date.now()}`,
                            text: searchValue.trim(),
                            type: "query",
                          });
                          handleExecuteSearch(searchValue);
                        }
                      }
                    }}
                    onChange={(e) => {
                      onSearchChange && onSearchChange(e.target.value);
                    }}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--text-primary)",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  />
                </div>
              </div>

              {/* SECTION: MỚI ĐÂY (Recent Searches - Hiển thị khi chưa gõ hoặc gõ từ khóa) */}
              {!searchTerm && recentSearches.length > 0 && (
                <div style={{ padding: "8px 0" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 16px",
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Mới đây</span>
                    <span
                      onClick={() => {
                        localStorage.removeItem("blog_recent_searches");
                        setRecentSearches([]);
                      }}
                      style={{ fontSize: 13, color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}
                    >
                      Chỉnh sửa
                    </span>
                  </div>

                  {recentSearches.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.userId) {
                          navigate(`/profile/${item.userId}`);
                          setSearchFocused(false);
                        } else if (item.postId) {
                          navigate(`/posts/${item.postId}`);
                          setSearchFocused(false);
                        } else {
                          onSearchChange && onSearchChange(item.text);
                          handleExecuteSearch(item.text);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                        {item.avatarUrl ? (
                          <img src={item.avatarUrl} alt="" className="avatar avatar-sm" style={{ width: 36, height: 36, objectFit: "cover" }} />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "var(--bg-input)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              color: "var(--text-muted)",
                            }}
                          >
                            🕒
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.text}
                          </span>
                          {item.subtext && (
                            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{item.subtext}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(item.id, e)}
                        title="Gỡ khỏi nhật ký tìm kiếm"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: 16,
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: "50%",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SEARCH RESULTS MATCHING */}
              {searchTerm.length > 0 && (
                <>
                  {!hasResults ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                      Không tìm thấy kết quả phù hợp cho <strong>"{searchValue}"</strong>
                    </div>
                  ) : (
                    <>
                      {/* Người dùng */}
                      {matchingUsers.length > 0 && (
                        <div style={{ padding: "6px 0" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "6px 16px", textTransform: "uppercase" }}>
                            👥 Người dùng
                          </div>
                          {matchingUsers.map((u) => {
                            const name = u.fullName || u.username;
                            return (
                              <div
                                key={u.id}
                                onClick={() => {
                                  saveRecentSearch({
                                    id: `user_${u.id}`,
                                    text: name,
                                    userId: u.id,
                                    avatarUrl: u.avatarUrl,
                                    subtext: `@${u.username}`,
                                    type: "user",
                                  });
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
                                  <img src={u.avatarUrl} alt={name} className="avatar avatar-sm" style={{ width: 36, height: 36, objectFit: "cover" }} />
                                ) : (
                                  <div className="avatar avatar-sm" style={{ width: 36, height: 36, background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                                    {getInitials(name)}
                                  </div>
                                )}
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{name}</span>
                                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>@{u.username}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Bài viết */}
                      {matchingPosts.length > 0 && (
                        <div style={{ padding: "6px 0", borderTop: "1px solid var(--border-light)" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "6px 16px", textTransform: "uppercase" }}>
                            📝 Bài viết
                          </div>
                          {matchingPosts.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                saveRecentSearch({
                                  id: `post_${p.id}`,
                                  text: p.title || p.content?.slice(0, 30),
                                  postId: p.id,
                                  type: "post",
                                });
                                navigate(`/posts/${p.id}`);
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
                              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", fontSize: 16 }}>
                                📝
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p.title || p.content?.slice(0, 45)}
                                </span>
                                <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                                  Đăng bởi {p.user?.fullName || p.user?.username || "Ẩn danh"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Nút Xem tất cả kết quả ở dưới cùng */}
              {searchValue && (
                <div
                  onClick={() => {
                    saveRecentSearch({
                      id: `query_${Date.now()}`,
                      text: searchValue.trim(),
                      type: "query",
                    });
                    handleExecuteSearch(searchValue);
                  }}
                  style={{
                    padding: "12px 16px",
                    background: "var(--bg-hover)",
                    borderTop: "1px solid var(--border-light)",
                    color: "var(--primary)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span>Tìm kiếm "{searchValue}"</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Các Tab Chức Năng Chính (Giao diện icon thuần khiết chuẩn Facebook) */}
      <div className="navbar-center-tabs">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Trang chủ"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </NavLink>

        <NavLink
          to="/videos"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Video & Clips giải trí"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </NavLink>

        <NavLink
          to="/friends"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Bạn bè & Gợi ý kết bạn"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
          title="Quản lý công cụ & Phân tích chuyên nghiệp"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </NavLink>
      </div>

      {/* Right Actions */}
      <div className="navbar-right">
          {currentUser ? (
            <>
              {/* Notification Bell (hidden on mobile because MobileBottomNav handles notifications) */}
              {!isMobileView && (
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
              )}
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

      {/* Mobile Fullscreen Search Overlay Component */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />
    </nav>
  );
}

export default Navbar;
