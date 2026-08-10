import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import friendService from "../services/friendService";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Lấy danh sách quan hệ bạn bè từ localStorage
function getMutualFriendsMap() {
  try {
    return JSON.parse(
      localStorage.getItem("blog_mutual_friends_pairs") || "[]"
    );
  } catch {
    return [];
  }
}

// Lưu quan hệ bạn bè
function addMutualFriendPair(userId1, userId2) {
  try {
    const pairs = getMutualFriendsMap();
    const exists = pairs.some(
      (p) =>
        (String(p.u1) === String(userId1) && String(p.u2) === String(userId2)) ||
        (String(p.u1) === String(userId2) && String(p.u2) === String(userId1))
    );
    if (!exists) {
      pairs.push({ u1: String(userId1), u2: String(userId2), createdAt: Date.now() });
      localStorage.setItem("blog_mutual_friends_pairs", JSON.stringify(pairs));
    }
  } catch {}
}

// Lấy danh sách lời mời kết bạn đang chờ xử lý
function getPendingRequests() {
  try {
    return JSON.parse(
      localStorage.getItem("blog_pending_friend_requests") || "[]"
    );
  } catch {
    return [];
  }
}

// Gửi lời mời kết bạn từ fromId tới toId
function sendFriendRequestStore(fromId, toId) {
  try {
    const reqs = getPendingRequests();
    const exists = reqs.some(
      (r) => String(r.fromId) === String(fromId) && String(r.toId) === String(toId)
    );
    if (!exists) {
      reqs.push({ fromId: String(fromId), toId: String(toId), createdAt: Date.now() });
      localStorage.setItem(
        "blog_pending_friend_requests",
        JSON.stringify(reqs)
      );
    }
  } catch {}
}

// Xóa/Hủy lời mời kết bạn đang chờ
function removePendingRequest(fromId, toId) {
  try {
    const reqs = getPendingRequests();
    const updated = reqs.filter(
      (r) => !(String(r.fromId) === String(fromId) && String(r.toId) === String(toId))
    );
    localStorage.setItem(
      "blog_pending_friend_requests",
      JSON.stringify(updated)
    );
  } catch {}
}

function FriendsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [apiFriends, setApiFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'requests', 'sent', 'suggestions', 'friends'
  const [removedSuggestions, setRemovedSuggestions] = useState([]);

  // State trigger re-render khi thao tác
  const [, setRefreshKey] = useState(0);

  const myId = String(currentUser?.id || currentUser?.userId || "");
  const myUsername = (currentUser?.username || "").toLowerCase();

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [resUsers, resFriends] = await Promise.all([
        userService.getAll().catch(() => ({ data: [] })),
        myId ? friendService.getFriendsList(myId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      const users = resUsers.data || [];
      const friendsData = resFriends.data || [];
      const backendFriends = friendsData.map((f) => f.friend || f.user || f).filter(Boolean);

      setApiFriends(backendFriends);

      // Lọc bỏ chính mình tuyệt đối 100% (cả ID lẫn Username)
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

  const [searchQuery, setSearchQuery] = useState("");

  // 1. Lời mời nhận được THỰC TẾ (Người khác gửi đến mình)
  const pendingRequestsList = getPendingRequests();
  const incomingRequestUserIds = pendingRequestsList
    .filter((r) => String(r.toId) === myId)
    .map((r) => String(r.fromId));

  // 2. Lời mời do CHÍNH MÌNH ĐÃ GỬI ĐI
  const outgoingSentUserIds = pendingRequestsList
    .filter((r) => String(r.fromId) === myId)
    .map((r) => String(r.toId));

  // 3. Danh sách Bạn bè THỰC TẾ (Hợp nhất Backend API + LocalStorage Pairs)
  const pairs = getMutualFriendsMap();
  const localFriendIds = pairs
    .filter((p) => String(p.u1) === myId || String(p.u2) === myId)
    .map((p) => (String(p.u1) === myId ? String(p.u2) : String(p.u1)));

  const apiFriendIds = apiFriends.map((f) => String(f.id || f.userId));
  const allFriendIdSet = new Set([...localFriendIds, ...apiFriendIds]);
  const allFriendUsernameSet = new Set(
    apiFriends.map((f) => (f.username || "").toLowerCase()).filter(Boolean)
  );

  // Hàm kiểm tra 1 user đã là bạn bè chưa (so sánh cả ID và Username)
  const isUserFriend = (u) => {
    const uId = String(u.id);
    const uName = (u.username || "").toLowerCase();
    return allFriendIdSet.has(uId) || (uName && allFriendUsernameSet.has(uName));
  };

  // LỌC SẠCH TỰ ĐỘNG: Nếu đã là bạn bè -> Biến mất hoàn toàn khỏi Lời mời đã gửi & Lời mời nhận được
  const cleanIncomingRequestIds = incomingRequestUserIds.filter((id) => !allFriendIdSet.has(id));
  const cleanOutgoingSentIds = outgoingSentUserIds.filter((id) => !allFriendIdSet.has(id));

  // Bộ lọc tìm kiếm bạn bè theo tên / username
  const filterByName = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((u) =>
      (u.fullName || u.username || "").toLowerCase().includes(q)
    );
  };

  const incomingRequests = filterByName(
    allUsers.filter((u) => cleanIncomingRequestIds.includes(String(u.id)) && !isUserFriend(u))
  );

  const outgoingSentUsers = filterByName(
    allUsers.filter((u) => cleanOutgoingSentIds.includes(String(u.id)) && !isUserFriend(u))
  );

  // Danh sách Bạn Bè: Hiển thị đầy đủ tất cả những ai đã là bạn bè
  const friendsList = filterByName(
    allUsers.filter((u) => isUserFriend(u))
  );

  // Gợi ý kết bạn: KHÔNG CHỨA BẠN BÈ, KHÔNG CHỨA LỜI MỜI ĐÃ GỬI / NHẬN
  const suggestions = filterByName(
    allUsers.filter(
      (u) =>
        !isUserFriend(u) &&
        !cleanIncomingRequestIds.includes(String(u.id)) &&
        !cleanOutgoingSentIds.includes(String(u.id)) &&
        !removedSuggestions.includes(String(u.id))
    )
  );

  // Thao tác 1: Gửi lời mời kết bạn đến ai đó
  const handleSendRequest = (targetUserId) => {
    sendFriendRequestStore(myId, targetUserId);
    setRefreshKey((v) => v + 1);
  };

  // Thao tác 2: Hủy lời mời kết bạn đã gửi đi
  const handleCancelSentRequest = (targetUserId) => {
    removePendingRequest(myId, targetUserId);
    setRefreshKey((v) => v + 1);
  };

  // Thao tác 3: Chấp nhận lời mời kết bạn nhận được từ ai đó
  const handleAcceptRequest = (fromUserId) => {
    addMutualFriendPair(myId, fromUserId);
    removePendingRequest(fromUserId, myId);
    setRefreshKey((v) => v + 1);
  };

  // Thao tác 4: Từ chối / Xóa lời mời kết bạn nhận được
  const handleDeclineRequest = (fromUserId) => {
    removePendingRequest(fromUserId, myId);
    setRefreshKey((v) => v + 1);
  };

  // Thao tác 5: Gỡ gợi ý kết bạn
  const handleRemoveSuggestion = (userId) => {
    setRemovedSuggestions((prev) => [...prev, String(userId)]);
  };

  return (
    <div className="app-layout page-with-sidebar">
      {/* 1. LEFT SIDEBAR MENU BẠN BÈ */}
      <div className="page-sidebar-menu">
        <h2 className="page-sidebar-title">
          Bạn bè
        </h2>

        <div className="page-sidebar-nav">
          {[
            { id: "all", label: "Trang chủ bạn bè", icon: "🤝" },
            { id: "requests", label: `Lời mời kết bạn (${incomingRequests.length})`, icon: "📬" },
            { id: "sent", label: `Lời mời đã gửi (${outgoingSentUsers.length})`, icon: "📤" },
            { id: "suggestions", label: `Gợi ý kết bạn (${suggestions.length})`, icon: "💡" },
            { id: "friends", label: `Tất cả bạn bè (${friendsList.length})`, icon: "👥" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`page-sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isActive ? "var(--primary)" : "var(--bg-input)",
                      color: isActive ? "#ffffff" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN FRIENDS FEED AREA */}
      <div className="page-main-content">
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>
              Đang tải danh sách người dùng...
            </div>
          ) : (
            <>
              {/* PHẦN 1: LỜI MỜI KẾT BẠN NHẬN ĐƯỢC THỰC TẾ */}
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
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                              Đã gửi lời mời kết bạn cho bạn
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

              {/* PHẦN 2: LỜI MỜI CHÍNH MÌNH ĐÃ GỬI ĐI (CÓ THỂ HỦY LỜI MỜI) */}
              {(activeTab === "all" || activeTab === "sent") && outgoingSentUsers.length > 0 && (
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
                      Lời mời bạn đã gửi ({outgoingSentUsers.length})
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {outgoingSentUsers.map((u) => (
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
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                              color: "var(--primary)",
                              fontWeight: 600,
                              marginBottom: 12,
                            }}
                          >
                            Đã gửi lời mời kết bạn
                          </div>

                          <button
                            onClick={() => handleCancelSentRequest(u.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 8, marginTop: "auto" }}
                          >
                            Hủy lời mời
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PHẦN 3: NHỮNG NGƯỜI BẠN CÓ THỂ BIẾT (GỢI Ý KẾT BẠN) */}
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
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 16,
                      }}
                    >
                      {suggestions.map((u) => (
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
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN 4: TẤT CẢ BẠN BÈ ĐÃ KẾT BẠN */}
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
                      Bạn chưa có bạn bè nào. Hãy bấm "Thêm bạn bè" từ danh sách gợi ý để kết bạn!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
                                {getInitials(friend.fullName || friend.username)}
                              </div>
                            )}
                            <div>
                              <div
                                onClick={() => navigate(`/profile/${friend.id}`)}
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
                                Bạn bè 🟢
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("open_chat_user", {
                                  detail: { friend },
                                })
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
