import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, Plus, ChevronDown, LogOut,
  Sun, Moon, Shield, User, Settings, Home,
  Compass, Bookmark, Users, BarChart2, X, Sparkles, Hash, ArrowUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import CreatePostModal from "../components/CreatePostModal";
import AiAssistantModal from "../components/AiAssistantModal";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import MiniMusicPlayer from "../components/MiniMusicPlayer";
import MobileNavDrawer from "../components/MobileNavDrawer";
import Logo from "../components/Logo";

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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
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

  // Scroll to Top Listener (Handles both independent main column and window scroll)
  const mainRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleMainScroll = (e) => {
    const top = e?.target?.scrollTop ?? 0;
    setShowScrollTop(top > 350 || window.scrollY > 350);
  };

  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollTop((window.scrollY || mainRef.current?.scrollTop || 0) > 350);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
    <div className="w-full h-screen max-h-screen bg-[#f0f2f5] dark:bg-[#18191a] text-[#050505] dark:text-[#e4e6eb] flex flex-col overflow-hidden transition-colors duration-200">
      {/* ======================================================================
          STICKY TOP HEADER (h-14, Full-width Fluid Navbar, Crisp border-b)
          ====================================================================== */}
      <header className="w-full h-14 shrink-0 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-b border-[#e4e6eb] dark:border-[#393a3b] sticky top-0 z-50">
        <div className="w-full h-14 px-4 sm:px-6 md:px-8 lg:px-12 flex items-center justify-between gap-4">

          {/* LEFT: Minimalist Logo + Nav Links */}
          <div className="flex items-center gap-6 shrink-0">
            <Logo size="md" withText={true} />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      active
                        ? "text-[#0866ff] bg-[#0866ff]/10 dark:bg-[#0866ff]/20"
                        : "text-[#65676b] hover:text-[#050505] dark:text-[#b0b3b8] dark:hover:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#303031]"
                    }`}
                  >
                    <Icon strokeWidth={active ? 2.4 : 1.75} className="w-4 h-4" />
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
                className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-transparent focus:border-[#0866ff] rounded-full py-1.5 pl-8 pr-3 text-xs text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] focus:outline-none transition"
              />
            </div>
          </form>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Create Post Button */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Plus strokeWidth={2.5} className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng bài</span>
            </button>

            {/* Trợ lý AI Gemini */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="p-2 rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
              title="Trợ lý AI Gemini"
            >
              <Sparkles strokeWidth={2} className="w-4 h-4" />
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
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Mở menu đầy đủ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Full Feature Synchronized Mobile Nav Drawer */}
        <MobileNavDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          isDark={isDark}
          onToggleTheme={onToggleTheme}
        />
      </header>

      {/* ======================================================================
          3-COLUMN INDEPENDENT SCROLLABLE SOCIAL LAYOUT
          (Left Sidebar | Main Feed Center | Right Sidebar)
          ====================================================================== */}
      <div className="w-full flex-1 min-h-0 h-[calc(100vh-3.5rem)] max-w-7xl mx-auto px-1.5 sm:px-4 md:px-6 flex justify-center items-stretch gap-4 lg:gap-6 overflow-hidden">
        {/* LEFT COLUMN: Shortcuts & Profile Sidebar (Independent Scrollable Column) */}
        <aside className="hidden xl:block w-64 xl:w-72 shrink-0 min-h-0 h-full max-h-full overflow-y-auto custom-scrollbar pt-4 pb-20 select-none">
          <LeftSidebar />
        </aside>

        {/* CENTER COLUMN: Main Content Feed (Independent Scrollable Center Column) */}
        <main
          ref={mainRef}
          onScroll={handleMainScroll}
          className="w-full flex-1 min-h-0 max-w-full lg:max-w-[680px] h-full max-h-full overflow-y-auto custom-scrollbar px-1 sm:px-3 pt-3 sm:pt-4 pb-36 md:pb-16 flex flex-col gap-4"
        >
          {children}
        </main>

        {/* RIGHT COLUMN: Mini Music Player & Follow Suggestions (Independent Scrollable Column) */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 min-h-0 h-full max-h-full overflow-y-auto custom-scrollbar pt-4 pb-20 select-none">
          <RightSidebar />
        </aside>
      </div>

      {/* ======================================================================
          MOBILE FLOATING MUSIC BAR (Fixed above bottom nav on mobile)
          ====================================================================== */}
      <div className="lg:hidden">
        <MiniMusicPlayer />
      </div>

      {/* ======================================================================
          MOBILE BOTTOM NAVIGATION (Fixed Instagram-style, md:hidden)
          ====================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-t border-[#e4e6eb] dark:border-[#393a3b] flex items-center justify-around px-2 md:hidden">
        {/* 1. Trang chủ */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-2 transition ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Trang chủ"
        >
          {({ isActive }) => <Home strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5" />}
        </NavLink>

        {/* 2. Khám phá / Tìm kiếm */}
        <NavLink
          to="/trending"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-2 transition ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Khám phá"
        >
          {({ isActive }) => <Compass strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5" />}
        </NavLink>

        {/* 3. Tạo bài viết (Nút cộng ở giữa nổi bật) */}
        <button
          type="button"
          onClick={() => {
            if (!currentUser) {
              navigate("/login");
            } else {
              setIsCreateModalOpen(true);
            }
          }}
          className="w-10 h-10 rounded-full bg-[#0866ff] hover:bg-[#0756d6] text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
          title="Tạo bài viết mới"
        >
          <Plus strokeWidth={2.5} className="w-5 h-5" />
        </button>

        {/* 4. Thông báo */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center p-2 transition ${
              isActive ? "text-black dark:text-white font-bold" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`
          }
          title="Thông báo"
        >
          {({ isActive }) => (
            <>
              <Bell strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black" />
              )}
            </>
          )}
        </NavLink>

        {/* 5. Trang cá nhân */}
        <NavLink
          to={currentUserId ? `/profile/${currentUserId}` : "/login"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center p-0.5 rounded-full transition ${
              isActive ? "ring-2 ring-black dark:ring-white" : ""
            }`
          }
          title="Trang cá nhân"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
              style={{ backgroundColor: currentUser?.avatarColor || "#27272a" }}
            >
              {getInitials(currentUser?.fullName || currentUser?.username)}
            </div>
          )}
        </NavLink>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          setIsCreateModalOpen(false);
          window.dispatchEvent(new CustomEvent("refresh_feed_posts"));
        }}
      />

      {/* AI Assistant Gemini Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Scroll to Top Floating Button (Smooth 60fps glassmorphism) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-32 md:bottom-8 right-4 md:right-8 z-40 w-10 h-10 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in-90 duration-200 cursor-pointer"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
