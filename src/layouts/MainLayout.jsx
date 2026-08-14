import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Compass, Bell, MessageCircle, Bookmark, Users,
  User, BarChart2, Plus, MoreHorizontal, Search, LogOut,
  Sun, Moon, Shield, TrendingUp, Sparkles, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import categoryService from "../services/categoryService";
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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [realCategories, setRealCategories] = useState([]);
  const userMenuRef = useRef(null);

  // Poll unread count
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

  // Chat badge
  useEffect(() => {
    const h = (e) => setUnreadMessages(e.detail?.count || 0);
    window.addEventListener("unread_chat_count_updated", h);
    return () => window.removeEventListener("unread_chat_count_updated", h);
  }, []);

  // Real categories (no mock)
  useEffect(() => {
    categoryService.getAll()
      .then((r) => setRealCategories((r.data || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  // Real suggested users (no mock)
  useEffect(() => {
    if (!currentUserId) return;
    userService.getAll("", 0, 5)
      .then((r) => {
        const list = r.data?.content || r.data || [];
        setSuggestedUsers(list.filter((u) => String(u.id) !== String(currentUserId)).slice(0, 4));
      })
      .catch(() => {});
  }, [currentUserId]);

  // Close user menu on outside click
  useEffect(() => {
    const h = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navItems = [
    { to: "/",           label: "Trang chủ", icon: Home },
    { to: "/trending",   label: "Khám phá",  icon: Compass },
    { to: "/notifications", label: "Thông báo", icon: Bell, badge: unreadNotifs },
    {
      to: "/chat", label: "Tin nhắn", icon: MessageCircle, badge: unreadMessages,
      onClick: (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("toggle_chat_widget")); },
    },
    { to: "/saved",    label: "Đã lưu", icon: Bookmark },
    { to: "/friends",  label: "Bạn bè",  icon: Users },
    { to: `/profile/${currentUserId}`, label: "Hồ sơ", icon: User },
    { to: "/dashboard", label: "Công cụ", icon: BarChart2 },
  ];

  return (
    <>
      {/* =====================================================
          ROOT WRAPPER — full-width flex row, no hidden overflow
          ===================================================== */}
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex justify-center">

        {/* ===================================================
            LEFT SIDEBAR — sticky, scrolls with page via h-screen
            =================================================== */}
        <aside className="w-20 xl:w-64 shrink-0 hidden sm:flex flex-col justify-between sticky top-0 h-screen p-3 xl:p-4 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex flex-col gap-1">
            {/* Brand */}
            <Link
              to="/"
              className="flex items-center gap-3 px-2.5 py-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition mb-3"
            >
              <div className="w-8 h-8 shrink-0 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-black text-lg shadow-sm">
                B
              </div>
              <span className="font-extrabold text-xl hidden xl:block text-zinc-900 dark:text-white tracking-tight">
                BlogViet
              </span>
            </Link>

            {/* Nav links */}
            {navItems.map(({ to, label, icon: Icon, badge, onClick }) => {
              const active = location.pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClick}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-full text-[15px] font-medium transition ${
                    active
                      ? "font-bold text-black dark:text-white bg-zinc-100 dark:bg-zinc-800"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <span className="relative shrink-0">
                    <Icon strokeWidth={active ? 2.2 : 1.75} className="w-5 h-5" />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[16px] px-1 text-center border-2 border-white dark:border-zinc-950">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:block">{label}</span>
                </NavLink>
              );
            })}

            {/* Post button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 flex items-center justify-center gap-2 w-10 h-10 xl:w-full xl:h-auto xl:py-3 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm"
            >
              <Plus strokeWidth={2.5} className="w-5 h-5 xl:hidden" />
              <span className="hidden xl:block">Đăng bài</span>
            </button>
          </div>

          {/* User mini dock */}
          <div className="relative" ref={userMenuRef}>
            {/* Popup menu */}
            {userMenuOpen && (
              <div className="absolute bottom-14 left-0 z-50 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5">
                <button
                  onClick={() => { onToggleTheme?.(); setUserMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full text-left"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
                </button>
                <Link
                  to="/security"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <Shield className="w-4 h-4" /> Bảo mật & Cài đặt
                </Link>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            )}

            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: currentUser?.avatarColor || "#4f46e5" }}
                  >
                    {getInitials(currentUser?.fullName || currentUser?.username)}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left leading-tight min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                    {currentUser?.fullName || currentUser?.username}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate">@{currentUser?.username}</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-zinc-400 hidden xl:block shrink-0" />
            </button>
          </div>
        </aside>

        {/* ===================================================
            CENTER COLUMN — grows, scrolls internally
            =================================================== */}
        <main className="w-full max-w-[640px] min-h-screen border-x border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
          {children}
        </main>

        {/* ===================================================
            RIGHT WIDGETS — sticky, hidden below lg
            =================================================== */}
        <aside className="w-80 shrink-0 hidden lg:flex flex-col gap-4 sticky top-0 h-screen p-4 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-white dark:bg-zinc-950">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative mt-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-transparent rounded-full py-2 pl-10 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-700 transition"
            />
          </form>

          {/* Categories widget */}
          {realCategories.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                  Chủ đề thảo luận
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {realCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/search?q=${encodeURIComponent(cat.name)}`}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition"
                  >
                    #{cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggested users widget */}
          {suggestedUsers.length > 0 && (
            <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block mb-3">
                Gợi ý cho bạn
              </span>
              <div className="flex flex-col gap-3">
                {suggestedUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between gap-2">
                    <Link to={`/profile/${u.id}`} className="flex items-center gap-2.5 min-w-0 flex-1 group">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: u.avatarColor || "#6366f1" }}
                        >
                          {getInitials(u.fullName || u.username)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate group-hover:underline">
                          {u.fullName || u.username}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate">@{u.username}</span>
                      </div>
                    </Link>
                    <Link
                      to={`/profile/${u.id}`}
                      className="shrink-0 px-3 py-1 text-[11px] font-semibold rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Xem
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-[11px] text-zinc-400 leading-relaxed px-1">
            © 2026 BlogViet, Inc. · <a href="#terms" className="hover:underline">Điều khoản</a> · <a href="#privacy" className="hover:underline">Quyền riêng tư</a>
          </p>
        </aside>
      </div>

      {/* =====================================================
          MOBILE BOTTOM NAV — fixed, only on < md screens
          This is OUTSIDE the flex row so it never overlaps columns
          ===================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-zinc-950/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex justify-around items-center z-50 sm:hidden">
        <NavLink to="/" className={({ isActive }) => `p-2 ${isActive ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
          <Home className="w-5 h-5" />
        </NavLink>
        <NavLink to="/trending" className={({ isActive }) => `p-2 ${isActive ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
          <Search className="w-5 h-5" />
        </NavLink>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md"
        >
          <Plus className="w-5 h-5" />
        </button>
        <NavLink to="/notifications" className={({ isActive }) => `p-2 relative ${isActive ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
        </NavLink>
        <NavLink to={`/profile/${currentUserId}`} className={({ isActive }) => `p-2 ${isActive ? "text-black dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}>
          <User className="w-5 h-5" />
        </NavLink>
      </nav>

      {/* Global Create Post Modal */}
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
