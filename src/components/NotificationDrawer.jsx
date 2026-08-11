import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "../services/notificationService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

function isMessageNotification(n) {
  if (!n) return false;
  const typeStr = String(n.type || "").toUpperCase();
  const contentStr = String(n.content || n.message || n.title || "").toLowerCase();

  if (
    typeStr.includes("CHAT") ||
    typeStr.includes("MESSAGE") ||
    typeStr.includes("MSG") ||
    typeStr.includes("INBOX") ||
    typeStr.includes("TIN_NHAN")
  ) {
    return true;
  }

  if (
    contentStr.includes("đã gửi tin nhắn") ||
    contentStr.includes("tin nhắn:") ||
    contentStr.includes("gửi một tin nhắn") ||
    contentStr.includes("gửi tin nhắn")
  ) {
    return true;
  }

  return false;
}

function NotificationDrawer({ currentUser, isOpen, onClose, onUnreadCountChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const currentUserId = currentUser?.id || currentUser?.userId;

  // Lấy tổng số thông báo chưa đọc định kỳ (Lọc bỏ tuyệt đối tin nhắn chat)
  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    try {
      const res = await notificationService.getUserNotifications(currentUserId);
      const rawList = res.data || [];
      const list = rawList.filter((n) => !isMessageNotification(n));
      const unreadCount = list.filter((n) => !n.read).length;
      onUnreadCountChange && onUnreadCountChange(unreadCount);
    } catch {
      // Ignore background errors
    }
  };

  // Tải danh sách thông báo đầy đủ khi người dùng bấm mở quả chuông
  const fetchNotifications = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await notificationService.getUserNotifications(currentUserId);
      const rawList = res.data || [];
      // Lọc bỏ tuyệt đối thông báo tin nhắn khỏi quả chuông (chỉ giữ thông báo bài viết, bình luận, tương tác)
      const list = rawList.filter((n) => !isMessageNotification(n));
      setNotifications(list);

      const unreadCount = list.filter((n) => !n.read).length;
      onUnreadCountChange && onUnreadCountChange(unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 15000); // 15 giây poll 1 lần
      return () => clearInterval(interval);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchNotifications();
    }
  }, [isOpen, currentUserId]);

  // Đóng drawer khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose && onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Đánh dấu 1 thông báo là đã đọc
  const handleItemClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        fetchUnreadCount();
      } catch {
        // Ignore error
      }
    }
    onClose && onClose();

    // Điều hướng tới đúng vị trí bài viết hoặc profile
    if (notif.post?.id) {
      navigate(`/posts/${notif.post.id}`);
    } else if (notif.sender?.id) {
      navigate(`/profile/${notif.sender.id}`);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    try {
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onUnreadCountChange && onUnreadCountChange(0);
    } catch {
      // Ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={drawerRef}
      className="notification-drawer-popup"
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 12,
        width: 360,
        maxHeight: 480,
        background: "var(--bg-card)",
        borderRadius: 18,
        boxShadow: "0 14px 40px rgba(0, 0, 0, 0.24), 0 6px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(0,0,0,0.04)",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transformOrigin: "top right",
        animation: "drawerPopIn 260ms cubic-bezier(0.2, 0.9, 0.38, 1)",
      }}
    >
      {/* Header Drawer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
          Thông báo
        </span>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      {/* Body List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              color: "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: 36 }}>🔔</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Bạn chưa có thông báo nào</span>
            <span style={{ fontSize: 12 }}>Các hoạt động mới như lượt thích, bình luận sẽ xuất hiện tại đây.</span>
          </div>
        ) : (
          notifications.map((n) => {
            const senderName = n.sender?.fullName || n.sender?.username || "Hệ thống";
            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: n.read ? "transparent" : "var(--primary-light)",
                  transition: "background 0.2s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (n.read) e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (n.read) e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Sender Avatar */}
                <div
                  style={{ position: "relative", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (n.sender?.id) {
                      navigate(`/profile/${n.sender.id}`);
                      onClose();
                    }
                  }}
                  title={`Xem trang cá nhân của ${senderName}`}
                >
                  {n.sender?.avatarUrl ? (
                    <img
                      src={n.sender.avatarUrl}
                      alt={senderName}
                      className="avatar avatar-md"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="avatar avatar-md"
                      style={{
                        background: n.sender?.avatarColor
                          ? `linear-gradient(135deg, ${n.sender.avatarColor}, ${n.sender.avatarColor}bb)`
                          : undefined,
                      }}
                    >
                      {getInitials(senderName)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-primary)",
                      lineHeight: 1.35,
                      wordBreak: "break-word",
                    }}
                  >
                    <strong style={{ fontWeight: 700 }}>{senderName} </strong>
                    <span>{n.message}</span>
                  </div>
                  <span style={{ fontSize: 11, color: n.read ? "var(--text-muted)" : "var(--primary)", fontWeight: n.read ? 400 : 600 }}>
                    {timeAgo(n.createdAt)}
                  </span>
                </div>

                {/* Unread indicator dot */}
                {!n.read && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationDrawer;
