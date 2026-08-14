import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, Plus, ChevronDown, LogOut,
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
    <div className="w-full min-h-screen bg-[#F0F2F5] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* ======================================================================
          STICKY TOP HEADER (h-14, Max-w-5xl, Crisp border-b)
          ====================================================================== */}
      <header className="sticky top-0 z-50 h-14 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shrink-0">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between px-4 gap-4">

          {/* LEFT: Minimalist Logo + Nav Links */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center font-black text-white dark:text-black text-sm tracking-tighter">
                BV
              </div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100 hidden sm:inline">
                BlogViet
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      active
                        ? "text-black dark:text-white bg-zinc-100 dark:bg-zinc-800"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <Icon strokeWidth={active ? 2.2 : 1.75} className="w-4 h-4" />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* CENTER: Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs hidden sm:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-full py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition"
              />
            </div>
          </form>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Create Post Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black text-xs font-semibold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus strokeWidth={2.5} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng bài</span>
            </button>

            {/* Notifications */}
            <NavLink
              to="/notifications"
              className={({ isActive }) =>
                `relative p-2 rounded-full transition ${
                  isActive
                    ? "text-black dark:text-white bg-zinc-100 dark:bg-zinc-800"
                    : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`
              }
              title="Thông báo"
            >
              <Bell strokeWidth={1.8} className="w-4 h-4" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
              )}
            </NavLink>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-1 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                    style={{ backgroundColor: currentUser?.avatarColor || "#27272a" }}
                  >
                    {getInitials(currentUser?.fullName || currentUser?.username)}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:inline" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {/* User Profile header */}
                  <Link
                    to={`/profile/${currentUserId}`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  >
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                        style={{ backgroundColor: currentUser?.avatarColor || "#27272a" }}
                      >
                        {getInitials(currentUser?.fullName || currentUser?.username)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser?.fullName || currentUser?.username}
                      </span>
                      <span className="text-[11px] text-zinc-500 truncate">@{currentUser?.username}</span>
                    </div>
                  </Link>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                  <Link
                    to={`/profile/${currentUserId}`}
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <User className="w-4 h-4 text-zinc-500" /> Hồ sơ cá nhân
                  </Link>

                  <Link
                    to="/security"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    <Settings className="w-4 h-4 text-zinc-500" /> Cài đặt & Bảo mật
                  </Link>

                  <button
                    type="button"
                    onClick={() => { onToggleTheme?.(); setProfileMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left cursor-pointer"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-500" />}
                    {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
                  </button>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                  <button
                    type="button"
                    onClick={() => { logout(); navigate("/login"); }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition w-full text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger */}
            <div className="relative md:hidden" ref={mobileMenuRef}>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {mobileMenuOpen && (
                <div className="absolute right-0 top-10 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {navLinks.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          isActive
                            ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`
                      }
                    >
                      <Icon strokeWidth={1.75} className="w-4 h-4" /> {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================================
          MAIN CONTENT CONTAINER (Centered max-w-[640px] with balanced spacing)
          ====================================================================== */}
      <main className="w-full max-w-[640px] mx-auto py-5 px-3 flex-1 flex flex-col gap-4">
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
    </div>
  );
}
