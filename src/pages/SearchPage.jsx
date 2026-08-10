import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import userService from "../services/userService";
import postService from "../services/postService";
import friendService from "../services/friendService";
import PostCard from "../components/PostCard";
import { isVideoUrl } from "../utils/mediaUtils";
import { useAuth } from "../context/AuthContext";

function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function matchesQuery(text, query) {
  if (!text || !query) return false;
  const normalizedText = removeVietnameseTones(text);
  const normalizedQuery = removeVietnameseTones(query.trim());
  return normalizedText.includes(normalizedQuery);
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser ? (currentUser.id || currentUser.userId) : null;

  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchInputVal, setSearchInputVal] = useState(query);

  useEffect(() => {
    setSearchInputVal(query);
  }, [query]);

  // Load all users, posts, and friend statuses
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, postsRes] = await Promise.all([
          userService.getAll().catch(() => ({ data: [] })),
          postService.getAll(0, 200).catch(() => ({ data: { content: [] } })),
        ]);

        setUsers(usersRes.data || []);
        setPosts(postsRes.data?.content || postsRes.data || []);

        if (currentUserId) {
          const fRes = await friendService.getFriendsList(currentUserId).catch(() => ({ data: [] }));
          const rawFriends = fRes.data || [];
          setFriendsList(rawFriends.map((f) => String(f.friend?.id || f.user?.id || f.id)));
        }
      } catch (err) {
        console.error("Lỗi tải kết quả tìm kiếm:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUserId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInputVal.trim()) {
      setSearchParams({ q: searchInputVal.trim() });
    }
  };

  // Filter matched results
  const matchedUsers = users.filter(
    (u) =>
      matchesQuery(u.fullName, query) ||
      matchesQuery(u.username, query) ||
      matchesQuery(u.email, query)
  );

  const matchedPosts = posts.filter(
    (p) =>
      matchesQuery(p.title, query) ||
      matchesQuery(p.content, query) ||
      matchesQuery(p.category?.name, query) ||
      matchesQuery(p.user?.fullName || p.user?.username, query)
  );

  const matchedVideos = posts.filter(
    (p) =>
      p.thumbNail &&
      isVideoUrl(p.thumbNail) &&
      (matchesQuery(p.title, query) ||
        matchesQuery(p.content, query) ||
        matchesQuery(p.user?.fullName || p.user?.username, query))
  );

  const isUserFriend = (userId) => friendsList.includes(String(userId));
  const isRequestSent = (userId) => sentRequests.includes(String(userId));

  const handleSendFriendRequest = async (targetId) => {
    if (!currentUserId) {
      alert("Vui lòng đăng nhập để gửi lời mời kết bạn!");
      return;
    }
    try {
      await friendService.sendFriendRequest(currentUserId, targetId);
      setSentRequests((prev) => [...prev, String(targetId)]);
    } catch {
      setSentRequests((prev) => [...prev, String(targetId)]);
    }
  };

  return (
    <div className="app-layout page-with-sidebar">
      {/* LEFT SIDEBAR FILTERS - FACEBOOK DESKTOP STYLE */}
      <div className="page-sidebar-menu">
        <h2 className="page-sidebar-title">
          Kết quả tìm kiếm
        </h2>

        {/* Dynamic Search Input inside Sidebar */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchInputVal}
              onChange={(e) => setSearchInputVal(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: 20,
                border: "1px solid var(--border-light)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: 14,
                boxSizing: "border-box",
                fontWeight: 500,
              }}
            />
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", opacity: 0.6, fontSize: 14 }}>
              🔍
            </span>
          </div>
        </form>

        <div className="page-sidebar-nav">
          {[
            { id: "all", label: "Tất cả", icon: "🌐" },
            { id: "users", label: `Mọi người (${matchedUsers.length})`, icon: "👥" },
            { id: "posts", label: `Bài viết (${matchedPosts.length})`, icon: "📝" },
            { id: "videos", label: `Video (${matchedVideos.length})`, icon: "🎬" },
          ].map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`page-sidebar-nav-item ${activeTab === tab.id ? "active" : ""}`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN SEARCH RESULTS AREA */}
      <div className="page-main-content">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          
          {/* Header Banner */}
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 18,
              padding: "20px 24px",
              marginBottom: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              border: "1px solid var(--border-light)",
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              Kết quả tìm kiếm cho: <span style={{ color: "var(--primary)" }}>"{query}"</span>
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6, margin: 0 }}>
              Hiển thị {matchedUsers.length} tài khoản, {matchedPosts.length} bài viết và {matchedVideos.length} video liên quan.
            </p>
          </div>

          {loading ? (
            <div className="card" style={{ padding: 60, textAlign: "center", color: "var(--text-muted)", borderRadius: 18 }}>
              ⏳ Đang tìm kiếm dữ liệu...
            </div>
          ) : (
            <>
              {/* TAB 1: MỌI NGƯỜI */}
              {(activeTab === "all" || activeTab === "users") && matchedUsers.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: 20,
                    borderRadius: 18,
                    marginBottom: 20,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                      👥 Mọi người
                    </h3>
                    {activeTab === "all" && matchedUsers.length > 3 && (
                      <span
                        onClick={() => setActiveTab("users")}
                        style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", cursor: "pointer" }}
                      >
                        Xem tất cả ({matchedUsers.length})
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(activeTab === "all" ? matchedUsers.slice(0, 3) : matchedUsers).map((u) => {
                      const name = u.fullName || u.username;
                      const isFriend = isUserFriend(u.id);
                      const isSent = isRequestSent(u.id);
                      const isSelf = String(u.id) === String(currentUserId);

                      return (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 14,
                            background: "var(--bg-input)",
                            border: "1px solid var(--border-light)",
                            transition: "all 0.15s",
                          }}
                        >
                          <div
                            onClick={() => navigate(`/profile/${u.id}`)}
                            style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", flex: 1 }}
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={name} className="avatar avatar-md" style={{ width: 48, height: 48, objectFit: "cover" }} />
                            ) : (
                              <div className="avatar avatar-md" style={{ width: 48, height: 48, fontSize: 16, background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                                {getInitials(name)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{name}</div>
                              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>@{u.username}</div>
                            </div>
                          </div>

                          {!isSelf && (
                            <div>
                              {isFriend ? (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => navigate(`/profile/${u.id}`)}
                                  style={{ borderRadius: 10, padding: "6px 14px", fontWeight: 700 }}
                                >
                                  ✓ Bạn bè
                                </button>
                              ) : isSent ? (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  disabled
                                  style={{ opacity: 0.7, borderRadius: 10, padding: "6px 14px" }}
                                >
                                  Đã gửi lời mời
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleSendFriendRequest(u.id)}
                                  style={{ borderRadius: 10, padding: "6px 14px", fontWeight: 700 }}
                                >
                                  + Thêm bạn
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB VIDEO */}
              {(activeTab === "all" || activeTab === "videos") && matchedVideos.length > 0 && (
                <div
                  className="card"
                  style={{
                    padding: 20,
                    borderRadius: 18,
                    marginBottom: 20,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                      🎬 Video ({matchedVideos.length})
                    </h3>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                    {(activeTab === "all" ? matchedVideos.slice(0, 2) : matchedVideos).map((v) => (
                      <div
                        key={v.id}
                        style={{
                          background: "var(--bg-input)",
                          borderRadius: 14,
                          overflow: "hidden",
                          border: "1px solid var(--border-light)",
                        }}
                      >
                        <video
                          src={v.thumbNail}
                          controls
                          playsInline
                          webkit-playsinline="true"
                          style={{ width: "100%", height: 180, objectFit: "cover", background: "#000" }}
                        />
                        <div style={{ padding: 12 }}>
                          <div
                            onClick={() => navigate(`/posts/${v.id}`)}
                            style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", cursor: "pointer" }}
                          >
                            {v.title || "Video bài viết"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                            {v.user?.fullName || v.user?.username}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB BÀI VIẾT */}
              {(activeTab === "all" || activeTab === "posts") && (
                <div>
                  {activeTab === "all" && matchedPosts.length > 0 && (
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 14px 4px", color: "var(--text-primary)" }}>
                      📝 Bài viết ({matchedPosts.length})
                    </h3>
                  )}

                  {matchedPosts.length === 0 && matchedUsers.length === 0 && matchedVideos.length === 0 ? (
                    <div className="card" style={{ padding: 50, textAlign: "center", color: "var(--text-muted)", borderRadius: 18 }}>
                      <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>
                        Không tìm thấy kết quả nào cho "{query}"
                      </h3>
                      <p style={{ fontSize: 13.5, margin: 0 }}>
                        Hãy thử kiểm tra lỗi chính tả hoặc tìm kiếm bằng từ khóa ngắn hơn!
                      </p>
                    </div>
                  ) : (
                    (activeTab === "all" ? matchedPosts : matchedPosts).map((post) => (
                      <PostCard key={post.id} post={post} style={{ marginBottom: 16 }} />
                    ))
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
