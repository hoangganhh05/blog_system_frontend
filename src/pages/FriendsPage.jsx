import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Lấy danh sách quan hệ bạn bè 2 chiều từ localStorage
function getMutualFriendsMap() {
  try {
    return JSON.parse(
      localStorage.getItem("blog_mutual_friends_pairs") || "[]",
    );
  } catch {
    return [];
  }
}

// Lưu quan hệ bạn bè 2 chiều
function addMutualFriendPair(userId1, userId2) {
  try {
    const pairs = getMutualFriendsMap();
    const exists = pairs.some(
      (p) =>
        (p.u1 === userId1 && p.u2 === userId2) ||
        (p.u1 === userId2 && p.u2 === userId1),
    );
    if (!exists) {
      pairs.push({ u1: userId1, u2: userId2, createdAt: Date.now() });
      localStorage.setItem("blog_mutual_friends_pairs", JSON.stringify(pairs));
    }
  } catch {}
}

// Lấy danh sách lời mời kết bạn đang chờ xử lý
function getPendingRequests() {
  try {
    return JSON.parse(
      localStorage.getItem("blog_pending_friend_requests") || "[]",
    );
  } catch {
    return [];
  }
}

// Gửi lời mời kết bạn từ currentUserId tới targetUserId
function sendFriendRequestStore(fromId, toId) {
  try {
    const reqs = getPendingRequests();
    const exists = reqs.some((r) => r.fromId === fromId && r.toId === toId);
    if (!exists) {
      reqs.push({ fromId, toId, createdAt: Date.now() });
      localStorage.setItem(
        "blog_pending_friend_requests",
        JSON.stringify(reqs),
      );
    }
  } catch {}
}

// Xóa lời mời kết bạn đang chờ
function removePendingRequest(fromId, toId) {
  try {
    const reqs = getPendingRequests();
    const updated = reqs.filter(
      (r) => !(r.fromId === fromId && r.toId === toId),
    );
    localStorage.setItem(
      "blog_pending_friend_requests",
      JSON.stringify(updated),
    );
  } catch {}
}

function FriendsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'requests', 'suggestions', 'friends'
  const [removedSuggestions, setRemovedSuggestions] = useState([]);

  // State theo dõi các thay đổi thực tế
  const [refreshKey, setRefreshKey] = useState(0);

  const myId = String(currentUser?.id || currentUser?.userId || "");
  const myUsername = (currentUser?.username || "").toLowerCase();

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAll();
      const users = res.data || [];
      // Lọc bỏ chính mình tuyệt đối 100% (cả id và username)
      const otherUsers = users.filter((u) => {
        const uId = String(u.id);
        const uName = (u.username || "").toLowerCase();
        return uId !== myId && uName !== myUsername && uId !== "undefined";
      });
      setAllUsers(otherUsers);
    } catch {
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Lời mời kết bạn THỰC TẾ gửi ĐẾN myId (những người đã ấn Thêm bạn bè với mình)
  const pendingRequestsList = getPendingRequests();
  const incomingRequestUserIds = pendingRequestsList
    .filter((r) => String(r.toId) === myId)
    .map((r) => String(r.fromId));

  const incomingRequests = allUsers.filter((u) =>
    incomingRequestUserIds.includes(String(u.id)),
  );

  // Lời mời do CHÍNH myId ĐÃ GỬI Đi
  const outgoingSentUserIds = pendingRequestsList
    .filter((r) => String(r.fromId) === myId)
    .map((r) => String(r.toId));

  // Danh sách Bạn bè 2 CHIỀU THỰC TẾ (UserA <-> UserB)
  const pairs = getMutualFriendsMap();
  const myFriendIds = pairs
    .filter((p) => String(p.u1) === myId || String(p.u2) === myId)
    .map((p) => (String(p.u1) === myId ? String(p.u2) : String(p.u1)));

  const friendsList = allUsers.filter((u) =>
    myFriendIds.includes(String(u.id)),
  );

  // Danh sách Gợi ý kết bạn (chưa là bạn bè 2 chiều, chưa gửi lời mời, chưa bị gỡ)
  const suggestions = allUsers.filter(
    (u) =>
      !myFriendIds.includes(String(u.id)) &&
      !incomingRequestUserIds.includes(String(u.id)) &&
      !outgoingSentUserIds.includes(String(u.id)) &&
      !removedSuggestions.includes(String(u.id)),
  );

  // 1. Gửi lời mời kết bạn
  const handleSendRequest = (targetUserId) => {
    sendFriendRequestStore(myId, String(targetUserId));
    setRefreshKey((v) => v + 1);
  };

  // 2. Chấp nhận lời mời kết bạn (TẠO BẠN BÈ 2 CHIỀU THỰC TẾ)
  const handleAcceptRequest = (fromUserId) => {
    // Thêm quan hệ bạn bè 2 chiều
    addMutualFriendPair(myId, String(fromUserId));
    // Xóa khỏi danh sách lời mời chờ
    removePendingRequest(String(fromUserId), myId);
    setRefreshKey((v) => v + 1);
  };

  // 3. Xóa/Từ chối lời mời kết bạn
  const handleDeclineRequest = (fromUserId) => {
    removePendingRequest(String(fromUserId), myId);
    setRefreshKey((v) => v + 1);
  };

  // 4. Gỡ gợi ý kết bạn
  const handleRemoveSuggestion = (userId) => {
    setRemovedSuggestions((prev) => [...prev, userId]);
  };

  return (
    <div
      className="app-layout"
      style={{
        background: "var(--bg-secondary)",
        minHeight: "100vh",
        display: "flex",
      }}
    >
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
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: "0 0 20px 8px",
            color: "var(--text-primary)",
          }}
        >
          Bạn bè
        </h2>

        <div
          style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}
        >
          {[
            { id: "all", label: "Trang chủ bạn bè" },
            {
              id: "requests",
              label: `Lời mời kết bạn (${incomingRequests.length})`,
            },
            {
              id: "suggestions",
              label: `Gợi ý kết bạn (${suggestions.length})`,
            },
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
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              Đang tải danh sách người dùng...
            </div>
          ) : (
            <>
              {/* PHẦN 1: LỜI MỜI KẾT BẠN (CHỈ CHỈ HIỆN KHI CÓ NGƯỜI THỰC TẾ GỬI) */}
              {(activeTab === "all" || activeTab === "requests") && (
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      Lời mời kết bạn ({incomingRequests.length})
                    </h3>
                    {activeTab === "all" && incomingRequests.length > 0 && (
                      <span
                        onClick={() => setActiveTab("requests")}
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--primary)",
                          cursor: "pointer",
                        }}
                      >
                        Xem tất cả
                      </span>
                    )}
                  </div>

                  {incomingRequests.length === 0 ? (
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        background: "var(--bg-card)",
                        padding: 16,
                        borderRadius: 12,
                      }}
                    >
                      Không có lời mời kết bạn nào đang chờ xử lý.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {incomingRequests.map((u) => (
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
                            style={{
                              height: 160,
                              background: "var(--bg-input)",
                              cursor: "pointer",
                            }}
                          >
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt=""
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
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

                          <div
                            style={{
                              padding: 12,
                              display: "flex",
                              flexDirection: "column",
                              flex: 1,
                            }}
                          >
                            <div
                              onClick={() => navigate(`/profile/${u.id}`)}
                              style={{
                                fontWeight: 700,
                                fontSize: 15,
                                color: "var(--text-primary)",
                                cursor: "pointer",
                                marginBottom: 2,
                              }}
                            >
                              {u.fullName || u.username}
                            </div>
                            <div
                              style={{
                                fontSize: 12.5,
                                color: "var(--text-muted)",
                                marginBottom: 12,
                              }}
                            >
                              Đã gửi lời mời kết bạn
                            </div>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                marginTop: "auto",
                              }}
                            >
                              <button
                                onClick={() => handleAcceptRequest(u.id)}
                                className="btn btn-primary btn-sm"
                                style={{ borderRadius: 8, fontWeight: 700 }}
                              >
                                Chấp nhận
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(u.id)}
                                className="btn btn-secondary btn-sm"
                                style={{ borderRadius: 8 }}
                              >
                                Xóa lời mời
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 2: NHỮNG NGƯỜI BẠN CÓ THỂ BIẾT (GỢI Ý KẾT BẠN) */}
              {(activeTab === "all" || activeTab === "suggestions") && (
                <div style={{ marginBottom: 32 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        margin: 0,
                        color: "var(--text-primary)",
                      }}
                    >
                      Những người bạn có thể biết ({suggestions.length})
                    </h3>
                    {activeTab === "all" && suggestions.length > 0 && (
                      <span
                        onClick={() => setActiveTab("suggestions")}
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--primary)",
                          cursor: "pointer",
                        }}
                      >
                        Xem tất cả
                      </span>
                    )}
                  </div>

                  {suggestions.length === 0 ? (
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        background: "var(--bg-card)",
                        padding: 16,
                        borderRadius: 12,
                      }}
                    >
                      Không còn gợi ý kết bạn nào.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {suggestions.map((u) => {
                        const isSent = outgoingSentUserIds.includes(u.id);
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
                              style={{
                                height: 160,
                                background: "var(--bg-input)",
                                cursor: "pointer",
                              }}
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
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

                            <div
                              style={{
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                flex: 1,
                              }}
                            >
                              <div
                                onClick={() => navigate(`/profile/${u.id}`)}
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  color: "var(--text-primary)",
                                  cursor: "pointer",
                                  marginBottom: 2,
                                }}
                              >
                                {u.fullName || u.username}
                              </div>
                              <div
                                style={{
                                  fontSize: 12.5,
                                  color: "var(--text-muted)",
                                  marginBottom: 12,
                                }}
                              >
                                Gợi ý cho bạn • Gần bạn
                              </div>

                              {isSent ? (
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--primary)",
                                    textAlign: "center",
                                    padding: "6px 0",
                                  }}
                                >
                                  Đã gửi lời mời
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    marginTop: "auto",
                                  }}
                                >
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

              {/* PHẦN 3: TẤT CẢ BẠN BÈ ĐÃ KẾT BẠN (BẠN BÈ 2 CHIỀU THỰC TẾ) */}
              {(activeTab === "all" || activeTab === "friends") && (
                <div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      margin: "0 0 16px 0",
                      color: "var(--text-primary)",
                    }}
                  >
                    Tất cả bạn bè ({friendsList.length})
                  </h3>

                  {friendsList.length === 0 ? (
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        background: "var(--bg-card)",
                        padding: 16,
                        borderRadius: 12,
                      }}
                    >
                      Bạn chưa kết bạn với ai. Hãy bấm "Thêm bạn bè" từ danh
                      sách gợi ý để kết bạn!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: 14,
                      }}
                    >
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt=""
                                style={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="avatar"
                                style={{ width: 48, height: 48, fontSize: 16 }}
                              >
                                {getInitials(
                                  friend.fullName || friend.username,
                                )}
                              </div>
                            )}
                            <div>
                              <div
                                onClick={() =>
                                  navigate(`/profile/${friend.id}`)
                                }
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  color: "var(--text-primary)",
                                  cursor: "pointer",
                                }}
                              >
                                {friend.fullName || friend.username}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#10b981",
                                  fontWeight: 600,
                                }}
                              >
                                Bạn bè
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("open_chat_user", {
                                  detail: { friend },
                                }),
                              )
                            }
                            className="btn btn-secondary btn-sm"
                            style={{
                              borderRadius: 10,
                              fontWeight: 700,
                              padding: "6px 14px",
                            }}
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
