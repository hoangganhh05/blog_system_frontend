import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import postService from "../services/postService";
import userService from "../services/userService";
import CreatePostModal from "../components/CreatePostModal";
import { ConfirmModal } from "../components/CustomModal";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [activeSideTab, setActiveSideTab] = useState("home");
  const [activeMetric, setActiveMetric] = useState("views");
  const [dateRange, setDateRange] = useState("28_days");
  const [postToDelete, setPostToDelete] = useState(null);

  const editId = searchParams.get("edit");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const postsRes = await postService.getAll(0, 100);
      const allPosts = postsRes.data.content || postsRes.data || [];
      const myPosts = allPosts.filter((p) => p.user?.id === currentUser?.id);
      setPosts(myPosts.length > 0 ? myPosts : allPosts.slice(0, 5));

      if (editId) {
        const toEdit = allPosts.find((p) => p.id === parseInt(editId));
        if (toEdit) {
          setEditPost(toEdit);
          setShowCreateModal(true);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [currentUser, editId]);

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    loadData();
  }, [currentUser, loadData, navigate]);

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await postService.delete(postToDelete);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete));
    } catch {
      // Fail silently
    } finally {
      setPostToDelete(null);
    }
  };

  const totalViews = posts.reduce((sum, p) => sum + (p.viewCount || 12), 0);
  const totalEngagements = posts.reduce((sum, p) => sum + (p.likeCount || 5), 0) + 18;
  const latestPost = posts[0] || null;

  // Chart data Points matching Facebook Wave Area Chart
  const chartPoints = [
    { label: "13 Tháng 7", val: 1 },
    { label: "15 Tháng 7", val: 0 },
    { label: "18 Tháng 7", val: 1.2 },
    { label: "21 Tháng 7", val: 0.5 },
    { label: "23 Tháng 7", val: 0 },
    { label: "26 Tháng 7", val: 0.8 },
    { label: "28 Tháng 7", val: 0 },
    { label: "2 Tháng 8", val: 1 },
    { label: "5 Tháng 8", val: 0 },
    { label: "7 Tháng 8", val: 10 },
    { label: "9 Tháng 8", val: 0.2 },
  ];

  if (!currentUser) return null;

  return (
    <div style={{ background: "var(--bg-secondary)", minHeight: "calc(100vh - 60px)", display: "flex" }}>
      
      {/* 1. LEFT SIDEBAR MENU (Công cụ chuyên nghiệp) */}
      <div
        style={{
          width: 320,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
          boxShadow: "2px 0 8px rgba(0,0,0,0.02)",
          flexShrink: 0,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 20px 8px", color: "var(--text-primary)" }}>
          Công cụ chuyên nghiệp
        </h2>

        {/* Sidebar Nav Items List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {[
            { id: "home", label: "Trang chủ", icon: "🏠" },
            { id: "insights", label: "Thông tin chi tiết", icon: "📈", hasSub: true },
            { id: "content", label: "Nội dung", icon: "📰", hasSub: true },
            { id: "monetization", label: "Kiếm tiền", icon: "👁️", hasSub: true },
            { id: "engagement", label: "Lượt tương tác", icon: "💬", hasSub: true },
            { id: "tools", label: "Tất cả công cụ", icon: "🧰" },
          ].map((item) => {
            const isActive = activeSideTab === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setActiveSideTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  background: isActive ? "var(--bg-hover)" : "transparent",
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "var(--primary)" : "var(--text-primary)",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 15 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: isActive ? "var(--primary)" : "var(--bg-secondary)",
                      color: isActive ? "#fff" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.hasSub && (
                  <span style={{ color: "var(--text-muted)", fontSize: 16 }}>❯</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Primary Action Button: Tạo bài viết */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-full"
          style={{
            padding: "14px 0",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(24,119,242,0.3)",
            marginTop: 20,
          }}
        >
          + Tạo bài viết
        </button>
      </div>

      {/* 2. CENTER MAIN DASHBOARD CONTENT */}
      <div style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          
          {/* Header Info Section */}
          <div className="card" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Thông tin chi tiết
                </h3>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Tìm hiểu hiệu quả của trang cá nhân và bài viết của bạn.
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <option value="28_days">28 ngày qua: 13 Tháng 7 - 9 Tháng 8</option>
                  <option value="7_days">7 ngày qua</option>
                  <option value="90_days">90 ngày qua</option>
                </select>

                <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}>
                  Xem tất cả
                </span>
              </div>
            </div>

            {/* Metrics Cards Horizontal Slider */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              {/* Card 1: Lượt xem */}
              <div
                onClick={() => setActiveMetric("views")}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: activeMetric === "views" ? "2px solid #1877f2" : "1px solid var(--border-light)",
                  background: activeMetric === "views" ? "rgba(24,119,242,0.04)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
                  <span>👁️</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{totalViews}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>↑ 167%</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                  Lượt xem bài viết ⓘ
                </div>
              </div>

              {/* Card 2: Lượt tương tác */}
              <div
                onClick={() => setActiveMetric("engagements")}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: activeMetric === "engagements" ? "2px solid #1877f2" : "1px solid var(--border-light)",
                  background: activeMetric === "engagements" ? "rgba(24,119,242,0.04)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
                  <span>💬</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{totalEngagements}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>↓ -100%</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                  Lượt tương tác ⓘ
                </div>
              </div>

              {/* Card 3: Người theo dõi */}
              <div
                onClick={() => setActiveMetric("followers")}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: activeMetric === "followers" ? "2px solid #1877f2" : "1px solid var(--border-light)",
                  background: activeMetric === "followers" ? "rgba(24,119,242,0.04)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
                  <span>👥</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>&gt; 5</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                  Số người theo dõi ⓘ
                </div>
              </div>
            </div>

            {/* Interactive Smooth Wave Line Chart (Chuẩn Facebook UI) */}
            <div style={{ position: "relative", height: 200, width: "100%", marginTop: 10 }}>
              <svg width="100%" height="100%" viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="facebookGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1877f2" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#1877f2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="0" y1="20" x2="700" y2="20" stroke="var(--border-light)" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="700" y2="80" stroke="var(--border-light)" strokeDasharray="3 3" />
                <line x1="0" y1="140" x2="700" y2="140" stroke="var(--border-light)" strokeDasharray="3 3" />

                {/* Y-axis values */}
                <text x="5" y="25" fill="var(--text-muted)" fontSize="11">10</text>
                <text x="5" y="85" fill="var(--text-muted)" fontSize="11">5</text>
                <text x="5" y="145" fill="var(--text-muted)" fontSize="11">0</text>

                {/* Wave Area Fill */}
                <path
                  d="M 30 140 L 90 120 L 150 140 L 210 125 L 270 135 L 330 140 L 390 128 L 450 140 L 510 125 L 570 140 L 630 20 L 670 138 L 670 140 L 30 140 Z"
                  fill="url(#facebookGradient)"
                />

                {/* Blue Line Curve */}
                <path
                  d="M 30 140 L 90 120 L 150 140 L 210 125 L 270 135 L 330 140 L 390 128 L 450 140 L 510 125 L 570 140 L 630 20 L 670 138"
                  fill="none"
                  stroke="#1877f2"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Peak Data Point Circle */}
                <circle cx="630" cy="20" r="5" fill="#1877f2" stroke="#fff" strokeWidth="2" />
              </svg>

              {/* X-axis Date Labels */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 10px", marginTop: 4, fontSize: 11.5, color: "var(--text-muted)" }}>
                <span>13 Tháng 7</span>
                <span>18 Tháng 7</span>
                <span>23 Tháng 7</span>
                <span>28 Tháng 7</span>
                <span>2 Tháng 8</span>
                <span>7 Tháng 8</span>
              </div>
            </div>
          </div>

          {/* Section: Nội dung bài viết */}
          <div className="card" style={{ padding: 24, borderRadius: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  Nội dung
                </h3>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Truy cập vào bài viết đã đăng và đã lên lịch cũng như tạo nội dung mới.
                </span>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--primary)", cursor: "pointer" }}>
                Xem tất cả
              </span>
            </div>

            {/* Latest Content Card Display */}
            {latestPost ? (
              <div
                style={{
                  background: "var(--bg-input)",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  border: "1px solid var(--border-light)",
                }}
              >
                {/* Media Thumbnail */}
                <div
                  style={{
                    width: 100,
                    height: 80,
                    borderRadius: 12,
                    background: latestPost.bgColor || "#232526",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {latestPost.thumbNail ? (
                    <img src={latestPost.thumbNail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#fff", fontSize: 12, fontWeight: 700, padding: 6, textAlign: "center" }}>
                      {latestPost.title?.slice(0, 30) || "Bài viết"}
                    </span>
                  )}
                </div>

                {/* Metrics Breakdown */}
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>📶 Số người tiếp cận</div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>1</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>💬 Lượt tương tác ⓘ</div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>18</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>👥 Lượt theo dõi ⓘ</div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>0</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)" }}>
                Chưa có bài viết nội dung nào.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR PROFILE STATUS & FEEDBACK */}
      <div
        style={{
          width: 320,
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flexShrink: 0,
        }}
      >
        {/* Profile Status Card */}
        <div className="card" style={{ padding: 20, borderRadius: 20 }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 16px 0", color: "var(--text-primary)" }}>
            Trạng thái trang cá nhân
          </h4>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  className="avatar"
                  style={{
                    width: 52,
                    height: 52,
                    fontSize: 18,
                    background: currentUser.avatarColor
                      ? `linear-gradient(135deg, ${currentUser.avatarColor}, ${currentUser.avatarColor}bb)`
                      : undefined,
                  }}
                >
                  {getInitials(currentUser.fullName || currentUser.username)}
                </div>
              )}
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#10b981",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                ✓
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                {currentUser.fullName || currentUser.username}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 }}>
                Tiến độ hàng tuần: <strong>0%</strong> ◯
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Contribution Box */}
        <div className="card" style={{ padding: 20, borderRadius: 20 }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px 0", color: "var(--text-primary)" }}>
            Đóng góp ý kiến
          </h4>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>💬</span>
            <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45 }}>
              Bạn muốn góp phần cải thiện bảng điều khiển? Chia sẻ với chúng tôi để giúp bạn hoàn thiện hơn.
            </span>
          </div>
          <button
            className="btn btn-secondary btn-full"
            style={{ borderRadius: 12, padding: "10px 0", fontWeight: 700, fontSize: 14 }}
          >
            Bắt đầu
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreatePostModal
          editPost={editPost}
          onClose={() => {
            setShowCreateModal(false);
            setEditPost(null);
            setSearchParams({});
            loadData();
          }}
          onCreated={() => {
            loadData();
          }}
        />
      )}

      {/* Confirm Modal khi Xóa bài viết */}
      <ConfirmModal
        isOpen={!!postToDelete}
        title="Xóa bài viết?"
        message="Bạn có chắc chắn muốn xóa bài viết này khỏi hệ thống?"
        confirmText="Xóa bài viết"
        confirmVariant="danger"
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Dashboard;
