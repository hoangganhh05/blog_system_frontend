import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Minus,
  Maximize2,
  Send,
  Smile,
  Palette,
  Check,
  CheckCheck,
  Loader2,
  Image as ImageIcon,
  Mic,
  ArrowLeft,
  Phone,
  Video,
  ChevronDown,
  Lock,
  MessageSquare,
  User,
  Pin,
  Users,
  BellOff,
  Trash2,
  Edit3,
  ThumbsUp,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import chatService from "../services/chatService";
import { CHAT_THEMES, getChatTheme } from "../utils/chatThemes";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import AudioMessagePlayer from "./AudioMessagePlayer";
import ThemePickerModal from "./ThemePickerModal";

function isAudioMessage(content) {
  if (!content || typeof content !== "string") return false;
  if (content.startsWith("🎙️ http")) return true;
  const lower = content.toLowerCase();
  return (
    lower.includes("/audio/") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".ogg")
  );
}

function formatMessageTime(dateStr) {
  if (!dateStr) return "";
  let formatted = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formatted = dateStr + "Z";
  }
  const d = new Date(formatted);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatBoxWindow({ chat, onBack }) {
  const { user, isMinimized, theme } = chat;
  const { currentUser } = useAuth();
  const { closeChat, toggleMinimizeChat, setChatTheme } = useChat();
  const navigate = useNavigate();

  const currentUserId = currentUser?.id || currentUser?.userId;
  const targetUserId = user.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [nickname, setNickname] = useState(null);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const messagesEndRef = useRef(null);
  const themePickerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const optionsMenuRef = useRef(null);

  const currentTheme = getChatTheme(theme);
  const quickEmoji = currentTheme.quickEmoji || "👍";

  // Auto scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Tải lịch sử tin nhắn khi mở tab
  useEffect(() => {
    let isMounted = true;
    setIsLoadingHistory(true);

    chatService
      .getHistory(currentUserId, targetUserId)
      .then((res) => {
        if (!isMounted) return;
        let list = [];
        if (Array.isArray(res.data)) list = res.data;
        else if (res.data?.content) list = res.data.content;
        else if (res.data?.data) list = res.data.data;
        setMessages(list);
        setTimeout(() => scrollToBottom(false), 50);
      })
      .catch(() => {
        if (isMounted) setMessages([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentUserId, targetUserId, scrollToBottom]);

  // Lắng nghe tin nhắn mới từ WebSocket / sự kiện toàn cục
  useEffect(() => {
    const handleNewMessage = (event) => {
      const msg = event.detail?.message;
      if (!msg) return;

      const msgSenderId = msg.senderId || msg.sender?.id;
      const msgReceiverId = msg.receiverId || msg.receiver?.id;

      if (
        (String(msgSenderId) === String(targetUserId) && String(msgReceiverId) === String(currentUserId)) ||
        (String(msgSenderId) === String(currentUserId) && String(msgReceiverId) === String(targetUserId))
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id && msg.id && m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    window.addEventListener("chat_message_received", handleNewMessage);
    return () => window.removeEventListener("chat_message_received", handleNewMessage);
  }, [currentUserId, targetUserId, scrollToBottom]);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themePickerRef.current && !themePickerRef.current.contains(e.target)) {
        setShowThemePicker(false);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gửi tin nhắn
  const handleSendMessage = async (textToSend) => {
    const trimmed = typeof textToSend === "string" ? textToSend.trim() : inputText.trim();
    if (!trimmed || isSending) return;

    setInputText("");
    setIsSending(true);

    // Optimistic UI
    const tempId = "temp-" + Date.now();
    const tempMsg = {
      id: tempId,
      sender: currentUser,
      senderId: currentUserId,
      receiver: user,
      receiverId: targetUserId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await chatService.sendMessage(currentUserId, targetUserId, trimmed);
      const savedMsg = res.data || tempMsg;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMsg : m)));
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setIsSending(false);
    }
  };

  // Chọn Theme
  const handleSelectTheme = (themeId) => {
    setChatTheme(targetUserId, themeId);
    setShowThemePicker(false);
  };

  // Các thao tác Menu Tùy Chọn
  const handleCallAudio = () => {
    toast.info(`Đang kết nối cuộc gọi thoại đến ${user.fullName || user.username}...`);
  };

  const handleCallVideo = () => {
    toast.info(`Đang kết nối cuộc gọi video đến ${user.fullName || user.username}...`);
  };

  const handleSetNickname = () => {
    const newName = window.prompt("Đặt biệt danh cho người này:", nickname || user.fullName || user.username);
    if (newName !== null) {
      setNickname(newName.trim() || null);
      toast.success("Đã cập nhật biệt danh!");
    }
    setShowOptionsMenu(false);
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Bạn có chắc muốn xóa lịch sử hiển thị của cuộc trò chuyện này?")) {
      setMessages([]);
      toast.success("Đã xóa hiển thị cuộc trò chuyện.");
    }
    setShowOptionsMenu(false);
  };

  const chatBody = (
    <>
      {/* 1. Header Bar */}
      <div
        className={`px-3 py-2 flex items-center justify-between border-b border-black/5 dark:border-white/5 transition-colors relative shrink-0 ${currentTheme.headerBg} ${currentTheme.headerText}`}
      >
        {/* Left: Avatar + Name + Dropdown trigger */}
        <div className="flex items-center gap-2 min-w-0 flex-1 relative">
          {/* Nút Quay Lại trên Mobile */}
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else closeChat(targetUserId);
            }}
            className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="relative shrink-0 cursor-pointer" onClick={() => setShowOptionsMenu(!showOptionsMenu)}>
            <Avatar
              userId={user.id}
              src={user.avatarUrl}
              name={user.fullName || user.username}
              username={user.username}
              avatarColor={user.avatarColor}
              size="sm"
            />
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
            )}
          </div>

          <div
            className="min-w-0 flex flex-col cursor-pointer group"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
          >
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold truncate block group-hover:opacity-90">
                {nickname || user.fullName || user.username}
              </span>
              <ChevronDown className="w-3 h-3 opacity-75 shrink-0 transition-transform group-hover:translate-y-0.5" />
            </div>
            <span className="text-[10px] opacity-75 truncate flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              <span>{user.isOnline ? "Đang hoạt động" : "Mã hóa đầu cuối"}</span>
            </span>
          </div>

          {/* Context Options Menu Dropdown (Facebook Messenger Style) */}
          {showOptionsMenu && (
            <div
              ref={optionsMenuRef}
              className="absolute left-0 top-11 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-60 animate-in fade-in zoom-in-95 duration-150 text-zinc-800 dark:text-zinc-200 text-xs select-none"
            >
              {/* Bảo mật E2EE */}
              <div className="p-2 flex items-start gap-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                <Lock className="w-4 h-4 mt-0.5 text-[#0866ff] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px]">Được mã hóa đầu cuối</span>
                  <span className="text-[10px] opacity-80">Tin nhắn và cuộc gọi của bạn luôn được bảo vệ</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

              {/* Mở trong Messenger */}
              <button
                type="button"
                onClick={() => {
                  navigate("/friends");
                  setShowOptionsMenu(false);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold">Mở trong Messenger</span>
              </button>

              {/* Xem trang cá nhân */}
              <Link
                to={`/profile/${user.id}`}
                onClick={() => setShowOptionsMenu(false)}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
              >
                <User className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold">Xem trang cá nhân</span>
              </Link>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

              {/* Đổi chủ đề */}
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowThemePicker(true);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Palette className="w-4 h-4 text-pink-500" />
                <span className="font-semibold">Đổi chủ đề</span>
              </button>

              {/* Biểu tượng cảm xúc */}
              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowThemePicker(true);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <span className="text-base leading-none">{quickEmoji}</span>
                <span className="font-semibold">Biểu tượng cảm xúc ({quickEmoji})</span>
              </button>

              {/* Biệt danh */}
              <button
                type="button"
                onClick={handleSetNickname}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">Biệt danh</span>
              </button>

              {/* Xem tin nhắn đã ghim */}
              <button
                type="button"
                onClick={() => {
                  toast.info("Chưa có tin nhắn nào được ghim trong đoạn chat này.");
                  setShowOptionsMenu(false);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Pin className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Xem tin nhắn đã ghim</span>
              </button>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

              {/* Tạo nhóm */}
              <button
                type="button"
                onClick={() => {
                  toast.info("Tính năng tạo nhóm chat đang được hoàn thiện.");
                  setShowOptionsMenu(false);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold">Tạo nhóm</span>
              </button>

              {/* Tắt thông báo */}
              <button
                type="button"
                onClick={() => {
                  toast.success("Đã tắt thông báo cho cuộc trò chuyện này.");
                  setShowOptionsMenu(false);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <BellOff className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold">Tắt thông báo</span>
              </button>

              {/* Xóa đoạn chat */}
              <button
                type="button"
                onClick={handleClearChatHistory}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-left transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-semibold">Xóa đoạn chat</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Phone Call + Video Call + Theme + Minimize + Close */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Nút Gọi Thoại */}
          <button
            type="button"
            onClick={handleCallAudio}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Bắt đầu gọi thoại"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>

          {/* Nút Gọi Video */}
          <button
            type="button"
            onClick={handleCallVideo}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Bắt đầu gọi video"
          >
            <Video className="w-3.5 h-3.5" />
          </button>

          {/* Nút Thu Nhỏ (Chỉ trên Desktop) */}
          <button
            type="button"
            onClick={() => toggleMinimizeChat(targetUserId)}
            className="hidden md:inline-flex p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Nút Đóng */}
          <button
            type="button"
            onClick={() => closeChat(targetUserId)}
            className="p-1.5 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
            title="Đóng box chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Chọn Theme Phân Loại Đầy Đủ */}
      {showThemePicker && (
        <ThemePickerModal
          isOpen={showThemePicker}
          onClose={() => setShowThemePicker(false)}
          currentThemeId={theme || "DEFAULT"}
          onSelectTheme={handleSelectTheme}
          targetUserName={user.fullName || user.username}
        />
      )}

      {/* 2. Messages List Body */}
      <div
        className={`flex-1 p-3 overflow-y-auto space-y-2 text-xs transition-colors scrollbar-thin ${
          currentTheme.chatBg || currentTheme.bodyBg || "bg-slate-50"
        }`}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full text-zinc-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Đang tải tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-zinc-400 space-y-1">
            <span className="text-3xl mb-1">{quickEmoji}</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              Chưa có tin nhắn nào
            </span>
            <span className="text-[11px]">
              Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện!
            </span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine =
              Number(msg.senderId || msg.sender?.id) === Number(currentUserId);
            const isAudio = isAudioMessage(msg.content);

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col group/msg ${
                  isMine ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs break-words whitespace-pre-wrap transition-all ${
                    isMine
                      ? `${currentTheme.sentBubble || currentTheme.myBubble || "bg-blue-600 text-white"} rounded-br-xs`
                      : `${currentTheme.receivedBubble || currentTheme.theirBubble || "bg-white text-zinc-900 border"} rounded-bl-xs`
                  }`}
                >
                  {isAudio ? (
                    <AudioMessagePlayer audioUrl={msg.content.replace("🎙️ ", "").trim()} />
                  ) : (
                    msg.content
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5 px-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                  <span className="text-[9px] text-zinc-400">
                    {formatMessageTime(msg.createdAt)}
                  </span>
                  {isMine && (
                    <span className="text-[10px] text-zinc-400">
                      {msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-2 pb-3 sm:pb-2 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 relative shrink-0"
      >
        {/* Emoji Button */}
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-zinc-400 hover:text-amber-500 transition cursor-pointer"
            title="Thêm biểu tượng cảm xúc"
          >
            <Smile className="w-4 h-4" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-10 left-0 z-50">
              <EmojiPicker
                onSelect={(emoji) => {
                  setInputText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
              />
            </div>
          )}
        </div>

        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-slate-100 dark:bg-zinc-800 border-none rounded-full px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Nút Gửi hoặc Nút Quick Emoji như thật trên Facebook Messenger */}
        {inputText.trim() ? (
          <button
            type="submit"
            disabled={isSending}
            className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            title="Gửi tin nhắn (Enter)"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleSendMessage(quickEmoji)}
            className="p-1.5 text-base hover:scale-125 active:scale-90 transition-transform cursor-pointer"
            title={`Gửi biểu tượng cảm xúc nhanh (${quickEmoji})`}
          >
            {quickEmoji}
          </button>
        )}
      </form>
    </>
  );

  // Trên Mobile (< 768px): Mở Full Screen qua React Portal gắn trực tiếp vào body
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white dark:bg-zinc-900 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
        {chatBody}
      </div>,
      document.body
    );
  }

  // Trên PC: Tab thu nhỏ (Minimized)
  if (isMinimized) {
    return (
      <div className="w-64 h-11 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-xl shadow-xl flex items-center justify-between px-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all pointer-events-auto select-none">
        <div
          className="flex items-center gap-2 min-w-0 flex-1"
          onClick={() => toggleMinimizeChat(targetUserId)}
        >
          <div className="relative">
            <Avatar
              userId={user.id}
              src={user.avatarUrl}
              name={user.fullName || user.username}
              username={user.username}
              avatarColor={user.avatarColor}
              size="xs"
            />
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-zinc-900" />
            )}
          </div>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {nickname || user.fullName || user.username}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleMinimizeChat(targetUserId)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Mở rộng"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => closeChat(targetUserId)}
            className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Trên PC: Box Chat Dock mở rộng bình thường
  return (
    <div className="w-80 h-[440px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
      {chatBody}
    </div>
  );
}
