import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  Phone,
  Video,
  Send,
  Image,
  Camera,
  Smile,
  Copy,
  Trash2,
  Edit2,
  Check,
  Loader2,
  PhoneOff,
  MoreHorizontal,
  Mic,
  Square,
  Sticker,
  Pin,
  PinOff,
  ChevronDown,
  CheckCheck,
  Clock,
  Search,
  Heart,
  Sparkles,
  Settings,
  SquarePen,
  Bell,
  BellOff,
  Archive,
  ArchiveRestore,
  Volume2,
  VolumeX,
  Shield,
  UserX,
  MessageSquarePlus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import chatService from "../services/chatService";
import uploadService from "../services/uploadService";
import AudioMessagePlayer from "./AudioMessagePlayer";
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";
import { isUserOnline, formatLastActive, isUserActiveStatusEnabled, setUserActiveStatusEnabled } from "../utils/statusUtils";
import StickerPicker from "./StickerPicker";
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

function formatTime(dateStr) {
  if (!dateStr) return "";
  let formatted = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formatted = dateStr + "Z";
  }
  const d = new Date(formatted);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFullTime(dateStr) {
  if (!dateStr) return "";
  let formatted = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formatted = dateStr + "Z";
  }
  const d = new Date(formatted);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

function playNotificationSound() {
  try {
    if (localStorage.getItem("blogviet_chat_sound") === "false") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export default function FloatingChatWidget() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [conversationsMap, setConversationsMap] = useState({});
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  // Messenger Tabs: "all" | "unread" | "ai" | "archived"
  const [listTab, setListTab] = useState("all");
  const [showSettingsView, setShowSettingsView] = useState(false);
  const [activeFriendMenuId, setActiveFriendMenuId] = useState(null);

  // Sound preference state
  const [chatSoundEnabled, setChatSoundEnabled] = useState(() => {
    return localStorage.getItem("blogviet_chat_sound") !== "false";
  });

  // Archived Chats Map ({ [friendId]: boolean })
  const [archivedChats, setArchivedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blogviet_archived_chats") || "{}");
    } catch {
      return {};
    }
  });

  // Muted Chats Map ({ [friendId]: boolean })
  const [mutedChats, setMutedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blogviet_muted_chats") || "{}");
    } catch {
      return {};
    }
  });

  // Pinned Chats Map ({ [friendId]: boolean })
  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blogviet_pinned_chats") || "{}");
    } catch {
      return {};
    }
  });

  // Privacy & Safety Sub-View States (stay inside Messenger drawer)
  const [showPrivacySubView, setShowPrivacySubView] = useState(false);
  const [blockedUsersMap, setBlockedUsersMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blogviet_blocked_chat_users") || "{}");
    } catch {
      return {};
    }
  });
  const [strangerFilterEnabled, setStrangerFilterEnabled] = useState(() => {
    return localStorage.getItem("blogviet_stranger_filter") !== "false";
  });
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(() => {
    return localStorage.getItem("blogviet_read_receipts") !== "false";
  });

  // Pinned Messages state (persisted per conversation)
  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pinned_chat_messages") || "{}");
    } catch {
      return {};
    }
  });

  // Message Reactions state (persisted in localStorage: { [msgId]: { [userId]: emoji } })
  const [messageReactions, setMessageReactions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_message_reactions") || "{}");
    } catch {
      return {};
    }
  });
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);

  // Image Upload Preview state
  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  // Typing state
  const [isFriendTyping, setIsFriendTyping] = useState(false);

  // Scroll to bottom states
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMsgCountWhileScrolled, setNewMsgCountWhileScrolled] = useState(0);

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);
  const imageInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const callStreamRef = useRef(null);
  const prevMsgLengthRef = useRef(0);
  const typingTimerRef = useRef(null);

  // MediaRecorder Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  // 1. Fetch friend list
  useEffect(() => {
    if (!currentUserId) return;
    const fetchFriends = async () => {
      try {
        const friendsRes = await friendService
          .getFriendsList(currentUserId)
          .catch(() => ({ data: [] }));
        const rawFriends = friendsRes.data || [];
        const apiFriendsList = rawFriends
          .map((f) => f.friend || f.user || f)
          .filter((f) => f && f.id && String(f.id) !== String(currentUserId));

        const friendMap = new Map();
        apiFriendsList.forEach((u) => {
          if (u && u.id && String(u.id) !== String(currentUserId)) {
            friendMap.set(String(u.id), u);
          }
        });
        setFriends(Array.from(friendMap.values()));
      } catch {
        setFriends([]);
      }
    };
    fetchFriends();
  }, [currentUserId]);

  // 2. Poll unread summaries (Luôn cập nhật số đếm tin nhắn chưa đọc dù widget đang đóng hay mở)
  useEffect(() => {
    if (!currentUserId || friends.length === 0) return;

    const fetchAllSummaries = async () => {
      const realFriends = friends.filter((f) => f && f.id);
      if (realFriends.length === 0) return;

      try {
        const results = await Promise.all(
          realFriends.map((friend) =>
            chatService.getHistory(currentUserId, friend.id).catch(() => ({ data: [] }))
          )
        );

        const newMap = { ...conversationsMap };
        let totalUnread = 0;

        results.forEach((res, idx) => {
          const friend = realFriends[idx];
          const history = res.data || [];
          if (history.length === 0) return;

          const lastMsg = history[history.length - 1];
          const unreadCount = history.filter(
            (m) => String(m.senderId || m.sender?.id) === String(friend.id) && !m.read && !m.isRead
          ).length;

          const isCurrentActive = isOpen && String(activeFriend?.id) === String(friend.id);
          const effectiveUnread = isCurrentActive ? 0 : unreadCount;

          let previewContent = lastMsg.content || "Đã gửi 1 tệp đính kèm";
          if (previewContent.startsWith("📷 http")) previewContent = "📷 [Hình ảnh]";
          if (previewContent.startsWith("🏷️ http")) previewContent = "🏷️ [Nhãn dán]";
          if (previewContent.startsWith("🎙️ http")) previewContent = "🎙️ [Tin nhắn thoại]";

          newMap[friend.id] = {
            lastMessage: previewContent,
            unreadCount: effectiveUnread,
            timestamp: lastMsg.createdAt,
          };
          totalUnread += effectiveUnread;
        });

        setConversationsMap(newMap);
        setUnreadChatCount(totalUnread);
      } catch {}
    };

    fetchAllSummaries();
    const interval = setInterval(fetchAllSummaries, 12000);
    return () => clearInterval(interval);
  }, [currentUserId, friends, isOpen, activeFriend?.id]);

  // 3. Mark conversation as read
  const markConversationAsRead = (friendId) => {
    setConversationsMap((prev) => ({
      ...prev,
      [friendId]: {
        ...(prev[friendId] || {}),
        unreadCount: 0,
      },
    }));
    if (currentUserId && friendId) {
      chatService.markAsRead(friendId, currentUserId).catch(() => {});
    }
  };

  // 4. Fetch chat history with active friend
  useEffect(() => {
    let timer;
    if (currentUserId && activeFriend?.id) {
      const fetchChat = () => {
        chatService
          .getHistory(currentUserId, activeFriend.id)
          .then((res) => {
            const list = res.data || [];
            if (list.length > prevMsgLengthRef.current) {
              const diff = list.length - prevMsgLengthRef.current;
              const lastMsg = list[list.length - 1];
              if (lastMsg && Number(lastMsg.senderId || lastMsg.sender?.id) !== currentUserId) {
                playNotificationSound();
                if (userScrolledUpRef.current) {
                  setNewMsgCountWhileScrolled((prev) => prev + diff);
                }
              }
            }
            prevMsgLengthRef.current = list.length;
            setMessages(list);

            // Chỉ đánh dấu đã đọc khi người nhận đang thực sự mở và xem đoạn chat này
            if (isOpen && activeFriend?.id) {
              const hasUnreadFromFriend = list.some(
                (m) =>
                  Number(m.senderId || m.sender?.id) === Number(activeFriend.id) &&
                  !m.read &&
                  !m.isRead
              );
              if (hasUnreadFromFriend) {
                markConversationAsRead(activeFriend.id);
              }
            }
          })
          .catch(() => {});
      };

      fetchChat();
      timer = setInterval(fetchChat, 4000);
    }
    return () => timer && clearInterval(timer);
  }, [isOpen, currentUserId, activeFriend]);

  // 5. Auto scroll to bottom
  const handleScrollChat = (e) => {
    const el = e.target;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceToBottom < 100;
    userScrolledUpRef.current = !isNearBottom;
    setShowScrollBottom(!isNearBottom);
    if (isNearBottom) {
      setNewMsgCountWhileScrolled(0);
    }
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
    setNewMsgCountWhileScrolled(0);
  };

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  // Real-time Live Typing Broadcast Listener (Across Tabs & Windows)
  useEffect(() => {
    let channel;
    const handleBroadcastTyping = (e) => {
      const { senderId, receiverId, isTyping } = e.data || {};
      if (
        activeFriend?.id &&
        currentUserId &&
        Number(senderId) === Number(activeFriend.id) &&
        Number(receiverId) === Number(currentUserId)
      ) {
        setIsFriendTyping(Boolean(isTyping));
      }
    };

    try {
      channel = new BroadcastChannel("blogviet_chat_typing");
      channel.addEventListener("message", handleBroadcastTyping);
    } catch {}

    const handleCustomTyping = (e) => {
      const { senderId, receiverId, isTyping } = e.detail || {};
      if (
        activeFriend?.id &&
        currentUserId &&
        Number(senderId) === Number(activeFriend.id) &&
        Number(receiverId) === Number(currentUserId)
      ) {
        setIsFriendTyping(Boolean(isTyping));
      }
    };
    window.addEventListener("chat_typing_event", handleCustomTyping);

    return () => {
      if (channel) {
        channel.removeEventListener("message", handleBroadcastTyping);
        channel.close();
      }
      window.removeEventListener("chat_typing_event", handleCustomTyping);
    };
  }, [activeFriend, currentUserId]);

  useEffect(() => {
    userScrolledUpRef.current = false;
    setShowScrollBottom(false);
    setNewMsgCountWhileScrolled(0);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
  }, [activeFriend]);

  // Event listener for opening chat from profile or external buttons
  useEffect(() => {
    const handleOpenChat = (e) => {
      const friend = e.detail?.friend;
      if (friend) {
        setIsOpen(true);
        setActiveFriend(friend);
      }
    };
    const handleCloseChat = () => {
      setIsOpen(false);
    };
    const handleOpenAi = () => {
      // Khi mở AI Assistant, tự động đóng hộp thoại chat cá nhân để tránh xung đột giao diện
      setIsOpen(false);
    };

    window.addEventListener("open_chat_user", handleOpenChat);
    window.addEventListener("close_chat_widget", handleCloseChat);
    window.addEventListener("open_ai_assistant", handleOpenAi);
    return () => {
      window.removeEventListener("open_chat_user", handleOpenChat);
      window.removeEventListener("close_chat_widget", handleCloseChat);
      window.removeEventListener("open_ai_assistant", handleOpenAi);
    };
  }, []);

  // WebRTC Call Stream
  useEffect(() => {
    if (activeCall) {
      navigator.mediaDevices
        ?.getUserMedia({ video: activeCall.type === "video", audio: true })
        .then((stream) => {
          callStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {});
    } else {
      if (callStreamRef.current) {
        callStreamRef.current.getTracks().forEach((t) => t.stop());
        callStreamRef.current = null;
      }
    }
  }, [activeCall?.type]);

  useEffect(() => {
    let timer;
    if (activeCall) {
      timer = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, seconds: (prev.seconds || 0) + 1 } : null));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [activeCall?.type]);

  // Clean up recording on unmount or active friend change
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeFriend]);

  if (!currentUser) return null;

  // Quick Chat Management Handlers
  const handleTogglePinChat = (friendId, e) => {
    e?.stopPropagation();
    setActiveFriendMenuId(null);
    setPinnedChats((prev) => {
      const next = { ...prev, [friendId]: !prev[friendId] };
      localStorage.setItem("blogviet_pinned_chats", JSON.stringify(next));
      toast.success(next[friendId] ? "Đã ghim cuộc trò chuyện lên đầu" : "Đã bỏ ghim cuộc trò chuyện");
      return next;
    });
  };

  const handleToggleMuteChat = (friendId, e) => {
    e?.stopPropagation();
    setActiveFriendMenuId(null);
    setMutedChats((prev) => {
      const next = { ...prev, [friendId]: !prev[friendId] };
      localStorage.setItem("blogviet_muted_chats", JSON.stringify(next));
      toast.success(next[friendId] ? "Đã tắt thông báo cuộc trò chuyện" : "Đã bật lại thông báo cuộc trò chuyện");
      return next;
    });
  };

  const handleToggleArchiveChat = (friendId, e) => {
    e?.stopPropagation();
    setActiveFriendMenuId(null);
    setArchivedChats((prev) => {
      const next = { ...prev, [friendId]: !prev[friendId] };
      localStorage.setItem("blogviet_archived_chats", JSON.stringify(next));
      toast.success(next[friendId] ? "Đã chuyển vào tin nhắn lưu trữ" : "Đã khôi phục vào hộp thư chính");
      return next;
    });
  };

  const handleToggleUnreadChat = (friendId, e) => {
    e?.stopPropagation();
    setActiveFriendMenuId(null);
    setConversationsMap((prev) => {
      const current = prev[friendId]?.unreadCount || 0;
      const nextCount = current > 0 ? 0 : 1;
      const next = {
        ...prev,
        [friendId]: {
          ...(prev[friendId] || {}),
          unreadCount: nextCount,
        },
      };
      toast.success(nextCount > 0 ? "Đã đánh dấu là chưa đọc" : "Đã đánh dấu là đã đọc");
      return next;
    });
  };

  const handleDeleteConversation = (friend, e) => {
    e?.stopPropagation();
    setActiveFriendMenuId(null);
    if (!friend?.id) return;
    setConversationsMap((prev) => {
      const next = { ...prev };
      delete next[friend.id];
      return next;
    });
    if (activeFriend?.id === friend.id) {
      setMessages([]);
      setActiveFriend(null);
    }
    toast.success(`Đã xóa đoạn hội thoại với ${friend.fullName || friend.username}`);
  };

  const handleMarkAllAsRead = () => {
    setConversationsMap((prev) => {
      const next = {};
      Object.keys(prev).forEach((k) => {
        next[k] = { ...prev[k], unreadCount: 0 };
      });
      return next;
    });
    setUnreadChatCount(0);
    toast.success("Đã đánh dấu tất cả cuộc trò chuyện là đã đọc!");
  };

  const handleToggleChatSound = () => {
    const next = !chatSoundEnabled;
    setChatSoundEnabled(next);
    localStorage.setItem("blogviet_chat_sound", String(next));
    toast.success(next ? "Đã bật âm thanh thông báo tin nhắn" : "Đã tắt âm thanh thông báo tin nhắn");
  };

  const handleToggleBlockUser = (userId, name) => {
    setBlockedUsersMap((prev) => {
      const isBlocked = Boolean(prev[userId]);
      const next = { ...prev, [userId]: !isBlocked };
      localStorage.setItem("blogviet_blocked_chat_users", JSON.stringify(next));
      toast.success(isBlocked ? `Đã bỏ chặn tin nhắn từ ${name || "người dùng"}` : `Đã chặn tin nhắn từ ${name || "người dùng"}`);
      return next;
    });
  };

  const handleToggleStrangerFilter = () => {
    const next = !strangerFilterEnabled;
    setStrangerFilterEnabled(next);
    localStorage.setItem("blogviet_stranger_filter", String(next));
    toast.success(next ? "Đã bật bộ lọc tin nhắn người lạ" : "Đã tắt bộ lọc tin nhắn người lạ");
  };

  const handleToggleReadReceipts = () => {
    const next = !readReceiptsEnabled;
    setReadReceiptsEnabled(next);
    localStorage.setItem("blogviet_read_receipts", String(next));
    toast.success(next ? "Đã bật hiển thị Đã xem tin nhắn" : "Đã ẩn trạng thái Đã xem tin nhắn");
  };

  // Handle Input Change with Broadcast Typing Indicator
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);

    if (activeFriend?.id && currentUserId) {
      try {
        const ch = new BroadcastChannel("blogviet_chat_typing");
        ch.postMessage({
          senderId: currentUserId,
          receiverId: activeFriend.id,
          isTyping: true,
        });
        ch.close();
      } catch {}

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        try {
          const ch = new BroadcastChannel("blogviet_chat_typing");
          ch.postMessage({
            senderId: currentUserId,
            receiverId: activeFriend.id,
            isTyping: false,
          });
          ch.close();
        } catch {}
      }, 2500);
    }
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !currentUserId || !activeFriend?.id) return;
    const text = inputMessage.trim();
    setInputMessage("");

    // Dừng phát tín hiệu đang soạn tin ngay khi bấm gửi
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    try {
      const ch = new BroadcastChannel("blogviet_chat_typing");
      ch.postMessage({
        senderId: currentUserId,
        receiverId: activeFriend.id,
        isTyping: false,
      });
      ch.close();
    } catch {}

    try {
      const res = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      toast.error("Không thể gửi tin nhắn!");
    }
  };

  // Send Direct Message (Quick greeting templates)
  const handleSendDirectMessage = async (customText) => {
    const text = (customText || "").trim();
    if (!text || !currentUserId || !activeFriend?.id) return;

    try {
      const res = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, res.data]);
      toast.success("Đã gửi lời chào!");
    } catch (err) {
      toast.error("Không thể gửi tin nhắn!");
    }
  };

  // Toggle Reaction on Message (❤️, 👍, 😂, 😮, 😢, 🔥)
  const handleToggleReaction = (msgId, emoji) => {
    if (!msgId || !currentUserId) return;
    setMessageReactions((prev) => {
      const msgReacts = prev[msgId] || {};
      const currentReact = msgReacts[currentUserId];
      const updatedMsgReacts = { ...msgReacts };
      if (currentReact === emoji) {
        delete updatedMsgReacts[currentUserId];
      } else {
        updatedMsgReacts[currentUserId] = emoji;
      }
      const updatedAll = { ...prev, [msgId]: updatedMsgReacts };
      try {
        localStorage.setItem("chat_message_reactions", JSON.stringify(updatedAll));
      } catch {}
      return updatedAll;
    });
    setReactionPickerMsgId(null);
  };

  // Image Upload with Instant Preview
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend?.id) return;
    setPreviewImageFile(file);
    setPreviewImageUrl(URL.createObjectURL(file));
  };

  const handleCancelPreviewImage = () => {
    if (previewImageUrl) {
      try { URL.revokeObjectURL(previewImageUrl); } catch {}
    }
    setPreviewImageFile(null);
    setPreviewImageUrl("");
  };

  const handleConfirmSendPreviewImage = async () => {
    if (!previewImageFile || !activeFriend?.id || uploadingImage) return;
    const file = previewImageFile;
    const fileCaption = inputMessage.trim();
    setInputMessage("");
    setUploadingImage(true);
    handleCancelPreviewImage();
    try {
      const res = await uploadService.uploadFile(file);
      const imageUrl = res.data.url || res.data;
      const text = fileCaption ? `📷 ${imageUrl}\n${fileCaption}` : `📷 ${imageUrl}`;

      const resMsg = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, resMsg.data]);
    } catch {
      toast.error("Không thể tải ảnh lên!");
    } finally {
      setUploadingImage(false);
    }
  };

  // Send Animated GIF
  const handleSendGif = async (gifUrl) => {
    if (!gifUrl || !activeFriend?.id) return;
    const text = `📷 ${gifUrl}`;

    try {
      const resMsg = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, resMsg.data]);
    } catch {
      toast.error("Không thể gửi ảnh GIF!");
    }
  };

  // Send Sticker
  const handleSendSticker = async (stickerUrl) => {
    if (!stickerUrl || !activeFriend?.id) return;
    const text = `🏷️ ${stickerUrl}`;

    try {
      const resMsg = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, resMsg.data]);
    } catch {
      toast.error("Không thể gửi nhãn dán!");
    }
  };

  // Toggle Pin Message
  const handleTogglePinMessage = (msg) => {
    if (!activeFriend?.id || !msg) return;
    setPinnedMessages((prev) => {
      const isCurrentlyPinned = prev[activeFriend.id]?.id === msg.id;
      const updated = { ...prev };
      if (isCurrentlyPinned) {
        delete updated[activeFriend.id];
        toast.success("Đã bỏ ghim tin nhắn!");
      } else {
        const senderName =
          Number(msg.senderId || msg.sender?.id) === currentUserId
            ? "Bạn"
            : activeFriend.fullName || activeFriend.username || "Đối phương";
        updated[activeFriend.id] = {
          id: msg.id,
          content: msg.content,
          senderName,
          createdAt: msg.createdAt,
        };
        toast.success("Đã ghim tin nhắn lên đầu!");
      }
      try {
        localStorage.setItem("pinned_chat_messages", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setActiveMsgMenuId(null);
  };

  // -------------------------------------------------------------
  // VOICE RECORDING (HTML5 MediaRecorder & Cloudinary Audio Upload)
  // -------------------------------------------------------------
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Lỗi cấp quyền Micro:", err);
      toast.error("Không thể truy cập Microphone. Vui lòng cấp quyền ghi âm!");
    }
  };

  const handleStopAndSendVoice = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }

      if (audioChunksRef.current.length === 0) {
        toast.error("Không có dữ liệu âm thanh!");
        return;
      }

      const mimeType = recorder.mimeType || "audio/webm";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const audioFile = new File([audioBlob], `voice_${Date.now()}.${extension}`, {
        type: mimeType,
      });

      setIsUploadingVoice(true);
      try {
        const uploadRes = await uploadService.uploadFile(audioFile);
        const audioUrl = uploadRes.data?.url || uploadRes.data?.secureUrl || uploadRes.data;
        const voiceText = `🎙️ ${audioUrl}`;

        if (activeFriend?.id) {
          const res = await chatService.sendMessage(currentUserId, activeFriend.id, voiceText);
          setMessages((prev) => [...prev, res.data]);
        }
      } catch (err) {
        console.error("Lỗi gửi tin nhắn thoại:", err);
        toast.error("Không thể gửi tin nhắn thoại. Vui lòng thử lại!");
      } finally {
        setIsUploadingVoice(false);
      }
    };

    recorder.stop();
  };

  const handleCancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    toast.info("Đã hủy ghi âm");
  };

  const handleCopyMessage = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast.success("Đã sao chép tin nhắn!");
  };

  const handleEditMessage = async (msgId) => {
    if (!editingText.trim() || !activeFriend?.id) return;
    const newContent = editingText.trim();
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: newContent } : m)));
    setEditingMsgId(null);
    setEditingText("");
    toast.success("Đã chỉnh sửa tin nhắn!");
    try {
      await chatService.editMessage(msgId, newContent);
    } catch {}
  };

  const handleDeleteMessage = async (msgId) => {
    if (!activeFriend?.id) return;
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast.success("Đã xóa tin nhắn!");
    try {
      await chatService.deleteMessage(msgId);
    } catch {}
  };

  const formatRecTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Tìm tin nhắn cuối cùng của CHÍNH MÌNH đã được đối phương đọc
  const mySentMessages = messages.filter((m) => Number(m.senderId || m.sender?.id) === currentUserId);
  const myReadMessages = mySentMessages.filter((m) => m.isRead || m.read);
  const lastReadMessageId = myReadMessages.length > 0 ? myReadMessages[myReadMessages.length - 1].id : null;

  return (
    <>
      {/* Floating Messenger Icon Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Nhắn tin với bạn bè"
          className="fixed bottom-[4.25rem] sm:bottom-6 right-3.5 sm:right-6 z-40 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer border border-zinc-200/20"
        >
          <span className="text-lg sm:text-2xl">💬</span>
          {unreadChatCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] md:text-[11px] font-black rounded-full min-w-5 h-5 flex items-center justify-center px-1 border-2 border-white dark:border-zinc-900 shadow-lg animate-pulse">
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window: Full-screen on Mobile, Floating popup on Tablet/Desktop */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:w-96 md:w-88 h-[100dvh] sm:h-[540px] max-h-[100dvh] sm:max-h-[calc(100dvh-75px)] z-[9999] bg-white dark:bg-zinc-950 border-0 sm:border sm:border-zinc-200 sm:dark:border-zinc-800 shadow-2xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {activeFriend ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (isRecording) handleCancelRecording();
                      setActiveFriend(null);
                    }}
                    className="p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                  </button>
                  <div
                    onClick={() =>
                      activeFriend.id && navigate(`/profile/${activeFriend.id}`)
                    }
                    className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 group"
                  >
                    <Avatar
                      userId={activeFriend.id}
                      src={activeFriend.avatarUrl}
                      name={activeFriend.fullName || activeFriend.username}
                      username={activeFriend.username}
                      avatarColor={activeFriend.avatarColor}
                      size="sm"
                      isOnline={activeFriend.isOnline}
                      lastActiveAt={activeFriend.lastActiveAt}
                      showActiveStatus={!activeFriend.isAi && activeFriend.showActiveStatus !== false}
                      className="border border-zinc-200 dark:border-zinc-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100 group-hover:underline">
                        {activeFriend.fullName || activeFriend.username}
                      </span>
                      <span className={`text-[10px] truncate ${!activeFriend.isAi && isUserOnline(activeFriend) ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-zinc-400"}`}>
                        {activeFriend.isAi ? "Trợ lý AI" : (formatLastActive(activeFriend) || "Ngoại tuyến")}
                      </span>
                    </div>
                  </div>

                  {/* Audio / Video Call & Typing Test Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFriendTyping(true);
                        setTimeout(() => setIsFriendTyping(false), 3500);
                        toast.info(`Đang kích hoạt hiệu ứng 3 chấm soạn tin từ ${activeFriend?.fullName || activeFriend?.username}!`);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Xem thử hiệu ứng 3 chấm đang soạn tin nhắn"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCall({ type: "voice", friend: activeFriend, seconds: 0 })}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Gọi thoại"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCall({ type: "video", friend: activeFriend, seconds: 0 })}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                      title="Gọi video HD"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full pr-1">
                  <div className="flex items-center gap-1.5">
                    {/* Nút Quay lại / Đóng chat trên Mobile */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isRecording) handleCancelRecording();
                        setIsOpen(false);
                      }}
                      className="sm:hidden p-1.5 -ml-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                      title="Quay lại"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-base">💬</span>
                    <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                      Tin nhắn bạn bè
                    </span>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-1">
                    {/* Active Status Quick Toggle */}
                    {currentUserId && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextState = !isUserActiveStatusEnabled(currentUserId);
                          setUserActiveStatusEnabled(currentUserId, nextState);
                          toast.success(nextState ? "Đã bật trạng thái hoạt động (Trực tuyến)" : "Đã tắt trạng thái hoạt động (Ẩn)");
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer active:scale-95 shadow-2xs"
                        title="Bật/Tắt trạng thái hoạt động của bạn"
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isUserActiveStatusEnabled(currentUserId) ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium hidden xs:inline">
                          {isUserActiveStatusEnabled(currentUserId) ? "Trực tuyến" : "Đang ẩn"}
                        </span>
                      </button>
                    )}

                    {/* Settings Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowSettingsView(true)}
                      className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
                      title="Cài đặt tin nhắn"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (isRecording) handleCancelRecording();
                setIsOpen(false);
              }}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer ml-1"
              title="Đóng chat"
            >
              <X className="w-5 h-5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-50/50 dark:bg-zinc-950/60">
            {showSettingsView && !activeFriend ? (
              showPrivacySubView ? (
                /* In-Messenger Privacy & Safety Sub-View */
                <div className="p-4 flex flex-col gap-3 animate-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPrivacySubView(false)}
                        className="p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                        title="Quay lại Cài đặt"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Quyền riêng tư & An toàn Chat
                      </span>
                    </div>
                  </div>

                  {/* Stranger Message Filter */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${strangerFilterEnabled ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Bộ lọc tin nhắn người lạ
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Chuyển tin nhắn từ người chưa kết bạn vào tin nhắn chờ
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleStrangerFilter}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ml-2 ${strangerFilterEnabled ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${strangerFilterEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Read Receipts Status */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${readReceiptsEnabled ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                        <CheckCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Hiển thị trạng thái "Đã xem"
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Cho phép người khác biết khi bạn đã xem tin nhắn
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleReadReceipts}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ml-2 ${readReceiptsEnabled ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${readReceiptsEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Blocked Users Section in Chat */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Chặn tin nhắn ({Object.values(blockedUsersMap).filter(Boolean).length})
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        Chặn gửi/nhận tin nhắn
                      </span>
                    </div>

                    {Object.values(blockedUsersMap).filter(Boolean).length === 0 ? (
                      <div className="py-3 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl">
                        Hiện không có người dùng nào bị chặn tin nhắn.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                        {friends
                          .filter((f) => blockedUsersMap[f.id])
                          .map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar
                                  userId={f.id}
                                  src={f.avatarUrl}
                                  name={f.fullName || f.username}
                                  size="xs"
                                />
                                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                  {f.fullName || f.username}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleBlockUser(f.id, f.fullName || f.username)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                Bỏ chặn
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Encryption Badge */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                      Mã hóa bảo mật đường truyền SSL/TLS 256-bit đang kích hoạt.
                    </span>
                  </div>
                </div>
              ) : (
                /* Settings View with smooth slide-in */
                <div className="p-4 flex flex-col gap-3 animate-in slide-in-from-right-4 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSettingsView(false)}
                        className="p-1.5 -ml-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                        title="Quay lại danh sách"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Cài đặt & Tùy chọn Messenger
                      </span>
                    </div>
                  </div>

                  {/* Sound Settings Card */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${chatSoundEnabled ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                        {chatSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Âm thanh thông báo
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Phát âm thanh khi có tin nhắn mới đến
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleChatSound}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${chatSoundEnabled ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${chatSoundEnabled ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Active Status Settings Card */}
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isUserActiveStatusEnabled(currentUserId) ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"}`}>
                        <span className={`w-3.5 h-3.5 rounded-full block ${isUserActiveStatusEnabled(currentUserId) ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Trạng thái hoạt động
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Hiển thị chấm xanh khi bạn đang trực tuyến
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isUserActiveStatusEnabled(currentUserId);
                        setUserActiveStatusEnabled(currentUserId, next);
                        toast.success(next ? "Đã bật trạng thái trực tuyến" : "Đã tắt trạng thái trực tuyến (Ẩn)");
                      }}
                      className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer relative ${isUserActiveStatusEnabled(currentUserId) ? "bg-black dark:bg-white" : "bg-zinc-300 dark:bg-zinc-700"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white dark:bg-black transition-transform ${isUserActiveStatusEnabled(currentUserId) ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {/* Mark All Read Action */}
                  <div
                    onClick={handleMarkAllAsRead}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <CheckCheck className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Đánh dấu tất cả là đã đọc
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Xóa tất cả số đếm tin nhắn chưa đọc
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 font-semibold">
                      Thực hiện →
                    </span>
                  </div>

                  {/* Archived Messages Quick Jump */}
                  <div
                    onClick={() => {
                      setListTab("archived");
                      setShowSettingsView(false);
                    }}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        <Archive className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Kho tin nhắn lưu trữ
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Xem và khôi phục các cuộc trò chuyện đã ẩn
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full">
                      {Object.values(archivedChats).filter(Boolean).length}
                    </span>
                  </div>

                  {/* In-Messenger Privacy & Safety Drawer Button */}
                  <div
                    onClick={() => setShowPrivacySubView(true)}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-2xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          Quyền riêng tư & Bảo mật chat
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Chặn tin nhắn, tin nhắn chờ và quyền riêng tư
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 font-semibold">
                      Xem →
                    </span>
                  </div>
                </div>
              )
            ) : !activeFriend ? (
              /* Friends List */
              <div className="p-3 flex flex-col gap-2">
                {/* Friends Search Input Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm người nhắn, bạn bè..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-[#0866ff] rounded-xl py-2 pl-9 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition shadow-2xs"
                  />
                  {friendSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFriendSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                      title="Xóa tìm kiếm"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Messenger Filter Tabs Bar */}
                <div className="flex items-center gap-1 p-1 rounded-2xl bg-zinc-200/60 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto no-scrollbar shrink-0">
                  <button
                    type="button"
                    onClick={() => setListTab("all")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer text-center ${
                      listTab === "all"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    Tất cả ({friends.filter((f) => !archivedChats[f.id]).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setListTab("unread")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                      listTab === "unread"
                        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    <span>Chưa đọc</span>
                    {friends.some((f) => !archivedChats[f.id] && (conversationsMap[f.id]?.unreadCount || 0) > 0) && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setListTab("ai")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                      listTab === "ai"
                        ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    <span>AI Bot</span>
                    <span className="text-[10px]">✨</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setListTab("archived")}
                    className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
                      listTab === "archived"
                        ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                    }`}
                  >
                    <span>Lưu trữ</span>
                    {Object.values(archivedChats).filter(Boolean).length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold">
                        {Object.values(archivedChats).filter(Boolean).length}
                      </span>
                    )}
                  </button>
                </div>

                {/* AI Tab Dedicated Card */}
                {listTab === "ai" && (
                  <div
                    onClick={() => {
                      setIsOpen(false);
                      window.dispatchEvent(new CustomEvent("open_ai_assistant"));
                    }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-violet-950/40 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer flex items-center justify-between group shadow-xs animate-in fade-in duration-150"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        ✨
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          Trợ lý BlogViet AI
                        </span>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                          Trợ lý thông minh · Sẵn sàng giải đáp 24/7
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2.5 py-1 rounded-full shrink-0">
                      Mở AI →
                    </span>
                  </div>
                )}

                {/* Conversations List */}
                {listTab !== "ai" && (
                  (() => {
                    let list = friends.filter((f) => {
                      if (listTab === "archived") {
                        return Boolean(archivedChats[f.id]);
                      }
                      if (archivedChats[f.id]) return false;
                      if (listTab === "unread") {
                        return (conversationsMap[f.id]?.unreadCount || 0) > 0;
                      }
                      return true;
                    });

                    if (friendSearchQuery.trim()) {
                      const q = friendSearchQuery.toLowerCase().trim();
                      list = list.filter((f) => {
                        const name = (f.fullName || "").toLowerCase();
                        const username = (f.username || "").toLowerCase();
                        return name.includes(q) || username.includes(q);
                      });
                    }

                    // Sort: Pinned chats first
                    list.sort((a, b) => {
                      const pinA = pinnedChats[a.id] ? 1 : 0;
                      const pinB = pinnedChats[b.id] ? 1 : 0;
                      return pinB - pinA;
                    });

                    if (list.length === 0) {
                      return (
                        <div className="py-10 text-center flex flex-col items-center gap-2 text-zinc-400 animate-in fade-in duration-150">
                          <span className="text-2xl">
                            {listTab === "archived" ? "📦" : listTab === "unread" ? "✉️" : "💬"}
                          </span>
                          <span className="text-xs">
                            {listTab === "archived"
                              ? "Chưa có cuộc trò chuyện nào trong kho lưu trữ."
                              : listTab === "unread"
                              ? "Bạn đã đọc hết mọi tin nhắn!"
                              : friendSearchQuery
                              ? `Không tìm thấy người dùng phù hợp với "${friendSearchQuery}".`
                              : "Chưa có bạn bè. Hãy kết bạn để bắt đầu trò chuyện!"}
                          </span>
                        </div>
                      );
                    }

                    return list.map((friend) => {
                      const fName = friend.fullName || friend.username;
                      const conv = conversationsMap[friend.id] || {};
                      const lastText = conv.lastMessage || "Bấm để nhắn tin";
                      const unread = conv.unreadCount || 0;
                      const isPinned = Boolean(pinnedChats[friend.id]);
                      const isMuted = Boolean(mutedChats[friend.id]);
                      const isArchived = Boolean(archivedChats[friend.id]);
                      const isMenuOpen = activeFriendMenuId === friend.id;

                      return (
                        <div
                          key={friend.id}
                          onClick={() => {
                            setActiveFriend(friend);
                            if (unread > 0) markConversationAsRead(friend.id);
                          }}
                          className={`relative flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition group/item ${
                            unread > 0
                              ? "bg-zinc-100 dark:bg-zinc-900 font-bold"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
                          } ${isPinned ? "border-l-3 border-amber-500 pl-2" : ""}`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Avatar
                              userId={friend.id}
                              src={friend.avatarUrl}
                              name={fName}
                              username={friend.username}
                              avatarColor={friend.avatarColor}
                              size="md"
                              isOnline={friend.isOnline}
                              lastActiveAt={friend.lastActiveAt}
                              showActiveStatus={friend.showActiveStatus !== false}
                              className="border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />

                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  {fName}
                                </span>
                                {isPinned && (
                                  <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                                {isMuted && (
                                  <BellOff className="w-3 h-3 text-zinc-400 shrink-0" />
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                {lastText}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                            {unread > 0 && (
                              <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}

                            {/* 3-dot Quick Actions Menu Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveFriendMenuId(isMenuOpen ? null : friend.id);
                                }}
                                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer opacity-80 sm:opacity-0 group-hover/item:opacity-100"
                                title="Tùy chọn đoạn chat"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {isMenuOpen && (
                                <div
                                  className="absolute right-0 top-7 z-50 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => handleTogglePinChat(friend.id, e)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{isPinned ? "Bỏ ghim" : "Ghim lên đầu"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleUnreadChat(friend.id, e)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{unread > 0 ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleMuteChat(friend.id, e)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    {isMuted ? <Bell className="w-3.5 h-3.5 text-emerald-500" /> : <BellOff className="w-3.5 h-3.5 text-zinc-500" />}
                                    <span>{isMuted ? "Bật thông báo" : "Tắt thông báo"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleArchiveChat(friend.id, e)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    {isArchived ? <ArchiveRestore className="w-3.5 h-3.5 text-amber-500" /> : <Archive className="w-3.5 h-3.5 text-amber-500" />}
                                    <span>{isArchived ? "Khôi phục tin nhắn" : "Lưu trữ cuộc trò chuyện"}</span>
                                  </button>

                                  <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteConversation(friend, e)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Xóa cuộc trò chuyện</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            ) : (
              /* Conversation Header & Pinned Banner & Messages Wrapper */
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Pinned Message Banner */}
                {activeFriend && pinnedMessages[activeFriend.id] && (
                  <div className="bg-amber-50/95 dark:bg-amber-950/50 border-b border-amber-200/70 dark:border-amber-900/50 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-top-1 duration-150 shadow-2xs z-10">
                    <div
                      onClick={() => {
                        const target = document.getElementById(`msg-${pinnedMessages[activeFriend.id].id}`);
                        if (target) {
                          target.scrollIntoView({ behavior: "smooth", block: "center" });
                          target.classList.add("ring-2", "ring-amber-500", "rounded-2xl", "bg-amber-100/40", "dark:bg-amber-900/30");
                          setTimeout(() => {
                            target.classList.remove("ring-2", "ring-amber-500", "rounded-2xl", "bg-amber-100/40", "dark:bg-amber-900/30");
                          }, 2500);
                        }
                      }}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group"
                      title="Bấm để cuộn tới vị trí tin nhắn được ghim"
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 fill-amber-500/20" />
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          <span>Đã ghim ({pinnedMessages[activeFriend.id].senderName})</span>
                          <span className="text-[9px] font-normal text-amber-600 dark:text-amber-400 opacity-75">
                            {formatTime(pinnedMessages[activeFriend.id].createdAt)}
                          </span>
                        </span>
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-300 truncate font-medium">
                          {pinnedMessages[activeFriend.id].content?.startsWith("📷 http")
                            ? "📷 [Hình ảnh]"
                            : pinnedMessages[activeFriend.id].content?.startsWith("🏷️ http")
                            ? "🏷️ [Nhãn dán]"
                            : pinnedMessages[activeFriend.id].content?.startsWith("🎙️ http")
                            ? "🎙️ [Tin nhắn thoại]"
                            : pinnedMessages[activeFriend.id].content}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePinMessage(pinnedMessages[activeFriend.id])}
                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer shrink-0"
                      title="Bỏ ghim tin nhắn"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Conversation Messages */}
                <div
                  ref={chatScrollContainerRef}
                  onScroll={handleScrollChat}
                  className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5"
                >
                {messages.length === 0 ? (
                  <div className="text-center my-auto py-6 px-3 flex flex-col items-center gap-3 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-[#0866ff] flex items-center justify-center text-xl shadow-2xs">
                      👋
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Bạn và {activeFriend?.fullName || activeFriend?.username} đã kết nối!
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện thân thiết nhé.
                      </span>
                    </div>

                    {/* Quick Greeting Suggestion Templates */}
                    <div className="flex flex-col gap-1.5 w-full max-w-xs mt-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-left pl-1">
                        Gợi ý lời chào nhanh:
                      </span>
                      {[
                        "👋 Chào bạn! Rất vui được làm quen",
                        "✨ Chào bạn, kết nối cùng nhau nhé!",
                        "📝 Mình thấy bài viết của bạn rất hay!",
                        "☕ Chúc bạn một ngày tốt lành và nhiều năng lượng!",
                      ].map((greet, gIdx) => (
                        <button
                          key={gIdx}
                          type="button"
                          onClick={() => handleSendDirectMessage(greet)}
                          className="px-3 py-2 rounded-xl text-xs font-medium text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#0866ff] hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-zinc-700 dark:text-zinc-300 transition cursor-pointer active:scale-98 shadow-2xs flex items-center justify-between group"
                        >
                          <span className="truncate">{greet}</span>
                          <span className="text-[10px] text-[#0866ff] font-bold opacity-0 group-hover:opacity-100 transition shrink-0 ml-1">
                            Gửi ↵
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.senderId || msg.sender?.id) === currentUserId;
                    const friendAvatar = activeFriend?.avatarUrl;
                    const friendName = activeFriend?.fullName || activeFriend?.username || "Bạn";
                    const isEditingThis = editingMsgId === msg.id;
                    const isVoice = isAudioMessage(msg.content);
                    const isLastRead = isMe && msg.id === lastReadMessageId && !activeFriend?.isAi;

                    const isPinned = pinnedMessages[activeFriend?.id]?.id === msg.id;

                    return (
                      <div
                        id={`msg-${msg.id}`}
                        key={msg.id || idx}
                        className={`flex flex-col transition-all duration-200 ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`flex items-end gap-2 group max-w-[85%] ${
                            isMe ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          {/* Avatar for receiver */}
                          {!isMe && (
                            <div className="shrink-0 mb-1">
                              {activeFriend?.isAi ? (
                                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                                  ✨
                                </div>
                              ) : friendAvatar ? (
                                <img
                                  src={friendAvatar}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              {!activeFriend?.isAi && (
                                <div
                                  className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                                  style={{
                                    backgroundColor: activeFriend?.avatarColor || "#27272a",
                                    display: friendAvatar ? "none" : "flex",
                                  }}
                                >
                                  {getInitials(friendName)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Options Button & Reactions Trigger */}
                          <div className="relative opacity-0 group-hover:opacity-100 transition shrink-0 flex items-center gap-0.5">
                            {/* Quick Reaction Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)
                              }
                              className="p-1 text-zinc-400 hover:text-amber-500 transition cursor-pointer hover:scale-110"
                              title="Thả cảm xúc"
                            >
                              <Smile className="w-3.5 h-3.5" />
                            </button>

                            {/* Options 3-Dot Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id)
                              }
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                              title="Tùy chọn tin nhắn"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {/* Floating Reactions Bar Popover */}
                            {reactionPickerMsgId === msg.id && (
                              <div
                                className={`absolute -top-9 z-50 flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-2 py-1 shadow-xl animate-in zoom-in-95 duration-100 ${
                                  isMe ? "right-0" : "left-0"
                                }`}
                              >
                                {["❤️", "👍", "😂", "😮", "😢", "🔥"].map((emo) => (
                                  <button
                                    key={emo}
                                    type="button"
                                    onClick={() => handleToggleReaction(msg.id, emo)}
                                    className="hover:scale-130 active:scale-95 transition-transform text-sm cursor-pointer p-0.5"
                                    title={`Thả ${emo}`}
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            )}

                            {activeMsgMenuId === msg.id && (
                              <div
                                className={`absolute bottom-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-1.5 flex flex-col min-w-44 animate-in zoom-in-95 duration-100 ${
                                  isMe ? "right-0" : "left-0"
                                }`}
                              >
                                {/* Message Info (Time & Status) */}
                                <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[10px] flex flex-col gap-0.5 text-zinc-500 dark:text-zinc-400 select-none">
                                  <div className="flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3 text-zinc-400" />
                                    <span>{formatFullTime(msg.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1 font-semibold">
                                    <CheckCheck className={`w-3 h-3 ${isMe && (msg.isRead || msg.read) ? "text-[#0866ff]" : "text-zinc-400"}`} />
                                    <span>
                                      {isMe
                                        ? msg.isRead || msg.read
                                          ? "Đã xem"
                                          : "Đã gửi"
                                        : "Đã nhận"}
                                    </span>
                                  </div>
                                </div>

                                {/* Pin / Unpin Action */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinMessage(msg)}
                                  className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-2 text-left cursor-pointer transition"
                                >
                                  {isPinned ? (
                                    <>
                                      <PinOff className="w-3.5 h-3.5 text-amber-500" />
                                      <span className="text-amber-600 dark:text-amber-400 font-semibold">Bỏ ghim tin nhắn</span>
                                    </>
                                  ) : (
                                    <>
                                      <Pin className="w-3.5 h-3.5 text-zinc-500" />
                                      <span>Ghim tin nhắn</span>
                                    </>
                                  )}
                                </button>

                                {/* Copy Action */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCopyMessage(msg.content);
                                    setActiveMsgMenuId(null);
                                  }}
                                  className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-2 text-left cursor-pointer transition"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép</span>
                                </button>

                                {isMe && (
                                  <>
                                    {!isVoice && !msg.content?.startsWith("📷") && !msg.content?.startsWith("🏷️") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMsgId(msg.id);
                                          setEditingText(msg.content);
                                          setActiveMsgMenuId(null);
                                        }}
                                        className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl flex items-center gap-2 text-left cursor-pointer transition"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        <span>Chỉnh sửa</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteMessage(msg.id);
                                        setActiveMsgMenuId(null);
                                      }}
                                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 text-left cursor-pointer transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message Bubble: Text / Image / Sticker / Voice */}
                          <div className="relative flex flex-col">
                            {isEditingThis ? (
                              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleEditMessage(msg.id)}
                                  className="p-1 rounded-md bg-emerald-500 text-white text-xs cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="p-1 rounded-md bg-zinc-400 text-white text-xs cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : isVoice ? (
                              <AudioMessagePlayer src={msg.content} isMe={isMe} />
                            ) : msg.content?.startsWith("🏷️ http") ? (
                              <div className="p-1 max-w-[140px] max-h-[140px] flex items-center justify-center">
                                <img
                                  src={msg.content.replace("🏷️ ", "").trim()}
                                  alt="Sticker"
                                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-150"
                                  onClick={() =>
                                    window.open(msg.content.replace("🏷️ ", "").trim(), "_blank")
                                  }
                                  loading="lazy"
                                />
                              </div>
                            ) : msg.content?.startsWith("📷 http") ? (
                              <div className="rounded-2xl overflow-hidden max-w-[220px] max-h-[220px] border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <img
                                  src={msg.content.replace("📷 ", "").trim()}
                                  alt=""
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() =>
                                    window.open(msg.content.replace("📷 ", "").trim(), "_blank")
                                  }
                                  loading="lazy"
                                />
                              </div>
                            ) : (
                              <div
                                className={`px-3.5 py-2 text-xs font-medium leading-relaxed shadow-xs break-words ${
                                  isMe
                                    ? "max-w-[100%] rounded-2xl rounded-br-xs bg-black text-white dark:bg-white dark:text-black shadow-sm"
                                    : "max-w-[100%] rounded-2xl rounded-bl-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/60 shadow-sm"
                                }`}
                              >
                                {msg.content?.trim() ? (
                                  msg.content
                                ) : (
                                  <div className="flex items-center gap-1 py-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Reaction Badges */}
                            {messageReactions[msg.id] && Object.keys(messageReactions[msg.id]).length > 0 && (
                              <div className={`flex items-center -mt-2 z-10 animate-in zoom-in-75 duration-150 ${isMe ? "justify-end mr-1" : "justify-start ml-1"}`}>
                                <div
                                  onClick={() => setReactionPickerMsgId(reactionPickerMsgId === msg.id ? null : msg.id)}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xs text-[11px] cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                                  title="Cảm xúc tin nhắn"
                                >
                                  {Array.from(new Set(Object.values(messageReactions[msg.id]))).slice(0, 3).map((emo, eIdx) => (
                                    <span key={eIdx}>{emo}</span>
                                  ))}
                                  {Object.keys(messageReactions[msg.id]).length > 1 && (
                                    <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">
                                      {Object.keys(messageReactions[msg.id]).length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timestamp & Read Receipt */}
                        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">
                            {formatTime(msg.createdAt)}
                          </span>

                          {/* Read Receipt Avatar Badge (Chỉ hiện dưới tin nhắn cuối cùng đối phương đã đọc) */}
                          {isLastRead && (
                            <div
                              className="inline-flex items-center gap-1 animate-in fade-in zoom-in-75 duration-150"
                              title={`Đã xem lúc ${formatTime(msg.readAt || msg.createdAt)}`}
                            >
                              {friendAvatar ? (
                                <img
                                  src={friendAvatar}
                                  alt="Đã xem"
                                  className="w-3.5 h-3.5 rounded-full object-cover border border-white dark:border-zinc-900 shadow-2xs ring-1 ring-zinc-300 dark:ring-zinc-600"
                                />
                              ) : (
                                <div
                                  title={`Đã xem lúc ${formatTime(msg.readAt || msg.createdAt)}`}
                                  className="w-3.5 h-3.5 rounded-full bg-zinc-800 text-white font-bold text-[8px] flex items-center justify-center border border-white dark:border-zinc-900 shadow-2xs"
                                >
                                  {getInitials(friendName)}
                                </div>
                              )}
                              <span className="text-[9px] text-zinc-400 font-medium hidden sm:inline">Đã xem</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Uploading Voice Indicator */}
                {isUploadingVoice && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 self-end animate-fade-in-up">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                    <span>Đang tải lên tin nhắn thoại...</span>
                  </div>
                )}

                {/* Live Typing Indicator (Bong bóng 3 chấm động nảy tuần tự) */}
                {(isFriendTyping || isAiTyping) && (
                  <div className="flex items-end gap-2 my-1.5 animate-fade-in-up">
                    <div className="shrink-0 mb-1">
                      {activeFriend?.isAi ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          ✨
                        </div>
                      ) : activeFriend?.avatarUrl ? (
                        <img
                          src={activeFriend.avatarUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-2xs"
                          style={{ backgroundColor: activeFriend?.avatarColor || "#4f46e5" }}
                        >
                          {getInitials(activeFriend?.fullName || activeFriend?.username || "Friend")}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-xs bg-zinc-200/90 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 shadow-xs flex items-center gap-1.5 w-fit">
                        <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-300 animate-bounce [animation-delay:-0.32s]" />
                        <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-300 animate-bounce [animation-delay:-0.16s]" />
                        <span className="w-2 h-2 rounded-full bg-zinc-600 dark:bg-zinc-300 animate-bounce" />
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 pl-1 font-medium italic">
                        {activeFriend?.fullName || activeFriend?.username || "Đối phương"} đang soạn tin...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to Bottom Floating Indicator Button */}
              {showScrollBottom && (
                <div className="absolute right-3.5 bottom-3 z-40 animate-in fade-in zoom-in-90 duration-150">
                  <button
                    type="button"
                    onClick={handleScrollToBottom}
                    className="px-2.5 py-1.5 rounded-full bg-zinc-900/90 dark:bg-white/95 text-white dark:text-black shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 backdrop-blur-xs text-xs font-bold cursor-pointer ring-1 ring-white/20 dark:ring-black/10"
                    title="Cuộn xuống tin nhắn mới nhất"
                  >
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                    {newMsgCountWhileScrolled > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0 shadow-xs">
                        +{newMsgCountWhileScrolled}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            )}
          </div>

          {/* Image Upload Preview Banner */}
          {previewImageUrl && (
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={previewImageUrl}
                  alt="Xem trước"
                  className="w-12 h-12 object-cover rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xs shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {previewImageFile?.name || "Hình ảnh"}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {(previewImageFile?.size ? (previewImageFile.size / 1024).toFixed(0) : 0)} KB · Sẵn sàng gửi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelPreviewImage}
                  className="p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer"
                  title="Hủy ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSendPreviewImage}
                  disabled={uploadingImage}
                  className="px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Gửi ảnh</span>
                </button>
              </div>
            </div>
          )}

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-center animate-in fade-in zoom-in-95 duration-100">
              <EmojiPicker
                onSelectEmoji={(emoji) => {
                  setInputMessage((prev) => prev + emoji);
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
          )}

          {/* Sticker Picker Popup */}
          {showStickerPicker && (
            <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-center animate-in fade-in zoom-in-95 duration-100">
              <StickerPicker
                onSelectSticker={(url) => {
                  handleSendSticker(url);
                  setShowStickerPicker(false);
                }}
                onClose={() => setShowStickerPicker(false)}
              />
            </div>
          )}

          {/* GIF Picker Popup */}
          {showGifPicker && (
            <div className="p-2 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-center animate-in fade-in zoom-in-95 duration-100">
              <GifPicker
                onSelectGif={(url) => {
                  handleSendGif(url);
                  setShowGifPicker(false);
                }}
                onClose={() => setShowGifPicker(false)}
              />
            </div>
          )}

          {/* Input Footer with Mobile Safe-Area Padding */}
          {activeFriend && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-2 sm:p-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] shrink-0">
              {isRecording ? (
                /* Active Recording State */
                <div className="flex items-center justify-between gap-2 animate-in fade-in duration-100 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 min-w-0 truncate">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span className="font-mono">{formatRecTime(recordingSeconds)}</span>
                    <span className="text-[11px] text-zinc-400 font-normal hidden sm:inline">Đang ghi âm...</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Cancel Recording */}
                    <button
                      type="button"
                      onClick={handleCancelRecording}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Hủy
                    </button>

                    {/* Stop & Send Voice */}
                    <button
                      type="button"
                      onClick={handleStopAndSendVoice}
                      className="px-3 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold flex items-center gap-1 hover:opacity-90 active:scale-95 transition cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Gửi</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Message Input Form */
                <form onSubmit={handleSendMessage} className="flex items-center gap-1 sm:gap-1.5 w-full min-w-0">
                  {/* Media actions toolbar */}
                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                    {/* Emoji Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmojiPicker((v) => !v);
                        setShowStickerPicker(false);
                        setShowGifPicker(false);
                      }}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        showEmojiPicker
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                      title="Biểu tượng cảm xúc (Emoji)"
                    >
                      <Smile className="w-4 h-4" />
                    </button>

                    {/* Sticker Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowStickerPicker((v) => !v);
                        setShowEmojiPicker(false);
                        setShowGifPicker(false);
                      }}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        showStickerPicker
                          ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                      title="Nhãn dán sinh động (Sticker)"
                    >
                      <Sticker className="w-4 h-4" />
                    </button>

                    {/* GIF Picker Toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowGifPicker((v) => !v);
                        setShowEmojiPicker(false);
                        setShowStickerPicker(false);
                      }}
                      className={`px-1.5 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                        showGifPicker
                          ? "bg-amber-500 text-black shadow-xs"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                      title="Kho ảnh GIF động"
                    >
                      GIF
                    </button>

                    {/* Image / Camera Select */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage || isUploadingVoice}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Đính kèm hình ảnh hoặc chụp ảnh"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0866ff]" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />

                    {/* Mic / Voice Record Button */}
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      disabled={isUploadingVoice || uploadingImage}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Ghi âm tin nhắn thoại (Voice Message)"
                    >
                      <Mic className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                    </button>
                  </div>

                  {/* Input text with min-w-0 for flex containment */}
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() && !previewImageFile}
                    className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-30 shrink-0 shadow-xs"
                    title="Gửi tin nhắn"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* WebRTC Video / Audio Call Modal */}
      {activeCall && (
        <div className="fixed inset-0 z-[999999] bg-zinc-950/95 flex flex-col items-center justify-between p-6 text-white animate-in fade-in duration-200">
          <div className="text-center mt-6 flex flex-col items-center gap-1.5">
            <span className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
              {activeCall.type === "video" ? "📹 Cuộc gọi Video HD" : "📞 Cuộc gọi thoại HD"}
            </span>
            <h2 className="text-xl font-black">
              {activeCall.friend?.fullName || activeCall.friend?.username}
            </h2>
            <span className="text-xs text-emerald-400 font-semibold">
              🟢 {String(Math.floor(activeCall.seconds / 60)).padStart(2, "0")}:
              {String(activeCall.seconds % 60).padStart(2, "0")} • Đang kết nối
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            {activeCall.type === "video" ? (
              <div className="w-64 h-80 rounded-3xl overflow-hidden bg-black border-2 border-white/20 shadow-2xl relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-xl text-[10px] text-white backdrop-blur-sm">
                  Camera của bạn
                </span>
              </div>
            ) : (
                            <div className="w-28 h-28 rounded-full bg-zinc-800 border-4 border-white/20 flex items-center justify-center text-4xl shadow-2xl animate-pulse">
                <Avatar
                  userId={activeCall.friend?.id}
                  src={activeCall.friend?.avatarUrl}
                  name={activeCall.friend?.fullName || activeCall.friend?.username}
                  username={activeCall.friend?.username}
                  avatarColor={activeCall.friend?.avatarColor}
                  size="3xl"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveCall(null)}
            className="w-14 h-14 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:bg-rose-700 transition cursor-pointer mb-6"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
