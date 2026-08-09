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
    window.addEventListener("open_chat_user", handleOpenChat);
    return () => window.removeEventListener("open_chat_user", handleOpenChat);
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

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentUserId || !activeFriend?.id) return;
    const text = inputMessage.trim();
    setInputMessage("");

    if (activeFriend.isAi) {
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
      } catch {
        // Fail silently
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    try {
      const res = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, res.data]);
    } catch {
      // Fail silently
    }
  };

  if (!currentUser) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 99999, fontFamily: "inherit" }}>
      {/* Floating Messenger Icon Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Nhắn tin với bạn bè"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
            color: "#fff",
            border: "none",
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            transition: "transform 0.2s, boxShadow 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          💬
        </button>
      )}

      {/* Mini Messenger Popup Window */}
      {isOpen && (
        <div
          style={{
            width: 350,
            height: 460,
            background: "var(--bg-card)",
            borderRadius: 18,
            boxShadow: "0 12px 36px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)",
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
              <div style={{ flex: 1, padding: 12, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 40 }}>
                    Hãy gửi lời chào đầu tiên! 👋
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = Number(msg.senderId || msg.sender?.id) === currentUserId;
                    return (
                      <div
                        key={msg.id || idx}
                        style={{
                          display: "flex",
                          justifyContent: isMe ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "78%",
                            padding: "8px 14px",
                            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? "var(--primary)" : activeFriend.isAi ? "var(--primary-light)" : "var(--bg-input)",
                            color: isMe ? "#fff" : activeFriend.isAi ? "var(--text-primary)" : "var(--text-primary)",
                            border: !isMe && activeFriend.isAi ? "1px solid var(--primary)" : "none",
                            fontSize: 13.5,
                            lineHeight: 1.45,
                            whiteSpace: "pre-line",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                {isAiTyping && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: "var(--primary-light)", color: "var(--primary)", border: "1px solid var(--primary)", padding: "6px 12px", borderRadius: 16, fontSize: 12, fontWeight: 600, fontStyle: "italic", animation: "pulse 1.2s infinite" }}>
                      🤖 AI đang suy nghĩ trả lời...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Messenger Input Form */}
          {activeFriend && (
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: 10,
                borderTop: "1px solid var(--border-light)",
                display: "flex",
                gap: 8,
                background: "var(--bg-card)",
              }}
            >
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "var(--bg-input)",
                  color: "var(--text-primary)",
                  fontSize: 13.5,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  background: "var(--primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                ➔
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default FloatingChatWidget;
