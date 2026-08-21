import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, UserPlus, Heart, Users, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import followService from "../services/followService";
import friendService from "../services/friendService";
import { toast } from "sonner";
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
  const [friendIds, setFriendIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState([]);
  const [followLoadingMap, setFollowLoadingMap] = useState({});

  useEffect(() => {
    if (!isOpen || !postId) return;

    let cancelled = false;
    setLoading(true);

    // 1. Fetch likers
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

    // 2. Fetch friend IDs from Database to prioritize friends at the top
    if (currentUserId) {
      friendService
        .getFriendsList(currentUserId)
        .then((res) => {
          if (!cancelled && Array.isArray(res.data)) {
            const ids = new Set(
              res.data.map((f) => Number(f.id || f.friendId || f.userId)).filter(Boolean)
            );
            setFriendIds(ids);
          }
        })
        .catch(() => {});

      // 3. Fetch user following IDs from Database
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

  // Sắp xếp ưu tiên: 1. Chính mình -> 2. Bạn bè (Friends) -> 3. Đang theo dõi -> 4. Người khác
  const sortedList = useMemo(() => {
    const list = reactionsList.map(getUserData);
    return [...list].sort((a, b) => {
      const aId = Number(a.id);
      const bId = Number(b.id);

      // 1. Chính mình lên đầu
      if (aId === Number(currentUserId)) return -1;
      if (bId === Number(currentUserId)) return 1;

      // 2. ƯU TIÊN BẠN BÈ (Friends) LÊN TRÊN CÙNG
      const aIsFriend = friendIds.has(aId);
      const bIsFriend = friendIds.has(bId);
      if (aIsFriend && !bIsFriend) return -1;
      if (!aIsFriend && bIsFriend) return 1;

      // 3. Ưu tiên người đang theo dõi
      const aIsFollowing = followingIds.includes(aId);
      const bIsFollowing = followingIds.includes(bId);
      if (aIsFollowing && !bIsFollowing) return -1;
      if (!aIsFollowing && bIsFollowing) return 1;

      return 0;
    });
  }, [reactionsList, friendIds, followingIds, currentUserId]);

  if (!isOpen) return null;

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
        toast.success(`Đang theo dõi`);
      }
    } catch {
      toast.error("Không thể thay đổi trạng thái theo dõi lúc này!");
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  if (typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header Modal */}
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
                {sortedList.length || totalLikeCount} lượt thích
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
          ) : sortedList.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs">
              Chưa có ai thả tim bài viết này.
            </div>
          ) : (
            sortedList.map((user, idx) => {
              const targetId = Number(user.id);
              const isMe = targetId === Number(currentUserId);
              const isFriend = friendIds.has(targetId);
              const isFollowing = followingIds.includes(targetId);
              const isFollowLoading = !!followLoadingMap[targetId];

              return (
                <div
                  key={user.id || idx}
                  className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/60 rounded-2xl transition"
                >
                  <div
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${user.id}`);
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                  >
                    <Avatar
                      userId={user.id}
                      src={user.avatarUrl}
                      name={user.fullName || user.username}
                      username={user.username}
                      avatarColor={user.avatarColor}
                      size="w-10 h-10"
                      className="border border-slate-200 dark:border-slate-800 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate">
                          {user.fullName || user.username}
                        </span>
                        {isFriend && (
                          <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shrink-0">
                            <Users className="w-2.5 h-2.5" />
                            Bạn bè
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      type="button"
                      disabled={isFollowLoading}
                      onClick={() => handleToggleFollow(targetId)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer ${
                        isFollowing
                          ? "bg-slate-100 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600"
                          : "bg-black text-white dark:bg-white dark:text-black hover:opacity-90 shadow-2xs"
                      }`}
                    >
                      {isFollowLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Đang theo dõi</span>
                        </>
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
    </div>,
    document.body
  );
}
