import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Loader2, Heart, MessageCircle, UserPlus, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import notificationService from "../services/notificationService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  let formattedString = dateStr;
  if (typeof dateStr === "string" && !dateStr.endsWith("Z") && !dateStr.includes("+")) {
    formattedString = dateStr + "Z";
  }
  const diff = Date.now() - new Date(formattedString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m}p`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMessageNotification = (n) => {
    if (!n) return false;
    const type = String(n.type || "").toLowerCase();
    const content = String(n.content || n.message || "").toLowerCase();
    return (
      type.includes("chat") ||
      type.includes("message") ||
      type.includes("msg") ||
      type.includes("inbox") ||
      type.includes("tin_nhan") ||
      content.includes("đã gửi tin nhắn") ||
      content.includes("gửi tin nhắn") ||
      content.includes("nhắn tin")
    );
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    try {
      const res = await notificationService.getUserNotifications(currentUserId);
      const raw = res.data?.content || res.data || [];
      const interactionsOnly = raw.filter((n) => !isMessageNotification(n));
      setNotifications(interactionsOnly);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
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

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    if (n.postId || n.post?.id) {
      navigate(`/posts/${n.postId || n.post?.id}`);
    } else if (n.sender?.id) {
      navigate(`/profile/${n.sender?.id}`);
    }
  };

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800 shrink-0">
        <span className="font-extrabold text-lg text-stone-900 dark:text-stone-100">
          Thông báo
        </span>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: "#E8650A" }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-900">
        {loading ? (
          <div className="p-12 text-center flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center gap-3">
            <Bell className="w-10 h-10 stroke-[1.25] text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              Chưa có thông báo nào
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Khi ai đó thích, bình luận hoặc gửi lời mời kết bạn, bạn sẽ thấy thông báo ở đây.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const sender = n.sender || {};
            const senderName = sender.fullName || sender.username || "Hệ thống";

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 flex items-start gap-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition cursor-pointer ${
                  !n.read ? "bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                }`}
              >
                {/* Avatar / Icon */}
                <div className="relative shrink-0">
                  {sender.avatarUrl ? (
                    <img
                      src={sender.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                      style={{ backgroundColor: sender.avatarColor || "#4f46e5" }}
                    >
                      {getInitials(senderName)}
                    </div>
                  )}
                  {!n.read && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                      {senderName}
                    </span>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 leading-relaxed break-words">
                    {n.message || n.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
