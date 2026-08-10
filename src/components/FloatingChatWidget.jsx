import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import userService from "../services/userService";
import chatService from "../services/chatService";
import uploadService from "../services/uploadService";

const AI_USER = {
  id: "ai_bot",
  fullName: "✨ Trợ lý BlogViet",
  username: "tro_ly_blogviet",
  avatarColor: "#6366f1",
  isAi: true
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function FloatingChatWidget() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const messagesEndRef = useRef(null);

  const [isAiTyping, setIsAiTyping] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [activeMsgMenuId, setActiveMsgMenuId] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [deletedMsgIds, setDeletedMsgIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyMessage = (content) => {
    if (!content) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(content).then(() => {
        showToast("Đã sao chép tin nhắn!");
      }).catch(() => {
        fallbackCopyText(content);
      });
    } else {
      fallbackCopyText(content);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showToast("Đã sao chép tin nhắn!");
    } catch {
      showToast("Không thể sao chép tin nhắn!");
    }
    document.body.removeChild(textArea);
  };

  const handlePinMessage = async (msg) => {
    setPinnedMessage(msg);
    showToast("Đã ghim tin nhắn!");
    if (currentUserId && activeFriend?.id) {
      try {
        const key = `pinned_msg_${currentUserId}_${activeFriend.id}`;
        localStorage.setItem(key, JSON.stringify(msg));
        if (!activeFriend?.isAi) {
          await chatService.pinMessage(msg.id, true);
        }
      } catch {
        // Ignore
      }
    }
  };

  const handleUnpinMessage = async () => {
    const prevPinnedId = pinnedMessage?.id;
    setPinnedMessage(null);
    showToast("Đã bỏ ghim tin nhắn!");
    if (currentUserId && activeFriend?.id) {
      try {
        const key = `pinned_msg_${currentUserId}_${activeFriend.id}`;
        localStorage.removeItem(key);
        if (!activeFriend?.isAi && prevPinnedId) {
          await chatService.pinMessage(prevPinnedId, false);
        }
      } catch {
        // Ignore
      }
    }
  };

  // Tải lại tin nhắn đã ghim từ localStorage khi chọn bạn chat
  useEffect(() => {
    if (currentUserId && activeFriend?.id) {
      try {
        const key = `pinned_msg_${currentUserId}_${activeFriend.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setPinnedMessage(JSON.parse(saved));
        } else {
          setPinnedMessage(null);
        }
      } catch {
        setPinnedMessage(null);
      }
    } else {
      setPinnedMessage(null);
    }
  }, [currentUserId, activeFriend?.id]);

  const handleEditMessage = async (msgId) => {
    if (!editingText.trim()) return;
    const newContent = editingText.trim();
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, content: newContent } : m)));
    setEditingMsgId(null);
    setEditingText("");
    showToast("Đã chỉnh sửa tin nhắn!");
    try {
      if (!activeFriend?.isAi) {
        await chatService.editMessage(msgId, newContent);
      }
    } catch {
      // Keep optimistic update
    }
  };

  const handleDeleteMessage = async (msgId) => {
    setDeletedMsgIds((prev) => new Set([...prev, msgId]));
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (pinnedMessage?.id === msgId) setPinnedMessage(null);
    showToast("Đã xóa tin nhắn!");
    try {
      if (!activeFriend?.isAi) {
        await chatService.deleteMessage(msgId);
      }
    } catch {
      // Keep optimistic removal
    }
  };

  const pressHoldTimerRef = useRef(null);

  const handleTouchStartMsg = (msgId) => {
    pressHoldTimerRef.current = setTimeout(() => {
      setActiveMsgMenuId(msgId);
    }, 250);
  };

  const handleTouchEndMsg = () => {
    if (pressHoldTimerRef.current) {
      clearTimeout(pressHoldTimerRef.current);
      pressHoldTimerRef.current = null;
    }
  };

  const localVideoRef = useRef(null);
  const callStreamRef = useRef(null);

  // Kích hoạt Camera / Micro thật khi bắt đầu cuộc gọi WebRTC
  useEffect(() => {
    if (activeCall) {
      navigator.mediaDevices?.getUserMedia({ video: activeCall.type === "video", audio: true })
        .then((stream) => {
          callStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          // Micro / Camera permission fallback
        });
    } else {
      if (callStreamRef.current) {
        callStreamRef.current.getTracks().forEach((track) => track.stop());
        callStreamRef.current = null;
      }
    }
  }, [activeCall?.type]);

  function formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Đếm thời gian cuộc gọi
  useEffect(() => {
    let timer;
    if (activeCall) {
      timer = setInterval(() => {
        setActiveCall((prev) => prev ? { ...prev, seconds: (prev.seconds || 0) + 1 } : null);
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [activeCall?.type]);

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadService.uploadFile(file);
      const imageUrl = res.data.url;
      const text = `📷 ${imageUrl}`;
      
      if (activeFriend?.isAi) {
        const userMsgObj = { id: Date.now(), senderId: currentUserId, content: text, createdAt: new Date().toISOString() };
        setMessages((prev) => [...prev, userMsgObj]);
        setIsAiTyping(true);
        try {
          const aiResponse = await aiService.chatWithAI("Tôi vừa gửi một bức ảnh nghệ thuật cho bạn xem nè!");
          setMessages((prev) => [...prev, { id: Date.now() + 1, senderId: "ai_bot", content: aiResponse, createdAt: new Date().toISOString() }]);
        } catch {
        } finally {
          setIsAiTyping(false);
        }
      } else if (activeFriend?.id) {
        const resMsg = await chatService.sendMessage(currentUserId, activeFriend.id, text);
        setMessages((prev) => [...prev, resMsg.data]);
      }
    } catch {
      // Ignore
    } finally {
      setUploadingImage(false);
    }
  };

  const handleStartCall = (type) => {
    setActiveCall({ type, friend: activeFriend || AI_USER, seconds: 0 });
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  // Lắng nghe Event từ ứng dụng (VD: bấm "Nhắn tin" từ trang cá nhân)
  useEffect(() => {
    const handleOpenChat = (e) => {
      const friend = e.detail?.friend;
      if (friend) {
        setIsOpen(true);
        setActiveFriend(friend);
      }
    };
    const handleToggleChat = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("open_chat_user", handleOpenChat);
    window.addEventListener("toggle_chat_widget", handleToggleChat);
    return () => {
      window.removeEventListener("open_chat_user", handleOpenChat);
      window.removeEventListener("toggle_chat_widget", handleToggleChat);
    };
  }, []);

  const [conversationsMap, setConversationsMap] = useState({});
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // 1. Chỉ lấy danh sách BẠN BÈ THỰC SỰ (đã chấp nhận kết bạn) + Trợ lý AI
  useEffect(() => {
    if (!currentUserId) return;
    const fetchFriends = async () => {
      try {
        const [friendsRes, usersRes] = await Promise.all([
          friendService.getFriendsList(currentUserId).catch(() => ({ data: [] })),
          userService.getAll().catch(() => ({ data: [] })),
        ]);

        const rawFriends = friendsRes.data || [];
        const apiFriendsList = rawFriends
          .map((f) => f.friend || f.user || f)
          .filter((f) => f && String(f.id) !== String(currentUserId));

        // Đọc bạn bè từ localStorage
        let localPairs = [];
        try {
          localPairs = JSON.parse(localStorage.getItem("blog_mutual_friends_pairs") || "[]");
        } catch {}

        const myLocalFriendIds = localPairs
          .filter((p) => String(p.u1) === String(currentUserId) || String(p.u2) === String(currentUserId))
          .map((p) => (String(p.u1) === String(currentUserId) ? String(p.u2) : String(p.u1)));

        const allUsers = usersRes.data || [];
        const localFriendObjs = allUsers.filter((u) => myLocalFriendIds.includes(String(u.id)));

        // Hợp nhất danh sách BẠN BÈ THỰC SỰ (Tuyệt đối không đưa người chưa kết bạn vào)
        const friendMap = new Map();
        friendMap.set("ai_bot", AI_USER);

        [...apiFriendsList, ...localFriendObjs].forEach((u) => {
          if (u && u.id && String(u.id) !== String(currentUserId)) {
            friendMap.set(String(u.id), u);
          }
        });

        setFriends(Array.from(friendMap.values()));
      } catch {
        setFriends([AI_USER]);
      }
    };

    fetchFriends();
  }, [currentUserId]);

  // 2. Polling liên tục chạy ngầm đếm chính xác tin nhắn chưa đọc từ bạn bè
  useEffect(() => {
    if (!currentUserId || friends.length <= 1) return;

    const fetchAllSummaries = async () => {
      const newMap = { ...conversationsMap };
      let totalUnread = 0;

      for (const friend of friends) {
        if (!friend || friend.isAi) continue;
        try {
          const res = await chatService.getHistory(currentUserId, friend.id);
          const history = res.data || [];
          if (history.length > 0) {
            const lastMsg = history[history.length - 1];

            // Chỉ đếm tin nhắn do BẠN BÈ GỬI TỚI mà MÌNH CHƯA XEM (read !== true)
            const unreadCount = history.filter(
              (m) => String(m.senderId || m.sender?.id) === String(friend.id) && !m.read
            ).length;

            const isCurrentActive = isOpen && String(activeFriend?.id) === String(friend.id);
            const effectiveUnread = isCurrentActive ? 0 : unreadCount;

            newMap[friend.id] = {
              lastMessage: lastMsg.content || "Đã gửi 1 tệp đính kèm",
              unreadCount: effectiveUnread,
              timestamp: lastMsg.createdAt,
            };

            totalUnread += effectiveUnread;
          }
        } catch {}
      }

      setConversationsMap(newMap);
      setUnreadChatCount(totalUnread);
      window.dispatchEvent(
        new CustomEvent("unread_chat_count_updated", { detail: { count: totalUnread } })
      );
    };

    fetchAllSummaries();
    const interval = setInterval(fetchAllSummaries, 2500);
    return () => clearInterval(interval);
  }, [currentUserId, friends, isOpen, activeFriend?.id]);

  // 3. Đánh dấu ĐÃ ĐỌC khi người dùng CHÍNH THỨC ẤN MỞ ĐOẠN CHAT
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
  } catch {
    // Ignore
  }
}

  const prevMsgLengthRef = useRef(0);

  // Lấy lịch sử chat với bạn bè được chọn hoặc AI với Polling siêu tốc 1.2s & Âm thanh chuông báo
  useEffect(() => {
    let timer;
    if (isOpen && activeFriend?.isAi) {
      if (messages.length === 0) {
        setMessages([
          {
            id: "ai_welcome",
            senderId: "ai_bot",
            content: "Xin chào! Mình là Trợ lý BlogViet ✨. Bạn cần tư vấn ý tưởng bài viết, giải đáp thắc mắc hay trò chuyện gì cứ nhắn cho mình nhé!",
            createdAt: new Date().toISOString()
          }
        ]);
      }
      return;
    }

    if (currentUserId && activeFriend?.id) {
      const fetchChat = () => {
        chatService.getHistory(currentUserId, activeFriend.id).then((res) => {
          const list = res.data || [];
          if (list.length > prevMsgLengthRef.current) {
            const lastMsg = list[list.length - 1];
            if (lastMsg && Number(lastMsg.senderId || lastMsg.sender?.id) !== currentUserId) {
              playNotificationSound();
            }
          }
          prevMsgLengthRef.current = list.length;
          setMessages(list);
        }).catch(() => {});
      };

      fetchChat();
      timer = setInterval(fetchChat, 1200); // Fast Polling 1.2s cho tin nhắn hiển thị tức thì
    }
    return () => timer && clearInterval(timer);
  }, [isOpen, currentUserId, activeFriend]);

  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const STICKERS = [
    { emoji: "❤️", text: "Yêu thương" },
    { emoji: "🔥", text: "Cháy quá" },
    { emoji: "😂", text: "Cười ngất" },
    { emoji: "🥰", text: "Mê mẩn" },
    { emoji: "👍", text: "Tuyệt vời" },
    { emoji: "🎉", text: "Chúc mừng" },
    { emoji: "🐱", text: "Meow" },
    { emoji: "🚀", text: "Lên đỉnh" },
    { emoji: "💖", text: "Bật tim" },
    { emoji: "🎁", text: "Quà này" },
    { emoji: "💡", text: "Ý hay" },
    { emoji: "🌟", text: "10 điểm" },
  ];

  const handleSendSticker = (st) => {
    setInputMessage(`${st.emoji} ${st.text}`);
    setShowStickerPicker(false);
  };

  const chatScrollContainerRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  const handleScrollChat = (e) => {
    const el = e.target;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    userScrolledUpRef.current = !isBottom;
  };

  // Cuộn xuống tin nhắn mới nhất - CHỈ CUỘN KHI NGƯỜI DÙNG ĐANG Ở ĐÁY HOẶC VỪA GỬI TIN NHẮN
  useEffect(() => {
    if (!userScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  // Reset cuộn khi đổi bạn chat
  useEffect(() => {
    userScrolledUpRef.current = false;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }, 50);
  }, [activeFriend]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUserId) return;
    const text = inputMessage.trim();
    setInputMessage("");

    const targetFriend = activeFriend || AI_USER;

    if (targetFriend.isAi) {
      const userMsgObj = {
        id: Date.now(),
        senderId: currentUserId,
        content: text,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsgObj]);
      setIsAiTyping(true);

      try {
        const aiResponse = await aiService.chatWithAI(text);
        const aiMsgObj = {
          id: Date.now() + 1,
          senderId: "ai_bot",
          content: aiResponse,
          createdAt: new Date().toISOString()
        };
        setMessages((prev) => [...prev, aiMsgObj]);
      } catch (err) {
        console.error("Lỗi AI response:", err);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    if (targetFriend.id) {
      try {
        const res = await chatService.sendMessage(currentUserId, targetFriend.id, text);
        setMessages((prev) => [...prev, res.data]);
      } catch (err) {
        console.error("Lỗi gửi tin nhắn:", err);
      }
    }
  };

  // Draggable Floating Bubble Coordinates
  const [bubblePos, setBubblePos] = useState({
    x: typeof window !== "undefined" ? window.innerWidth - 75 : 300,
    y: typeof window !== "undefined" ? window.innerHeight - 150 : 500,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false });

  const handleDragStart = (e) => {
    // Tắt hoàn toàn kéo thả di chuyển trên PC (chỉ cho phép trên di động <= 768px)
    if (typeof window !== "undefined" && window.innerWidth > 768) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: bubblePos.x,
      initialY: bubblePos.y,
      moved: false,
    };
    setIsDragging(true);
  };

  const [hasMoved, setHasMoved] = useState(false);

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragRef.current.startX;
    const deltaY = clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.moved = true;
      setHasMoved(true);
    }

    const newX = Math.max(10, Math.min(window.innerWidth - 65, dragRef.current.initialX + deltaX));
    const newY = Math.max(10, Math.min(window.innerHeight - 65, dragRef.current.initialY + deltaY));
    setBubblePos({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging]);





  if (!currentUser) return null;

  return (
    <>
      {/* Floating Messenger Icon Button */}
      {!isOpen && (
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={() => {
            if (!dragRef.current.moved) {
              setIsOpen(true);
            }
          }}
          title="Nhắn tin với bạn bè"
          style={{
            position: "fixed",
            left: (hasMoved && window.innerWidth <= 768) ? bubblePos.x : "auto",
            top: (hasMoved && window.innerWidth <= 768) ? bubblePos.y : "auto",
            right: (hasMoved && window.innerWidth <= 768) ? "auto" : 24,
            bottom: (hasMoved && window.innerWidth <= 768) ? "auto" : 24,
            zIndex: 999999,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
            color: "#fff",
            boxShadow: "0 8px 28px rgba(79, 70, 229, 0.45)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            userSelect: "none",
            touchAction: "none",
            transition: isDragging ? "none" : "box-shadow 0.2s, transform 0.2s",
          }}
        >
          💬
          {unreadChatCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                background: "#ef4444",
                color: "#ffffff",
                fontSize: 11,
                fontWeight: 800,
                borderRadius: "50%",
                minWidth: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.5)",
                animation: "pulse 1.5s infinite",
              }}
            >
              {unreadChatCount > 99 ? "99+" : unreadChatCount}
            </span>
          )}
        </div>
      )}

      {/* Mini Messenger / Mobile Fullscreen Window */}
      {isOpen && (
        <div
          className="messenger-window-container"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999999,
            width: 360,
            height: 520,
            background: "var(--bg-card)",
            borderRadius: 20,
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.25), 0 2px 10px rgba(0, 0, 0, 0.1)",
            border: "1px solid var(--border-light)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.2s ease",
          }}
        >
          {/* Messenger Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              {activeFriend ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                  <button
                    onClick={() => setActiveFriend(null)}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}
                  >
                    ←
                  </button>
                  <div
                    onClick={() => activeFriend.id && navigate(`/profile/${activeFriend.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minWidth: 0, flex: 1 }}
                    title={`Xem trang cá nhân của ${activeFriend.fullName || activeFriend.username}`}
                  >
                    {activeFriend.avatarUrl ? (
                      <img src={activeFriend.avatarUrl} alt="" className="avatar avatar-sm" style={{ width: 28, height: 28, objectFit: "cover", border: "1px solid #fff", flexShrink: 0 }} />
                    ) : (
                      <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 11, background: "rgba(255,255,255,0.2)", border: "1px solid #fff", flexShrink: 0 }}>
                        {getInitials(activeFriend.fullName || activeFriend.username)}
                      </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeFriend.fullName || activeFriend.username}
                    </span>
                  </div>

                  {/* Nút Gọi Thoại & Gọi Video HD */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto", marginRight: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleStartCall("voice")}
                      title="Gọi thoại Messenger"
                      style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, padding: 2 }}
                    >
                      📞
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartCall("video")}
                      title="Gọi Video TikTok HD"
                      style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, padding: 2 }}
                    >
                      📹
                    </button>
                  </div>
                </div>
              ) : (
                <span style={{ fontWeight: 700, fontSize: 15 }}>💬 Chat Messenger</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}
            >
              ✕
            </button>
          </div>

          {/* Toast thông báo nhanh (Sao chép, Ghim, Xóa, Sửa) */}
          {toastMessage && (
            <div
              style={{
                position: "absolute",
                top: 54,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                zIndex: 99999,
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                animation: "scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                whiteSpace: "nowrap",
              }}
            >
              {toastMessage}
            </div>
          )}

          {/* Messenger Body */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {!activeFriend ? (
              /* Danh sách Bạn bè */
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", padding: "8px 12px", textTransform: "uppercase" }}>
                  Danh sách bạn bè ({friends.length})
                </div>
                {friends.length === 0 ? (
                  <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
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
                          if (unread > 0) {
                            markConversationAsRead(friend.id);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          borderRadius: 12,
                          cursor: "pointer",
                          background: unread > 0 ? "rgba(24, 119, 242, 0.08)" : "transparent",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = unread > 0 ? "rgba(24, 119, 242, 0.08)" : "transparent"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt={fName} className="avatar avatar-md" style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div className="avatar avatar-md" style={{ width: 40, height: 40, flexShrink: 0, background: friend.avatarColor ? `linear-gradient(135deg, ${friend.avatarColor}, ${friend.avatarColor}bb)` : undefined }}>
                              {getInitials(fName)}
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 14, fontWeight: unread > 0 ? 800 : 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {fName}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: unread > 0 ? 700 : 400, color: unread > 0 ? "var(--text-primary)" : "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {lastText}
                            </span>
                          </div>
                        </div>

                        {unread > 0 && (
                          <span
                            style={{
                              background: "var(--danger)",
                              color: "#fff",
                              fontSize: 11,
                              fontWeight: 800,
                              borderRadius: "50%",
                              minWidth: 20,
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0 5px",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Khung Hội thoại Chat */
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
                {/* Thanh Ghim Cố Định Nằm Ở Đỉnh Chat (Fixed Sticky Pinned Banner) */}
                {pinnedMessage && (
                  <div
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 20,
                      background: "var(--bg-card)",
                      borderBottom: "1px solid var(--border-light)",
                      padding: "8px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "var(--primary)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", minWidth: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Tin nhắn đã ghim:</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-secondary)" }}>
                        {pinnedMessage.content}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUnpinMessage}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, padding: "0 4px", flexShrink: 0 }}
                      title="Bỏ ghim"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Danh sách tin nhắn hỗ trợ Lướt đọc tin cũ không bị kéo xuống */}
                <div
                  ref={chatScrollContainerRef}
                  onScroll={handleScrollChat}
                  style={{ flex: 1, padding: "12px 14px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 40 }}>
                      Hãy gửi lời chào đầu tiên! 👋
                    </div>
                  ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.senderId || msg.sender?.id) === currentUserId;
                    const friendAvatar = activeFriend?.avatarUrl;
                    const friendName = activeFriend?.fullName || activeFriend?.username || "Friend";
                    const isEditingThis = editingMsgId === msg.id;

                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMe ? "flex-end" : "flex-start",
                          gap: 2,
                        }}
                      >
                        <div
                          className="msg-bubble-group"
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: 6,
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            width: "100%",
                          }}
                        >
                          {/* Avatar bên trái cho bạn bè / AI */}
                          {!isMe && (
                            activeFriend?.isAi ? (
                              <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 13, background: "var(--primary)", color: "#fff", flexShrink: 0, border: "1px solid var(--border-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                ✨
                              </div>
                            ) : friendAvatar ? (
                              <img src={friendAvatar} alt="" className="avatar avatar-xs" style={{ width: 26, height: 26, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0, background: activeFriend?.avatarColor ? `linear-gradient(135deg, ${activeFriend.avatarColor}, ${activeFriend.avatarColor}bb)` : undefined }}>
                                {getInitials(friendName)}
                              </div>
                            )
                          )}

                          {/* Nút 3 chấm ⋯ nằm BÊN TRÁI tin nhắn của mình khi di chuột vào (Hover) */}
                          {isMe && !isEditingThis && (
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <button
                                type="button"
                                className="msg-more-btn"
                                onClick={() => setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  fontSize: 18,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  padding: "2px 6px",
                                  borderRadius: "50%",
                                  lineHeight: 1,
                                }}
                                title="Tùy chọn tin nhắn"
                              >
                                ⋯
                              </button>

                              {/* Bảng tùy chọn mở BÊN TRÁI NÚT 3 CHẤM & PHÁT TRIỂN HƯỚNG LÊN TRÊN */}
                              {activeMsgMenuId === msg.id && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 0,
                                    right: "calc(100% + 8px)",
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border-light)",
                                    borderRadius: 14,
                                    boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
                                    padding: "6px 0",
                                    zIndex: 10000,
                                    display: "flex",
                                    flexDirection: "column",
                                    minWidth: 175,
                                    animation: "scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                                  }}
                                >
                                  {/* 1. Copy tin nhắn */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCopyMessage(msg.content);
                                      setActiveMsgMenuId(null);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px 14px",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      textAlign: "left",
                                      width: "100%",
                                    }}
                                    className="msg-menu-item-hover"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    Copy tin nhắn
                                  </button>

                                  {/* 2. Chỉnh sửa tin nhắn (dành cho tin nhắn của mình) */}
                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMsgId(msg.id);
                                        setEditingText(msg.content);
                                        setActiveMsgMenuId(null);
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px 14px",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "var(--text-primary)",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        textAlign: "left",
                                        width: "100%",
                                      }}
                                      className="msg-menu-item-hover"
                                    >
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                      Chỉnh sửa tin nhắn
                                    </button>
                                  )}

                                  {/* 3. Ghim tin nhắn */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePinMessage(msg);
                                      setActiveMsgMenuId(null);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px 14px",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      textAlign: "left",
                                      width: "100%",
                                    }}
                                    className="msg-menu-item-hover"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Ghim tin nhắn
                                  </button>

                                  <div style={{ height: 1, background: "var(--border-light)", margin: "4px 0" }} />

                                  {/* 4. Xóa tin nhắn */}
                                  {isMe && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteMessage(msg.id);
                                        setActiveMsgMenuId(null);
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: "8px 14px",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        textAlign: "left",
                                        width: "100%",
                                      }}
                                      className="msg-menu-item-hover"
                                    >
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                      Xóa tin nhắn
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bong bóng tin nhắn */}
                          <div
                            onTouchStart={() => handleTouchStartMsg(msg.id)}
                            onTouchEnd={handleTouchEndMsg}
                            onTouchCancel={handleTouchEndMsg}
                            onContextMenu={(e) => { e.preventDefault(); setActiveMsgMenuId(msg.id); }}
                            style={{
                              maxWidth: "76%",
                              padding: "9px 14px",
                              borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                              background: isMe
                                ? "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)"
                                : activeFriend?.isAi
                                ? "var(--primary-light)"
                                : "var(--bg-input)",
                              color: isMe ? "#fff" : "var(--text-primary)",
                              border: !isMe && activeFriend?.isAi ? "1px solid var(--primary)" : "1px solid var(--border-light)",
                              fontSize: 13.5,
                              lineHeight: 1.45,
                              whiteSpace: "pre-line",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                              position: "relative",
                            }}
                          >
                            {isEditingThis ? (
                              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                <input
                                  type="text"
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  style={{
                                    padding: "4px 8px",
                                    borderRadius: 8,
                                    border: "1px solid #fff",
                                    fontSize: 13,
                                    color: "#000",
                                  }}
                                />
                                <button onClick={() => handleEditMessage(msg.id)} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✓</button>
                                <button onClick={() => setEditingMsgId(null)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✕</button>
                              </div>
                            ) : msg.content?.startsWith("📷 http") ? (
                              <img
                                src={msg.content.replace("📷 ", "").trim()}
                                alt="Ảnh gửi"
                                style={{ maxWidth: 210, maxHeight: 220, borderRadius: 12, objectFit: "cover", display: "block", cursor: "pointer" }}
                                onClick={() => window.open(msg.content.replace("📷 ", "").trim(), "_blank")}
                              />
                            ) : (
                              msg.content
                            )}
                          </div>

                          {/* Nút 3 chấm cho tin nhắn bạn bè: NẰM Ở BÊN PHẢI BONG BÓNG TIN NHẮN */}
                          {!isMe && !isEditingThis && (
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <button
                                type="button"
                                className="msg-more-btn"
                                onClick={() => setActiveMsgMenuId(activeMsgMenuId === msg.id ? null : msg.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  fontSize: 18,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  padding: "2px 6px",
                                  borderRadius: "50%",
                                  lineHeight: 1,
                                }}
                                title="Tùy chọn tin nhắn"
                              >
                                ⋯
                              </button>

                              {activeMsgMenuId === msg.id && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "calc(100% + 4px)",
                                    left: 0,
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border-light)",
                                    borderRadius: 14,
                                    boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
                                    padding: "6px 0",
                                    zIndex: 10000,
                                    display: "flex",
                                    flexDirection: "column",
                                    minWidth: 170,
                                    animation: "slideDown 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCopyMessage(msg.content);
                                      setActiveMsgMenuId(null);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px 14px",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      textAlign: "left",
                                      width: "100%",
                                    }}
                                    className="msg-menu-item-hover"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                    Copy tin nhắn
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePinMessage(msg);
                                      setActiveMsgMenuId(null);
                                    }}
                                    style={{
                                      background: "none",
                                      border: "none",
                                      padding: "8px 14px",
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "var(--text-primary)",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      textAlign: "left",
                                      width: "100%",
                                    }}
                                    className="msg-menu-item-hover"
                                  >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Ghim tin nhắn
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Avatar bên phải cho user mình */}
                          {isMe && (
                            currentUser.avatarUrl ? (
                              <img src={currentUser.avatarUrl} alt="" className="avatar avatar-xs" style={{ width: 24, height: 24, objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div className="avatar avatar-xs" style={{ width: 24, height: 24, fontSize: 9, flexShrink: 0 }}>
                                {getInitials(currentUser.fullName || currentUser.username)}
                              </div>
                            )
                          )}
                        </div>

                        {/* Thời gian gửi & Trạng thái đã xem */}
                        <div
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                            margin: "0 34px",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {formatTime(msg.createdAt)}
                          {isMe && (
                            <span style={{ color: msg.read ? "var(--primary)" : "var(--text-muted)", fontWeight: 600 }}>
                              {msg.read ? " ✓✓ Đã xem" : " ✓ Đã gửi"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {isAiTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-start" }}>
                    <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 13, background: "var(--primary)", color: "#fff", flexShrink: 0 }}>
                      ✨
                    </div>
                    <div style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, fontStyle: "italic", animation: "pulse 1.2s infinite" }}>
                      ✨ Trợ lý đang soạn phản hồi... 💬
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
          </div>

          {/* Bảng chọn Sticker & Emoji nhanh */}
          {showStickerPicker && (
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bg-card)",
                borderTop: "1px solid var(--border-light)",
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: 8,
                animation: "slideUp 0.15s ease",
              }}
            >
              {STICKERS.map((st) => (
                <button
                  key={st.emoji}
                  type="button"
                  onClick={() => handleSendSticker(st)}
                  title={st.text}
                  style={{
                    background: "var(--bg-input)",
                    border: "1px solid var(--border-light)",
                    borderRadius: 12,
                    padding: "6px 0",
                    fontSize: 20,
                    cursor: "pointer",
                    transition: "transform 0.15s ease, background 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.2)"; e.currentTarget.style.background = "var(--primary-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "var(--bg-input)"; }}
                >
                  {st.emoji}
                </button>
              ))}
            </div>
          )}

          {/* Messenger Input Form - Chỉ hiển thị khi đã chọn một người bạn cụ thể */}
          {activeFriend && (
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--bg-card)",
                zIndex: 1000,
              }}
            >
              {/* Nút bật Sticker Picker */}
              <button
                type="button"
                onClick={() => setShowStickerPicker((v) => !v)}
                title="Bảng Sticker & Emoji"
                style={{
                  background: showStickerPicker ? "var(--primary-light)" : "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: "50%",
                  lineHeight: 1,
                }}
              >
                😊
              </button>

              {/* Nút chọn gửi Ảnh */}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                title="Gửi hình ảnh"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: "50%",
                  lineHeight: 1,
                }}
              >
                {uploadingImage ? "⏳" : "🖼️"}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageSelect}
              />

              <input
                type="text"
                placeholder={`Nhắn tin cho ${activeFriend.fullName || activeFriend.username}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                style={{
                  background: inputMessage.trim() ? "var(--primary)" : "var(--border)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 38,
                  height: 38,
                  cursor: inputMessage.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ➔
              </button>
            </form>
          )}
        </div>
      )}

      {/* Messenger / TikTok Call Modal Overlay */}
      {activeCall && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.95)",
            zIndex: 99999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "40px 20px 60px",
            color: "#fff",
            animation: "slideUp 0.25s ease",
          }}
        >
          {/* Top Info */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
              {activeCall.type === "video" ? "📹 Cuộc gọi Video HD" : "📞 Cuộc gọi thoại HD"}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px", color: "#fff" }}>
              {activeCall.friend?.fullName || activeCall.friend?.username}
            </h2>
            <div style={{ fontSize: 14, color: "#10b981", fontWeight: 700 }}>
              🟢 {String(Math.floor(activeCall.seconds / 60)).padStart(2, "0")}:{String(activeCall.seconds % 60).padStart(2, "0")} • Trực tiếp
            </div>
          </div>

          {/* Center Video Feed / Avatar Pulse */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {activeCall.type === "video" ? (
              <div style={{ width: 260, height: 320, borderRadius: 24, overflow: "hidden", background: "#000", border: "2px solid rgba(255,255,255,0.3)", position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                {/* Real WebRTC Local Camera Video Stream */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: 12, fontSize: 11, color: "#fff" }}>
                  📷 Camera của bạn (Trực tiếp)
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 130, height: 130, borderRadius: "50%", background: "rgba(79, 70, 229, 0.3)", animation: "pulse 1.5s infinite", position: "absolute" }} />
                {activeCall.friend?.avatarUrl ? (
                  <img src={activeCall.friend.avatarUrl} alt="" className="avatar avatar-xl" style={{ width: 100, height: 100, objectFit: "cover", border: "3px solid #fff", position: "relative", zIndex: 2 }} />
                ) : (
                  <div className="avatar avatar-xl" style={{ width: 100, height: 100, fontSize: 36, background: "var(--primary)", color: "#fff", border: "3px solid #fff", position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {getInitials(activeCall.friend?.fullName || activeCall.friend?.username)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Call Controls */}
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <button
              type="button"
              onClick={handleEndCall}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                fontSize: 26,
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Tắt cuộc gọi"
            >
              🔴
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatWidget;
