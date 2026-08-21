import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Search, Bell, Plus, ChevronDown, LogOut,
  Sun, Moon, Shield, User, Settings, Home,
  Compass, Bookmark, Users, BarChart2, X, Hash, ArrowUp, ArrowLeft, MessageCircle, Menu, Video, LayoutGrid, Film,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import notificationService from "../services/notificationService";
import CreatePostModal from "../components/CreatePostModal";
import AiAssistantModal from "../components/AiAssistantModal";
import MessengerDropdown from "../components/MessengerDropdown";
import LeftSidebar from "../components/LeftSidebar";
import RightSidebar from "../components/RightSidebar";
import MiniSoundscapePlayer from "../components/MiniSoundscapePlayer";
import MobileNavDrawer from "../components/MobileNavDrawer";
import Logo from "../components/Logo";
import Avatar from "../components/Avatar";

export default function MainLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const messengerMenuRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

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

  // Listen for unread chat count changes
  useEffect(() => {
    const handleCount = (e) => {
      if (typeof e.detail === "number") setUnreadChatCount(e.detail);
    };
    window.addEventListener("unread_chat_count_changed", handleCount);
    return () => window.removeEventListener("unread_chat_count_changed", handleCount);
  }, []);

  // Close dropdowns on outside click (MessengerDropdown manages its own portal and click outside)
  useEffect(() => {
    const h = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global event listener for AI Assistant modal
  useEffect(() => {
    const handleOpenAi = () => {
      window.dispatchEvent(new CustomEvent("close_chat_widget"));
      setIsAiModalOpen(true);
    };
    const handleCloseAi = () => {
      setIsAiModalOpen(false);
    };
    window.addEventListener("open_ai_assistant", handleOpenAi);
    window.addEventListener("close_ai_assistant", handleCloseAi);
    return () => {
      window.removeEventListener("open_ai_assistant", handleOpenAi);
      window.removeEventListener("close_ai_assistant", handleCloseAi);
    };
  }, []);

  // Sync sidebar collapsed state from LeftSidebar
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      if (typeof e.detail?.isSidebarCollapsed === "boolean") {
        setIsSidebarCollapsed(e.detail.isSidebarCollapsed);
      }
    };

    window.addEventListener("sidebar_toggle", handleSidebarToggle);
    return () => window.removeEventListener("sidebar_toggle", handleSidebarToggle);
  }, []);

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

  const pathname = location.pathname;
  const isShortsPage = pathname === "/shorts";
  const is3ColumnFeedPage = pathname === "/" || pathname === "/trending";
  const isProfilePage = pathname.startsWith("/profile");
  const isPostDetailPage = pathname.startsWith("/posts/");

  return (
    <div className={`min-h-screen w-full bg-[#f0f2f5] dark:bg-[#18191a] text-[#050505] dark:text-[#e4e6eb] flex flex-col transition-colors duration-200 ${isShortsPage ? "h-[100dvh] overflow-hidden" : ""}`}>
      <header className={`w-full h-14 shrink-0 bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-b border-[#e4e6eb] dark:border-[#393a3b] sticky top-0 z-50 shadow-xs ${isShortsPage ? "hidden md:block" : ""}`}>
        {mobileSearchOpen ? (
          /* FULL WIDTH MOBILE SEARCH BAR OVERLAY */
          <div className="w-full h-14 px-3 sm:px-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
              title="Đóng tìm kiếm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 relative min-w-0">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Tìm bài viết, tác giả, hashtag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-transparent focus:border-[#0866ff] rounded-full py-2 pl-9 pr-9 text-xs text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition"
                  title="Xóa chữ"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={handleSearchSubmit}
              disabled={!searchQuery.trim()}
              className="px-4 py-2 min-h-[38px] rounded-full bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold transition disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
            >
              Tìm
            </button>
          </div>
        ) : (
          /* STANDARD NAVBAR LAYOUT */
          <div className="w-full h-14 px-3 sm:px-4 md:px-4 flex items-center justify-between gap-2 sm:gap-4">
            {/* LEFT SECTION: Hamburger on Mobile (far left) & Logo + Search Input on PC */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
              {/* Nút Menu 3 gạch ngang (Chỉ hiển thị ngoài cùng bên trái trên Mobile) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex md:hidden items-center p-2 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
                title="Mở menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo & Tên BlogViet (Ẩn hoàn toàn trên Mobile md:hidden, chỉ hiện trên PC md:flex) */}
              <div className="hidden md:flex items-center">
                <Logo size="md" withText={true} />
              </div>

              {/* Thanh Tìm Kiếm Desktop (Đặt ngay cạnh Logo BlogViet ở bên trái) */}
              <form onSubmit={handleSearchSubmit} className="hidden md:block w-56 lg:w-80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết, tác giả..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/50 focus:border-[#0866ff] rounded-full py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </form>
            </div>

            {/* RIGHT SECTION: Notifications + Messenger + Profile */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
              {/* 1. Mobile Search Trigger Icon (Chỉ hiển thị trên Mobile) */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(true);
                  setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                }}
                className="flex md:hidden p-1.5 min-w-[36px] min-h-[36px] items-center justify-center rounded-full text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-150 cursor-pointer"
                title="Tìm kiếm bài viết, tác giả"
              >
                <Search strokeWidth={2} className="w-4 h-4" />
              </button>

              {/* 2. Chuông thông báo (Hiển thị đầy đủ cả Mobile & Desktop) */}
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  `relative p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full active:scale-95 hover:scale-105 transition-all duration-150 ${
                    isActive
                      ? "text-black dark:text-white bg-zinc-100 dark:bg-zinc-800"
                      : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`
                }
                title="Thông báo"
              >
                <Bell strokeWidth={1.8} className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </NavLink>

              {/* 3. Messenger Chat Button & Dropdown (Desktop & Mobile) */}
              <div className="relative" ref={messengerMenuRef}>
                <button
                  type="button"
                  onClick={() => setMessengerOpen((v) => !v)}
                  className={`relative p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full active:scale-95 hover:scale-105 transition-all duration-150 cursor-pointer ${
                    messengerOpen
                      ? "text-[#0866ff] bg-[#0866ff]/10 dark:bg-[#0866ff]/20 ring-2 ring-[#0866ff]/30"
                      : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                  title="Tin nhắn Messenger"
                >
                  <MessageCircle strokeWidth={1.8} className="w-4 h-4" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1 border-2 border-white dark:border-[#242526] shadow-xs">
                      {unreadChatCount > 9 ? "9+" : unreadChatCount}
                    </span>
                  )}
                </button>

                {/* Messenger Dropdown Menu */}
                <MessengerDropdown
                  isOpen={messengerOpen}
                  onClose={() => setMessengerOpen(false)}
                />
              </div>

              {/* 4. Profile Dropdown (Desktop only hidden md:block) */}
              <div className="relative hidden md:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="flex items-center gap-1 p-1 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-150 cursor-pointer"
                  title="Tài khoản cá nhân"
                >
                  <Avatar
                    userId={currentUserId}
                    src={currentUser?.avatarUrl}
                    name={currentUser?.fullName || currentUser?.username}
                    username={currentUser?.username}
                    avatarColor={currentUser?.avatarColor}
                    size="sm"
                    hideStatus={true}
                    className="border border-zinc-200 dark:border-zinc-700"
                  />
                  <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:inline" />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Profile header */}
                    <Link
                      to={`/profile/${currentUserId}`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                      <Avatar
                        userId={currentUserId}
                        src={currentUser?.avatarUrl}
                        name={currentUser?.fullName || currentUser?.username}
                        username={currentUser?.username}
                        avatarColor={currentUser?.avatarColor}
                        size="sm"
                        hideStatus={true}
                        onClick={() => setProfileMenuOpen(false)}
                        className="shrink-0"
                      />
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
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition"
                    >
                      <User className="w-4 h-4 text-zinc-500" /> Hồ sơ cá nhân
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition"
                    >
                      <Settings className="w-4 h-4 text-zinc-500" /> Cài đặt
                    </Link>

                    <button
                      type="button"
                      onClick={() => { toggleTheme(); setProfileMenuOpen(false); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-98 transition w-full text-left cursor-pointer"
                    >
                      {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-500" />}
                      {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                    <button
                      type="button"
                      onClick={() => { logout(); navigate("/login"); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 active:scale-98 transition w-full text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Feature Synchronized Mobile Nav Drawer */}
        <MobileNavDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
      </header>

      {/* LEFT SIDEBAR: Minimal Icon Bar with Hover Tooltips (Fixed on Desktop md+) */}
      <LeftSidebar />

      {/* ======================================================================
          DYNAMIC ADAPTIVE LAYOUT:
          - Home / Trending: 2-column Facebook layout (Center Feed + Sticky Right Sidebar)
          - Profile / Posts / Tools: Balanced Centered Layout
          ====================================================================== */}
      {isShortsPage ? (
        <main className={`w-full flex-none h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom,0px))] md:flex-1 md:h-full md:max-h-[100dvh] flex flex-col p-0 md:p-4 overflow-hidden transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}>
          {children}
        </main>
      ) : is3ColumnFeedPage ? (
        <div className={`w-full max-w-[1360px] mx-auto min-h-screen grid grid-cols-12 gap-3 sm:gap-4 lg:gap-6 px-2 sm:px-4 pt-3 sm:pt-4 items-start transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
        } md:pr-4`}>
          {/* CENTER COLUMN: Main Content Feed (col-span-12 on mobile, lg:col-span-8 on desktop) */}
          <main
            ref={mainRef}
            onScroll={handleMainScroll}
            className="col-span-12 lg:col-span-8 min-w-0 w-full pb-36 sm:pb-28 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-16 flex flex-col gap-2.5 touch-pan-y animate-fade-in-up"
          >
            {children}
          </main>

          {/* RIGHT COLUMN: Mini Music Player & Follow Suggestions (col-span-4, sticky on desktop) */}
          <aside className="sidebar-sticky sidebar-right-fixed hidden lg:block lg:col-span-4 custom-scrollbar pb-16">
            <RightSidebar />
          </aside>
        </div>
      ) : (
        <main
          ref={mainRef}
          onScroll={handleMainScroll}
          className={`w-full flex-1 px-2 sm:px-4 pt-3 sm:pt-5 pb-36 sm:pb-28 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] md:pb-16 flex flex-col gap-3 touch-pan-y animate-fade-in-up transition-all duration-300 ${
            isSidebarCollapsed ? "md:pl-24" : "md:pl-72"
          } md:pr-6 ${
            isProfilePage
              ? "max-w-5xl mx-auto"
              : isPostDetailPage
              ? "max-w-3xl mx-auto"
              : pathname.startsWith("/security") || pathname.startsWith("/notifications")
              ? "max-w-4xl mx-auto"
              : "max-w-5xl mx-auto"
          }`}
        >
          {children}
        </main>
      )}

      {/* ======================================================================
          MOBILE FLOATING SOUNDSCAPE BAR (Fixed above bottom nav on mobile)
          ====================================================================== */}
      {!isShortsPage && (
        <div className="lg:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px)+8px)] left-0 right-0 px-3 z-40 flex justify-center pointer-events-auto">
          <MiniSoundscapePlayer isMobileFloating={true} />
        </div>
      )}

      {/* ======================================================================
          MOBILE BOTTOM NAVIGATION (Fixed Instagram-style, md:hidden with Safe Area)
          ====================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 min-h-14 h-[calc(3.5rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#242526]/95 backdrop-blur-md border-t border-[#e4e6eb] dark:border-[#393a3b] flex items-center justify-around px-1 md:hidden">
        {/* 1. Trang chủ */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1.5 transition-all duration-150 active:scale-90 ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Trang chủ"
        >
          {({ isActive }) => <Home strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5 transition-transform duration-150" />}
        </NavLink>

        {/* 2. Khám phá / Tìm kiếm */}
        <NavLink
          to="/trending"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1.5 transition-all duration-150 active:scale-90 ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Khám phá"
        >
          {({ isActive }) => <Compass strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5 transition-transform duration-150" />}
        </NavLink>

        {/* 3. Shorts */}
        <NavLink
          to="/shorts"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1.5 transition-all duration-150 active:scale-90 ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Shorts"
        >
          {({ isActive }) => <Film strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5 transition-transform duration-150" />}
        </NavLink>

        {/* 5. Thông báo */}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1.5 transition-all duration-150 active:scale-90 ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Thông báo"
        >
          {({ isActive }) => (
            <>
              <Bell strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5 transition-transform duration-150" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-black animate-pulse" />
              )}
            </>
          )}
        </NavLink>

        {/* 6. Trang cá nhân (Avatar thu nhỏ cạnh Chuông thông báo) */}
        <NavLink
          to={currentUser ? `/profile/${currentUserId}` : "/login"}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[44px] p-1.5 transition-all duration-150 active:scale-90 ${
              isActive ? "text-[#0866ff] font-bold" : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-[#e4e6eb]"
            }`
          }
          title="Trang cá nhân"
        >
          {({ isActive }) =>
            currentUser ? (
              <div className={`p-0.5 rounded-full transition-all ${isActive ? "ring-2 ring-[#0866ff] ring-offset-1 dark:ring-offset-zinc-900" : ""}`}>
                <Avatar
                  userId={currentUserId}
                  src={currentUser?.avatarUrl}
                  name={currentUser?.fullName || currentUser?.username}
                  username={currentUser?.username}
                  avatarColor={currentUser?.avatarColor}
                  size="xs"
                  hideStatus={true}
                  className="w-6 h-6 min-w-6 min-h-6 border border-zinc-200 dark:border-zinc-700 shadow-xs"
                />
              </div>
            ) : (
              <User strokeWidth={isActive ? 2.5 : 1.75} className="w-5 h-5 transition-transform duration-150" />
            )
          }
        </NavLink>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={(newPost) => {
          setIsCreateModalOpen(false);
          if (newPost) {
            window.dispatchEvent(new CustomEvent("post_created", { detail: { post: newPost } }));
          } else {
            window.dispatchEvent(new CustomEvent("refresh_feed_posts"));
          }
        }}
      />

      {/* AI Assistant Gemini Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />

      {/* Scroll to Top Floating Button (Smooth 60fps glassmorphism) */}
      {!isShortsPage && showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 md:right-8 z-40 w-11 h-11 rounded-full bg-white/95 dark:bg-zinc-900/95 text-zinc-700 dark:text-zinc-200 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in-90 duration-200 cursor-pointer"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
