import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import followService from "../services/followService";
import MiniMusicPlayer from "./MiniMusicPlayer";
import { isUserOnline, formatLastActive } from "../utils/statusUtils";
import Avatar from "./Avatar";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function RightSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    userService
      .getAll("", 0, 10)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
        // Lọc bỏ chính mình
        const filtered = list.filter((u) => Number(u.id) !== currentUserId).slice(0, 4);
        setSuggestedUsers(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    if (currentUserId) {
      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          const ids = Array.isArray(res.data) ? res.data.map(Number) : [];
          setFollowingIds(ids);
        })
        .catch(() => {});
    }
  }, [currentUserId]);

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
      toast.error("Vui lòng đăng nhập để theo dõi!");
      return;
    }

    const targetIdNum = Number(targetUser.id);
    const isFollowing = followingIds.includes(targetIdNum);
    const targetName = targetUser.fullName || targetUser.username;

    // 1. Optimistic Update (Immediate UI response)
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

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Mini Music Player (Vinahouse / Lofi Focus) */}
      <MiniMusicPlayer />

      {/* 2. Gợi ý kết bạn & Theo dõi (Suggestions for You) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Gợi ý cho bạn
          </span>
          <Link
            to="/friends"
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-2.5 w-14 bg-zinc-100 dark:bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="w-14 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <span className="text-xs text-zinc-400 py-2 text-center">
            Chưa có gợi ý người dùng mới
          </span>
        ) : (
          <div className="flex flex-col gap-3">
            {suggestedUsers.map((user) => {
              const isFollowing = followingIds.includes(Number(user.id));
              const displayName = user.fullName || user.username;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 p-1 -mx-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-200"
                >
                  <Link
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-2.5 min-w-0 group"
                  >
                    <Avatar
                      userId={user.id}
                      src={user.avatarUrl}
                      name={displayName}
                      username={user.username}
                      avatarColor={user.avatarColor}
                      size="w-9 h-9"
                      hideStatus={true}
                      className="border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200"
                    />

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-150 active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer ${
                      isFollowing
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                        : "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-2xs"
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
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
        )}
      </div>

      {/* 3. Footer Bản quyền & Thông tin */}
      <div className="px-2 text-[11px] text-zinc-400 dark:text-zinc-500 leading-relaxed flex flex-col gap-1">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link to="/about" className="hover:underline">
            Giới thiệu
          </Link>
          <span>·</span>
          <Link to="/security" className="hover:underline">
            Bảo mật
          </Link>
          <span>·</span>
          <Link to="/trending" className="hover:underline">
            Khám phá
          </Link>
          <span>·</span>
          <a
            href="https://github.com/hoangganhh05"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Tác giả Hoàng Anh
          </a>
        </div>
        <span>© 2026 BlogViet Platform. All rights reserved.</span>
      </div>
    </div>
  );
}
