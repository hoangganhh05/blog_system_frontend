import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";

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

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const isMessageNotification = (n) => {
    if (!n) return false;
    const typeStr = String(n.type || "").toUpperCase();
    const contentStr = String(n.content || n.message || n.title || "").toLowerCase();
    if (
      typeStr.includes("CHAT") ||
      typeStr.includes("MESSAGE") ||
      typeStr.includes("MSG") ||
      typeStr.includes("INBOX")
    ) return true;
    if (
      contentStr.includes("đã gửi tin nhắn") ||
      contentStr.includes("tin nhắn")
    ) return true;
    return false;
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      const res = await notificationService.getUserNotifications(currentUserId);
      const rawList = res.data || [];
      // On the notifications page, show everything (including messages) OR choose to filter - here we show non-message notifications first
      const list = rawList;
      setNotifications(list);
    } catch (e) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 15000);
    return () => clearInterval(t);
  }, [currentUserId]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {}
  };

  const markAllRead = async () => {
    if (!currentUserId) return;
    try {
      await notificationService.markAllAsRead(currentUserId);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {}
  };

  return (
    <div className="app-layout">
      <div style={{ maxWidth: 720, margin: "16px auto", padding: "0 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer" }}>←</button>
          <h2 style={{ margin: 0, fontSize: 20 }}>Thông báo</h2>
          <div>
            <button onClick={markAllRead} className="btn" style={{ padding: "8px 12px" }}>Đánh dấu đã đọc</button>
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-light)" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center" }}>Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>Bạn chưa có thông báo nào</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} onClick={() => { markAsRead(n.id); if (n.post?.id) navigate(`/posts/${n.post.id}`); else if (n.sender?.id) navigate(`/profile/${n.sender.id}`); }} style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid var(--border-light)", cursor: "pointer", background: n.read ? "transparent" : "var(--primary-light)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{n.sender?.avatarUrl ? (<img src={n.sender.avatarUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />) : "🔔"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 700 }}>{n.title || (n.sender?.fullName || n.sender?.username || 'Hệ thống')}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  <div style={{ marginTop: 6, color: "var(--text-secondary)" }}>{n.content || n.message}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
