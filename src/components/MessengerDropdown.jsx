import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Search,
  Check,
  CheckCheck,
  X,
  Settings,
  Volume2,
  VolumeX,
  Archive,
  MessageSquarePlus,
  Loader2,
  ChevronRight,
  Bot,
  ArrowLeft,
  Shield,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import chatService from "../services/chatService";
import friendService from "../services/friendService";
import Avatar from "./Avatar";
import ChatBoxWindow from "./ChatBoxWindow";
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
  const [strangerFilter, setStrangerFilter] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [activeChatUser, setActiveChatUser] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveChatUser(null);
      setShowSettings(false);
    }
  }, [isOpen]);

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

  const [activeStatus, setActiveStatus] = useState(() => isUserActiveStatusEnabled());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("blogviet_chat_sound") !== "false";
  });

  const dropdownRef = useRef(null);

  const toggleActiveStatus = () => {
    const next = !activeStatus;
    setActiveStatus(next);
    setUserActiveStatusEnabled(next);
    toast.success(next ? "Đã bật trạng thái trực tuyến." : "Đã ẩn trạng thái trực tuyến.");
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("blogviet_chat_sound", String(next));
    toast.success(next ? "Đã bật âm thanh tin nhắn." : "Đã tắt âm thanh tin nhắn.");
  };

  const handleMarkAllAsRead = async () => {
    try {
      await chatService.markAllAsRead?.();
      setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
      toast.success("Đã đánh dấu tất cả là đã đọc!");
    } catch {
      setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
      toast.success("Đã xóa tất cả số đếm tin nhắn chưa đọc.");
    }
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

  // Lắng nghe sự kiện click ra ngoài để đóng dropdown (Chỉ trên PC Desktop >= 768px)
  useEffect(() => {
    if (!isOpen) return;
    const isMobileScreen = window.innerWidth < 768 || isMobile;
    if (isMobileScreen) return;

    const handleClickOutside = (e) => {
      // 1. Kiểm tra dropdownRef trực tiếp
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      // 2. Kiểm tra composedPath để bảo vệ các phần tử vừa re-render
      if (e.composedPath && dropdownRef.current && e.composedPath().includes(dropdownRef.current)) {
        return;
      }
      // 3. Bỏ qua nếu click vào nút mở chat trên Navbar
      const trigger = e.target.closest && (
        e.target.closest(".mobile-chat-btn") ||
        e.target.closest(".navbar-icon-btn") ||
        e.target.closest("button[title='Tin nhắn Messenger']")
      );
      if (trigger) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 100);

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isMobile, onClose]);

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

  // Handle visual viewport resize for mobile keyboard
  useEffect(() => {
    if (!isMobile) return;
    
    const handleViewportResize = () => {
      // Auto-scroll when keyboard opens/closes
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      return () => window.visualViewport.removeEventListener('resize', handleViewportResize);
    }
  }, [isMobile]);

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

  // Bạn bè đang online cho thanh Stories / Avatars ngang (chỉ hiển thị trên Mobile)
  const onlineFriends = friendsList.filter((f) => isUserOnline(f.id));

  const unreadTotal = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount > 0 ? 1 : 0),
    0
  );

  const handleSelectUser = (e, user) => {
    if (e) {
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (typeof e.stopPropagation === "function") e.stopPropagation();
    }
    if (!user) return;
    if (user.id === "ai_assistant") {
      window.dispatchEvent(new CustomEvent("open_ai_assistant"));
      onClose();
      return;
    }

    if (isMobile) {
      // Trên Mobile: Chuyển sang màn hình chat toàn màn hình trong Drawer
      setActiveChatUser(user);
    } else {
      // Trên PC: Đóng dropdown và mở duy nhất 1 Box Chat Dock ở góc dưới bên phải chuẩn Facebook
      openChat(user);
      onClose();
    }
  };

  const innerContent = (
    <>
      {/* 1. Header: Tiêu đề + Trạng thái hoạt động + Cài đặt */}
      <div className={`p-3.5 pb-2.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 shrink-0 bg-white dark:bg-zinc-900 ${isMobile ? "sticky top-0 z-10" : ""}`}>
        <div className="flex items-center gap-2">
          {/* Nút Quay Lại trên Mobile */}
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl">💬</span>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Đoạn chat
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Trạng thái hoạt động */}
          <button
            type="button"
            onClick={toggleActiveStatus}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
              activeStatus
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200/60 dark:border-zinc-700/60"
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
              showSettings
                ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400 ring-2 ring-blue-500/30"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
            title="Cài đặt tin nhắn"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Nút Đóng (Chỉ hiện trên Desktop, Mobile có nút ArrowLeft) */}
          <button
            type="button"
            onClick={onClose}
            className="hidden md:inline-flex p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CHẾ ĐỘ HIỂN THỊ: CÀI ĐẶT TOÀN DIỆN vs DANH SÁCH TIN NHẮN */}
      {showSettings ? (
        /* ================= CÀI ĐẶT & TÙY CHỌN MESSENGER SUB-VIEW ================= */
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="p-1 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cài đặt & Tùy chọn Messenger
            </span>
          </div>

          {/* Âm thanh thông báo */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${soundEnabled ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Âm thanh thông báo</span>
                <span className="text-[10px] text-zinc-500">Phát chuông khi có tin nhắn mới</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSound}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${soundEnabled ? "bg-[#0866ff]" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Trạng thái hoạt động */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${activeStatus ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                <span className={`w-3.5 h-3.5 rounded-full block ${activeStatus ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Trạng thái hoạt động</span>
                <span className="text-[10px] text-zinc-500">Hiển thị chấm xanh khi bạn trực tuyến</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleActiveStatus}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${activeStatus ? "bg-[#0866ff]" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${activeStatus ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Đánh dấu tất cả là đã đọc */}
          <div
            onClick={handleMarkAllAsRead}
            className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <CheckCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Đánh dấu tất cả là đã đọc</span>
                <span className="text-[10px] text-zinc-500">Xóa tất cả số đếm tin nhắn chưa đọc</span>
              </div>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">Thực hiện →</span>
          </div>

          {/* Bộ lọc tin nhắn người lạ */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${strangerFilter ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Bộ lọc tin nhắn người lạ</span>
                <span className="text-[10px] text-zinc-500">Lọc tin nhắn từ người chưa kết bạn</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !strangerFilter;
                setStrangerFilter(next);
                toast.success(next ? "Đã bật bộ lọc tin nhắn người lạ." : "Đã tắt bộ lọc người lạ.");
              }}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${strangerFilter ? "bg-[#0866ff]" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${strangerFilter ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Hiển thị trạng thái "Đã xem" */}
          <div className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${readReceipts ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                <CheckCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Thông báo "Đã xem"</span>
                <span className="text-[10px] text-zinc-500">Cho đối phương biết khi bạn đọc tin nhắn</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !readReceipts;
                setReadReceipts(next);
                toast.success(next ? "Đã bật trạng thái đã xem." : "Đã tắt trạng thái đã xem.");
              }}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${readReceipts ? "bg-[#0866ff]" : "bg-zinc-300 dark:bg-zinc-700"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${readReceipts ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {/* Kho lưu trữ tin nhắn */}
          <div
            onClick={() => {
              setActiveFilter("archived");
              setShowSettings(false);
            }}
            className="p-3 rounded-2xl bg-zinc-50/90 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Archive className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Kho tin nhắn lưu trữ</span>
                <span className="text-[10px] text-zinc-500">Xem các cuộc hội thoại đã lưu trữ</span>
              </div>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Xem →</span>
          </div>

          {/* Bảo mật SSL / TLS */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              Mã hóa bảo mật đường truyền SSL/TLS 256-bit đang kích hoạt.
            </span>
          </div>
        </div>
      ) : (
        /* ================= DANH SÁCH TIN NHẮN & BẠN BÈ ================= */
        <>
          {/* 3. Search Bar Input */}
          <div className="px-3.5 pt-2.5 pb-2 shrink-0 bg-white dark:bg-zinc-900">
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

          {/* 4. Active Stories / Online Friends Bar (CHỈ HIỂN THỊ TRÊN MOBILE `sm:hidden`, ĐÃ BỎ TRÊN DESKTOP) */}
          <div className="sm:hidden px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center gap-3 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-zinc-900">
            {/* BlogViet AI Bot Story Item */}
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectUser(e, AI_BOT_USER);
              }}
              className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer touch-manipulation select-none relative z-20"
              title="Trò chuyện cùng BlogViet AI Bot"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 group-hover:scale-105 transition-transform pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-xs font-black text-xs border-2 border-white dark:border-zinc-900">
                  BA
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-1 ring-white dark:ring-zinc-900 flex items-center justify-center text-[8px]">
                  ✨
                </span>
              </div>
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 max-w-[50px] truncate pointer-events-none">
                BlogViet
              </span>
            </button>

            {/* Online Friends List */}
            {onlineFriends.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectUser(e, f);
                }}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer touch-manipulation select-none relative z-20"
                title={`Nhắn tin với ${f.fullName || f.username}`}
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 group-hover:scale-105 transition-transform pointer-events-none">
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
                <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 max-w-[52px] truncate pointer-events-none">
                  {f.fullName ? f.fullName.split(" ").pop() : f.username}
                </span>
              </button>
            ))}
          </div>

          {/* 5. Filter Tabs Pills */}
          <div className="px-3.5 py-2 flex items-center gap-1.5 shrink-0 border-b border-zinc-100/80 dark:border-zinc-800/50 bg-white dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer touch-manipulation ${
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
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer touch-manipulation ${
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
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1 touch-manipulation ${
                activeFilter === "ai"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Bot className="w-3 h-3 text-amber-500" />
              <span>AI Bot</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("archived")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer touch-manipulation ${
                activeFilter === "archived"
                  ? "bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] dark:text-blue-400"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Lưu trữ
            </button>
          </div>

          {/* 6. Danh Sách Cuộc Trò Chuyện & Bạn Bè (Cuộn mượt mà) */}
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/40 scrollbar-thin bg-white dark:bg-zinc-900 touch-manipulation"
          >
            {loading ? (
              <div className="p-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#0866ff]" />
                <span className="text-xs">Đang tải cuộc trò chuyện...</span>
              </div>
            ) : activeFilter === "ai" ? (
              /* TAB AI BOT CHAT ROW */
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectUser(e, AI_BOT_USER);
                }}
                className="w-full p-3.5 flex items-center gap-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 active:bg-indigo-100/60 cursor-pointer transition text-left border-0 bg-transparent touch-manipulation select-none relative z-20"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md font-bold text-sm shrink-0 pointer-events-none">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pointer-events-none">
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
              </button>
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
                    <button
                      key={partner.id || item.conversationId}
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelectUser(e, partner);
                      }}
                      className="w-full p-3 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800 cursor-pointer transition relative group text-left border-0 bg-transparent touch-manipulation select-none z-20"
                    >
                      {/* Avatar Partner */}
                      <div className="relative shrink-0 pointer-events-none">
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
                      <div className="flex-1 min-w-0 pointer-events-none">
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
                    </button>
                  );
                })}

                {/* Danh sách gợi ý bạn bè để bắt đầu trò chuyện */}
                {filteredFriends.length > 0 && (
                  <div className="pt-2">
                    <div className="px-3.5 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-800/30">
                      Gợi ý kết nối bạn bè
                    </div>
                    {filteredFriends.map((friend) => (
                      <button
                        key={friend.id}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectUser(e, friend);
                        }}
                        className="w-full p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800 cursor-pointer transition text-left border-0 bg-transparent touch-manipulation select-none relative z-20"
                      >
                        <div className="flex items-center gap-3 min-w-0 pointer-events-none">
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

                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-[#0866ff] hover:bg-blue-100 transition shrink-0 pointer-events-none">
                          Nhắn tin
                        </span>
                      </button>
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
        </>
      )}
    </>
  );

  if (isMobile) {
    return createPortal(
      <div
        ref={dropdownRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-900 w-full h-[100dvh] flex flex-col overflow-hidden animate-in fade-in duration-150 text-left pointer-events-auto"
      >
        {activeChatUser ? (
          <ChatBoxWindow
            chat={{
              user: activeChatUser,
              isMinimized: false,
              theme: activeChatUser.theme || "DEFAULT",
            }}
            onBack={() => setActiveChatUser(null)}
          />
        ) : (
          innerContent
        )}
      </div>,
      document.body
    );
  }

  return (
    <div
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute top-full right-0 w-[380px] h-[580px] mt-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200/90 dark:border-zinc-800 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-left pointer-events-auto"
      style={{
        boxShadow:
          "0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 1px rgba(0, 0, 0, 0.15)",
      }}
    >
      {activeChatUser ? (
        <ChatBoxWindow
          chat={{
            user: activeChatUser,
            isMinimized: false,
            theme: activeChatUser.theme || "DEFAULT",
          }}
          onBack={() => setActiveChatUser(null)}
        />
      ) : (
        innerContent
      )}
    </div>
  );
}
