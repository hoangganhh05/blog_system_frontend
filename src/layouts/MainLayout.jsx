import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, PenSquare, ChevronDown, LogOut,
  Sun, Moon, Shield, User, Settings, Home,
  Compass, Bookmark, Users, BarChart2, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import CreatePostModal from "../components/CreatePostModal";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AMBER = "#E8650A";

export default function MainLayout({ children, isDark, onToggleTheme }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Poll notifications badge
  useEffect(() => {
    if (!currentUserId) return;
    const fetch = () =>
      notificationService.getUnreadCount()
        .then((r) => setUnreadNotifs(r.data?.unreadCount || 0))
        .catch(() => {});
    fetch();
    const t = setInterval(fetch, 45000);
    return () => clearInterval(t);
  }, [currentUserId]);

  // Close dropdowns on outside click
  useEffect(() => {
    const h = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target))
        setProfileMenuOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { to: "/",                         label: "Trang chủ",  icon: Home },
    { to: "/trending",                  label: "Khám phá",   icon: Compass },
    { to: "/friends",                   label: "Bạn bè",     icon: Users },
    { to: "/saved",                     label: "Đã lưu",     icon: Bookmark },
    { to: "/dashboard",                 label: "Công cụ",    icon: BarChart2 },
  ];

  return (
    <>
      {/* ======================================================================
          STICKY TOP HEADER
          ====================================================================== */}
      <header
        className="sticky top-0 z-50 h-16 w-full border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-[#181818]/95 backdrop-blur"
      >
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-4 gap-4">

          {/* LEFT: Logo + Desktop Nav */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-sm"
                style={{ backgroundColor: AMBER }}
              >
                B
              </div>
              <span className="font-extrabold text-lg tracking-tight text-stone-900 dark:text-stone-100 hidden sm:inline">
                Blog<span style={{ color: AMBER }}>Viet</span>
              </span>
            </Link>

            {/* Desktop Nav tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      active
                        ? "font-semibold bg-stone-100 dark:bg-stone-800"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                    style={active ? { color: AMBER } : {}}
                  >
                    <Icon strokeWidth={active ? 2.2 : 1.75} className="w-4 h-4" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* CENTER: Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full py-2 pl-9 pr-4 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 transition"
                style={{ "--tw-ring-color": AMBER + "55" }}
              />
            </div>
          </form>

          {/* RIGHT: Write + Notif + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Write button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold transition active:scale-95 shadow-sm"
              style={{ backgroundColor: AMBER }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#c8540a"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = AMBER}
            >
              <PenSquare strokeWidth={2} className="w-4 h-4" />
              <span>Viết bài</span>
            </button>

            {/* Notifications */}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative p-2 rounded-full transition ${
                  isActive
                    ? "bg-stone-100 dark:bg-stone-800"
                    : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`
              }
              style={({ isActive }) => isActive ? { color: AMBER } : {}}
              title="Thông báo"
            >
              <Bell strokeWidth={1.8} className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] px-1 border-2 border-white dark:border-[#181818] text-center">
                  {unreadNotifs > 99 ? "99+" : unreadNotifs}
                </span>
              )}
            </NavLink>

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover ring-2"
                    style={{ "--tw-ring-color": AMBER + "50" }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: currentUser?.avatarColor || AMBER }}
                  >
                    {getInitials(currentUser?.fullName || currentUser?.username)}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 hidden sm:inline" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-12 w-60 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {/* User info */}
                  <Link
                    to={`/profile/${currentUserId}`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: currentUser?.avatarColor || AMBER }}>
                        {getInitials(currentUser?.fullName || currentUser?.username)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {currentUser?.fullName || currentUser?.username}
                      </span>
                      <span className="text-xs text-stone-500 truncate">@{currentUser?.username}</span>
                    </div>
                  </Link>

                  <div className="h-px bg-stone-100 dark:bg-stone-800 my-1" />

                  <Link
                    to={`/profile/${currentUserId}`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <User className="w-4 h-4" /> Hồ sơ cá nhân
                  </Link>

                  <Link
                    to="/security"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    <Settings className="w-4 h-4" /> Cài đặt & Bảo mật
                  </Link>

                  <button
                    onClick={() => { onToggleTheme?.(); setProfileMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition w-full text-left"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-500" />}
                    {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
                  </button>

                  <div className="h-px bg-stone-100 dark:bg-stone-800 my-1" />

                  <button
                    onClick={() => { logout(); navigate("/login"); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-2 rounded-full text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-2 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {navLinks.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? "bg-stone-100 dark:bg-stone-800 font-semibold"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`
                      }
                    >
                      <Icon strokeWidth={1.75} className="w-4 h-4" /> {label}
                    </NavLink>
                  ))}
                  <div className="h-px bg-stone-100 dark:bg-stone-800 my-1" />
                  <button
                    onClick={() => { setMobileMenuOpen(false); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white transition w-full text-left"
                    style={{ backgroundColor: AMBER }}
                  >
                    <PenSquare className="w-4 h-4" /> Viết bài mới
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================================
          MAIN CONTENT — centered single column
          ====================================================================== */}
      <main className="w-full max-w-2xl mx-auto px-4 py-6 min-h-screen">
        {children}
      </main>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          setIsCreateModalOpen(false);
          window.dispatchEvent(new CustomEvent("refresh_feed_posts"));
        }}
      />
    </>
  );
}
