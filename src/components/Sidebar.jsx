import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import friendService from "../services/friendService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Sidebar({ categories, activeCategoryId, onSelectCategory }) {
  return (
    <aside>
      {/* Menu điều hướng */}
      <div className="sidebar-section">
        <div className="sidebar-title">Điều hướng</div>
        <button
          className={`sidebar-item ${!activeCategoryId ? "active" : ""}`}
          onClick={() => onSelectCategory(null)}
          style={{ width: "100%", textAlign: "left" }}
        >
          <div className="sidebar-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span>Tất cả bài viết</span>
        </button>

        <Link to="/saved" style={{ textDecoration: "none" }}>
          <button
            className="sidebar-item"
            style={{ width: "100%", textAlign: "left" }}
          >
            <div className="sidebar-item-icon" style={{ color: "var(--primary)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Bài viết đã lưu</span>
          </button>
        </Link>
      </div>

      {/* Danh mục */}
      <div className="sidebar-section">
        <div className="sidebar-title">Danh mục</div>
        {categories.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14, padding: "4px 8px" }}>
            Chưa có danh mục
          </p>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              className={`sidebar-item ${activeCategoryId === cat.id ? "active" : ""}`}
              onClick={() => onSelectCategory(cat.id)}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div className="sidebar-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span>{cat.name}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function SidebarRight({ trendingPosts }) {
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);

  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  useEffect(() => {
    if (currentUserId) {
      // Lấy lời mời kết bạn đang chờ
      friendService.getPendingRequests(currentUserId).then((res) => {
        setPendingRequests(res.data || []);
      }).catch(() => {});

      // Lấy danh sách bạn bè
      friendService.getFriendsList(currentUserId).then((res) => {
        setFriendsList(res.data || []);
      }).catch(() => {});
    }
  }, [currentUserId]);

  const handleAccept = (requesterId) => {
    friendService.acceptRequest(currentUserId, requesterId).then(() => {
      setPendingRequests((prev) => prev.filter((p) => p.requester.id !== requesterId));
      // Tải lại danh sách bạn bè
      friendService.getFriendsList(currentUserId).then((res) => setFriendsList(res.data || []));
    }).catch(() => {});
  };

  const handleReject = (requesterId) => {
    friendService.removeFriendship(currentUserId, requesterId).then(() => {
      setPendingRequests((prev) => prev.filter((p) => p.requester.id !== requesterId));
    }).catch(() => {});
  };

  return (
    <aside>
      {/* Lời mời kết bạn đang chờ */}
      {currentUser && pendingRequests.length > 0 && (
        <div className="sidebar-section" style={{ background: "rgba(24, 119, 242, 0.06)", border: "1px solid rgba(24, 119, 242, 0.2)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <div className="sidebar-title" style={{ color: "var(--primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>👥 Lời mời kết bạn ({pendingRequests.length})</span>
          </div>
          {pendingRequests.map((req) => {
            const sender = req.requester;
            const senderName = sender.fullName || sender.username;
            return (
              <div key={req.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0", borderBottom: "1px dashed var(--border-light)" }}>
                <Link to={`/profile/${sender.id}`} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
                  {sender.avatarUrl ? (
                    <img src={sender.avatarUrl} alt={senderName} className="avatar avatar-sm" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="avatar avatar-sm" style={{ background: sender.avatarColor ? `linear-gradient(135deg, ${sender.avatarColor}, ${sender.avatarColor}bb)` : undefined }}>
                      {getInitials(senderName)}
                    </div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{senderName}</span>
                </Link>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: "4px 8px", fontSize: 12 }} onClick={() => handleAccept(sender.id)}>
                    Chấp nhận
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, padding: "4px 8px", fontSize: 12 }} onClick={() => handleReject(sender.id)}>
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Danh sách Bạn bè */}
      {currentUser && (
        <div className="sidebar-section" style={{ marginBottom: 16 }}>
          <div className="sidebar-title">
            <span>🟢 Người liên hệ ({friendsList.length})</span>
          </div>
          {friendsList.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13, padding: "4px 8px" }}>
              Chưa có bạn bè nào. Đã đến lúc kết nối thêm bạn mới!
            </p>
          ) : (
            friendsList.map((friend) => {
              const name = friend.fullName || friend.username;
              return (
                <div
                  key={friend.id}
                  className="sidebar-item"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open_chat_user", { detail: { friend } }));
                  }}
                  style={{ gap: 10, padding: "6px 8px", cursor: "pointer", justifyContent: "space-between" }}
                  title={`Nhắn tin với ${name}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={name} className="avatar avatar-sm" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="avatar avatar-sm" style={{ background: friend.avatarColor ? `linear-gradient(135deg, ${friend.avatarColor}, ${friend.avatarColor}bb)` : undefined }}>
                          {getInitials(name)}
                        </div>
                      )}
                      <span style={{
                        position: "absolute", bottom: 0, right: 0,
                        width: 9, height: 9, borderRadius: "50%",
                        background: "#31a24c", border: "2px solid var(--bg-card)"
                      }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{name}</span>
                  </div>
                  <span style={{ fontSize: 14, color: "var(--primary)" }}>💬</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Bài viết mới nhất */}
      <div className="sidebar-section">
        <div className="sidebar-title">Bài viết mới nhất</div>
        {!trendingPosts || trendingPosts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14, padding: "4px 8px" }}>
            Chưa có bài viết
          </p>
        ) : (
          trendingPosts.slice(0, 5).map((post, i) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="sidebar-item"
              style={{ alignItems: "flex-start", gap: 10 }}
            >
              <div
                className="sidebar-item-icon"
                style={{
                  background: i === 0 ? "#1877f2" : "var(--bg-input)",
                  color: i === 0 ? "#fff" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {i + 1}
              </div>
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {post.title}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Giới thiệu */}
      {!currentUser && (
        <div className="sidebar-section">
          <div className="sidebar-title">Về BlogViet</div>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Nền tảng chia sẻ kiến thức và kinh nghiệm. Hãy đăng ký và bắt đầu chia sẻ ngay hôm nay!
          </p>
          <Link to="/register" style={{ display: "block", marginTop: 12 }}>
            <button className="btn btn-primary btn-full btn-sm">Đăng ký ngay</button>
          </Link>
        </div>
      )}
    </aside>
  );
}

export { SidebarRight };
export default Sidebar;

