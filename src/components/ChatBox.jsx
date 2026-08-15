import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import friendService from "../services/friendService";
import chatService from "../services/chatService";
import Avatar from "./Avatar";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeShort(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function ChatBox() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? Number(currentUser.id || currentUser.userId) : null;

  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null); // User object currently chatting with
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState("");
  const [isOpenList, setIsOpenList] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load danh sách bạn bè khi mở widget
  useEffect(() => {
    if (currentUserId) {
      friendService.getFriendsList(currentUserId).then((res) => {
        setFriends(res.data || []);
      }).catch(() => {});
    }
  }, [currentUserId]);

  // Lắng nghe sự kiện customEvent để mở chat từ Sidebar hoặc Profile
  useEffect(() => {
    const handleOpenChatWithUser = (e) => {
      if (e.detail && e.detail.friend) {
        setActiveFriend(e.detail.friend);
        setIsOpenList(false);
      }
    };
    window.addEventListener("open_chat_user", handleOpenChatWithUser);
    return () => window.removeEventListener("open_chat_user", handleOpenChatWithUser);
  }, []);

  // Poll lịch sử nhắn tin với activeFriend mỗi 2.5s
  useEffect(() => {
    if (!currentUserId || !activeFriend) return;

    const fetchHistory = () => {
      chatService.getHistory(currentUserId, activeFriend.id).then((res) => {
        const newMsgs = res.data || [];
        setMessages((prev) => {
          if (prev.length !== newMsgs.length) {
            setTimeout(scrollToBottom, 100);
          }
          return newMsgs;
        });
      }).catch(() => {});
    };

    fetchHistory();
    pollTimerRef.current = setInterval(fetchHistory, 2500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [currentUserId, activeFriend]);

  // Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeFriend || sending) return;

    const text = inputContent.trim();
    setInputContent("");
    setSending(true);

    try {
      const res = await chatService.sendMessage(currentUserId, activeFriend.id, text);
      setMessages((prev) => [...prev, res.data]);
      setTimeout(scrollToBottom, 50);
    } catch {
      toast.error("Không thể gửi tin nhắn!");
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div style={{ position: "fixed", bottom: 0, right: 20, zIndex: 9999, display: "flex", gap: 12, alignItems: "flex-end" }}>

      {/* Mini Floating Messenger Toggle Button */}
      {!activeFriend && (
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setIsOpenList((v) => !v)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 24px rgba(24,119,242,0.4)",
              transition: "transform 0.2s ease, background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            title="Nhắn tin trò chuyện"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.145 2 11.259c0 2.913 1.454 5.517 3.73 7.238V22l3.354-1.841c.915.253 1.888.39 2.916.39 5.523 0 10-4.145 10-9.259C22 6.145 17.523 2 12 2zm1.096 12.441l-2.548-2.723-4.97 2.723 5.467-5.805 2.613 2.723 4.905-2.723-5.467 5.805z"/>
            </svg>
          </button>

          {/* Quick Friends Popup List */}
          {isOpenList && (
            <div
              style={{
                position: "absolute",
                bottom: 64,
                right: 0,
                width: 280,
                background: "var(--bg-primary)",
                borderRadius: 16,
                boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
                border: "1px solid var(--border)",
                padding: 12,
                overflow: "hidden",
                animation: "dropdownFadeIn 0.2s ease",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "var(--text-primary)" }}>
                💬 Chat trực tiếp
              </div>
              {friends.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "12px 0", textAlign: "center" }}>
                  Chưa có bạn bè nào. Hãy kết bạn để bắt đầu trò chuyện!
                </div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {friends.map((f) => {
                    const name = f.fullName || f.username;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          setActiveFriend(f);
                          setIsOpenList(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                      >
                                                <Avatar
                          userId={f.id}
                          src={f.avatarUrl}
                          name={name}
                          username={f.username}
                          avatarColor={f.avatarColor}
                          size="sm"
                          isOnline={true}
                          showActiveStatus={true}
                          className="border-2 border-[var(--bg-card)]"
                        />
                        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Chat Window */}
      {activeFriend && (
        <div
          style={{
            width: 330,
            height: 420,
            background: "var(--bg-primary)",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.22)",
            border: "1px solid var(--border)",
            borderBottom: "none",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar
                userId={activeFriend.id}
                src={activeFriend.avatarUrl}
                name={activeFriend.fullName || activeFriend.username}
                username={activeFriend.username}
                avatarColor={activeFriend.avatarColor}
                size="sm"
                isOnline={true}
                showActiveStatus={true}
                className="border-2 border-[var(--bg-card)]"
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                  {activeFriend.fullName || activeFriend.username}
                </div>
                <div style={{ fontSize: 11, color: "#31a24c", fontWeight: 600 }}>Đang hoạt động</div>
              </div>
            </div>

            <button
              onClick={() => setActiveFriend(null)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 18, color: "var(--text-muted)", padding: "2px 6px",
                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: 12,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "var(--bg-primary)",
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: "auto", marginBottom: "auto" }}>
                Hãy gửi lời chào đầu tiên đến {activeFriend.fullName || activeFriend.username}! 👋
              </div>
            ) : (
              messages.map((msg) => {
                const isMeMsg = msg.sender?.id === currentUserId;
                return (
                  <div
                    key={msg.id || msg.createdAt}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMeMsg ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 text-sm leading-relaxed break-words shadow-xs ${
                        isMeMsg
                          ? "bg-black dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-tr-sm"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 px-1">
                      {timeShort(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: 8,
              background: "var(--bg-card)",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              className="form-input"
              placeholder="Nhập tin nhắn..."
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              style={{
                flex: 1,
                borderRadius: 20,
                padding: "8px 14px",
                fontSize: 13,
                border: "1px solid var(--border)",
              }}
            />
            <button
              type="submit"
              disabled={!inputContent.trim() || sending}
              style={{
                background: inputContent.trim() ? "#1877f2" : "var(--bg-input)",
                color: inputContent.trim() ? "#ffffff" : "var(--text-muted)",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputContent.trim() ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatBox;
