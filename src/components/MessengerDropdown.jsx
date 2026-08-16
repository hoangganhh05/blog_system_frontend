import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Check,
  CheckCheck,
  Sparkles,
  X,
  Settings,
  Volume2,
  VolumeX,
  Archive,
  MessageSquarePlus,
  Loader2,
  ChevronRight,
  Bot,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import chatService from "../services/chatService";
import friendService from "../services/friendService";
import Avatar from "./Avatar";
import {
  isUserOnline,
  formatLastActive,
  isUserActiveStatusEnabled,
  setUserActiveStatusEnabled,
} from "../utils/statusUtils";

function formatTimestamp(dateStr) {
  if (!dateStr) return "";
  let formatted = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formatted = dateStr + "Z";
  }
  const date = new Date(formatted);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes}p`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}ng`;
  return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric" });
}

function formatMessagePreview(content) {
  if (!content) return "Chưa có tin nhắn";
  if (content.startsWith("📷 http")) return "📷 Đã gửi một ảnh";
  if (content.startsWith("🏷️ http")) return "🏷️ Đã gửi nhãn dán";
  if (content.startsWith("🎙️ http")) return "🎙️ Đã gửi tin nhắn thoại";
  return content;
}

const AI_BOT_USER = {
  id: "ai_assistant",
  fullName: "BlogViet AI Assistant",
  username: "ai_assistant",
  avatarUrl: null,
  avatarColor: "from-indigo-500 to-purple-600",
  isOnline: true,
};

export default function MessengerDropdown({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { openChat } = useChat();
  const currentUserId = currentUser?.id || currentUser?.userId;

  const [conversations, setConversations] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'unread' | 'ai' | 'archived'
  const [showSettings, setShowSettings] = useState(false);

  const [activeStatus, setActiveStatus] = useState(() => isUserActiveStatusEnabled());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("blogviet_chat_sound") !== "false";
  });

  const dropdownRef = useRef(null);

  const toggleActiveStatus = () => {
    const next = !activeStatus;
    setActiveStatus(next);
    setUserActiveStatusEnabled(next);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("blogviet_chat_sound", String(next));
  };

  // Tải danh sách cuộc trò chuyện gần đây và bạn bè
  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([
      chatService.getRecentConversations().catch(() => ({ data: [] })),
      friendService.getFriends().catch(() => ({ data: [] })),
    ])
      .then(([convRes, friendRes]) => {
        if (!isMounted) return;

        const convList = Array.isArray(convRes.data) ? convRes.data : [];
        const fList = Array.isArray(friendRes.data) ? friendRes.data : [];

        // Lấy danh sách bạn bè chưa từng có tin nhắn để gợi ý bắt đầu chat
        const existingPartnerIds = new Set(
          convList.map((c) => String(c.user?.id || c.partnerId))
        );
        const friendsWithoutChat = fList.filter(
          (f) => !existingPartnerIds.has(String(f.id))
        );

        setConversations(convList);
        setFriendsList(friendsWithoutChat);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUserId]);

  // Lắng nghe sự kiện click ra ngoài để đóng dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        const trigger =
          e.target.closest(".mobile-chat-btn") ||
          e.target.closest(".navbar-icon-btn") ||
          e.target.closest("button[title='Tin nhắn Messenger']");
        if (!trigger) {
          onClose();
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Lắng nghe tin nhắn mới để cập nhật danh sách
  useEffect(() => {
    const handleMessageReceived = () => {
      if (isOpen && currentUserId) {
        chatService
          .getRecentConversations()
          .then((res) => {
            if (Array.isArray(res.data)) {
              setConversations(res.data);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener("chat_message_received", handleMessageReceived);
    return () =>
      window.removeEventListener("chat_message_received", handleMessageReceived);
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  // Lọc cuộc trò chuyện theo Search và Tab Lọc
  const filteredConversations = conversations.filter((item) => {
    const partnerName = item.user?.fullName || item.user?.username || "";
    const matchesSearch =
      partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lastMessage || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "unread") {
      return (item.unreadCount || 0) > 0;
    }
    return true;
  });

  const filteredFriends = friendsList.filter((f) => {
    const name = f.fullName || f.username || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Bạn bè đang online cho thanh Stories / Avatars ngang
  const onlineFriends = friendsList.filter((f) => isUserOnline(f.id));

  const unreadTotal = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount > 0 ? 1 : 0),
    0
  );

  const handleSelectUser = (user) => {
    if (!user) return;
    if (user.id === "ai_assistant") {
      window.dispatchEvent(new CustomEvent("open_ai_assistant"));
      onClose();
    } else {
      openChat(user);
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed sm:absolute top-14 sm:top-full left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 w-[94vw] sm:w-[380px] max-h-[85vh] sm:max-h-[580px] sm:mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-800 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left pointer-events-auto"
      style={{
        boxShadow:
          "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.15)",
      }}
    >
      {/* 1. Header: Tiêu đề + Trạng thái hoạt động + Cài đặt */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Tin nhắn bạn bè
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Trạng thái hoạt động */}
          <button
            type="button"
            onClick={toggleActiveStatus}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
              activeStatus
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            }`}
            title={activeStatus ? "Đang bật hoạt động" : "Đang tắt hoạt động"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeStatus ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <span>{activeStatus ? "Trực tuyến" : "Ẩn"}</span>
          </button>

          {/* Nút Cài Đặt Menu */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ${
              showSettings ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" : "text-zinc-500"
            }`}
            title="Cài đặt tin nhắn"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Nút Đóng */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Menu Cài Đặt Mở Rộng (Khi bấm nút Settings) */}
      {showSettings && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 space-y-2 animate-in slide-in-from-top-2 duration-150 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
              <span>Âm thanh thông báo tin nhắn</span>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                soundEnabled ? "bg-blue-600 text-white" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
              }`}
            >
              {soundEnabled ? "Bật" : "Tắt"}
            </button>
          </div>
        </div>
      )}

      {/* 3. Search Bar Input */}
      <div className="px-3.5 pt-2.5 pb-2 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm người nhắn, bạn bè..."
            className="w-full pl-9 pr-8 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-transparent focus:border-blue-500/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Active Stories / Online Friends Bar (Thanh cuộn ngang avatar trực tuyến + AI Bot) */}
      <div className="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0">
        {/* BlogViet AI Bot Story Item */}
        <button
          type="button"
          onClick={() => handleSelectUser(AI_BOT_USER)}
          className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
          title="Trò chuyện cùng BlogViet AI Bot"
        >
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xs font-black text-xs border-2 border-white dark:border-zinc-900">
              BA
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-1 ring-white dark:ring-zinc-900 flex items-center justify-center text-[8px]">
              ✨
            </span>
          </div>
          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 max-w-[50px] truncate">
            BlogViet
          </span>
        </button>

        {/* Online Friends List */}
        {onlineFriends.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handleSelectUser(f)}
            className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
            title={`Nhắn tin với ${f.fullName || f.username}`}
          >
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 group-hover:scale-105 transition-transform">
              <Avatar
                userId={f.id}
                src={f.avatarUrl}
                name={f.fullName || f.username}
                username={f.username}
                avatarColor={f.avatarColor}
                size="sm"
                className="border-2 border-white dark:border-zinc-900"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-zinc-900" />
            </div>
            <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[52px] truncate">
              {f.fullName ? f.fullName.split(" ").pop() : f.username}
            </span>
          </button>
        ))}
      </div>

      {/* 5. Filter Tabs Pills */}
      <div className="px-3.5 py-2 flex items-center gap-1.5 shrink-0 border-b border-zinc-100/80 dark:border-zinc-800/50">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
            activeFilter === "all"
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Tất cả ({conversations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("unread")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
            activeFilter === "unread"
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Chưa đọc {unreadTotal > 0 && `(${unreadTotal})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("ai")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
            activeFilter === "ai"
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>AI Bot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("archived")}
          className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
            activeFilter === "archived"
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Lưu trữ
        </button>
      </div>

      {/* 6. Danh Sách Cuộc Trò Chuyện & Bạn Bè (Cuộn mượt mà) */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40 scrollbar-thin">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#0866ff]" />
            <span className="text-xs">Đang tải cuộc trò chuyện...</span>
          </div>
        ) : activeFilter === "ai" ? (
          /* TAB AI BOT CHAT ROW */
          <div
            onClick={() => handleSelectUser(AI_BOT_USER)}
            className="p-3.5 flex items-center gap-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 cursor-pointer transition"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md font-bold text-sm shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>BlogViet AI Assistant</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    AI PRO
                  </span>
                </span>
                <span className="text-[10px] text-zinc-400">Trực tuyến</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                Sẵn sàng giải đáp, tóm tắt bài viết và sáng tạo nội dung cho bạn...
              </p>
            </div>
          </div>
        ) : filteredConversations.length === 0 && filteredFriends.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 space-y-2">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto flex items-center justify-center text-xl">
              💬
            </div>
            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Không tìm thấy cuộc trò chuyện nào
            </p>
            <p className="text-[11px] text-zinc-400">
              {searchTerm ? "Thử tìm với từ khóa khác" : "Hãy bắt đầu trò chuyện với bạn bè!"}
            </p>
          </div>
        ) : (
          <>
            {/* Danh sách cuộc trò chuyện gần đây */}
            {filteredConversations.map((item) => {
              const partner = item.user;
              if (!partner) return null;

              const isPartnerOnline = isUserOnline(partner.id);
              const unread = Number(item.unreadCount) || 0;
              const isSentByMe = Number(item.lastSenderId) === Number(currentUserId);

              return (
                <div
                  key={partner.id || item.conversationId}
                  onClick={() => handleSelectUser(partner)}
                  className="p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition relative group"
                >
                  {/* Avatar Partner */}
                  <div className="relative shrink-0">
                    <Avatar
                      userId={partner.id}
                      src={partner.avatarUrl}
                      name={partner.fullName || partner.username}
                      username={partner.username}
                      avatarColor={partner.avatarColor}
                      size="md"
                    />
                    {isPartnerOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                    )}
                  </div>

                  {/* Chi tiết nội dung tin nhắn */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs font-bold truncate block ${
                          unread > 0
                            ? "text-zinc-900 dark:text-zinc-100 font-black"
                            : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {partner.fullName || partner.username}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                        {formatTimestamp(item.lastMessageTime || item.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p
                        className={`text-xs truncate pr-2 ${
                          unread > 0
                            ? "font-bold text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {isSentByMe && <span className="opacity-75">Bạn: </span>}
                        {formatMessagePreview(item.lastMessage)}
                      </p>

                      {unread > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0866ff] shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Danh sách gợi ý bạn bè để bắt đầu trò chuyện */}
            {filteredFriends.length > 0 && (
              <div className="pt-2">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/30">
                  Gợi ý kết nối bạn bè
                </div>
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleSelectUser(friend)}
                    className="p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar
                          userId={friend.id}
                          src={friend.avatarUrl}
                          name={friend.fullName || friend.username}
                          username={friend.username}
                          avatarColor={friend.avatarColor}
                          size="md"
                        />
                        {isUserOnline(friend.id) && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate block">
                          {friend.fullName || friend.username}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {isUserOnline(friend.id)
                            ? "Đang trực tuyến"
                            : formatLastActive(friend.lastActive)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] hover:bg-blue-100 transition shrink-0"
                    >
                      Nhắn tin
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 7. Footer Dropdown: Lối tắt vào trang Tin nhắn toàn màn hình */}
      <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/70 border-t border-zinc-100 dark:border-zinc-800 text-center shrink-0">
        <Link
          to="/friends"
          onClick={onClose}
          className="text-xs font-bold text-[#0866ff] hover:underline flex items-center justify-center gap-1 py-1"
        >
          <span>Xem tất cả danh sách bạn bè & hội thoại</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
