import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  X,
  Home,
  Compass,
  Radio,
  Users,
  Bookmark,
  BarChart2,
  Shield,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  UserPlus,
  Check,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import friendService from "../services/friendService";
import followService from "../services/followService";

const TRENDING_TAGS = [
  { tag: "#Vinahouse", count: "1.2k" },
  { tag: "#IT", count: "3.4k" },
  { tag: "#Chung", count: "5.8k" },
  { tag: "#LapTrinh", count: "2.1k" },
  { tag: "#DuLich", count: "980" },
  { tag: "#AI", count: "4.5k" },
  { tag: "#DoiSong", count: "1.8k" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function MobileNavDrawer({ isOpen, onClose, isDark, onToggleTheme }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [stats, setStats] = useState({
    postCount: 0,
    totalViews: 0,
    friendCount: 0,
  });

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);

  // Load user stats and suggested friends for mobile drawer
  useEffect(() => {
    if (!isOpen) return;

    if (currentUserId) {
      userService
        .getUserStats(currentUserId)
        .then((res) => {
          if (res.data) {
            setStats((prev) => ({
              ...prev,
              postCount: res.data.postCount || res.data.totalPosts || 0,
              totalViews: res.data.totalViews || res.data.viewCount || 0,
            }));
          }
        })
        .catch(() => {});

      friendService
        .getFriendCount(currentUserId)
        .then((res) => {
          setStats((prev) => ({
            ...prev,
            friendCount: typeof res.data === "number" ? res.data : res.data?.count || 0,
          }));
        })
        .catch(() => {});

      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          const ids = Array.isArray(res.data) ? res.data.map(Number) : [];
          setFollowingIds(ids);
        })
        .catch(() => {});
    }

    // Suggested users
    userService
      .getAll("", 0, 5)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        const filtered = list.filter((u) => Number(u.id) !== currentUserId).slice(0, 3);
        setSuggestedUsers(filtered);
      })
      .catch(() => {});
  }, [isOpen, currentUserId]);

  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
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

  return (
    <div className="fixed inset-0 z-[99999] flex justify-start bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[85vw] max-w-sm h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-black text-xs">
              BV
            </span>
            BlogViet Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
          {/* 1. Mobile Shortcut Profile Card with Stats */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex flex-col gap-3">
              <Link
                to={`/profile/${currentUserId}`}
                onClick={onClose}
                className="flex items-center gap-3"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-xs"
                    style={{ backgroundColor: currentUser.avatarColor || "#27272a" }}
                  >
                    {getInitials(currentUser.fullName || currentUser.username)}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {currentUser.fullName || currentUser.username}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">
                    @{currentUser.username}
                  </span>
                </div>
              </Link>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.postCount}
                  </span>
                  <span className="text-[10px] text-zinc-500">Bài viết</span>
                </div>
                <div className="flex flex-col border-x border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.totalViews}
                  </span>
                  <span className="text-[10px] text-zinc-500">Lượt xem</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {stats.friendCount}
                  </span>
                  <span className="text-[10px] text-zinc-500">Bạn bè</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center flex flex-col gap-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Đăng nhập để trải nghiệm trọn vẹn BlogViet
              </p>
              <Link
                to="/login"
                onClick={onClose}
                className="py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold shadow-xs"
              >
                Đăng nhập ngay
              </Link>
            </div>
          )}

          {/* 2. Navigation Menu */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 mb-1">
              Menu điều hướng
            </span>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`
                }
              >
                <Icon strokeWidth={1.75} className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* 3. Chủ đề thịnh hành (Trending Tags) */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                Chủ đề thịnh hành
              </span>
              <span className="text-[9px] text-zinc-500 font-mono">Hot #</span>
            </span>
            <div className="flex flex-wrap gap-1.5 px-1">
              {TRENDING_TAGS.map((item) => (
                <Link
                  key={item.tag}
                  to={`/search?q=${encodeURIComponent(item.tag.replace("#", ""))}`}
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center gap-1"
                >
                  <span>{item.tag}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({item.count})</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 4. Gợi ý theo dõi tác giả (Suggested Friends on Mobile) */}
          {suggestedUsers.length > 0 && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Gợi ý theo dõi
                </span>
                <Link
                  to="/friends"
                  onClick={onClose}
                  className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {suggestedUsers.map((user) => {
                  const isFollowing = followingIds.includes(Number(user.id));
                  const name = user.fullName || user.username;
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60"
                    >
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 min-w-0 flex-1 pr-2"
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
                            style={{ backgroundColor: user.avatarColor || "#3f3f46" }}
                          >
                            {getInitials(name)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {name}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate">
                            @{user.username}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(user)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                          isFollowing
                            ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-rose-600"
                            : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 shadow-xs"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Đang theo dõi</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Theo dõi</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-1.5 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => {
              onToggleTheme?.();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition w-full cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-zinc-500" />}
            <span>{isDark ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}</span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
                navigate("/login");
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition w-full cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* Backdrop click closer */}
      <div className="flex-1" onClick={onClose} />
    </div>
  );
}
