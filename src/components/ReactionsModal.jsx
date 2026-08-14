import { useState, useEffect } from "react";
import { X, Loader2, UserPlus, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import likeService from "../services/likeService";
import friendService from "../services/friendService";

const REACTIONS_MAP = [
  { type: "LIKE", label: "Thích", emoji: "👍" },
  { type: "LOVE", label: "Yêu thích", emoji: "❤️" },
  { type: "HAHA", label: "Haha", emoji: "😆" },
  { type: "WOW", label: "Wow", emoji: "😮" },
  { type: "SAD", label: "Buồn", emoji: "😢" },
  { type: "ANGRY", label: "Phẫn nộ", emoji: "😡" },
];

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

  const [activeTab, setActiveTab] = useState("ALL");
  const [reactionsList, setReactionsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});

  useEffect(() => {
    if (!isOpen || !postId) return;

    let cancelled = false;
    setLoading(true);

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
        console.error("Lỗi lấy danh sách cảm xúc:", err);
        if (!cancelled) setReactionsList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const getUserData = (item) => {
    if (item.userId && item.username) {
      return {
        id: item.userId,
        username: item.username,
        fullName: item.fullName,
        avatarUrl: item.avatarUrl,
        avatarColor: item.avatarColor,
        type: item.type || "LIKE",
      };
    }
    const user = item.user || item.author || {};
    return {
      id: user.id || item.id,
      username: user.username || item.username,
      fullName: user.fullName || item.fullName,
      avatarUrl: user.avatarUrl || item.avatarUrl,
      avatarColor: user.avatarColor || item.avatarColor,
      type: item.type || item.reactionType || "LIKE",
    };
  };

  const normalizedList = reactionsList.map(getUserData);

  // Group reaction counts for tabs
  const tabCounts = { ALL: normalizedList.length };
  REACTIONS_MAP.forEach((r) => {
    tabCounts[r.type] = normalizedList.filter(
      (u) => (u.type || "LIKE").toUpperCase() === r.type
    ).length;
  });

  const availableTabs = [
    { type: "ALL", label: "Tất cả", icon: "✨", count: tabCounts.ALL },
    ...REACTIONS_MAP.filter((r) => tabCounts[r.type] > 0).map((r) => ({
      type: r.type,
      label: r.label,
      icon: r.emoji,
      count: tabCounts[r.type],
    })),
  ];

  const filteredUsers =
    activeTab === "ALL"
      ? normalizedList
      : normalizedList.filter(
          (u) => (u.type || "LIKE").toUpperCase() === activeTab.toUpperCase()
        );

  const getReactionEmoji = (type) => {
    const found = REACTIONS_MAP.find(
      (r) => r.type === (type || "LIKE").toUpperCase()
    );
    return found ? found.emoji : "👍";
  };

  const handleToggleFollow = async (userId) => {
    if (!currentUserId) {
      navigate("/login");
      return;
    }
    const currentFollowState = followingMap[userId];
    // Optimistic toggle
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentFollowState }));

    try {
      if (!currentFollowState) {
        await friendService.sendFriendRequest(currentUserId, userId);
      } else {
        await friendService.removeFriendship(currentUserId, userId);
      }
    } catch {
      // Revert on error
      setFollowingMap((prev) => ({ ...prev, [userId]: currentFollowState }));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Khung Modal chính (Nền đặc 100%, không trong suốt) */}
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Bảng cảm xúc bài viết ({totalLikeCount || normalizedList.length})
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs phân loại cảm xúc */}
        {availableTabs.length > 1 && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto no-scrollbar">
            {availableTabs.map((tab) => (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === tab.type
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="opacity-80 text-[10px]">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Danh sách người dùng */}
        <div className="p-3 overflow-y-auto flex flex-col gap-1 divide-y divide-zinc-100 dark:divide-zinc-800/50 flex-1 min-h-[220px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">Đang tải danh sách...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-zinc-400 text-xs">
              <span>Chưa có ai bày tỏ cảm xúc này.</span>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelf = currentUserId && String(user.id) === String(currentUserId);
              const isFollowing = Boolean(followingMap[user.id]);

              return (
                <div
                  key={`${user.id}-${user.type}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition pt-2.5"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${user.id}`);
                    }}
                  >
                    {/* Avatar kèm badge icon cảm xúc nhỏ ở góc */}
                    <div className="relative shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 dark:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                          {getInitials(user.fullName || user.username)}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-xs drop-shadow-sm">
                        {getReactionEmoji(user.type)}
                      </span>
                    </div>

                    {/* Tên và Username */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline truncate">
                        {user.fullName || user.username}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  {/* Nút Theo dõi / Kết bạn (nếu không phải chính mình) */}
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(user.id)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition cursor-pointer shrink-0 ${
                        isFollowing
                          ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                          : "border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
