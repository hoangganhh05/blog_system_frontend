import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, UserPlus, X, Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import userService from "../services/userService";
import { isUserOnline, formatLastActive } from "../utils/statusUtils";

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
      toast.error("Không thể tải dữ liệu bạn bè!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUserId]);

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await friendService.acceptFriendRequest(friendshipId);
      toast.success("Đã chấp nhận lời mời kết bạn!");
      fetchData();
    } catch {
      toast.error("Không thể chấp nhận lời mời!");
    }
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await friendService.declineFriendRequest(friendshipId);
      toast.info("Đã từ chối lời mời kết bạn.");
      fetchData();
    } catch {
      toast.error("Không thể từ chối lời mời!");
    }
  };

  const handleSendRequest = async (targetUserId) => {
    try {
      await friendService.sendFriendRequest(targetUserId);
      toast.success("Đã gửi lời mời kết bạn!");
      setSuggestions((prev) => prev.filter((u) => String(u.id) !== String(targetUserId)));
    } catch {
      toast.error("Không thể gửi lời mời!");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white">
              Bạn bè & Kết nối
            </h1>
            <p className="text-xs text-zinc-500">
              Quản lý danh sách bạn bè và lời mời kết nối
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition relative cursor-pointer ${
            activeTab === "friends"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === "requests"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Lời mời kết bạn
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500 text-white font-bold">
              {pendingRequests.length}
            </span>
          )}
          {activeTab === "requests" && (
            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-black dark:bg-white" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("suggestions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition relative cursor-pointer ${
            activeTab === "suggestions"
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
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
                  <div className="relative shrink-0">
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
                    {friend.showActiveStatus !== false && (
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isUserOnline(friend) ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                        title={formatLastActive(friend)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {friend.fullName || friend.username}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      {formatLastActive(friend) || `@${friend.username}`}
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
                    <div className="relative shrink-0">
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
                      {requester.showActiveStatus !== false && (
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                            isUserOnline(requester) ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                          title={formatLastActive(requester)}
                        />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {requester.fullName || requester.username}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">
                        {formatLastActive(requester) || `@${requester.username}`}
                      </span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAcceptRequest(req.id || requester.id)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#0866ff] hover:bg-[#0756d6] text-white cursor-pointer active:scale-95 shadow-xs"
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineRequest(req.id || requester.id)}
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
                  <div className="relative shrink-0">
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
                    {sug.showActiveStatus !== false && (
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isUserOnline(sug) ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                        title={formatLastActive(sug)}
                      />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {sug.fullName || sug.username}
                    </span>
                    <span className="text-xs text-zinc-400 truncate">
                      {formatLastActive(sug) || `@${sug.username}`}
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleSendRequest(sug.id)}
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
