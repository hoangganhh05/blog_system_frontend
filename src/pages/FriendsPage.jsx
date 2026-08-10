import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function FriendsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'requests', 'suggestions', 'friends'
  const [sentRequests, setSentRequests] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blog_sent_friend_requests") || "[]");
    } catch {
      return [];
    }
  });
  const [acceptedFriends, setAcceptedFriends] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("blog_accepted_friends") || "[]");
    } catch {
      return [];
    }
  });
  const [removedSuggestions, setRemovedSuggestions] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      const users = res.data || [];
      // Lọc bỏ chính mình
      const otherUsers = users.filter((u) => u.id !== currentUser?.id);
      setAllUsers(otherUsers);
    } catch {
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = (userId) => {
    const updated = [...sentRequests, userId];
    setSentRequests(updated);
    localStorage.setItem("blog_sent_friend_requests", JSON.stringify(updated));
  };

  const handleAcceptRequest = (userId) => {
    const updatedFriends = [...acceptedFriends, userId];
    setAcceptedFriends(updatedFriends);
    localStorage.setItem("blog_accepted_friends", JSON.stringify(updatedFriends));
  };

  const handleRemoveSuggestion = (userId) => {
    setRemovedSuggestions((prev) => [...prev, userId]);
  };

  // Danh sách gợi ý kết bạn (những người chưa kết bạn và chưa gửi lời mời)
  const suggestions = allUsers.filter(
    (u) =>
      !sentRequests.includes(u.id) &&
      !acceptedFriends.includes(u.id) &&
      !removedSuggestions.includes(u.id)
  );

  // Danh sách bạn bè đã kết bạn
  const friendsList = allUsers.filter((u) => acceptedFriends.includes(u.id));

  // Giả lập 2 lời mời kết bạn ban đầu nếu có danh sách người dùng
  const requests = allUsers.filter(
    (u) => !acceptedFriends.includes(u.id) && !sentRequests.includes(u.id)
  ).slice(0, 2);

  return (
    <div className="app-layout" style={{ background: "var(--bg-secondary)", minHeight: "100vh", display: "flex" }}>
      
      {/* 1. LEFT SIDEBAR MENU BẠN BÈ */}
      <div
        style={{
          width: 300,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          boxShadow: "2px 0 8px rgba(0,0,0,0.02)",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px 8px", color: "var(--text-primary)" }}>
          Bạn bè
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { id: "all", label: "Trang chủ bạn bè" },
            { id: "requests", label: `Lời mời kết bạn (${requests.length})` },
            { id: "suggestions", label: `Gợi ý kết bạn (${suggestions.length})` },
            { id: "friends", label: `Tất cả bạn bè (${friendsList.length})` },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--primary)" : "var(--text-primary)",
                  fontSize: 14.5,
                  transition: "all 0.15s",
                }}
              >
                {item.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN FRIENDS FEED AREA */}
      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
              Đang tải danh sách người dùng...
            </div>
          ) : (
            <>
              {/* PHẦN 1: LỜI MỜI KẾT BẠN */}
              {(activeTab === "all" || activeTab === "requests") && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                      Lời mời kết bạn ({requests.length})
                    </h3>
                    {activeTab === "all" && requests.length > 0 && (
                      <span
                        onClick={() => setActiveTab("requests")}
                        style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
                      >
                        Xem tất cả
                      </span>
                    )}
                  </div>

                  {requests.length === 0 ? (
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Không có lời mời kết bạn nào.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                      {requests.map((u) => {
                        const isAccepted = acceptedFriends.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            className="card"
                            style={{
                              borderRadius: 16,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              border: "1px solid var(--border-light)",
                            }}
                          >
                            <div
                              onClick={() => navigate(`/profile/${u.id}`)}
                              style={{ height: 160, background: "var(--bg-input)", cursor: "pointer", position: "relative" }}
                            >
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 32,
                                    fontWeight: 800,
                                    background: u.avatarColor
                                      ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)`
                                      : "var(--primary-light)",
                                    color: "var(--primary)",
                                  }}
                                >
                                  {getInitials(u.fullName || u.username)}
                                </div>
                              )}
                            </div>

                            <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                              <div
                                onClick={() => navigate(`/profile/${u.id}`)}
                                style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", cursor: "pointer", marginBottom: 2 }}
                              >
                                {u.fullName || u.username}
                              </div>
                              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
                                1 bạn chung
                              </div>

                              {isAccepted ? (
                                <div style={{ fontSize: 13, fontWeight: 700, color: "#10b981", textAlign: "center", padding: "6px 0" }}>
                                  Đã trở thành bạn bè
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                                  <button
                                    onClick={() => handleAcceptRequest(u.id)}
                                    className="btn btn-primary btn-sm"
                                    style={{ borderRadius: 8, fontWeight: 700 }}
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSuggestion(u.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderRadius: 8 }}
                                  >
                                    Xóa
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 2: NHỮNG NGƯỜI BẠN CÓ THỂ BIẾT (GỢI Ý KẾT BẠN) */}
              {(activeTab === "all" || activeTab === "suggestions") && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                      Những người bạn có thể biết ({suggestions.length})
                    </h3>
                    {activeTab === "all" && suggestions.length > 0 && (
                      <span
                        onClick={() => setActiveTab("suggestions")}
                        style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}
                      >
                        Xem tất cả
                      </span>
                    )}
                  </div>

                  {suggestions.length === 0 ? (
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Không còn gợi ý kết bạn nào.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                      {suggestions.map((u) => {
                        const isSent = sentRequests.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            className="card"
                            style={{
                              borderRadius: 16,
                              overflow: "hidden",
                              display: "flex",
                              flexDirection: "column",
                              border: "1px solid var(--border-light)",
                            }}
                          >
                            <div
                              onClick={() => navigate(`/profile/${u.id}`)}
                              style={{ height: 160, background: "var(--bg-input)", cursor: "pointer" }}
                            >
                              {u.avatarUrl ? (
                                <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <div
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 32,
                                    fontWeight: 800,
                                    background: u.avatarColor
                                      ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)`
                                      : "var(--bg-hover)",
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {getInitials(u.fullName || u.username)}
                                </div>
                              )}
                            </div>

                            <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                              <div
                                onClick={() => navigate(`/profile/${u.id}`)}
                                style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", cursor: "pointer", marginBottom: 2 }}
                              >
                                {u.fullName || u.username}
                              </div>
                              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 12 }}>
                                Gợi ý cho bạn • Gần bạn
                              </div>

                              {isSent ? (
                                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", textAlign: "center", padding: "6px 0" }}>
                                  Đã gửi lời mời
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                                  <button
                                    onClick={() => handleSendRequest(u.id)}
                                    className="btn btn-primary btn-sm"
                                    style={{ borderRadius: 8, fontWeight: 700 }}
                                  >
                                    Thêm bạn bè
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSuggestion(u.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderRadius: 8 }}
                                  >
                                    Gỡ
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 3: TẤT CẢ BẠN BÈ ĐÃ KẾT BẠN */}
              {(activeTab === "all" || activeTab === "friends") && (
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
                    Tất cả bạn bè ({friendsList.length})
                  </h3>

                  {friendsList.length === 0 ? (
                    <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Bạn chưa kết bạn với ai. Hãy thêm bạn bè từ danh sách gợi ý ở trên!
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                      {friendsList.map((friend) => (
                        <div
                          key={friend.id}
                          className="card"
                          style={{
                            padding: 14,
                            borderRadius: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: "1px solid var(--border-light)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {friend.avatarUrl ? (
                              <img src={friend.avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                            ) : (
                              <div className="avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                                {getInitials(friend.fullName || friend.username)}
                              </div>
                            )}
                            <div>
                              <div
                                onClick={() => navigate(`/profile/${friend.id}`)}
                                style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", cursor: "pointer" }}
                              >
                                {friend.fullName || friend.username}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                @{friend.username}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent("open_chat_user", { detail: { friend } }))}
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 10, fontWeight: 700, padding: "6px 14px" }}
                          >
                            Nhắn tin
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;
