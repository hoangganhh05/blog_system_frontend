import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Check,
  CheckCheck,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import chatService from "../services/chatService";
import friendService from "../services/friendService";
import Avatar from "./Avatar";
import { formatLastActive, isUserOnline } from "../utils/statusUtils";

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

export default function MessengerDropdown({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { openChat } = useChat();
  const currentUserId = currentUser?.id || currentUser?.userId;

  const [conversations, setConversations] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'unread'

  const dropdownRef = useRef(null);

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
        const existingPartnerIds = new Set(convList.map((c) => String(c.user?.id || c.partnerId)));
        const friendsWithoutChat = fList.filter((f) => !existingPartnerIds.has(String(f.id)));

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
        // Kiểm tra xem click có trúng nút kích hoạt messenger không
        const trigger = e.target.closest(".mobile-chat-btn") || e.target.closest(".navbar-icon-btn");
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
    return () => window.removeEventListener("chat_message_received", handleMessageReceived);
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

  const handleSelectUser = (user) => {
    if (!user) return;
    openChat(user);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[360px] max-h-[520px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-800 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left"
      style={{
        boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* 1. Header Dropdown */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Đoạn chat
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400">
            Trực tuyến
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle_chat_widget"));
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Mở toàn bộ cửa sổ chat widget"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar Input */}
      <div className="px-3.5 pt-2.5 pb-2 shrink-0">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm trên Messenger..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-transparent focus:border-blue-500/50 dark:focus:border-blue-500/50 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition"
          />
        </div>
      </div>

      {/* 3. Filter Tags */}
      <div className="px-3.5 pb-2 flex items-center gap-1.5 shrink-0 border-b border-zinc-100/80 dark:border-zinc-800/50">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeFilter === "all"
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400 font-bold"
              : "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          Hộp thư
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("unread")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === "unread"
              ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400 font-bold"
              : "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <span>Chưa đọc</span>
          {conversations.some((c) => (c.unreadCount || 0) > 0) && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          )}
        </button>
      </div>

      {/* 4. Scrollable List */}
      <div className="flex-1 overflow-y-auto max-h-[340px] p-1.5 space-y-0.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0866ff]" />
            <span className="text-xs">Đang tải cuộc trò chuyện...</span>
          </div>
        ) : filteredConversations.length === 0 && filteredFriends.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {searchTerm ? "Không tìm thấy kết quả" : "Chưa có đoạn chat nào"}
            </span>
            <span className="text-[11px] text-zinc-400 max-w-xs">
              {searchTerm
                ? "Thử tìm kiếm với từ khóa khác"
                : "Kết nối bạn bè hoặc bắt đầu gửi tin nhắn để trò chuyện!"}
            </span>
          </div>
        ) : (
          <>
            {/* Danh sách cuộc trò chuyện đang có */}
            {filteredConversations.map((item) => {
              const partner = item.user || {};
              const partnerName = partner.fullName || partner.username || "Người dùng";
              const isUnread = (item.unreadCount || 0) > 0;
              const isMe = Number(item.lastSenderId) === Number(currentUserId);

              return (
                <div
                  key={partner.id || item.conversationId}
                  onClick={() => handleSelectUser(partner)}
                  className={`p-2 rounded-xl flex items-center gap-3 transition cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/70 group ${
                    isUnread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <Avatar
                    userId={partner.id}
                    src={partner.avatarUrl}
                    name={partnerName}
                    username={partner.username}
                    avatarColor={partner.avatarColor}
                    size="md"
                    isOnline={partner.isOnline}
                    lastActiveAt={partner.lastActiveAt}
                    showActiveStatus={partner.showActiveStatus !== false}
                    className="shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className={`text-xs truncate ${
                          isUnread
                            ? "font-extrabold text-zinc-900 dark:text-white"
                            : "font-semibold text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {partnerName}
                      </span>
                      <span
                        className={`text-[10px] shrink-0 ${
                          isUnread
                            ? "text-[#0866ff] dark:text-blue-400 font-bold"
                            : "text-zinc-400"
                        }`}
                      >
                        {formatTimestamp(item.lastMessageTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        {isMe && (
                          <CheckCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            isUnread
                              ? "font-bold text-zinc-900 dark:text-white"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {isMe ? `Bạn: ${formatMessagePreview(item.lastMessage)}` : formatMessagePreview(item.lastMessage)}
                        </span>
                      </div>

                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0866ff] shrink-0 ring-2 ring-white dark:ring-zinc-900" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Gợi ý bạn bè mới để bắt đầu chat nếu còn bạn bè chưa trò chuyện */}
            {filteredFriends.length > 0 && activeFilter === "all" && (
              <div className="pt-2">
                <div className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Gợi ý trò chuyện
                </div>
                {filteredFriends.slice(0, 4).map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => handleSelectUser(friend)}
                    className="p-2 rounded-xl flex items-center gap-3 transition cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                  >
                    <Avatar
                      userId={friend.id}
                      src={friend.avatarUrl}
                      name={friend.fullName || friend.username}
                      username={friend.username}
                      avatarColor={friend.avatarColor}
                      size="sm"
                      isOnline={friend.isOnline}
                      lastActiveAt={friend.lastActiveAt}
                      showActiveStatus={friend.showActiveStatus !== false}
                      className="shrink-0"
                    />

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {friend.fullName || friend.username}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {formatLastActive(friend) || "Bắt đầu cuộc trò chuyện"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#0866ff] dark:text-blue-400 shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
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

      {/* 5. Footer Link */}
      <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/80 text-center shrink-0">
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("toggle_chat_widget"));
            onClose();
          }}
          className="text-xs font-bold text-[#0866ff] hover:underline cursor-pointer transition flex items-center justify-center gap-1.5 w-full py-1"
        >
          <span>Xem tất cả trong Messenger</span>
          <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  );
}
