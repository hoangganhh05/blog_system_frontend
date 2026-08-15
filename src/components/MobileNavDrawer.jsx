import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import friendService from "../services/friendService";
import followService from "../services/followService";
import {
  Home,
  Compass,
  Radio,
  Users,
  Bookmark,
  BarChart2,
  Settings,
  Sun,
  Moon,
  LogOut,
  X,
  TrendingUp,
  UserPlus,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  isDark,
  onToggleTheme,
}) {
  const { currentUser, logout } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    postCount: 0,
    totalViews: 0,
    friendCount: 0,
    followerCount: 0,
  });

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);

  // Load User Stats & Suggestions when open
  useEffect(() => {
    if (!isOpen) return;

    if (currentUserId) {
      userService
        .getStats(currentUserId)
        .then((res) => {
          if (res.data) setStats((prev) => ({ ...prev, ...res.data }));
        })
        .catch(() => {});

      friendService
        .getFriendCount(currentUserId)
        .then((res) => {
          if (res.data) setStats((prev) => ({ ...prev, friendCount: res.data.count || 0 }));
        })
        .catch(() => {});

      followService
        .getFollowCounts(currentUserId)
        .then((res) => {
          if (res.data) setStats((prev) => ({ ...prev, followerCount: res.data.followerCount || 0 }));
        })
        .catch(() => {});

      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          if (Array.isArray(res.data)) {
            setFollowingIds(res.data.map(Number));
          }
        })
        .catch(() => {});

      userService
        .getAll("", 0, 5)
        .then((res) => {
          const list = res.data?.content || res.data || [];
          setSuggestedUsers(
            list.filter((u) => Number(u.id) !== Number(currentUserId)).slice(0, 4)
          );
        })
        .catch(() => {});
    }
  }, [isOpen, currentUserId]);

  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
      onClose();
      navigate("/login");
      toast.error("Vui lòng đăng nhập để theo dõi!");
      return;
    }

    const isFollowing = followingIds.includes(Number(targetUser.id));
    const targetName = targetUser.fullName || targetUser.username;

    if (isFollowing) {
      try {
        await followService.unfollowUser(targetUser.id);
        setFollowingIds((prev) => prev.filter((id) => id !== Number(targetUser.id)));
        toast.info(`Đã hủy theo dõi ${targetName}`);
      } catch {
        toast.error("Không thể hủy theo dõi!");
      }
    } else {
      try {
        await followService.followUser(targetUser.id);
        setFollowingIds((prev) => [...prev, Number(targetUser.id)]);
        toast.success(`Đang theo dõi ${targetName}!`);
      } catch {
        toast.error("Không thể theo dõi!");
      }
    }
  };

  if (!isOpen) return null;

  const navLinks = [
    { to: "/", label: "Bảng tin trang chủ", icon: Home },
    { to: "/search", label: "Khám phá xu hướng", icon: Compass },
    { to: "/radio", label: "Phòng nhạc & Radio", icon: Radio },
    { to: "/friends", label: "Bạn bè & Kết nối", icon: Users },
    { to: "/bookmarks", label: "Bài viết đã lưu", icon: Bookmark },
    { to: "/dashboard", label: "Bảng điều khiển", icon: BarChart2 },
  ];

  const drawerContent = (
    <div
      className="fixed inset-0 z-[999999] flex justify-start bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-[84vw] max-w-xs h-full bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header (Always top-pinned, clean alignment) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#111827]">
          <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-black text-xs">
              BV
            </span>
            BlogViet Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {/* 1. Mobile Shortcut Profile Card with Stats */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col gap-3">
              <Link
                to={`/profile/${currentUserId}`}
                onClick={onClose}
                className="flex items-center gap-3 group"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs"
                    style={{ backgroundColor: currentUser.avatarColor || "#475569" }}
                  >
                    {getInitials(currentUser.fullName || currentUser.username)}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                    {currentUser.fullName || currentUser.username}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    @{currentUser.username}
                  </span>
                </div>
              </Link>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/80 dark:border-slate-700/60 text-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.postCount}
                  </span>
                  <span className="text-[10px] text-zinc-400">Bài viết</span>
                </div>
                <div className="flex flex-col border-x border-slate-200/80 dark:border-slate-700/60">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.followerCount}
                  </span>
                  <span className="text-[10px] text-zinc-400">Theo dõi</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.friendCount}
                  </span>
                  <span className="text-[10px] text-zinc-400">Bạn bè</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center flex flex-col gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Chào mừng bạn đến BlogViet!
              </span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Đăng nhập để chia sẻ câu chuyện, nghe nhạc và kết nối cùng bạn bè.
              </p>
              <Link
                to="/login"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold shadow-xs hover:opacity-90 transition mt-1"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* 2. Navigation Shortcuts */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2">
              Lối tắt ứng dụng
            </span>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-black dark:text-white font-bold shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* 3. Trending Hashtags (Parity from RightSidebar) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 px-2 text-zinc-900 dark:text-zinc-100 font-bold text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
              <span>Chủ đề thịnh hành</span>
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              {["#CongNgheAI", "#LapTrinhWeb", "#AmNhacLofi", "#DoiSong", "#GiaiTri"].map((tag) => (
                <Link
                  key={tag}
                  to={`/search?q=${encodeURIComponent(tag.replace("#", ""))}`}
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* 4. Suggested Friends to Follow (Parity with RightSidebar) */}
          {suggestedUsers.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2">
                Gợi ý theo dõi
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestedUsers.map((user) => {
                  const isFollowing = followingIds.includes(Number(user.id));
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition gap-2"
                    >
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 min-w-0 flex-1"
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
                            style={{ backgroundColor: user.avatarColor || "#475569" }}
                          >
                            {getInitials(user.fullName || user.username)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {user.fullName || user.username}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate">
                            @{user.username}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(user)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                          isFollowing
                            ? "bg-slate-200 dark:bg-slate-700 text-zinc-800 dark:text-zinc-200"
                            : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90"
                        }`}
                        title={isFollowing ? "Đang theo dõi" : "Theo dõi"}
                      >
                        {isFollowing ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions (Always bottom-pinned, clean alignment) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleTheme?.();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-500" />
              )}
              <span>{isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-zinc-500">
              {isDark ? "Dark" : "Light"}
            </span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition w-full text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
