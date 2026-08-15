import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";
import userService from "../services/userService";
import friendService from "../services/friendService";
import followService from "../services/followService";
import Avatar from "./Avatar";
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
  Search,
} from "lucide-react";
import { toast } from "sonner";

import Logo from "./Logo";

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
  const {
    showMiniPlayer,
    toggleMiniPlayer,
    isMiniPlayerVisible,
    isPlaying,
    currentTrack,
  } = useMusic();
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
  const [drawerSearchQuery, setDrawerSearchQuery] = useState("");

  // Load User Stats & Suggestions when open
  useEffect(() => {
    if (!isOpen) return;

    if (currentUserId) {
      userService
        .getUserStats(currentUserId)
        .then((res) => {
          if (res?.data) {
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
          if (res?.data) {
            setStats((prev) => ({ ...prev, friendCount: res.data.count || 0 }));
          }
        })
        .catch(() => {});

      followService
        .getFollowCounts(currentUserId)
        .then((res) => {
          if (res?.data) {
            setStats((prev) => ({ ...prev, followerCount: res.data.followerCount || 0 }));
          }
        })
        .catch(() => {});

      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          if (Array.isArray(res?.data)) {
            setFollowingIds(res.data.map(Number));
          }
        })
        .catch(() => {});

      userService
        .getAll("", 0, 5)
        .then((res) => {
          const list = res?.data?.content || res?.data || [];
          if (Array.isArray(list)) {
            setSuggestedUsers(
              list.filter((u) => Number(u.id) !== Number(currentUserId)).slice(0, 4)
            );
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUserId]);

  // Sync follow state across components
  useEffect(() => {
    const handleFollowChange = (e) => {
      const { targetUserId, isFollowing } = e.detail || {};
      if (!targetUserId) return;
      setFollowingIds((prev) => {
        const idNum = Number(targetUserId);
        if (isFollowing) {
          return prev.includes(idNum) ? prev : [...prev, idNum];
        } else {
          return prev.filter((id) => id !== idNum);
        }
      });
    };

    window.addEventListener("follow_state_changed", handleFollowChange);
    return () => window.removeEventListener("follow_state_changed", handleFollowChange);
  }, []);

  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
      onClose();
      navigate("/login");
      toast.error("Vui lòng đăng nhập để theo dõi!");
      return;
    }

    const targetIdNum = Number(targetUser.id);
    const isFollowing = followingIds.includes(targetIdNum);
    const targetName = targetUser.fullName || targetUser.username;

    // 1. Optimistic Update
    if (isFollowing) {
      setFollowingIds((prev) => prev.filter((id) => id !== targetIdNum));
      toast.info(`Đã hủy theo dõi ${targetName}`);
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: targetIdNum, isFollowing: false },
        })
      );
      try {
        await followService.unfollowUser(targetUser.id);
      } catch {
        // Rollback
        setFollowingIds((prev) => [...prev, targetIdNum]);
        toast.error("Không thể hủy theo dõi!");
        window.dispatchEvent(
          new CustomEvent("follow_state_changed", {
            detail: { targetUserId: targetIdNum, isFollowing: true },
          })
        );
      }
    } else {
      setFollowingIds((prev) => [...prev, targetIdNum]);
      toast.success(`Đang theo dõi ${targetName}!`);
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: targetIdNum, isFollowing: true },
        })
      );
      try {
        await followService.followUser(targetUser.id);
      } catch {
        // Rollback
        setFollowingIds((prev) => prev.filter((id) => id !== targetIdNum));
        toast.error("Không thể theo dõi!");
        window.dispatchEvent(
          new CustomEvent("follow_state_changed", {
            detail: { targetUserId: targetIdNum, isFollowing: false },
          })
        );
      }
    }
  };

  if (!isOpen) return null;

  const navLinks = [
    { to: "/", label: "Bảng tin trang chủ", icon: Home },
    { to: "/trending", label: "Khám phá xu hướng", icon: Compass },
    { to: "/radio", label: "Phòng nhạc & Radio", icon: Radio },
    { to: "/friends", label: "Bạn bè & Kết nối", icon: Users },
    { to: "/saved", label: "Bài viết đã lưu", icon: Bookmark },
    { to: "/dashboard", label: "Bảng điều khiển", icon: BarChart2 },
  ];

  const drawerContent = (
    <div
      className="fixed inset-0 z-[999999] flex justify-start bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-[84vw] max-w-xs h-full bg-white dark:bg-[#242526] border-r border-[#e4e6eb] dark:border-[#393a3b] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header (Always top-pinned, clean alignment) */}
        <div className="p-4 border-b border-[#e4e6eb] dark:border-[#393a3b] flex items-center justify-between shrink-0 bg-white dark:bg-[#242526]">
          <span className="font-extrabold text-base text-[#050505] dark:text-[#e4e6eb] flex items-center gap-2">
            <Logo size="sm" />
            BlogViet Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-[#303031] transition cursor-pointer"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col gap-4 custom-scrollbar touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Mobile Drawer Search Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (drawerSearchQuery.trim()) {
                navigate(`/search?q=${encodeURIComponent(drawerSearchQuery.trim())}`);
                setDrawerSearchQuery("");
                onClose();
              }
            }}
            className="relative w-full"
          >
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm bài viết, tác giả..."
              value={drawerSearchQuery}
              onChange={(e) => setDrawerSearchQuery(e.target.value)}
              className="w-full bg-[#f0f2f5] dark:bg-[#3a3b3c] border border-transparent focus:border-[#0866ff] rounded-xl py-2 pl-9 pr-3 text-xs text-[#050505] dark:text-[#e4e6eb] placeholder-[#65676b] dark:placeholder-[#b0b3b8] focus:outline-none transition"
            />
          </form>

          {/* 1. Mobile Shortcut Profile Card with Stats */}
          {currentUser ? (
            <div className="p-3.5 rounded-2xl bg-[#f0f2f5] dark:bg-[#18191a] border border-[#e4e6eb] dark:border-[#393a3b] flex flex-col gap-3">
              <Link
                to={`/profile/${currentUserId}`}
                onClick={onClose}
                className="flex items-center gap-3 group"
              >
                                <Avatar
                  userId={currentUserId}
                  src={currentUser.avatarUrl}
                  name={currentUser.fullName || currentUser.username}
                  username={currentUser.username}
                  avatarColor={currentUser.avatarColor}
                  size="lg"
                  onClick={() => onClose()}
                  className="border border-[#e4e6eb] dark:border-[#393a3b] shadow-xs"
                />

                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-[#050505] dark:text-[#e4e6eb] truncate group-hover:underline">
                    {currentUser.fullName || currentUser.username}
                  </span>
                  <span className="text-xs text-[#65676b] dark:text-[#b0b3b8] truncate">
                    @{currentUser.username}
                  </span>
                </div>
              </Link>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#e4e6eb] dark:border-[#393a3b] text-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {stats.postCount}
                  </span>
                  <span className="text-[10px] text-[#65676b] dark:text-[#b0b3b8]">Bài viết</span>
                </div>
                <div className="flex flex-col border-x border-[#e4e6eb] dark:border-[#393a3b]">
                  <span className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {stats.followerCount}
                  </span>
                  <span className="text-[10px] text-[#65676b] dark:text-[#b0b3b8]">Theo dõi</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                    {stats.friendCount}
                  </span>
                  <span className="text-[10px] text-[#65676b] dark:text-[#b0b3b8]">Bạn bè</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#f0f2f5] dark:bg-[#18191a] border border-[#e4e6eb] dark:border-[#393a3b] text-center flex flex-col gap-2">
              <span className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb]">
                Chào mừng bạn đến BlogViet!
              </span>
              <p className="text-[11px] text-[#65676b] dark:text-[#b0b3b8] leading-relaxed">
                Đăng nhập để chia sẻ câu chuyện, nghe nhạc và kết nối cùng bạn bè.
              </p>
              <Link
                to="/login"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-[#0866ff] hover:bg-[#0756d6] text-white text-xs font-bold shadow-xs transition mt-1"
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
                onClick={() => {
                  if (to === "/radio") {
                    showMiniPlayer();
                  }
                  onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#0866ff]/10 text-[#0866ff] font-bold shadow-xs"
                      : "text-[#65676b] dark:text-[#b0b3b8] hover:text-[#050505] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#303031]"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}

            {/* Trợ lý AI Gemini Shortcut */}
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("open_ai_assistant"));
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>Trợ lý BlogViet AI</span>
              </div>
              <span className="text-[10px] font-bold bg-indigo-200/80 dark:bg-indigo-900/80 px-2 py-0.5 rounded-full">
                Gemini 3.7
              </span>
            </button>
          </div>

          {/* 3. Follow Suggestions Section */}
          {suggestedUsers.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#e4e6eb] dark:border-[#393a3b]">
              <div className="flex items-center justify-between px-2">
                <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0866ff]" />
                  Gợi ý kết nối
                </span>
                <Link
                  to="/friends"
                  onClick={onClose}
                  className="text-[11px] font-bold text-[#0866ff] hover:underline"
                >
                  Xem thêm
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {suggestedUsers.map((user) => {
                  const isFollowing = followingIds.includes(Number(user.id));
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#f0f2f5] dark:bg-[#18191a] border border-[#e4e6eb] dark:border-[#393a3b] gap-2"
                    >
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={onClose}
                        className="flex items-center gap-2 min-w-0 flex-1 group"
                      >
                                                <Avatar
                          userId={user.id}
                          src={user.avatarUrl}
                          name={user.fullName || user.username}
                          username={user.username}
                          avatarColor={user.avatarColor}
                          size="w-8 h-8"
                          onClick={() => onClose()}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#050505] dark:text-[#e4e6eb] truncate group-hover:underline">
                            {user.fullName || user.username}
                          </span>
                          <span className="text-[10px] text-[#65676b] dark:text-[#b0b3b8] truncate">
                            @{user.username}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleToggleFollow(user)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                          isFollowing
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-[#0866ff] hover:bg-[#0756d6] text-white shadow-xs"
                        }`}
                      >
                        {isFollowing ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Đã theo dõi</span>
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

        {/* Drawer Footer Actions (Always bottom-pinned, clean alignment) */}
        <div className="p-3 border-t border-[#e4e6eb] dark:border-[#393a3b] bg-white dark:bg-[#242526] flex flex-col gap-1 shrink-0">
          {/* Nút bật/mở thanh phát nhạc Mini */}
          <button
            type="button"
            onClick={() => {
              showMiniPlayer();
              onClose();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#303031] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Thanh phát nhạc Mini</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                isMiniPlayerVisible
                  ? "bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                  : "bg-[#f0f2f5] dark:bg-[#18191a] text-[#65676b] dark:text-[#b0b3b8]"
              }`}
            >
              {isMiniPlayerVisible ? (isPlaying ? "Đang phát" : "Đang bật") : "Bật lại"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleTheme?.();
            }}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#050505] dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#303031] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-zinc-500" />
              )}
              <span>{isDark ? "Chế độ Sáng" : "Chế độ Tối"}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f0f2f5] dark:bg-[#18191a] text-[#65676b] dark:text-[#b0b3b8]">
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
