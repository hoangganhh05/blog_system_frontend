import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Check, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import followService from "../services/followService";
import MiniSoundscapePlayer from "./MiniSoundscapePlayer";
import { isUserOnline, formatLastActive } from "../utils/statusUtils";
import Avatar from "./Avatar";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function RightSidebar() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser
    ? Number(currentUser.id || currentUser.userId)
    : null;

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    userService
      .getAll("", 0, 10)
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.content || [];
        // Lọc bỏ chính mình
        const filtered = list
          .filter((u) => Number(u.id) !== currentUserId)
          .slice(0, 4);
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
    return () =>
      window.removeEventListener("follow_state_changed", handleFollowChange);
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
        }),
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
          }),
        );
      }
    } else {
      setFollowingIds((prev) => [...prev, targetIdNum]);
      toast.success(`Đang theo dõi ${targetName}!`);
      window.dispatchEvent(
        new CustomEvent("follow_state_changed", {
          detail: { targetUserId: targetIdNum, isFollowing: true },
        }),
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
          }),
        );
      }
    }
  };

  return (
    <div className="w-full min-h-0 flex flex-col space-y-3 px-1 pb-16">
      {/* 1. Mini Soundscape Player (Environmental Ambient Audio) */}
      <MiniSoundscapePlayer />

      {/* Đường gạch ngang phân cách dài */}
      <div className="border-t border-slate-200 dark:border-zinc-800 my-1" />

      {/* 2. Gợi ý kết bạn & Theo dõi (Suggestions for You - Dạng phẳng không viền hộp) */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Gợi ý cho bạn
          </span>
          <Link
            to="/friends"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-zinc-800" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-3.5 w-20 bg-slate-200 dark:bg-zinc-800 rounded" />
                    <div className="h-2.5 w-14 bg-slate-100 dark:bg-zinc-900 rounded" />
                  </div>
                </div>
                <div className="w-16 h-7 rounded-full bg-slate-200 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : suggestedUsers.length === 0 ? (
          <span className="text-xs text-zinc-400 py-2 text-center">
            Chưa có gợi ý người dùng mới
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {suggestedUsers.map((user) => {
              const isFollowing = followingIds.includes(Number(user.id));
              const displayName = user.fullName || user.username;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800/60 transition-all duration-300 ease-out hover:translate-x-1"
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
                      <span className="text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:underline">
                        {displayName}
                      </span>
                      <span className="text-xs text-zinc-500 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("open_floating_chat", {
                            detail: { user },
                          }),
                        );
                      }}
                      className="p-1.5 rounded-full text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                      title={`Nhắn tin với ${displayName}`}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(user)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isFollowing
                          ? "bg-slate-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                          : "bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-2xs"
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden sm:inline">
                            Đang theo dõi
                          </span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Theo dõi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Đường gạch ngang phân cách dài */}
      <div className="border-t border-slate-200 dark:border-zinc-800 my-1" />

      {/* 3. Footer Bản quyền & Thông tin */}
      <div className="px-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1">
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
        <span className="text-[11px] text-zinc-400">
          © 2026 BlogViet Platform. All rights reserved.
        </span>
      </div>
    </div>
  );
}
