import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home, Compass, Bell, MessageCircle, Bookmark,
  Users, User, BarChart2, Plus, MoreHorizontal,
  Search, LogOut, Sun, Moon, Shield, TrendingUp,
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

const AMBER = "#E8650A";

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

  useEffect(() => {
    const h = (e) => setUnreadMessages(e.detail?.count || 0);
    window.addEventListener("unread_chat_count_updated", h);
    return () => window.removeEventListener("unread_chat_count_updated", h);
  }, []);

  useEffect(() => {
    categoryService.getAll()
      .then((r) => setRealCategories((r.data || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    userService.getAll("", 0, 5)
      .then((r) => {
        const list = r.data?.content || r.data || [];
        setSuggestedUsers(list.filter((u) => String(u.id) !== String(currentUserId)).slice(0, 4));
      })
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    const h = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navItems = [
    { to: "/",                          label: "Trang chủ",  icon: Home },
    { to: "/trending",                  label: "Khám phá",   icon: Compass },
    { to: "/notifications",             label: "Thông báo",  icon: Bell,          badge: unreadNotifs },
    { to: "/chat", label: "Tin nhắn",   icon: MessageCircle, badge: unreadMessages,
      onClick: (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("toggle_chat_widget")); } },
    { to: "/saved",                     label: "Đã lưu",     icon: Bookmark },
    { to: "/friends",                   label: "Bạn bè",     icon: Users },
    { to: `/profile/${currentUserId}`,  label: "Hồ sơ",      icon: User },
    { to: "/dashboard",                 label: "Công cụ",    icon: BarChart2 },
  ];

  return (
    <>
      {/* ============================================================
          ROOT: warm stone background, justify-center flex row
          ============================================================ */}
      <div className="min-h-screen bg-stone-50 dark:bg-[#121212] text-stone-900 dark:text-stone-100 flex justify-center">

        {/* ============================================================
            LEFT SIDEBAR — sticky, hidden below md
            ============================================================ */}
        <aside
          className="w-20 xl:w-64 shrink-0 sticky top-0 h-screen flex flex-col justify-between
                     p-3 xl:p-4 border-r border-stone-200 dark:border-stone-800
                     bg-white dark:bg-[#1a1a1a] hidden md:flex"
        >
          <div className="flex flex-col gap-1.5">
            {/* Brand mark */}
            <Link
              to="/"
              className="flex items-center gap-3 px-2.5 py-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-900 transition mb-3"
            >
              <div
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm"
                style={{ backgroundColor: AMBER }}
              >
                B
              </div>
              <span className="font-extrabold text-xl hidden xl:block text-stone-900 dark:text-stone-100 tracking-tight">
                Blog<span style={{ color: AMBER }}>Viet</span>
              </span>
            </Link>

            {/* Nav items */}
            {navItems.map(({ to, label, icon: Icon, badge, onClick }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClick}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[15px] font-medium transition ${
                    active
                      ? "font-semibold text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-900"
                      : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-900"
                  }`}
                  style={active ? { color: AMBER } : {}}
                >
                  <span className="relative shrink-0">
                    <Icon strokeWidth={active ? 2.2 : 1.75} className="w-5 h-5" />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] px-1 text-center border-2 border-white dark:border-[#1a1a1a]">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:block">{label}</span>
                </NavLink>
              );
            })}

            {/* Post button — amber fill */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 flex items-center justify-center gap-2 w-10 h-10 xl:w-full xl:h-auto xl:py-3 rounded-xl
                         text-white text-sm font-semibold transition active:scale-95 shadow-sm"
              style={{ backgroundColor: AMBER }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#c8540a"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = AMBER}
            >
              <Plus strokeWidth={2.5} className="w-5 h-5 xl:hidden" />
              <span className="hidden xl:block">Đăng bài</span>
            </button>
          </div>

          {/* User dock */}
          <div className="relative" ref={userMenuRef}>
            {userMenuOpen && (
              <div className="absolute bottom-14 left-0 z-50 w-56 bg-white dark:bg-[#1e1e1e] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5">
                <button
                  onClick={() => { onToggleTheme?.(); setUserMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition w-full text-left"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-stone-500" />}
                  {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
                </button>
                <Link
                  to="/security"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <Shield className="w-4 h-4" /> Bảo mật & Cài đặt
                </Link>
                <div className="h-px bg-stone-100 dark:bg-stone-800 my-0.5" />
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition w-full text-left"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            )}
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-900 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2" style={{ ringColor: AMBER }} />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: currentUser?.avatarColor || AMBER }}
                  >
                    {getInitials(currentUser?.fullName || currentUser?.username)}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left leading-tight min-w-0">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {currentUser?.fullName || currentUser?.username}
                  </span>
                  <span className="text-[11px] text-stone-500 truncate">@{currentUser?.username}</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-stone-400 hidden xl:block shrink-0" />
            </button>
          </div>
        </aside>

        {/* ============================================================
            CENTER COLUMN — main content, max-w-[660px]
            ============================================================ */}
        <main
          className="w-full max-w-[660px] min-h-screen border-r border-stone-200 dark:border-stone-800
                     bg-white dark:bg-[#181818] flex flex-col"
        >
          {children}
        </main>

        {/* ============================================================
            RIGHT WIDGETS — w-80, sticky, hidden below lg
            ============================================================ */}
        <aside className="w-80 shrink-0 sticky top-0 h-screen hidden lg:flex flex-col gap-4 p-4 overflow-y-auto">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative mt-2">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, tác giả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-full
                         py-2.5 pl-10 pr-4 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400
                         focus:outline-none focus:ring-2 transition"
              style={{ "--tw-ring-color": AMBER + "60" }}
            />
          </form>

          {/* Categories widget — only if data exists */}
          {realCategories.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: AMBER }} />
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Chủ đề thảo luận
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {realCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/search?q=${encodeURIComponent(cat.name)}`}
                    className="text-sm font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition flex items-center gap-1.5 group"
                  >
                    <span className="text-xs font-semibold" style={{ color: AMBER }}>#</span>
                    <span className="group-hover:underline">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggested users widget — only if data exists */}
          {suggestedUsers.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-3">
                Tác giả đề xuất
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
                          style={{ backgroundColor: u.avatarColor || AMBER }}
                        >
                          {getInitials(u.fullName || u.username)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:underline">
                          {u.fullName || u.username}
                        </span>
                        <span className="text-xs text-stone-400 truncate">@{u.username}</span>
                      </div>
                    </Link>
                    <Link
                      to={`/profile/${u.id}`}
                      className="shrink-0 px-3 py-1 text-xs font-semibold rounded-full border transition"
                      style={{ borderColor: AMBER, color: AMBER }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fff7ed"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ""; }}
                    >
                      Xem
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-[11px] text-stone-400 leading-relaxed px-1">
            © 2026 BlogViet ·{" "}
            <a href="#terms" className="hover:underline">Điều khoản</a> ·{" "}
            <a href="#privacy" className="hover:underline">Quyền riêng tư</a>
          </p>
        </aside>
      </div>

      {/* ============================================================
          MOBILE BOTTOM NAV — fixed, strictly hidden on md+
          ============================================================ */}
      <nav className="fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#181818]/95 backdrop-blur border-t border-stone-200 dark:border-stone-800 flex justify-around items-center z-50 md:hidden">
        {[
          { to: "/",              icon: Home },
          { to: "/trending",      icon: Search },
          { to: "/notifications", icon: Bell, badge: unreadNotifs },
          { to: `/profile/${currentUserId}`, icon: User },
        ].map(({ to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `p-2 flex items-center justify-center relative ${isActive ? "text-stone-900 dark:text-stone-100" : "text-stone-400 dark:text-stone-600"}`}
            style={({ isActive }) => isActive ? { color: AMBER } : {}}
          >
            <Icon className="w-5 h-5" />
            {badge > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </NavLink>
        ))}
        {/* Center post button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition"
          style={{ backgroundColor: AMBER }}
        >
          <Plus className="w-5 h-5" />
        </button>
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
