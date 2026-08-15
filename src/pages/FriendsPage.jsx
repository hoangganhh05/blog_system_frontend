import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserPlus, X, Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import userService from "../services/userService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FriendsPage() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [activeTab, setActiveTab] = useState("friends"); // "friends" | "requests" | "suggestions"
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const [friendsRes, pendingRes, suggestRes] = await Promise.all([
        friendService.getFriendsList(currentUserId).catch(() => ({ data: [] })),
        friendService.getPendingRequests(currentUserId).catch(() => ({ data: [] })),
        userService.getAll("", 0, 15).catch(() => ({ data: { content: [] } }))
      ]);

      const rawFriends = friendsRes.data || [];
      setFriends(rawFriends);

      const rawPending = pendingRes.data || [];
      setPendingRequests(rawPending);

      const rawSuggest = suggestRes.data?.content || suggestRes.data || [];
      const friendIds = new Set(rawFriends.map((f) => String(f.id)));
      friendIds.add(String(currentUserId));

      const filteredSuggest = rawSuggest.filter((u) => !friendIds.has(String(u.id)));
      setSuggestions(filteredSuggest);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const handleAcceptRequest = async (requesterId) => {
    try {
      await friendService.acceptRequest(currentUserId, requesterId);
      toast.success("Đã chấp nhận lời mời kết bạn!");
      fetchData();
    } catch {
      toast.error("Lỗi chấp nhận kết bạn!");
    }
  };

  const handleRejectRequest = async (requesterId) => {
    try {
      await friendService.removeFriendship(currentUserId, requesterId);
      setPendingRequests((prev) => prev.filter((r) => r.requester?.id !== requesterId));
      toast.info("Đã xóa lời mời kết bạn");
    } catch {
      toast.error("Lỗi từ chối kết bạn!");
    }
  };

  const handleSendFriendRequest = async (targetId) => {
    try {
      await friendService.sendFriendRequest(currentUserId, targetId);
      setSuggestions((prev) => prev.filter((s) => s.id !== targetId));
      toast.success("Đã gửi lời mời kết bạn!");
    } catch {
      toast.error("Không thể gửi lời mời kết bạn!");
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <Users className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
        <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
          Bạn bè &amp; Kết nối
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4 shrink-0 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-3 text-xs font-semibold tracking-tight text-center relative transition cursor-pointer ${
            activeTab === "friends"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Bạn bè ({friends.length})
          {activeTab === "friends" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-black dark:bg-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-3 text-xs font-semibold tracking-tight text-center relative transition cursor-pointer ${
            activeTab === "requests"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Lời mời ({pendingRequests.length})
          {activeTab === "requests" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-black dark:bg-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("suggestions")}
          className={`flex-1 py-3 text-xs font-semibold tracking-tight text-center relative transition cursor-pointer ${
            activeTab === "suggestions"
              ? "text-black dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Gợi ý ({suggestions.length})
          {activeTab === "suggestions" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-black dark:bg-white" />
          )}
        </button>
      </div>

      {/* Content List */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {loading ? (
          <div className="p-12 text-center flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : activeTab === "friends" ? (
          friends.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 text-xs">
              Bạn chưa có bạn bè nào. Hãy xem phần Gợi ý để kết bạn nhé!
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition rounded-xl">
                <Link to={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0">
                  {friend.avatarUrl ? (
                    <img src={friend.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                      style={{ backgroundColor: friend.avatarColor || "#4f46e5" }}
                    >
                      {getInitials(friend.fullName || friend.username)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {friend.fullName || friend.username}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      @{friend.username}
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("open_chat_user", { detail: { friend } })
                      );
                    }}
                    className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    title="Nhắn tin"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/profile/${friend.id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    Trang cá nhân
                  </Link>
                </div>
              </div>
            ))
          )
        ) : activeTab === "requests" ? (
          pendingRequests.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 text-xs">
              Không có lời mời kết bạn nào đang chờ.
            </div>
          ) : (
            pendingRequests.map((req) => {
              const requester = req.requester || {};
              return (
                <div key={req.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition rounded-xl">
                  <Link to={`/profile/${requester.id}`} className="flex items-center gap-3 min-w-0">
                    {requester.avatarUrl ? (
                      <img src={requester.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                        style={{ backgroundColor: requester.avatarColor || "#4f46e5" }}
                      >
                        {getInitials(requester.fullName || requester.username)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {requester.fullName || requester.username}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">
                        @{requester.username}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(requester.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0866ff] hover:bg-[#0756d6] text-white cursor-pointer active:scale-95 shadow-xs"
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(requester.id)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 cursor-pointer active:scale-95"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : (
          suggestions.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 text-xs">
              Chưa có gợi ý nào mới.
            </div>
          ) : (
            suggestions.map((sug) => (
              <div key={sug.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition rounded-xl">
                <Link to={`/profile/${sug.id}`} className="flex items-center gap-3 min-w-0">
                  {sug.avatarUrl ? (
                    <img src={sug.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0"
                      style={{ backgroundColor: sug.avatarColor || "#4f46e5" }}
                    >
                      {getInitials(sug.fullName || sug.username)}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {sug.fullName || sug.username}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      @{sug.username}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleSendFriendRequest(sug.id)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0866ff] hover:bg-[#0756d6] text-white flex items-center gap-1.5 self-end sm:self-auto shrink-0 cursor-pointer active:scale-95 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Kết bạn</span>
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
