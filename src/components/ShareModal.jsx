import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import friendService from "../services/friendService";
import chatService from "../services/chatService";
import postService from "../services/postService";
import { useAuth } from "../context/AuthContext";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function ShareModal({ post, isOpen, onClose, onToast }) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [sentFriendIds, setSentFriendIds] = useState([]);
  const [shareComment, setShareComment] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const messengerRowRef = useRef(null);
  const shareLinksRowRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      const userId = currentUser.id || currentUser.userId;
      friendService.getFriendsList(userId)
        .then((res) => setFriends(res.data || []))
        .catch(() => {});
    }
    if (!isOpen) {
      setShareComment("");
      setSentFriendIds([]);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const currentUserId = currentUser?.id || currentUser?.userId;
  const authorName = post.user?.fullName || post.user?.username || "Ẩn danh";
  const myName = currentUser?.fullName || currentUser?.username || "Bạn";

  // Chia sẻ lên trang cá nhân
  const handleShareToTimeline = async () => {
    if (!currentUser) {
      onToast("Vui lòng đăng nhập để chia sẻ!", "error");
      return;
    }
    setLoading(true);
    const postData = {
      title: `${myName} đã chia sẻ một bài viết`,
      content: shareComment.trim(),
      thumbNail: null,
      status: "public",
      bgColor: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: { id: currentUserId },
      category: post.category ? { id: post.category.id } : null,
      sharedPost: { id: post.sharedPost ? post.sharedPost.id : post.id }
    };

    try {
      await postService.create(postData);
      onToast("Đã chia sẻ bài viết lên trang cá nhân của bạn!", "success");
      onClose();
      // Reload feed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      onToast("Không thể chia sẻ bài viết lên trang cá nhân!", "error");
    } finally {
      setLoading(false);
    }
  };

  // Chia sẻ qua Messenger cho bạn bè
  const handleSendViaMessenger = async (friend) => {
    if (!currentUser) {
      onToast("Vui lòng đăng nhập để gửi tin nhắn!", "error");
      return;
    }
    const postLink = window.location.origin + `/posts/${post.id}`;
    const messageText = `Đã chia sẻ bài viết của ${authorName}: ${postLink}`;

    try {
      await chatService.sendMessage(currentUserId, friend.id, messageText);
      setSentFriendIds((prev) => [...prev, friend.id]);
      onToast(`Đã gửi qua Messenger cho ${friend.fullName || friend.username}!`, "success");
    } catch {
      onToast("Không thể gửi tin nhắn chia sẻ!", "error");
    }
  };

  // Sao chép liên kết
  const handleCopyLink = () => {
    const postLink = window.location.origin + `/posts/${post.id}`;
    navigator.clipboard.writeText(postLink)
      .then(() => {
        onToast("Đã sao chép liên kết vào khay nhớ tạm!", "success");
      })
      .catch(() => {
        onToast("Không thể sao chép liên kết!", "error");
      });
  };

  // Cuộn ngang danh sách bạn bè
  const scrollMessenger = (direction) => {
    if (messengerRowRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      messengerRowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Cuộn ngang danh sách nút chia sẻ
  const scrollShareLinks = (direction) => {
    if (shareLinksRowRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      shareLinksRowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: 550,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-light)",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Chia sẻ</span>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--bg-hover)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: "var(--text-secondary)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--border-color)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Section 1: Tạo bài viết chia sẻ */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={myName}
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                className="avatar avatar-md"
                style={{
                  width: 44,
                  height: 44,
                  fontSize: 16,
                  background: currentUser?.avatarColor ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)` : undefined,
                }}
              >
                {getInitials(myName)}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{myName}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    background: "var(--bg-input)",
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Bảng feed
                </span>
                <span
                  style={{
                    background: "var(--bg-input)",
                    padding: "3px 10px",
                    borderRadius: 6,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  🌐 Công khai ▾
                </span>
              </div>
            </div>
          </div>

          {/* Text Input */}
          <textarea
            placeholder="Hãy nói gì đó về nội dung này..."
            value={shareComment}
            onChange={(e) => setShareComment(e.target.value)}
            style={{
              width: "100%",
              minHeight: 70,
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 14.5,
              background: "none",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              marginBottom: 10,
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              onClick={handleShareToTimeline}
              disabled={loading}
              style={{
                background: "#1877f2",
                color: "#fff",
                border: "none",
                padding: "8px 24px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              {loading ? "Đang chia sẻ..." : "Chia sẻ ngay"}
            </button>
          </div>

          <div style={{ height: 1, background: "var(--border-light)", margin: "16px 0" }} />

          {/* Section 2: Gửi bằng Messenger */}
          <div style={{ position: "relative", marginBottom: 16 }}>
            <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              Gửi bằng Messenger
            </h4>

            {/* Left/Right scroll buttons */}
            <button
              onClick={() => scrollMessenger("left")}
              style={{
                position: "absolute",
                left: -8,
                top: "55%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scrollMessenger("right")}
              style={{
                position: "absolute",
                right: -8,
                top: "55%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              ›
            </button>

            {/* Horizontal List */}
            <div
              ref={messengerRowRef}
              style={{
                display: "flex",
                gap: 16,
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "4px 8px",
              }}
            >
              {friends.length === 0 ? (
                <span style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "10px 0" }}>
                  Chưa có bạn bè nào
                </span>
              ) : (
                friends.map((friend) => {
                  const fName = friend.fullName || friend.username;
                  const isSent = sentFriendIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => !isSent && handleSendViaMessenger(friend)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        width: 70,
                        flexShrink: 0,
                        cursor: isSent ? "default" : "pointer",
                        position: "relative",
                      }}
                    >
                      <div style={{ position: "relative" }}>
                        {friend.avatarUrl ? (
                          <img
                            src={friend.avatarUrl}
                            alt={fName}
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: isSent ? "2.5px solid #2e7d32" : "2px solid transparent",
                            }}
                          />
                        ) : (
                          <div
                            className="avatar"
                            style={{
                              width: 52,
                              height: 52,
                              fontSize: 16,
                              background: friend.avatarColor ? `linear-gradient(135deg, ${friend.avatarColor}, ${friend.avatarColor}bb)` : undefined,
                              border: isSent ? "2.5px solid #2e7d32" : "2px solid transparent",
                            }}
                          >
                            {getInitials(fName)}
                          </div>
                        )}
                        {/* Sent Checkmark Indicator */}
                        {isSent && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              right: 0,
                              background: "#2e7d32",
                              color: "#fff",
                              borderRadius: "50%",
                              width: 18,
                              height: 18,
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          textAlign: "center",
                          color: isSent ? "#2e7d32" : "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          width: "100%",
                        }}
                      >
                        {fName.split(" ").slice(-2).join(" ")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border-light)", margin: "16px 0" }} />

          {/* Section 3: Chia sẻ lên */}
          <div style={{ position: "relative" }}>
            <h4 style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              Chia sẻ lên
            </h4>

            {/* Left/Right scroll buttons */}
            <button
              onClick={() => scrollShareLinks("left")}
              style={{
                position: "absolute",
                left: -8,
                top: "55%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scrollShareLinks("right")}
              style={{
                position: "absolute",
                right: -8,
                top: "55%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
              }}
            >
              ›
            </button>

            {/* Icons Horizontal Row */}
            <div
              ref={shareLinksRowRef}
              style={{
                display: "flex",
                gap: 20,
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                padding: "4px 8px",
              }}
            >
              {/* Target 1: Messenger */}
              <div
                onClick={() => onToast("Đang chuyển sang ứng dụng Messenger...", "info")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 70, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e7f3ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1877f2" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  Messenger
                </span>
              </div>

              {/* Target 2: WhatsApp */}
              <div
                onClick={() => onToast("Đang chuyển sang ứng dụng WhatsApp...", "info")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 70, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e8f8ef", display: "flex", alignItems: "center", justifyContent: "center", color: "#2e7d32" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 10H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8h-4z"/>
                    <path d="M12 2v8"/>
                    <path d="m15 7-3-3-3 3"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  WhatsApp
                </span>
              </div>

              {/* Target 3: Tin của bạn */}
              <div
                onClick={() => onToast("Tính năng chia sẻ lên Tin đang phát triển!", "info")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 70, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  Tin của bạn
                </span>
              </div>

              {/* Target 4: Sao chép liên kết */}
              <div
                onClick={handleCopyLink}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 70, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  Sao chép liên kết
                </span>
              </div>

              {/* Target 5: Mã QR Code */}
              <div
                onClick={() => setShowQrCode((v) => !v)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 75, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", color: "var(--primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  Mã QR Bài viết
                </span>
              </div>

              {/* Target 6: Nhóm */}
              <div
                onClick={() => onToast("Đang chuyển tiếp chia sẻ vào Nhóm...", "info")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 70, flexShrink: 0, cursor: "pointer" }}
              >
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, textAlign: "center", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                  Nhóm
                </span>
              </div>
            </div>
          </div>

          {/* Ô hiển thị Mã QR Code Bài Viết khi được nhấp chọn */}
          {showQrCode && (
            <div style={{ marginTop: 16, background: "var(--bg-input)", padding: 16, borderRadius: 16, textAlign: "center", animation: "slideDown 0.2s ease" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
                📱 Mã QR Bài Viết Trực Tiếp
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                Quét mã bằng Điện thoại để mở xem bài viết ngay lập tức
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + `/posts/${post.id}`)}`}
                alt="Mã QR"
                style={{ width: 160, height: 160, borderRadius: 12, border: "3px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", margin: "0 auto 10px", display: "block" }}
              />
              <div>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + `/posts/${post.id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  download="qr-code-post.png"
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "underline" }}
                >
                  📥 Tải mã QR về máy
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ShareModal;
