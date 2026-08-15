import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, UserCheck, UserPlus, X, Check, Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import userService from "../services/userService";
import { isUserOnline, formatLastActive } from "../utils/statusUtils";
import Avatar from "../components/Avatar";

export default function FriendsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-4 sm:p-6 mb-6 flex flex-col gap-4">
      {/* Header inside Card */}
      <div className="flex flex-row items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
              Bạn bè &amp; Kết nối
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 truncate">
              Quản lý danh sách bạn bè và lời mời kết nối.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2 overflow-x-auto no-scrollbar">
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
        <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
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
                <div key={friend.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition rounded-xl">
                  <Link to={`/profile/${friend.id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar
                      userId={friend.id}
                      src={friend.avatarUrl}
                      name={friend.fullName || friend.username}
                      username={friend.username}
                      avatarColor={friend.avatarColor}
                      size="md"
                      isOnline={friend.isOnline}
                      lastActiveAt={friend.lastActiveAt}
                      showActiveStatus={friend.showActiveStatus}
                      className="shrink-0"
                    />
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
                  <div key={req.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition rounded-xl">
                    <Link to={`/profile/${requester.id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar
                      userId={requester.id}
                      src={requester.avatarUrl}
                      name={requester.fullName || requester.username}
                      username={requester.username}
                      avatarColor={requester.avatarColor}
                      size="md"
                      isOnline={requester.isOnline}
                      lastActiveAt={requester.lastActiveAt}
                      showActiveStatus={requester.showActiveStatus}
                      className="shrink-0"
                    />
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
                <div key={sug.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition rounded-xl">
                  <Link to={`/profile/${sug.id}`} className="flex items-center gap-3 min-w-0">
                    <Avatar
                      userId={sug.id}
                      src={sug.avatarUrl}
                      name={sug.fullName || sug.username}
                      username={sug.username}
                      avatarColor={sug.avatarColor}
                      size="md"
                      isOnline={sug.isOnline}
                      lastActiveAt={sug.lastActiveAt}
                      showActiveStatus={sug.showActiveStatus}
                      className="shrink-0"
                    />
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
