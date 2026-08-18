import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
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
  Square,
  ArrowLeft,
  Phone,
  Video,
  ChevronDown,
  Lock,
  MessageSquare,
  User,
  Pin,
  PinOff,
  Users,
  BellOff,
  Trash2,
  Edit3,
  Copy,
  Reply,
  Plus,
  Sticker as StickerIcon,
  ImagePlus,
  Sparkles,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import chatService from "../services/chatService";
import uploadService from "../services/uploadService";
import { getChatTheme } from "../utils/chatThemes";
import Avatar from "./Avatar";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";
import StickerPicker from "./StickerPicker";
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

function isImageMessage(content) {
  if (!content || typeof content !== "string") return false;
  return content.startsWith("📷 http");
}

function isStickerMessage(content) {
  if (!content || typeof content !== "string") return false;
  return content.startsWith("🏷️ http");
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

  const currentUserId = currentUser?.id || currentUser?.userId;
  const targetUserId = user.id;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [nickname, setNickname] = useState(null);

  // Tin nhắn đang được phản hồi / chỉnh sửa
  const [replyingMessage, setReplyingMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  // Tin nhắn đang mở action menu (trên mobile hoặc context)
  const [activeActionMessage, setActiveActionMessage] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});

  // Ghi âm giọng nói Web Audio API
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

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
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  const currentTheme = getChatTheme(theme);
  const quickEmoji = currentTheme.quickEmoji || "👍";

  // Inline background cho Theme Gradient (Tailwind không tự sinh class bg-[linear-gradient(...)] động
  // nên phải gán trực tiếp style để màu/gradient hiển thị đúng trên bubble tin nhắn gửi đi)
  const sentBubbleStyle =
    Array.isArray(currentTheme?.gradientColors) && currentTheme.gradientColors.length === 2
      ? {
          background: `linear-gradient(135deg, ${currentTheme.gradientColors[0]}, ${currentTheme.gradientColors[1]})`,
        }
      : undefined;

  // Tự động cuộn xuống cuối
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  // Tải lịch sử tin nhắn
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

  // Lắng nghe tin nhắn mới từ WebSocket / CustomEvent
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
          if (prev.some((m) => m.id && msg.id && m.id === msg.id)) {
            return prev;
          }
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    window.addEventListener("chat:new-message", handleNewMessage);
    return () => window.removeEventListener("chat:new-message", handleNewMessage);
  }, [currentUserId, targetUserId, scrollToBottom]);

  // Đóng compact menu khi click ra ngoài trên PC
  useEffect(() => {
    if (!activeActionMessage) return;
    const handleGlobalClick = () => {
      setActiveActionMessage(null);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, [activeActionMessage]);

  // Gửi tin nhắn
  const handleSendMessage = async (customContent = null) => {
    const textToSend = customContent || inputText;
    if ((!textToSend || !textToSend.trim()) && !customContent) return;

    // Nếu đang trong chế độ Edit tin nhắn
    if (editingMessage) {
      const editId = editingMessage.id;
      const newText = textToSend.trim();
      setEditingMessage(null);
      setInputText("");

      try {
        await chatService.editMessage(editId, newText);
        setMessages((prev) =>
          prev.map((m) => (m.id === editId ? { ...m, content: newText, isEdited: true } : m))
        );
        toast.success("Đã chỉnh sửa tin nhắn!");
      } catch {
        toast.error("Không thể chỉnh sửa tin nhắn.");
      }
      return;
    }

    let finalContent = textToSend.trim();
    if (replyingMessage) {
      const replySnippet = replyingMessage.content?.slice(0, 50) || "tin nhắn";
      finalContent = `[Trả lời: "${replySnippet}"]\n${finalContent}`;
      setReplyingMessage(null);
    }

    setIsSending(true);
    if (!customContent) setInputText("");

    // Optimistic UI
    const tempId = "temp_" + Date.now();
    const optimisticMsg = {
      id: tempId,
      senderId: currentUserId,
      receiverId: targetUserId,
      content: finalContent,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const res = await chatService.sendMessage(currentUserId, targetUserId, finalContent);
      if (res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...res.data, id: res.data.id || tempId } : m))
        );
      }
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowStickerPicker(false);
      setShowPlusMenu(false);
    }
  };

  // Upload & gửi ảnh
  const handleUploadImage = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      try {
        const res = await uploadService.uploadFile(file);
        if (res.data?.url) {
          await handleSendMessage(`📷 ${res.data.url}`);
        }
      } catch {
        toast.error("Lỗi gửi ảnh. Vui lòng thử lại!");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowPlusMenu(false);
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        try {
          const res = await uploadService.uploadFile(audioFile);
          if (res.data?.url) {
            await handleSendMessage(`🎙️ ${res.data.url}`);
          }
        } catch {
          toast.error("Lỗi gửi tin nhắn thoại!");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error("Không thể truy cập Microphone để ghi âm!");
    }
  };

  // Dừng ghi âm và gửi
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  // Hủy ghi âm
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stream?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
      toast.info("Đã hủy ghi âm.");
    }
  };

  // Long-press handler cho tin nhắn
  const handleTouchStart = (msg) => {
    longPressTimerRef.current = setTimeout(() => {
      setActiveActionMessage(msg);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  // Reaction tin nhắn
  const handleSendReaction = (messageId, emoji) => {
    setMessageReactions((prev) => ({
      ...prev,
      [messageId]: emoji,
    }));
    setActiveActionMessage(null);
    toast.success(`Đã thả cảm xúc ${emoji}`);
  };

  // Sao chép tin nhắn
  const handleCopyMessage = (content) => {
    const cleanContent = content.replace(/^\[Trả lời: "[^"]*"\]\n/, "");
    navigator.clipboard.writeText(cleanContent).then(() => {
      toast.success("Đã sao chép tin nhắn!");
      setActiveActionMessage(null);
    });
  };

  // Ghim tin nhắn
  const handlePinMessage = async (msg) => {
    setActiveActionMessage(null);
    try {
      await chatService.pinMessage(msg.id, true);
      toast.success("Đã ghim tin nhắn!");
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, isPinned: true } : m))
      );
    } catch {
      toast.error("Không thể ghim tin nhắn.");
    }
  };

  // Xóa / Thu hồi tin nhắn
  const handleDeleteMessage = async (messageId) => {
    setActiveActionMessage(null);
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Đã thu hồi tin nhắn!");
    } catch {
      toast.error("Không thể thu hồi tin nhắn.");
    }
  };

  // Chọn Theme (setChatTheme trong Context đã tự đồng bộ lên API + localStorage)
  const handleSelectTheme = async (themeId) => {
    setShowThemePicker(false);
    try {
      await setChatTheme(targetUserId, themeId);
      toast.success("Đã cập nhật chủ đề cuộc trò chuyện!");
    } catch {
      // Offline fallback
    }
  };

  const handleSetNickname = () => {
    const name = window.prompt("Nhập biệt danh mới cho người này:", nickname || user.fullName || user.username);
    if (name !== null) {
      setNickname(name.trim() || null);
      toast.success("Đã đổi biệt danh thành công!");
      setShowOptionsMenu(false);
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này không?")) {
      setMessages([]);
      toast.success("Đã xóa cuộc trò chuyện!");
      setShowOptionsMenu(false);
    }
  };

  const pinnedMsg = messages.find((m) => m.isPinned);

  // Giao diện chính của Box Chat
  const chatBody = (
    <div className="w-full h-full flex flex-col overflow-hidden select-none text-left bg-white dark:bg-zinc-900">
      {/* 1. Header Bar */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between border-b border-black/5 dark:border-white/5 transition-colors relative shrink-0 z-20 ${currentTheme.headerBg} ${currentTheme.headerText}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 relative">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => closeChat(targetUserId)}
              className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div
            className="relative shrink-0 cursor-pointer"
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
          >
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

          {/* Context Options Menu Dropdown */}
          {showOptionsMenu && (
            <div
              ref={optionsMenuRef}
              className="absolute left-0 top-11 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-60 animate-in fade-in zoom-in-95 duration-150 text-zinc-800 dark:text-zinc-200 text-xs select-none"
            >
              <div className="p-2 flex items-start gap-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                <Lock className="w-4 h-4 mt-0.5 text-[#0866ff] shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-[11px]">Được mã hóa đầu cuối</span>
                  <span className="text-[10px] opacity-80">Tin nhắn và cuộc gọi luôn được bảo vệ</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

              <Link
                to={`/profile/${user.id}`}
                onClick={() => setShowOptionsMenu(false)}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition"
              >
                <User className="w-4 h-4 text-zinc-500" />
                <span className="font-semibold">Xem trang cá nhân</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowOptionsMenu(false);
                  setShowThemePicker(true);
                }}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Palette className="w-4 h-4 text-pink-500" />
                <span className="font-semibold">Đổi chủ đề (65+ Theme)</span>
              </button>

              <button
                type="button"
                onClick={handleSetNickname}
                className="w-full p-2 rounded-xl flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold">Đặt biệt danh</span>
              </button>

              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

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

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowThemePicker(true)}
            className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Đổi màu theme"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => toggleMinimizeChat(targetUserId)}
            className="hidden md:inline-flex p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => closeChat(targetUserId)}
            className="p-1.5 rounded-full hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Banner Tin Nhắn Đã Ghim (Nếu có) */}
      {pinnedMsg && (
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/60 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-200 shrink-0 z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold shrink-0">Đã ghim:</span>
            <span className="truncate">{pinnedMsg.content}</span>
          </div>
        </div>
      )}

      {/* 2. Messages List Body */}
      <div
        className={`flex-1 p-3 overflow-y-auto space-y-2 text-xs transition-colors scrollbar-thin ${
          currentTheme.chatBg || currentTheme.bodyBg || "bg-slate-50 dark:bg-zinc-950"
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
            const isMine = Number(msg.senderId || msg.sender?.id) === Number(currentUserId);
            const isAudio = isAudioMessage(msg.content);
            const isImage = isImageMessage(msg.content);
            const isSticker = isStickerMessage(msg.content);
            const reaction = messageReactions[msg.id];

            return (
              <div
                key={msg.id || index}
                onTouchStart={() => handleTouchStart(msg)}
                onTouchEnd={handleTouchEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveActionMessage(msg);
                }}
                className={`flex flex-col group/msg relative my-1 w-full ${isMine ? "items-end" : "items-start"}`}
              >
                {/* Bubble Tin Nhắn */}
                <div className={`relative flex items-center gap-1 group/bubble w-full ${isMine ? "justify-end" : "justify-start"}`}>
                  {/* Nút 3 chấm mở action menu khi hover trên PC (Ẩn trên Mobile) */}
                  {isMine && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionMessage(activeActionMessage?.id === msg.id ? null : msg);
                      }}
                      className="hidden md:inline-flex opacity-0 group-hover/bubble:opacity-100 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 transition cursor-pointer"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* 1. MENU NHỎ GỌN TRÊN PC (NỔI GỌN TRONG KHUNG CHAT, KHÔNG BỊ TRÀN RA NGOÀI) */}
                  {activeActionMessage?.id === msg.id && (
                    <div
                      className={`hidden md:block absolute ${
                        isMine ? "right-0" : "left-0"
                      } top-full mt-1.5 z-40 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-2 w-44 animate-in fade-in zoom-in-95 duration-100 text-left`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Quick Reactions bar */}
                      <div className="flex items-center justify-between px-1 py-1 mb-1 border-b border-zinc-100 dark:border-zinc-800 text-base">
                        {["❤️", "😂", "😮", "😢", "😡", "👍"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleSendReaction(msg.id, emoji)}
                            className="hover:scale-125 transition-transform cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Action List nhỏ gọn */}
                      <div className="space-y-0.5 text-xs text-zinc-700 dark:text-zinc-200 font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingMessage(msg);
                            setActiveActionMessage(null);
                            textInputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left transition cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5 text-blue-500" />
                          <span>Trả lời</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.content)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left transition cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Sao chép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePinMessage(msg)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-left transition cursor-pointer"
                        >
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                          <span>Ghim</span>
                        </button>

                        {isMine && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(msg);
                                setInputText(msg.content);
                                setActiveActionMessage(null);
                                textInputRef.current?.focus();
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-blue-600 dark:text-blue-400 text-left transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Chỉnh sửa</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 text-left transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Thu hồi</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {isSticker ? (
                    <img
                      src={msg.content.replace("🏷️ ", "").trim()}
                      alt="Sticker"
                      className="w-28 h-28 object-contain my-1 select-none animate-in zoom-in-95 duration-150"
                    />
                  ) : isImage ? (
                    <div className="rounded-2xl overflow-hidden max-w-[240px] my-1 border border-black/10 dark:border-white/10 shadow-xs">
                      <img
                        src={msg.content.replace("📷 ", "").trim()}
                        alt="Ảnh tin nhắn"
                        className="w-full h-auto max-h-[220px] object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(msg.content.replace("📷 ", "").trim(), "_blank")}
                      />
                    </div>
                  ) : (
                    <div
                      className={`inline-block w-fit max-w-[75%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl break-words whitespace-pre-wrap text-sm sm:text-base leading-normal ${
                        isMine
                          ? `${currentTheme.sentBubble || currentTheme.myBubble || "bg-blue-600 text-white"} rounded-br-xs`
                          : `${currentTheme.receivedBubble || currentTheme.theirBubble || "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"} rounded-bl-xs`
                      }`}
                      style={isMine ? sentBubbleStyle : undefined}
                    >
                      {isAudio ? (
                        <AudioMessagePlayer audioUrl={msg.content.replace("🎙️ ", "").trim()} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  )}

                  {!isMine && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionMessage(activeActionMessage?.id === msg.id ? null : msg);
                      }}
                      className="hidden md:inline-flex opacity-0 group-hover/bubble:opacity-100 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 transition cursor-pointer"
                      title="Tùy chọn"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Huy hiệu cảm xúc (Reaction) */}
                  {reaction && (
                    <span className="absolute -bottom-2 right-1 text-sm bg-white dark:bg-zinc-800 rounded-full px-1 shadow-md border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-50 duration-100">
                      {reaction}
                    </span>
                  )}
                </div>

                {/* Thời gian & Trạng thái đã xem */}
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

      {/* Preview Tin Nhắn Đang Trả Lời / Đang Chỉnh Sửa */}
      {replyingMessage && (
        <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Reply className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-bold shrink-0">Trả lời:</span>
            <span className="truncate">{replyingMessage.content}</span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingMessage(null)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {editingMessage && (
        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Edit3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="font-bold shrink-0">Chỉnh sửa tin nhắn</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingMessage(null);
              setInputText("");
            }}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Thanh Công Cụ Nhập Tin Nhắn (Input Action Bar) */}
      <div className="p-2 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 shrink-0 relative">
        {/* Bảng Pickers */}
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-2 z-50">
            <EmojiPicker
              onSelect={(emoji) => {
                setInputText((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}

        {showGifPicker && (
          <div className="absolute bottom-12 left-2 z-50">
            <GifPicker
              onSelect={(gifUrl) => {
                handleSendMessage(`📷 ${gifUrl}`);
                setShowGifPicker(false);
              }}
              onClose={() => setShowGifPicker(false)}
            />
          </div>
        )}

        {showStickerPicker && (
          <div className="absolute bottom-12 left-2 z-50">
            <StickerPicker
              onSelectSticker={(stickerUrl) => {
                handleSendMessage(`🏷️ ${stickerUrl}`);
                setShowStickerPicker(false);
              }}
              onClose={() => setShowStickerPicker(false)}
            />
          </div>
        )}

        {/* Input file ẩn */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleUploadImage}
          className="hidden"
        />

        {/* Giao diện khi ĐANG GHI ÂM GIỌNG NÓI */}
        {isRecording ? (
          <div className="flex items-center justify-between gap-2 p-1 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-full px-3 animate-pulse">
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>Đang ghi âm ({recordingDuration}s)...</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1.5 rounded-full hover:bg-rose-200/50 text-rose-600 transition cursor-pointer"
                title="Hủy ghi âm"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                title="Gửi tin nhắn thoại"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-1.5"
          >
            {/* Menu dấu cộng (+) mở rộng các công cụ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlusMenu(!showPlusMenu)}
                className={`p-1.5 rounded-full transition cursor-pointer ${
                  showPlusMenu
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
                title="Thêm đính kèm"
              >
                <Plus className="w-4 h-4" />
              </button>

              {showPlusMenu && (
                <div className="absolute bottom-10 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 z-50 flex flex-col gap-1 w-44 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowPlusMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Gửi ảnh / Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowStickerPicker(true);
                      setShowPlusMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                  >
                    <StickerIcon className="w-4 h-4 text-amber-500" />
                    <span>Nhãn dán Sticker</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowGifPicker(true);
                      setShowPlusMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4 text-purple-500" />
                    <span>Ảnh GIF động</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      startRecording();
                      setShowPlusMenu(false);
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-rose-500" />
                    <span>Ghi âm giọng nói</span>
                  </button>
                </div>
              )}
            </div>

            {/* Nút Emoji */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-zinc-500 hover:text-amber-500 transition cursor-pointer"
              title="Biểu tượng cảm xúc"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Ô nhập văn bản */}
            <input
              ref={textInputRef}
              type="text"
              placeholder="Nhập tin nhắn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-zinc-800 border-none rounded-full px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />

            {/* Nút Gửi hoặc Nút Quick Emoji */}
            {inputText.trim() ? (
              <button
                type="submit"
                disabled={isSending}
                className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition active:scale-95 cursor-pointer"
                title="Gửi tin nhắn"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage(quickEmoji)}
                className="p-1 text-base hover:scale-125 active:scale-90 transition-transform cursor-pointer"
                title={`Gửi nhanh (${quickEmoji})`}
              >
                {quickEmoji}
              </button>
            )}
          </form>
        )}
      </div>

      {/* Modal Chọn Theme 65+ Màu */}
      {showThemePicker && (
        <ThemePickerModal
          isOpen={showThemePicker}
          onClose={() => setShowThemePicker(false)}
          currentThemeId={theme || "DEFAULT"}
          onSelectTheme={handleSelectTheme}
          targetUserName={nickname || user.fullName || user.username}
        />
      )}

      {/* 2. BOTTOM SHEET TRÊN MOBILE (KÍCH HOẠT KHI LONG-PRESS TRÊN MÀN HÌNH NHỎ) */}
      {activeActionMessage && (
        <div
          className="block md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-end justify-center p-0 animate-in fade-in duration-150"
          onClick={() => setActiveActionMessage(null)}
        >
          <div
            className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-4 space-y-3 pb-8 shadow-2xl border-t border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-5 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Reactions Bar */}
            <div className="flex justify-around py-2 border-b border-zinc-100 dark:border-zinc-800 text-2xl">
              {["❤️", "😂", "😮", "😢", "😡", "👍"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendReaction(activeActionMessage.id, emoji)}
                  className="hover:scale-125 active:scale-90 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Menu Options */}
            <div className="space-y-1 text-zinc-700 dark:text-zinc-200 font-medium text-xs">
              <button
                type="button"
                onClick={() => {
                  setReplyingMessage(activeActionMessage);
                  setActiveActionMessage(null);
                  textInputRef.current?.focus();
                }}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                <Reply className="w-4 h-4 text-blue-500" />
                <span>Trả lời</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyMessage(activeActionMessage.content)}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-emerald-500" />
                <span>Sao chép</span>
              </button>

              <button
                type="button"
                onClick={() => handlePinMessage(activeActionMessage)}
                className="w-full flex items-center gap-3 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
              >
                <Pin className="w-4 h-4 text-amber-500" />
                <span>Ghim tin nhắn</span>
              </button>

              {Number(activeActionMessage.senderId || activeActionMessage.sender?.id) === Number(currentUserId) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessage(activeActionMessage);
                      setInputText(activeActionMessage.content);
                      setActiveActionMessage(null);
                      textInputRef.current?.focus();
                    }}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-blue-600 dark:text-blue-400 transition cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(activeActionMessage.id)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Thu hồi tin nhắn</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Khi được nhúng trực tiếp trong dropdown/modal (có onBack)
  if (onBack) {
    return (
      <div className="w-full h-full flex-1 flex flex-col overflow-hidden pointer-events-auto">
        {chatBody}
      </div>
    );
  }

  // Trên Mobile (< 768px): Mở Full Screen qua React Portal
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] w-full h-[100dvh] bg-white dark:bg-zinc-900 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
        {chatBody}
      </div>,
      document.body
    );
  }

  // Trên PC: Tab thu nhỏ
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
    <div className="w-80 h-[460px] bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-200">
      {chatBody}
    </div>
  );
}
