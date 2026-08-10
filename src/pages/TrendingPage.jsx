import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import postService from "../services/postService";
import userService from "../services/userService";
import categoryService from "../services/categoryService";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function TrendingPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("week"); // week, month, all

  useEffect(() => {
    setLoading(true);
    Promise.all([
      postService.getAll(),
      categoryService.getAll(),
      userService.getAll()
    ])
      .then(([postsRes, catRes, userRes]) => {
        const pList = postsRes.data || [];
        // Sắp xếp bài viết theo tổng lượt xem + tương tác
        const sorted = [...pList].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        setPosts(sorted);

        setCategories(catRes.data || []);

        // Tính Top Tác Giả dựa trên số bài viết
        const uList = userRes.data || [];
        const uWithCount = uList.map((u) => {
          const userPosts = pList.filter((p) => p.user?.id === u.id);
          const totalViews = userPosts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
          return {
            ...u,
            postCount: userPosts.length,
            totalViews
          };
        }).sort((a, b) => b.postCount - a.postCount || b.totalViews - a.totalViews);

        setTopUsers(uWithCount.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-layout trending-page">
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 16px" }}>
      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
          borderRadius: 24,
          padding: "32px 28px",
          color: "#fff",
          marginBottom: 32,
          boxShadow: "0 16px 36px rgba(245, 158, 11, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", opacity: 0.9, marginBottom: 4 }}>
            🔥 BlogViet Trends
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px 0" }}>
            Xu Hướng & Bảng Xếp Hạng
          </h1>
          <p style={{ margin: 0, opacity: 0.95, fontSize: 14, maxWidth: 500 }}>
            Khám phá những bài viết đang thu hút sự chú ý nhất và tôn vinh những tác giả xuất sắc trên BlogViet.
          </p>
        </div>

        {/* Filter Period Tabs */}
        <div style={{ display: "flex", gap: 8, background: "rgba(0,0,0,0.18)", padding: 6, borderRadius: 20 }}>
          {[
            { id: "week", label: "Tuần này ⚡" },
            { id: "month", label: "Tháng này 📅" },
            { id: "all", label: "Tất cả 🌟" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterPeriod(item.id)}
              style={{
                background: filterPeriod === item.id ? "#ffffff" : "transparent",
                color: filterPeriod === item.id ? "#d97706" : "#ffffff",
                border: "none",
                borderRadius: 14,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="trending-responsive-grid">
        {/* Main Column: Top Bài Viết Hot */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔥 Top Bài Viết Được Xem Nhiều Nhất</span>
          </h2>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
              Đang tải danh sách xu hướng...
            </div>
          ) : posts.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-state-icon">🔥</div>
              <h3>Chưa có bài viết xu hướng</h3>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {posts.slice(0, 10).map((post, index) => {
                const authorName = post.user?.fullName || post.user?.username || "Ẩn danh";
                const rankColor = index === 0 ? "#f59e0b" : index === 1 ? "#94a3b8" : index === 2 ? "#b45309" : "var(--text-muted)";
                const rankBadge = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

                return (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/posts/${post.id}`)}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-light)",
                      borderRadius: 18,
                      padding: 16,
                      display: "flex",
                      gap: 16,
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "transform 0.2s, boxShadow 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    {/* Rank Badge */}
                    <div style={{ fontSize: 22, fontWeight: 800, width: 36, textAlign: "center", color: rankColor }}>
                      {rankBadge}
                    </div>

                    {/* Thumbnail if any */}
                    {post.thumbNail && !post.bgColor && (
                      <img
                        src={post.thumbNail}
                        alt={post.title}
                        style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", flexShrink: 0 }}
                      />
                    )}

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)" }}>
                          {post.category?.name || "Chung"}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>•</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {authorName}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.title || post.content}
                      </h3>
                      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>👁️ {post.viewCount || 0} lượt xem</span>
                        <span>💬 {post.commentCount || 0} bình luận</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column: Top Tác Giả & Chủ Đề */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Top Tác Giả xuất sắc */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏆 Top Tác Giả Nổi Bật</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {topUsers.map((u, idx) => {
                const uName = u.fullName || u.username;
                const badge = idx === 0 ? "👑" : idx === 1 ? "🌟" : "✨";
                return (
                  <div
                    key={u.id}
                    onClick={() => navigate(`/profile/${u.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      padding: "6px 0"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={uName} className="avatar avatar-md" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="avatar avatar-md" style={{ background: u.avatarColor ? `linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}bb)` : undefined }}>
                          {getInitials(uName)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 4 }}>
                          {uName} <span>{badge}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                          {u.postCount} bài viết • {u.totalViews} lượt xem
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending Categories */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>🏷️ Danh Mục Hot</span>
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {categories.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary)",
                    borderRadius: 16,
                    padding: "6px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                  onClick={() => navigate(`/?category=${c.id}`)}
                >
                  📂 {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default TrendingPage;
