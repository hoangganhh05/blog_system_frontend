import { useState, useEffect } from "react";
import { X, Loader2, UserPlus, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import followService from "../services/followService";
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

export default function ReactionsModal({
  postId,
  isOpen = true,
  onClose,
  totalLikeCount = 0,
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [reactionsList, setReactionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  useEffect(() => {
    if (!isOpen || !postId) return;

    let cancelled = false;
    setLoading(true);

    // Fetch likers
    likeService
      .getReactionsList(postId)
      .then((resLikes) => {
        if (cancelled) return;

        let rawLikes = [];
        if (Array.isArray(resLikes.data)) {
          rawLikes = resLikes.data;
        } else if (resLikes.data?.content) {
          rawLikes = resLikes.data.content;
        } else if (resLikes.data?.data) {
          rawLikes = resLikes.data.data;
        }

        setReactionsList(rawLikes);
      })
      .catch((err) => {
        console.error("Lỗi lấy danh sách người thả tim:", err);
        if (!cancelled) setReactionsList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Fetch user following IDs from Database
    if (currentUserId) {
      followService
        .getFollowingIds(currentUserId)
        .then((res) => {
          if (!cancelled && Array.isArray(res.data)) {
            setFollowingIds(res.data.map(Number));
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, postId, currentUserId]);

  if (!isOpen) return null;

  const getUserData = (item) => {
    if (item.userId && item.username) {
      return {
        id: item.userId,
        username: item.username,
        fullName: item.fullName,
        avatarUrl: item.avatarUrl,
        avatarColor: item.avatarColor,
      };
    }
    const user = item.user || item.author || {};
    return {
      id: user.id || item.id,
      username: user.username || item.username,
      fullName: user.fullName || item.fullName,
      avatarUrl: user.avatarUrl || item.avatarUrl,
      avatarColor: user.avatarColor || item.avatarColor,
    };
  };

  const normalizedList = reactionsList.map(getUserData);

  const handleToggleFollow = async (targetUser) => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const targetId = Number(targetUser.id);
    if (!targetId || targetId === Number(currentUserId)) return;

    const isFollowing = followingIds.includes(targetId);
    const targetName = targetUser.fullName || targetUser.username;

    setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    try {
      if (isFollowing) {
        await followService.unfollowUser(targetId);
        setFollowingIds((prev) => prev.filter((id) => id !== targetId));
        toast.info(`Đã hủy theo dõi ${targetName}`);
      } else {
        await followService.followUser(targetId);
        setFollowingIds((prev) => [...prev, targetId]);
        toast.success(`Đang theo dõi ${targetName}!`);
      }
    } catch {
      toast.error("Không thể thay đổi trạng thái theo dõi lúc này!");
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Modal Tối giản */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Người đã thả tim
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {normalizedList.length || totalLikeCount} lượt thích
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách người thả tim */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Đang tải danh sách...</span>
            </div>
          ) : normalizedList.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Chưa có ai thả tim bài viết này.
            </div>
          ) : (
            normalizedList.map((user, idx) => {
              const isMe = Number(user.id) === Number(currentUserId);
              const isFollowing = followingIds.includes(Number(user.id));
              const isFollowLoading = followLoadingMap[Number(user.id)];

              return (
                <div
                  key={user.id || idx}
                  className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition gap-3"
                >
                  {/* User Profile Info */}
                  <div
                    onClick={() => {
                      onClose?.();
                      navigate(`/profile/${user.id}`);
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    {/* Avatar with Heart badge */}
                    <div className="relative shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs"
                          style={{
                            backgroundColor: user.avatarColor || "#475569",
                          }}
                        >
                          {getInitials(user.fullName || user.username)}
                        </div>
                      )}

                      {/* Small heart badge on avatar */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 border border-white dark:border-[#111827] flex items-center justify-center shadow-xs">
                        <Heart className="w-2.5 h-2.5 fill-white text-white" />
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate hover:underline">
                        {user.fullName || user.username}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  {/* Follow Button */}
                  {!isMe && currentUserId && (
                    <button
                      type="button"
                      disabled={isFollowLoading}
                      onClick={() => handleToggleFollow(user)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        isFollowing
                          ? "bg-slate-100 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200"
                          : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90 active:scale-95 shadow-xs"
                      }`}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <span>Đang theo dõi</span>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Theo dõi</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
