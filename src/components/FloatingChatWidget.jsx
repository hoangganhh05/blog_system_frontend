import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ArrowLeft,
  Phone,
  Video,
  Send,
  Image,
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import chatService from "../services/chatService";
import uploadService from "../services/uploadService";
import AudioMessagePlayer from "./AudioMessagePlayer";
import GifPicker from "./GifPicker";
import EmojiPicker from "./EmojiPicker";
import StickerPicker from "./StickerPicker";

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
              const lastMsg = list[list.length - 1];
              if (lastMsg && Number(lastMsg.senderId || lastMsg.sender?.id) !== currentUserId) {
                playNotificationSound();
              }
            }
            prevMsgLengthRef.current = list.length;
            setMessages(list);
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
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    userScrolledUpRef.current = !isBottom;
  };

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  useEffect(() => {
    userScrolledUpRef.current = false;
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

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !currentUserId || !activeFriend?.id) return;
    const text = inputMessage.trim();
    setInputMessage("");

    try {
      const res = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      toast.error("Không thể gửi tin nhắn!");
    }
  };

  // Image Upload
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeFriend?.id) return;
    setUploadingImage(true);
    try {
      const res = await uploadService.uploadFile(file);
      const imageUrl = res.data.url || res.data;
      const text = `📷 ${imageUrl}`;

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
          className="fixed bottom-28 lg:bottom-6 right-4 lg:right-6 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer border border-zinc-200/20"
        >
          <span className="text-xl md:text-2xl">💬</span>
          {unreadChatCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] md:text-[11px] font-black rounded-full min-w-5 h-5 flex items-center justify-center px-1 border-2 border-white dark:border-zinc-900 shadow-lg animate-pulse">
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window: Fixed bottom responsive, max-height calc(100dvh-80px) */}
      {isOpen && (
        <div className="fixed bottom-14 sm:bottom-16 lg:bottom-6 right-2 sm:right-4 lg:right-6 left-2 sm:left-auto sm:w-96 md:w-88 h-[520px] max-h-[calc(100dvh-80px)] z-[999] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
                    title="Quay lại danh sách"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div
                    onClick={() =>
                      activeFriend.id && navigate(`/profile/${activeFriend.id}`)
                    }
                    className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 group"
                  >
                    {activeFriend.avatarUrl ? (
                      <img
                        src={activeFriend.avatarUrl}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full text-xs font-bold bg-zinc-800 text-white flex items-center justify-center shrink-0">
                        {getInitials(activeFriend.fullName || activeFriend.username)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100 group-hover:underline">
                        {activeFriend.fullName || activeFriend.username}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        Đang hoạt động
                      </span>
                    </div>
                  </div>

                  {/* Audio / Video Call Buttons */}
                  <div className="flex items-center gap-1">
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
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Tin nhắn bạn bè
                  </span>
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
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-zinc-50/50 dark:bg-zinc-950/60">
            {!activeFriend ? (
              /* Friends List */
              <div className="p-3 flex flex-col gap-1">
                {/* AI Assistant Dedicated Shortcut Card */}
                <div
                  onClick={() => {
                    setIsOpen(false);
                    window.dispatchEvent(new CustomEvent("open_ai_assistant"));
                  }}
                  className="mb-2 p-3 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 dark:from-indigo-950/40 dark:via-violet-950/40 dark:to-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 hover:border-indigo-400 dark:hover:border-indigo-600 transition cursor-pointer flex items-center justify-between group shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      ✨
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        Trợ lý BlogViet AI
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                        Gemini 3.7 Flash · Sẵn sàng 24/7
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full shrink-0">
                    Mở AI →
                  </span>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1.5">
                  Danh sách bạn bè ({friends.length})
                </div>
                {friends.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-400">
                    Chưa có bạn bè. Hãy kết bạn để bắt đầu trò chuyện!
                  </div>
                ) : (
                  friends.map((friend) => {
                    const fName = friend.fullName || friend.username;
                    const conv = conversationsMap[friend.id] || {};
                    const lastText = conv.lastMessage || "Bấm để nhắn tin";
                    const unread = conv.unreadCount || 0;

                    return (
                      <div
                        key={friend.id}
                        onClick={() => {
                          setActiveFriend(friend);
                          if (unread > 0) markConversationAsRead(friend.id);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition ${
                          unread > 0
                            ? "bg-zinc-100 dark:bg-zinc-900 font-bold"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {friend.avatarUrl ? (
                            <img
                              src={friend.avatarUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full text-xs font-bold bg-zinc-800 text-white flex items-center justify-center shrink-0">
                              {getInitials(fName)}
                            </div>
                          )}

                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {fName}
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {lastText}
                            </span>
                          </div>
                        </div>

                        {unread > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 ml-2 shadow-xs">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Conversation Messages */
              <div
                ref={chatScrollContainerRef}
                onScroll={handleScrollChat}
                className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-2.5"
              >
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-zinc-400 my-auto py-8">
                    Hãy gửi lời chào đầu tiên! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.senderId || msg.sender?.id) === currentUserId;
                    const friendAvatar = activeFriend?.avatarUrl;
                    const friendName = activeFriend?.fullName || activeFriend?.username || "Bạn";
                    const isEditingThis = editingMsgId === msg.id;
                    const isVoice = isAudioMessage(msg.content);
                    const isLastRead = isMe && msg.id === lastReadMessageId && !activeFriend?.isAi;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
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
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-zinc-800 text-white text-[9px] font-bold flex items-center justify-center">
                                  {getInitials(friendName)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Options Button */}
                          <div className="relative opacity-0 group-hover:opacity-100 transition shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id)
                              }
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {activeMsgMenuId === msg.id && (
                              <div
                                className={`absolute bottom-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-1 flex flex-col min-w-32 animate-in zoom-in-95 duration-100 ${
                                  isMe ? "right-0" : "left-0"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCopyMessage(msg.content);
                                    setActiveMsgMenuId(null);
                                  }}
                                  className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-left"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Sao chép</span>
                                </button>

                                {isMe && (
                                  <>
                                    {!isVoice && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingMsgId(msg.id);
                                          setEditingText(msg.content);
                                          setActiveMsgMenuId(null);
                                        }}
                                        className="px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 text-left"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Chỉnh sửa</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteMessage(msg.id);
                                        setActiveMsgMenuId(null);
                                      }}
                                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 text-left"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Xóa</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Message Bubble: Text / Image / Sticker / Voice */}
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
                                className="w-full h-full object-cover cursor-pointer"
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
                              {msg.content}
                            </div>
                          )}
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
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 self-end">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                    <span>Đang tải lên tin nhắn thoại...</span>
                  </div>
                )}

                {/* AI Typing Indicator */}
                {isAiTyping && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Trợ lý BlogViet đang phản hồi...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

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

          {/* Input Footer */}
          {activeFriend && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-2 sm:p-2.5 shrink-0">
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

                    {/* Image Select */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage || isUploadingVoice}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Gửi hình ảnh"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0866ff]" />
                      ) : (
                        <Image className="w-4 h-4" />
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
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 min-w-0 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
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
                {activeCall.friend?.avatarUrl ? (
                  <img
                    src={activeCall.friend.avatarUrl}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(activeCall.friend?.fullName || activeCall.friend?.username)
                )}
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
