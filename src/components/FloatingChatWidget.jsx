import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";
import userService from "../services/userService";
import chatService from "../services/chatService";
import aiService from "../services/aiService";

const AI_USER = {
  id: "ai_bot",
  fullName: "🤖 Trợ lý AI Assistant",
  username: "ai_assistant",
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

  // Lấy danh sách bạn bè (hoặc người dùng) khi mở widget - luôn chèn AI Assistant ở đầu
  useEffect(() => {
    if (isOpen && currentUserId) {
      friendService
        .getFriendsList(currentUserId)
        .then((res) => {
          const list = res.data || [];
          if (list.length > 0) {
            setFriends([AI_USER, ...list]);
          } else {
            userService.getAll().then((uRes) => {
              const all = (uRes.data || []).filter((u) => u.id !== currentUserId);
              setFriends([AI_USER, ...all]);
            }).catch(() => {
              setFriends([AI_USER]);
            });
          }
        })
        .catch(() => {
          userService.getAll().then((uRes) => {
            const all = (uRes.data || []).filter((u) => u.id !== currentUserId);
            setFriends([AI_USER, ...all]);
          }).catch(() => {
            setFriends([AI_USER]);
          });
        });
    }
  }, [isOpen, currentUserId]);

  // Lấy lịch sử chat với bạn bè được chọn hoặc AI
  useEffect(() => {
    let timer;
    if (isOpen && activeFriend?.isAi) {
      if (messages.length === 0) {
        setMessages([
          {
            id: "ai_welcome",
            senderId: "ai_bot",
            content: "Xin chào! Mình là Trợ lý AI của BlogViet 🤖✨. Bạn cần tư vấn ý tưởng bài viết, giải đáp thắc mắc hay trò chuyện gì cứ nhắn cho mình nhé!",
            createdAt: new Date().toISOString()
          }
        ]);
      }
      return;
    }

    if (isOpen && currentUserId && activeFriend?.id) {
      const fetchChat = () => {
        chatService.getHistory(currentUserId, activeFriend.id).then((res) => {
          setMessages(res.data || []);
        }).catch(() => {});
      };
      fetchChat();
      timer = setInterval(fetchChat, 2500); // Polling chat 2.5s
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

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  // Tự động chọn Trợ lý AI Assistant làm đối tượng trò chuyện mặc định khi mở Messenger
  useEffect(() => {
    if (isOpen && currentUserId && !activeFriend) {
      setActiveFriend(AI_USER);
    }
  }, [isOpen, currentUserId, activeFriend]);

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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {activeFriend ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setActiveFriend(null)}
                    style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}
                  >
                    ←
                  </button>
                  <div
                    onClick={() => activeFriend.id && navigate(`/profile/${activeFriend.id}`)}
                    style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                    title={`Xem trang cá nhân của ${activeFriend.fullName || activeFriend.username}`}
                  >
                    {activeFriend.avatarUrl ? (
                      <img src={activeFriend.avatarUrl} alt="" className="avatar avatar-sm" style={{ width: 28, height: 28, objectFit: "cover", border: "1px solid #fff" }} />
                    ) : (
                      <div className="avatar avatar-sm" style={{ width: 28, height: 28, fontSize: 11, background: "rgba(255,255,255,0.2)", border: "1px solid #fff" }}>
                        {getInitials(activeFriend.fullName || activeFriend.username)}
                      </div>
                    )}
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {activeFriend.fullName || activeFriend.username}
                    </span>
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
                    return (
                      <div
                        key={friend.id}
                        onClick={() => setActiveFriend(friend)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 12,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {friend.avatarUrl ? (
                          <img src={friend.avatarUrl} alt={fName} className="avatar avatar-md" style={{ width: 40, height: 40, objectFit: "cover" }} />
                        ) : (
                          <div className="avatar avatar-md" style={{ width: 40, height: 40, background: friend.avatarColor ? `linear-gradient(135deg, ${friend.avatarColor}, ${friend.avatarColor}bb)` : undefined }}>
                            {getInitials(fName)}
                          </div>
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{fName}</span>
                          <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>Bấm để nhắn tin</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Khung Hội thoại Chat */
              <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 40 }}>
                    Hãy gửi lời chào đầu tiên! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.senderId || msg.sender?.id) === currentUserId;
                    const friendAvatar = activeFriend?.avatarUrl;
                    const friendName = activeFriend?.fullName || activeFriend?.username || "Friend";

                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: 6,
                          justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                      >
                        {/* Avatar bên trái cho bạn bè / AI */}
                        {!isMe && (
                          activeFriend?.isAi ? (
                            <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 13, background: "var(--primary)", color: "#fff", flexShrink: 0, border: "1px solid var(--border-light)" }}>
                              🤖
                            </div>
                          ) : friendAvatar ? (
                            <img src={friendAvatar} alt="" className="avatar avatar-xs" style={{ width: 26, height: 26, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0, background: activeFriend?.avatarColor ? `linear-gradient(135deg, ${activeFriend.avatarColor}, ${activeFriend.avatarColor}bb)` : undefined }}>
                              {getInitials(friendName)}
                            </div>
                          )
                        )}

                        <div
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
                          }}
                        >
                          {msg.content}
                        </div>

                        {/* Avatar bên phải cho user của mình */}
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
                    );
                  })
                )}
                {isAiTyping && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-start" }}>
                    <div className="avatar avatar-xs" style={{ width: 26, height: 26, fontSize: 13, background: "var(--primary)", color: "#fff", flexShrink: 0 }}>
                      🤖
                    </div>
                    <div style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, fontStyle: "italic", animation: "pulse 1.2s infinite" }}>
                      AI đang suy nghĩ trả lời...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
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

          {/* Messenger Input Form - Sẵn sàng gõ tin nhắn */}
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

            <input
              type="text"
              placeholder={activeFriend ? `Nhắn tin cho ${activeFriend.fullName || activeFriend.username}...` : "Nhập tin nhắn..."}
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
        </div>
      )}
    </>
  );
}

export default FloatingChatWidget;
