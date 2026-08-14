import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Compass,
  Bell,
  MessageCircle,
  Bookmark,
  Users,
  User,
  BarChart2,
  Plus,
  MoreHorizontal,
  Search,
  LogOut,
  Sun,
  Moon,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";
import userService from "../services/userService";
import CreatePostModal from "../components/CreatePostModal";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

  // Search state for Right Widget
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingTags] = useState([
    { tag: "CongNghe", posts: "12.4k" },
    { tag: "LapTrinhWeb", posts: "8.1k" },
    { tag: "AI_GenAI", posts: "24.6k" },
    { tag: "GiaiTri", posts: "19.3k" },
    { tag: "DoiSong", posts: "6.2k" }
  ]);

  const userMenuRef = useRef(null);

  // Fetch unread notifications count (Lọc bỏ tin nhắn)
  useEffect(() => {
    if (!currentUserId) return;
    notificationService.getUnreadCount()
      .then((res) => setUnreadNotifs(res.data?.unreadCount || 0))
      .catch(() => {});

    const notifInterval = setInterval(() => {
      notificationService.getUnreadCount()
        .then((res) => setUnreadNotifs(res.data?.unreadCount || 0))
        .catch(() => {});
    }, 45000);

    return () => clearInterval(notifInterval);
  }, [currentUserId]);

  // Listen to unread chat count
  useEffect(() => {
    const handleChatCount = (e) => {
      setUnreadMessages(e.detail?.count || 0);
    };
    window.addEventListener("unread_chat_count_updated", handleChatCount);
    return () => window.removeEventListener("unread_chat_count_updated", handleChatCount);
  }, []);

  // Fetch suggestions for Who To Follow
  useEffect(() => {
    if (!currentUserId) return;
    userService.getAll("", 0, 4)
      .then((res) => {
        const list = res.data?.content || res.data || [];
        const filtered = list.filter((u) => String(u.id) !== String(currentUserId));
        setSuggestedUsers(filtered.slice(0, 3));
      })
      .catch(() => {});
  }, [currentUserId]);

  // Click outside listener for User Menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { to: "/", label: "Trang chủ", icon: Home },
    { to: "/trending", label: "Khám phá", icon: Compass },
    { to: "/notifications", label: "Thông báo", icon: Bell, badge: unreadNotifs },
    {
      to: "/chat",
      label: "Tin nhắn",
      icon: MessageCircle,
      badge: unreadMessages,
      onClick: (e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle_chat_widget"));
      }
    },
    { to: "/saved", label: "Đã lưu", icon: Bookmark },
    { to: "/friends", label: "Bạn bè", icon: Users },
    { to: `/profile/${currentUserId}`, label: "Hồ sơ", icon: User },
    { to: "/dashboard", label: "Công cụ", icon: BarChart2 }
  ];

  return (
    <div className="h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none">
      {/* Container căn giữa toàn bộ 3 cột */}
      <div className="max-w-7xl mx-auto h-full flex justify-center">
        
        {/* ========================================================
            1. CỘT TRÁI (NAVIGATION DOCK) - w-[76px] xl:w-[250px]
            ======================================================== */}
        <aside className="w-[76px] xl:w-[250px] h-full flex flex-col justify-between p-3 xl:p-4 border-r border-zinc-200 dark:border-zinc-800 shrink-0 hidden md:flex">
          <div className="flex flex-col gap-2">
            {/* Logo Thương Hiệu Tối Giản */}
            <Link
              to="/"
              className="w-11 h-11 xl:w-auto xl:h-auto p-2 xl:px-3.5 xl:py-2.5 flex items-center gap-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition mb-2"
              title="BlogViet"
            >
              <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-black text-lg tracking-tighter shrink-0 shadow-sm">
                B
              </div>
              <span className="font-extrabold text-xl tracking-tight hidden xl:inline text-zinc-900 dark:text-white">
                BlogViet
              </span>
            </Link>

            {/* Navigation List - Màu Đen/Xám Tối Giản */}
            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={item.onClick}
                    className={`flex items-center gap-3.5 px-3 py-2.5 rounded-full transition group relative ${
                      isActive
                        ? "font-bold text-black dark:text-white bg-zinc-200/80 dark:bg-zinc-800/80"
                        : "text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                    title={item.label}
                  >
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Icon strokeWidth={isActive ? 2.2 : 1.75} className="w-5 h-5" />
                      {item.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border-2 border-zinc-50 dark:border-black">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[15px] font-medium tracking-tight hidden xl:inline">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Nút Đăng Bài Nổi Bật (Threads / X Style) */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 w-11 h-11 xl:w-full xl:h-11 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition shadow-sm cursor-pointer"
              title="Đăng bài viết mới"
            >
              <Plus strokeWidth={2.4} className="w-5 h-5 shrink-0 xl:hidden" />
              <span className="hidden xl:inline text-sm">Đăng bài</span>
            </button>
          </div>

          {/* User Profile Mini Dock ở Đáy Sidebar */}
          <div className="relative" ref={userMenuRef}>
            {userMenuOpen && (
              <div className="absolute bottom-16 left-0 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme && onToggleTheme();
                    setUserMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition text-zinc-700 dark:text-zinc-300 w-full text-left"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>{isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span>
                </button>

                <Link
                  to="/security"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition text-zinc-700 dark:text-zinc-300"
                >
                  <Shield className="w-4 h-4" />
                  <span>Bảo mật & Cài đặt</span>
                </Link>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-0.5" />

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition text-rose-600 dark:text-rose-400 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất @{currentUser?.username || "user"}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center justify-between p-1.5 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                    style={{ backgroundColor: currentUser?.avatarColor || "#4f46e5" }}
                  >
                    {getInitials(currentUser?.fullName || currentUser?.username)}
                  </div>
                )}
                <div className="hidden xl:flex flex-col text-left min-w-0 leading-tight">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                    {currentUser?.fullName || currentUser?.username}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate">
                    @{currentUser?.username}
                  </span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-zinc-500 hidden xl:inline shrink-0" />
            </button>
          </div>
        </aside>

        {/* ========================================================
            2. CỘT GIỮA (MAIN FEED COLUMN) - max-w-[620px] w-full
            ======================================================== */}
        <main className="w-full max-w-[620px] h-full flex flex-col border-x border-zinc-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-950 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto scrollbar-none pb-16 md:pb-0">
            {children}
          </div>
        </main>

        {/* ========================================================
            3. CỘT PHẢI (RIGHT WIDGETS) - w-[320px] xl:w-[350px]
            ======================================================== */}
        <aside className="w-[320px] xl:w-[350px] h-full hidden lg:flex flex-col gap-4 p-4 shrink-0 overflow-y-auto scrollbar-none border-l border-zinc-200 dark:border-zinc-800">
          {/* Search Pill Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-full py-2.5 pl-10 pr-4 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition"
            />
          </form>

          {/* Widget 1: Chủ đề thịnh hành (Trending Tags) */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                Chủ đề thịnh hành
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {trendingTags.map((item, idx) => (
                <Link
                  key={idx}
                  to={`/search?q=${item.tag}`}
                  className="flex items-center justify-between group hover:opacity-80 transition"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 group-hover:text-black dark:group-hover:text-white transition">
                      #{item.tag}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {item.posts} bài thảo luận
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
                </Link>
              ))}
            </div>
          </div>

          {/* Widget 2: Gợi ý theo dõi (Who To Follow) */}
          {suggestedUsers.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-white mb-3 uppercase tracking-wider">
                Gợi ý cho bạn
              </h3>
              <div className="flex flex-col gap-3">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <Link
                      to={`/profile/${user.id}`}
                      className="flex items-center gap-2.5 min-w-0 group flex-1"
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                          style={{ backgroundColor: user.avatarColor || "#6366f1" }}
                        >
                          {getInitials(user.fullName || user.username)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 leading-tight">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white truncate group-hover:underline">
                          {user.fullName || user.username}
                        </span>
                        <span className="text-[11px] text-zinc-500 truncate">
                          @{user.username}
                        </span>
                      </div>
                    </Link>
                    <Link
                      to={`/profile/${user.id}`}
                      className="px-3 py-1 text-[11px] font-semibold rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition shrink-0"
                    >
                      Xem
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Copyright */}
          <div className="text-[11px] text-zinc-400 px-2 leading-relaxed">
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="#terms" className="hover:underline">Điều khoản</a>
              <span>·</span>
              <a href="#privacy" className="hover:underline">Quyền riêng tư</a>
              <span>·</span>
              <a href="#guidelines" className="hover:underline">Nguyên tắc</a>
            </div>
            <p className="mt-2">© 2026 BlogViet, Inc.</p>
          </div>
        </aside>
      </div>

      {/* ========================================================
          4. MOBILE BOTTOM NAVIGATION BAR - CHỈ HIỆN TRÊN MOBILE (md:!hidden)
          ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around z-40 md:!hidden">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `p-2 flex items-center justify-center ${isActive ? "text-zinc-950 dark:text-white font-bold" : "text-zinc-500"}`
          }
        >
          <Home className="w-5 h-5" />
        </NavLink>

        <NavLink
          to="/trending"
          className={({ isActive }) =>
            `p-2 flex items-center justify-center ${isActive ? "text-zinc-950 dark:text-white font-bold" : "text-zinc-500"}`
          }
        >
          <Search className="w-5 h-5" />
        </NavLink>

        {/* Nút Tạo Bài Nhanh Mobile (+) */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-9 h-9 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center active:scale-95 shadow"
        >
          <Plus className="w-4 h-4" />
        </button>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `p-2 flex items-center justify-center relative ${isActive ? "text-zinc-950 dark:text-white font-bold" : "text-zinc-500"}`
          }
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </NavLink>

        <NavLink
          to={`/profile/${currentUserId}`}
          className={({ isActive }) =>
            `p-2 flex items-center justify-center ${isActive ? "text-zinc-950 dark:text-white font-bold" : "text-zinc-500"}`
          }
        >
          <User className="w-5 h-5" />
        </NavLink>
      </div>

      {/* Modal Soạn Thảo Bài Viết Toàn Cục */}
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
